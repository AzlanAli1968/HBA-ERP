const REQUIRED_MESSAGES = {
    document_type:
        'What document do you want to create: hotel invoice, visa invoice, transfer invoice, voucher, or journal voucher?',

    client_suffix:
        'Please provide the client code (3 digits).',

    passenger_name:
        'Please provide the passenger name.',

    hotel_name:
        'Please provide the hotel name.',

    room_type:
        'Please provide the room type.',

    meal:
        'Please provide the meal plan, for example BB, HB, FB or RO.',

    check_in:
        'Please provide the hotel check-in date.',

    check_out:
        'Please provide the hotel check-out date.',

    nights:
        'Please provide the number of nights.',

    room_quantity:
        'Please provide the number of rooms.',

    rate:
        'Please provide the selling rate.',

    vendor_suffix:
        'Please provide the vendor code (3 digits).',

    vendor_rate:
        'Please provide the vendor buying rate.',

    currency_rate:
        'Please provide the SAR ROE.',

    passport_no:
        'Please provide the passport number.',

    visa_type:
        'Please provide the visa type.',

    vendor_amount:
        'Please provide the vendor amount.',

    transfer_to:
        'Please provide the transfer destination.',

    transfer_from:
        'Please provide the transfer pickup/origin.',

    vehicle:
        'Please provide the vehicle type.',

    transfer_date:
        'Please provide the transfer date.',

    voucher_type:
        'Please specify BR for Bank Receipt or BP for Bank Payment.',

    cash_bank_suffix:
        'Please provide the cash/bank account code (3 digits).',

    party_type:
        'Please specify the party type, CL or VE.',

    party_suffix:
        'Please provide the party account code (3 digits).',

    base_amount:
        'Please provide the voucher amount.',

    currency_quantity:
        'Please provide the foreign currency quantity.',

    particulars:
        'Please provide the particulars.',

    journal_lines:
        'Please provide at least one debit line and one credit line for the journal voucher.',
};

function isBlank(value) {
    return (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    );
}

function isPositiveNumber(value) {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0
    );
}

function isNonNegativeNumber(value) {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0
    );
}

function isThreeDigitCode(value) {
    return /^\d{3}$/.test(
        String(value ?? '').trim(),
    );
}

function isValidIsoDate(value) {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [
        year,
        month,
        day,
    ] = value
        .split('-')
        .map(Number);

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
        ),
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function addMissing(
    missing,
    field,
    message = REQUIRED_MESSAGES[field],
) {
    missing.push({
        field,
        message,
    });
}

function validateCommonInvoiceFields(
    draft,
    missing,
    errors,
) {
    if (
        !isThreeDigitCode(
            draft.client_suffix,
        )
    ) {
        addMissing(
            missing,
            'client_suffix',
        );
    }

    if (
        isBlank(
            draft.passenger_name,
        )
    ) {
        addMissing(
            missing,
            'passenger_name',
        );
    }
}

function validateCurrency(
    draft,
    errors,
) {
    const currency =
        isBlank(draft.currency_code)
            ? null
            : String(
                  draft.currency_code,
              )
                  .trim()
                  .toUpperCase();

    if (
        currency === null
    ) {
        if (
            !isBlank(
                draft.currency_quantity,
            ) ||
            !isBlank(
                draft.currency_rate,
            )
        ) {
            errors.push(
                'Foreign currency quantity/rate was provided without a currency code.',
            );
        }

        return;
    }

    /*
     * Current WhatsApp invoice/voucher
     * parser supports SAR.
     */
    if (
        currency !== 'SAR'
    ) {
        errors.push(
            `Unsupported WhatsApp currency: ${currency}. Current flow supports SAR.`,
        );

        return;
    }

    if (
        !isPositiveNumber(
            draft.currency_rate,
        )
    ) {
        addMissing(
            [],
            'currency_rate',
        );

        errors.push(
            REQUIRED_MESSAGES.currency_rate,
        );
    }

    if (
        draft.currency_quantity !== null &&
        draft.currency_quantity !== undefined &&
        !isPositiveNumber(
            draft.currency_quantity,
        )
    ) {
        errors.push(
            'Currency quantity must be greater than zero.',
        );
    }
}

