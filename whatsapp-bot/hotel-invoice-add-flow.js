'use strict';

const OpenAI = require('openai');

const AI_MODEL =
    process.env.OPENAI_MODEL ||
    'gpt-5.6-luna';

const openai =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY,
    });

const MONTHS = {
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

const DOCUMENT_SCHEMA = {
    type: 'object',

    additionalProperties:
        false,

    properties: {
        document_type: {
            type: 'string',
            enum: [
                'hotel_invoice_add',
            ],
        },

        invoice_reference: {
            type: [
                'string',
                'null',
            ],
        },

        vendor_name_raw: {
            type: [
                'string',
                'null',
            ],
        },

        vendor_suffix: {
            type: [
                'string',
                'null',
            ],
        },

        passenger_name: {
            type: [
                'string',
                'null',
            ],
        },

        hotel_name: {
            type: [
                'string',
                'null',
            ],
        },

        room_type: {
            type: [
                'string',
                'null',
            ],
        },

        meal: {
            type: [
                'string',
                'null',
            ],
        },

        check_in: {
            type: [
                'string',
                'null',
            ],
        },

        check_out: {
            type: [
                'string',
                'null',
            ],
        },

        nights: {
            type: [
                'integer',
                'null',
            ],
        },

        room_quantity: {
            type: [
                'integer',
                'null',
            ],
        },

        rate: {
            type: [
                'number',
                'null',
            ],
        },

        vendor_rate: {
            type: [
                'number',
                'null',
            ],
        },

        currency_code: {
            type: [
                'string',
                'null',
            ],
        },

        currency_rate: {
            type: [
                'number',
                'null',
            ],
        },
    },

    required: [
        'document_type',
        'invoice_reference',
        'vendor_name_raw',
        'vendor_suffix',
        'passenger_name',
        'hotel_name',
        'room_type',
        'meal',
        'check_in',
        'check_out',
        'nights',
        'room_quantity',
        'rate',
        'vendor_rate',
        'currency_code',
        'currency_rate',
    ],
};

const SYSTEM_PROMPT = `
You extract structured information for HBA ERP's ADD HOTEL LINE operation.

This operation ADDS ONE HOTEL LINE TO AN EXISTING INVOICE.

IMPORTANT:
- The invoice already exists.
- DO NOT ask for a client code.
- DO NOT extract or invent a client code.
- The invoice number is the existing invoice reference.
- Extract only information actually supplied by the user.
- Never invent a vendor code, rate, date, room quantity, passenger, hotel,
  exchange rate, or invoice number.
- Preserve previous draft values when the newest message does not change them.

Fields:

invoice_reference:
The existing invoice number.
Examples:
"2469"
"invoice 2469"
"INV#2469"

vendor_name_raw:
Vendor name if supplied.
Example:
"arabian"

vendor_suffix:
3-digit vendor code only when explicitly supplied or already present
in the existing draft.
Do not invent it from a vendor name.

passenger_name:
Passenger/traveler name.

hotel_name:
Hotel name.

room_type:
Room type such as Double, Triple, Quad, Suite.

meal:
Meal plan such as RO, BB, HB, FB.

check_in:
Check-in date.

check_out:
Check-out date.

nights:
Number of nights if explicitly supplied.
Otherwise leave null so the server can calculate it.

room_quantity:
Number of rooms.
Example:
"2 QUAD" means:
room_quantity = 2
room_type = "Quad"

rate:
SELLING rate per room per night.

vendor_rate:
BUYING/vendor rate per room per night.

currency_code:
Currency if explicitly stated.

currency_rate:
ROE / exchange rate if supplied.

Examples:

"sell 250"
=> rate = 250

"buy arabian 200"
=> vendor_name_raw = "arabian"
=> vendor_rate = 200

"2 QUAD"
=> room_quantity = 2
=> room_type = "Quad"

"13-15 aug"
=> check_in = "13 Aug"
=> check_out = "15 Aug"

"76.5"
=> currency_rate = 76.5

When an exchange rate is supplied without another currency name,
leave currency_code null. The server will treat a standalone ROE
as SAR.

Return only the structured JSON object.
`;

function cleanString(
    value,
) {
    return String(
        value ?? '',
    ).trim();
}

function toNumber(
    value,
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number =
        Number(
            String(value)
                .replace(/,/g, '')
                .trim(),
        );

    return Number.isFinite(
        number,
    )
        ? number
        : null;
}

function normalizeInvoiceReference(
    value,
) {
    const text =
        cleanString(value)
            .replace(
                /^INV\s*#?/i,
                '',
            )
            .trim();

    return /^\d+$/.test(text)
        ? text
        : null;
}

function normalizeVendorSuffix(
    value,
) {
    const text =
        cleanString(value)
            .replace(
                /^VE\s*/i,
                '',
            )
            .trim();

    return /^\d{3}$/.test(text)
        ? text
        : null;
}

function normalizeCurrencyCode(
    value,
) {
    const text =
        cleanString(value)
            .toUpperCase();

    return text || null;
}

function normalizeMeal(
    value,
) {
    const text =
        cleanString(value)
            .toUpperCase();

    return text || null;
}

function normalizeRoomType(
    value,
) {
    const text =
        cleanString(value);

    return text || null;
}

function mergeDraft(
    existingDraft,
    extracted,
) {
    const existing =
        existingDraft &&
        typeof existingDraft ===
            'object'
            ? existingDraft
            : {};

    const result = {
        ...existing,

        document_type:
            'hotel_invoice_add',
    };

    for (
        const key of Object.keys(
            DOCUMENT_SCHEMA.properties,
        )
    ) {
        if (
            key ===
            'document_type'
        ) {
            continue;
        }

        const value =
            extracted?.[key];

        if (
            value !== null &&
            value !== undefined &&
            cleanString(value) !== ''
        ) {
            result[key] =
                value;
        }
    }

    return result;
}

function normalizeSearchText(
    value,
) {
    return cleanString(value)
        .toLowerCase()
        .replace(
            /&/g,
            ' and ',
        )
        .replace(
            /[^a-z0-9]+/g,
            ' ',
        )
        .replace(
            /\s+/g,
            ' ',
        )
        .trim();
}

function scoreVendor(
    query,
    account,
) {
    const q =
        normalizeSearchText(
            query,
        );

    const name =
        normalizeSearchText(
            account?.name,
        );

    const last3 =
        cleanString(
            account?.last3,
        );

    const code =
        cleanString(
            account?.code,
        );

    if (
        !q ||
        !name
    ) {
        return 0;
    }

    if (
        q === name
    ) {
        return 1;
    }

    if (
        q === last3 ||
        q === code
    ) {
        return 1;
    }

    if (
        name.startsWith(q)
    ) {
        return 0.92;
    }

    if (
        name.includes(q)
    ) {
        return 0.84;
    }

    const qTokens =
        q
            .split(' ')
            .filter(Boolean);

    const nTokens =
        name
            .split(' ')
            .filter(Boolean);

    if (
        qTokens.length === 0 ||
        nTokens.length === 0
    ) {
        return 0;
    }

    let matches = 0;

    for (
        const token of qTokens
    ) {
        if (
            nTokens.includes(
                token,
            )
        ) {
            matches += 1;
        }
    }

    return (
        matches /
        Math.max(
            qTokens.length,
            nTokens.length,
        )
    );
}

async function fetchVendorAccounts(
    options,
) {
    const erpBaseUrl =
        cleanString(
            options?.erpBaseUrl,
        ).replace(
            /\/$/,
            '',
        );

    const botToken =
        cleanString(
            options?.botToken,
        );

    if (
        !erpBaseUrl
    ) {
        throw new Error(
            'ERP_BASE_URL is not configured.',
        );
    }

    if (
        !botToken
    ) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const response =
        await fetch(
            `${erpBaseUrl}/api/whatsapp-bot/accounts/type/VE`,
            {
                method:
                    'GET',

                headers: {
                    Accept:
                        'application/json',

                    Authorization:
                        `Bearer ${botToken}`,
                },
            },
        );

    const body =
        Buffer.from(
            await response.arrayBuffer(),
        );

    const bodyText =
        body
            .toString(
                'utf8',
            )
            .replace(
                /^\uFEFF/,
                '',
            );

    if (
        !response.ok
    ) {
        throw new Error(
            `Unable to load vendor accounts. ERP returned HTTP ${response.status}: ${bodyText
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 800)}`,
        );
    }

    let parsed;

    try {
        parsed =
            JSON.parse(
                bodyText,
            );
    } catch (
        error
    ) {
        throw new Error(
            `Vendor account response was not valid JSON: ${error.message}`,
        );
    }

    return Array.isArray(
        parsed?.accounts,
    )
        ? parsed.accounts
        : [];
}

async function resolveVendor(
    draft,
    options,
) {
    const numeric =
        normalizeVendorSuffix(
            draft.vendor_suffix,
        );

    if (
        numeric
    ) {
        return {
            draft: {
                ...draft,

                vendor_suffix:
                    numeric,
            },

            message:
                null,
        };
    }

    const rawName =
        cleanString(
            draft.vendor_name_raw,
        );

    if (
        !rawName
    ) {
        return {
            draft,

            message:
                'Please provide the vendor name or vendor code (3 digits).',
        };
    }

    const accounts =
        await fetchVendorAccounts(
            options,
        );

    const ranked =
        accounts
            .map(
                (account) => ({
                    account,

                    score:
                        scoreVendor(
                            rawName,
                            account,
                        ),
                }),
            )
            .filter(
                (item) =>
                    item.score > 0,
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score,
            );

    const best =
        ranked[0] || null;

    const second =
        ranked[1] || null;

    if (
        !best ||
        best.score < 0.55 ||
        (
            second &&
            best.score < 0.9 &&
            best.score -
                second.score <
                0.08
        )
    ) {
        return {
            draft: {
                ...draft,

                vendor_suffix:
                    null,
            },

            message:
                'I could not uniquely match that vendor. Please provide the vendor code (3 digits).',
        };
    }

    const resolvedSuffix =
        cleanString(
            best.account?.last3,
        ) ||
        cleanString(
            best.account?.code,
        ).slice(-3);

    if (
        !/^\d{3}$/.test(
            resolvedSuffix,
        )
    ) {
        return {
            draft: {
                ...draft,

                vendor_suffix:
                    null,
            },

            message:
                'I found the vendor but could not determine its 3-digit code. Please provide the vendor code (3 digits).',
        };
    }

    return {
        draft: {
            ...draft,

            vendor_suffix:
                resolvedSuffix,

            vendor_name:
                cleanString(
                    best.account?.name,
                ) ||
                rawName,
        },

        message:
            null,
    };
}

function normalizeYear(
    value,
) {
    const year =
        Number(value);

    if (
        year >= 0 &&
        year < 100
    ) {
        return 2000 + year;
    }

    return year;
}

function inferYear(
    month,
    day,
    referenceDate,
    forcedYear = null,
) {
    if (
        Number.isInteger(
            forcedYear,
        )
    ) {
        return forcedYear;
    }

    const ref =
        referenceDate instanceof Date
            ? referenceDate
            : new Date();

    const candidate =
        new Date(
            ref.getFullYear(),
            month,
            day,
        );

    const today =
        new Date(
            ref.getFullYear(),
            ref.getMonth(),
            ref.getDate(),
        );

    return candidate <
        today
        ? ref.getFullYear() + 1
        : ref.getFullYear();
}

function createValidDate(
    year,
    month,
    day,
) {
    const date =
        new Date(
            year,
            month,
            day,
        );

    if (
        date.getFullYear() !==
            year ||
        date.getMonth() !==
            month ||
        date.getDate() !==
            day
    ) {
        return null;
    }

    return date;
}

function parseDate(
    value,
    referenceDate,
    forcedYear = null,
) {
    const raw =
        cleanString(value)
            .replace(
                /,/g,
                ' ',
            )
            .replace(
                /[–—]/g,
                '-',
            )
            .replace(
                /\s+/g,
                ' ',
            )
            .trim();

    if (!raw) {
        return null;
    }

    const iso =
        raw.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        );

    if (
        iso
    ) {
        return createValidDate(
            Number(iso[1]),
            Number(iso[2]) - 1,
            Number(iso[3]),
        );
    }

    const numeric =
        raw.match(
            /^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/,
        );

    if (
        numeric
    ) {
        const day =
            Number(
                numeric[1],
            );

        const month =
            Number(
                numeric[2],
            ) - 1;

        const year =
            numeric[3]
                ? normalizeYear(
                      numeric[3],
                  )
                : inferYear(
                      month,
                      day,
                      referenceDate,
                      forcedYear,
                  );

        return createValidDate(
            year,
            month,
            day,
        );
    }

    const dayMonth =
        raw.match(
            /^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{2,4}))?$/,
        );

    if (
        dayMonth
    ) {
        const day =
            Number(
                dayMonth[1],
            );

        const month =
            MONTHS[
                dayMonth[2]
                    .slice(0, 3)
                    .toUpperCase()
            ];

        if (
            month ===
            undefined
        ) {
            return null;
        }

        const year =
            dayMonth[3]
                ? normalizeYear(
                      dayMonth[3],
                  )
                : inferYear(
                      month,
                      day,
                      referenceDate,
                      forcedYear,
                  );

        return createValidDate(
            year,
            month,
            day,
        );
    }

    const monthDay =
        raw.match(
            /^([A-Za-z]{3,9})\s+(\d{1,2})(?:\s+(\d{2,4}))?$/,
        );

    if (
        monthDay
    ) {
        const month =
            MONTHS[
                monthDay[1]
                    .slice(0, 3)
                    .toUpperCase()
            ];

        const day =
            Number(
                monthDay[2],
            );

        if (
            month ===
            undefined
        ) {
            return null;
        }

        const year =
            monthDay[3]
                ? normalizeYear(
                      monthDay[3],
                  )
                : inferYear(
                      month,
                      day,
                      referenceDate,
                      forcedYear,
                  );

        return createValidDate(
            year,
            month,
            day,
        );
    }

    return null;
}

