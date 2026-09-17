'use strict';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const {
    NodeCache,
} = require('@cacheable/node-cache');

const express =
    require('express');

const pino =
    require('pino');

const QRCode =
    require('qrcode');

const fs =
    require('fs');

const fsp =
    require('fs/promises');

const path =
    require('path');


/*
|--------------------------------------------------------------------------
| BASIC CONFIGURATION
|--------------------------------------------------------------------------
*/

const PORT =
    Number(
        process.env.WHATSAPP_BOT_PORT ||
            3210,
    );

const HOST =
    process.env.WHATSAPP_BOT_HOST ||
        '127.0.0.1';

const ERP_BASE_URL =
    String(
        process.env.ERP_BASE_URL ||
            'http://127.0.0.1:8000',
    ).replace(
        /\/$/,
        '',
    );

const ERP_REQUEST_TIMEOUT_MS =
    Number(
        process.env.ERP_REQUEST_TIMEOUT_MS ||
            120000,
    );


/*
|--------------------------------------------------------------------------
| DIRECTORIES
|--------------------------------------------------------------------------
*/

const ROOT =
    __dirname;

const AUTH_DIR =
    path.join(
        ROOT,
        'auth',
    );

const DATA_DIR =
    path.join(
        ROOT,
        'data',
    );

const CONFIG_FILE =
    path.join(
        DATA_DIR,
        'config.json',
    );

const BOT_TOKEN_FILE =
    path.join(
        DATA_DIR,
        'bot-token.txt',
    );

const DOWNLOAD_DIR =
    path.join(
        DATA_DIR,
        'downloads',
    );

const RECENT_MESSAGES_FILE =
    path.join(
        DATA_DIR,
        'recent-messages.json',
    );


/*
|--------------------------------------------------------------------------
| EXPRESS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| EXPRESS
|--------------------------------------------------------------------------
*/

const app =
    express();

app.use(
    express.json({
        limit: '256kb',
    }),
);

/*
|--------------------------------------------------------------------------
| PLESK APPLICATION PREFIX
|--------------------------------------------------------------------------
|
| Plesk exposes this Node application at:
| https://erp.hbatravels.org/wa-service
|
| Express routes themselves are defined as:
| /status
| /groups
| /start
| /logout
| etc.
|
| Remove the /wa-service prefix before Express
| attempts to match the routes.
|--------------------------------------------------------------------------
*/

app.use(
    (req, res, next) => {
        const prefix =
            '/wa-service';

        if (
            req.url === prefix
        ) {
            req.url =
                '/';
        } else if (
            req.url.startsWith(
                `${prefix}/`,
            )
        ) {
            req.url =
                req.url.slice(
                    prefix.length,
                );
        }

        next();
    },
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    (
        req,
        res,
        next,
    ) => {
        const origin =
            req.headers.origin;

        const allowed =
            new Set([
                'http://127.0.0.1:8000',
                'http://localhost:8000',
                'http://127.0.0.1:5173',
                'http://localhost:5173',
            ]);

        if (
            origin &&
            allowed.has(origin)
        ) {
            res.setHeader(
                'Access-Control-Allow-Origin',
                origin,
            );

            res.setHeader(
                'Vary',
                'Origin',
            );
        }

        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        );

        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,POST,OPTIONS',
        );

        if (
            req.method ===
            'OPTIONS'
        ) {
            return res
                .status(204)
                .end();
        }

        return next();
    },
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    (
        req,
        res,
        next,
    ) => {
        const origin =
            req.headers.origin;

        const allowed =
            new Set([
                'http://127.0.0.1:8000',
                'http://localhost:8000',
                'http://127.0.0.1:5173',
                'http://localhost:5173',
            ]);

        if (
            origin &&
            allowed.has(origin)
        ) {
            res.setHeader(
                'Access-Control-Allow-Origin',
                origin,
            );

            res.setHeader(
                'Vary',
                'Origin',
            );
        }

        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        );

        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,POST,OPTIONS',
        );

        if (
            req.method ===
            'OPTIONS'
        ) {
            return res
                .status(204)
                .end();
        }

        return next();
    },
);


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let sock =
    null;

let authState =
    null;

let starting =
    false;

let stopRequested =
    false;

let connectionState =
    'disconnected';

let connectionMessage =
    'WhatsApp bot is not started.';

let qrDataUrl =
    null;

let groups =
    [];

let groupsLoadedAt =
    0;

let groupsRefreshPromise =
    null;

let reconnectTimer =
    null;

let lifecycleToken =
    0;


/*
|--------------------------------------------------------------------------
| GROUP METADATA CACHE
|--------------------------------------------------------------------------
*/

const groupMetadataCache =
    new Map();

const GROUP_METADATA_TTL =
    5 * 60 * 1000;


/*
|--------------------------------------------------------------------------
| RECENT OUTGOING MESSAGE STORE
|--------------------------------------------------------------------------
*/

const recentOutgoingMessages =
    new Map();

const RECENT_MESSAGE_TTL =
    30 * 60 * 1000;

const MAX_RECENT_MESSAGES =
    300;


/*
|--------------------------------------------------------------------------
| RETRY COUNTER CACHE
|--------------------------------------------------------------------------
|
| This is the pattern used by the current Baileys examples.
|--------------------------------------------------------------------------
*/

const msgRetryCounterCache =
    new NodeCache({
        stdTTL:
            5 * 60,
        checkperiod:
            60,
        useClones:
            false,
    });


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

function emptyConfig() {
    return {
        selectedGroupJid:
            null,

        selectedGroupName:
            null,

        updatedAt:
            null,
    };
}


function readConfig() {
    try {
        if (
            !fs.existsSync(
                CONFIG_FILE,
            )
        ) {
            return emptyConfig();
        }

        const parsed =
            JSON.parse(
                fs.readFileSync(
                    CONFIG_FILE,
                    'utf8',
                ),
            );

        return {
            ...emptyConfig(),

            ...(parsed &&
            typeof parsed ===
                'object'
                ? parsed
                : {}),
        };
    } catch (
        error
    ) {
        console.error(
            `[WhatsApp] Could not read config: ${error.message}`,
        );

        return emptyConfig();
    }
}


function writeConfig(
    value,
) {
    fs.mkdirSync(
        DATA_DIR,
        {
            recursive:
                true,
        },
    );

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
            value,
            null,
            2,
        ),
        'utf8',
    );
}


let config =
    readConfig();


/*
|--------------------------------------------------------------------------
| BOT TOKEN
|--------------------------------------------------------------------------
*/

function getBotToken() {
    const environmentToken =
        String(
            process.env
                .WHATSAPP_BOT_TOKEN ||
                '',
        ).trim();

    if (
        environmentToken
    ) {
        return environmentToken;
    }

    try {
        if (
            fs.existsSync(
                BOT_TOKEN_FILE,
            )
        ) {
            return fs
                .readFileSync(
                    BOT_TOKEN_FILE,
                    'utf8',
                )
                .trim();
        }
    } catch (
        error
    ) {
        console.warn(
            `[WhatsApp] Token file error: ${error.message}`,
        );
    }

    return '';
}


/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function publicStatus() {
    return {
        ok:
            true,

        service:
            'HBA ERP WhatsApp Bot',

        state:
            connectionState,

        connected:
            connectionState ===
            'connected',

        message:
            connectionMessage,

        qr:
            qrDataUrl,

        selectedGroup:
            config.selectedGroupJid
                ? {
                      jid:
                          config.selectedGroupJid,

                      name:
                          config.selectedGroupName ||
                          config.selectedGroupJid,
                  }
                : null,

        groupCount:
            groups.length,
    };
}


/*
|--------------------------------------------------------------------------
| RECENT MESSAGE PERSISTENCE
|--------------------------------------------------------------------------
*/

function rememberOutgoingMessage(
    sentMessage,
) {
    if (
        !sentMessage?.key?.id ||
        !sentMessage?.key
            ?.remoteJid ||
        !sentMessage?.message
    ) {
        return;
    }

    const id =
        sentMessage.key.id;

    const remoteJid =
        sentMessage.key.remoteJid;

    const key =
        `${remoteJid}:${id}`;

    recentOutgoingMessages.set(
        key,
        {
            message:
                sentMessage.message,

            createdAt:
                Date.now(),
        },
    );

    cleanupRecentMessages();

    persistRecentMessages();
}


function cleanupRecentMessages() {
    const now =
        Date.now();

    for (
        const [
            key,
            value,
        ] of recentOutgoingMessages
    ) {
        if (
            !value ||
            typeof value.createdAt !==
                'number' ||
            now -
                value.createdAt >
                RECENT_MESSAGE_TTL
        ) {
            recentOutgoingMessages.delete(
                key,
            );
        }
    }

    while (
        recentOutgoingMessages.size >
        MAX_RECENT_MESSAGES
    ) {
        const first =
            recentOutgoingMessages
                .keys()
                .next()
                .value;

        if (
            first
        ) {
            recentOutgoingMessages.delete(
                first,
            );
        } else {
            break;
        }
    }
}


function persistRecentMessages() {
    try {
        fs.mkdirSync(
            DATA_DIR,
            {
                recursive:
                    true,
            },
        );

        fs.writeFileSync(
            RECENT_MESSAGES_FILE,
            JSON.stringify(
                Object.fromEntries(
                    recentOutgoingMessages,
                ),
            ),
            'utf8',
        );
    } catch (
        error
    ) {
        console.warn(
            `[WhatsApp] Could not persist recent messages: ${error.message}`,
        );
    }
}


function loadRecentMessages() {
    try {
        if (
            !fs.existsSync(
                RECENT_MESSAGES_FILE,
            )
        ) {
            return;
        }

        const data =
            JSON.parse(
                fs.readFileSync(
                    RECENT_MESSAGES_FILE,
                    'utf8',
                ),
            );

        if (
            !data ||
            typeof data !==
                'object'
        ) {
            return;
        }

        const now =
            Date.now();

        for (
            const [
                key,
                value,
            ] of Object.entries(
                data,
            )
        ) {
            if (
                !value ||
                !value.message ||
                typeof value.createdAt !==
                    'number'
            ) {
                continue;
            }

            if (
                now -
                    value.createdAt >
                RECENT_MESSAGE_TTL
            ) {
                continue;
            }

            recentOutgoingMessages.set(
                key,
                value,
            );
        }

        cleanupRecentMessages();
    } catch (
        error
    ) {
        console.warn(
            `[WhatsApp] Could not load recent messages: ${error.message}`,
        );
    }
}


async function getRecentOutgoingMessage(
    key,
) {
    if (
        !key?.id
    ) {
        return undefined;
    }

    const mapKey =
        `${String(
            key.remoteJid ||
                '',
        )}:${key.id}`;

    const value =
        recentOutgoingMessages.get(
            mapKey,
        );

    if (
        !value
    ) {
        return undefined;
    }

    if (
        Date.now() -
            value.createdAt >
        RECENT_MESSAGE_TTL
    ) {
        recentOutgoingMessages.delete(
            mapKey,
        );

        persistRecentMessages();

        return undefined;
    }

    return value.message;
}


loadRecentMessages();


/*
|--------------------------------------------------------------------------
| GROUP HELPERS
|--------------------------------------------------------------------------
*/

function normalizeGroup(
    group,
) {
    return {
        jid:
            String(
                group?.id ||
                    '',
            ).trim(),

        name:
            String(
                group?.subject ||
                    'Unnamed Group',
            ).trim() ||
            'Unnamed Group',

        participants:
            Array.isArray(
                group?.participants,
            )
                ? group.participants
                      .length
                : 0,
    };
}


function storeGroupMetadata(
    jid,
    metadata,
) {
    if (
        !jid ||
        !metadata
    ) {
        return;
    }

    if (
        !Array.isArray(
            metadata.participants,
        )
    ) {
        return;
    }

    groupMetadataCache.set(
        jid,
        {
            metadata,

            createdAt:
                Date.now(),
        },
    );
}


function getCachedGroupMetadata(
    jid,
) {
    const item =
        groupMetadataCache.get(
            jid,
        );

    if (
        !item
    ) {
        return undefined;
    }

    if (
        Date.now() -
            item.createdAt >
        GROUP_METADATA_TTL
    ) {
        groupMetadataCache.delete(
            jid,
        );

        return undefined;
    }

    return item.metadata;
}


/*
|--------------------------------------------------------------------------
| BULK GROUP LOAD
|--------------------------------------------------------------------------
|
| No per-group metadata storm.
|
*/

async function refreshGroups(
    force = false,
) {
    if (
        !sock ||
        connectionState !==
            'connected'
    ) {
        return groups;
    }

    if (
        !force &&
        groups.length > 0 &&
        Date.now() -
            groupsLoadedAt <
        30000
    ) {
        return groups;
    }

    if (
        groupsRefreshPromise
    ) {
        return groupsRefreshPromise;
    }

    groupsRefreshPromise =
        (async () => {
            console.log(
                '[WhatsApp] Loading groups using one bulk query…',
            );

            const participating =
                await sock.groupFetchAllParticipating();

            const result =
                [];

            for (
                const group of
                    Object.values(
                        participating ||
                            {},
                    )
            ) {
                const normalized =
                    normalizeGroup(
                        group,
                    );

                if (
                    !normalized.jid.endsWith(
                        '@g.us',
                    )
                ) {
                    continue;
                }

                result.push(
                    normalized,
                );

                /*
                 * Baileys has already given us the participant
                 * list in the bulk response.
                 *
                 * Keep it. Do not call groupMetadata().
                 */
                storeGroupMetadata(
                    normalized.jid,
                    group,
                );
            }

            result.sort(
                (
                    a,
                    b,
                ) =>
                    a.name.localeCompare(
                        b.name,
                    ),
            );

            groups =
                result;

            groupsLoadedAt =
                Date.now();

            if (
                config.selectedGroupJid
            ) {
                const selected =
                    groups.find(
                        (
                            item,
                        ) =>
                            item.jid ===
                            config.selectedGroupJid,
                    );

                if (
                    selected
                ) {
                    config.selectedGroupName =
                        selected.name;

                    writeConfig(
                        config,
                    );
                }
            }

            console.log(
                `[WhatsApp] Loaded ${groups.length} groups with zero per-group metadata requests.`,
            );

            return groups;
        })();

    try {
        return await groupsRefreshPromise;
    } finally {
        groupsRefreshPromise =
            null;
    }
}


/*
|--------------------------------------------------------------------------
| SELECTED GROUP METADATA
|--------------------------------------------------------------------------
*/

async function ensureSelectedGroupMetadata(
    force = false,
) {
    const jid =
        config.selectedGroupJid;

    if (
        !jid ||
        !sock ||
        connectionState !==
            'connected'
    ) {
        return undefined;
    }

    const cached =
        getCachedGroupMetadata(
            jid,
        );

    if (
        cached &&
        !force
    ) {
        return cached;
    }

    try {
        console.log(
            `[WhatsApp] Refreshing metadata for selected group only: ${jid}`,
        );

        const metadata =
            await sock.groupMetadata(
                jid,
            );

        storeGroupMetadata(
            jid,
            metadata,
        );

        return metadata;
    } catch (
        error
    ) {
        console.warn(
            `[WhatsApp] Selected group metadata refresh failed: ${error.message}`,
        );

        return cached;
    }
}


/*
|--------------------------------------------------------------------------
| SENDER KEY RESET
|--------------------------------------------------------------------------
*/

async function resetSelectedGroupSenderKey(
    jid,
) {
    if (
        !authState?.keys ||
        !jid ||
        !jid.endsWith(
            '@g.us',
        )
    ) {
        return;
    }

    try {
        await authState.keys.set({
            'sender-key-memory':
                {
                    [jid]:
                        null,
                },
        });

        console.log(
            `[WhatsApp] Reset sender-key-memory for ${jid}`,
        );
    } catch (
        error
    ) {
        console.warn(
            `[WhatsApp] Sender-key reset failed: ${error.message}`,
        );
    }
}


