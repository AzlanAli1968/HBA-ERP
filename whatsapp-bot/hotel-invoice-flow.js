/*
|--------------------------------------------------------------------------
| HOTEL INVOICE INTAKE FLOW
|--------------------------------------------------------------------------
|
| Local HBA agent sends a compact hotel invoice request.
|
| Example:
|
| sell 360 za travel
| buy 340 arabian travel
| voco makkah
| 3-8 aug
| quad ro
| 76.5
|
| Flow:
|
|   Agent message
|       ↓
|   AI extraction
|       ↓
|   Client/Vendor account resolution
|       ↓
|   Automatic date-year inference
|       ↓
|   Deterministic normalization
|       ↓
|   Validation
|       ↓
|   Ask only for genuinely missing information
|
| IMPORTANT:
|
| This module DOES NOT create an ERP invoice.
|
|--------------------------------------------------------------------------
*/

const {
    extractHotelInvoice,
} = require('./hotel-invoice-ai');

const {
    resolveAccount,
} = require('./account-resolver');

const {
    normalizeHotelDraft,
} = require('./document-normalizer');

const {
    validateDocumentDraft,
    getNextQuestion,
} = require('./document-validator');

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

const MONTHS = {
    jan: 0,
    january: 0,

    feb: 1,
    february: 1,

    mar: 2,
    march: 2,

    apr: 3,
    april: 3,

    may: 4,

    jun: 5,
    june: 5,

    jul: 6,
    july: 6,

    aug: 7,
    august: 7,

    sep: 8,
    sept: 8,
    september: 8,

    oct: 9,
    october: 9,

    nov: 10,
    november: 10,

    dec: 11,
    december: 11,
};