function validateHotel(
    draft,
) {
    const missing = [];
    const errors = [];

    validateCommonInvoiceFields(
        draft,
        missing,
        errors,
    );

    if (
        isBlank(
            draft.hotel_name,
        )
    ) {
        addMissing(
            missing,
            'hotel_name',
        );
    }

    if (
        isBlank(
            draft.room_type,
        )
    ) {
        addMissing(
            missing,
            'room_type',
        );
    }

    if (
        isBlank(
            draft.meal,
        )
    ) {
        addMissing(
            missing,
            'meal',
        );
    }

    if (
        !isValidIsoDate(
            draft.check_in,
        )
    ) {
        addMissing(
            missing,
            'check_in',
        );
    }

    if (
        !isValidIsoDate(
            draft.check_out,
        )
    ) {
        addMissing(
            missing,
            'check_out',
        );
    }

    if (
        !isPositiveNumber(
            draft.nights,
        )
    ) {
        addMissing(
            missing,
            'nights',
        );
    }

    /*
     * Existing parser defaults omitted
     * room quantity to 1.
     *
     * The validator therefore accepts
     * null here.
     */
    if (
        draft.room_quantity !== null &&
        draft.room_quantity !== undefined &&
        (
            !Number.isInteger(
                draft.room_quantity,
            ) ||
            draft.room_quantity <= 0
        )
    ) {
        errors.push(
            'Room quantity must be a positive whole number.',
        );
    }

    if (
        !isPositiveNumber(
            draft.rate,
        )
    ) {
        addMissing(
            missing,
            'rate',
        );
    }

    if (
        !isThreeDigitCode(
            draft.vendor_suffix,
        )
    ) {
        addMissing(
            missing,
            'vendor_suffix',
        );
    }

    if (
        !isPositiveNumber(
            draft.vendor_rate,
        )
    ) {
        addMissing(
            missing,
            'vendor_rate',
        );
    }

    if (
        isValidIsoDate(
            draft.check_in,
        ) &&
        isValidIsoDate(
            draft.check_out,
        ) &&
        draft.check_out <=
            draft.check_in
    ) {
        errors.push(
            'Hotel check-out must be after check-in.',
        );
    }

    validateCurrency(
        draft,
        errors,
    );

    return {
        ok:
            missing.length === 0 &&
            errors.length === 0,

        missing,

        errors,
    };
}

function validateVisa(
    draft,
) {
    const missing = [];
    const errors = [];

    validateCommonInvoiceFields(
        draft,
        missing,
        errors,
    );

    if (
        isBlank(
            draft.passport_no,
        )
    ) {
        addMissing(
            missing,
            'passport_no',
        );
    }

    if (
        isBlank(
            draft.visa_type,
        )
    ) {
        addMissing(
            missing,
            'visa_type',
        );
    }

    if (
        !isPositiveNumber(
            draft.rate,
        )
    ) {
        addMissing(
            missing,
            'rate',
        );
    }

    if (
        !isThreeDigitCode(
            draft.vendor_suffix,
        )
    ) {
        addMissing(
            missing,
            'vendor_suffix',
        );
    }

    if (
        !isNonNegativeNumber(
            draft.vendor_amount,
        )
    ) {
        addMissing(
            missing,
            'vendor_amount',
        );
    }

    /*
     * Current Visa WhatsApp parser
     * requires SAR + ROE.
     */
    const currency =
        String(
            draft.currency_code || '',
        )
            .trim()
            .toUpperCase();

    if (
        currency !== 'SAR'
    ) {
        errors.push(
            'Visa WhatsApp invoices currently require SAR currency.',
        );
    }

    if (
        !isPositiveNumber(
            draft.currency_rate,
        )
    ) {
        addMissing(
            missing,
            'currency_rate',
        );
    }

    return {
        ok:
            missing.length === 0 &&
            errors.length === 0,

        missing,

        errors,
    };
}