/*
|--------------------------------------------------------------------------
| PDF COMMAND
|--------------------------------------------------------------------------
*/

function parsePdfCommand(
    text,
) {
    const lines =
        String(text || '')
            .replace(
                /\r/g,
                '',
            )
            .split('\n')
            .map(
                (
                    line,
                ) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length !==
        3
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'PDF'
    ) {
        return null;
    }

    const type =
        lines[1].toUpperCase();

    if (
        type !==
            'INV' &&
        type !==
            'VOU'
    ) {
        return null;
    }

    const reference =
        lines[2];

    if (
        !/^\d+$/.test(
            reference,
        )
    ) {
        return null;
    }

    return {
        type,
        reference,
    };
}

/*
|--------------------------------------------------------------------------
| LEDGER PDF COMMAND
|--------------------------------------------------------------------------
|
| Supported:
|
| PDF
| STA
| 052
| 01JUN26
| 30JUN26
|
| PDF
| STA
| 052
| 01JUN26
| 30JUN26
| SAR
|
| PDF
| STA
| 052
| 01JUN26
| 30JUN26
| COM
|
| PDF
| STA
| 052
| 01JUN26
| 30JUN26
| SAR
| COM
|--------------------------------------------------------------------------
*/

const LEDGER_MONTHS = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
};

function parseLedgerDate(value) {
    const normalized = String(value || '')
        .trim()
        .toUpperCase();

    const match = normalized.match(
        /^(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/,
    );

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const monthText = match[2];
    const year = 2000 + Number(match[3]);
    const month = LEDGER_MONTHS[monthText];

    const date = new Date(
        year,
        month,
        day,
    );

    /*
     * Reject impossible dates such as:
     * 31JUN26
     * 32JAN26
     */
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseLedgerPdfCommand(text) {
    const lines = String(text || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (
        lines.length < 5 ||
        lines.length > 7
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !== 'PDF'
    ) {
        return null;
    }

    if (
        lines[1].toUpperCase() !== 'STA'
    ) {
        return null;
    }

    /*
     * Only the last 3 digits of the account code are accepted.
     */
    const accountSuffix = lines[2].trim();

    if (!/^\d{3}$/.test(accountSuffix)) {
        return null;
    }

    const dateFrom = parseLedgerDate(lines[3]);
    const dateTo = parseLedgerDate(lines[4]);

    if (!dateFrom || !dateTo) {
        return null;
    }

    if (dateFrom > dateTo) {
        return null;
    }

    const options = lines
        .slice(5)
        .map((line) => line.toUpperCase());

    let currencyCode = null;
    let combineInvoices = false;

    /*
     * Exact supported combinations:
     *
     * nothing
     * SAR
     * COM
     * SAR + COM
     */
    if (options.length === 0) {
        // Detailed base ledger.
    } else if (
        options.length === 1 &&
        options[0] === 'SAR'
    ) {
        currencyCode = 'SAR';
    } else if (
        options.length === 1 &&
        options[0] === 'COM'
    ) {
        combineInvoices = true;
    } else if (
        options.length === 2 &&
        options[0] === 'SAR' &&
        options[1] === 'COM'
    ) {
        currencyCode = 'SAR';
        combineInvoices = true;
    } else {
        return null;
    }

    return {
        type: 'STA',
        accountSuffix,
        dateFrom,
        dateTo,
        currencyCode,
        combineInvoices,
    };
}

/*
|--------------------------------------------------------------------------
| ARRIVAL / TRANSPORT REPORT PDF COMMAND
|--------------------------------------------------------------------------
|
| ARRIVAL:
|
| PDF
| ARR
| 27JUN26
|
| PDF
| ARR
| 27JUN26
| 29JUN26
|
| TRANSPORT:
|
| PDF
| TRA
| 27JUN26
|
| PDF
| TRA
| 27JUN26
| 29JUN26
|--------------------------------------------------------------------------
*/

function parseOtherReportPdfCommand(text) {
    const lines =
        String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

    /*
     * Exactly 3 lines:
     *
     * PDF
     * ARR
     * 27JUN26
     *
     * or exactly 4 lines for a date range.
     */
    if (
        lines.length !== 3 &&
        lines.length !== 4
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !== 'PDF'
    ) {
        return null;
    }

    const reportType =
        lines[1].toUpperCase();

    if (
        reportType !== 'ARR' &&
        reportType !== 'TRA'
    ) {
        return null;
    }

    const dateFrom =
        parseLedgerDate(
            lines[2],
        );

    if (!dateFrom) {
        return null;
    }

    /*
     * One date means:
     *
     * from = same date
     * to   = same date
     */
    let dateTo =
        dateFrom;

    if (
        lines.length === 4
    ) {
        dateTo =
            parseLedgerDate(
                lines[3],
            );

        if (!dateTo) {
            return null;
        }
    }

    if (
        dateFrom > dateTo
    ) {
        return null;
    }

    return {
        type: reportType,
        dateFrom,
        dateTo,
    };
}

function extractMessageText(
    message,
) {
    if (
        !message?.message
    ) {
        return '';
    }

    return String(
        message.message
            .conversation ||
            message.message
                .extendedTextMessage
                ?.text ||
            message.message
                .imageMessage
                ?.caption ||
            message.message
                .videoMessage
                ?.caption ||
            '',
    ).trim();
}


/*
|--------------------------------------------------------------------------
| ERP PDF
|--------------------------------------------------------------------------
*/

async function fetchDocumentPdf(
    type,
    reference,
) {
    const token =
        getBotToken();

    if (
        !token
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const endpoint =
        type ===
            'INV'
            ? `/api/whatsapp-bot/documents/invoice/${encodeURIComponent(
                  reference,
              )}/pdf`
            : `/api/whatsapp-bot/documents/voucher/${encodeURIComponent(
                  reference,
              )}/pdf`;

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}${endpoint}`,
                {
                    method:
                        'GET',

                    headers: {
                        Accept:
                            'application/pdf',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    signal:
                        controller.signal,
                },
            );

        const contentType =
            String(
                response.headers.get(
                    'content-type',
                ) || '',
            ).toLowerCase();

        const buffer =
            Buffer.from(
                await response.arrayBuffer(),
            );

        if (
            !response.ok
        ) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            if (
                !contentType.includes(
                    'application/pdf',
                )
            ) {
                const body =
                    buffer
                        .toString(
                            'utf8',
                        )
                        .replace(
                            /\s+/g,
                            ' ',
                        )
                        .trim()
                        .slice(
                            0,
                            1000,
                        );

                if (
                    body
                ) {
                    detail +=
                        `: ${body}`;
                }
            }

            throw new Error(
                detail,
            );
        }

        if (
            !contentType.includes(
                'application/pdf',
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType ||
                    'unknown'
                }`,
            );
        }

        if (
            buffer.length ===
            0
        ) {
            throw new Error(
                'ERP returned an empty PDF.',
            );
        }

        return buffer;
    } finally {
        clearTimeout(
            timeout,
        );
    }
}

/*
|--------------------------------------------------------------------------
| ERP LEDGER PDF
|--------------------------------------------------------------------------
*/

async function fetchLedgerPdf(command) {
    const token = getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const params = new URLSearchParams();

    params.set(
        'account_suffix',
        command.accountSuffix,
    );

    params.set(
        'date_from',
        command.dateFrom,
    );

    params.set(
        'date_to',
        command.dateTo,
    );

    if (
        command.currencyCode
    ) {
        params.set(
            'currency_code',
            command.currencyCode,
        );
    }

    if (
        command.combineInvoices
    ) {
        params.set(
            'combine_invoices',
            '1',
        );
    }

    const endpoint =
        `/api/whatsapp-bot/documents/ledger/pdf?${params.toString()}`;

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}${endpoint}`,
                {
                    method: 'GET',

                    headers: {
                        Accept:
                            'application/pdf',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    signal:
                        controller.signal,
                },
            );

        const contentType =
            String(
                response.headers.get(
                    'content-type',
                ) || '',
            ).toLowerCase();

        const buffer =
            Buffer.from(
                await response.arrayBuffer(),
            );

        if (!response.ok) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            if (
                !contentType.includes(
                    'application/pdf',
                )
            ) {
                const body =
                    buffer
                        .toString('utf8')
                        .replace(
                            /\s+/g,
                            ' ',
                        )
                        .trim()
                        .slice(
                            0,
                            1000,
                        );

                if (body) {
                    detail +=
                        `: ${body}`;
                }
            }

            throw new Error(
                detail,
            );
        }

        if (
            !contentType.includes(
                'application/pdf',
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType || 'unknown'
                }`,
            );
        }

        if (
            buffer.length === 0
        ) {
            throw new Error(
                'ERP returned an empty ledger PDF.',
            );
        }

        return buffer;
    } finally {
        clearTimeout(timeout);
    }
}


/*
|--------------------------------------------------------------------------
| ERP OTHER REPORT PDF
|--------------------------------------------------------------------------
*/

async function fetchOtherReportPdf(
    command,
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const params =
        new URLSearchParams();

    params.set(
        'report_type',
        command.type,
    );

    params.set(
        'date_from',
        command.dateFrom,
    );

    params.set(
        'date_to',
        command.dateTo,
    );

    const endpoint =
        `/api/whatsapp-bot/documents/other-report/pdf?${params.toString()}`;

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}${endpoint}`,
                {
                    method:
                        'GET',

                    headers: {
                        Accept:
                            'application/pdf',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    signal:
                        controller.signal,
                },
            );

        const contentType =
            String(
                response.headers.get(
                    'content-type',
                ) || '',
            ).toLowerCase();

        const buffer =
            Buffer.from(
                await response.arrayBuffer(),
            );

        if (
            !response.ok
        ) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            if (
                !contentType.includes(
                    'application/pdf',
                )
            ) {
                const body =
                    buffer
                        .toString('utf8')
                        .replace(
                            /\s+/g,
                            ' ',
                        )
                        .trim()
                        .slice(
                            0,
                            1000,
                        );

                if (body) {
                    detail +=
                        `: ${body}`;
                }
            }

            throw new Error(
                detail,
            );
        }

        if (
            !contentType.includes(
                'application/pdf',
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType || 'unknown'
                }`,
            );
        }

        if (
            buffer.length === 0
        ) {
            throw new Error(
                'ERP returned an empty report PDF.',
            );
        }

        return buffer;
    } finally {
        clearTimeout(
            timeout,
        );
    }
}


/*
|--------------------------------------------------------------------------
| ERP NEW VOUCHER
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| ERP NEW HOTEL INVOICE
|--------------------------------------------------------------------------
*/

async function createHotelInvoiceFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (
        !token
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        client_suffix:
            command.clientSuffix,

        passenger_name:
            command.passengerName,

        hotel_name:
            command.hotelName,

        room_type:
            command.roomType,

        meal:
            command.meal,

        check_in:
            command.checkIn,

        check_out:
            command.checkOut,

        nights:
            command.nights,

        room_quantity:
            command.roomQuantity,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_rate:
            command.vendorRate,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/create`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            const bodyText =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1200
                    );

            if (
                bodyText
            ) {
                detail +=
                    `: ${bodyText}`;
            }

            throw new Error(
                detail
            );
        }

        const contentType =
            String(
                response.headers.get(
                    'content-type'
                ) || ''
            ).toLowerCase();

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType ||
                    'unknown'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid Hotel invoice response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| ERP NEW VISA INVOICE
|--------------------------------------------------------------------------
*/

async function createVisaInvoiceFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (
        !token
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        client_suffix:
            command.clientSuffix,

        passenger_name:
            command.passengerName,

        passport_no:
            command.passportNo,

        visa_type:
            command.visaType,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_amount:
            command.vendorAmount,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/visa/create`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            const detail =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1200
                    );

            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    detail ||
                    'Unknown error'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid Visa invoice response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| ERP ADD VISA LINE
|--------------------------------------------------------------------------
*/

async function addVisaInvoiceLineFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (
        !token
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        passenger_name:
            command.passengerName,

        passport_no:
            command.passportNo,

        visa_type:
            command.visaType,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_amount:
            command.vendorAmount,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/${encodeURIComponent(
                    command.invoiceReference
                )}/visa/add`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            const detail =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1200
                    );

            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    detail ||
                    'Unknown error'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid Visa invoice update response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| SEND NEW VISA INVOICE
|--------------------------------------------------------------------------
*/

async function sendNewVisaInvoice({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Creating Visa invoice for client ${command.clientSuffix}`
    );

    const currencyLabel = command.currencyCode || 'BASE';

    const result =
        await createVisaInvoiceFromWhatsApp(
            command
        );

    const invoice =
        result.invoice;

    const sellingBase =
        Number(
            invoice.receivable_base ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    const vendorBase =
        Number(
            invoice.vendor_base ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    const profitBase =
        Number(
            invoice.profit_base ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Visa Invoice created successfully.',
                    '',
                    `Invoice #${invoice.invoice_number}`,
                    `Client: ${invoice.client_code} — ${invoice.client_name}`,
                    '',
                    `Passenger: ${invoice.passenger_name}`,
                    `Passport: ${invoice.passport_no}`,
                    `Visa Type: ${invoice.visa_type}`,
                    `Rate/Transfer: ${command.rate} ${currencyLabel}`,
                    `Vendor: ${invoice.vendor_code}`,
                    `Vendor Amount: ${command.vendorAmount} ${currencyLabel}`,
                    `ROE: ${command.currencyRate ?? '-'}`,
                    '',
                    `Selling Total (Base): ${sellingBase}`,
                    `Vendor Total (Base): ${vendorBase}`,
                    `Profit (Base): ${profitBase}`,
                    'Quantity: 1',
                    'Commission: 0',
                ].join(
                    '\n'
                ),
        }
    );
}


/*
|--------------------------------------------------------------------------
| SEND ADD VISA LINE
|--------------------------------------------------------------------------
*/

async function sendAddVisaInvoiceLine({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Adding Visa line to Invoice ${command.invoiceReference}`
    );

    const currencyLabel = command.currencyCode || 'BASE';

    const result =
        await addVisaInvoiceLineFromWhatsApp(
            command
        );

    const invoice =
        result.invoice;

    const total =
        Number(
            invoice.total_receivable ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Visa line added successfully.',
                    '',
                    `Invoice #${invoice.invoice_number}`,
                    `Client: ${invoice.client_code} — ${invoice.client_name}`,
                    '',
                    `Passenger: ${command.passengerName}`,
                    `Passport: ${command.passportNo}`,
                    `Visa Type: ${command.visaType}`,
                    `Rate/Transfer: ${command.rate} ${currencyLabel}`,
                    `Vendor: ${command.vendorSuffix}`,
                    `Vendor Amount: ${command.vendorAmount} ${currencyLabel}`,
                    `ROE: ${command.currencyRate ?? '-'}`,
                    '',
                    `Invoice Total (Base): ${total}`,
                    `Total Lines: ${invoice.line_count}`,
                ].join(
                    '\n'
                ),
        }
    );
}

/*
|--------------------------------------------------------------------------
| SEND NEW HOTEL INVOICE
|--------------------------------------------------------------------------
*/