function toISO(
    date,
) {
    if (
        !date
    ) {
        return null;
    }

    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1,
        ).padStart(
            2,
            '0',
        ),

        String(
            date.getDate(),
        ).padStart(
            2,
            '0',
        ),
    ].join('-');
}

function addDays(
    isoDate,
    days,
) {
    const date =
        new Date(
            `${isoDate}T00:00:00`,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return null;
    }

    date.setDate(
        date.getDate() +
            Number(days),
    );

    return toISO(date);
}

function dateDifference(
    fromIso,
    toIso,
) {
    const from =
        new Date(
            `${fromIso}T00:00:00`,
        );

    const to =
        new Date(
            `${toIso}T00:00:00`,
        );

    if (
        Number.isNaN(
            from.getTime(),
        ) ||
        Number.isNaN(
            to.getTime(),
        )
    ) {
        return null;
    }

    return Math.round(
        (
            to.getTime() -
            from.getTime()
        ) /
            86400000,
    );
}

function normalizeDates(
    draft,
    referenceDate,
) {
    const result = {
        ...draft,
    };

    let checkIn =
        parseDate(
            draft.check_in,
            referenceDate,
        );

    let checkOut =
        parseDate(
            draft.check_out,
            referenceDate,
            checkIn
                ? checkIn.getFullYear()
                : null,
        );

    if (
        checkIn
    ) {
        result.check_in =
            toISO(
                checkIn,
            );
    } else {
        result.check_in =
            null;
    }

    if (
        checkOut
    ) {
        if (
            checkIn &&
            checkOut <=
                checkIn
        ) {
            const nextYear =
                createValidDate(
                    checkOut.getFullYear() +
                        1,
                    checkOut.getMonth(),
                    checkOut.getDate(),
                );

            if (
                nextYear
            ) {
                checkOut =
                    nextYear;
            }
        }

        result.check_out =
            toISO(
                checkOut,
            );
    } else {
        result.check_out =
            null;
    }

    let nights =
        Number.isInteger(
            Number(
                draft.nights,
            ),
        ) &&
        Number(
            draft.nights,
        ) > 0
            ? Number(
                  draft.nights,
              )
            : null;

    if (
        checkIn &&
        checkOut
    ) {
        const calculated =
            dateDifference(
                toISO(
                    checkIn,
                ),
                toISO(
                    checkOut,
                ),
            );

        if (
            calculated &&
            calculated > 0
        ) {
            nights =
                calculated;
        }
    }

    if (
        checkIn &&
        nights &&
        !checkOut
    ) {
        result.check_out =
            addDays(
                toISO(
                    checkIn,
                ),
                nights,
            );
    }

    result.nights =
        nights;

    return result;
}