function validateTransfer(
    draft,
) {
    const missing = [];
    const errors = [];

    validateCommonInvoiceFields(
        draft,
        missing,
        errors,
    );

    if (
        isBlank(
            draft.transfer_to,
        )
    ) {
        addMissing(
            missing,
            'transfer_to',
        );
    }

    if (
        isBlank(
            draft.transfer_from,
        )
    ) {
        addMissing(
            missing,
            'transfer_from',
        );
    }

    if (
        isBlank(
            draft.vehicle,
        )
    ) {
        addMissing(
            missing,
            'vehicle',
        );
    }

    if (
        !isValidIsoDate(
            draft.transfer_date,
        )
    ) {
        addMissing(
            missing,
            'transfer_date',
        );
    }

    if (
        !isPositiveNumber(
            draft.rate,
        )
    ) {
        addMissing(
            missing,
            'rate',
        );
    }

    if (
        !isThreeDigitCode(
            draft.vendor_suffix,
        )
    ) {
        addMissing(
            missing,
            'vendor_suffix',
        );
    }

    if (
        !isNonNegativeNumber(
            draft.vendor_amount,
        )
    ) {
        addMissing(
            missing,
            'vendor_amount',
        );
    }

    /*
     * Current transfer WhatsApp parser
     * accepts base currency or SAR + ROE.
     */
    validateCurrency(
        draft,
        errors,
    );

    return {
        ok:
            missing.length === 0 &&
            errors.length === 0,

        missing,

        errors,
    };
}

function validateVoucher(
    draft,
) {
    const missing = [];
    const errors = [];

    const voucherType =
        String(
            draft.voucher_type || '',
        )
            .trim()
            .toUpperCase();

    if (
        voucherType !== 'BR' &&
        voucherType !== 'BP'
    ) {
        addMissing(
            missing,
            'voucher_type',
        );
    }

    if (
        !isThreeDigitCode(
            draft.cash_bank_suffix,
        )
    ) {
        addMissing(
            missing,
            'cash_bank_suffix',
        );
    }

    const partyType =
        String(
            draft.party_type || '',
        )
            .trim()
            .toUpperCase();

    if (
        partyType !== 'CL' &&
        partyType !== 'VE'
    ) {
        addMissing(
            missing,
            'party_type',
        );
    }

    if (
        !isThreeDigitCode(
            draft.party_suffix,
        )
    ) {
        addMissing(
            missing,
            'party_suffix',
        );
    }

    if (
        !isBlank(
            draft.invoice_reference,
        ) &&
        !/^\d+$/.test(
            String(
                draft.invoice_reference,
            ).trim(),
        )
    ) {
        errors.push(
            'Invoice reference must be numeric.',
        );
    }

    const hasForeignCurrency =
        String(
            draft.currency_code || '',
        )
            .trim()
            .toUpperCase() ===
        'SAR';

    if (
        hasForeignCurrency
    ) {
        if (
            !isPositiveNumber(
                draft.currency_quantity,
            )
        ) {
            addMissing(
                missing,
                'currency_quantity',
            );
        }

        if (
            !isPositiveNumber(
                draft.currency_rate,
            )
        ) {
            addMissing(
                missing,
                'currency_rate',
            );
        }

        if (
            !isBlank(
                draft.base_amount,
            )
        ) {
            errors.push(
                'Voucher cannot contain both foreign currency data and a base amount.',
            );
        }
    } else {
        if (
            !isPositiveNumber(
                draft.base_amount,
            )
        ) {
            addMissing(
                missing,
                'base_amount',
            );
        }

        if (
            !isBlank(
                draft.currency_quantity,
            ) ||
            !isBlank(
                draft.currency_rate,
            )
        ) {
            errors.push(
                'Foreign currency quantity/rate require currency_code = SAR.',
            );
        }
    }

    return {
        ok:
            missing.length === 0 &&
            errors.length === 0,

        missing,

        errors,
    };
}