async function sendNewHotelInvoice({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Creating Hotel invoice for client ${command.clientSuffix}: ${command.hotelName}`
    );

    const result =
        await createHotelInvoiceFromWhatsApp(
            command
        );

    const invoice =
        result.invoice;

    const selling =
        Number(
            invoice.selling_total ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    const payable =
        Number(
            invoice.vendor_total ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    const profit =
        (
            Number(
                invoice.selling_total ||
                0
            ) -
            Number(
                invoice.vendor_total ||
                0
            )
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    const lines = [
        '✅ Hotel Invoice created successfully.',
        '',
        `Invoice #${invoice.invoice_number}`,
        `Client: ${invoice.client_code} — ${invoice.client_name}`,
        '',
        `Passenger: ${invoice.passenger_name}`,
        `Hotel: ${invoice.hotel_name}`,
        `Room: ${command.roomType}`,
        `Meal: ${command.meal}`,
        `Check-in: ${invoice.check_in}`,
        `Check-out: ${invoice.check_out}`,
        `Nights: ${invoice.nights}`,
        `Rooms: ${invoice.room_quantity}`,
        '',
        `Rate/Night: ${invoice.rate}`,
        `Vendor: ${command.vendorSuffix}`,
        `Buy Rate/Night: ${invoice.vendor_rate}`,
    ];

    if (
        invoice.currency_code
    ) {
        lines.push(
            `Currency: ${invoice.currency_code}`,
            `ROE: ${invoice.currency_rate}`
        );
    } else {
        lines.push(
            'Currency: Base'
        );
    }

    lines.push(
        '',
        `Selling Total: ${selling}`,
        `Vendor Total: ${payable}`,
        `Profit: ${profit}`,
        '',
        'Commission: 0'
    );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                lines.join(
                    '\n'
                ),
        }
    );

    console.log(
        `[WHATSAPP] Created Hotel Invoice #${invoice.invoice_number} for ${remoteJid}`
    );
}

/*
|--------------------------------------------------------------------------
| ERP ADD HOTEL LINE
|--------------------------------------------------------------------------
*/

async function addHotelInvoiceLineFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (
        !token
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        passenger_name:
            command.passengerName,

        hotel_name:
            command.hotelName,

        room_type:
            command.roomType,

        meal:
            command.meal,

        check_in:
            command.checkIn,

        check_out:
            command.checkOut,

        nights:
            command.nights,

        room_quantity:
            command.roomQuantity,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_rate:
            command.vendorRate,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/${encodeURIComponent(
                    command.invoiceReference
                )}/hotel/add`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            const detail =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1200
                    );

            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    detail ||
                    'Unknown error'
                }`
            );
        }

        const contentType =
            String(
                response.headers.get(
                    'content-type'
                ) || ''
            ).toLowerCase();

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType ||
                    'unknown'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid invoice update response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| SEND ADD HOTEL LINE CONFIRMATION
|--------------------------------------------------------------------------
*/

async function sendAddHotelInvoiceLine({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Adding Hotel line to Invoice ${command.invoiceReference}`
    );

    const result =
        await addHotelInvoiceLineFromWhatsApp(
            command
        );

    const invoice =
        result.invoice;

    const totalReceivable =
        Number(
            invoice.total_receivable ||
            0
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            }
        );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Hotel line added successfully.',
                    '',
                    `Invoice #${invoice.invoice_number}`,
                    `Client: ${invoice.client_code} — ${invoice.client_name}`,
                    '',
                    `Passenger: ${command.passengerName}`,
                    `Hotel: ${command.hotelName}`,
                    `Room: ${command.roomType}`,
                    `Meal: ${command.meal}`,
                    `Check-in: ${command.checkIn}`,
                    `Check-out: ${command.checkOut}`,
                    `Nights: ${command.nights}`,
                    `Rooms: ${command.roomQuantity}`,
                    `Rate/Night: ${command.rate}`,
                    `Vendor: ${command.vendorSuffix}`,
                    `Buy Rate/Night: ${command.vendorRate}`,
                    `Currency: SAR`,
                    `ROE: ${command.currencyRate}`,
                    '',
                    `Invoice Total: ${totalReceivable}`,
                    `Total Lines: ${invoice.line_count}`,
                ].join(
                    '\n'
                ),
        }
    );
}


async function createVoucherFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        voucher_type:
            command.voucherType,

        cash_bank_suffix:
            command.cashBankSuffix,

        party_type:
            command.partyType,

        party_suffix:
            command.partySuffix,

        invoice_reference:
            command.invoiceReference,

        currency_code:
            command.currencyCode,

        amount:
            command.baseAmount,

        currency_quantity:
            command.currencyQuantity,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/voucher/create`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const contentType =
            String(
                response.headers.get(
                    'content-type'
                ) || ''
            ).toLowerCase();

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            const bodyText =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1000
                    );

            if (bodyText) {
                detail +=
                    `: ${bodyText}`;
            }

            throw new Error(
                detail
            );
        }

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType ||
                    'unknown'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.voucher
        ) {
            throw new Error(
                'ERP did not return a valid voucher creation response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| ERP NEW JOURNAL VOUCHER
|--------------------------------------------------------------------------
*/

async function createJournalVoucherFromWhatsApp(
    command
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.'
        );
    }

    const payload = {
        lines:
            command.lines.map(
                (line) => ({
                    account_alias:
                        line.accountAlias,

                    account_suffix:
                        line.accountSuffix,

                    side:
                        line.side,

                    amount:
                        line.amount,

                    currency_code:
                        line.currencyCode,

                    currency_quantity:
                        line.currencyQuantity,

                    currency_rate:
                        line.currencyRate,

                    invoice_reference:
                        line.invoiceReference,
                })
            ),
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/journal-voucher/create`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal,
                }
            );

        const contentType =
            String(
                response.headers.get(
                    'content-type'
                ) || ''
            ).toLowerCase();

        const body =
            Buffer.from(
                await response.arrayBuffer()
            );

        if (
            !response.ok
        ) {
            let detail =
                `ERP returned HTTP ${response.status}`;

            const bodyText =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
                    .slice(
                        0,
                        1000
                    );

            if (bodyText) {
                detail +=
                    `: ${bodyText}`;
            }

            throw new Error(
                detail
            );
        }

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            throw new Error(
                `ERP returned unexpected content type: ${
                    contentType ||
                    'unknown'
                }`
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8'
                )
            );

        if (
            !result?.ok ||
            !result?.voucher
        ) {
            throw new Error(
                'ERP did not return a valid Journal Voucher creation response.'
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout
        );
    }
}

/*
|--------------------------------------------------------------------------
| PDF SEND
|--------------------------------------------------------------------------
*/

function safePdfFileName(
    type,
    reference,
) {
    const prefix =
        type ===
            'INV'
            ? 'Invoice'
            : 'Voucher';

    const stamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                '-',
            )
            .replace(
                'T',
                '_',
            )
            .replace(
                'Z',
                '',
            );

    return `${prefix}-${reference}-${stamp}.pdf`;
}


async function sendPdf({
    remoteJid,
    type,
    reference,
}) {
    await fsp.mkdir(
        DOWNLOAD_DIR,
        {
            recursive:
                true,
        },
    );

    const fileName =
        safePdfFileName(
            type,
            reference,
        );

    const filePath =
        path.join(
            DOWNLOAD_DIR,
            fileName,
        );

    try {
        console.log(
            `[WHATSAPP] Preparing ${type} PDF ${reference}`,
        );

        /*
         * Get selected-group metadata only if our cache is missing.
         */
        await ensureSelectedGroupMetadata(
            false,
        );

        const pdfBuffer =
            await fetchDocumentPdf(
                type,
                reference,
            );

        await fsp.writeFile(
            filePath,
            pdfBuffer,
        );

        console.log(
            `[WHATSAPP] PDF downloaded locally: ${filePath} (${pdfBuffer.length} bytes)`,
        );

        if (
            !sock ||
            connectionState !==
                'connected'
        ) {
            throw new Error(
                'WhatsApp is no longer connected.',
            );
        }

        /*
         * Fresh sender-key distribution for this group.
         */
        await resetSelectedGroupSenderKey(
            remoteJid,
        );

        /*
         * Give Baileys the latest group metadata from our cache.
         */
        const metadata =
            getCachedGroupMetadata(
                remoteJid,
            );

        if (
            !metadata
        ) {
            await ensureSelectedGroupMetadata(
                true,
            );
        }

        /*
         * Force current recipient-device discovery.
         *
         * Most important for LID / companion devices.
         */
        const sent =
            await sock.sendMessage(
                remoteJid,
                {
                    document:
                        {
                            url:
                                filePath,
                        },

                    mimetype:
                        'application/pdf',

                    fileName,

                    caption:
                        type ===
                            'INV'
                            ? `Invoice ${reference}`
                            : `Voucher ${reference}`,
                },
                {
                    useUserDevicesCache:
                        false,

                    useCachedGroupMetadata:
                        true,

                    mediaUploadTimeoutMs:
                        120000,
                },
            );

        rememberOutgoingMessage(
            sent,
        );

        console.log(
            `[WHATSAPP] Sent ${type} PDF ${reference} to ${remoteJid} messageId=${
                sent?.key
                    ?.id ||
                'unknown'
            }`,
        );
    } finally {
        try {
            await fsp.rm(
                filePath,
                {
                    force:
                        true,
                },
            );

            console.log(
                `[WHATSAPP] Deleted temporary PDF: ${filePath}`,
            );
        } catch (
            error
        ) {
            console.warn(
                `[WhatsApp] PDF cleanup failed: ${error.message}`,
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| LEDGER PDF SEND
|--------------------------------------------------------------------------
*/

function safeLedgerPdfFileName(command) {
    const currencyPart =
        command.currencyCode
            ? `-${command.currencyCode}`
            : '-BASE';

    const combinedPart =
        command.combineInvoices
            ? '-COM'
            : '-DET';

    const stamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                '-',
            )
            .replace(
                'T',
                '_',
            )
            .replace(
                'Z',
                '',
            );

    return (
        `Ledger-${command.accountSuffix}` +
        `-${command.dateFrom}` +
        `-to-${command.dateTo}` +
        `${currencyPart}` +
        `${combinedPart}` +
        `-${stamp}.pdf`
    );
}

/*
|--------------------------------------------------------------------------
| NEW TRANSFER INVOICE
|--------------------------------------------------------------------------
|
| NEW
| INV
| 052
| TRA
| PASSENGER NAME
| TO
| FROM
| VEHICLE
| 22SEP26
| FLIGHT INFO
| 450
| 032
| 400
| SAR
| 76.5
|--------------------------------------------------------------------------
*/

function parseNewTransferInvoiceCommand(
    text,
) {
    const lines =
        String(
            text || '',
        )
            .replace(
                /\r/g,
                '',
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length !== 13 &&
        lines.length !== 15
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'NEW'
    ) {
        return null;
    }

    if (
        lines[1].toUpperCase() !==
        'INV'
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            lines[2],
        )
    ) {
        return null;
    }

    if (
        lines[3].toUpperCase() !==
        'TRA'
    ) {
        return null;
    }

    const passengerName =
        lines[4];

    const to =
        lines[5];

    const from =
        lines[6];

    const vehicle =
        lines[7];

    const transferDate =
        parseLedgerDate(
            lines[8],
        );

    const flightInfo =
        lines[9];

    const rate =
        Number(
            lines[10],
        );

    const vendorSuffix =
        lines[11];

    const vendorAmount =
        Number(
            lines[12],
        );

    if (
        !passengerName ||
        !to ||
        !from ||
        !vehicle ||
        !transferDate
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            rate,
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix,
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorAmount,
        ) ||
        vendorAmount < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        lines.length === 15
    ) {
        if (
            lines[13].toUpperCase() !==
            'SAR'
        ) {
            return null;
        }

        const roe =
            Number(
                lines[14],
            );

        if (
            !Number.isFinite(
                roe,
            ) ||
            roe <= 0
        ) {
            return null;
        }

        currencyCode =
            'SAR';

        currencyRate =
            roe;
    }

    return {
        clientSuffix:
            lines[2],

        passengerName,

        to,

        from,

        vehicle,

        transferDate,

        flightInfo,

        rate,

        vendorSuffix,

        vendorAmount,

        currencyCode,

        currencyRate,
    };
}


/*
|--------------------------------------------------------------------------
| ADD TRANSFER LINE
|--------------------------------------------------------------------------
|
| ADD
| 2379
| TRA
| PASSENGER NAME
| TO
| FROM
| VEHICLE
| 22SEP26
| FLIGHT INFO
| 450
| 032
| 400
| SAR
| 76.5
|--------------------------------------------------------------------------
*/

function parseAddTransferInvoiceCommand(
    text,
) {
    const lines =
        String(
            text || '',
        )
            .replace(
                /\r/g,
                '',
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length !== 12 &&
        lines.length !== 14
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'ADD'
    ) {
        return null;
    }

    let invoiceReference =
        lines[1];

    if (
        /^INV#\d+$/i.test(
            invoiceReference,
        )
    ) {
        invoiceReference =
            invoiceReference
                .substring(4)
                .trim();
    }

    if (
        !/^\d+$/.test(
            invoiceReference,
        )
    ) {
        return null;
    }

    if (
        lines[2].toUpperCase() !==
        'TRA'
    ) {
        return null;
    }

    const passengerName =
        lines[3];

    const to =
        lines[4];

    const from =
        lines[5];

    const vehicle =
        lines[6];

    const transferDate =
        parseLedgerDate(
            lines[7],
        );

    const flightInfo =
        lines[8];

    const rate =
        Number(
            lines[9],
        );

    const vendorSuffix =
        lines[10];

    const vendorAmount =
        Number(
            lines[11],
        );

    if (
        !passengerName ||
        !to ||
        !from ||
        !vehicle ||
        !transferDate
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            rate,
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix,
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorAmount,
        ) ||
        vendorAmount < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        lines.length === 14
    ) {
        if (
            lines[12].toUpperCase() !==
            'SAR'
        ) {
            return null;
        }

        const roe =
            Number(
                lines[13],
            );

        if (
            !Number.isFinite(
                roe,
            ) ||
            roe <= 0
        ) {
            return null;
        }

        currencyCode =
            'SAR';

        currencyRate =
            roe;
    }

    return {
        invoiceReference,

        passengerName,

        to,

        from,

        vehicle,

        transferDate,

        flightInfo,

        rate,

        vendorSuffix,

        vendorAmount,

        currencyCode,

        currencyRate,
    };
}

async function createTransferInvoiceFromWhatsApp(
    command,
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const payload = {
        client_suffix:
            command.clientSuffix,

        passenger_name:
            command.passengerName,

        to:
            command.to,

        from:
            command.from,

        vehicle:
            command.vehicle,

        transfer_date:
            command.transferDate,

        flight_info:
            command.flightInfo,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_amount:
            command.vendorAmount,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/transfer/create`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload,
                        ),

                    signal:
                        controller.signal,
                },
            );

        const body =
            Buffer.from(
                await response.arrayBuffer(),
            );

        if (
            !response.ok
        ) {
            const detail =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' ',
                    )
                    .trim()
                    .slice(
                        0,
                        1200,
                    );

            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    detail ||
                    'Unknown error'
                }`,
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8',
                ),
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid Transfer invoice response.',
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout,
        );
    }
}


async function addTransferInvoiceLineFromWhatsApp(
    command,
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const payload = {
        passenger_name:
            command.passengerName,

        to:
            command.to,

        from:
            command.from,

        vehicle:
            command.vehicle,

        transfer_date:
            command.transferDate,

        flight_info:
            command.flightInfo,

        rate:
            command.rate,

        vendor_suffix:
            command.vendorSuffix,

        vendor_amount:
            command.vendorAmount,

        currency_code:
            command.currencyCode,

        currency_rate:
            command.currencyRate,
    };

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}/api/whatsapp-bot/documents/invoice/${encodeURIComponent(
                    command.invoiceReference,
                )}/transfer/add`,
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            payload,
                        ),

                    signal:
                        controller.signal,
                },
            );

        const body =
            Buffer.from(
                await response.arrayBuffer(),
            );

        if (
            !response.ok
        ) {
            const detail =
                body
                    .toString('utf8')
                    .replace(
                        /\s+/g,
                        ' ',
                    )
                    .trim()
                    .slice(
                        0,
                        1200,
                    );

            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    detail ||
                    'Unknown error'
                }`,
            );
        }

        const result =
            JSON.parse(
                body.toString(
                    'utf8',
                ),
            );

        if (
            !result?.ok ||
            !result?.invoice
        ) {
            throw new Error(
                'ERP did not return a valid Transfer invoice update response.',
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout,
        );
    }
}