function normalizeDraft(
    draft,
    referenceDate,
) {
    const result = {
        ...draft,

        document_type:
            'hotel_invoice_add',

        invoice_reference:
            normalizeInvoiceReference(
                draft.invoice_reference,
            ),

        vendor_name_raw:
            cleanString(
                draft.vendor_name_raw,
            ) || null,

        vendor_suffix:
            normalizeVendorSuffix(
                draft.vendor_suffix,
            ),

        passenger_name:
            cleanString(
                draft.passenger_name,
            ) || null,

        hotel_name:
            cleanString(
                draft.hotel_name,
            ) || null,

        room_type:
            normalizeRoomType(
                draft.room_type,
            ),

        meal:
            normalizeMeal(
                draft.meal,
            ),

        room_quantity:
            Number.isInteger(
                Number(
                    draft.room_quantity,
                ),
            ) &&
            Number(
                draft.room_quantity,
            ) > 0
                ? Number(
                      draft.room_quantity,
                  )
                : 1,

        rate:
            toNumber(
                draft.rate,
            ),

        vendor_rate:
            toNumber(
                draft.vendor_rate,
            ),

        currency_code:
            normalizeCurrencyCode(
                draft.currency_code,
            ),

        currency_rate:
            toNumber(
                draft.currency_rate,
            ),
    };

    if (
        result.currency_rate !==
            null &&
        !result.currency_code
    ) {
        result.currency_code =
            'SAR';
    }

    return normalizeDates(
        result,
        referenceDate,
    );
}

