<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use ZipArchive;
use App\Services\CompanySettingsService;

class LedgerController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Main Ledger Screen
    |--------------------------------------------------------------------------
    */
    public function index(
        Request $request
    ): InertiaResponse {
        $data = $this->buildLedgerData(
            $request
        );

        return Inertia::render(
            'Accounting/Ledger/Index',
            $data
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Browser Print
    |--------------------------------------------------------------------------
    |
    | Uses the exact same buildLedgerData() source as the web ledger, PDF and
    | Excel export. Nothing is rebuilt or re-mapped for printing.
    |
    */
    public function print(
    Request $request
): Response {
    $data = $this->buildLedgerData(
        $request
    );

    return response()->view(
        'accounting.ledger.print',
        [
            'report' => $data,
            'company' => $data['company'] ?? $this->companyData(),
            'generatedAt' => now(),
            'autoPrint' => true,
            'pdfMode' => false,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| PDF
|--------------------------------------------------------------------------
*/

public function pdf(
    Request $request
) {
    $data = $this->buildLedgerData(
        $request
    );

    $generatedAt = now();

    $pdf = Pdf::loadView(
        'accounting.ledger.print',
        [
            'report' => $data,
            'company' => $data['company'] ?? $this->companyData(),
            'generatedAt' => $generatedAt,
            'autoPrint' => false,
            'pdfMode' => true,
        ]
    )
        ->setPaper(
            'a4',
            'landscape'
        )
        ->setOption(
            'isRemoteEnabled',
            true
        );

    $accountName =
        $data['selectedAccount']['name']
        ?? 'Ledger';

    $filename = $this->safeFilename(
        $accountName .
        '-ledger-' .
        $data['dateFrom'] .
        '-to-' .
        $data['dateTo'] .
        '.pdf'
    );

    return $pdf->download(
        $filename
    );
}

    /*
    |--------------------------------------------------------------------------
    | Excel
    |--------------------------------------------------------------------------
    |
    | Generates a native XLSX package directly with ZipArchive.
    | No maatwebsite/excel dependency is required.
    |
    */
    public function excel(
        Request $request
    ) {
        $data = $this->buildLedgerData(
            $request
        );

        $accountName =
            $data['selectedAccount']['name']
            ?? 'Ledger';

        $filename = $this->safeFilename(
            $accountName .
            '-ledger-' .
            $data['dateFrom'] .
            '-to-' .
            $data['dateTo'] .
            '.xlsx'
        );

        $temporaryDirectory =
            storage_path('app');

        if (
            ! is_dir(
                $temporaryDirectory
            )
        ) {
            mkdir(
                $temporaryDirectory,
                0775,
                true
            );
        }

        $temporaryFile =
            tempnam(
                $temporaryDirectory,
                'ledger_'
            );

        if (
            $temporaryFile === false
        ) {
            abort(
                500,
                'Unable to create temporary Excel file.'
            );
        }

        $zip = new ZipArchive();

        if (
            $zip->open(
                $temporaryFile,
                ZipArchive::CREATE |
                ZipArchive::OVERWRITE
            ) !== true
        ) {
            @unlink(
                $temporaryFile
            );

            abort(
                500,
                'Unable to create Excel workbook.'
            );
        }

        /*
         * Workbook files.
         */
        $zip->addFromString(
            '[Content_Types].xml',
            $this->xlsxContentTypes()
        );

        $zip->addFromString(
            '_rels/.rels',
            $this->xlsxRootRelationships()
        );

        $zip->addFromString(
            'xl/workbook.xml',
            $this->xlsxWorkbook()
        );

        $zip->addFromString(
            'xl/_rels/workbook.xml.rels',
            $this->xlsxWorkbookRelationships()
        );

        $zip->addFromString(
            'xl/styles.xml',
            $this->xlsxStyles()
        );

        $zip->addFromString(
            'xl/worksheets/sheet1.xml',
            $this->xlsxWorksheet(
                $data
            )
        );

        $zip->close();

        return response()
            ->download(
                $temporaryFile,
                $filename,
                [
                    'Content-Type' =>
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]
            )
            ->deleteFileAfterSend(
                true
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Build one source of truth for screen / PDF / Excel
    |--------------------------------------------------------------------------
    */
    private function buildLedgerData(
        Request $request
    ): array {
        $validated =
            $request->validate([
                'account_id' => [
                    'nullable',
                    'integer',
                    'exists:accounts,id',
                ],

                'date_from' => [
                    'nullable',
                    'date',
                ],

                'date_to' => [
                    'nullable',
                    'date',
                    'after_or_equal:date_from',
                ],

                'currency_code' => [
                    'nullable',
                    'string',
                    'max:20',
                ],
            ]);

        $today =
            now()->toDateString();

        $dateFrom =
            $validated['date_from']
            ??
            now()
                ->startOfMonth()
                ->toDateString();

        $dateTo =
            $validated['date_to']
            ??
            $today;

        $accountId =
            isset(
                $validated['account_id']
            )
                ? (int) $validated['account_id']
                : null;

        $selectedCurrency =
            isset($validated['currency_code'])
                ? strtoupper(
                    trim(
                        (string) $validated['currency_code']
                    )
                )
                : null;

        if ($selectedCurrency === '') {
            $selectedCurrency = null;
        }

        /*
         * ------------------------------------------------------
         * Currency selector
         * ------------------------------------------------------
         *
         * Keep this compatible with the existing currency master
         * used by the voucher screens. The foreign ledger is an
         * optional view; leaving Currency blank keeps the existing
         * base-currency ledger unchanged.
         */
        $currencies = $this->currencyOptions();

        $selectedCurrencyName = null;

        if ($selectedCurrency !== null) {
            foreach ($currencies as $currency) {
                if (
                    strtoupper(
                        (string) ($currency['code'] ?? '')
                    ) === $selectedCurrency
                ) {
                    $selectedCurrencyName =
                        (string) ($currency['name'] ?? '')
                        ?: $selectedCurrency;

                    break;
                }
            }

            if ($selectedCurrencyName === null) {
                $selectedCurrencyName = $selectedCurrency;
            }
        }

        /*
         * ------------------------------------------------------
         * Account selector
         * ------------------------------------------------------
         */
        $accounts =
            DB::table(
                'accounts'
            )
                ->where(
                    function (
                        Builder $query
                    ) {
                        $query
                            ->where(
                                'is_active',
                                1
                            )
                            ->orWhereNull(
                                'is_active'
                            );
                    }
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->orderBy(
                    'code'
                )
                ->get()
                ->map(
                    fn ($account) => [
                        'id' =>
                            (int)
                                $account->id,

                        'code' =>
                            (string)
                                $account->code,

                        'name' =>
                            (string)
                                $account->name,
                    ]
                )
                ->values()
                ->all();

        /*
         * ------------------------------------------------------
         * Selected account
         * ------------------------------------------------------
         */
        $selectedAccount = null;

        if (
            $accountId !== null
        ) {
            $selectedAccount =
                DB::table(
                    'accounts'
                )
                    ->where(
                        'id',
                        $accountId
                    )
                    ->select([
                        'id',
                        'code',
                        'name',
                    ])
                    ->first();

            if (
                ! $selectedAccount
            ) {
                $accountId = null;
            }
        }

        /*
         * ------------------------------------------------------
         * Base opening balance
         * ------------------------------------------------------
         *
         * account_opening_balances uses account_id in the
         * current HBA ERP database.
         *
         * Foreign opening rows are not used for the normal
         * base-currency ledger starting balance.
         */
        $openingDebit = 0.0;
        $openingCredit = 0.0;

        if (
            $accountId !== null
            &&
            Schema::hasTable(
                'account_opening_balances'
            )
        ) {
            $opening =
                DB::table(
                    'account_opening_balances'
                )
                    ->where(
                        'account_id',
                        $accountId
                    )
                    ->where(
                        function (
                            Builder $query
                        ) {
                            $query
                                ->whereNull(
                                    'currency_code'
                                )
                                ->orWhere(
                                    'currency_code',
                                    ''
                                )
                                ->orWhere(
                                    'currency_code',
                                    0
                                );
                        }
                    )
                    ->selectRaw(
                        '
                        COALESCE(
                            SUM(opening_debit),
                            0
                        ) AS debit,

                        COALESCE(
                            SUM(opening_credit),
                            0
                        ) AS credit
                        '
                    )
                    ->first();

            $openingDebit =
                (float) (
                    $opening->debit
                    ?? 0
                );

            $openingCredit =
                (float) (
                    $opening->credit
                    ?? 0
                );
        }

        $fiscalOpeningBalance =
            $openingDebit
            -
            $openingCredit;

        /*
         * ------------------------------------------------------
         * Empty report when no account selected
         * ------------------------------------------------------
         */
        if (
            $accountId === null
        ) {
            return [
                'title' =>
                    'Ledger',

                'subtitle' =>
                    'Account ledger for the selected period.',

                'accounts' =>
                    $accounts,

                'selectedAccount' =>
                    null,

                'accountId' =>
                    null,

                'currencies' =>
                    $currencies,

                'selectedCurrency' =>
                    $selectedCurrency,

                'selectedCurrencyName' =>
                    $selectedCurrencyName,

                'isForeignCurrencyLedger' =>
                    $selectedCurrency !== null,

                'dateFrom' =>
                    $dateFrom,

                'dateTo' =>
                    $dateTo,

                'openingBalance' =>
                    0.0,

                'fiscalOpeningBalance' =>
                    round(
                        $fiscalOpeningBalance,
                        4
                    ),

                'openingDebit' =>
                    round(
                        $openingDebit,
                        4
                    ),

                'openingCredit' =>
                    round(
                        $openingCredit,
                        4
                    ),

                'periodDebit' =>
                    0.0,

                'periodCredit' =>
                    0.0,

                'closingBalance' =>
                    0.0,

                'rows' =>
                    [],

                'company' =>
                    $this->companyData(),
            ];
        }

        /*
         * ------------------------------------------------------
         * Get all journal lines up to To date
         * ------------------------------------------------------
         *
         * IMPORTANT:
         *
         * journal_entry_lines is the sole accounting source.
         *
         * legacy_transactions is used only to recover historical
         * descriptions for BR/BP and never for amounts.
         */
        $lines =
            DB::table(
                'journal_entry_lines as l'
            )
                ->leftJoin(
                    'vouchers as v',
                    'v.id',
                    '=',
                    'l.voucher_id'
                )
                ->where(
                    'l.account_id',
                    $accountId
                )
                ->whereRaw(
                    '
                    DATE(
                        COALESCE(
                            l.posting_date,
                            l.voucher_date,
                            v.voucher_date
                        )
                    ) <= ?
                    ',
                    [
                        $dateTo,
                    ]
                )
                ->select([
                    'l.id',
                    'l.account_id',
                    'l.account_code',
                    'l.debit',
                    'l.credit',
                    'l.particulars',
                    'l.posting_date',
                    'l.voucher_date',
                    'l.currency_code',
                    'l.currency_quantity',
                    'l.currency_rate',
                    'l.foreign_debit',
                    'l.foreign_credit',
                    'l.legacy_invoice_no',
                    'l.legacy_invoice_no_2',
                    'l.legacy_reference_id',
                    'l.legacy_reference_type',
                    'l.voucher_type as line_voucher_type',
                    'l.mode',
                    'l.mode_description',
                    'l.sector_description',
                    'l.fare_taxes_service',
                    'l.passenger',
                    'l.ticket_no',
                    'l.con_ticket_no',
                    'l.invoice_id',
                    'l.voucher_id',
                    'l.legacy_master_id',
                    'l.legacy_data',
                    'v.voucher_no',
                    'v.ref_no as voucher_ref_no',
                    'v.voucher_type as master_voucher_type',
                ])
                ->orderByRaw(
                    '
                    COALESCE(
                        l.posting_date,
                        l.voucher_date,
                        v.voucher_date
                    ) ASC
                    '
                )
                ->orderBy(
                    'l.id'
                )
                ->get();

        /*
         * ------------------------------------------------------
         * Historical descriptions
         * ------------------------------------------------------
         *
         * One BR/BP may have more than one Transuction row.
         * Keep every distinct description belonging to the
         * selected voucher/account.
         */
        $legacyDescriptions = [];

        if (
            Schema::hasTable(
                'legacy_transactions'
            )
        ) {
            $voucherIds =
                $lines
                    ->pluck(
                        'voucher_id'
                    )
                    ->filter()
                    ->map(
                        fn ($id) =>
                            (int) $id
                    )
                    ->unique()
                    ->values()
                    ->all();

            $accountCodes =
                $lines
                    ->pluck(
                        'account_code'
                    )
                    ->filter(
                        fn ($code) =>
                            trim(
                                (string) $code
                            ) !== ''
                    )
                    ->map(
                        fn ($code) =>
                            trim(
                                (string) $code
                            )
                    )
                    ->unique()
                    ->values()
                    ->all();

            if (
                ! empty($voucherIds)
                &&
                ! empty($accountCodes)
            ) {
                $legacyRows =
                    DB::table(
                        'legacy_transactions'
                    )
                        ->whereIn(
                            'voucher_id',
                            $voucherIds
                        )
                        ->whereIn(
                            'account_code',
                            $accountCodes
                        )
                        ->select([
                            'voucher_id',
                            'account_code',
                            'particulars',
                            'legacy_transaction_id',
                        ])
                        ->orderBy(
                            'legacy_transaction_id'
                        )
                        ->get();

                foreach (
                    $legacyRows as $legacy
                ) {
                    $key =
                        (string) (
                            $legacy->voucher_id
                        )
                        .
                        '|'
                        .
                        trim(
                            (string) (
                                $legacy->account_code
                            )
                        );

                    $description =
                        trim(
                            (string) (
                                $legacy->particulars
                                ?? ''
                            )
                        );

                    if (
                        $description === ''
                    ) {
                        continue;
                    }

                    if (
                        ! isset(
                            $legacyDescriptions[
                                $key
                            ]
                        )
                    ) {
                        $legacyDescriptions[
                            $key
                        ] = [];
                    }

                    if (
                        ! in_array(
                            $description,
                            $legacyDescriptions[
                                $key
                            ],
                            true
                        )
                    ) {
                        $legacyDescriptions[
                            $key
                        ][] =
                            $description;
                    }
                }
            }
        }

        /*
         * ------------------------------------------------------
         * Foreign-currency service breakdowns
         * ------------------------------------------------------
         *
         * The migrated Master rows keep CurRate but CurQty is often
         * zero for hotel/service invoices. The original InvTickets
         * table contains the service rate, quantity, room count and
         * hotel nights. Build a display-only formula from those
         * original fields. Accounting amounts are never changed.
         */
        $currencyBreakdowns =
            $this->buildCurrencyBreakdowns($lines);

        /*
         * ------------------------------------------------------
         * Calculate running balance
         * ------------------------------------------------------
         */
        $balance =
            $fiscalOpeningBalance;

        $foreignBalance =
            0.0;

        $broughtForwardBalance =
            null;

        $periodDebit =
            0.0;

        $periodCredit =
            0.0;

        $reportRows = [];

        foreach (
            $lines as $line
        ) {
            /*
             * In Currency mode, only lines that actually belong to the
             * requested foreign currency are part of the ledger.
             */
            $foreign =
                $selectedCurrency !== null
                    ? $this->foreignAmountsForLine(
                        $line,
                        $currencyBreakdowns,
                        $selectedCurrency
                    )
                    : null;

            if (
                $selectedCurrency !== null
                && $foreign === null
            ) {
                continue;
            }
            $debit =
                max(
                    (float) (
                        $line->debit
                        ?? 0
                    ),
                    0
                );

            $credit =
                max(
                    (float) (
                        $line->credit
                        ?? 0
                    ),
                    0
                );

            /*
             * Ignore zero-only journal lines.
             */
            if (
                abs($debit) < 0.00005
                &&
                abs($credit) < 0.00005
            ) {
                continue;
            }

            $postingDate =
                $line->posting_date
                ??
                $line->voucher_date
                ??
                null;

            $postingDate =
                $postingDate
                    ? substr(
                        (string) $postingDate,
                        0,
                        10
                    )
                    : null;

            /*
             * ----------------------------------------------
             * Determine transaction type.
             * ----------------------------------------------
             */
            $rawType =
                strtoupper(
                    trim(
                        (string) (
                            $line->master_voucher_type
                            ??
                            $line->line_voucher_type
                            ??
                            ''
                        )
                    )
                );

            $referenceType =
                strtolower(
                    trim(
                        (string) (
                            $line->legacy_reference_type
                            ??
                            ''
                        )
                    )
                );

            $isInvoice =
                $referenceType === 'invoice'
                ||
                $rawType === 'INV'
                ||
                $line->invoice_id !== null;

            $isRefund =
                $referenceType === 'refund';

            if (
                $isRefund
            ) {
                $type =
                    'Rfd';
            } elseif (
                $isInvoice
            ) {
                $type =
                    'Inv';
            } elseif (
                in_array(
                    $rawType,
                    [
                        'BR',
                        'BP',
                        'JV',
                        'CR',
                        'DR',
                    ],
                    true
                )
            ) {
                $type =
                    $rawType;
            } else {
                $type =
                    $rawType !== ''
                        ? $rawType
                        : 'JV';
            }

            /*
             * ----------------------------------------------
             * Invoice / voucher ID
             * ----------------------------------------------
             */
            if (
                $isInvoice
                ||
                $isRefund
            ) {
                $voucherDisplayId =
                    $line->legacy_reference_id !== null
                        ? (string) (
                            $line->legacy_reference_id
                        )
                        : (
                            $line->invoice_id !== null
                                ? (string) (
                                    $line->invoice_id
                                )
                                : ''
                        );
            } else {
                $voucherDisplayId =
                    $line->voucher_no !== null
                        ? (string) (
                            $line->voucher_no
                        )
                        : (
                            $line->legacy_reference_id !== null
                                ? (string) (
                                    $line->legacy_reference_id
                                )
                                : ''
                        );
            }

            /*
             * ----------------------------------------------
             * Reference
             * ----------------------------------------------
             */
            $reference =
                null;

            foreach (
                [
                    $line->legacy_invoice_no,
                    $line->legacy_invoice_no_2,
                ] as $candidate
            ) {
                $candidate =
                    trim(
                        (string) (
                            $candidate
                            ?? ''
                        )
                    );

                if (
                    $candidate !== ''
                ) {
                    $reference =
                        $candidate;

                    break;
                }
            }

            if (
                $reference === null
                &&
                ! $isInvoice
                &&
                ! $isRefund
            ) {
                $candidate =
                    trim(
                        (string) (
                            $line->voucher_ref_no
                            ?? ''
                        )
                    );

                if (
                    $candidate !== ''
                ) {
                    $reference =
                        $candidate;
                }
            }

            // Accu shows the invoice number in V. ID, not again in the Ref
            // column. Native HBA invoice journal rows carry the invoice number
            // in legacy_invoice_no for linkage, so suppress that duplicate Ref.
            if ($isInvoice && trim((string) ($line->legacy_data ?? '')) !== '') {
                $nativeMeta = json_decode((string) $line->legacy_data, true);
                if (is_array($nativeMeta) && !empty($nativeMeta['native'])) {
                    $reference = null;
                }
            }

            /*
             * ----------------------------------------------
             * Description
             * ----------------------------------------------
             *
             * BR / BP:
             *   legacy_transactions.particulars
             *
             * Invoice:
             *   Passenger + Ref + Sector/Description
             *
             * JV / other:
             *   journal particulars / description fields
             * ----------------------------------------------
             */
            $description =
                '';

            if (
                in_array(
                    $type,
                    [
                        'BR',
                        'BP',
                    ],
                    true
                )
            ) {
                $key =
                    (string) (
                        $line->voucher_id
                    )
                    .
                    '|'
                    .
                    trim(
                        (string) (
                            $line->account_code
                            ?? ''
                        )
                    );

                if (
                    isset(
                        $legacyDescriptions[
                            $key
                        ]
                    )
                ) {
                    $description =
                        implode(
                            ' / ',
                            $legacyDescriptions[
                                $key
                            ]
                        );
                }

                /*
                 * Native BR/BP lines may already have
                 * particulars.
                 */
                if (
                    trim(
                        $description
                    ) === ''
                ) {
                    $description =
                        trim(
                            (string) (
                                $line->particulars
                                ?? ''
                            )
                        );
                }

                if (
                    trim(
                        $description
                    ) === ''
                ) {
                    $description =
                        trim(
                            (string) (
                                $line->mode_description
                                ?? ''
                            )
                        );
                }
            } elseif (
                $isInvoice
                ||
                $isRefund
            ) {
                // Native HBA invoice lines already contain the exact service
                // description created at posting time. Keep it intact so the
                // new ledger follows the same wording as Accu instead of
                // injecting the HBA invoice number into the description.
                $nativeMeta = null;
                if (trim((string) ($line->legacy_data ?? '')) !== '') {
                    $decoded = json_decode((string) $line->legacy_data, true);
                    if (is_array($decoded)) {
                        $nativeMeta = $decoded;
                    }
                }

                if (!empty($nativeMeta['native']) && trim((string) ($line->particulars ?? '')) !== '') {
                    $description = trim((string) $line->particulars);
                } else {
                    $parts =
                        [];

                    $passenger =
                        trim(
                            (string) (
                                $line->passenger
                                ??
                                ''
                            )
                        );

                    if (
                        $passenger !== ''
                    ) {
                        $parts[] =
                            $passenger;
                    }

                    if (
                        $reference !== null
                    ) {
                        $parts[] =
                            $reference;
                    }

                    $sector =
                        trim(
                            (string) (
                                $line->sector_description
                                ??
                                ''
                            )
                        );

                    if (
                        $sector !== ''
                    ) {
                        $parts[] =
                            $sector;
                    }

                    $modeDescription =
                        trim(
                            (string) (
                                $line->mode_description
                                ??
                                ''
                            )
                        );

                    if (
                        $modeDescription !== ''
                        &&
                        $modeDescription !==
                            strtoupper($type)
                    ) {
                        $parts[] =
                            $modeDescription;
                    }

                    $description =
                        implode(
                            ' - ',
                            $parts
                        );
                }
            } else {
                foreach (
                    [
                        $line->particulars,
                        $line->sector_description,
                        $line->mode_description,
                        $line->mode,
                        $line->fare_taxes_service,
                    ] as $candidate
                ) {
                    $candidate =
                        trim(
                            (string) (
                                $candidate
                                ?? ''
                            )
                        );

                    if (
                        $candidate !== ''
                    ) {
                        $description =
                            $candidate;

                        break;
                    }
                }

                if (
                    $description === ''
                    &&
                    $reference !== null
                ) {
                    $description =
                        $reference;
                }
            }

            if (
                trim(
                    $description
                ) === ''
            ) {
                $description =
                    '—';
            }

            /*
             * ----------------------------------------------
             * Pre-period transactions
             * ----------------------------------------------
             *
             * Add them into B/F but don't display them.
             * This is the correct behavior for a ledger.
             * ----------------------------------------------
             */
            if (
                $postingDate !== null
                &&
                $postingDate < $dateFrom
            ) {
                if ($selectedCurrency !== null) {
                    $foreignBalance +=
                        (float) $foreign['debit']
                        -
                        (float) $foreign['credit'];
                } else {
                    $balance +=
                        $debit
                        -
                        $credit;
                }

                continue;
            }

            /*
             * First displayed row = true brought-forward
             * balance after all transactions prior to From.
             */
            if (
                $broughtForwardBalance === null
            ) {
                $broughtForwardBalance =
                    $selectedCurrency !== null
                        ? $foreignBalance
                        : $balance;
            }

            /*
             * Apply transaction.
             */
            if ($selectedCurrency !== null) {
                $displayDebit =
                    (float) $foreign['debit'];

                $displayCredit =
                    (float) $foreign['credit'];

                $foreignBalance +=
                    $displayDebit
                    -
                    $displayCredit;

                $displayBalance =
                    $foreignBalance;

                $periodDebit +=
                    $displayDebit;

                $periodCredit +=
                    $displayCredit;
            } else {
                $displayDebit =
                    $debit;

                $displayCredit =
                    $credit;

                $balance +=
                    $debit
                    -
                    $credit;

                $displayBalance =
                    $balance;

                $periodDebit +=
                    $debit;

                $periodCredit +=
                    $credit;
            }

            $reportRows[] = [
                'id' =>
                    (int) $line->id,

                'date' =>
                    $postingDate,

                'type' =>
                    $type,

                'voucher_id' =>
                    $voucherDisplayId,

                'ref' =>
                    $reference,

                'description' =>
                    $description,

                'debit' =>
                    round(
                        $displayDebit,
                        4
                    ),

                'credit' =>
                    round(
                        $displayCredit,
                        4
                    ),

                'balance' =>
                    round(
                        $displayBalance,
                        4
                    ),

                'side' =>
                    $displayBalance < 0
                        ? 'Cr'
                        : 'Dr',

                'invoice_id' =>
                    $line->invoice_id !== null
                        ? (int) (
                            $line->invoice_id
                        )
                        : null,

                'voucher_internal_id' =>
                    $line->voucher_id !== null
                        ? (int) (
                            $line->voucher_id
                        )
                        : null,

                'currency_code' =>
                    $selectedCurrency !== null
                        ? $selectedCurrency
                        : (
                            $line->currency_code !== null
                                ? (string) (
                                    $line->currency_code
                                )
                                : null
                        ),

                'currency_quantity' =>
                    $line->currency_quantity !== null
                        ? (float) (
                            $line->currency_quantity
                        )
                        : null,

                'currency_rate' =>
                    $line->currency_rate !== null
                        ? (float) (
                            $line->currency_rate
                        )
                        : null,

                'currency_breakdown' =>
                    $currencyBreakdowns[
                        (int) $line->id
                    ] ?? null,
            ];
        }

        if (
            $broughtForwardBalance === null
        ) {
            $broughtForwardBalance =
                $selectedCurrency !== null
                    ? $foreignBalance
                    : $balance;
        }

        if ($selectedCurrency !== null) {
            $balance =
                $foreignBalance;
        }

        $company =
            $this->companyData();

        return [
            'title' =>
                'Ledger',

            'subtitle' =>
                'Account ledger for the selected period.',

            'accounts' =>
                $accounts,

            'selectedAccount' =>
                $selectedAccount
                    ? [
                        'id' =>
                            (int) (
                                $selectedAccount->id
                            ),

                        'code' =>
                            (string) (
                                $selectedAccount->code
                            ),

                        'name' =>
                            (string) (
                                $selectedAccount->name
                            ),
                    ]
                    : null,

            'accountId' =>
                $accountId,

            'currencies' =>
                $currencies,

            'selectedCurrency' =>
                $selectedCurrency,

            'selectedCurrencyName' =>
                $selectedCurrencyName,

            'isForeignCurrencyLedger' =>
                $selectedCurrency !== null,

            'dateFrom' =>
                $dateFrom,

            'dateTo' =>
                $dateTo,

            'openingBalance' =>
                round(
                    $broughtForwardBalance,
                    4
                ),

            'fiscalOpeningBalance' =>
                round(
                    $fiscalOpeningBalance,
                    4
                ),

            'openingDebit' =>
                round(
                    $openingDebit,
                    4
                ),

            'openingCredit' =>
                round(
                    $openingCredit,
                    4
                ),

            'periodDebit' =>
                round(
                    $periodDebit,
                    4
                ),

            'periodCredit' =>
                round(
                    $periodCredit,
                    4
                ),

            'closingBalance' =>
                round(
                    $balance,
                    4
                ),

            'rows' =>
                $reportRows,

            'company' =>
                $company,
        ];
    }

    /**
     * Build a human-readable foreign-currency calculation for service rows.
     *
     * Service rules:
     *   Hotel    => SAR <per-night-rate> × <nights> × <ROE>
     *   Visa     => SAR <unit-rate> × <quantity> × <ROE>
     *   Transfer => SAR <unit-rate> × <quantity> × <ROE>
     *   Ticket   => no foreign-currency line (ticket is already base currency)
     *
     * IMPORTANT: the legacy source is the actual `legacy` connection/table
     * (`InvTickets`). It is NOT a Laravel table named `legacy_invtickets`.
     * The prior implementation therefore returned an empty breakdown and the
     * UI fell back to showing values such as `SAR 0 × 76.5`.
     */
    /**
     * Resolve the foreign debit/credit used by a Currency-filtered ledger.
     *
     * The normal ledger amounts remain untouched. For a selected foreign
     * currency we first use explicit foreign_debit/foreign_credit values,
     * then fall back to the line currency rate, and finally the
     * currency_breakdown generated from the legacy InvTickets source.
     */
    private function currencyOptions(): array
    {
        if (! Schema::hasTable('currencies')) {
            return [
                [
                    'code' => 'SAR',
                    'name' => 'Saudi Riyal',
                ],
                [
                    'code' => 'USD',
                    'name' => 'US Dollar',
                ],
            ];
        }

        $columns =
            Schema::getColumnListing(
                'currencies'
            );

        $codeColumn =
            collect([
                'code',
                'currency_code',
                'currency',
                'Currency',
            ])->first(
                fn ($column) => in_array(
                    $column,
                    $columns,
                    true
                )
            );

        if ($codeColumn === null) {
            return [
                [
                    'code' => 'SAR',
                    'name' => 'Saudi Riyal',
                ],
                [
                    'code' => 'USD',
                    'name' => 'US Dollar',
                ],
            ];
        }

        $nameColumn =
            collect([
                'name',
                'currency_name',
                'full_name',
                'FullName',
            ])->first(
                fn ($column) => in_array(
                    $column,
                    $columns,
                    true
                )
            );

        $query =
            DB::table('currencies')
                ->select(
                    $codeColumn . ' as code'
                );

        if ($nameColumn !== null) {
            $query->addSelect(
                DB::raw(
                    '`' . $nameColumn . '` as name'
                )
            );
        } else {
            $query->selectRaw(
                '`' . $codeColumn . '` as code'
            );
            $query->selectRaw(
                '`' . $codeColumn . '` as name'
            );
        }

        if (
            in_array(
                'is_active',
                $columns,
                true
            )
        ) {
            $query->where(
                'is_active',
                1
            );
        }

        return $query
            ->whereNotNull(
                $codeColumn
            )
            ->where(
                $codeColumn,
                '<>',
                ''
            )
            ->orderBy(
                $codeColumn
            )
            ->get()
            ->map(
                fn ($currency) => [
                    'code' => strtoupper(
                        trim(
                            (string) $currency->code
                        )
                    ),
                    'name' => trim(
                        (string) (
                            $currency->name
                            ?? $currency->code
                        )
                    ),
                ]
            )
            ->values()
            ->all();
    }

    private function foreignAmountsForLine(
        $line,
        array $currencyBreakdowns,
        string $selectedCurrency
    ): ?array {
        $selectedCurrency =
            strtoupper(trim($selectedCurrency));

        if ($selectedCurrency === '') {
            return null;
        }

        $currency =
            strtoupper(
                trim(
                    (string) (
                        $line->currency_code
                        ?? ''
                    )
                )
            );

        $breakdown =
            $currencyBreakdowns[
                (int) $line->id
            ] ?? null;

        $breakdownCurrency = '';

        if (
            is_string($breakdown)
            && $breakdown !== ''
            && preg_match(
                '/^([A-Z]{3,10})\s+/i',
                $breakdown,
                $matches
            )
        ) {
            $breakdownCurrency =
                strtoupper(
                    trim(
                        (string) $matches[1]
                    )
                );
        }

        if (
            $currency === ''
            && $breakdownCurrency !== ''
        ) {
            $currency = $breakdownCurrency;
        }

        if ($currency !== $selectedCurrency) {
            return null;
        }

        $foreignDebit =
            abs(
                (float) (
                    $line->foreign_debit
                    ?? 0
                )
            );

        $foreignCredit =
            abs(
                (float) (
                    $line->foreign_credit
                    ?? 0
                )
            );

        if (
            $foreignDebit > 0.00005
            || $foreignCredit > 0.00005
        ) {
            return [
                'debit' => $foreignDebit,
                'credit' => $foreignCredit,
                'currency' => $currency,
            ];
        }

        /*
         * Most historical service lines retain the ROE even when explicit
         * foreign_debit/foreign_credit is zero. Derive foreign totals from
         * the base accounting amount and ROE.
         */
        $roe =
            (float) (
                $line->currency_rate
                ?? 0
            );

        if (
            $roe <= 0
            && is_string($breakdown)
            && preg_match(
                '/×\s*[^×]+×\s*([0-9,]+(?:\.[0-9]+)?)\s*$/u',
                $breakdown,
                $matches
            )
        ) {
            $roe =
                (float) str_replace(
                    ',',
                    '',
                    (string) $matches[1]
                );
        }

        if ($roe <= 0) {
            return null;
        }

        $baseDebit =
            max(
                (float) (
                    $line->debit
                    ?? 0
                ),
                0
            );

        $baseCredit =
            max(
                (float) (
                    $line->credit
                    ?? 0
                ),
                0
            );

        $derivedDebit =
            $baseDebit > 0
                ? $baseDebit / $roe
                : 0.0;

        $derivedCredit =
            $baseCredit > 0
                ? $baseCredit / $roe
                : 0.0;

        if (
            $derivedDebit <= 0.00005
            && $derivedCredit <= 0.00005
        ) {
            return null;
        }

        return [
            'debit' => $derivedDebit,
            'credit' => $derivedCredit,
            'currency' => $currency,
        ];
    }

    private function buildCurrencyBreakdowns($lines): array
    {
        $result = [];

        if (! $lines) {
            return $result;
        }

        /*
         * Native HBA invoices do not have to be reconstructed from the Accu
         * archive. Their journal lines already carry the posted base amount,
         * foreign amount (when available), currency quantity and ROE. Build the
         * same display formula used by the legacy ledger directly from those
         * values. This covers customer, vendor, commission and income rows.
         */
        foreach ($lines as $line) {
            $legacyData = trim((string) ($line->legacy_data ?? ''));
            if ($legacyData === '') {
                continue;
            }

            $meta = json_decode($legacyData, true);
            if (!is_array($meta) || empty($meta['native'])) {
                continue;
            }

            $currency = strtoupper(trim((string) ($line->currency_code ?? '')));
            $roe = (float) ($line->currency_rate ?? 0);
            $quantity = (float) ($line->currency_quantity ?? 0);

            if ($currency === '' || $roe <= 0) {
                continue;
            }

            if ($quantity <= 0) {
                $quantity = 1.0;
            }

            $foreignAmount = max(
                abs((float) ($line->foreign_debit ?? 0)),
                abs((float) ($line->foreign_credit ?? 0))
            );

            if ($foreignAmount <= 0.00005) {
                $baseAmount = max(
                    abs((float) ($line->debit ?? 0)),
                    abs((float) ($line->credit ?? 0))
                );

                if ($baseAmount > 0.00005) {
                    $foreignAmount = $baseAmount / $roe;
                }
            }

            if ($foreignAmount <= 0.00005) {
                continue;
            }

            $unitRate = $foreignAmount / $quantity;
            if ($unitRate <= 0.00005) {
                continue;
            }

            $result[(int) $line->id] = sprintf(
                '%s %s × %s × %s',
                $currency,
                $this->formatCurrencyFactor($unitRate),
                $this->formatCurrencyFactor($quantity),
                $this->formatCurrencyFactor($roe)
            );
        }

        $legacyDb = DB::connection('legacy');
        $legacySchema = $legacyDb->getSchemaBuilder();

        if (! $legacySchema->hasTable('InvTickets')) {
            return $result;
        }

        $columns = $legacySchema->getColumnListing('InvTickets');

        $required = [
            'InvTransuction ID',
            'InvInvoice ID',
            'InvMode',
            'InvNights',
            'InvRate',
            'Cur',
            'CurRate',
            'Quantity',
            'RoomQty',
            'Rate',
        ];

        foreach ($required as $column) {
            if (! in_array($column, $columns, true)) {
                return $result;
            }
        }

        // Master.ID is not the same identifier as the legacy InvTickets
        // transaction in every historical record. We therefore use BOTH:
        //   1) legacy_master_id -> InvTransuction ID
        //   2) legacy_reference_id -> InvInvoice ID
        // and also include the reference id for invoice/refund rows even when
        // the legacy_reference_type was not preserved perfectly.
        $masterIds = $lines
            ->pluck('legacy_master_id')
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        $referenceIds = $lines
            ->pluck('legacy_reference_id')
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if (empty($masterIds) && empty($referenceIds)) {
            return $result;
        }

        $ticketQuery = $legacyDb
            ->table('InvTickets')
            ->select($required)
            ->where(function (Builder $query) use ($masterIds, $referenceIds) {
                if (! empty($masterIds)) {
                    $query->whereIn('InvTransuction ID', $masterIds);
                }

                if (! empty($referenceIds)) {
                    $query->orWhereIn('InvInvoice ID', $referenceIds);
                }
            });

        $ticketRows = $ticketQuery->get();

        $byTransaction = [];
        $byInvoice = [];

        foreach ($ticketRows as $ticket) {
            $transactionId = (int) ($ticket->{'InvTransuction ID'} ?? 0);
            $invoiceId = $ticket->{'InvInvoice ID'} ?? null;

            if ($transactionId > 0) {
                $byTransaction[$transactionId][] = $ticket;
            }

            if ($invoiceId !== null && $invoiceId !== '') {
                $byInvoice[(int) $invoiceId][] = $ticket;
            }
        }

        // Optional authoritative hotel nightly rates. Query using the actual
        // InvTickets transaction IDs we matched, because Master.ID and
        // InvTransuction ID are not guaranteed to be the same historical key.
        $hotelNightRates = [];
        if ($legacySchema->hasTable('InvTickets_HotelRateDetails')) {
            $hotelDetailColumns = $legacySchema->getColumnListing('InvTickets_HotelRateDetails');

            if (
                in_array('TransactionID', $hotelDetailColumns, true)
                && in_array('NightRate', $hotelDetailColumns, true)
            ) {
                $transactionIds = $ticketRows
                    ->pluck('InvTransuction ID')
                    ->filter(fn ($id) => $id !== null && $id !== '')
                    ->map(fn ($id) => (int) $id)
                    ->filter(fn ($id) => $id > 0)
                    ->unique()
                    ->values()
                    ->all();

                if (! empty($transactionIds)) {
                    $detailRows = $legacyDb
                        ->table('InvTickets_HotelRateDetails')
                        ->select([
                            'TransactionID',
                            'NightRate',
                        ])
                        ->whereIn('TransactionID', $transactionIds)
                        ->get();

                    foreach ($detailRows as $detail) {
                        $transactionId = (int) ($detail->TransactionID ?? 0);
                        $nightRate = (float) ($detail->NightRate ?? 0);

                        if ($transactionId > 0 && $nightRate > 0) {
                            $hotelNightRates[$transactionId][] = $nightRate;
                        }
                    }
                }
            }
        }

        foreach ($lines as $line) {
            $lineId = (int) $line->id;

            // Native HBA lines were already calculated above. Never attempt to
            // match them to a legacy InvTickets row by invoice number.
            $legacyData = trim((string) ($line->legacy_data ?? ''));
            if ($legacyData !== '') {
                $meta = json_decode($legacyData, true);
                if (is_array($meta) && !empty($meta['native'])) {
                    continue;
                }
            }

            $lineMode = trim((string) ($line->mode ?? ''));
            $lineModeDescription = trim((string) ($line->mode_description ?? ''));
            $rawMode = strtoupper(trim($lineModeDescription !== '' ? $lineModeDescription : $lineMode));

            $hasTicketNumber = trim((string) ($line->ticket_no ?? '')) !== ''
                || trim((string) ($line->con_ticket_no ?? '')) !== '';

            // Ticket bookings are already posted in PKR/base currency.
            if (
                str_contains($rawMode, 'TICKET')
                || $hasTicketNumber
            ) {
                continue;
            }

            $modeClass = $this->currencyServiceMode($rawMode);

            // If the accounting line's mode is blank/too generic, inspect the
            // actual legacy InvTickets rows instead of classifying blank as ticket.
            if ($modeClass === 'ticket') {
                $modeClass = null;
            }

            $ticketRowsForLine = [];
            $masterId = (int) ($line->legacy_master_id ?? 0);

            if ($masterId > 0 && isset($byTransaction[$masterId])) {
                $ticketRowsForLine = $byTransaction[$masterId];
            }

            $legacyReferenceId = (int) ($line->legacy_reference_id ?? 0);
            if (empty($ticketRowsForLine) && $legacyReferenceId > 0 && isset($byInvoice[$legacyReferenceId])) {
                $ticketRowsForLine = $byInvoice[$legacyReferenceId];
            }

            if (empty($ticketRowsForLine)) {
                continue;
            }

            // When the ledger line says Hotel/Visa/Transfer, keep only that
            // service type from a mixed invoice. Otherwise infer it from data.
            if ($modeClass !== null) {
                $filtered = array_values(array_filter(
                    $ticketRowsForLine,
                    fn ($ticket) => $this->currencyServiceMode(
                        strtoupper(trim((string) ($ticket->{'InvMode'} ?? '')))
                    ) === $modeClass
                ));

                if (! empty($filtered)) {
                    $ticketRowsForLine = $filtered;
                }
            }

            $serviceMode = $modeClass;
            if ($serviceMode === null) {
                foreach ($ticketRowsForLine as $candidate) {
                    $candidateMode = $this->currencyServiceMode(
                        strtoupper(trim((string) ($candidate->{'InvMode'} ?? '')))
                    );

                    if (in_array($candidateMode, ['hotel', 'visa', 'transfer'], true)) {
                        $serviceMode = $candidateMode;
                        break;
                    }
                }
            }

            if (! in_array($serviceMode, ['hotel', 'visa', 'transfer'], true)) {
                continue;
            }

            $currencyCode = '';
            foreach ($ticketRowsForLine as $candidate) {
                $candidateCurrency = trim((string) ($candidate->{'Cur'} ?? ''));
                if ($candidateCurrency !== '') {
                    $currencyCode = strtoupper($candidateCurrency);
                    break;
                }
            }

            if ($currencyCode === '') {
                $currencyCode = strtoupper(trim((string) ($line->currency_code ?? '')));
            }

            if ($currencyCode === '') {
                continue;
            }

            $roe = 0.0;
            foreach ($ticketRowsForLine as $candidate) {
                $candidateRoe = (float) ($candidate->{'CurRate'} ?? 0);
                if ($candidateRoe > 0) {
                    $roe = $candidateRoe;
                    break;
                }
            }

            if ($roe <= 0) {
                $roe = (float) ($line->currency_rate ?? 0);
            }

            if ($roe <= 0) {
                continue;
            }

            $baseAmount = abs(
                (float) ($line->debit ?? 0) > 0
                    ? (float) ($line->debit ?? 0)
                    : (float) ($line->credit ?? 0)
            );

            $foreignDebit = (float) ($line->foreign_debit ?? 0);
            $foreignCredit = (float) ($line->foreign_credit ?? 0);

            $foreignTotal = 0.0;
            if (abs($foreignDebit) > 0.00005 || abs($foreignCredit) > 0.00005) {
                $foreignTotal = abs($foreignDebit) > 0.00005
                    ? abs($foreignDebit)
                    : abs($foreignCredit);
            } elseif ($baseAmount > 0) {
                // This is intentionally display-only. It never changes the
                // accounting amount; it simply reconstructs the SAR total.
                $foreignTotal = $baseAmount / $roe;
            }

            if ($foreignTotal <= 0) {
                continue;
            }

            $quantity = 1.0;
            $unitRate = 0.0;

            if ($serviceMode === 'hotel') {
                // Prefer the exact stay length stored by the legacy booking.
                $nights = (int) max(
                    0,
                    ...array_map(
                        fn ($candidate) => (int) ($candidate->{'InvNights'} ?? 0),
                        $ticketRowsForLine
                    )
                );

                // If the old InvTickets row has zero nights, recover them from
                // the imported Master stay dates.
                if ($nights <= 0 && ! empty($line->legacy_data)) {
                    $legacy = json_decode((string) $line->legacy_data, true);

                    if (is_array($legacy)) {
                        $from = $legacy['ServiceDateFrom']
                            ?? $legacy['service_date_from']
                            ?? null;
                        $to = $legacy['ServiceDateTo']
                            ?? $legacy['service_date_to']
                            ?? null;

                        if ($from && $to) {
                            try {
                                $fromDate = \Carbon\Carbon::parse($from)->startOfDay();
                                $toDate = \Carbon\Carbon::parse($to)->startOfDay();
                                $nights = max(0, $fromDate->diffInDays($toDate));
                            } catch (\Throwable $e) {
                                $nights = 0;
                            }
                        }
                    }
                }

                // Last fallback: recover dates from the visible ledger text.
                if ($nights <= 0) {
                    if (preg_match(
                        '/(\d{2}\/\d{2}\/\d{2})\D+(\d{2}\/\d{2}\/\d{2})/',
                        (string) ($line->sector_description ?? $line->particulars ?? ''),
                        $matches
                    )) {
                        try {
                            $fromDate = \Carbon\Carbon::createFromFormat('d/m/y', $matches[1])->startOfDay();
                            $toDate = \Carbon\Carbon::createFromFormat('d/m/y', $matches[2])->startOfDay();
                            $nights = max(0, $fromDate->diffInDays($toDate));
                        } catch (\Throwable $e) {
                            $nights = 0;
                        }
                    }
                }

                // The ledger description generated above can contain the date
                // range too, so try it as an additional fallback.
                if ($nights <= 0) {
                    if (preg_match(
                        '/(\d{2}\/\d{2}\/\d{2})\D+(\d{2}\/\d{2}\/\d{2})/',
                        (string) ($line->particulars ?? ''),
                        $matches
                    )) {
                        try {
                            $fromDate = \Carbon\Carbon::createFromFormat('d/m/y', $matches[1])->startOfDay();
                            $toDate = \Carbon\Carbon::createFromFormat('d/m/y', $matches[2])->startOfDay();
                            $nights = max(0, $fromDate->diffInDays($toDate));
                        } catch (\Throwable $e) {
                            $nights = 0;
                        }
                    }
                }

                if ($nights <= 0) {
                    continue;
                }

                // HotelRateDetails is the cleanest source for per-night rates.
                $detailRates = [];
                foreach ($ticketRowsForLine as $candidate) {
                    $transactionId = (int) ($candidate->{'InvTransuction ID'} ?? 0);
                    foreach ($hotelNightRates[$transactionId] ?? [] as $nightRate) {
                        if ($nightRate > 0) {
                            $detailRates[] = $nightRate;
                        }
                    }
                }

                if (! empty($detailRates)) {
                    $unitRate = array_sum($detailRates) / count($detailRates);
                }

                // InvTickets.Rate / InvRate are secondary legacy fallbacks.
                if ($unitRate <= 0) {
                    foreach ($ticketRowsForLine as $candidate) {
                        $candidateRate = (float) ($candidate->{'Rate'} ?? 0);
                        if ($candidateRate <= 0) {
                            $candidateRate = (float) ($candidate->{'InvRate'} ?? 0);
                        }
                        if ($candidateRate > 0) {
                            $unitRate = $candidateRate;
                            break;
                        }
                    }
                }

                // Most important: make the displayed formula reproduce the
                // actual posted accounting amount within rounding tolerance.
                $derivedRate = $foreignTotal / $nights;
                if (
                    $unitRate <= 0
                    || abs(($unitRate * $nights) - $foreignTotal) > max(0.5, $foreignTotal * 0.01)
                ) {
                    $unitRate = $derivedRate;
                }

                $quantity = $nights;
            } else {
                $quantities = array_map(
                    fn ($candidate) => (float) ($candidate->{'Quantity'} ?? 0),
                    $ticketRowsForLine
                );

                $positiveQuantities = array_filter(
                    $quantities,
                    fn (float $value) => $value > 0
                );

                if (! empty($positiveQuantities)) {
                    $quantity = array_sum($positiveQuantities);
                } elseif ((float) ($line->currency_quantity ?? 0) > 0) {
                    $quantity = (float) $line->currency_quantity;
                } else {
                    $quantity = 1.0;
                }

                foreach ($ticketRowsForLine as $candidate) {
                    $candidateRate = (float) ($candidate->{'Rate'} ?? 0);
                    if ($candidateRate <= 0) {
                        $candidateRate = (float) ($candidate->{'InvRate'} ?? 0);
                    }
                    if ($candidateRate > 0) {
                        $unitRate = $candidateRate;
                        break;
                    }
                }

                $derivedRate = $foreignTotal / max(1.0, $quantity);
                if (
                    $unitRate <= 0
                    || abs(($unitRate * $quantity) - $foreignTotal) > max(0.5, $foreignTotal * 0.01)
                ) {
                    $unitRate = $derivedRate;
                }
            }

            if ($unitRate <= 0 || $quantity <= 0) {
                continue;
            }

            $result[$lineId] = sprintf(
                '%s %s × %s × %s',
                $currencyCode,
                $this->formatCurrencyFactor($unitRate),
                $this->formatCurrencyFactor($quantity),
                $this->formatCurrencyFactor($roe)
            );
        }

        return $result;
    }

    private function currencyServiceMode(string $mode): ?string
    {
        $mode = strtoupper(trim($mode));

        if ($mode === '' || str_contains($mode, 'TICKET')) {
            return 'ticket';
        }

        if (str_contains($mode, 'HOTEL')) {
            return 'hotel';
        }

        if (str_contains($mode, 'VISA')) {
            return 'visa';
        }

        if (
            str_contains($mode, 'TRANSFER')
            || str_contains($mode, 'VEHICLE')
            || str_contains($mode, 'TRANSPORT')
            || str_contains($mode, 'CAR RENT')
        ) {
            return 'transfer';
        }

        return null;
    }

    private function formatCurrencyFactor(float $value): string
    {
        if (abs($value - round($value)) < 0.005) {
            return number_format($value, 0, '.', ',');
        }

        return rtrim(
            rtrim(number_format($value, 2, '.', ','), '0'),
            '.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Company information
    |--------------------------------------------------------------------------
    |
    | These are intentionally centralized here so the future Settings
    | module can replace these values without touching the report.
    |
    */
    private function companyData(): array
{
    return app(
        CompanySettingsService::class
    )->reportData();
}

    private function fileDataUri(
        ?string $path
    ): ?string {
        if (
            ! $path
            ||
            ! is_file($path)
        ) {
            return null;
        }

        $mime =
            mime_content_type(
                $path
            )
            ?: 'image/png';

        $data =
            file_get_contents(
                $path
            );

        if (
            $data === false
        ) {
            return null;
        }

        return
            'data:' .
            $mime .
            ';base64,' .
            base64_encode(
                $data
            );
    }

    private function safeFilename(
        string $filename
    ): string {
        return preg_replace(
            '/[^A-Za-z0-9._-]+/',
            '-',
            $filename
        ) ?: 'ledger.xlsx';
    }

    /*
    |--------------------------------------------------------------------------
    | XLSX helpers
    |--------------------------------------------------------------------------
    */

    private function xmlEscape(
        mixed $value
    ): string {
        return htmlspecialchars(
            (string) (
                $value
                ?? ''
            ),
            ENT_XML1 |
            ENT_COMPAT,
            'UTF-8'
        );
    }

    private function xlsxContentTypes(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
XML;
    }

    private function xlsxRootRelationships(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;
    }

    private function xlsxWorkbook(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="Ledger" sheetId="1" r:id="rId1"/>
    </sheets>
</workbook>
XML;
    }

    private function xlsxWorkbookRelationships(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
XML;
    }

    private function xlsxStyles(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">

    <numFmts count="2">
        <numFmt numFmtId="164" formatCode="#,##0.00"/>
        <numFmt numFmtId="165" formatCode="#,##0"/>
    </numFmts>

    <fonts count="3">
        <font>
            <sz val="11"/>
            <name val="Aptos"/>
        </font>

        <font>
            <b/>
            <sz val="14"/>
            <name val="Aptos Display"/>
        </font>

        <font>
            <b/>
            <sz val="11"/>
            <name val="Aptos"/>
        </font>
    </fonts>

    <fills count="3">
        <fill>
            <patternFill patternType="none"/>
        </fill>

        <fill>
            <patternFill patternType="gray125"/>
        </fill>

        <fill>
            <patternFill patternType="solid">
                <fgColor rgb="E5E7EB"/>
                <bgColor indexed="64"/>
            </patternFill>
        </fill>
    </fills>

    <borders count="2">
        <border>
            <left/>
            <right/>
            <top/>
            <bottom/>
            <diagonal/>
        </border>

        <border>
            <left style="thin">
                <color rgb="B7B7B7"/>
            </left>
            <right style="thin">
                <color rgb="B7B7B7"/>
            </right>
            <top style="thin">
                <color rgb="B7B7B7"/>
            </top>
            <bottom style="thin">
                <color rgb="B7B7B7"/>
            </bottom>
        </border>
    </borders>

    <cellStyleXfs count="1">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    </cellStyleXfs>

    <cellXfs count="5">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1">
            <alignment horizontal="center" vertical="center"/>
        </xf>
        <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1">
            <alignment horizontal="right"/>
        </xf>
        <xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyAlignment="1">
            <alignment horizontal="right"/>
        </xf>
    </cellXfs>

    <cellStyles count="1">
        <cellStyle name="Normal" xfId="0" builtinId="0"/>
    </cellStyles>

</styleSheet>
XML;
    }

    private function xlsxInlineString(
        string $cellReference,
        string $value,
        int $style = 0
    ): string {
        return
            '<c r="' .
            $this->xmlEscape(
                $cellReference
            ) .
            '" t="inlineStr" s="' .
            $style .
            '">' .
            '<is><t xml:space="preserve">' .
            $this->xmlEscape(
                $value
            ) .
            '</t></is>' .
            '</c>';
    }

    private function xlsxNumber(
        string $cellReference,
        float|int $value,
        int $style = 3
    ): string {
        $formatted =
            rtrim(
                rtrim(
                    number_format(
                        (float) $value,
                        4,
                        '.',
                        ''
                    ),
                    '0'
                ),
                '.'
            );

        if (
            $formatted === ''
            ||
            $formatted === '-0'
        ) {
            $formatted =
                '0';
        }

        return
            '<c r="' .
            $this->xmlEscape(
                $cellReference
            ) .
            '" s="' .
            $style .
            '">' .
            '<v>' .
            $formatted .
            '</v>' .
            '</c>';
    }

    private function xlsxWorksheet(
        array $data
    ): string {
        $rows =
            [];

        /*
         * Title.
         */
        $rows[] =
            '<row r="1">' .
            $this->xlsxInlineString(
                'A1',
                $data['company']['name'],
                1
            ) .
            '</row>';

        $rows[] =
            '<row r="2">' .
            $this->xlsxInlineString(
                'A2',
                $data['company']['tagline'],
                0
            ) .
            '</row>';

        $rows[] =
            '<row r="3">' .
            $this->xlsxInlineString(
                'A3',
                (
                    ! empty($data['selectedCurrency'])
                        ? 'Foreign Currency Ledger of '
                        : 'Ledger of '
                ) .
                (
                    $data['selectedAccount']['name']
                    ?? ''
                ),
                1
            ) .
            '</row>';

        $rows[] =
            '<row r="4">' .
            $this->xlsxInlineString(
                'A4',
                'Account Code: ' .
                (
                    $data['selectedAccount']['code']
                    ?? ''
                ),
                0
            ) .
            $this->xlsxInlineString(
                'D4',
                'From: ' .
                $data['dateFrom'],
                0
            ) .
            $this->xlsxInlineString(
                'F4',
                'To: ' .
                $data['dateTo'],
                0
            ) .
            (
                ! empty($data['selectedCurrency'])
                    ? $this->xlsxInlineString(
                        'H4',
                        'Currency: ' .
                        (
                            $data['selectedCurrencyName']
                            ?? $data['selectedCurrency']
                        ),
                        0
                    )
                    : ''
            ) .
            '</row>';

        /*
         * Table header.
         */
        $headerRow =
            6;

        $rows[] =
            '<row r="' .
            $headerRow .
            '">' .
            $this->xlsxInlineString(
                'A6',
                'Date',
                2
            ) .
            $this->xlsxInlineString(
                'B6',
                'VT',
                2
            ) .
            $this->xlsxInlineString(
                'C6',
                'V. ID',
                2
            ) .
            $this->xlsxInlineString(
                'D6',
                'Ref',
                2
            ) .
            $this->xlsxInlineString(
                'E6',
                'Description',
                2
            ) .
            $this->xlsxInlineString(
                'F6',
                'Debit',
                2
            ) .
            $this->xlsxInlineString(
                'G6',
                'Credit',
                2
            ) .
            $this->xlsxInlineString(
                'H6',
                'Balance',
                2
            ) .
            '</row>';

        $excelRow =
            7;

        /*
         * B/F.
         */
        $opening =
            (float) (
                $data['openingBalance']
                ?? 0
            );

        $rows[] =
            '<row r="' .
            $excelRow .
            '">' .
            $this->xlsxInlineString(
                "A{$excelRow}",
                '',
                0
            ) .
            $this->xlsxInlineString(
                "B{$excelRow}",
                'B/F',
                2
            ) .
            $this->xlsxInlineString(
                "C{$excelRow}",
                '',
                0
            ) .
            $this->xlsxInlineString(
                "D{$excelRow}",
                '',
                0
            ) .
            $this->xlsxInlineString(
                "E{$excelRow}",
                'Balance B/F',
                0
            ) .
            (
                $opening > 0
                    ? $this->xlsxNumber(
                        "F{$excelRow}",
                        $opening
                    )
                    : ''
            ) .
            (
                $opening < 0
                    ? $this->xlsxNumber(
                        "G{$excelRow}",
                        abs(
                            $opening
                        )
                    )
                    : ''
            ) .
            $this->xlsxNumber(
                "H{$excelRow}",
                abs(
                    $opening
                )
            ) .
            '</row>';

        $excelRow++;

        foreach (
            $data['rows'] as $row
        ) {
            $rows[] =
                '<row r="' .
                $excelRow .
                '">' .

                $this->xlsxInlineString(
                    "A{$excelRow}",
                    (string) (
                        $row['date']
                        ?? ''
                    )
                ) .

                $this->xlsxInlineString(
                    "B{$excelRow}",
                    (string) (
                        $row['type']
                        ?? ''
                    ),
                    0
                ) .

                $this->xlsxInlineString(
                    "C{$excelRow}",
                    (string) (
                        $row['voucher_id']
                        ?? ''
                    )
                ) .

                $this->xlsxInlineString(
                    "D{$excelRow}",
                    (string) (
                        $row['ref']
                        ?? ''
                    )
                ) .

                $this->xlsxInlineString(
                    "E{$excelRow}",
                    trim(
                        (string) (
                            $row['description']
                            ?? ''
                        )
                        . (
                            ! empty($row['currency_breakdown'])
                                ? " | " . $row['currency_breakdown']
                                : ''
                        )
                    )
                ) .

                (
                    ((float) (
                        $row['debit']
                        ?? 0
                    )) > 0
                        ? $this->xlsxNumber(
                            "F{$excelRow}",
                            (float) (
                                $row['debit']
                            )
                        )
                        : ''
                ) .

                (
                    ((float) (
                        $row['credit']
                        ?? 0
                    )) > 0
                        ? $this->xlsxNumber(
                            "G{$excelRow}",
                            (float) (
                                $row['credit']
                            )
                        )
                        : ''
                ) .

                $this->xlsxInlineString(
                    "H{$excelRow}",
                    number_format(
                        abs(
                            (float) (
                                $row['balance']
                                ?? 0
                            )
                        ),
                        2,
                        '.',
                        ''
                    )
                    .
                    ' '
                    .
                    (
                        $row['side']
                        ?? 'Dr'
                    )
                ) .

                '</row>';

            $excelRow++;
        }

        /*
         * Totals.
         */
        $rows[] =
            '<row r="' .
            $excelRow .
            '">' .
            $this->xlsxInlineString(
                "E{$excelRow}",
                'Period Totals',
                2
            ) .
            $this->xlsxNumber(
                "F{$excelRow}",
                (float) (
                    $data['periodDebit']
                    ?? 0
                ),
                4
            ) .
            $this->xlsxNumber(
                "G{$excelRow}",
                (float) (
                    $data['periodCredit']
                    ?? 0
                ),
                4
            ) .
            $this->xlsxInlineString(
                "H{$excelRow}",
                number_format(
                    abs(
                        (float) (
                            $data['closingBalance']
                            ?? 0
                        )
                    ),
                    2,
                    '.',
                    ''
                )
                .
                ' '
                .
                (
                    (
                        (float) (
                            $data['closingBalance']
                            ?? 0
                        )
                    ) < 0
                        ? 'Cr'
                        : 'Dr'
                ),
                4
            ) .
            '</row>';

        return
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' .

            '<sheetViews>' .
            '<sheetView workbookViewId="0">' .
            '<pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/>' .
            '</sheetView>' .
            '</sheetViews>' .

            '<cols>' .
            '<col min="1" max="1" width="14" customWidth="1"/>' .
            '<col min="2" max="2" width="9" customWidth="1"/>' .
            '<col min="3" max="3" width="12" customWidth="1"/>' .
            '<col min="4" max="4" width="18" customWidth="1"/>' .
            '<col min="5" max="5" width="70" customWidth="1"/>' .
            '<col min="6" max="8" width="18" customWidth="1"/>' .
            '</cols>' .

            '<sheetData>' .
            implode(
                '',
                $rows
            ) .
            '</sheetData>' .

            '<autoFilter ref="A6:H' .
            $excelRow .
            '"/>' .

            '<mergeCells count="3">' .
            '<mergeCell ref="A1:H1"/>' .
            '<mergeCell ref="A2:H2"/>' .
            '<mergeCell ref="A3:H3"/>' .
            '</mergeCells>' .

            '</worksheet>';
    }
}