async function sendNewTransferInvoice({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Creating Transfer invoice for client ${command.clientSuffix}`,
    );

    const currencyLabel = command.currencyCode || 'BASE';

    const result =
        await createTransferInvoiceFromWhatsApp(
            command,
        );

    const invoice =
        result.invoice;

    const selling =
        Number(
            invoice.selling_total_base ||
            0,
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            },
        );

    const vendor =
        Number(
            invoice.vendor_total_base ||
            0,
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            },
        );

    const profit =
        Number(
            invoice.profit_base ||
            0,
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    4,
            },
        );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Transfer Invoice created successfully.',
                    '',
                    `Invoice #${invoice.invoice_number}`,
                    `Client: ${invoice.client_code} — ${invoice.client_name}`,
                    '',
                    `Passenger: ${invoice.passenger_name}`,
                    `From: ${invoice.from}`,
                    `To: ${invoice.to}`,
                    `Vehicle: ${invoice.vehicle}`,
                    `Date: ${invoice.date}`,
                    `Flight Info: ${invoice.flight_info || '-'}`,
                    '',
                    `Rate/Transfer: ${command.rate} ${currencyLabel}`,
                    `Vendor: ${invoice.vendor_code}`,
                    `Vendor Amount: ${command.vendorAmount} ${currencyLabel}`,
                    `ROE: ${command.currencyRate ?? '-'}`,
                    '',
                    `Selling Total (Base): ${selling}`,
                    `Vendor Total (Base): ${vendor}`,
                    `Profit (Base): ${profit}`,
                    'Quantity: 1',
                    'Commission: 0',
                ].join(
                    '\n',
                ),
        },
    );
}


async function sendAddTransferInvoiceLine({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Adding Transfer line to Invoice ${command.invoiceReference}`,
    );

    const currencyLabel = command.currencyCode || 'BASE';

    const result =
        await addTransferInvoiceLineFromWhatsApp(
            command,
        );

    const invoice =
        result.invoice;

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Transfer line added successfully.',
                    '',
                    `Invoice #${invoice.invoice_number}`,
                    `Client: ${invoice.client_code} — ${invoice.client_name}`,
                    '',
                    `Passenger: ${command.passengerName}`,
                    `From: ${command.from}`,
                    `To: ${command.to}`,
                    `Vehicle: ${command.vehicle}`,
                    `Date: ${command.transferDate}`,
                    `Flight Info: ${command.flightInfo || '-'}`,
                    '',
                    `Rate/Transfer: ${command.rate} ${currencyLabel}`,
                    `Vendor: ${command.vendorSuffix}`,
                    `Vendor Amount: ${command.vendorAmount} ${currencyLabel}`,
                    `ROE: ${command.currencyRate ?? '-'}`,
                    '',
                    `Total Lines: ${invoice.line_count}`,
                ].join(
                    '\n',
                ),
        },
    );
}

async function sendLedgerPdf({
    remoteJid,
    command,
}) {
    await fsp.mkdir(
        DOWNLOAD_DIR,
        {
            recursive: true,
        },
    );

    const fileName =
        safeLedgerPdfFileName(
            command,
        );

    const filePath =
        path.join(
            DOWNLOAD_DIR,
            fileName,
        );

    try {
        console.log(
            `[WHATSAPP] Preparing ledger PDF account ${command.accountSuffix} ${command.dateFrom} -> ${command.dateTo}` +
            `${command.currencyCode ? ` ${command.currencyCode}` : ' BASE'}` +
            `${command.combineInvoices ? ' COMBINED' : ' DETAILED'}`,
        );

        /*
         * Keep the same WhatsApp metadata/sender-key handling
         * already used by invoice/voucher PDFs.
         */
        await ensureSelectedGroupMetadata(
            false,
        );

        const pdfBuffer =
            await fetchLedgerPdf(
                command,
            );

        await fsp.writeFile(
            filePath,
            pdfBuffer,
        );

        console.log(
            `[WHATSAPP] Ledger PDF downloaded locally: ${filePath} (${pdfBuffer.length} bytes)`,
        );

        if (
            !sock ||
            connectionState !==
                'connected'
        ) {
            throw new Error(
                'WhatsApp is no longer connected.',
            );
        }

        await resetSelectedGroupSenderKey(
            remoteJid,
        );

        let metadata =
            getCachedGroupMetadata(
                remoteJid,
            );

        if (!metadata) {
            await ensureSelectedGroupMetadata(
                true,
            );
        }

        const captionParts = [
            `Ledger ${command.accountSuffix}`,
            `${command.dateFrom} to ${command.dateTo}`,
        ];

        if (
            command.currencyCode
        ) {
            captionParts.push(
                command.currencyCode,
            );
        } else {
            captionParts.push(
                'BASE',
            );
        }

        captionParts.push(
            command.combineInvoices
                ? 'COMBINED'
                : 'DETAILED',
        );

        const sent =
            await sock.sendMessage(
                remoteJid,
                {
                    document: {
                        url: filePath,
                    },

                    mimetype:
                        'application/pdf',

                    fileName,

                    caption:
                        captionParts.join(
                            ' | ',
                        ),
                },
                {
                    useUserDevicesCache:
                        false,

                    useCachedGroupMetadata:
                        true,

                    mediaUploadTimeoutMs:
                        120000,
                },
            );

        rememberOutgoingMessage(
            sent,
        );

        console.log(
            `[WHATSAPP] Sent ledger PDF for account ${command.accountSuffix} to ${remoteJid} messageId=${sent?.key?.id || 'unknown'}`,
        );
    } finally {
        try {
            await fsp.rm(
                filePath,
                {
                    force: true,
                },
            );

            console.log(
                `[WHATSAPP] Deleted temporary ledger PDF: ${filePath}`,
            );
        } catch (error) {
            console.warn(
                `[WHATSAPP] Failed to delete temporary ledger PDF ${filePath}: ${error.message}`,
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| OTHER REPORT PDF SEND
|--------------------------------------------------------------------------
*/

function safeOtherReportPdfFileName(
    command,
) {
    const prefix =
        command.type === 'ARR'
            ? 'Arrival-Report'
            : 'Transport-Report';

    const stamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                '-',
            )
            .replace(
                'T',
                '_',
            )
            .replace(
                'Z',
                '',
            );

    return (
        `${prefix}` +
        `-${command.dateFrom}` +
        `-to-${command.dateTo}` +
        `-${stamp}.pdf`
    );
}

async function sendOtherReportPdf({
    remoteJid,
    command,
}) {
    await fsp.mkdir(
        DOWNLOAD_DIR,
        {
            recursive: true,
        },
    );

    const fileName =
        safeOtherReportPdfFileName(
            command,
        );

    const filePath =
        path.join(
            DOWNLOAD_DIR,
            fileName,
        );

    const reportLabel =
        command.type === 'ARR'
            ? 'arrival report'
            : 'transport report';

    try {
        console.log(
            `[WHATSAPP] Preparing ${reportLabel} ${command.dateFrom} -> ${command.dateTo}`,
        );

        await ensureSelectedGroupMetadata(
            false,
        );

        const pdfBuffer =
            await fetchOtherReportPdf(
                command,
            );

        await fsp.writeFile(
            filePath,
            pdfBuffer,
        );

        console.log(
            `[WHATSAPP] ${reportLabel} PDF downloaded locally: ${filePath} (${pdfBuffer.length} bytes)`,
        );

        if (
            !sock ||
            connectionState !==
                'connected'
        ) {
            throw new Error(
                'WhatsApp is no longer connected.',
            );
        }

        await resetSelectedGroupSenderKey(
            remoteJid,
        );

        let metadata =
            getCachedGroupMetadata(
                remoteJid,
            );

        if (!metadata) {
            await ensureSelectedGroupMetadata(
                true,
            );
        }

        const caption =
            command.type === 'ARR'
                ? `Arrival Report | ${command.dateFrom} to ${command.dateTo}`
                : `Transport Report | ${command.dateFrom} to ${command.dateTo}`;

        const sent =
            await sock.sendMessage(
                remoteJid,
                {
                    document: {
                        url: filePath,
                    },

                    mimetype:
                        'application/pdf',

                    fileName,

                    caption,
                },
                {
                    useUserDevicesCache:
                        false,

                    useCachedGroupMetadata:
                        true,

                    mediaUploadTimeoutMs:
                        120000,
                },
            );

        rememberOutgoingMessage(
            sent,
        );

        console.log(
            `[WHATSAPP] Sent ${reportLabel} PDF to ${remoteJid} messageId=${sent?.key?.id || 'unknown'}`,
        );
    } finally {
        try {
            await fsp.rm(
                filePath,
                {
                    force: true,
                },
            );

            console.log(
                `[WHATSAPP] Deleted temporary report PDF: ${filePath}`,
            );
        } catch (error) {
            console.warn(
                `[WHATSAPP] Failed to delete temporary report PDF ${filePath}: ${error.message}`,
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| NEW VOUCHER SEND
|--------------------------------------------------------------------------
*/

async function sendNewVoucher({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Creating ${command.voucherType} voucher: cash ${command.cashBankSuffix}, ${command.partyType} ${command.partySuffix}` +
        `${
            command.invoiceReference
                ? `, invoice ${command.invoiceReference}`
                : ''
        }` +
        `${
            command.currencyCode
                ? `, ${command.currencyCode} ${command.currencyQuantity} @ ${command.currencyRate}`
                : `, base ${command.baseAmount}`
        }`
    );

    const result =
        await createVoucherFromWhatsApp(
            command
        );

    const voucher =
        result.voucher;

    const voucherLabel =
        voucher.voucher_type === 'BR'
            ? 'Bank Receipt'
            : 'Bank Payment';

    const lines = [
        `✅ ${voucherLabel} created successfully.`,
        ``,
        `Voucher #${voucher.voucher_no}`,
        `Date: ${voucher.voucher_date}`,
        ``,
        `${voucher.cash_bank_account_code} — ${voucher.cash_bank_account_name}`,
        `${voucher.party_account_code} — ${voucher.party_account_name}`,
    ];

    if (
        voucher.invoice_number
    ) {
        lines.push(
            `Invoice: ${voucher.invoice_number}`
        );
    }

    if (
        voucher.currency_code
    ) {
        lines.push(
            `${voucher.currency_code}: ${Number(voucher.currency_quantity).toLocaleString('en-US', {
                maximumFractionDigits: 4,
            })} × ${Number(voucher.currency_rate).toLocaleString('en-US', {
                maximumFractionDigits: 8,
            })} = ${Number(voucher.base_amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            })} base`
        );
    } else {
        lines.push(
            `Amount: ${Number(voucher.base_amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            })}`
        );
    }

    lines.push(
        `Particular: ${voucher.particulars}`
    );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                lines.join('\n'),
        }
    );

    console.log(
        `[WHATSAPP] Created ${voucher.voucher_type} #${voucher.voucher_no} for ${remoteJid}`
    );
}

/*
|--------------------------------------------------------------------------
| NEW HOTEL INVOICE COMMAND
|--------------------------------------------------------------------------
|
| Full:
|
| NEW
| INV
| 052
| HTL
| PASSENGER NAME
| HOTEL NAME
| ROOM TYPE
| MEAL
| 19JUL26
| 3
| 2
| 1250
| 032
| 1000
| SAR
| 76.5
|
| Checkout-date variant:
|
| NEW
| INV
| 052
| HTL
| PASSENGER NAME
| HOTEL NAME
| ROOM TYPE
| MEAL
| 19JUL26
| 22JUL26
| 2
| 1250
| 032
| 1000
|
| Room quantity can be omitted.
|--------------------------------------------------------------------------
*/

function addWhatsAppDays(
    isoDate,
    days
) {
    const date =
        new Date(
            `${isoDate}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    date.setDate(
        date.getDate() +
            Number(days)
    );

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        ),
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        ),
    ].join('-');
}


function differenceWhatsAppDays(
    fromIso,
    toIso
) {
    const from =
        new Date(
            `${fromIso}T00:00:00`
        );

    const to =
        new Date(
            `${toIso}T00:00:00`
        );

    if (
        Number.isNaN(
            from.getTime()
        ) ||
        Number.isNaN(
            to.getTime()
        )
    ) {
        return null;
    }

    return Math.round(
        (
            to.getTime() -
            from.getTime()
        ) /
        86400000
    );
}


function parseNewHotelInvoiceCommand(
    text
) {
    const lines =
        String(
            text || ''
        )
            .replace(
                /\r/g,
                ''
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);

    /*
     * Valid lengths:
     *
     * 13 = no room qty, base
     * 14 = room qty, base
     * 15 = no room qty, SAR
     * 16 = room qty, SAR
     */
    if (
        ![
            13,
            14,
            15,
            16,
        ].includes(
            lines.length
        )
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'NEW'
    ) {
        return null;
    }

    if (
        lines[1].toUpperCase() !==
        'INV'
    ) {
        return null;
    }

    if (
        lines[2].length !== 3 ||
        !/^\d{3}$/.test(
            lines[2]
        )
    ) {
        return null;
    }

    if (
        lines[3].toUpperCase() !==
        'HTL'
    ) {
        return null;
    }

    const passengerName =
        lines[4];

    const hotelName =
        lines[5];

    const roomType =
        lines[6];

    const meal =
        lines[7];

    if (
        !passengerName ||
        !hotelName ||
        !roomType ||
        !meal
    ) {
        return null;
    }

    const checkIn =
        parseLedgerDate(
            lines[8]
        );

    if (
        !checkIn
    ) {
        return null;
    }

    /*
     * The currency marker, when present,
     * is always the second-last line.
     */
    const hasSar =
        lines.length >= 15 &&
        lines[
            lines.length - 2
        ].toUpperCase() ===
            'SAR';

    const baseFieldCount =
        hasSar
            ? lines.length - 2
            : lines.length;

    const hasRoomQuantity =
        baseFieldCount === 14;

    /*
     * Stay field is always line 10.
     *
     * Either:
     *   3
     * or:
     *   22JUL26
     */
    const stayValue =
        lines[9];

    let nights;
    let checkOut;

    if (
        /^\d+$/.test(
            stayValue
        )
    ) {
        nights =
            Number(
                stayValue
            );

        if (
            nights <= 0
        ) {
            return null;
        }

        checkOut =
            addWhatsAppDays(
                checkIn,
                nights
            );

        if (
            !checkOut
        ) {
            return null;
        }
    } else {
        checkOut =
            parseLedgerDate(
                stayValue
            );

        if (
            !checkOut
        ) {
            return null;
        }

        nights =
            differenceWhatsAppDays(
                checkIn,
                checkOut
            );

        if (
            nights === null ||
            nights <= 0
        ) {
            return null;
        }
    }

    let rateIndex;
    let vendorIndex;
    let vendorRateIndex;

    let roomQuantity =
        1;

    if (
        hasRoomQuantity
    ) {
        /*
         * 10 = room qty
         * 11 = selling rate
         * 12 = vendor
         * 13 = vendor buy rate
         */
        rateIndex = 11;
        vendorIndex = 12;
        vendorRateIndex = 13;

        if (
            !/^\d+$/.test(
                lines[10]
            )
        ) {
            return null;
        }

        roomQuantity =
            Number(
                lines[10]
            );

        if (
            roomQuantity <= 0
        ) {
            return null;
        }
    } else {
        /*
         * 10 = selling rate
         * 11 = vendor
         * 12 = vendor buy rate
         */
        rateIndex = 10;
        vendorIndex = 11;
        vendorRateIndex = 12;
    }

    const rate =
        Number(
            lines[rateIndex]
        );

    const vendorSuffix =
        lines[vendorIndex];

    const vendorRate =
        Number(
            lines[vendorRateIndex]
        );

    if (
        !Number.isFinite(
            rate
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorRate
        ) ||
        vendorRate < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        hasSar
    ) {
        currencyCode =
            'SAR';

        currencyRate =
            Number(
                lines[
                    lines.length - 1
                ]
            );

        if (
            !Number.isFinite(
                currencyRate
            ) ||
            currencyRate <= 0
        ) {
            return null;
        }
    } else {
        /*
         * Base command must end at the vendor buy rate.
         */
        if (
            lines.length !==
            baseFieldCount
        ) {
            return null;
        }
    }

    return {
        clientSuffix:
            lines[2],

        passengerName,

        hotelName,

        roomType,

        meal,

        checkIn,

        checkOut,

        nights,

        roomQuantity,

        rate,

        vendorSuffix,

        vendorRate,

        currencyCode,

        currencyRate,
    };
}

/*

|--------------------------------------------------------------------------
| NEW BR / BP VOUCHER COMMAND
|--------------------------------------------------------------------------
|
| BASE:
|
| NEW
| BR
| 002
| CL 003
| 25000
|
| BASE + INVOICE:
|
| NEW
| BP
| 002
| VE 005
| INV#2009
| 25000
|
| FOREIGN:
|
| NEW
| BR
| 002
| CL 003
| INV#2009
| SAR
| 4
| 76.5
|--------------------------------------------------------------------------
*/

function parseNewVoucherCommand(text) {
    const lines =
        String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

    if (
        lines.length < 5 ||
        lines.length > 8
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !== 'NEW'
    ) {
        return null;
    }

    const voucherType =
        lines[1].toUpperCase();

    if (
        voucherType !== 'BR' &&
        voucherType !== 'BP'
    ) {
        return null;
    }

    const cashBankSuffix =
        lines[2];

    if (
        !/^\d{3}$/.test(
            cashBankSuffix
        )
    ) {
        return null;
    }

    const partyMatch =
        lines[3].toUpperCase().match(
            /^(CL|VE)\s+(\d{3})$/
        );

    if (!partyMatch) {
        return null;
    }

    const partyType =
        partyMatch[1];

    const partySuffix =
        partyMatch[2];

    let index =
        4;

    let invoiceReference =
        null;

    /*
     * Optional INV#.
     */
    if (
        /^INV#\d+$/i.test(
            lines[index] || ''
        )
    ) {
        invoiceReference =
            lines[index]
                .substring(4)
                .trim();

        index += 1;
    }

    /*
     * Foreign currency:
     *
     * SAR
     * QTY
     * ROE
     */
    if (
        (lines[index] || '')
            .toUpperCase() === 'SAR'
    ) {
        if (
            lines.length !==
            index + 3
        ) {
            return null;
        }

        const quantity =
            lines[index + 1];

        const roe =
            lines[index + 2];

        if (
            !/^\d+(?:\.\d+)?$/.test(
                quantity
            )
        ) {
            return null;
        }

        if (
            !/^\d+(?:\.\d+)?$/.test(
                roe
            )
        ) {
            return null;
        }

        const currencyQuantity =
            Number(quantity);

        const currencyRate =
            Number(roe);

        if (
            currencyQuantity <= 0 ||
            currencyRate <= 0
        ) {
            return null;
        }

        return {
            voucherType,
            cashBankSuffix,
            partyType,
            partySuffix,
            invoiceReference,
            currencyCode:
                'SAR',
            currencyQuantity,
            currencyRate,
            baseAmount:
                null,
        };
    }

    /*
     * Base currency:
     *
     * Final line is the amount.
     */
    if (
        lines.length !==
        index + 1
    ) {
        return null;
    }

    const amountText =
        lines[index];

    if (
        !/^\d+(?:\.\d+)?$/.test(
            amountText
        )
    ) {
        return null;
    }

    const amount =
        Number(amountText);

    if (
        amount <= 0
    ) {
        return null;
    }

    return {
        voucherType,
        cashBankSuffix,
        partyType,
        partySuffix,
        invoiceReference,
        currencyCode:
            null,
        currencyQuantity:
            null,
        currencyRate:
            null,
        baseAmount:
            amount,
    };
}


/*
|--------------------------------------------------------------------------
| MESSAGE HANDLER
|--------------------------------------------------------------------------
*/

async function handleSelectedGroupMessage(
    message,
    remoteJid,
) {
    const text =
        extractMessageText(
            message,
        );

    if (!text) {
        return;
    }

    /*
     * ------------------------------------------------------
     * Existing Invoice / Voucher PDF commands
     * ------------------------------------------------------
     */

    const documentCommand =
        parsePdfCommand(
            text,
        );

    if (
        documentCommand
    ) {
        try {
            await sendPdf({
                remoteJid,
                type:
                    documentCommand.type,
                reference:
                    documentCommand.reference,
            });
        } catch (error) {
            console.error(
                `[WHATSAPP] PDF command failed for ${documentCommand.type} ${documentCommand.reference}:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to generate ${
                                    documentCommand.type ===
                                    'INV'
                                        ? 'invoice'
                                        : 'voucher'
                                } ${documentCommand.reference}. ${error.message}`,
                        },
                    );
                } catch (sendError) {
                    console.error(
                        '[WHATSAPP] Failed to send PDF error message:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    const newTransferInvoiceCommand =
    parseNewTransferInvoiceCommand(
        text,
    );

if (
    newTransferInvoiceCommand
) {
    try {
        await sendNewTransferInvoice({
            remoteJid,

            command:
                newTransferInvoiceCommand,
        });
    } catch (
        error
    ) {
        console.error(
            '[WHATSAPP] New Transfer Invoice command failed:',
            error.message,
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to create Transfer invoice. ${error.message}`,
                    },
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send Transfer invoice error:',
                    sendError.message,
                );
            }
        }
    }

    return;
}

const addTransferInvoiceCommand =
    parseAddTransferInvoiceCommand(
        text,
    );

if (
    addTransferInvoiceCommand
) {
    try {
        await sendAddTransferInvoiceLine({
            remoteJid,

            command:
                addTransferInvoiceCommand,
        });
    } catch (
        error
    ) {
        console.error(
            `[WHATSAPP] ADD Transfer line failed for Invoice ${addTransferInvoiceCommand.invoiceReference}:`,
            error.message,
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to add Transfer line to Invoice ${addTransferInvoiceCommand.invoiceReference}. ${error.message}`,
                    },
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send ADD Transfer error:',
                    sendError.message,
                );
            }
        }
    }

    return;
}
    


    /*
     * ------------------------------------------------------
     * New BR / BP voucher creation
     * ------------------------------------------------------
     */

    const newVoucherCommand =
        parseNewVoucherCommand(
            text,
        );

    if (
        newVoucherCommand
    ) {
        try {
            await sendNewVoucher({
                remoteJid,
                command:
                    newVoucherCommand,
            });
        } catch (error) {
            console.error(
                `[WHATSAPP] New ${newVoucherCommand.voucherType} voucher command failed:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to create ${newVoucherCommand.voucherType} voucher. ${error.message}`,
                        },
                    );
                } catch (sendError) {
                    console.error(
                        '[WHATSAPP] Failed to send voucher creation error:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
     * ------------------------------------------------------
     * Arrival / Transport Report PDF
     * ------------------------------------------------------
     */

    const otherReportCommand =
        parseOtherReportPdfCommand(
            text,
        );

    if (
        otherReportCommand
    ) {
        try {
            await sendOtherReportPdf({
                remoteJid,
                command:
                    otherReportCommand,
            });
        } catch (error) {
            const reportLabel =
                otherReportCommand.type ===
                'ARR'
                    ? 'arrival report'
                    : 'transport report';

            console.error(
                `[WHATSAPP] ${reportLabel} PDF command failed:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to generate ${reportLabel} from ${otherReportCommand.dateFrom} to ${otherReportCommand.dateTo}. ${error.message}`,
                        },
                    );
                } catch (sendError) {
                    console.error(
                        '[WHATSAPP] Failed to send report error message:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
     * ------------------------------------------------------
     * Ledger PDF command
     * ------------------------------------------------------
     */

    const ledgerCommand =
        parseLedgerPdfCommand(
            text,
        );

    if (
        !ledgerCommand
    ) {
        return;
    }

    try {
        await sendLedgerPdf({
            remoteJid,
            command:
                ledgerCommand,
        });
    } catch (error) {
        console.error(
            `[WHATSAPP] Ledger PDF command failed for account ${ledgerCommand.accountSuffix}:`,
            error.message,
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to generate ledger for account ${ledgerCommand.accountSuffix} from ${ledgerCommand.dateFrom} to ${ledgerCommand.dateTo}. ${error.message}`,
                    },
                );
            } catch (sendError) {
                console.error(
                    '[WHATSAPP] Failed to send ledger PDF error message:',
                    sendError.message,
                );
            }
        }
    }
}