function extractMonthDay(value) {
    const raw =
        String(
            value || '',
        )
            .trim()
            .toLowerCase();

    if (!raw) {
        return null;
    }

    /*
     * Examples:
     *
     * 3 Aug
     * 03 August
     * 3 Aug 2026
     */
    const match =
        raw.match(
            /^(\d{1,2})\s+([a-z]+)(?:\s+\d{4})?$/,
        );

    if (!match) {
        return null;
    }

    const day =
        Number(match[1]);

    const month =
        MONTHS[match[2]];

    if (
        month === undefined ||
        !Number.isInteger(day) ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    return {
        month,
        day,
    };
}

function getCurrentDate(
    options = {},
) {
    if (
        options.currentDate
    ) {
        const supplied =
            new Date(
                `${String(
                    options.currentDate,
                ).slice(0, 10)}T00:00:00`,
            );

        if (
            !Number.isNaN(
                supplied.getTime(),
            )
        ) {
            return supplied;
        }
    }

    return new Date();
}

/*
|--------------------------------------------------------------------------
| AUTOMATIC YEAR RULE
|--------------------------------------------------------------------------
|
| Current year by default.
|
| If check-in month/day has already passed
| in the current year, use next year.
|
| Example:
|
| Today: 19 Sep 2026
|
| 3 Aug  -> 2027
| 8 Aug  -> 2027
| 20 Sep -> 2026
| 25 Dec -> 2026
|
|--------------------------------------------------------------------------
*/

function inferHotelDateYear(
    checkIn,
    options = {},
) {
    const currentDate =
        getCurrentDate(
            options,
        );

    const currentYear =
        currentDate.getFullYear();

    const monthDay =
        extractMonthDay(
            checkIn,
        );

    if (!monthDay) {
        return null;
    }

    const todayMonth =
        currentDate.getMonth();

    const todayDay =
        currentDate.getDate();

    const dateHasPassed =
        monthDay.month <
            todayMonth ||
        (
            monthDay.month ===
                todayMonth &&
            monthDay.day <
                todayDay
        );

    return dateHasPassed
        ? currentYear + 1
        : currentYear;
}

function normalizeHotelDateText(
    value,
    year,
) {
    const raw =
        String(
            value || '',
        )
            .trim()
            .toLowerCase();

    if (!raw) {
        return null;
    }

    /*
     * Explicit year was supplied.
     * Leave the existing value alone.
     */
    if (
        /\b(?:19|20)\d{2}\b/.test(
            raw,
        )
    ) {
        return raw;
    }

    const monthDay =
        extractMonthDay(
            raw,
        );

    if (!monthDay) {
        return raw;
    }

    return `${monthDay.day} ${
        Object.keys(MONTHS).find(
            (monthName) =>
                MONTHS[
                    monthName
                ] ===
                monthDay.month,
        ) || ''
    } ${year}`;
}

function prepareHotelDates(
    draft,
    options = {},
) {
    const result = {
        ...draft,
    };

    const checkIn =
        String(
            result.check_in ||
                '',
        ).trim();

    const checkOut =
        String(
            result.check_out ||
                '',
        ).trim();

    /*
     * No check-in yet.
     * Validation will ask for it.
     */
    if (!checkIn) {
        return result;
    }

    /*
     * If check-in already contains
     * an explicit year, let the normalizer
     * use it.
     */
    if (
        /\b(?:19|20)\d{2}\b/.test(
            checkIn,
        )
    ) {
        return result;
    }

    const inferredYear =
        inferHotelDateYear(
            checkIn,
            options,
        );

    if (!inferredYear) {
        return result;
    }

    /*
     * The normalizer accepts textual dates
     * with a year.
     */
    result.check_in =
        normalizeHotelDateText(
            checkIn,
            inferredYear,
        );

    if (checkOut) {
        /*
         * Normal case:
         * checkout is in the same inferred year.
         *
         * Cross-year case:
         * 28 Dec -> 3 Jan
         *
         * In that case checkout belongs
         * to the following year.
         */
        const checkInMonthDay =
            extractMonthDay(
                checkIn,
            );

        const checkOutMonthDay =
            extractMonthDay(
                checkOut,
            );

        let checkoutYear =
            inferredYear;

        if (
            checkInMonthDay &&
            checkOutMonthDay &&
            (
                checkOutMonthDay.month <
                    checkInMonthDay.month ||
                (
                    checkOutMonthDay.month ===
                        checkInMonthDay.month &&
                    checkOutMonthDay.day <
                        checkInMonthDay.day
                )
            )
        ) {
            checkoutYear =
                inferredYear + 1;
        }

        result.check_out =
            normalizeHotelDateText(
                checkOut,
                checkoutYear,
            );
    }

    result.inferred_date_year =
        inferredYear;

    return result;
}

/*
|--------------------------------------------------------------------------
| ACCOUNT RESOLUTION
|--------------------------------------------------------------------------
*/

async function resolveHotelAccounts(
    draft,
) {
    const result = {
        ...draft,
    };

    let clientResolution =
        null;

    let vendorResolution =
        null;

    /*
     * CLIENT
     */
    if (
        result.client_name_raw
    ) {
        clientResolution =
            await resolveAccount(
                result.client_name_raw,
                'CL',
            );

        if (
            clientResolution.status ===
            'matched'
        ) {
            result.client_suffix =
                clientResolution
                    .account
                    .last3;

            result.client_account_name =
                clientResolution
                    .account
                    .name;
        } else {
            result.client_suffix =
                null;

            result.client_account_name =
                null;
        }
    }

    /*
     * VENDOR
     */
    if (
        result.vendor_name_raw
    ) {
        vendorResolution =
            await resolveAccount(
                result.vendor_name_raw,
                'VE',
            );

        if (
            vendorResolution.status ===
            'matched'
        ) {
            result.vendor_suffix =
                vendorResolution
                    .account
                    .last3;

            result.vendor_account_name =
                vendorResolution
                    .account
                    .name;
        } else {
            result.vendor_suffix =
                null;

            result.vendor_account_name =
                null;
        }
    }

    return {
        draft:
            result,

        clientResolution,

        vendorResolution,
    };
}

/*
|--------------------------------------------------------------------------
| ACCOUNT MESSAGES
|--------------------------------------------------------------------------
*/

function accountResolutionMessage(
    type,
    resolution,
) {
    if (!resolution) {
        return null;
    }

    const label =
        type === 'client'
            ? 'client'
            : 'vendor';

    if (
        resolution.status ===
        'not_found'
    ) {
        return `I could not find a matching ${label} account for "${resolution.query}". Please provide the ${label} name again.`;
    }

    if (
        resolution.status ===
        'ambiguous'
    ) {
        const candidates =
            Array.isArray(
                resolution.candidates,
            )
                ? resolution.candidates
                : [];

        if (
            candidates.length ===
            0
        ) {
            return `I could not confidently identify the ${label} account "${resolution.query}". Please provide the ${label} name again.`;
        }

        const lines =
            candidates.map(
                (
                    candidate,
                    index,
                ) =>
                    `${index + 1}. ${candidate.name} — ${candidate.last3}`,
            );

        return [
            `I found multiple possible ${label} accounts for "${resolution.query}":`,
            ...lines,
            `Please tell me which ${label} account to use.`,
        ].join('\n');
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeHotelForFlow(
    draft,
    options = {},
) {
    const prepared =
        prepareHotelDates(
            draft,
            options,
        );

    return normalizeHotelDraft(
        prepared,
        {
            referenceYear:
                prepared.inferred_date_year ||
                null,
        },
    );
}

/*
|--------------------------------------------------------------------------
| MAIN HOTEL FLOW
|--------------------------------------------------------------------------
*/

async function processHotelInvoiceMessage(
    userText,
    existingDraft = null,
    options = {},
) {
    const text =
        String(
            userText || '',
        ).trim();

    if (!text) {
        return {
            ok: false,

            type: 'error',

            message:
                'Please provide the hotel invoice information.',

            draft:
                existingDraft ||
                null,

            nextQuestion:
                null,
        };
    }

    /*
     * ---------------------------------------------------------------
     * 1. AI EXTRACTION
     * ---------------------------------------------------------------
     */

    const extracted =
        await extractHotelInvoice(
            text,
            existingDraft,
        );

    /*
     * ---------------------------------------------------------------
     * 2. MERGE
     * ---------------------------------------------------------------
     */

    let draft = {
        ...(existingDraft || {}),
        ...(extracted || {}),
        document_type:
            'hotel_invoice',
    };

    /*
     * ---------------------------------------------------------------
     * 3. ACCOUNT RESOLUTION
     * ---------------------------------------------------------------
     */

    const accountResult =
        await resolveHotelAccounts(
            draft,
        );

    draft =
        accountResult.draft;

    /*
     * ---------------------------------------------------------------
     * 4. CLIENT ACCOUNT
     * ---------------------------------------------------------------
     */

    const clientMessage =
        accountResolutionMessage(
            'client',
            accountResult.clientResolution,
        );

    if (clientMessage) {
        return {
            ok: false,

            type:
                'account_selection',

            message:
                clientMessage,

            draft,

            nextQuestion: {
                field:
                    'client_account',

                message:
                    clientMessage,
            },

            clientResolution:
                accountResult.clientResolution,

            vendorResolution:
                accountResult.vendorResolution,
        };
    }

    /*
     * ---------------------------------------------------------------
     * 5. VENDOR ACCOUNT
     * ---------------------------------------------------------------
     */

    const vendorMessage =
        accountResolutionMessage(
            'vendor',
            accountResult.vendorResolution,
        );

    if (vendorMessage) {
        return {
            ok: false,

            type:
                'account_selection',

            message:
                vendorMessage,

            draft,

            nextQuestion: {
                field:
                    'vendor_account',

                message:
                    vendorMessage,
            },

            clientResolution:
                accountResult.clientResolution,

            vendorResolution:
                accountResult.vendorResolution,
        };
    }

    /*
     * ---------------------------------------------------------------
     * 6. NORMALIZE DATES / NUMBERS
     * ---------------------------------------------------------------
     *
     * Year is inferred automatically.
     * The agent is NEVER asked for a year.
     * ---------------------------------------------------------------
     */

    draft =
        normalizeHotelForFlow(
            draft,
            options,
        );

    /*
     * ---------------------------------------------------------------
     * 7. PASSENGER
     * ---------------------------------------------------------------
     */

    if (
        !String(
            draft.passenger_name ||
                '',
        ).trim()
    ) {
        return {
            ok: false,

            type:
                'collecting',

            message:
                'Please provide the passenger name.',

            draft,

            nextQuestion: {
                field:
                    'passenger_name',

                message:
                    'Please provide the passenger name.',
            },

            clientResolution:
                accountResult.clientResolution,

            vendorResolution:
                accountResult.vendorResolution,
        };
    }

    /*
     * ---------------------------------------------------------------
     * 8. VALIDATION
     * ---------------------------------------------------------------
     */

    const validation =
        validateDocumentDraft(
            draft,
        );

    if (
        validation.ok
    ) {
        return {
            ok: true,

            type:
                'complete',

            message:
                'Hotel invoice information is complete.',

            draft,

            validation,

            nextQuestion:
                null,

            clientResolution:
                accountResult.clientResolution,

            vendorResolution:
                accountResult.vendorResolution,
        };
    }

    /*
     * ---------------------------------------------------------------
     * 9. NEXT REQUIRED QUESTION
     * ---------------------------------------------------------------
     */

    const nextQuestion =
        getNextQuestion(
            validation,
        );

    return {
        ok: false,

        type:
            'collecting',

        message:
            nextQuestion
                ? nextQuestion.message
                : 'Please provide the missing hotel invoice information.',

        draft,

        validation,

        nextQuestion,

        clientResolution:
            accountResult.clientResolution,

        vendorResolution:
            accountResult.vendorResolution,
    };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    processHotelInvoiceMessage,

    resolveHotelAccounts,

    normalizeHotelForFlow,

    prepareHotelDates,

    inferHotelDateYear,

    extractMonthDay,
};