function validateJournalVoucher(
    draft,
) {
    const missing = [];
    const errors = [];

    const lines =
        Array.isArray(
            draft.journal_lines,
        )
            ? draft.journal_lines
            : [];

    if (
        lines.length < 2
    ) {
        addMissing(
            missing,
            'journal_lines',
        );

        return {
            ok: false,
            missing,
            errors,
        };
    }

    let hasDebit = false;
    let hasCredit = false;

    for (
        let index = 0;
        index < lines.length;
        index += 1
    ) {
        const line =
            lines[index];

        const label =
            `Journal line ${index + 1}`;

        if (
            !/^[A-Z]{2}$/.test(
                String(
                    line.account_alias ||
                        '',
                )
                    .trim()
                    .toUpperCase(),
            )
        ) {
            errors.push(
                `${label}: account alias must contain two letters.`,
            );
        }

        if (
            !isThreeDigitCode(
                line.account_suffix,
            )
        ) {
            errors.push(
                `${label}: account code must be three digits.`,
            );
        }

        const side =
            String(
                line.side || '',
            )
                .trim()
                .toLowerCase();

        if (
            side !== 'debit' &&
            side !== 'credit'
        ) {
            errors.push(
                `${label}: side must be debit or credit.`,
            );
        }

        if (
            side === 'debit'
        ) {
            hasDebit = true;
        }

        if (
            side === 'credit'
        ) {
            hasCredit = true;
        }

        const hasForeignCurrency =
            String(
                line.currency_code || '',
            )
                .trim()
                .toUpperCase() ===
            'SAR';

        if (
            hasForeignCurrency
        ) {
            if (
                !isPositiveNumber(
                    line.currency_quantity,
                )
            ) {
                errors.push(
                    `${label}: SAR quantity must be greater than zero.`,
                );
            }

            if (
                !isPositiveNumber(
                    line.currency_rate,
                )
            ) {
                errors.push(
                    `${label}: SAR ROE must be greater than zero.`,
                );
            }

            if (
                !isBlank(
                    line.amount,
                )
            ) {
                errors.push(
                    `${label}: foreign currency line should not also contain a base amount.`,
                );
            }
        } else {
            if (
                !isPositiveNumber(
                    line.amount,
                )
            ) {
                errors.push(
                    `${label}: amount must be greater than zero.`,
                );
            }
        }
    }

    if (
        !hasDebit
    ) {
        errors.push(
            'Journal voucher must contain at least one debit line.',
        );
    }

    if (
        !hasCredit
    ) {
        errors.push(
            'Journal voucher must contain at least one credit line.',
        );
    }

    return {
        ok:
            missing.length === 0 &&
            errors.length === 0,

        missing,

        errors,
    };
}

function validateDocumentDraft(
    draft,
) {
    if (
        !draft ||
        typeof draft !== 'object'
    ) {
        return {
            ok: false,

            missing: [
                {
                    field:
                        'document_type',

                    message:
                        REQUIRED_MESSAGES.document_type,
                },
            ],

            errors: [
                'Document draft is invalid.',
            ],
        };
    }

    const type =
        String(
            draft.document_type || '',
        )
            .trim()
            .toLowerCase();

    switch (
        type
    ) {
        case 'hotel_invoice':
            return validateHotel(
                draft,
            );

        case 'visa_invoice':
            return validateVisa(
                draft,
            );

        case 'transfer_invoice':
            return validateTransfer(
                draft,
            );

        case 'voucher':
            return validateVoucher(
                draft,
            );

        case 'journal_voucher':
            return validateJournalVoucher(
                draft,
            );

        default:
            return {
                ok: false,

                missing: [
                    {
                        field:
                            'document_type',

                        message:
                            REQUIRED_MESSAGES.document_type,
                    },
                ],

                errors: [],
            };
    }
}

function getNextQuestion(
    validation,
) {
    if (
        !validation
    ) {
        return null;
    }

    if (
        Array.isArray(
            validation.missing,
        ) &&
        validation.missing.length > 0
    ) {
        return validation.missing[0];
    }

    if (
        Array.isArray(
            validation.errors,
        ) &&
        validation.errors.length > 0
    ) {
        return {
            field: null,
            message:
                validation.errors[0],
        };
    }

    return null;
}

module.exports = {
    validateDocumentDraft,
    getNextQuestion,
    isValidIsoDate,
    isPositiveNumber,
    isThreeDigitCode,
};