function firstMissingField(
    draft,
) {
    if (
        !draft.invoice_reference
    ) {
        return {
            field:
                'invoice_reference',

            message:
                'Please provide the invoice number.',
        };
    }

    if (
        !draft.passenger_name
    ) {
        return {
            field:
                'passenger_name',

            message:
                'Please provide the passenger name.',
        };
    }

    if (
        !draft.hotel_name
    ) {
        return {
            field:
                'hotel_name',

            message:
                'Please provide the hotel name.',
        };
    }

    if (
        !draft.room_type
    ) {
        return {
            field:
                'room_type',

            message:
                'Please provide the room type.',
        };
    }

    if (
        !draft.meal
    ) {
        return {
            field:
                'meal',

            message:
                'Please provide the meal plan (for example RO or BB).',
        };
    }

    if (
        !draft.check_in
    ) {
        return {
            field:
                'check_in',

            message:
                'Please provide the check-in date.',
        };
    }

    if (
        !draft.check_out
    ) {
        return {
            field:
                'check_out',

            message:
                'Please provide the check-out date or number of nights.',
        };
    }

    if (
        !Number.isFinite(
            Number(
                draft.nights,
            ),
        ) ||
        Number(
            draft.nights,
        ) <= 0
    ) {
        return {
            field:
                'nights',

            message:
                'The hotel stay must be at least 1 night.',
        };
    }

    if (
        !Number.isInteger(
            Number(
                draft.room_quantity,
            ),
        ) ||
        Number(
            draft.room_quantity,
        ) <= 0
    ) {
        return {
            field:
                'room_quantity',

            message:
                'Room quantity must be a positive whole number.',
        };
    }

    if (
        !Number.isFinite(
            Number(
                draft.rate,
            ),
        ) ||
        Number(
            draft.rate,
        ) <= 0
    ) {
        return {
            field:
                'rate',

            message:
                'Please provide the selling rate per room per night.',
        };
    }

    if (
        !/^\d{3}$/.test(
            cleanString(
                draft.vendor_suffix,
            ),
        )
    ) {
        return {
            field:
                'vendor_suffix',

            message:
                'Please provide the vendor name or vendor code (3 digits).',
        };
    }

    if (
        !Number.isFinite(
            Number(
                draft.vendor_rate,
            ),
        ) ||
        Number(
            draft.vendor_rate,
        ) <= 0
    ) {
        return {
            field:
                'vendor_rate',

            message:
                'Please provide the vendor buying rate per room per night.',
        };
    }

    if (
        draft.currency_code &&
        (
            !Number.isFinite(
                Number(
                    draft.currency_rate,
                ),
            ) ||
            Number(
                draft.currency_rate,
            ) <= 0
        )
    ) {
        return {
            field:
                'currency_rate',

            message:
                'Please provide the exchange rate / ROE.',
        };
    }

    return null;
}

