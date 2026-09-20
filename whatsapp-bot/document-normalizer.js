/*
|--------------------------------------------------------------------------
| HOTEL DOCUMENT NORMALIZER
|--------------------------------------------------------------------------
|
| This file performs deterministic cleanup/calculation only.
|
| AI is responsible for understanding the agent's language.
| This file is responsible for:
|
| - converting numeric values to numbers
| - normalizing room quantity
| - converting explicit dates to ISO
| - calculating nights
|
| IMPORTANT:
| A date such as "3 Aug" has NO year.
| We do NOT guess the year.
| The caller must provide referenceYear when needed.
|
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

function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number =
        typeof value === 'number'
            ? value
            : Number(
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

function pad(value) {
    return String(value).padStart(
        2,
        '0',
    );
}

function toISODate(
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
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${pad(
        month + 1,
    )}-${pad(day)}`;
}

/*
|--------------------------------------------------------------------------
| PARSE DATE
|--------------------------------------------------------------------------
|
| Supported examples:
|
| 2026-08-03
| 03/08/2026
| 03-08-2026
| 3 Aug 2026
| 3 August 2026
| 3 Aug
| 3 august
|
| A year-less date is only converted when
| referenceYear is supplied.
|--------------------------------------------------------------------------
*/

function parseHotelDate(
    value,
    referenceYear = null,
) {
    const raw =
        String(value || '')
            .trim()
            .toLowerCase();

    if (!raw) {
        return null;
    }

    /*
     * Already ISO.
     */
    let match =
        raw.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        );

    if (match) {
        return toISODate(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
        );
    }

    /*
     * Numeric date:
     *
     * 03/08/2026
     * 03-08-2026
     */
    match =
        raw.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/,
        );

    if (match) {
        return toISODate(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1]),
        );
    }

    /*
     * Text month:
     *
     * 3 Aug 2026
     * 3 August 2026
     */
    match =
        raw.match(
            /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
        );

    if (!match) {
        return null;
    }

    const day =
        Number(match[1]);

    const month =
        MONTHS[match[2]];

    if (
        month === undefined
    ) {
        return null;
    }

    const year =
        match[3]
            ? Number(match[3])
            : referenceYear;

    if (
        !Number.isInteger(
            year,
        ) ||
        year < 2000 ||
        year > 2100
    ) {
        return null;
    }

    return toISODate(
        year,
        month,
        day,
    );
}

/*
|--------------------------------------------------------------------------
| CALCULATE NIGHTS
|--------------------------------------------------------------------------
*/

function calculateNights(
    checkIn,
    checkOut,
) {
    if (
        !checkIn ||
        !checkOut
    ) {
        return null;
    }

    const from =
        new Date(
            `${checkIn}T00:00:00`,
        );

    const to =
        new Date(
            `${checkOut}T00:00:00`,
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

    const nights =
        Math.round(
            (
                to.getTime() -
                from.getTime()
            ) /
                86400000,
        );

    if (
        nights <= 0
    ) {
        return null;
    }

    return nights;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE HOTEL DRAFT
|--------------------------------------------------------------------------
*/

function normalizeHotelDraft(
    draft,
    options = {},
) {
    const referenceYear =
        Number.isInteger(
            options.referenceYear,
        )
            ? options.referenceYear
            : null;

    const normalized = {
        ...(draft || {}),
    };

    normalized.document_type =
        'hotel_invoice';

    normalized.client_name_raw =
        normalized.client_name_raw
            ? String(
                  normalized.client_name_raw,
              ).trim()
            : null;

    normalized.vendor_name_raw =
        normalized.vendor_name_raw
            ? String(
                  normalized.vendor_name_raw,
              ).trim()
            : null;

    normalized.passenger_name =
        normalized.passenger_name
            ? String(
                  normalized.passenger_name,
              ).trim()
            : null;

    normalized.hotel_name =
        normalized.hotel_name
            ? String(
                  normalized.hotel_name,
              ).trim()
            : null;

    normalized.room_type =
        normalized.room_type
            ? String(
                  normalized.room_type,
              ).trim()
            : null;

    normalized.meal =
        normalized.meal
            ? String(
                  normalized.meal,
              )
                  .trim()
                  .toUpperCase()
            : null;

    normalized.check_in =
        parseHotelDate(
            normalized.check_in,
            referenceYear,
        );

    normalized.check_out =
        parseHotelDate(
            normalized.check_out,
            referenceYear,
        );

    normalized.room_quantity =
        toNumber(
            normalized.room_quantity,
        );

    if (
        !normalized.room_quantity ||
        normalized.room_quantity <= 0
    ) {
        normalized.room_quantity =
            1;
    }

    normalized.rate =
        toNumber(
            normalized.rate,
        );

    normalized.vendor_rate =
        toNumber(
            normalized.vendor_rate,
        );

    normalized.currency_rate =
        toNumber(
            normalized.currency_rate,
        );

    normalized.currency_code =
        normalized.currency_code
            ? String(
                  normalized.currency_code,
              )
                  .trim()
                  .toUpperCase()
            : null;

    /*
     * If an ROE exists and no currency
     * was explicitly supplied, SAR is
     * the default hotel currency.
     */
    if (
        normalized.currency_rate !==
            null &&
        !normalized.currency_code
    ) {
        normalized.currency_code =
            'SAR';
    }

    /*
     * Deterministic calculation.
     *
     * Never ask AI to calculate nights.
     */
    normalized.nights =
        calculateNights(
            normalized.check_in,
            normalized.check_out,
        );

    return normalized;
}

module.exports = {
    toNumber,
    parseHotelDate,
    calculateNights,
    normalizeHotelDraft,
};