/*
|--------------------------------------------------------------------------
| WHATSAPP ACCOUNT TYPE ALIASES
|--------------------------------------------------------------------------
*/



const WHATSAPP_ACCOUNT_TYPES = Object.freeze({
    CB: {
        name:
            'Petty Cash & Bank',
        prefix:
            '110',
    },

    CL: {
        name:
            'Receivables / Customers',
        prefix:
            '120',
    },

    CA: {
        name:
            'Current Assets',
        prefix:
            '121',
    },

    IN: {
        name:
            'Investment',
        prefix:
            '122',
    },

    SA: {
        name:
            'Staff Salaries & Advances',
        prefix:
            '123',
    },

    AD: {
        name:
            'Advances & Deposits',
        prefix:
            '124',
    },

    FA: {
        name:
            'Fix Assets',
        prefix:
            '130',
    },

    VE: {
        name:
            'Payables / Vendors',
        prefix:
            '210',
    },

    AL: {
        name:
            'Airlines',
        prefix:
            '211',
    },

    ST: {
        name:
            'Short term loans',
        prefix:
            '212',
    },

    LT: {
        name:
            'Long term loans',
        prefix:
            '220',
    },

    CP: {
        name:
            'Capital',
        prefix:
            '230',
    },

    UP: {
        name:
            'Unappropriated Profit',
        prefix:
            '231',
    },

    CO: {
        name:
            'Cost of Revenue',
        prefix:
            '310',
    },

    EX: {
        name:
            'Operating Expenses',
        prefix:
            '320',
    },

    FE: {
        name:
            'Financial Expenses',
        prefix:
            '321',
    },

    DP: {
        name:
            'Depreciation',
        prefix:
            '322',
    },

    SL: {
        name:
            'Sales',
        prefix:
            '410',
    },

    OI: {
        name:
            'Other Income',
        prefix:
            '420',
    },
});


/*
|--------------------------------------------------------------------------
| NEW BR / BP VOUCHER COMMAND
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| NEW JOURNAL VOUCHER COMMAND
|--------------------------------------------------------------------------
|
| Base:
|
| NEW
| JV
| EX 001 D 25000
| SL 001 C 25000
|
| SAR:
|
| NEW
| JV
| EX 001 D SAR 100 76.4
| SL 001 C SAR 100 76.4
|
| Invoice:
|
| NEW
| JV
| CL 003 D 25000 INV#2009
| EX 001 C 25000
|--------------------------------------------------------------------------
*/

function parseNewJournalVoucherCommand(
    text,
) {
    const lines =
        String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map(
                (line) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length < 4
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'NEW'
    ) {
        return null;
    }

    if (
        lines[1].toUpperCase() !==
        'JV'
    ) {
        return null;
    }

    const journalLines = [];

    for (
        let i = 2;
        i < lines.length;
        i += 1
    ) {
        const tokens =
            lines[i]
                .split(/\s+/)
                .filter(Boolean);

        /*
         * Minimum:
         *
         * EX 001 D 25000
         */
        if (
            tokens.length < 4
        ) {
            return null;
        }

        const accountAlias =
            tokens[0].toUpperCase();

        const accountSuffix =
            tokens[1];

        if (
            !/^[A-Z]{2}$/.test(
                accountAlias,
            )
        ) {
            return null;
        }

        if (
            !/^\d{3}$/.test(
                accountSuffix,
            )
        ) {
            return null;
        }

        const sideToken =
            tokens[2].toUpperCase();

        let side;

        if (
            sideToken === 'D' ||
            sideToken === 'DR' ||
            sideToken === 'DEBIT'
        ) {
            side =
                'debit';
        } else if (
            sideToken === 'C' ||
            sideToken === 'CR' ||
            sideToken === 'CREDIT'
        ) {
            side =
                'credit';
        } else {
            return null;
        }

        let index =
            3;

        let currencyCode =
            null;

        let amount =
            null;

        let currencyQuantity =
            null;

        let currencyRate =
            null;

        let invoiceReference =
            null;

        /*
         * Optional SAR.
         */
        if (
            (
                tokens[index] ||
                ''
            ).toUpperCase() ===
            'SAR'
        ) {
            currencyCode =
                'SAR';

            index += 1;

            if (
                tokens.length <
                index + 2
            ) {
                return null;
            }

            const quantityText =
                tokens[index];

            const roeText =
                tokens[index + 1];

            if (
                !/^\d+(?:\.\d+)?$/.test(
                    quantityText,
                )
            ) {
                return null;
            }

            if (
                !/^\d+(?:\.\d+)?$/.test(
                    roeText,
                )
            ) {
                return null;
            }

            currencyQuantity =
                Number(
                    quantityText,
                );

            currencyRate =
                Number(
                    roeText,
                );

            if (
                currencyQuantity <= 0 ||
                currencyRate <= 0
            ) {
                return null;
            }

            index += 2;
        } else {
            const amountText =
                tokens[index];

            if (
                !/^\d+(?:\.\d+)?$/.test(
                    amountText,
                )
            ) {
                return null;
            }

            amount =
                Number(
                    amountText,
                );

            if (
                amount <= 0
            ) {
                return null;
            }

            index += 1;
        }

        /*
         * Optional INV# at the end.
         */
        if (
            tokens[index]
            &&
            /^INV#\d+$/i.test(
                tokens[index],
            )
        ) {
            invoiceReference =
                tokens[index]
                    .substring(4)
                    .trim();

            index += 1;
        }

        /*
         * Nothing else may remain.
         */
        if (
            index !==
            tokens.length
        ) {
            return null;
        }

        journalLines.push({
            accountAlias,
            accountSuffix,
            side,

            amount,

            currencyCode,
            currencyQuantity,
            currencyRate,

            invoiceReference,
        });
    }

    if (
        journalLines.length < 2
    ) {
        return null;
    }

    const hasDebit =
        journalLines.some(
            (line) =>
                line.side ===
                'debit'
        );

    const hasCredit =
        journalLines.some(
            (line) =>
                line.side ===
                'credit'
        );

    if (
        !hasDebit ||
        !hasCredit
    ) {
        return null;
    }

    return {
        voucherType:
            'JV',

        lines:
            journalLines,
    };
}