async function extractHotelAddDraft(
    userText,
    existingDraft,
) {
    const prompt = [
        'Existing draft:',
        JSON.stringify(
            existingDraft || {},
        ),

        '',

        'Newest user message:',
        cleanString(
            userText,
        ),

        '',

        'Merge the newest message into the existing draft and return the full hotel_invoice_add object.',
    ].join('\n');

    const response =
        await openai.responses.create({
            model:
                AI_MODEL,

            store:
                false,

            input: [
                {
                    role:
                        'system',

                    content:
                        SYSTEM_PROMPT,
                },

                {
                    role:
                        'user',

                    content:
                        prompt,
                },
            ],

            text: {
                format: {
                    type:
                        'json_schema',

                    name:
                        'hotel_invoice_add_draft',

                    strict:
                        true,

                    schema:
                        DOCUMENT_SCHEMA,
                },
            },
        });

    const raw =
        cleanString(
            response?.output_text,
        ).replace(
            /^\uFEFF/,
            '',
        );

    if (
        !raw
    ) {
        throw new Error(
            'AI returned an empty hotel line draft.',
        );
    }

    try {
        return JSON.parse(
            raw,
        );
    } catch (
        error
    ) {
        throw new Error(
            `AI returned invalid hotel line JSON: ${error.message}`,
        );
    }
}

