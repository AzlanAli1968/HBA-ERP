<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JournalVoucherController extends Controller
{
    public function create(): Response
    {
        return Inertia::render(
            'Accounting/JournalVouchers/Form',
            $this->formData(null)
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateRequest($request);

        $voucherId = DB::transaction(
            fn () => $this->saveVoucher(
                null,
                $request,
                $data
            )
        );

        return redirect()
            ->route('accounting.journal-vouchers.all')
            ->with(
                'success',
                'Journal Voucher #' .
                $this->voucherNumber($voucherId) .
                ' created successfully.'
            );
    }

    public function storeFromWhatsApp(
    Request $request
): \Illuminate\Http\JsonResponse {
    $data =
        $this->validateRequest(
            $request
        );

    $voucherId =
        DB::transaction(
            function () use (
                $request,
                $data
            ) {
                return $this->saveVoucher(
                    null,
                    $request,
                    $data
                );
            }
        );

    $voucher =
        DB::table('vouchers')
            ->where(
                'id',
                $voucherId
            )
            ->select([
                'id',
                'voucher_no',
                'voucher_date',
                'voucher_type',
                'ref_no',
            ])
            ->first();

    $totals =
        DB::table(
            'journal_entry_lines'
        )
            ->where(
                'voucher_id',
                $voucherId
            )
            ->selectRaw(
                'COALESCE(SUM(debit), 0) AS total_debit'
            )
            ->selectRaw(
                'COALESCE(SUM(credit), 0) AS total_credit'
            )
            ->first();

    return response()->json([
        'ok' =>
            true,

        'voucher' => [
            'id' =>
                (int) $voucher->id,

            'voucher_no' =>
                (string) $voucher->voucher_no,

            'voucher_date' =>
                (string) $voucher->voucher_date,

            'voucher_type' =>
                'JV',

            'ref_no' =>
                $voucher->ref_no,

            'total_debit' =>
                round(
                    (float) (
                        $totals->total_debit
                        ?? 0
                    ),
                    4
                ),

            'total_credit' =>
                round(
                    (float) (
                        $totals->total_credit
                        ?? 0
                    ),
                    4
                ),
        ],
    ]);
}

    public function edit(int $voucher): Response
    {
        $record = DB::table('vouchers')
            ->where('id', $voucher)
            ->first();

        if (! $record) {
            abort(404);
        }

        if (
            strtoupper((string) $record->voucher_type)
            !== 'JV'
        ) {
            abort(
                422,
                'This voucher is not a Journal Voucher.'
            );
        }

        return Inertia::render(
            'Accounting/JournalVouchers/Form',
            $this->formData($record)
        );
    }

    public function update(
        Request $request,
        int $voucher
    ) {
        $record = DB::table('vouchers')
            ->where('id', $voucher)
            ->first();

        if (! $record) {
            abort(404);
        }

        if (
            strtoupper((string) $record->voucher_type)
            !== 'JV'
        ) {
            abort(
                422,
                'This voucher is not a Journal Voucher.'
            );
        }

        $data = $this->validateRequest($request);

        DB::transaction(
            function () use (
                $request,
                $data,
                $record
            ) {
                $this->saveVoucher(
                    (int) $record->id,
                    $request,
                    $data
                );
            }
        );

        return redirect()
            ->route('accounting.journal-vouchers.all')
            ->with(
                'success',
                'Journal Voucher #' .
                $this->voucherNumber(
                    (int) $record->id
                ) .
                ' updated successfully.'
            );
    }

    public function destroy(int $voucher)
{
    $record = DB::table('vouchers')
        ->where('id', $voucher)
        ->first();

    if (! $record) {
        abort(404);
    }

    if (
        strtoupper(
            (string) $record->voucher_type
        ) !== 'JV'
    ) {
        abort(
            422,
            'This voucher is not a Journal Voucher.'
        );
    }

    // Protect migrated/imported historical JVs.
    if ($record->legacy_voucher_id !== null) {
        abort(
            422,
            'Historical imported Journal Vouchers cannot be deleted.'
        );
    }

    $voucherNo = (string) (
        $record->voucher_no
        ?? $record->id
    );

    DB::transaction(
        function () use ($voucher) {
            DB::table('journal_entry_lines')
                ->where('voucher_id', $voucher)
                ->delete();

            DB::table('journal_entries')
                ->where('voucher_id', $voucher)
                ->delete();

            DB::table('vouchers')
                ->where('id', $voucher)
                ->delete();
        }
    );

    return redirect()
        ->route(
            'accounting.journal-vouchers.all'
        )
        ->with(
            'success',
            'Journal Voucher #' .
            $voucherNo .
            ' deleted successfully.'
        );
}

    /*
    |--------------------------------------------------------------------------
    | Invoice lookup endpoint
    |--------------------------------------------------------------------------
    |
    | This is called by the React form after an account is selected.
    |
    */
    public function invoices(
        Request $request
    ) {
        $data = $request->validate([
            'account_id' => [
                'required',
                'integer',
                'exists:accounts,id',
            ],

            'include_invoice_id' => [
                'nullable',
                'integer',
                'exists:invoices,id',
            ],

            'exclude_voucher_id' => [
                'nullable',
                'integer',
                'exists:vouchers,id',
            ],
        ]);

        return response()->json([
            'invoices' =>
                $this->invoiceOptionsForAccount(
                    (int) $data['account_id'],
                    isset(
                        $data['exclude_voucher_id']
                    )
                        ? (int) $data['exclude_voucher_id']
                        : null,
                    isset(
                        $data['include_invoice_id']
                    )
                        ? (int) $data['include_invoice_id']
                        : null
                ),
        ]);
    }

    public function today(
        Request $request
    ): Response {
        return $this->listResponse(
            $request,
            true
        );
    }

    public function all(
        Request $request
    ): Response {
        return $this->listResponse(
            $request,
            false
        );
    }

    public function index(
        Request $request
    ): Response {
        return $this->all($request);
    }

    private function listResponse(
        Request $request,
        bool $todayOnly
    ): Response {
        $data = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:150',
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
        ]);

        $search = trim(
            (string) (
                $data['search']
                ?? ''
            )
        );

        $today =
            now()->toDateString();

        if ($todayOnly) {
            $dateFrom = $today;
            $dateTo = $today;
        } else {
            $dateFrom =
                $data['date_from']
                ?? '2000-01-01';

            $dateTo =
                $data['date_to']
                ?? $today;
        }

        $query =
            DB::table(
                'vouchers as v'
            )
                ->leftJoin(
                    'users as u',
                    'u.id',
                    '=',
                    'v.created_by'
                )
                ->leftJoin(
                    'branches as b',
                    'b.id',
                    '=',
                    'v.branch_id'
                )
                ->leftJoin(
                    'departments as d',
                    'd.id',
                    '=',
                    'v.department_id'
                )
                ->where(
                    'v.voucher_type',
                    'JV'
                )
                ->whereDate(
                    'v.voucher_date',
                    '>=',
                    $dateFrom
                )
                ->whereDate(
                    'v.voucher_date',
                    '<=',
                    $dateTo
                )
                ->select([
                    'v.id',
                    'v.legacy_voucher_id',
                    'v.voucher_no',
                    'v.voucher_date',
                    'v.ref_no',
                    'v.combine_voucher',
                    'v.supervised',
                    'v.branch_id',
                    'v.department_id',
                    'b.name as branch_name',
                    'd.name as department_name',
                    'u.name as entered_by_name',
                    'v.legacy_entered_by',
                ]);

        if ($search !== '') {
            $query->where(
                function ($q) use ($search) {
                    $q->where(
                        'v.voucher_no',
                        'like',
                        "%{$search}%"
                    )
                        ->orWhere(
                            'v.ref_no',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'b.name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'd.name',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        $vouchers =
            $query
                ->orderByDesc(
                    'v.voucher_date'
                )
                ->orderByDesc(
                    'v.id'
                )
                ->get();

        $voucherIds =
            $vouchers
                ->pluck('id')
                ->map(
                    fn ($id) =>
                        (int) $id
                )
                ->all();

        $linesByVoucher =
            collect();

        if (! empty($voucherIds)) {
            $lines =
                DB::table(
                    'journal_entry_lines as l'
                )
                    ->leftJoin(
                        'accounts as a',
                        'a.id',
                        '=',
                        'l.account_id'
                    )
                    ->whereIn(
                        'l.voucher_id',
                        $voucherIds
                    )
                    ->select([
                        'l.id',
                        'l.voucher_id',
                        'l.account_id',
                        'l.account_code',
                        'l.particulars',
                        'l.invoice_id',
                        'l.legacy_invoice_no',
                        'l.legacy_invoice_no_2',
                        'l.posting_date',
                        'l.currency_code',
                        'l.currency_quantity',
                        'l.currency_rate',
                        'l.debit',
                        'l.credit',
                        'l.foreign_debit',
                        'l.foreign_credit',
                        'l.legacy_data',
                        'a.name as account_name',
                    ])
                    ->orderBy('l.id')
                    ->get();

            $linesByVoucher =
                $lines->groupBy(
                    fn ($line) =>
                        (int) $line->voucher_id
                );
        }

        $result = [];

        $summaryDebit = 0.0;
        $summaryCredit = 0.0;
        $summaryLines = 0;

        foreach ($vouchers as $voucher) {
            $voucherLines =
                $linesByVoucher->get(
                    (int) $voucher->id,
                    collect()
                );

            $details = [];

            $debitTotal = 0.0;
            $creditTotal = 0.0;

            foreach (
                $voucherLines as $index => $line
            ) {
                [
                    $legacyData,
                    $ui,
                ] =
                    $this->decodeLineMetadata(
                        $line->legacy_data
                    );

                $debit =
                    (float) (
                        $line->debit
                        ?? 0
                    );

                $credit =
                    (float) (
                        $line->credit
                        ?? 0
                    );

                $debitTotal +=
                    $debit;

                $creditTotal +=
                    $credit;

                $invoiceNo =
                    $this->resolveInvoiceNo(
                        $line,
                        $legacyData,
                        $ui
                    );

                $currencySide =
                    $ui['currency_side']
                    ?? null;

                if (
                    $currencySide !== 'credit'
                    &&
                    $currencySide !== 'debit'
                ) {
                    $currencySide =
                        $credit > 0
                            ? 'credit'
                            : 'debit';
                }

                $details[] = [
                    'id' =>
                        (int) $line->id,

                    'sr' =>
                        $index + 1,

                    'account_id' =>
                        $line->account_id !== null
                            ? (int) $line->account_id
                            : null,

                    'account_code' =>
                        (string) (
                            $line->account_code
                            ?? ''
                        ),

                    'account_name' =>
                        (string) (
                            $line->account_name
                            ?? ''
                        ),

                    'invoice_id' =>
                        $line->invoice_id !== null
                            ? (int) $line->invoice_id
                            : null,

                    'inv_no' =>
                        $invoiceNo,

                    'particulars' =>
                        (string) (
                            $line->particulars
                            ?? ''
                        ),

                    'cheque_no' =>
                        isset(
                            $ui['cheque_no']
                        )
                            ? trim(
                                (string) (
                                    $ui['cheque_no']
                                )
                            )
                            : '',

                    'posting_date' =>
                        $line->posting_date
                            ? substr(
                                (string) $line->posting_date,
                                0,
                                10
                            )
                            : null,

                    'currency_code' =>
                        $line->currency_code !== null
                            ? (string) (
                                $line->currency_code
                            )
                            : '',

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

                    'currency_side' =>
                        $currencySide,

                    'debit' =>
                        round(
                            $debit,
                            4
                        ),

                    'credit' =>
                        round(
                            $credit,
                            4
                        ),

                    'foreign_debit' =>
                        $line->foreign_debit !== null
                            ? (float) (
                                $line->foreign_debit
                            )
                            : null,

                    'foreign_credit' =>
                        $line->foreign_credit !== null
                            ? (float) (
                                $line->foreign_credit
                            )
                            : null,

                    'c' =>
                        isset($ui['c'])
                            ? (bool) $ui['c']
                            : false,
                ];
            }

            $result[] = [
                'id' =>
                    (int) $voucher->id,

                'legacy_voucher_id' =>
                    $voucher->legacy_voucher_id !== null
                        ? (int) (
                            $voucher->legacy_voucher_id
                        )
                        : null,

                'voucher_no' =>
                    (string) $voucher->voucher_no,

                'voucher_date' =>
                    substr(
                        (string) $voucher->voucher_date,
                        0,
                        10
                    ),

                'ref_no' =>
                    $voucher->ref_no !== null
                        ? (string) $voucher->ref_no
                        : null,

                'combine_voucher' =>
                    (bool) $voucher->combine_voucher,

                'supervised' =>
                    (bool) $voucher->supervised,

                'branch_name' =>
                    (string) (
                        $voucher->branch_name
                        ?? ''
                    ),

                'department_name' =>
                    (string) (
                        $voucher->department_name
                        ?? ''
                    ),

                'entered_by' =>
                    (string) (
                        $voucher->entered_by_name
                        ??
                        $voucher->legacy_entered_by
                        ??
                        ''
                    ),

                'details' =>
                    $details,

                'debit_total' =>
                    round(
                        $debitTotal,
                        4
                    ),

                'credit_total' =>
                    round(
                        $creditTotal,
                        4
                    ),

                'balanced' =>
                    abs(
                        $debitTotal
                        -
                        $creditTotal
                    ) < 0.00005,
            ];

            $summaryDebit +=
                $debitTotal;

            $summaryCredit +=
                $creditTotal;

            $summaryLines +=
                count($details);
        }

        return Inertia::render(
            'Accounting/JournalVouchers/List',
            [
                'mode' =>
                    $todayOnly
                        ? 'today'
                        : 'all',

                'title' =>
                    $todayOnly
                        ? "Today's Journal Vouchers List"
                        : 'All Journal Vouchers List',

                'search' =>
                    $search,

                'dateFrom' =>
                    $dateFrom,

                'dateTo' =>
                    $dateTo,

                'vouchers' =>
                    $result,

                'summary' => [
                    'voucher_count' =>
                        count($result),

                    'line_count' =>
                        $summaryLines,

                    'total_debit' =>
                        round(
                            $summaryDebit,
                            4
                        ),

                    'total_credit' =>
                        round(
                            $summaryCredit,
                            4
                        ),

                    'balanced' =>
                        abs(
                            $summaryDebit
                            -
                            $summaryCredit
                        ) < 0.00005,
                ],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    private function formData(
        ?object $voucher
    ): array {
        $accounts =
            DB::table('accounts')
                ->where('is_active', 1)
                ->select([
                    'id',
                    'code',
                    'name',
                    'account_type_id',
                ])
                ->orderBy('code')
                ->get()
                ->map(
                    fn ($account) => [
                        'id' =>
                            (int) $account->id,

                        'code' =>
                            (string) $account->code,

                        'name' =>
                            (string) $account->name,

                        'account_type_id' =>
                            $account->account_type_id !== null
                                ? (int) (
                                    $account->account_type_id
                                )
                                : null,
                    ]
                )
                ->values()
                ->all();

        $branches =
            DB::table('branches')
                ->select([
                    'id',
                    'name',
                    'legacy_id',
                ])
                ->orderBy('name')
                ->get()
                ->map(
                    fn ($branch) => [
                        'id' =>
                            (int) $branch->id,

                        'name' =>
                            (string) $branch->name,

                        'legacy_id' =>
                            $branch->legacy_id !== null
                                ? (int) (
                                    $branch->legacy_id
                                )
                                : null,
                    ]
                )
                ->values()
                ->all();

        $departments =
            DB::table('departments')
                ->select([
                    'id',
                    'name',
                    'legacy_id',
                ])
                ->orderBy('name')
                ->get()
                ->map(
                    fn ($department) => [
                        'id' =>
                            (int) $department->id,

                        'name' =>
                            (string) $department->name,

                        'legacy_id' =>
                            $department->legacy_id !== null
                                ? (int) (
                                    $department->legacy_id
                                )
                                : null,
                    ]
                )
                ->values()
                ->all();

        $currencies = [
            [
                'code' =>
                    'SAR',
                'name' =>
                    'Saudi Riyal',
            ],
            [
                'code' =>
                    'USD',
                'name' =>
                    'US Dollar',
            ],
        ];

        $lines = [];

        if ($voucher) {
            $dbLines =
                DB::table(
                    'journal_entry_lines'
                )
                    ->where(
                        'voucher_id',
                        $voucher->id
                    )
                    ->orderBy('id')
                    ->get();

            $accountMap =
                collect($accounts)
                    ->keyBy('id');

            foreach ($dbLines as $line) {
                [
                    $legacyData,
                    $ui,
                ] =
                    $this->decodeLineMetadata(
                        $line->legacy_data
                    );

                $invoiceNo =
                    $this->resolveInvoiceNo(
                        $line,
                        $legacyData,
                        $ui
                    );

                $invoiceId =
                    $line->invoice_id !== null
                        ? (int) $line->invoice_id
                        : null;

                $invoice =
                    null;

                if (
                    $invoiceId !== null
                    &&
                    $line->account_id !== null
                ) {
                    $invoice =
                        $this->invoiceOptionForSelection(
                            $invoiceId,
                            (int) $line->account_id,
                            (int) $voucher->id
                        );
                }

                $account =
                    $accountMap->get(
                        (int) $line->account_id
                    );

                $currency =
                    strtoupper(
                        trim(
                            (string) (
                                $line->currency_code
                                ?? ''
                            )
                        )
                    );

                $currencySide =
                    $ui['currency_side']
                    ?? null;

                if (
                    $currencySide !== 'credit'
                    &&
                    $currencySide !== 'debit'
                ) {
                    $currencySide =
                        (float) (
                            $line->credit
                            ?? 0
                        ) > 0
                            ? 'credit'
                            : 'debit';
                }

                $invoiceLabel =
                    $invoice['label']
                    ??
                    (
                        $invoiceNo !== ''
                            ? 'INV #' . $invoiceNo
                            : ''
                    );

                $invoiceBalance =
                    $invoice !== null
                        ? number_format(
                            (float) (
                                $invoice['balance']
                                ?? 0
                            ),
                            2,
                            '.',
                            ''
                        )
                        : '';

                $lines[] = [
                    'account_id' =>
                        $line->account_id !== null
                            ? (int) (
                                $line->account_id
                            )
                            : null,

                    'account_code' =>
                        (string) (
                            $line->account_code
                            ?? ''
                        ),

                    'account_name' =>
                        $account['name']
                        ?? '',

                    'invoice_id' =>
                        $invoiceId,

                    'inv_no' =>
                        $invoiceNo,

                    'invoice_label' =>
                        $invoiceLabel,

                    'invoice_balance' =>
                        $invoiceBalance,

                    'particulars' =>
                        (string) (
                            $line->particulars
                            ?? ''
                        ),

                    'cheque_no' =>
                        isset(
                            $ui['cheque_no']
                        )
                            ? trim(
                                (string) (
                                    $ui['cheque_no']
                                )
                            )
                            : '',

                    'posting_date' =>
                        $line->posting_date
                            ? substr(
                                (string) $line->posting_date,
                                0,
                                10
                            )
                            : (
                                $voucher->voucher_date
                                    ? substr(
                                        (string) $voucher->voucher_date,
                                        0,
                                        10
                                    )
                                    : now()->toDateString()
                            ),

                    'currency_code' =>
                        $currency,

                    'currency_quantity' =>
                        $line->currency_quantity !== null
                            ? (string) (
                                $line->currency_quantity
                            )
                            : '',

                    'currency_rate' =>
                        $line->currency_rate !== null
                            ? (string) (
                                $line->currency_rate
                            )
                            : '',

                    'currency_side' =>
                        $currencySide,

                    'debit' =>
                        $line->debit !== null
                            ? (string) (
                                $line->debit
                            )
                            : '',

                    'credit' =>
                        $line->credit !== null
                            ? (string) (
                                $line->credit
                            )
                            : '',

                    'c' =>
                        isset(
                            $ui['c']
                        )
                            ? (bool) $ui['c']
                            : false,

                    'legacy_master_id' =>
                        $line->legacy_master_id !== null
                            ? (int) (
                                $line->legacy_master_id
                            )
                            : null,
                ];
            }
        }

        if (empty($lines)) {
            $lines[] =
                $this->emptyLine(
                    $voucher?->voucher_date
                );

            $lines[] =
                $this->emptyLine(
                    $voucher?->voucher_date
                );
        }

        return [
            'voucher' => [
                'id' =>
                    $voucher
                        ? (int) $voucher->id
                        : null,

                'legacy_voucher_id' =>
                    $voucher?->legacy_voucher_id !== null
                        ? (int) (
                            $voucher->legacy_voucher_id
                        )
                        : null,

                'voucher_no' =>
                    $voucher
                        ? (string) $voucher->voucher_no
                        : $this->nextVoucherNumber(),

                'voucher_type' =>
                    'JV',

                'voucher_date' =>
                    $voucher
                        ? substr(
                            (string) $voucher->voucher_date,
                            0,
                            10
                        )
                        : now()->toDateString(),

                'ref_no' =>
                    (string) (
                        $voucher?->ref_no
                        ?? ''
                    ),

                'branch_id' =>
                    $voucher?->branch_id !== null
                        ? (int) $voucher->branch_id
                        : (
                            $branches[0]['id']
                            ?? null
                        ),

                'department_id' =>
                    $voucher?->department_id !== null
                        ? (int) $voucher->department_id
                        : (
                            $departments[0]['id']
                            ?? null
                        ),

                'combine_voucher' =>
                    $voucher
                        ? (bool) (
                            $voucher->combine_voucher
                        )
                        : false,

                'supervised' =>
                    $voucher
                        ? (bool) (
                            $voucher->supervised
                        )
                        : false,
            ],

            'accounts' =>
                $accounts,

            'branches' =>
                $branches,

            'departments' =>
                $departments,

            'currencies' =>
                $currencies,

            'lines' =>
                $lines,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE VOUCHER
    |--------------------------------------------------------------------------
    */

    private function saveVoucher(
        ?int $voucherId,
        Request $request,
        array $data
    ): int {
        $now =
            now();

        $userId =
            (int) $request
                ->user()
                ->id;

        $voucher =
            $voucherId !== null
                ? DB::table('vouchers')
                    ->where(
                        'id',
                        $voucherId
                    )
                    ->lockForUpdate()
                    ->first()
                : null;

        $voucherNo =
            $voucher
                ? (string) $voucher->voucher_no
                : (
                    $data['voucher_no']
                    ?: $this->nextVoucherNumber()
                );

        /*
         * Normalize FX BEFORE totals.
         */
        foreach (
            $data['lines'] as $index => &$line
        ) {
            $currencyCode =
                strtoupper(
                    trim(
                        (string) (
                            $line['currency_code']
                            ?? ''
                        )
                    )
                );

            $quantity =
                $line['currency_quantity']
                !== null
                &&
                $line['currency_quantity']
                !== ''
                    ? (float) (
                        $line['currency_quantity']
                    )
                    : null;

            $rate =
                $line['currency_rate']
                !== null
                &&
                $line['currency_rate']
                !== ''
                    ? (float) (
                        $line['currency_rate']
                    )
                    : null;

            $debit =
                max(
                    (float) (
                        $line['debit']
                        ?? 0
                    ),
                    0
                );

            $credit =
                max(
                    (float) (
                        $line['credit']
                        ?? 0
                    ),
                    0
                );

            if ($currencyCode !== '') {
                if (
                    $quantity === null
                    ||
                    $rate === null
                    ||
                    $quantity <= 0
                    ||
                    $rate <= 0
                ) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.currency_quantity" =>
                            'Foreign currency lines require a valid Qty and Rate.',
                    ]);
                }

                $calculated =
                    round(
                        $quantity * $rate,
                        4
                    );

                $side =
                    ($line['currency_side'] ?? '')
                    === 'credit'
                        ? 'credit'
                        : 'debit';

                if (
                    $credit > 0
                    &&
                    $debit <= 0
                ) {
                    $side =
                        'credit';
                }

                if (
                    $debit > 0
                    &&
                    $credit <= 0
                ) {
                    $side =
                        'debit';
                }

                if (
                    $side ===
                    'credit'
                ) {
                    $debit =
                        0;

                    $credit =
                        $calculated;
                } else {
                    $debit =
                        $calculated;

                    $credit =
                        0;
                }

                $line['currency_side'] =
                    $side;

                $line['currency_code'] =
                    $currencyCode;

                $line['currency_quantity'] =
                    $quantity;

                $line['currency_rate'] =
                    $rate;

                $line['debit'] =
                    $debit;

                $line['credit'] =
                    $credit;
            } else {
                $line['currency_code'] =
                    '';

                $line['currency_quantity'] =
                    null;

                $line['currency_rate'] =
                    null;

                $line['debit'] =
                    $debit;

                $line['credit'] =
                    $credit;
            }

            if (
                $debit > 0
                &&
                $credit > 0
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.debit" =>
                        'A journal line cannot have both Debit and Credit.',
                ]);
            }
        }

        unset($line);

        $totalDebit =
            0.0;

        $totalCredit =
            0.0;

        foreach (
            $data['lines'] as $line
        ) {
            $totalDebit +=
                max(
                    (float) (
                        $line['debit']
                        ?? 0
                    ),
                    0
                );

            $totalCredit +=
                max(
                    (float) (
                        $line['credit']
                        ?? 0
                    ),
                    0
                );
        }

        if (
            abs(
                $totalDebit
                -
                $totalCredit
            ) >= 0.00005
        ) {
            throw ValidationException::withMessages([
                'lines' =>
                    'Journal Voucher must be balanced. Total Debit must equal Total Credit.',
            ]);
        }

        if (
            $totalDebit <= 0
            &&
            $totalCredit <= 0
        ) {
            throw ValidationException::withMessages([
                'lines' =>
                    'Enter at least one debit and one credit amount.',
            ]);
        }

        /*
         * Validate invoice references again immediately before save.
         */
        foreach (
            $data['lines'] as $index => $line
        ) {
            $invoiceId =
                ! empty(
                    $line['invoice_id']
                    ?? null
                )
                    ? (int) $line['invoice_id']
                    : null;

            if (
                $invoiceId === null
            ) {
                continue;
            }

            $account =
                DB::table('accounts')
                    ->where(
                        'id',
                        $line['account_id']
                    )
                    ->where(
                        'is_active',
                        1
                    )
                    ->select([
                        'id',
                        'code',
                    ])
                    ->first();

            if (! $account) {
                throw ValidationException::withMessages([
                    "lines.{$index}.account_id" =>
                        'Selected account is unavailable.',
                ]);
            }

            if (
                ! $this->invoiceBelongsToAccount(
                    $invoiceId,
                    (int) $account->id,
                    (string) $account->code
                )
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.invoice_id" =>
                        'The selected invoice does not belong to this account.',
                ]);
            }
        }

        $voucherPayload = [
            'voucher_no' =>
                $voucherNo,

            'voucher_date' =>
                $data['voucher_date'],

            'voucher_type' =>
                'JV',

            'cash_bank_account_code' =>
                null,

            'cash_bank_account_id' =>
                null,

            'created_by' =>
                $voucher
                    ? $voucher->created_by
                    : $userId,

            'legacy_entered_by' =>
                $voucher
                    ? $voucher->legacy_entered_by
                    : null,

            'entry_date' =>
                $voucher
                    ? $voucher->entry_date
                    : $now,

            'ref_no' =>
                $data['ref_no']
                ?: null,

            'combine_voucher' =>
                (bool) (
                    $data['combine_voucher']
                    ?? false
                ),

            'supervised' =>
                (bool) (
                    $data['supervised']
                    ?? false
                ),

            'supervised_by' =>
                $voucher
                    ? $voucher->supervised_by
                    : null,

            'branch_id' =>
                $data['branch_id'],

            'department_id' =>
                $data['department_id'],

            'legacy_branch_id' =>
                $voucher?->legacy_branch_id,

            'legacy_department_id' =>
                $voucher?->legacy_department_id,

            'legacy_data' =>
                json_encode(
                    [
                        'native' =>
                            true,

                        'form_type' =>
                            'JV',

                        'updated_by' =>
                            $userId,
                    ],
                    JSON_UNESCAPED_UNICODE
                ),

            'updated_at' =>
                $now,
        ];

        if ($voucherId === null) {
            $voucherPayload[
                'legacy_voucher_id'
            ] = null;

            $voucherPayload[
                'created_at'
            ] = $now;

            $voucherId =
                (int) DB::table(
                    'vouchers'
                )->insertGetId(
                    $voucherPayload
                );
        } else {
            DB::table(
                'vouchers'
            )
                ->where(
                    'id',
                    $voucherId
                )
                ->update(
                    $voucherPayload
                );
        }

        /*
         * Existing journal header.
         */
        $journal =
            DB::table(
                'journal_entries'
            )
                ->where(
                    'voucher_id',
                    $voucherId
                )
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

        /*
         * If this JV contains one invoice only, also keep
         * journal_entries.invoice_id populated.
         *
         * Multiple invoices => header remains NULL,
         * while every detail line still has its own invoice_id.
         */
        $selectedInvoiceIds =
            collect(
                $data['lines']
            )
                ->pluck('invoice_id')
                ->filter(
                    fn ($id) =>
                        $id !== null
                        &&
                        $id !== ''
                )
                ->map(
                    fn ($id) =>
                        (int) $id
                )
                ->unique()
                ->values();

        $journalInvoiceId =
            $selectedInvoiceIds->count() === 1
                ? (int) (
                    $selectedInvoiceIds
                        ->first()
                )
                : null;

        $legacyReferenceId =
            $journal?->legacy_reference_id
            ??
            $voucher?->legacy_voucher_id
            ??
            $voucherId;

        $journalPayload = [
            'legacy_reference_type' =>
                $journal?->legacy_reference_type
                ?? 'voucher',

            'legacy_reference_id' =>
                $legacyReferenceId,

            'legacy_system_id' =>
                $journal?->legacy_system_id,

            'voucher_type' =>
                'JV',

            'voucher_id' =>
                $voucherId,

            'invoice_id' =>
                $journalInvoiceId,

            'created_by' =>
                $journal?->created_by
                ?? $userId,

            'branch_id' =>
                $data['branch_id'],

            'department_id' =>
                $data['department_id'],

            'legacy_branch_id' =>
                $journal?->legacy_branch_id
                ??
                $voucher?->legacy_branch_id,

            'legacy_department_id' =>
                $journal?->legacy_department_id
                ??
                $voucher?->legacy_department_id,

            'entry_date' =>
                $journal?->entry_date
                ??
                $data['voucher_date'],

            'last_posting_date' =>
                collect(
                    $data['lines']
                )
                    ->pluck(
                        'posting_date'
                    )
                    ->filter()
                    ->max()
                ??
                $data['voucher_date'],

            'source_modes' =>
                'JV',

            'source_system_ids' =>
                $journal?->source_system_ids,

            'total_debit' =>
                $totalDebit,

            'total_credit' =>
                $totalCredit,

            'line_count' =>
                count(
                    $data['lines']
                ),

            'is_balanced' =>
                true,

            'legacy_data' =>
                json_encode(
                    [
                        'native' =>
                            true,

                        'form_type' =>
                            'JV',

                        'updated_by' =>
                            $userId,
                    ],
                    JSON_UNESCAPED_UNICODE
                ),

            'updated_at' =>
                $now,
        ];

        if ($journal) {
            DB::table(
                'journal_entries'
            )
                ->where(
                    'id',
                    $journal->id
                )
                ->update(
                    $journalPayload
                );

            $journalEntryId =
                (int) $journal->id;
        } else {
            $journalPayload[
                'created_at'
            ] = $now;

            $journalEntryId =
                (int) DB::table(
                    'journal_entries'
                )->insertGetId(
                    $journalPayload
                );
        }

        /*
         * Replace this JV's detail lines.
         */
        DB::table(
            'journal_entry_lines'
        )
            ->where(
                'journal_entry_id',
                $journalEntryId
            )
            ->delete();

        $accountIds =
            collect(
                $data['lines']
            )
                ->pluck('account_id')
                ->filter()
                ->map(
                    fn ($id) =>
                        (int) $id
                )
                ->unique()
                ->values()
                ->all();

        $accountMap =
            DB::table('accounts')
                ->whereIn(
                    'id',
                    $accountIds
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get()
                ->keyBy('id');

        $invoiceIds =
            collect(
                $data['lines']
            )
                ->pluck('invoice_id')
                ->filter()
                ->map(
                    fn ($id) =>
                        (int) $id
                )
                ->unique()
                ->values()
                ->all();

        $invoiceMap =
            empty($invoiceIds)
                ? collect()
                : DB::table(
                    'invoices'
                )
                    ->whereIn(
                        'id',
                        $invoiceIds
                    )
                    ->select([
                        'id',
                        'legacy_invoice_id',
                    ])
                    ->get()
                    ->keyBy('id');

        $lineRows = [];

        foreach (
            $data['lines'] as $line
        ) {
            $account =
                $accountMap->get(
                    (int) $line['account_id']
                );

            if (! $account) {
                continue;
            }

            $debit =
                max(
                    (float) (
                        $line['debit']
                        ?? 0
                    ),
                    0
                );

            $credit =
                max(
                    (float) (
                        $line['credit']
                        ?? 0
                    ),
                    0
                );

            $currencyCode =
                strtoupper(
                    trim(
                        (string) (
                            $line['currency_code']
                            ?? ''
                        )
                    )
                );

            $quantity =
                $line['currency_quantity']
                !== null
                &&
                $line['currency_quantity']
                !== ''
                    ? (float) (
                        $line['currency_quantity']
                    )
                    : null;

            $rate =
                $line['currency_rate']
                !== null
                &&
                $line['currency_rate']
                !== ''
                    ? (float) (
                        $line['currency_rate']
                    )
                    : null;

            $foreignDebit =
                null;

            $foreignCredit =
                null;

            if (
                $currencyCode !== ''
                &&
                $quantity !== null
                &&
                $quantity > 0
            ) {
                if (
                    $debit > 0
                ) {
                    $foreignDebit =
                        $quantity;
                } elseif (
                    $credit > 0
                ) {
                    $foreignCredit =
                        $quantity;
                }
            }

            $invoiceId =
                ! empty(
                    $line['invoice_id']
                    ?? null
                )
                    ? (int) $line['invoice_id']
                    : null;

            $invoiceLegacyNo =
                $invoiceId !== null
                    ? (
                        $invoiceMap->get(
                            $invoiceId
                        )?->legacy_invoice_id
                    )
                    : null;

            $legacyInvoiceNo =
                $invoiceLegacyNo !== null
                    ? (string) $invoiceLegacyNo
                    : trim(
                        (string) (
                            $line['inv_no']
                            ?? ''
                        )
                    );

            $currencySide =
                (
                    ($line['currency_side'] ?? '')
                    ===
                    'credit'
                )
                    ? 'credit'
                    : 'debit';

            $ui = [
                'c' =>
                    (bool) (
                        $line['c']
                        ?? false
                    ),

                'cheque_no' =>
                    trim(
                        (string) (
                            $line['cheque_no']
                            ?? ''
                        )
                    ),

                'inv_no' =>
                    $legacyInvoiceNo,

                'invoice_id' =>
                    $invoiceId,

                'currency_side' =>
                    $currencySide,
            ];

            $lineRows[] = [
                'journal_entry_id' =>
                    $journalEntryId,

                'legacy_master_id' =>
                    $line['legacy_master_id']
                    ?? null,

                'legacy_reference_id' =>
                    $legacyReferenceId,

                'legacy_system_id' =>
                    $journal?->legacy_system_id,

                'legacy_reference_type' =>
                    'voucher',

                'voucher_type' =>
                    'JV',

                'mode' =>
                    null,

                'account_id' =>
                    $account->id,

                'account_code' =>
                    $account->code,

                'debit' =>
                    $debit,

                'credit' =>
                    $credit,

                'particulars' =>
                    trim(
                        (string) (
                            $line['particulars']
                            ?? ''
                        )
                    )
                    ?: null,

                'voucher_date' =>
                    $data['voucher_date'],

                'posting_date' =>
                    $line['posting_date']
                    ? $line['posting_date']
                    : $data['voucher_date'],

                'voucher_id' =>
                    $voucherId,

                'invoice_id' =>
                    $invoiceId,

                'branch_id' =>
                    $data['branch_id'],

                'department_id' =>
                    $data['department_id'],

                'legacy_branch_id' =>
                    $voucher?->legacy_branch_id,

                'legacy_department_id' =>
                    $voucher?->legacy_department_id,

                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,

                'currency_quantity' =>
                    $quantity,

                'currency_rate' =>
                    $rate,

                'foreign_debit' =>
                    $foreignDebit,

                'foreign_credit' =>
                    $foreignCredit,

                'profit' =>
                    0,

                'legacy_invoice_no' =>
                    $legacyInvoiceNo !== ''
                        ? $legacyInvoiceNo
                        : null,

                'legacy_invoice_no_2' =>
                    null,

                'ticket_no' =>
                    null,

                'con_ticket_no' =>
                    null,

                'passenger' =>
                    null,

                'mode_description' =>
                    null,

                'sector_description' =>
                    null,

                'fare_taxes_service' =>
                    null,

                'entry_by' =>
                    $request
                        ->user()
                        ->name,

                'umrah_query_id' =>
                    null,

                'legacy_data' =>
                    json_encode(
                        [
                            'native' =>
                                true,

                            'role' =>
                                'detail',

                            'ui' =>
                                $ui,
                        ],
                        JSON_UNESCAPED_UNICODE
                    ),

                'created_at' =>
                    $now,

                'updated_at' =>
                    $now,
            ];
        }

        if (empty($lineRows)) {
            throw ValidationException::withMessages([
                'lines' =>
                    'No valid journal lines were entered.',
            ]);
        }

        DB::table(
            'journal_entry_lines'
        )->insert(
            $lineRows
        );

        return $voucherId;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    private function validateRequest(
        Request $request
    ): array {
        $data =
            $request->validate([
                'voucher_no' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'voucher_date' => [
                    'required',
                    'date',
                ],

                'ref_no' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'branch_id' => [
                    'required',
                    'integer',
                    'exists:branches,id',
                ],

                'department_id' => [
                    'required',
                    'integer',
                    'exists:departments,id',
                ],

                'combine_voucher' => [
                    'nullable',
                    'boolean',
                ],

                'supervised' => [
                    'nullable',
                    'boolean',
                ],

                'lines' => [
                    'required',
                    'array',
                    'min:2',
                ],

                'lines.*.account_id' => [
                    'required',
                    'integer',
                    'exists:accounts,id',
                ],

                'lines.*.invoice_id' => [
                    'nullable',
                    'integer',
                    'exists:invoices,id',
                ],

                'lines.*.particulars' => [
                    'nullable',
                    'string',
                    'max:1000',
                ],

                'lines.*.inv_no' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'lines.*.cheque_no' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'lines.*.posting_date' => [
                    'nullable',
                    'date',
                ],

                'lines.*.currency_code' => [
                    'nullable',
                    'string',
                    'max:20',
                ],

                'lines.*.currency_quantity' => [
                    'nullable',
                    'numeric',
                ],

                'lines.*.currency_rate' => [
                    'nullable',
                    'numeric',
                ],

                'lines.*.currency_side' => [
                    'nullable',
                    'in:debit,credit',
                ],

                'lines.*.debit' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'lines.*.credit' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'lines.*.c' => [
                    'nullable',
                    'boolean',
                ],
            ]);

        foreach (
            $data['lines'] as $index => &$line
        ) {
            $line['account_id'] =
                (int) $line['account_id'];

            $line['debit'] =
                (float) (
                    $line['debit']
                    ?? 0
                );

            $line['credit'] =
                (float) (
                    $line['credit']
                    ?? 0
                );

            if (
                isset(
                    $line['invoice_id']
                )
                &&
                $line['invoice_id'] !== null
            ) {
                $line['invoice_id'] =
                    (int) $line['invoice_id'];
            }

            if (
                $line['debit'] > 0
                &&
                $line['credit'] > 0
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.debit" =>
                        'A journal line cannot have both Debit and Credit.',
                ]);
            }
        }

        unset($line);

        return $data;
    }


     
    /*
    |--------------------------------------------------------------------------
    | INVOICE LINKING
    |--------------------------------------------------------------------------
    */

    private function invoiceBelongsToAccount(
        int $invoiceId,
        int $accountId,
        string $accountCode
    ): bool {
        $invoice =
            DB::table(
                'invoices'
            )
                ->select([
                    'id',
                    'legacy_invoice_id',
                    'client_account_id',
                ])
                ->where(
                    'id',
                    $invoiceId
                )
                ->first();

        if (! $invoice) {
            return false;
        }

        if (
            $invoice->client_account_id !== null
            &&
            (int) $invoice->client_account_id
                === $accountId
        ) {
            return true;
        }

        /*
         * If this invoice has already been linked to this
         * account by journal data, accept it.
         */
        if (
            DB::table(
                'journal_entry_lines'
            )
                ->where(
                    'invoice_id',
                    $invoiceId
                )
                ->where(
                    'account_code',
                    $accountCode
                )
                ->exists()
        ) {
            return true;
        }

        /*
         * Vendor/payable relationship.
         */
        if (
            Schema::hasTable(
                'invoice_transactions'
            )
            &&
            DB::table(
                'invoice_transactions'
            )
                ->where(
                    'invoice_id',
                    $invoiceId
                )
                ->where(
                    'payable_account_code',
                    $accountCode
                )
                ->exists()
        ) {
            return true;
        }

        /*
         * Some migrated data uses invoice_items.
         */
        if (
            Schema::hasTable(
                'invoice_items'
            )
            &&
            Schema::hasColumn(
                'invoice_items',
                'vendor_account_code'
            )
            &&
            DB::table(
                'invoice_items'
            )
                ->where(
                    'invoice_id',
                    $invoiceId
                )
                ->where(
                    'vendor_account_code',
                    $accountCode
                )
                ->exists()
        ) {
            return true;
        }

        /*
         * Legacy transaction fallback.
         */
        if (
            $invoice->legacy_invoice_id !== null
            &&
            Schema::hasTable(
                'legacy_transactions'
            )
        ) {
            $legacyInvoiceId =
                (string) (
                    $invoice->legacy_invoice_id
                );

            if (
                DB::table(
                    'legacy_transactions'
                )
                    ->where(
                        function ($query) use (
                            $legacyInvoiceId
                        ) {
                            $query
                                ->where(
                                    'legacy_invoice_no',
                                    $legacyInvoiceId
                                )
                                ->orWhere(
                                    'legacy_invoice_no_2',
                                    $legacyInvoiceId
                                );
                        }
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    )
                    ->exists()
            ) {
                return true;
            }
        }

        return false;
    }

    private function invoiceOptionsForAccount(
        int $accountId,
        ?int $excludeVoucherId = null,
        ?int $includeInvoiceId = null
    ): array {
        $account =
            DB::table(
                'accounts'
            )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->where(
                    'id',
                    $accountId
                )
                ->where(
                    'is_active',
                    1
                )
                ->first();

        if (! $account) {
            return [];
        }

        $accountCode =
            trim(
                (string) $account->code
            );

        /*
         * Find invoices related to the selected account.
         *
         * This deliberately uses several relationships because
         * migrated invoices can have their account relationship
         * stored in different places.
         */
        $query =
            DB::table(
                'invoices as i'
            )
                ->where(
                    'i.is_active',
                    1
                )
                ->where(
                    function ($q) use (
                        $accountId,
                        $accountCode
                    ) {
                        /*
                         * Normal customer invoice relation.
                         */
                        $q->where(
                            'i.client_account_id',
                            $accountId
                        );

                        /*
                         * Existing normalized journal link.
                         */
                        $q->orWhereExists(
                            function ($sub) use (
                                $accountCode
                            ) {
                                $sub
                                    ->from(
                                        'journal_entry_lines as jl'
                                    )
                                    ->whereColumn(
                                        'jl.invoice_id',
                                        'i.id'
                                    )
                                    ->where(
                                        'jl.account_code',
                                        $accountCode
                                    );
                            }
                        );

                        /*
                         * Vendor invoice relation.
                         */
                        if (
                            Schema::hasTable(
                                'invoice_transactions'
                            )
                        ) {
                            $q->orWhereExists(
                                function ($sub) use (
                                    $accountCode
                                ) {
                                    $sub
                                        ->from(
                                            'invoice_transactions as it'
                                        )
                                        ->whereColumn(
                                            'it.invoice_id',
                                            'i.id'
                                        )
                                        ->where(
                                            'it.payable_account_code',
                                            $accountCode
                                        );
                                }
                            );
                        }

                        /*
                         * Invoice-items vendor relation.
                         */
                        if (
                            Schema::hasTable(
                                'invoice_items'
                            )
                            &&
                            Schema::hasColumn(
                                'invoice_items',
                                'vendor_account_code'
                            )
                        ) {
                            $q->orWhereExists(
                                function ($sub) use (
                                    $accountCode
                                ) {
                                    $sub
                                        ->from(
                                            'invoice_items as ii'
                                        )
                                        ->whereColumn(
                                            'ii.invoice_id',
                                            'i.id'
                                        )
                                        ->where(
                                            'ii.vendor_account_code',
                                            $accountCode
                                        );
                                }
                            );
                        }

                        /*
                         * Legacy invoice reference fallback.
                         */
                        if (
                            Schema::hasTable(
                                'legacy_transactions'
                            )
                        ) {
                            $q->orWhereExists(
                                function ($sub) use (
                                    $accountCode
                                ) {
                                    $sub
                                        ->from(
                                            'legacy_transactions as lt'
                                        )
                                        ->whereColumn(
                                            'lt.legacy_invoice_no',
                                            'i.legacy_invoice_id'
                                        )
                                        ->orWhereColumn(
                                            'lt.legacy_invoice_no_2',
                                            'i.legacy_invoice_id'
                                        )
                                        ->where(
                                            'lt.account_code',
                                            $accountCode
                                        );
                                }
                            );
                        }
                    }
                )
                ->select([
                    'i.id',
                    'i.legacy_invoice_id',
                    'i.invoice_date',
                    'i.due_date',
                    'i.client_account_id',
                    'i.status',
                ])
                ->orderByDesc(
                    'i.invoice_date'
                )
                ->orderByDesc(
                    'i.id'
                )
                ->limit(500)
                ->get();

        /*
         * Always keep the currently selected invoice when editing.
         */
        if (
            $includeInvoiceId !== null
            &&
            ! $query->contains(
                'id',
                $includeInvoiceId
            )
        ) {
            $included =
                DB::table(
                    'invoices'
                )
                    ->select([
                        'id',
                        'legacy_invoice_id',
                        'invoice_date',
                        'due_date',
                        'client_account_id',
                        'status',
                    ])
                    ->where(
                        'id',
                        $includeInvoiceId
                    )
                    ->first();

            if ($included) {
                $query->push(
                    $included
                );
            }
        }

        $options = [];

        foreach (
            $query as $invoice
        ) {
            $financials =
                $this->calculateInvoiceFinancialsForAccount(
                    (int) $invoice->id,
                    $accountId,
                    $accountCode
                );

            /*
             * Journal Vouchers may reference any related invoice,
             * including fully paid / zero-balance invoices.
             *
             * JV references do not settle invoices and therefore
             * must not be restricted by the current invoice balance.
             */

            $invoiceNumber =
                $invoice->legacy_invoice_id !== null
                    ? 'INV #' .
                        (int) $invoice->legacy_invoice_id
                    : 'INV #' .
                        (int) $invoice->id;

            $date =
                $invoice->invoice_date
                    ? substr(
                        (string) $invoice->invoice_date,
                        0,
                        10
                    )
                    : '';

            $balance =
                max(
                    (float) $financials['balance'],
                    0
                );

            $applied =
                (float) (
                    $financials['applied_amount']
                );

            $status =
                $balance <= 0.00005
                    ? 'Paid'
                    : (
                        $applied > 0.00005
                            ? 'Partial'
                            : 'Open'
                    );

            $options[] = [
                'id' =>
                    (int) $invoice->id,

                'invoice_number' =>
                    $invoiceNumber,

                'invoice_date' =>
                    $date,

                'due_date' =>
                    $invoice->due_date
                        ? substr(
                            (string) $invoice->due_date,
                            0,
                            10
                        )
                        : '',

                'gross_amount' =>
                    round(
                        (float) (
                            $financials[
                                'gross_amount'
                            ]
                        ),
                        4
                    ),

                'applied_amount' =>
                    round(
                        $applied,
                        4
                    ),

                'balance' =>
                    round(
                        $balance,
                        4
                    ),

                'status' =>
                    $status,

                'label' =>
                    $invoiceNumber,

                'secondary' =>
                    trim(
                        (
                            $date !== ''
                                ? $date . ' • '
                                : ''
                        )
                        .
                        'Balance ' .
                        number_format(
                            $balance,
                            2
                        )
                        .
                        ' • ' .
                        $status
                    ),
            ];
        }

        return $options;
    }

    private function invoiceOptionForSelection(
        int $invoiceId,
        int $accountId,
        ?int $excludeVoucherId = null
    ): ?array {
        foreach (
            $this->invoiceOptionsForAccount(
                $accountId,
                $excludeVoucherId,
                $invoiceId
            ) as $option
        ) {
            if (
                (int) $option['id']
                ===
                $invoiceId
            ) {
                return $option;
            }
        }

        return null;
    }

    private function calculateInvoiceFinancialsForAccount(
        int $invoiceId,
        int $accountId,
        string $accountCode
    ): array {
        $invoice =
            DB::table(
                'invoices'
            )
                ->select([
                    'id',
                    'legacy_invoice_id',
                    'client_account_id',
                ])
                ->where(
                    'id',
                    $invoiceId
                )
                ->first();

        if (! $invoice) {
            return [
                'gross_amount' =>
                    0.0,

                'applied_amount' =>
                    0.0,

                'balance' =>
                    0.0,
            ];
        }

        $isCustomer =
            (
                $invoice->client_account_id
                !== null
                &&
                (int) $invoice->client_account_id
                    === $accountId
            )
            ||
            str_starts_with(
                $accountCode,
                '12'
            );

        $isVendor =
            str_starts_with(
                $accountCode,
                '21'
            );

        /*
         * Original invoice amount from normalized invoice journal.
         */
        $grossAmount = 0.0;

        if ($isCustomer) {
            $original =
                DB::table(
                    'journal_entry_lines'
                )
                    ->where(
                        'invoice_id',
                        $invoiceId
                    )
                    ->where(
                        'voucher_type',
                        'Inv'
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    )
                    ->selectRaw(
                        'COALESCE(SUM(debit - credit), 0) AS amount'
                    )
                    ->value('amount');

            $grossAmount =
                max(
                    (float) $original,
                    0
                );
        } elseif ($isVendor) {
            $original =
                DB::table(
                    'journal_entry_lines'
                )
                    ->where(
                        'invoice_id',
                        $invoiceId
                    )
                    ->where(
                        'voucher_type',
                        'Inv'
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    )
                    ->selectRaw(
                        'COALESCE(SUM(credit - debit), 0) AS amount'
                    )
                    ->value('amount');

            $grossAmount =
                max(
                    (float) $original,
                    0
                );
        }

        /*
         * Fallback to invoice_transactions for migrated/current
         * invoices which do not yet have their original invoice
         * journal line linked.
         */
        if (
            $grossAmount
            <= 0.00005
            &&
            Schema::hasTable(
                'invoice_transactions'
            )
        ) {
            $transactions =
                DB::table(
                    'invoice_transactions'
                )
                    ->where(
                        'invoice_id',
                        $invoiceId
                    );

            if ($isCustomer) {
                $grossAmount =
                    max(
                        0.0,
                        (float) $transactions
                            ->sum(
                                'total_fare'
                            )
                    );
            } elseif ($isVendor) {
                $vendorTransactions =
                    DB::table(
                        'invoice_transactions'
                    )
                        ->where(
                            'invoice_id',
                            $invoiceId
                        )
                        ->where(
                            'payable_account_code',
                            $accountCode
                        );

                $vendorRateTotal =
                    (float) $vendorTransactions
                        ->selectRaw(
                            'COALESCE(SUM(COALESCE(vendor_rate, 0) * COALESCE(quantity, 0)), 0) AS total'
                        )
                        ->value(
                            'total'
                        );

                if (
                    $vendorRateTotal
                    > 0.00005
                ) {
                    $grossAmount =
                        $vendorRateTotal;
                } else {
                    $grossAmount =
                        max(
                            0.0,
                            (float) $vendorTransactions
                                ->sum(
                                    'total_fare'
                                )
                        );
                }
            }
        }

        /*
         * Amount already received/paid through BR/BP.
         *
         * JV references do NOT reduce invoice outstanding.
         * Settlement remains the job of BR/BP.
         */
        $appliedAmount =
            0.0;

        if ($isCustomer) {
            $appliedAmount =
                (float) DB::table(
                    'journal_entry_lines'
                )
                    ->where(
                        'invoice_id',
                        $invoiceId
                    )
                    ->where(
                        'voucher_type',
                        'BR'
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    )
                    ->sum('credit');
        } elseif ($isVendor) {
            $appliedAmount =
                (float) DB::table(
                    'journal_entry_lines'
                )
                    ->where(
                        'invoice_id',
                        $invoiceId
                    )
                    ->where(
                        'voucher_type',
                        'BP'
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    )
                    ->sum('debit');
        }

        /*
         * Historical legacy settlement fallback.
         */
        if (
            $invoice->legacy_invoice_id !== null
            &&
            Schema::hasTable(
                'legacy_transactions'
            )
        ) {
            $legacyInvoiceId =
                (string) (
                    $invoice->legacy_invoice_id
                );

            $legacy =
                DB::table(
                    'legacy_transactions'
                )
                    ->where(
                        function ($q) use (
                            $legacyInvoiceId
                        ) {
                            $q
                                ->where(
                                    'legacy_invoice_no',
                                    $legacyInvoiceId
                                )
                                ->orWhere(
                                    'legacy_invoice_no_2',
                                    $legacyInvoiceId
                                );
                        }
                    )
                    ->where(
                        'account_code',
                        $accountCode
                    );

            if ($isCustomer) {
                $appliedAmount +=
                    max(
                        0.0,
                        (float) $legacy
                            ->sum('credit')
                    );
            } elseif ($isVendor) {
                $appliedAmount +=
                    max(
                        0.0,
                        (float) $legacy
                            ->sum('debit')
                    );
            }
        }

        $balance =
            max(
                $grossAmount
                -
                $appliedAmount,
                0.0
            );

        return [
            'gross_amount' =>
                round(
                    $grossAmount,
                    4
                ),

            'applied_amount' =>
                round(
                    $appliedAmount,
                    4
                ),

            'balance' =>
                round(
                    $balance,
                    4
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | METADATA
    |--------------------------------------------------------------------------
    */

    private function resolveInvoiceNo(
        object $line,
        array $legacyData,
        array $ui
    ): ?string {
        $values = [
            $line->legacy_invoice_no
                ?? null,

            $line->legacy_invoice_no_2
                ?? null,

            $legacyData['inv_no']
                ?? null,

            $legacyData['invoice_no']
                ?? null,

            $legacyData['invoice_number']
                ?? null,

            $ui['inv_no']
                ?? null,
        ];

        foreach ($values as $value) {
            $value =
                trim(
                    (string) (
                        $value
                        ?? ''
                    )
                );

            if ($value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function decodeLineMetadata(
        ?string $json
    ): array {
        if (
            $json === null
            ||
            trim($json) === ''
        ) {
            return [
                [],
                [],
            ];
        }

        $decoded =
            json_decode(
                $json,
                true
            );

        if (
            ! is_array($decoded)
        ) {
            return [
                [],
                [],
            ];
        }

        $ui =
            isset(
                $decoded['ui']
            )
            &&
            is_array(
                $decoded['ui']
            )
                ? $decoded['ui']
                : [];

        return [
            $decoded,
            $ui,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBERS
    |--------------------------------------------------------------------------
    */

    private function nextVoucherNumber(): string
    {
        $max =
            DB::table(
                'vouchers'
            )
                ->where(
                    'voucher_type',
                    'JV'
                )
                ->selectRaw(
                    'MAX(CAST(voucher_no AS UNSIGNED)) AS max_no'
                )
                ->lockForUpdate()
                ->value(
                    'max_no'
                );

        return (string) (
            (
                (int) (
                    $max
                    ?? 0
                )
            )
            + 1
        );
    }

    private function voucherNumber(
        int $voucherId
    ): string {
        return (string) (
            DB::table(
                'vouchers'
            )
                ->where(
                    'id',
                    $voucherId
                )
                ->value(
                    'voucher_no'
                )
                ?? $voucherId
        );
    }

    private function emptyLine(
        ?string $date = null
    ): array {
        return [
            'account_id' =>
                null,

            'account_code' =>
                '',

            'account_name' =>
                '',

            'invoice_id' =>
                null,

            'inv_no' =>
                '',

            'invoice_label' =>
                '',

            'invoice_balance' =>
                '',

            'particulars' =>
                '',

            'cheque_no' =>
                '',

            'posting_date' =>
                $date
                ??
                now()->toDateString(),

            'currency_code' =>
                '',

            'currency_quantity' =>
                '',

            'currency_rate' =>
                '',

            'currency_side' =>
                'debit',

            'debit' =>
                '',

            'credit' =>
                '',

            'c' =>
                false,

            'legacy_master_id' =>
                null,
        ];
    }
}