function parseNewVoucherCommand(
    text,
) {
    const lines =
        String(
            text || '',
        )
            .replace(
                /\r/g,
                '',
            )
            .split('\n')
            .map(
                (
                    line,
                ) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length < 5 ||
        lines.length > 8
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'NEW'
    ) {
        return null;
    }

    const voucherType =
        lines[1].toUpperCase();

    if (
        voucherType !== 'BR' &&
        voucherType !== 'BP'
    ) {
        return null;
    }

    /*
     * Cash / Bank:
     * final 3 digits only.
     */
    const cashBankSuffix =
        lines[2].trim();

    if (
        !/^\d{3}$/.test(
            cashBankSuffix,
        )
    ) {
        return null;
    }

    /*
     * Detail account:
     *
     * CL 003
     * VE 005
     * EX 001
     * etc.
     *
     * Also accept:
     *
     * CL003
     * EX001
     */
    const accountMatch =
        lines[3]
            .toUpperCase()
            .match(
                /^([A-Z]{2})\s*(\d{3})$/,
            );

    if (
        !accountMatch
    ) {
        return null;
    }

    const accountAlias =
        accountMatch[1];

    const accountSuffix =
        accountMatch[2];

    if (
        !WHATSAPP_ACCOUNT_TYPES[
            accountAlias
        ]
    ) {
        return null;
    }

    /*
     * Keep the old property names too.
     *
     * createVoucherFromWhatsApp()
     * already sends party_type / party_suffix.
     *
     * We now use the alias in party_type.
     */
    const partyType =
        accountAlias;

    const partySuffix =
        accountSuffix;

    let index =
        4;

    let invoiceReference =
        null;

    /*
     * Optional INV#.
     */
    if (
        /^INV#\d+$/i.test(
            lines[index] || '',
        )
    ) {
        invoiceReference =
            lines[index]
                .substring(4)
                .trim();

        index += 1;
    }

    /*
     * Foreign currency.
     *
     * SAR
     * QTY
     * ROE
     */
    if (
        (
            lines[index] ||
            ''
        ).toUpperCase() ===
        'SAR'
    ) {
        if (
            lines.length !==
            index + 3
        ) {
            return null;
        }

        const quantity =
            lines[
                index + 1
            ];

        const roe =
            lines[
                index + 2
            ];

        if (
            !/^\d+(?:\.\d+)?$/.test(
                quantity,
            )
        ) {
            return null;
        }

        if (
            !/^\d+(?:\.\d+)?$/.test(
                roe,
            )
        ) {
            return null;
        }

        const currencyQuantity =
            Number(
                quantity,
            );

        const currencyRate =
            Number(
                roe,
            );

        if (
            currencyQuantity <=
                0 ||
            currencyRate <=
                0
        ) {
            return null;
        }

        return {
            voucherType,

            cashBankSuffix,

            /*
             * New alias representation.
             */
            accountAlias,
            accountSuffix,

            /*
             * Backward-compatible
             * property names.
             */
            partyType,
            partySuffix,

            invoiceReference,

            currencyCode:
                'SAR',

            currencyQuantity,

            currencyRate,

            baseAmount:
                null,
        };
    }

    /*
     * Base currency:
     *
     * final line = amount
     */
    if (
        lines.length !==
        index + 1
    ) {
        return null;
    }

    const amountText =
        lines[index];

    if (
        !/^\d+(?:\.\d+)?$/.test(
            amountText,
        )
    ) {
        return null;
    }

    const amount =
        Number(
            amountText,
        );

    if (
        amount <= 0
    ) {
        return null;
    }

    return {
        voucherType,

        cashBankSuffix,

        accountAlias,
        accountSuffix,

        /*
         * Backward-compatible
         * property names.
         */
        partyType,
        partySuffix,

        invoiceReference,

        currencyCode:
            null,

        currencyQuantity:
            null,

        currencyRate:
            null,

        baseAmount:
            amount,
    };
}


/*
|--------------------------------------------------------------------------
| VIEW ACCOUNT COMMAND
|--------------------------------------------------------------------------
|
| VIEW
| ACC TYPE
|
| VIEW
| CL
|
| VIEW
| EX
|--------------------------------------------------------------------------
*/

function parseViewAccountCommand(
    text,
) {
    const lines =
        String(
            text || '',
        )
            .replace(
                /\r/g,
                '',
            )
            .split('\n')
            .map(
                (
                    line,
                ) =>
                    line.trim(),
            )
            .filter(Boolean);

    if (
        lines.length !== 2
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'VIEW'
    ) {
        return null;
    }

    const target =
        lines[1].toUpperCase();

    if (
        target ===
        'ACC TYPE'
    ) {
        return {
            type:
                'ACCOUNT_TYPES',
        };
    }

    if (
        !WHATSAPP_ACCOUNT_TYPES[
            target
        ]
    ) {
        return null;
    }

    return {
        type:
            'ACCOUNTS',

        alias:
            target,
    };
}


/*
|--------------------------------------------------------------------------
| ERP ACCOUNT LIST
|--------------------------------------------------------------------------
*/

async function fetchAccountsByType(
    alias,
) {
    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const endpoint =
        `/api/whatsapp-bot/accounts/type/${encodeURIComponent(
            alias,
        )}`;

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            ERP_REQUEST_TIMEOUT_MS,
        );

    try {
        const response =
            await fetch(
                `${ERP_BASE_URL}${endpoint}`,
                {
                    method:
                        'GET',

                    headers: {
                        Accept:
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    signal:
                        controller.signal,
                },
            );

        const body =
            await response.text();

        if (
            !response.ok
        ) {
            throw new Error(
                `ERP returned HTTP ${response.status}: ${
                    body
                        .replace(
                            /\s+/g,
                            ' ',
                        )
                        .trim()
                        .slice(
                            0,
                            1000,
                        )
                }`,
            );
        }

        let result;

        try {
            result =
                JSON.parse(
                    body,
                );
        } catch (
            error
        ) {
            throw new Error(
                'ERP returned invalid JSON for the account list.',
            );
        }

        if (
            !result?.ok
        ) {
            throw new Error(
                'ERP did not return a valid account list.',
            );
        }

        return result;
    } finally {
        clearTimeout(
            timeout,
        );
    }
}


/*
|--------------------------------------------------------------------------
| SEND LONG TEXT IN SAFE CHUNKS
|--------------------------------------------------------------------------
*/

async function sendWhatsAppTextChunks(
    remoteJid,
    text,
) {
    const maxLength =
        5500;

    const lines =
        String(
            text || '',
        ).split('\n');

    let current =
        '';

    for (
        const line of
            lines
    ) {
        const candidate =
            current === ''
                ? line
                : `${current}\n${line}`;

        if (
            candidate.length >
                maxLength &&
            current !== ''
        ) {
            await sock.sendMessage(
                remoteJid,
                {
                    text:
                        current,
                },
            );

            current =
                line;
        } else {
            current =
                candidate;
        }
    }

    if (
        current !== ''
    ) {
        await sock.sendMessage(
            remoteJid,
            {
                text:
                    current,
            },
        );
    }
}


/*
|--------------------------------------------------------------------------
| SEND VIEW ACCOUNT COMMAND
|--------------------------------------------------------------------------
*/

async function sendViewAccountCommand({
    remoteJid,
    command,
}) {
    if (
        command.type ===
        'ACCOUNT_TYPES'
    ) {
        const lines = [
            'ACCOUNT TYPES',
            '',
        ];

        for (
            const [
                alias,
                type,
            ] of Object.entries(
                WHATSAPP_ACCOUNT_TYPES,
            )
        ) {
            lines.push(
                `${type.name} — ${alias} — ${type.prefix}`,
            );
        }

        await sendWhatsAppTextChunks(
            remoteJid,
            lines.join(
                '\n',
            ),
        );

        return;
    }

    const alias =
        command.alias;

    const result =
        await fetchAccountsByType(
            alias,
        );

    const type =
        WHATSAPP_ACCOUNT_TYPES[
            alias
        ];

    const lines = [
        `${alias} — ${type.name} — ${type.prefix}`,
        '',
    ];

    const accounts =
        Array.isArray(
            result.accounts,
        )
            ? result.accounts
            : [];

    if (
        accounts.length ===
        0
    ) {
        lines.push(
            'No accounts found.',
        );

        await sendWhatsAppTextChunks(
            remoteJid,
            lines.join(
                '\n',
            ),
        );

        return;
    }

    for (
        const account of
            accounts
    ) {
        lines.push(
            `${account.name} — ${account.last3}`,
        );
    }

    await sendWhatsAppTextChunks(
        remoteJid,
        lines.join(
            '\n',
        ),
    );
}

/*
|--------------------------------------------------------------------------
| ADD HOTEL LINE TO EXISTING INVOICE
|--------------------------------------------------------------------------
|
| ADD
| 2379
| HTL
| SYED MUHAMMAD WAQAR HAIDER
| DAR AL TAQWA
| DOUBLE HARAM VIEW
| BB
| 19JUL26
| 3
| 2
| 1250
| 032
| 1000
| SAR
| 76.5
|
| Also accepts:
|
| ADD
| INV#2379
| HTL
| ...
|--------------------------------------------------------------------------
*/