async function processHotelInvoiceAddMessage(
    userText,
    existingDraft = null,
    options = {},
) {
    if (
        !process.env.OPENAI_API_KEY
    ) {
        return {
            ok:
                false,

            type:
                'error',

            draft:
                existingDraft,

            nextQuestion:
                null,

            message:
                'OPENAI_API_KEY is not configured for the WhatsApp bot.',
        };
    }

    const currentDate =
        options.currentDate instanceof Date
            ? options.currentDate
            : new Date();

    try {
        const extracted =
            await extractHotelAddDraft(
                userText,
                existingDraft,
            );

        let draft =
            mergeDraft(
                existingDraft,
                extracted,
            );

        draft =
            normalizeDraft(
                draft,
                currentDate,
            );

        const vendor =
            await resolveVendor(
                draft,
                options,
            );

        draft =
            vendor.draft;

        if (
            vendor.message
        ) {
            return {
                ok:
                    false,

                type:
                    'collecting',

                draft,

                nextQuestion: {
                    field:
                        'vendor_suffix',
                },

                message:
                    vendor.message,
            };
        }

        const missing =
            firstMissingField(
                draft,
            );

        if (
            missing
        ) {
            return {
                ok:
                    false,

                type:
                    'collecting',

                draft,

                nextQuestion: {
                    field:
                        missing.field,
                },

                message:
                    missing.message,
            };
        }

        return {
            ok:
                true,

            type:
                'complete',

            draft,

            nextQuestion:
                null,

            message:
                null,
        };
    } catch (
        error
    ) {
        console.error(
            '[WHATSAPP AI] Hotel add-line extraction failed:',
            error.message,
        );

        return {
            ok:
                false,

            type:
                'error',

            draft:
                existingDraft,

            nextQuestion:
                null,

            message:
                `Unable to process the hotel line details. ${error.message}`,
        };
    }
}

module.exports = {
    processHotelInvoiceAddMessage,
    normalizeDraft,
    normalizeDates,
    parseDate,
};