function addHotelInvoiceDays(
    isoDate,
    days
) {
    const date =
        new Date(
            `${isoDate}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    date.setDate(
        date.getDate() +
            Number(days)
    );

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        ),
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        ),
    ].join('-');
}


function hotelInvoiceDateDifference(
    fromIso,
    toIso
) {
    const from =
        new Date(
            `${fromIso}T00:00:00`
        );

    const to =
        new Date(
            `${toIso}T00:00:00`
        );

    if (
        Number.isNaN(
            from.getTime()
        ) ||
        Number.isNaN(
            to.getTime()
        )
    ) {
        return null;
    }

    return Math.round(
        (
            to.getTime() -
            from.getTime()
        ) /
        86400000
    );
}


function parseAddHotelInvoiceCommand(
    text
) {
    const lines =
        String(
            text || ''
        )
            .replace(
                /\r/g,
                ''
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);

    /*
     * With Room Qty:
     *
     * 15 = base
     * 17 = SAR
     *
     * Without Room Qty:
     *
     * 14 = base
     * 16 = SAR
     */
    if (
        ![
            14,
            15,
            16,
            17,
        ].includes(
            lines.length
        )
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'ADD'
    ) {
        return null;
    }

    /*
     * Invoice reference may be:
     *
     * 2379
     * INV#2379
     */
    let invoiceReference =
        lines[1];

    if (
        /^INV#\d+$/i.test(
            invoiceReference
        )
    ) {
        invoiceReference =
            invoiceReference
                .substring(4)
                .trim();
    }

    if (
        !/^\d+$/.test(
            invoiceReference
        )
    ) {
        return null;
    }

    if (
        lines[2].toUpperCase() !==
        'HTL'
    ) {
        return null;
    }

    const passengerName =
        lines[3];

    const hotelName =
        lines[4];

    const roomType =
        lines[5];

    const meal =
        lines[6];

    if (
        !passengerName ||
        !hotelName ||
        !roomType ||
        !meal
    ) {
        return null;
    }

    const checkIn =
        parseLedgerDate(
            lines[7]
        );

    if (
        !checkIn
    ) {
        return null;
    }

    /*
     * Determine whether the final two lines are SAR + ROE.
     */
    const hasSar =
        (
            lines[
                lines.length - 2
            ] || ''
        ).toUpperCase() ===
        'SAR';

    const baseLength =
        hasSar
            ? lines.length - 2
            : lines.length;

    const hasRoomQuantity =
    (
        baseLength === 13 ||
        baseLength === 15
    );

    let stayIndex =
        8;

    let roomQuantity =
        1;

    let rateIndex;
    let vendorIndex;
    let vendorRateIndex;

    if (
        hasRoomQuantity
    ) {
        roomQuantity =
            Number(
                lines[9]
            );

        if (
            !Number.isInteger(
                roomQuantity
            ) ||
            roomQuantity <= 0
        ) {
            return null;
        }

        rateIndex =
            10;

        vendorIndex =
            11;

        vendorRateIndex =
            12;
    } else {
        rateIndex =
            9;

        vendorIndex =
            10;

        vendorRateIndex =
            11;
    }

    const stayValue =
        lines[
            stayIndex
        ];

    let nights;
    let checkOut;

    /*
     * Nights number.
     */
    if (
        /^\d+$/.test(
            stayValue
        )
    ) {
        nights =
            Number(
                stayValue
            );

        if (
            nights <= 0
        ) {
            return null;
        }

        checkOut =
            addHotelInvoiceDays(
                checkIn,
                nights
            );

        if (
            !checkOut
        ) {
            return null;
        }
    } else {
        /*
         * Checkout date.
         */
        checkOut =
            parseLedgerDate(
                stayValue
            );

        if (
            !checkOut
        ) {
            return null;
        }

        nights =
            hotelInvoiceDateDifference(
                checkIn,
                checkOut
            );

        if (
            nights === null ||
            nights <= 0
        ) {
            return null;
        }
    }

    const rate =
        Number(
            lines[
                rateIndex
            ]
        );

    const vendorSuffix =
        lines[
            vendorIndex
        ];

    const vendorRate =
        Number(
            lines[
                vendorRateIndex
            ]
        );

    if (
        !Number.isFinite(
            rate
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorRate
        ) ||
        vendorRate < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        hasSar
    ) {
        currencyCode =
            'SAR';

        currencyRate =
            Number(
                lines[
                    lines.length - 1
                ]
            );

        if (
            !Number.isFinite(
                currencyRate
            ) ||
            currencyRate <= 0
        ) {
            return null;
        }
    }

    return {
        invoiceReference,

        passengerName,

        hotelName,

        roomType,

        meal,

        checkIn,

        checkOut,

        nights,

        roomQuantity,

        rate,

        vendorSuffix,

        vendorRate,

        currencyCode,

        currencyRate,
    };
}

/*
|--------------------------------------------------------------------------
| NEW VISA INVOICE COMMAND
|--------------------------------------------------------------------------
|
| NEW
| INV
| 052
| VISA
| PASSENGER NAME
| PPT NO
| VISA TYPE
| RATE/TRANSFER
| VENDOR CODE
| VENDOR AMOUNT
| SAR
| ROE
|--------------------------------------------------------------------------
*/

function parseNewVisaInvoiceCommand(
    text
) {
    const lines =
        String(
            text || ''
        )
            .replace(
                /\r/g,
                ''
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);

    if (
        lines.length !== 10 &&
        lines.length !== 12
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'NEW'
    ) {
        return null;
    }

    if (
        lines[1].toUpperCase() !==
        'INV'
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            lines[2]
        )
    ) {
        return null;
    }

    if (
        lines[3].toUpperCase() !==
        'VISA'
    ) {
        return null;
    }

    const passengerName =
        lines[4];

    const passportNo =
        lines[5];

    const visaType =
        lines[6];

    const rate =
        Number(
            lines[7]
        );

    const vendorSuffix =
        lines[8];

    const vendorAmount =
        Number(
            lines[9]
        );

    if (
        !passengerName ||
        !passportNo ||
        !visaType
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            rate
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorAmount
        ) ||
        vendorAmount < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        lines.length === 12
    ) {
        if (
            lines[10].toUpperCase() !==
            'SAR'
        ) {
            return null;
        }

        const roe =
            Number(
                lines[11]
            );

        if (
            !Number.isFinite(
                roe
            ) ||
            roe <= 0
        ) {
            return null;
        }

        currencyCode =
            'SAR';

        currencyRate =
            roe;
    }

    return {
        clientSuffix:
            lines[2],

        passengerName,

        passportNo,

        visaType,

        rate,

        vendorSuffix,

        vendorAmount,

        currencyCode,

        currencyRate,
    };
}


/*
|--------------------------------------------------------------------------
| ADD VISA LINE TO EXISTING INVOICE
|--------------------------------------------------------------------------
|
| ADD
| 2379
| VISA
| PASSENGER NAME
| PPT NO
| VISA TYPE
| RATE/TRANSFER
| VENDOR CODE
| VENDOR AMOUNT
| SAR
| ROE
|--------------------------------------------------------------------------
*/

function parseAddVisaInvoiceCommand(
    text
) {
    const lines =
        String(
            text || ''
        )
            .replace(
                /\r/g,
                ''
            )
            .split('\n')
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);

    if (
        lines.length !== 9 &&
        lines.length !== 11
    ) {
        return null;
    }

    if (
        lines[0].toUpperCase() !==
        'ADD'
    ) {
        return null;
    }

    let invoiceReference =
        lines[1];

    if (
        /^INV#\d+$/i.test(
            invoiceReference
        )
    ) {
        invoiceReference =
            invoiceReference
                .substring(4)
                .trim();
    }

    if (
        !/^\d+$/.test(
            invoiceReference
        )
    ) {
        return null;
    }

    if (
        lines[2].toUpperCase() !==
        'VISA'
    ) {
        return null;
    }

    const passengerName =
        lines[3];

    const passportNo =
        lines[4];

    const visaType =
        lines[5];

    const rate =
        Number(
            lines[6]
        );

    const vendorSuffix =
        lines[7];

    const vendorAmount =
        Number(
            lines[8]
        );

    if (
        !passengerName ||
        !passportNo ||
        !visaType
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            rate
        ) ||
        rate <= 0
    ) {
        return null;
    }

    if (
        !/^\d{3}$/.test(
            vendorSuffix
        )
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            vendorAmount
        ) ||
        vendorAmount < 0
    ) {
        return null;
    }

    let currencyCode =
        null;

    let currencyRate =
        null;

    if (
        lines.length === 11
    ) {
        if (
            lines[9].toUpperCase() !==
            'SAR'
        ) {
            return null;
        }

        const roe =
            Number(
                lines[10]
            );

        if (
            !Number.isFinite(
                roe
            ) ||
            roe <= 0
        ) {
            return null;
        }

        currencyCode =
            'SAR';

        currencyRate =
            roe;
    }

    return {
        invoiceReference,

        passengerName,

        passportNo,

        visaType,

        rate,

        vendorSuffix,

        vendorAmount,

        currencyCode,

        currencyRate,
    };
}
/*
|--------------------------------------------------------------------------
| MESSAGE HANDLER
|--------------------------------------------------------------------------
*/

async function handleSelectedGroupMessage(
    message,
    remoteJid,
) {
    const text =
        extractMessageText(
            message,
        );

    if (!text) {
        return;
    }

    /*
     * ------------------------------------------------------
     * Existing Invoice / Voucher PDF commands
     * ------------------------------------------------------
     */

    const documentCommand =
        parsePdfCommand(
            text,
        );

    if (
        documentCommand
    ) {
        try {
            await sendPdf({
                remoteJid,

                type:
                    documentCommand.type,

                reference:
                    documentCommand.reference,
            });
        } catch (
            error
        ) {
            console.error(
                `[WHATSAPP] PDF command failed for ${documentCommand.type} ${documentCommand.reference}:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to generate ${
                                    documentCommand.type ===
                                    'INV'
                                        ? 'invoice'
                                        : 'voucher'
                                } ${documentCommand.reference}. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send PDF error message:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

        /*
     * ------------------------------------------------------
     * New Transfer Invoice
     * ------------------------------------------------------
     */

    const newTransferInvoiceCommand =
        parseNewTransferInvoiceCommand(
            text,
        );

    if (
        newTransferInvoiceCommand
    ) {
        try {
            await sendNewTransferInvoice({
                remoteJid,

                command:
                    newTransferInvoiceCommand,
            });
        } catch (
            error
        ) {
            console.error(
                '[WHATSAPP] New Transfer Invoice command failed:',
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to create Transfer invoice. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send Transfer invoice error:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
     * ------------------------------------------------------
     * Add Transfer line to existing Invoice
     * ------------------------------------------------------
     */

    const addTransferInvoiceCommand =
        parseAddTransferInvoiceCommand(
            text,
        );

    if (
        addTransferInvoiceCommand
    ) {
        try {
            await sendAddTransferInvoiceLine({
                remoteJid,

                command:
                    addTransferInvoiceCommand,
            });
        } catch (
            error
        ) {
            console.error(
                `[WHATSAPP] ADD Transfer line failed for Invoice ${addTransferInvoiceCommand.invoiceReference}:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to add Transfer line to Invoice ${addTransferInvoiceCommand.invoiceReference}. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send ADD Transfer error:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
 * ------------------------------------------------------
 * New Visa Invoice
 * ------------------------------------------------------
 */

const newVisaInvoiceCommand =
    parseNewVisaInvoiceCommand(
        text
    );

if (
    newVisaInvoiceCommand
) {
    try {
        await sendNewVisaInvoice({
            remoteJid,

            command:
                newVisaInvoiceCommand,
        });
    } catch (
        error
    ) {
        console.error(
            '[WHATSAPP] New Visa Invoice command failed:',
            error.message
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to create Visa invoice. ${error.message}`,
                    }
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send Visa invoice error:',
                    sendError.message
                );
            }
        }
    }

    return;
}


/*
 * ------------------------------------------------------
 * Add Visa line to existing Invoice
 * ------------------------------------------------------
 */

const addVisaInvoiceCommand =
    parseAddVisaInvoiceCommand(
        text
    );

if (
    addVisaInvoiceCommand
) {
    try {
        await sendAddVisaInvoiceLine({
            remoteJid,

            command:
                addVisaInvoiceCommand,
        });
    } catch (
        error
    ) {
        console.error(
            `[WHATSAPP] ADD Visa line failed for Invoice ${addVisaInvoiceCommand.invoiceReference}:`,
            error.message
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to add Visa line to Invoice ${addVisaInvoiceCommand.invoiceReference}. ${error.message}`,
                    }
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send ADD Visa error:',
                    sendError.message
                );
            }
        }
    }

    return;
}

        /*
     * ------------------------------------------------------
     * ADD Hotel line to existing Invoice
     * ------------------------------------------------------
     */

    const addHotelInvoiceCommand =
        parseAddHotelInvoiceCommand(
            text
        );

    if (
        addHotelInvoiceCommand
    ) {
        try {
            await sendAddHotelInvoiceLine({
                remoteJid,

                command:
                    addHotelInvoiceCommand,
            });
        } catch (
            error
        ) {
            console.error(
                `[WHATSAPP] ADD Hotel line failed for Invoice ${addHotelInvoiceCommand.invoiceReference}:`,
                error.message
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to add Hotel line to Invoice ${addHotelInvoiceCommand.invoiceReference}. ${error.message}`,
                        }
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send ADD Hotel error:',
                        sendError.message
                    );
                }
            }
        }

        return;
    }


    /*
     * ------------------------------------------------------
     * VIEW account types / accounts
     * ------------------------------------------------------
     */

    const viewCommand =
        parseViewAccountCommand(
            text,
        );

    if (
        viewCommand
    ) {
        try {
            await sendViewAccountCommand({
                remoteJid,

                command:
                    viewCommand,
            });
        } catch (
            error
        ) {
            console.error(
                '[WHATSAPP] VIEW command failed:',
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to process VIEW command. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send VIEW error:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

/*
 * ------------------------------------------------------
 * New Hotel Invoice
 * ------------------------------------------------------
 */

const newHotelInvoiceCommand =
    parseNewHotelInvoiceCommand(
        text
    );

if (
    newHotelInvoiceCommand
) {
    try {
        await sendNewHotelInvoice({
            remoteJid,

            command:
                newHotelInvoiceCommand,
        });
    } catch (
        error
    ) {
        console.error(
            '[WHATSAPP] New Hotel Invoice command failed:',
            error.message
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to create Hotel invoice. ${error.message}`,
                    }
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send Hotel invoice error:',
                    sendError.message
                );
            }
        }
    }

    return;
}



    /*
 * ------------------------------------------------------
 * New Journal Voucher
 * ------------------------------------------------------
 */

const newJournalVoucherCommand =
    parseNewJournalVoucherCommand(
        text,
    );

if (
    newJournalVoucherCommand
) {
    try {
        await sendNewJournalVoucher({
            remoteJid,

            command:
                newJournalVoucherCommand,
        });
    } catch (
        error
    ) {
        console.error(
            '[WHATSAPP] New JV command failed:',
            error.message,
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to create JV. ${error.message}`,
                    },
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send JV error:',
                    sendError.message,
                );
            }
        }
    }

    return;
}

    /*
     * ------------------------------------------------------
     * New BR / BP voucher creation
     * ------------------------------------------------------
     */

    const newVoucherCommand =
        parseNewVoucherCommand(
            text,
        );

    if (
        newVoucherCommand
    ) {
        try {
            await sendNewVoucher({
                remoteJid,

                command:
                    newVoucherCommand,
            });
        } catch (
            error
        ) {
            console.error(
                `[WHATSAPP] New ${newVoucherCommand.voucherType} voucher command failed:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to create ${newVoucherCommand.voucherType} voucher. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send voucher creation error:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
     * ------------------------------------------------------
     * Arrival / Transport Report PDF
     * ------------------------------------------------------
     */

    const otherReportCommand =
        parseOtherReportPdfCommand(
            text,
        );

    if (
        otherReportCommand
    ) {
        try {
            await sendOtherReportPdf({
                remoteJid,

                command:
                    otherReportCommand,
            });
        } catch (
            error
        ) {
            const reportLabel =
                otherReportCommand.type ===
                'ARR'
                    ? 'arrival report'
                    : 'transport report';

            console.error(
                `[WHATSAPP] ${reportLabel} PDF command failed:`,
                error.message,
            );

            if (
                sock &&
                connectionState ===
                    'connected'
            ) {
                try {
                    await sock.sendMessage(
                        remoteJid,
                        {
                            text:
                                `Unable to generate ${reportLabel} from ${otherReportCommand.dateFrom} to ${otherReportCommand.dateTo}. ${error.message}`,
                        },
                    );
                } catch (
                    sendError
                ) {
                    console.error(
                        '[WHATSAPP] Failed to send report error message:',
                        sendError.message,
                    );
                }
            }
        }

        return;
    }

    /*
     * ------------------------------------------------------
     * Ledger PDF command
     * ------------------------------------------------------
     */

    const ledgerCommand =
        parseLedgerPdfCommand(
            text,
        );

    if (
        !ledgerCommand
    ) {
        return;
    }

    try {
        await sendLedgerPdf({
            remoteJid,

            command:
                ledgerCommand,
        });
    } catch (
        error
    ) {
        console.error(
            `[WHATSAPP] Ledger PDF command failed for account ${ledgerCommand.accountSuffix}:`,
            error.message,
        );

        if (
            sock &&
            connectionState ===
                'connected'
        ) {
            try {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text:
                            `Unable to generate ledger for account ${ledgerCommand.accountSuffix} from ${ledgerCommand.dateFrom} to ${ledgerCommand.dateTo}. ${error.message}`,
                    },
                );
            } catch (
                sendError
            ) {
                console.error(
                    '[WHATSAPP] Failed to send ledger PDF error message:',
                    sendError.message,
                );
            }
        }
    }
}


/*
|--------------------------------------------------------------------------
| SEND NEW JV
|--------------------------------------------------------------------------
*/

async function sendNewJournalVoucher({
    remoteJid,
    command,
}) {
    console.log(
        `[WHATSAPP] Creating JV with ${command.lines.length} lines`,
    );

    const result =
        await createJournalVoucherFromWhatsApp(
            command,
        );

    const voucher =
        result.voucher;

    const debit =
        Number(
            voucher.total_debit ||
            0,
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            },
        );

    const credit =
        Number(
            voucher.total_credit ||
            0,
        ).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            },
        );

    await sock.sendMessage(
        remoteJid,
        {
            text:
                [
                    '✅ Journal Voucher created successfully.',
                    '',
                    `JV #${voucher.voucher_no}`,
                    `Date: ${voucher.voucher_date}`,
                    `Lines: ${command.lines.length}`,
                    `Debit: ${debit}`,
                    `Credit: ${credit}`,
                    'Status: Balanced',
                ].join('\n'),
        },
    );

    console.log(
        `[WHATSAPP] Created JV #${voucher.voucher_no} for ${remoteJid}`,
    );
}

/*
|--------------------------------------------------------------------------
| START SOCKET
|--------------------------------------------------------------------------
*/

async function startSocket() {
    if (
        starting ||
        (
            sock &&
            connectionState ===
                'connected'
        )
    ) {
        return;
    }

    starting =
        true;

    stopRequested =
        false;

    const token =
        ++lifecycleToken;

    try {
        clearReconnectTimer();

        await fsp.mkdir(
            AUTH_DIR,
            {
                recursive:
                    true,
            },
        );

        await fsp.mkdir(
            DATA_DIR,
            {
                recursive:
                    true,
            },
        );

        await fsp.mkdir(
            DOWNLOAD_DIR,
            {
                recursive:
                    true,
            },
        );

        /*
         * Official multi-file auth.
         */
        const {
            state,
            saveCreds,
        } =
            await useMultiFileAuthState(
                AUTH_DIR,
            );

        authState =
            state;

        /*
         * Current Baileys pattern:
         *
         * cache the Signal key store.
         *
         * This is important for correct Signal state handling.
         */
        const logger =
            pino({
                level:
                    process.env
                        .WHATSAPP_LOG_LEVEL ||
                    'info',
            });

        const cachedKeys =
            makeCacheableSignalKeyStore(
                state.keys,
                logger,
            );

        /*
         * Get current WhatsApp Web version.
         */
        const {
            version,
            isLatest,
        } =
            await fetchLatestBaileysVersion();

        console.log(
            `[WhatsApp] Using WA Web v${version.join(
                '.',
            )} ${
                isLatest
                    ? '(latest)'
                    : '(not latest)'
            }`,
        );

        connectionState =
            'connecting';

        connectionMessage =
            'Connecting to WhatsApp…';

        qrDataUrl =
            null;

        /*
         * IMPORTANT:
         *
         * We intentionally DO NOT specify:
         *
         * shouldSyncHistoryMessage
         *
         * because current LID mapping depends on the normal
         * sync pipeline.
         *
         * syncFullHistory remains false because we do not need
         * old WhatsApp messages.
         */
        const nextSocket =
            makeWASocket({
                version,

                auth:
                    {
                        creds:
                            state.creds,

                        keys:
                            cachedKeys,
                    },

                browser:
                    Browsers.ubuntu(
                        'Chrome',
                    ),

                logger,

                msgRetryCounterCache,

                maxMsgRetryCount:
                    5,

                getMessage:
                    async (
                        key,
                    ) =>
                        await getRecentOutgoingMessage(
                            key,
                        ),

                cachedGroupMetadata:
                    async (
                        jid,
                    ) =>
                        getCachedGroupMetadata(
                            jid,
                        ),

                syncFullHistory:
                    false,

                fireInitQueries:
                    true,

                emitOwnEvents:
                    true,

                markOnlineOnConnect:
                    false,

                connectTimeoutMs:
                    60000,

                defaultQueryTimeoutMs:
                    60000,

                keepAliveIntervalMs:
                    25000,

                retryRequestDelayMs:
                    500,

                qrTimeout:
                    60000,
            });

        sock =
            nextSocket;

        /*
         * Save all credential/key updates.
         */
        nextSocket.ev.on(
            'creds.update',
            saveCreds,
        );


        /*
         * ========================================================
         * LID MAPPING
         * ========================================================
         *
         * Current Baileys handles actual mapping internally.
         *
         * We only log it for diagnostics.
         */
        nextSocket.ev.on(
            'lid-mapping.update',
            (
                update,
            ) => {
                console.log(
                    '[WhatsApp] LID mapping update:',
                    JSON.stringify(
                        update,
                    ),
                );
            },
        );


        /*
         * ========================================================
         * CONNECTION
         * ========================================================
         */

        nextSocket.ev.on(
            'connection.update',
            async (
                update,
            ) => {
                if (
                    token !==
                    lifecycleToken
                ) {
                    return;
                }

                const {
                    connection,
                    qr,
                    lastDisconnect,
                } =
                    update;

                /*
                 * QR
                 */
                if (
                    qr
                ) {
                    try {
                        qrDataUrl =
                            await QRCode.toDataURL(
                                qr,
                                {
                                    width:
                                        360,

                                    margin:
                                        2,

                                    errorCorrectionLevel:
                                        'M',
                                },
                            );
                    } catch (
                        error
                    ) {
                        console.error(
                            `[WhatsApp] QR generation failed: ${error.message}`,
                        );

                        qrDataUrl =
                            null;
                    }

                    connectionState =
                        'qr';

                    connectionMessage =
                        'Scan this QR code with WhatsApp.';
                }


                /*
                 * OPEN
                 */
                if (
                    connection ===
                    'open'
                ) {
                    connectionState =
                        'connected';

                    connectionMessage =
                        'WhatsApp connected successfully.';

                    qrDataUrl =
                        null;

                    groupsLoadedAt =
                        0;

                    console.log(
                        '[WhatsApp] Socket connected successfully.',
                    );

                    /*
                     * One bulk query.
                     *
                     * No full old history processing.
                     */
                    try {
                        await refreshGroups(
                            true,
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `[WhatsApp] Group load failed: ${error.message}`,
                        );
                    }

                    /*
                     * Verify selected group.
                     */
                    if (
                        config.selectedGroupJid
                    ) {
                        const selected =
                            groups.find(
                                (
                                    group,
                                ) =>
                                    group.jid ===
                                    config.selectedGroupJid,
                            );

                        if (
                            selected
                        ) {
                            config.selectedGroupName =
                                selected.name;

                            writeConfig(
                                config,
                            );

                            /*
                             * Only selected group.
                             */
                            await ensureSelectedGroupMetadata(
                                false,
                            );

                            console.log(
                                `[WhatsApp] Selected group active: ${selected.name}`,
                            );
                        } else {
                            config.selectedGroupJid =
                                null;

                            config.selectedGroupName =
                                null;

                            config.updatedAt =
                                new Date().toISOString();

                            writeConfig(
                                config,
                            );

                            console.log(
                                '[WhatsApp] Previous selected group is not present; selection cleared.',
                            );
                        }
                    }
                }


                /*
                 * CLOSE
                 */
                if (
                    connection ===
                    'close'
                ) {
                    sock =
                        null;

                    authState =
                        null;

                    qrDataUrl =
                        null;

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode ??
                        lastDisconnect
                            ?.error
                            ?.statusCode ??
                        null;

                    const message =
                        lastDisconnect
                            ?.error
                            ?.message ||
                        String(
                            lastDisconnect
                                ?.error ||
                                'Unknown disconnect',
                        );

                    console.error(
                        `[WhatsApp] Connection closed. status=${
                            statusCode ??
                            'unknown'
                        } message=${message}`,
                    );

                    if (
                        stopRequested
                    ) {
                        connectionState =
                            'disconnected';

                        connectionMessage =
                            'WhatsApp session stopped.';

                        return;
                    }

                    if (
                        statusCode ===
                        DisconnectReason.loggedOut
                    ) {
                        connectionState =
                            'logged_out';

                        connectionMessage =
                            'WhatsApp logged out. Clear session and scan again.';

                        return;
                    }

                    if (
                        statusCode ===
                        405
                    ) {
                        connectionState =
                            'error';

                        connectionMessage =
                            'WhatsApp rejected the Web client version. Refreshing version and reconnecting…';
                    } else if (
                        statusCode ===
                        408
                    ) {
                        connectionState =
                            'reconnecting';

                        connectionMessage =
                            'WhatsApp connection timed out. Reconnecting…';
                    } else if (
                        statusCode ===
                        428
                    ) {
                        connectionState =
                            'reconnecting';

                        connectionMessage =
                            'WhatsApp closed the Web session. Reconnecting…';
                    } else {
                        connectionState =
                            'reconnecting';

                        connectionMessage =
                            `WhatsApp connection closed${
                                statusCode
                                    ? ` (${statusCode})`
                                    : ''
                            }. Reconnecting…`;
                    }

                    clearReconnectTimer();

                    reconnectTimer =
                        setTimeout(
                            () => {
                                startSocket()
                                    .catch(
                                        (
                                            error,
                                        ) =>
                                            console.error(
                                                `[WhatsApp] Reconnect failed: ${error.message}`,
                                            ),
                                    );
                            },
                            3000,
                        );
                }
            },
        );


        /*
         * ========================================================
         * INCOMING MESSAGES
         * ========================================================
         */

        nextSocket.ev.on(
            'messages.upsert',
            async ({
                messages,
                type,
            }) => {
                if (
                    token !==
                        lifecycleToken ||
                    type !==
                        'notify'
                ) {
                    return;
                }

                for (
                    const message of
                        messages ||
                        []
                ) {
                    if (
                        !message?.message
                    ) {
                        continue;
                    }

                    if (
                        message?.key
                            ?.fromMe
                    ) {
                        continue;
                    }

                    const remoteJid =
                        String(
                            message?.key
                                ?.remoteJid ||
                                '',
                        );

                    if (
                        !remoteJid.endsWith(
                            '@g.us',
                        )
                    ) {
                        continue;
                    }

                    /*
                     * ONLY selected group.
                     */
                    if (
                        !config.selectedGroupJid ||
                        remoteJid !==
                            config.selectedGroupJid
                    ) {
                        continue;
                    }

                    const text =
                        extractMessageText(
                            message,
                        );

                    if (
                        text
                    ) {
                        console.log(
                            `[WHATSAPP] Selected group message from ${remoteJid}: ${text.slice(
                                0,
                                500,
                            )}`,
                        );
                    }

                    await handleSelectedGroupMessage(
                        message,
                        remoteJid,
                    );
                }
            },
        );


        /*
         * ========================================================
         * MESSAGE UPDATES
         * ========================================================
         */

        nextSocket.ev.on(
            'messages.update',
            (
                updates,
            ) => {
                for (
                    const update of
                        updates ||
                        []
                ) {
                    const id =
                        update
                            ?.key
                            ?.id;

                    if (
                        id
                    ) {
                        console.log(
                            `[WhatsApp] Message update id=${id} status=${
                                update
                                    ?.update
                                    ?.status ??
                                'unknown'
                            }`,
                        );
                    }
                }
            },
        );


        /*
         * ========================================================
         * GROUP UPDATES
         * ========================================================
         */

        nextSocket.ev.on(
            'groups.update',
            (
                updates,
            ) => {
                /*
                 * Do not query every group.
                 *
                 * Only invalidate selected group cache.
                 */
                for (
                    const update of
                        updates ||
                        []
                ) {
                    if (
                        update?.id ===
                        config.selectedGroupJid
                    ) {
                        groupMetadataCache.delete(
                            update.id,
                        );
                    }
                }
            },
        );


        /*
         * ========================================================
         * PARTICIPANT UPDATE
         * ========================================================
         */

        nextSocket.ev.on(
            'group-participants.update',
            async (
                event,
            ) => {
                const jid =
                    String(
                        event?.id ||
                            '',
                    );

                if (
                    !jid ||
                    jid !==
                        config.selectedGroupJid
                ) {
                    return;
                }

                groupMetadataCache.delete(
                    jid,
                );

                /*
                 * Only selected group.
                 */
                await ensureSelectedGroupMetadata(
                    true,
                );

                /*
                 * Participant/device change:
                 * clear the sender-key memory so the next
                 * group message distributes fresh sender state.
                 */
                await resetSelectedGroupSenderKey(
                    jid,
                );
            },
        );
    } catch (
        error
    ) {
        sock =
            null;

        authState =
            null;

        connectionState =
            'error';

        connectionMessage =
            `WhatsApp service error: ${error.message}`;

        console.error(
            '[WhatsApp] Socket start failed:',
            error.stack ||
                error,
        );

        if (
            !stopRequested &&
            token ===
                lifecycleToken
        ) {
            clearReconnectTimer();

            reconnectTimer =
                setTimeout(
                    () => {
                        startSocket()
                            .catch(
                                (
                                    retryError,
                                ) =>
                                    console.error(
                                        `[WhatsApp] Retry failed: ${retryError.message}`,
                                    ),
                            );
                    },
                    3000,
                );
        }
    } finally {
        starting =
            false;
    }
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

/*
|--------------------------------------------------------------------------
| STOP SOCKET
|--------------------------------------------------------------------------
*/

async function stopSocket({
    logout = false,
    clearAuth = false,
} = {}) {
    stopRequested =
        true;

    lifecycleToken +=
        1;

    clearReconnectTimer();

    const current =
        sock;

    sock =
        null;

    authState =
        null;

    if (
        current
    ) {
        try {
            if (
                logout &&
                typeof current.logout ===
                    'function'
            ) {
                await Promise.race([
                    current.logout(),

                    new Promise(
                        (
                            resolve,
                        ) =>
                            setTimeout(
                                resolve,
                                5000,
                            ),
                    ),
                ]);
            }
        } catch (
            error
        ) {
            console.warn(
                `[WhatsApp] Logout warning: ${error.message}`,
            );
        }
    }

    if (
        clearAuth
    ) {
        await removeAuthDirectory();
    }

    groupMetadataCache.clear();

    groups =
        [];

    groupsLoadedAt =
        0;

    qrDataUrl =
        null;

    connectionState =
        'disconnected';

    connectionMessage =
        clearAuth
            ? 'Session cleared. Waiting for a fresh QR code.'
            : 'WhatsApp session stopped.';
}


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

app.get(
    '/status',
    (
        _req,
        res,
    ) => {
        res.json(
            publicStatus(),
        );
    },
);


app.get(
    '/groups',
    async (
        _req,
        res,
    ) => {
        try {
            if (
                connectionState ===
                'connected'
            ) {
                await refreshGroups(
                    false,
                );
            }

            return res.json({
                ok:
                    true,

                groups,
            });
        } catch (
            error
        ) {
            return res.status(
                503,
            ).json({
                ok:
                    false,

                message:
                    error.message,

                groups,
            });
        }
    },
);


app.post(
    '/refresh-groups',
    async (
        _req,
        res,
    ) => {
        try {
            await refreshGroups(
                true,
            );

            return res.json({
                ok:
                    true,

                groups,
            });
        } catch (
            error
        ) {
            return res.status(
                503,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


app.post(
    '/select-group',
    async (
        req,
        res,
    ) => {
        const jid =
            String(
                req.body?.jid ||
                    '',
            ).trim();

        if (
            !jid ||
            !jid.endsWith(
                '@g.us',
            )
        ) {
            return res.status(
                422,
            ).json({
                ok:
                    false,

                message:
                    'A valid WhatsApp group JID is required.',
            });
        }

        try {
            if (
                connectionState !==
                'connected'
            ) {
                return res.status(
                    503,
                ).json({
                    ok:
                        false,

                    message:
                        'WhatsApp is not connected.',
                });
            }

            await refreshGroups(
                false,
            );

            const group =
                groups.find(
                    (
                        item,
                    ) =>
                        item.jid ===
                        jid,
                );

            if (
                !group
            ) {
                return res.status(
                    404,
                ).json({
                    ok:
                        false,

                    message:
                        'Group not found.',
                });
            }

            config = {
                ...config,

                selectedGroupJid:
                    group.jid,

                selectedGroupName:
                    group.name,

                updatedAt:
                    new Date().toISOString(),
            };

            writeConfig(
                config,
            );

            await ensureSelectedGroupMetadata(
                true,
            );

            await resetSelectedGroupSenderKey(
                group.jid,
            );

            connectionMessage =
                `Listening only to: ${group.name}`;

            return res.json({
                ok:
                    true,

                selectedGroup:
                    {
                        jid:
                            group.jid,

                        name:
                            group.name,
                    },
            });
        } catch (
            error
        ) {
            return res.status(
                503,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| TEST MESSAGE
|--------------------------------------------------------------------------
*/

app.post(
    '/test-message',
    async (
        _req,
        res,
    ) => {
        try {
            if (
                connectionState !==
                    'connected' ||
                !sock
            ) {
                return res.status(
                    503,
                ).json({
                    ok:
                        false,

                    message:
                        'WhatsApp is not connected.',
                });
            }

            if (
                !config.selectedGroupJid
            ) {
                return res.status(
                    422,
                ).json({
                    ok:
                        false,

                    message:
                        'No selected WhatsApp group.',
                });
            }

            await ensureSelectedGroupMetadata(
                false,
            );

            const sent =
                await sock.sendMessage(
                    config.selectedGroupJid,
                    {
                        text:
                            `HBA BOT TEST ${new Date().toISOString()}`,
                    },
                    {
                        useUserDevicesCache:
                            false,

                        useCachedGroupMetadata:
                            true,
                    },
                );

            rememberOutgoingMessage(
                sent,
            );

            return res.json({
                ok:
                    true,

                messageId:
                    sent?.key
                        ?.id ||
                    null,
            });
        } catch (
            error
        ) {
            return res.status(
                500,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

app.post(
    '/logout',
    async (
        _req,
        res,
    ) => {
        try {
            await stopSocket({
                logout:
                    true,

                clearAuth:
                    false,
            });

            config = {
                ...config,

                selectedGroupJid:
                    null,

                selectedGroupName:
                    null,

                updatedAt:
                    new Date().toISOString(),
            };

            writeConfig(
                config,
            );

            return res.json({
                ok:
                    true,

                message:
                    'WhatsApp logged out.',
            });
        } catch (
            error
        ) {
            return res.status(
                500,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| CLEAR SESSION
|--------------------------------------------------------------------------
*/

app.post(
    '/clear-session',
    async (
        _req,
        res,
    ) => {
        try {
            await stopSocket({
                logout:
                    true,

                clearAuth:
                    true,
            });

            config = {
                ...config,

                selectedGroupJid:
                    null,

                selectedGroupName:
                    null,

                updatedAt:
                    new Date().toISOString(),
            };

            writeConfig(
                config,
            );

            groups =
                [];

            groupsLoadedAt =
                0;

            setTimeout(
                () => {
                    startSocket()
                        .catch(
                            (
                                error,
                            ) =>
                                console.error(
                                    `[WhatsApp] Fresh session start failed: ${error.message}`,
                                ),
                        );
                },
                500,
            );

            return res.json({
                ok:
                    true,

                message:
                    'WhatsApp session cleared. Waiting for fresh QR.',
            });
        } catch (
            error
        ) {
            return res.status(
                500,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| REPAIR SIGNAL
|--------------------------------------------------------------------------
|
| This preserves creds.json but removes volatile 6.x Signal
| session files. With the v7 migration we generally prefer a
| clean re-link, but this endpoint is retained for diagnostics.
|--------------------------------------------------------------------------
*/

app.post(
    '/repair-signal',
    async (
        _req,
        res,
    ) => {
        try {
            await stopSocket({
                logout:
                    false,

                clearAuth:
                    false,
            });

            /*
             * For the new LID-aware architecture we do NOT
             * automatically remove the v7 session here.
             *
             * A clean re-link should use /clear-session.
             */
            return res.json({
                ok:
                    true,

                message:
                    'Signal repair endpoint retained. For a full LID migration, use Clear Session and pair the device again.',
            });
        } catch (
            error
        ) {
            return res.status(
                500,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

app.post(
    '/start',
    async (
        _req,
        res,
    ) => {
        try {
            await startSocket();

            return res.json(
                publicStatus(),
            );
        } catch (
            error
        ) {
            return res.status(
                500,
            ).json({
                ok:
                    false,

                message:
                    error.message,
            });
        }
    },
);


/*
|--------------------------------------------------------------------------
| START HTTP SERVER
|--------------------------------------------------------------------------
*/

app.listen(
    PORT,
    HOST,
    () => {
        console.log(
            `HBA ERP WhatsApp service listening on http://${HOST}:${PORT}`,
        );

        startSocket()
            .catch(
                (
                    error,
                ) =>
                    console.error(
                        `[WhatsApp] Initial start failed: ${error.message}`,
                    ),
            );
    },
);


/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

process.on(
    'SIGINT',
    async () => {
        await stopSocket({
            logout:
                false,

            clearAuth:
                false,
        });

        process.exit(
            0,
        );
    },
);


process.on(
    'SIGTERM',
    async () => {
        await stopSocket({
            logout:
                false,

            clearAuth:
                false,
        });

        process.exit(
            0,
        );
    },
);