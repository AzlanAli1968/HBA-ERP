<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'type' => ['nullable', 'string', 'max:30'],
            'branch' => ['nullable', 'integer'],
            'user' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $query = $this->voucherQuery($request);

        $summary = $this->summaryQuery($request)->first();

        $vouchers = $query
            ->paginate(25)
            ->withQueryString();

        $voucherTypes = DB::table('vouchers')
            ->whereNotNull('voucher_type')
            ->where('voucher_type', '<>', '')
            ->select('voucher_type')
            ->distinct()
            ->orderBy('voucher_type')
            ->pluck('voucher_type')
            ->values()
            ->all();

        $branches = DB::table('branches')
            ->select('id', 'name', 'legacy_id')
            ->orderBy('name')
            ->get()
            ->map(fn ($branch) => [
                'id' => (int) $branch->id,
                'name' => $branch->name,
                'legacy_id' => $branch->legacy_id !== null
                    ? (int) $branch->legacy_id
                    : null,
            ])
            ->values()
            ->all();

        $users = DB::table('users')
            ->where(function (Builder $query) {
                $query
                    ->whereNotNull('legacy_username')
                    ->orWhere('id', 1);
            })
            ->select('id', 'name', 'legacy_username')
            ->orderBy('name')
            ->get()
            ->map(fn ($user) => [
                'id' => (int) $user->id,
                'name' => $user->name,
                'legacy_username' => $user->legacy_username,
            ])
            ->values()
            ->all();

        return Inertia::render(
            'Accounting/Vouchers/Index',
            [
                'vouchers' => $vouchers,

                'voucherTypes' => $voucherTypes,

                'branches' => $branches,

                'users' => $users,

                'filters' => [
                    'search' => (string) $request->input(
                        'search',
                        ''
                    ),

                    'type' => (string) $request->input(
                        'type',
                        ''
                    ),

                    'branch' => $request->input('branch')
                        ? (string) $request->input('branch')
                        : '',

                    'user' => $request->input('user')
                        ? (string) $request->input('user')
                        : '',

                    'date_from' => (string) $request->input(
                        'date_from',
                        ''
                    ),

                    'date_to' => (string) $request->input(
                        'date_to',
                        ''
                    ),
                ],

                'summary' => [
                    'total_vouchers' => (int) (
                        $summary->total_vouchers ?? 0
                    ),

                    'total_debit' => (float) (
                        $summary->total_debit ?? 0
                    ),

                    'total_credit' => (float) (
                        $summary->total_credit ?? 0
                    ),

                    'no_entry_vouchers' => (int) (
                        $summary->no_entry_vouchers ?? 0
                    ),

                    'unbalanced_vouchers' => (int) (
                        $summary->unbalanced_vouchers ?? 0
                    ),
                ],
            ]
        );
    }

    public function create(Request $request): Response
    {
        $type = strtoupper(
            (string) $request->input('type', 'BR')
        );

        if (! in_array($type, ['BR', 'BP'], true)) {
            $type = 'BR';
        }

        return Inertia::render(
            'Accounting/Vouchers/Form',
            $this->formData(
                null,
                $type
            )
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateVoucherRequest($request);

        $voucherId = DB::transaction(
            function () use ($request, $data) {
                return $this->saveVoucher(
                    null,
                    $request,
                    $data
                );
            }
        );

        return redirect()
            ->route('accounting.vouchers.index')
            ->with(
                'success',
                sprintf(
                    '%s #%s created successfully.',
                    $data['voucher_type'] === 'BR'
                        ? 'Bank Receipt'
                        : 'Bank Payment',
                    $this->voucherNoForFlash($voucherId)
                )
            );
    }

    /**
 * Create a native BR/BP voucher from an external trusted service
 * such as the WhatsApp bot.
 *
 * This intentionally reuses the exact same validation and save logic
 * used by the normal voucher form.
 */
public function storeFromWhatsApp(
    Request $request
): int {
    $data = $this->validateVoucherRequest(
        $request
    );

    return DB::transaction(
        function () use ($request, $data) {
            return $this->saveVoucher(
                null,
                $request,
                $data
            );
        }
    );
}

    public function invoices(Request $request)
    {
        $data = $request->validate([
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'voucher_type' => ['required', 'in:BR,BP'],
            'exclude_voucher_id' => ['nullable', 'integer', 'exists:vouchers,id'],
            'include_invoice_id' => ['nullable', 'integer', 'exists:invoices,id'],
        ]);

        return response()->json([
            'invoices' => $this->invoiceOptionsForAccount(
                (int) $data['account_id'],
                (string) $data['voucher_type'],
                isset($data['exclude_voucher_id']) ? (int) $data['exclude_voucher_id'] : null,
                isset($data['include_invoice_id']) ? (int) $data['include_invoice_id'] : null,
            ),
        ]);
    }

    public function edit(int $voucher)
    {
        $record = DB::table('vouchers')
            ->where('id', $voucher)
            ->first();

        if (! $record) {
            abort(404);
        }

        $this->assertEditableType(
            (string) $record->voucher_type
        );

        return Inertia::render(
            'Accounting/Vouchers/Form',
            $this->formData(
                $record,
                (string) $record->voucher_type
            )
        );
    }

    public function update(Request $request, int $voucher)
    {
        $record = DB::table('vouchers')
            ->where('id', $voucher)
            ->first();

        if (! $record) {
            abort(404);
        }

        $this->assertEditableType(
            (string) $record->voucher_type
        );

        $data = $this->validateVoucherRequest(
            $request,
            (string) $record->voucher_type,
            (int) $record->id
        );

        DB::transaction(
            function () use ($request, $data, $record) {
                $this->saveVoucher(
                    (int) $record->id,
                    $request,
                    $data
                );
            }
        );

        return redirect()
            ->route('accounting.vouchers.index')
            ->with(
                'success',
                sprintf(
                    '%s #%s updated successfully.',
                    $data['voucher_type'] === 'BR'
                        ? 'Bank Receipt'
                        : 'Bank Payment',
                    $record->voucher_no
                )
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

    $type = strtoupper(
        (string) $record->voucher_type
    );

    if (! in_array($type, ['BR', 'BP'], true)) {
        abort(
            422,
            'Only Bank Receipt (BR) and Bank Payment (BP) vouchers can be deleted here.'
        );
    }

    // Protect migrated/imported historical vouchers.
    if ($record->legacy_voucher_id !== null) {
        abort(
            422,
            'Historical imported vouchers cannot be deleted.'
        );
    }

    $voucherNo = (string) (
        $record->voucher_no
        ?? $record->id
    );

    DB::transaction(
        function () use ($voucher) {
            // Remove journal lines first.
            DB::table('journal_entry_lines')
                ->where('voucher_id', $voucher)
                ->delete();

            // Remove journal headers.
            DB::table('journal_entries')
                ->where('voucher_id', $voucher)
                ->delete();

            // Remove voucher header last.
            DB::table('vouchers')
                ->where('id', $voucher)
                ->delete();
        }
    );

    return redirect()
        ->route('accounting.vouchers.index')
        ->with(
            'success',
            sprintf(
                '%s #%s deleted successfully.',
                $type === 'BR'
                    ? 'Bank Receipt'
                    : 'Bank Payment',
                $voucherNo
            )
        );
}

    /**
     * Shared form payload for native BR/BP vouchers.
     */
    private function formData(
        ?object $voucher,
        string $type
    ): array {
        $cashBankAccounts = DB::table('accounts')
            ->where('is_active', 1)
            ->where('code', 'like', '110%')
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get()
            ->map(fn ($account) => [
                'id' => (int) $account->id,
                'code' => $account->code,
                'name' => $account->name,
            ])
            ->values()
            ->all();

        $accounts = DB::table('accounts')
            ->where('is_active', 1)
            ->where('code', 'not like', '110%')
            ->select('id', 'code', 'name', 'account_type_id')
            ->orderBy('code')
            ->get()
            ->map(fn ($account) => [
                'id' => (int) $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'account_type_id' => (int) $account->account_type_id,
            ])
            ->values()
            ->all();

        $branches = DB::table('branches')
            ->select('id', 'name', 'legacy_id')
            ->orderBy('name')
            ->get()
            ->map(fn ($branch) => [
                'id' => (int) $branch->id,
                'name' => $branch->name,
                'legacy_id' => $branch->legacy_id !== null
                    ? (int) $branch->legacy_id
                    : null,
            ])
            ->values()
            ->all();

        $departments = DB::table('departments')
            ->select('id', 'name', 'legacy_id')
            ->orderBy('name')
            ->get()
            ->map(fn ($department) => [
                'id' => (int) $department->id,
                'name' => $department->name,
                'legacy_id' => $department->legacy_id !== null
                    ? (int) $department->legacy_id
                    : null,
            ])
            ->values()
            ->all();

        $currencies = [];

        if (Schema::hasTable('currencies')) {
            $currencyColumns = Schema::getColumnListing('currencies');

            if (in_array('currency_code', $currencyColumns, true)) {
                $currencyQuery = DB::table('currencies')
                    ->select('currency_code')
                    ->whereNotNull('currency_code')
                    ->where('currency_code', '<>', '');

                if (in_array('currency_name', $currencyColumns, true)) {
                    $currencyQuery->addSelect('currency_name');
                }

                if (in_array('is_active', $currencyColumns, true)) {
                    $currencyQuery->where('is_active', 1);
                }

                $currencies = $currencyQuery
                    ->orderBy('currency_code')
                    ->get()
                    ->map(fn ($currency) => [
                        'code' => (string) $currency->currency_code,
                        'name' => isset($currency->currency_name)
                            ? (string) $currency->currency_name
                            : '',
                    ])
                    ->values()
                    ->all();
            }
        }

        $lines = [];

        if ($voucher) {
            $journalEntry = DB::table('journal_entries')
                ->where('voucher_id', $voucher->id)
                ->orderBy('id')
                ->first();

            if ($journalEntry) {
                $lines = DB::table('journal_entry_lines as l')
                    ->join(
                        'accounts as a',
                        'a.id',
                        '=',
                        'l.account_id'
                    )
                    ->where(
                        'l.journal_entry_id',
                        $journalEntry->id
                    )
                    ->where(
                        'l.account_code',
                        'not like',
                        '110%'
                    )
                    ->orderBy('l.id')
                    ->select([
                        'l.account_id',
                        'l.account_code',
                        'a.name as account_name',
                        'l.particulars',
                        'l.debit',
                        'l.credit',
                        'l.invoice_id',
                        'l.legacy_invoice_no',
                        'l.legacy_data',
                        'l.cheque_no',
                        'l.posting_date',
                        'l.currency_code',
                        'l.currency_quantity',
                        'l.currency_rate',
                        'l.foreign_debit',
                        'l.foreign_credit',
                        'l.legacy_master_id',
                    ])
                    ->get()
                    ->map(
                        function ($line) use ($type, $voucher) {
                            $legacyData = [];

                            if ($line->legacy_master_id === null) {
                                $decoded = json_decode(
                                    (string) ($line->legacy_data ?? ''),
                                    true
                                );

                                if (is_array($decoded)) {
                                    $legacyData = $decoded;
                                }
                            }

                            $invoice = null;

                            if ($line->invoice_id !== null) {
                                $invoice = $this->invoiceOptionForSelection(
                                    (int) $line->invoice_id,
                                    (int) $line->account_id,
                                    $type,
                                    (int) $voucher->id,
                                );
                            }

                            return [
                                'account_id' => (int) $line->account_id,
                                'account_code' => $line->account_code,
                                'account_name' => $line->account_name,
                                'invoice_id' => $line->invoice_id !== null ? (int) $line->invoice_id : null,
                                'inv_no' => $invoice['invoice_number'] ?? ($line->legacy_invoice_no ?? ''),
                                'invoice_label' => $invoice['label'] ?? ($line->legacy_invoice_no ?? ''),
                                'invoice_balance' => isset($invoice['balance']) ? number_format((float) $invoice['balance'], 2, '.', '') : '',
                                'particulars' => $line->particulars ?? '',
                                'cheque_no' => $line->cheque_no ?? '',
                                'posting_date' => $line->posting_date
                                    ? substr(
                                        (string) $line->posting_date,
                                        0,
                                        10
                                    )
                                    : '',
                                'currency_code' => $line->currency_code ?? '',
                                'currency_quantity' => $line->currency_quantity !== null
                                    ? (string) $line->currency_quantity
                                    : '',
                                'currency_rate' => $line->currency_rate !== null
                                    ? (string) $line->currency_rate
                                    : '',
                                'legacy_master_id' => $line->legacy_master_id !== null
                                    ? (int) $line->legacy_master_id
                                    : null,
                                'amount' => number_format(
                                    (float) (
                                        $type === 'BR'
                                            ? $line->credit
                                            : $line->debit
                                    ),
                                    2,
                                    '.',
                                    ''
                                ),
                                'c' => (bool) (
                                    $legacyData['ui']['c'] ?? false
                                ),
                                'pa_ac' => (bool) (
                                    $legacyData['ui']['pa_ac'] ?? false
                                ),
                            ];
                        }
                    )
                    ->values()
                    ->all();
            }
        }

        if (empty($lines)) {
            $lines = [[
                'account_id' => null,
                'account_code' => '',
                'account_name' => '',
                'invoice_id' => null,
                'inv_no' => '',
                'invoice_label' => '',
                'invoice_balance' => '',
                'particulars' => '',
                'currency_code' => '',
                'currency_quantity' => '',
                'currency_rate' => '',
                'legacy_master_id' => null,
                'amount' => '',
                'c' => false,
                'pa_ac' => false,
            ]];
        }

        $defaultBranch = $voucher?->branch_id
            ?? (int) (
                collect($branches)->first()['id']
                ?? 0
            );

        $defaultDepartment = $voucher?->department_id
            ?? (int) (
                collect($departments)->first()['id']
                ?? 0
            );

        $nextNumber = $voucher
            ? (string) $voucher->voucher_no
            : $this->nextVoucherNumber($type);

        return [
            'voucher' => $voucher
                ? [
                    'id' => (int) $voucher->id,
                    'legacy_voucher_id' =>
                        $voucher->legacy_voucher_id !== null
                            ? (int) $voucher->legacy_voucher_id
                            : null,
                    'voucher_no' =>
                        (string) $voucher->voucher_no,
                    'voucher_type' =>
                        (string) $voucher->voucher_type,
                    'voucher_date' =>
                        $voucher->voucher_date
                            ? substr(
                                (string) $voucher->voucher_date,
                                0,
                                10
                            )
                            : now()->toDateString(),
                    'ref_no' =>
                        $voucher->ref_no ?? '',
                    'branch_id' =>
                        (int) $defaultBranch,
                    'department_id' =>
                        (int) $defaultDepartment,
                    'cash_bank_account_id' =>
                        $voucher->cash_bank_account_id !== null
                            ? (int) $voucher->cash_bank_account_id
                            : null,
                    'combine_voucher' =>
                        (bool) ($voucher->combine_voucher ?? false),
                    'supervised' =>
                        (bool) $voucher->supervised,
                ]
                : [
                    'id' => null,
                    'legacy_voucher_id' => null,
                    'voucher_no' => $nextNumber,
                    'voucher_type' => $type,
                    'voucher_date' => now()->toDateString(),
                    'ref_no' => '',
                    'branch_id' => $defaultBranch,
                    'department_id' => $defaultDepartment,
                    'cash_bank_account_id' => null,
                    'supervised' => false,
                ],

            'cashBankAccounts' => $cashBankAccounts,
            'accounts' => $accounts,
            'branches' => $branches,
            'departments' => $departments,
            'currencies' => $currencies,
            'lines' => $lines,
        ];
    }

    private function validateVoucherRequest(
        Request $request,
        ?string $forcedType = null,
        ?int $editingVoucherId = null
    ): array {
        $rules = [
            'voucher_type' => [
                'required',
                'in:BR,BP',
            ],

            'voucher_no' => [
                'nullable',
                'string',
                'max:30',
            ],

            'voucher_date' => [
                'required',
                'date',
            ],

            'ref_no' => [
                'nullable',
                'string',
                'max:255',
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

            'cash_bank_account_id' => [
                'required',
                'integer',
                'exists:accounts,id',
            ],

            'combine_voucher' => [
                'sometimes',
                'boolean',
            ],

            'supervised' => [
                'sometimes',
                'boolean',
            ],

            'lines' => [
                'required',
                'array',
                'min:1',
                'max:100',
            ],

            'lines.*.account_id' => [
                'required',
                'integer',
                'exists:accounts,id',
            ],

            'lines.*.amount' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'lines.*.inv_no' => [
                'nullable',
                'string',
                'max:100',
            ],

            'lines.*.invoice_id' => [
                'nullable',
                'integer',
                'exists:invoices,id',
            ],

            'lines.*.particulars' => [
                'nullable',
                'string',
                'max:500',
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

            'lines.*.c' => [
                'sometimes',
                'boolean',
            ],

            'lines.*.pa_ac' => [
                'sometimes',
                'boolean',
            ],

            'lines.*.currency_code' => [
                'nullable',
                'string',
                'max:20',
            ],

            'lines.*.currency_quantity' => [
                'nullable',
                'numeric',
                'gt:0',
            ],

            'lines.*.currency_rate' => [
                'nullable',
                'numeric',
                'gt:0',
            ],
        ];

        $data = $request->validate(
            $rules
        );

        $type = $forcedType
            ?? $data['voucher_type'];

        if ($forcedType !== null) {
            $data['voucher_type'] = $forcedType;
        }

        $cashBank = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->where('id', $data['cash_bank_account_id'])
            ->where('is_active', 1)
            ->first();

        if (
            ! $cashBank
            || ! str_starts_with(
                (string) $cashBank->code,
                '110'
            )
        ) {
            throw ValidationException::withMessages([
                'cash_bank_account_id' =>
                    'Please select a valid cash or bank account.',
            ]);
        }

        $accountIds = collect(
            $data['lines']
        )
            ->pluck('account_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $detailAccounts = DB::table('accounts')
            ->whereIn('id', $accountIds)
            ->where('is_active', 1)
            ->select('id', 'code', 'name')
            ->get()
            ->keyBy('id');

        foreach ($data['lines'] as $index => $line) {
            $account = $detailAccounts->get(
                (int) $line['account_id']
            );

            if (! $account) {
                throw ValidationException::withMessages([
                    "lines.{$index}.account_id" =>
                        'Selected account is inactive or unavailable.',
                ]);
            }

            if (
                (int) $account->id
                === (int) $cashBank->id
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.account_id" =>
                        'The cash/bank account cannot also be used as a detail account.',
                ]);
            }

            if (
                str_starts_with(
                    (string) $account->code,
                    '110'
                )
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.account_id" =>
                        'Choose a non-cash/bank account for voucher details.',
                ]);
            }
        }

        $invoiceRequests = [];

        foreach ($data['lines'] as $index => $line) {
            $invoiceId = isset($line['invoice_id']) && $line['invoice_id'] !== null && $line['invoice_id'] !== ''
                ? (int) $line['invoice_id']
                : null;

            if ($invoiceId === null) {
                continue;
            }

            $account = $detailAccounts->get((int) $line['account_id']);
            $invoice = DB::table('invoices')
                ->where('id', $invoiceId)
                ->first();

            if (! $invoice) {
                throw ValidationException::withMessages([
                    "lines.{$index}.invoice_id" => 'Selected invoice was not found.',
                ]);
            }

            $accountCodes = $this->accountCodeCandidates($account);

            // BR: normalized invoices are directly owned by the client account.
            $belongsToAccount = false;

            if (
                $type === 'BR'
                && isset($invoice->client_account_id)
                && (int) $invoice->client_account_id === (int) $account->id
            ) {
                $belongsToAccount = true;
            }

            // BP: vendor ownership is represented on the invoice transactions
            // by payable_account_code. Keep the journal/legacy fallbacks for
            // historical records.
            if (! $belongsToAccount && $type === 'BP') {
                $belongsToAccount = DB::table('invoice_transactions')
                    ->where('invoice_id', $invoiceId)
                    ->whereIn('payable_account_code', $accountCodes)
                    ->exists();
            }

            if (! $belongsToAccount) {
                $belongsToAccount = DB::table('journal_entry_lines')
                    ->where('invoice_id', $invoiceId)
                    ->whereIn('account_code', $accountCodes)
                    ->exists();
            }

            if (! $belongsToAccount && $invoice->legacy_invoice_id !== null) {
                $legacyInvoiceId = (string) $invoice->legacy_invoice_id;

                $belongsToAccount = DB::table('legacy_transactions')
                    ->where(function ($q) use ($legacyInvoiceId) {
                        $q->where('legacy_invoice_no', $legacyInvoiceId)
                            ->orWhere('legacy_invoice_no_2', $legacyInvoiceId);
                    })
                    ->whereIn('account_code', $accountCodes)
                    ->exists();
            }

            if (! $belongsToAccount) {
                throw ValidationException::withMessages([
                    "lines.{$index}.invoice_id" => 'The selected invoice does not belong to this account.',
                ]);
            }

            $invoiceRequests[$invoiceId] = ($invoiceRequests[$invoiceId] ?? 0) + (float) $line['amount'];
        }

        foreach ($invoiceRequests as $invoiceId => $requestedAmount) {
            $accountCodes = [];

            foreach ($data['lines'] as $candidateLine) {
                if ((int) ($candidateLine['invoice_id'] ?? 0) === (int) $invoiceId) {
                    $candidateAccount = $detailAccounts->get((int) $candidateLine['account_id']);
                    $accountCodes = $candidateAccount
                        ? $this->accountCodeCandidates($candidateAccount)
                        : [];
                    break;
                }
            }

            if (empty($accountCodes)) {
                continue;
            }

            $financials = $this->calculateInvoiceFinancials(
                (int) $invoiceId,
                $accountCodes,
                $type,
                $editingVoucherId,
            );

            if (
                $financials['gross_amount'] > 0
                && $requestedAmount > $financials['balance'] + 0.00005
            ) {
                throw ValidationException::withMessages([
                    'lines' => sprintf(
                        'Invoice %s has only %s outstanding.',
                        $financials['invoice_number'] ?: '#'.$invoiceId,
                        number_format((float) $financials['balance'], 2),
                    ),
                ]);
            }
        }

        foreach ($data['lines'] as $index => $line) {
            $currencyCode = trim(
                (string) ($line['currency_code'] ?? '')
            );

            $currencyQuantity =
                $line['currency_quantity'] ?? null;

            $currencyRate =
                $line['currency_rate'] ?? null;

            if (
                $currencyCode !== ''
                && (
                    $currencyQuantity === null
                    || $currencyQuantity === ''
                    || $currencyRate === null
                    || $currencyRate === ''
                )
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.currency_code" =>
                        'Currency requires both quantity and rate.',
                ]);
            }

            if (
                $currencyCode === ''
                && (
                    ($currencyQuantity !== null && $currencyQuantity !== '')
                    || ($currencyRate !== null && $currencyRate !== '')
                )
            ) {
                throw ValidationException::withMessages([
                    "lines.{$index}.currency_code" =>
                        'Select a currency when entering quantity or rate.',
                ]);
            }
        }

        $total = collect(
            $data['lines']
        )->sum(
            fn ($line) => (float) $line['amount']
        );

        if ($total <= 0) {
            throw ValidationException::withMessages([
                'lines' =>
                    'At least one voucher detail amount is required.',
            ]);
        }

        $data['total_amount'] = round(
            $total,
            4
        );

        $data['voucher_type'] = $type;

        return $data;
    }

    private function saveVoucher(
        ?int $voucherId,
        Request $request,
        array $data
    ): int {
        $now = now();
        $userId = (int) $request->user()->id;

        $voucher = $voucherId
            ? DB::table('vouchers')
                ->where('id', $voucherId)
                ->lockForUpdate()
                ->first()
            : null;

        $voucherNo = $voucher
            ? (string) $voucher->voucher_no
            : $this->nextVoucherNumber(
                $data['voucher_type']
            );

        $cashBank = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->where('id', $data['cash_bank_account_id'])
            ->first();

        if (! $cashBank) {
            throw ValidationException::withMessages([
                'cash_bank_account_id' =>
                    'Cash/bank account not found.',
            ]);
        }

        $existingLegacyData = [];

        if ($voucher?->legacy_data) {
            $decoded = json_decode(
                (string) $voucher->legacy_data,
                true
            );

            if (is_array($decoded)) {
                $existingLegacyData = $decoded;
            }
        }

        if ($voucher) {
            $existingLegacyData['hba_edit'] = [
                'edited_at' => $now->toIso8601String(),
                'edited_by' => $userId,
            ];
        }

        $voucherPayload = [
            'voucher_no' => $voucher
                ? $voucher->voucher_no
                : $voucherNo,
            'voucher_date' => $data['voucher_date'],
            'voucher_type' => $data['voucher_type'],
            'cash_bank_account_code' => $cashBank->code,
            'cash_bank_account_id' => $cashBank->id,
            'created_by' => $voucher
                ? $voucher->created_by
                : $userId,
            'legacy_entered_by' => $voucher
                ? $voucher->legacy_entered_by
                : null,
            'entry_date' => $voucher
                ? $voucher->entry_date
                : $now,
            'ref_no' => $data['ref_no'] ?: null,
            'combine_voucher' => (bool) (
                $data['combine_voucher']
                ?? $voucher?->combine_voucher
                ?? false
            ),
            'supervised' => (bool) (
                $data['supervised'] ?? false
            ),
            'supervised_by' => $voucher
                ? $voucher->supervised_by
                : null,
            'branch_id' => $data['branch_id'],
            'department_id' => $data['department_id'],
            'legacy_branch_id' =>
                $voucher?->legacy_branch_id,
            'legacy_department_id' =>
                $voucher?->legacy_department_id,
            'legacy_data' => json_encode(
                $existingLegacyData ?: [
                    'native' => true,
                ],
                JSON_UNESCAPED_UNICODE
            ),
            'updated_at' => $now,
        ];

        if (! $voucherId) {
            $voucherPayload['legacy_voucher_id'] = null;
            $voucherPayload['created_at'] = $now;

            $voucherId = (int) DB::table('vouchers')
                ->insertGetId($voucherPayload);
        } else {
            DB::table('vouchers')
                ->where('id', $voucherId)
                ->update($voucherPayload);
        }

        $journal = DB::table('journal_entries')
            ->where('voucher_id', $voucherId)
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        $total = (float) $data['total_amount'];

        /*
         * Build the cash-side buckets from the voucher details.
         *
         * Base-currency details remain in one cash line. Foreign-currency
         * details are grouped by currency so the cash/bank side carries the
         * exact foreign quantity represented by the detail side.
         *
         * This fixes native BR/BP foreign cash balances and also normalizes
         * an imported legacy voucher when it is edited and saved again.
         */
        $cashBaseAmount = 0.0;
        $cashCurrencyBuckets = [];

        foreach ($data['lines'] as $line) {
            $lineAmount = round((float) ($line['amount'] ?? 0), 4);
            $currencyCode = strtoupper(
                trim((string) ($line['currency_code'] ?? ''))
            );

            if (
                $currencyCode !== ''
                && isset($line['currency_quantity'])
                && $line['currency_quantity'] !== null
                && $line['currency_quantity'] !== ''
            ) {
                $quantity = round(
                    (float) $line['currency_quantity'],
                    4
                );

                if ($quantity > 0) {
                    if (! isset($cashCurrencyBuckets[$currencyCode])) {
                        $cashCurrencyBuckets[$currencyCode] = [
                            'quantity' => 0.0,
                            'base_amount' => 0.0,
                        ];
                    }

                    $cashCurrencyBuckets[$currencyCode]['quantity'] += $quantity;
                    $cashCurrencyBuckets[$currencyCode]['base_amount'] += $lineAmount;
                    continue;
                }
            }

            $cashBaseAmount += $lineAmount;
        }

        foreach ($cashCurrencyBuckets as &$bucket) {
            $bucket['quantity'] = round($bucket['quantity'], 4);
            $bucket['base_amount'] = round($bucket['base_amount'], 4);
            $bucket['rate'] = $bucket['quantity'] > 0
                ? round(
                    $bucket['base_amount'] / $bucket['quantity'],
                    8
                )
                : null;
        }
        unset($bucket);

        $cashBaseAmount = round($cashBaseAmount, 4);

        $cashLineCount =
            ($cashBaseAmount > 0.00005 ? 1 : 0)
            + count(
                array_filter(
                    $cashCurrencyBuckets,
                    fn ($bucket) =>
                        (float) ($bucket['quantity'] ?? 0) > 0
                )
            );

        $distinctInvoiceIds = collect($data['lines'])
            ->pluck('invoice_id')
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $journalInvoiceId = $distinctInvoiceIds->count() === 1
            ? (int) $distinctInvoiceIds->first()
            : null;

        // Historical imported vouchers retain their legacy reference ID.
        // Native HBA vouchers use their own voucher ID because they have
        // no legacy voucher ID.
        $journalReferenceId = $voucher?->legacy_voucher_id !== null
            ? (int) $voucher->legacy_voucher_id
            : (int) $voucherId;

        $journalPayload = [
            'legacy_reference_type' => 'voucher',
            'legacy_reference_id' => $journalReferenceId,
            'legacy_system_id' =>
                $journal?->legacy_system_id,
            'voucher_type' => $data['voucher_type'],
            'voucher_id' => $voucherId,
            'invoice_id' => $journalInvoiceId,
            'created_by' =>
                $journal?->created_by ?? $userId,
            'branch_id' => $data['branch_id'],
            'department_id' => $data['department_id'],
            'legacy_branch_id' =>
                $journal?->legacy_branch_id
                ?? $voucher?->legacy_branch_id,
            'legacy_department_id' =>
                $journal?->legacy_department_id
                ?? $voucher?->legacy_department_id,
            'entry_date' => $data['voucher_date'],
            'last_posting_date' => $data['voucher_date'],
            'source_modes' => $data['voucher_type'],
            'source_system_ids' =>
                $journal?->source_system_ids,
            'total_debit' => $total,
            'total_credit' => $total,
            'line_count' => count($data['lines']) + $cashLineCount,
            'is_balanced' => true,
            'legacy_data' => json_encode([
                'native' => true,
                'form_type' => $data['voucher_type'],
                'updated_by' => $userId,
            ]),
            'updated_at' => $now,
        ];

        if ($journal) {
            DB::table('journal_entries')
                ->where('id', $journal->id)
                ->update($journalPayload);

            $journalEntryId = (int) $journal->id;
        } else {
            $journalPayload['created_at'] = $now;

            $journalEntryId = (int) DB::table(
                'journal_entries'
            )->insertGetId($journalPayload);
        }

        DB::table('journal_entry_lines')
            ->where(
                'journal_entry_id',
                $journalEntryId
            )
            ->delete();

        $lineRows = [];

        /*
         * Cash/bank side:
         *
         * BR = Cash/Bank DR
         * BP = Cash/Bank CR
         */
        if ($cashBaseAmount > 0.00005) {
            $lineRows[] = $this->makeCashBankLine(
                $journalEntryId,
                $voucherId,
                $data['voucher_type'],
                $cashBank,
                $journalReferenceId,
                $journal?->legacy_system_id,
                $voucher,
                $data,
                $cashBaseAmount,
                null,
                null,
                null,
                $now,
                $request->user()->name,
            );
        }

        foreach ($cashCurrencyBuckets as $currencyCode => $bucket) {
            $quantity = round(
                (float) ($bucket['quantity'] ?? 0),
                4
            );
            $baseAmount = round(
                (float) ($bucket['base_amount'] ?? 0),
                4
            );
            $rate = $bucket['rate'] ?? null;

            if ($quantity <= 0.00005 || abs($baseAmount) <= 0.00005) {
                continue;
            }

            $lineRows[] = $this->makeCashBankLine(
                $journalEntryId,
                $voucherId,
                $data['voucher_type'],
                $cashBank,
                $journalReferenceId,
                $journal?->legacy_system_id,
                $voucher,
                $data,
                $baseAmount,
                $currencyCode,
                $quantity,
                $rate,
                $now,
                $request->user()->name,
            );
        }

        $selectedInvoiceIds = collect($data['lines'])
            ->pluck('invoice_id')
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $selectedInvoices = empty($selectedInvoiceIds)
            ? collect()
            : DB::table('invoices')
                ->whereIn('id', $selectedInvoiceIds)
                ->get()
                ->keyBy('id');

        foreach ($data['lines'] as $line) {
            $account = DB::table('accounts')
                ->select('id', 'code')
                ->where('id', $line['account_id'])
                ->first();

            $amount = round(
                (float) $line['amount'],
                4
            );

            $currencyCode = trim(
                (string) ($line['currency_code'] ?? '')
            );

            $currencyQuantity = $currencyCode !== ''
                ? round(
                    (float) $line['currency_quantity'],
                    4
                )
                : null;

            $currencyRate = $currencyCode !== ''
                ? round(
                    (float) $line['currency_rate'],
                    8
                )
                : null;

            $foreignDebit = $data['voucher_type'] === 'BP'
                ? $currencyQuantity
                : null;

            $foreignCredit = $data['voucher_type'] === 'BR'
                ? $currencyQuantity
                : null;

            $lineUi = [
                'c' => (bool) ($line['c'] ?? false),
                'pa_ac' => (bool) ($line['pa_ac'] ?? false),
            ];

            $lineRows[] = [
                'journal_entry_id' =>
                    $journalEntryId,
                'legacy_master_id' =>
                    isset($line['legacy_master_id'])
                    && $line['legacy_master_id'] !== null
                        ? (int) $line['legacy_master_id']
                        : null,
                'legacy_reference_id' => $journalReferenceId,
                'legacy_system_id' =>
                    $journal?->legacy_system_id,
                'legacy_reference_type' => 'voucher',
                'voucher_type' =>
                    $data['voucher_type'],
                'mode' => null,
                'account_id' => $account->id,
                'account_code' => $account->code,
                'debit' =>
                    $data['voucher_type'] === 'BP'
                        ? $amount
                        : 0,
                'credit' =>
                    $data['voucher_type'] === 'BR'
                        ? $amount
                        : 0,
                'particulars' =>
                    $line['particulars'] ?: null,
                'voucher_date' =>
                    $data['voucher_date'],
                'posting_date' =>
                    ! empty($line['posting_date'])
                        ? $line['posting_date']
                        : $data['voucher_date'],
                'voucher_id' => $voucherId,
                'invoice_id' => ! empty($line['invoice_id']) ? (int) $line['invoice_id'] : null,
                'branch_id' => $data['branch_id'],
                'department_id' => $data['department_id'],
                'legacy_branch_id' =>
                    $voucher?->legacy_branch_id,
                'legacy_department_id' =>
                    $voucher?->legacy_department_id,
                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,
                'currency_quantity' =>
                    $currencyQuantity,
                'currency_rate' =>
                    $currencyRate,
                'foreign_debit' =>
                    $foreignDebit,
                'foreign_credit' =>
                    $foreignCredit,
                'profit' => 0,
                'legacy_invoice_no' =>
                    ! empty($line['invoice_id'])
                        ? (string) (
                            $selectedInvoices->get((int) $line['invoice_id'])?->legacy_invoice_id
                            ?? ($line['inv_no'] ?? '')
                        )
                        : (($line['inv_no'] ?? '') !== '' ? (string) $line['inv_no'] : null),
                'legacy_invoice_no_2' => null,
                'ticket_no' => null,
                'con_ticket_no' => null,
                'cheque_no' =>
                    ($line['cheque_no'] ?? '') !== ''
                        ? (string) $line['cheque_no']
                        : null,
                'passenger' => null,
                'mode_description' => null,
                'sector_description' => null,
                'fare_taxes_service' => null,
                'entry_by' => $request->user()->name,
                'umrah_query_id' => null,
                'legacy_data' => json_encode([
                    'native' => true,
                    'role' => 'detail',
                    'ui' => $lineUi,
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('journal_entry_lines')
            ->insert($lineRows);

        return $voucherId;
    }


    /**
     * Build the normalized cash/bank journal line for a native BR/BP voucher.
     *
     * The line is stored in journal_entry_lines because that table is the
     * accounting source used by the ledger and cash/bank reports.
     */
    private function makeCashBankLine(
        int $journalEntryId,
        int $voucherId,
        string $voucherType,
        object $cashBank,
        int $journalReferenceId,
        $legacySystemId,
        ?object $voucher,
        array $data,
        float $baseAmount,
        ?string $currencyCode,
        ?float $currencyQuantity,
        ?float $currencyRate,
        $now,
        string $entryBy,
    ): array {
        $isReceipt = $voucherType === 'BR';
        $normalizedCurrency = $currencyCode !== null
            ? strtoupper(trim($currencyCode))
            : null;

        return [
            'journal_entry_id' => $journalEntryId,
            'legacy_master_id' => null,
            'legacy_reference_id' => $journalReferenceId,
            'legacy_system_id' => $legacySystemId,
            'legacy_reference_type' => 'voucher',
            'voucher_type' => $voucherType,
            'mode' => null,
            'account_id' => $cashBank->id,
            'account_code' => $cashBank->code,
            'debit' => $isReceipt ? $baseAmount : 0,
            'credit' => $isReceipt ? 0 : $baseAmount,
            'particulars' => $data['ref_no'] ?: null,
            'voucher_date' => $data['voucher_date'],
            'posting_date' => $data['voucher_date'],
            'voucher_id' => $voucherId,
            'invoice_id' => null,
            'branch_id' => $data['branch_id'],
            'department_id' => $data['department_id'],
            'legacy_branch_id' => $voucher?->legacy_branch_id,
            'legacy_department_id' => $voucher?->legacy_department_id,
            'currency_code' => $normalizedCurrency,
            'currency_quantity' => $currencyQuantity,
            'currency_rate' => $currencyRate,
            'foreign_debit' => $isReceipt
                ? $currencyQuantity
                : null,
            'foreign_credit' => $isReceipt
                ? null
                : $currencyQuantity,
            'profit' => 0,
            'legacy_invoice_no' => null,
            'legacy_invoice_no_2' => null,
            'ticket_no' => null,
            'con_ticket_no' => null,
            'cheque_no' => null,
            'passenger' => null,
            'mode_description' => null,
            'sector_description' => null,
            'fare_taxes_service' => null,
            'entry_by' => $entryBy,
            'umrah_query_id' => null,
            'legacy_data' => json_encode([
                'native' => true,
                'role' => 'cash_bank',
                'currency_code' => $normalizedCurrency,
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function accountCodeCandidates(object $account): array
    {
        return collect([
            $account->code ?? null,
        ])
            ->filter(fn ($code) => $code !== null && trim((string) $code) !== '')
            ->map(fn ($code) => trim((string) $code))
            ->unique()
            ->values()
            ->all();
    }

    private function invoiceOptionsForAccount(
        int $accountId,
        string $type,
        ?int $excludeVoucherId = null,
        ?int $includeInvoiceId = null
    ): array {
        $account = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->where('id', $accountId)
            ->first();

        if (! $account) {
            return [];
        }

        $accountCodes = $this->accountCodeCandidates($account);

        if (empty($accountCodes)) {
            return [];
        }

        $query = DB::table('invoices as i')
            ->where('i.is_active', 1);

        if ($type === 'BR') {
            // Receipts: invoices belong directly to the selected client.
            $query->where('i.client_account_id', $accountId);
        } else {
            // Payments: invoice transactions identify the payable/vendor
            // account. Journal and legacy references remain valid fallbacks
            // for historical data.
            $query->where(function ($q) use ($accountCodes) {
                $q->whereExists(function ($sub) use ($accountCodes) {
                    $sub->from('invoice_transactions as it')
                        ->whereColumn('it.invoice_id', 'i.id')
                        ->whereIn('it.payable_account_code', $accountCodes);
                })
                ->orWhereExists(function ($sub) use ($accountCodes) {
                    $sub->from('journal_entry_lines as jl')
                        ->whereColumn('jl.invoice_id', 'i.id')
                        ->whereIn('jl.account_code', $accountCodes);
                })
                ->orWhereExists(function ($sub) use ($accountCodes) {
                    $sub->from('legacy_transactions as lt')
                        ->where(function ($ref) {
                            $ref->whereColumn(
                                'lt.legacy_invoice_no',
                                'i.legacy_invoice_id'
                            )->orWhereColumn(
                                'lt.legacy_invoice_no_2',
                                'i.legacy_invoice_id'
                            );
                        })
                        ->whereIn('lt.account_code', $accountCodes);
                });
            });
        }

        $rows = $query
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.invoice_date',
                'i.due_date',
                'i.client_account_id',
                'i.status',
            ])
            ->orderByDesc('i.invoice_date')
            ->orderByDesc('i.id')
            ->limit(500)
            ->get();

        // When editing, ensure the currently linked invoice remains selectable
        // even if its balance is now zero.
        if (
            $includeInvoiceId !== null
            && ! $rows->contains('id', $includeInvoiceId)
        ) {
            $included = DB::table('invoices')
                ->select([
                    'id',
                    'legacy_invoice_id',
                    'invoice_date',
                    'due_date',
                    'client_account_id',
                    'status',
                ])
                ->where('id', $includeInvoiceId)
                ->first();

            if ($included) {
                $rows->push($included);
            }
        }

        $options = [];

        foreach ($rows as $invoice) {
            $financials = $this->calculateInvoiceFinancials(
                (int) $invoice->id,
                $accountCodes,
                $type,
                $excludeVoucherId,
            );

            $invoiceNumber = $invoice->legacy_invoice_id !== null
                ? 'INV #'.(int) $invoice->legacy_invoice_id
                : 'INV #'.(int) $invoice->id;

            $date = $invoice->invoice_date
                ? substr((string) $invoice->invoice_date, 0, 10)
                : '';

            $balance = max(
                (float) $financials['balance'],
                0.0
            );

            $status = $balance <= 0.00005
                ? 'Paid'
                : (
                    (float) $financials['applied_amount'] > 0.00005
                        ? 'Partial'
                        : 'Open'
                );

            $options[] = [
                'id' => (int) $invoice->id,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $date,
                'due_date' => $invoice->due_date
                    ? substr((string) $invoice->due_date, 0, 10)
                    : '',
                'gross_amount' => round(
                    (float) $financials['gross_amount'],
                    4
                ),
                'applied_amount' => round(
                    (float) $financials['applied_amount'],
                    4
                ),
                'balance' => round($balance, 4),
                'status' => $status,
                'label' => $invoiceNumber,
                'secondary' => trim(
                    ($date !== '' ? $date.' • ' : '')
                    .'Balance '.number_format($balance, 2)
                    .' • '.$status
                ),
            ];
        }

        return $options;
    }

    private function invoiceOptionForSelection(
        int $invoiceId,
        int $accountId,
        string $type,
        ?int $excludeVoucherId = null
    ): ?array {
        foreach ($this->invoiceOptionsForAccount($accountId, $type, $excludeVoucherId, $invoiceId) as $option) {
            if ((int) $option['id'] === $invoiceId) {
                return $option;
            }
        }

        return null;
    }

    private function calculateInvoiceFinancials(
        int $invoiceId,
        array $accountCodes,
        string $type,
        ?int $excludeVoucherId = null
    ): array {
        $invoice = DB::table('invoices')
            ->select([
                'id',
                'legacy_invoice_id',
            ])
            ->where('id', $invoiceId)
            ->first();

        if (! $invoice) {
            return [
                'invoice_number' => null,
                'gross_amount' => 0.0,
                'applied_amount' => 0.0,
                'balance' => 0.0,
            ];
        }

        $accountCodes = collect($accountCodes)
            ->filter(
                fn ($code) =>
                    $code !== null
                    && trim((string) $code) !== ''
            )
            ->map(
                fn ($code) =>
                    trim((string) $code)
            )
            ->unique()
            ->values()
            ->all();

        if (empty($accountCodes)) {
            return [
                'invoice_number' => $invoice->legacy_invoice_id !== null
                    ? 'INV #'.(int) $invoice->legacy_invoice_id
                    : 'INV #'.(int) $invoiceId,
                'gross_amount' => 0.0,
                'applied_amount' => 0.0,
                'balance' => 0.0,
            ];
        }

        // Original invoice receivable/payable amount.
        $originalExpression = $type === 'BR'
            ? 'SUM(l.debit - l.credit)'
            : 'SUM(l.credit - l.debit)';

        $original = DB::table('journal_entry_lines as l')
            ->where('l.invoice_id', $invoiceId)
            ->where('l.voucher_type', 'Inv')
            ->whereIn('l.account_code', $accountCodes)
            ->selectRaw(
                "COALESCE({$originalExpression}, 0) AS amount"
            )
            ->value('amount');

        $grossAmount = max(
            (float) $original,
            0.0
        );

        // Fallback for invoices whose original journal line is not linked
        // yet. Use the normalized invoice transaction amounts.
        if ($grossAmount <= 0.00005) {
            $transactionQuery = DB::table('invoice_transactions')
                ->where('invoice_id', $invoiceId);

            if ($type === 'BR') {
                $grossAmount = (float) $transactionQuery
                    ->sum('total_fare');
            } else {
                $vendorTransactions = DB::table('invoice_transactions')
                    ->where('invoice_id', $invoiceId)
                    ->whereIn('payable_account_code', $accountCodes);

                $vendorTotalFare = (float) $vendorTransactions
                    ->sum('total_fare');

                $vendorRateTotal = (float) $vendorTransactions
                    ->selectRaw(
                        'COALESCE(SUM(COALESCE(vendor_rate, 0) * COALESCE(quantity, 0)), 0) AS total'
                    )
                    ->value('total');

                $grossAmount = $vendorRateTotal > 0.00005
                    ? $vendorRateTotal
                    : $vendorTotalFare;
            }
        }

        // Amounts already applied by native BR/BP vouchers.
        $applied = DB::table('journal_entry_lines as l')
            ->where('l.invoice_id', $invoiceId)
            ->whereIn('l.account_code', $accountCodes)
            ->where('l.voucher_type', $type)
            ->when(
                $excludeVoucherId !== null,
                fn ($q) =>
                    $q->where(function ($sub) use ($excludeVoucherId) {
                        $sub->whereNull('l.voucher_id')
                            ->orWhere(
                                'l.voucher_id',
                                '<>',
                                $excludeVoucherId
                            );
                    })
            );

        $appliedAmount = $type === 'BR'
            ? (float) $applied->sum('credit')
            : (float) $applied->sum('debit');

        // Historical imported transactions also reference invoices through
        // legacy_invoice_no / legacy_invoice_no_2.
        if ($invoice->legacy_invoice_id !== null) {
            $legacyApplied = DB::table('legacy_transactions as lt')
                ->where(function ($ref) use ($invoice) {
                    $ref->where(
                        'lt.legacy_invoice_no',
                        (string) $invoice->legacy_invoice_id
                    )->orWhere(
                        'lt.legacy_invoice_no_2',
                        (string) $invoice->legacy_invoice_id
                    );
                })
                ->whereIn(
                    'lt.account_code',
                    $accountCodes
                );

            $legacyAppliedAmount = $type === 'BR'
                ? (float) $legacyApplied->sum('credit')
                : (float) $legacyApplied->sum('debit');

            $appliedAmount += max(
                $legacyAppliedAmount,
                0.0
            );
        }

        $balance = max(
            $grossAmount - $appliedAmount,
            0.0
        );

        return [
            'invoice_number' => $invoice->legacy_invoice_id !== null
                ? 'INV #'.(int) $invoice->legacy_invoice_id
                : 'INV #'.(int) $invoiceId,
            'gross_amount' => round(
                max($grossAmount, 0.0),
                4
            ),
            'applied_amount' => round(
                max($appliedAmount, 0.0),
                4
            ),
            'balance' => round(
                $balance,
                4
            ),
        ];
    }

    private function nextVoucherNumber(
        string $type
    ): string {
        $max = DB::table('vouchers')
            ->where('voucher_type', $type)
            ->selectRaw(
                'MAX(CAST(voucher_no AS UNSIGNED)) AS max_no'
            )
            ->lockForUpdate()
            ->value('max_no');

        return (string) (
            ((int) ($max ?? 0)) + 1
        );
    }

    private function voucherNoForFlash(
        int $voucherId
    ): string {
        return (string) (
            DB::table('vouchers')
                ->where('id', $voucherId)
                ->value('voucher_no')
                ?? $voucherId
        );
    }

    private function assertEditableType(
        string $type
    ): void {
        if (! in_array($type, ['BR', 'BP'], true)) {
            abort(
                422,
                'Only Bank Receipt and Bank Payment vouchers are editable from this screen.'
            );
        }
    }

    private function voucherQuery(
        Request $request
    ): Builder {
        $journalSummary = $this->journalSummarySubquery();

        $partySummary = $this->partySummarySubquery();

        $query = DB::table('vouchers as v')
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
            ->leftJoin(
                'accounts as ca',
                'ca.id',
                '=',
                'v.cash_bank_account_id'
            )
            ->leftJoinSub(
                $journalSummary,
                'js',
                function ($join) {
                    $join->on(
                        'js.voucher_id',
                        '=',
                        'v.id'
                    );
                }
            )
            ->leftJoinSub(
                $partySummary,
                'ps',
                function ($join) {
                    $join->on(
                        'ps.voucher_id',
                        '=',
                        'v.id'
                    );
                }
            )
            ->select([
                'v.id',
                'v.legacy_voucher_id',
                'v.voucher_no',
                'v.voucher_date',
                'v.voucher_type',
                'v.cash_bank_account_code',
                'v.cash_bank_account_id',
                'v.created_by',
                'v.legacy_entered_by',
                'v.entry_date',
                'v.ref_no',
                'v.supervised',
                'v.supervised_by',
                'v.branch_id',
                'v.department_id',
                'v.legacy_branch_id',
                'v.legacy_department_id',

                'u.name as entered_by_name',
                'u.legacy_username as entered_by_username',

                'b.name as branch_name',
                'd.name as department_name',

                'ca.name as cash_bank_account_name',

                DB::raw(
                    'ps.party_display AS party_display'
                ),

                DB::raw(
                    'COALESCE(js.total_debit, 0) AS total_debit'
                ),

                DB::raw(
                    'COALESCE(js.total_credit, 0) AS total_credit'
                ),

                DB::raw(
                    'COALESCE(js.line_count, 0) AS line_count'
                ),

                DB::raw(
                    'COALESCE(js.entry_count, 0) AS entry_count'
                ),
            ]);

        $this->applyFilters(
            $query,
            $request
        );

        return $query
            ->orderByDesc('v.voucher_date')
            ->orderByDesc('v.legacy_voucher_id');
    }

    private function summaryQuery(
        Request $request
    ): Builder {
        $journalSummary = $this->journalSummarySubquery();

        $query = DB::table('vouchers as v')
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
            ->leftJoinSub(
                $journalSummary,
                'js',
                function ($join) {
                    $join->on(
                        'js.voucher_id',
                        '=',
                        'v.id'
                    );
                }
            );

        $this->applyFilters(
            $query,
            $request
        );

        return $query
            ->selectRaw(
                'COUNT(*) AS total_vouchers'
            )
            ->selectRaw(
                'COALESCE(SUM(COALESCE(js.total_debit, 0)), 0) AS total_debit'
            )
            ->selectRaw(
                'COALESCE(SUM(COALESCE(js.total_credit, 0)), 0) AS total_credit'
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN COALESCE(js.entry_count, 0) = 0 THEN 1 ELSE 0 END), 0) AS no_entry_vouchers'
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN COALESCE(js.entry_count, 0) > 0 AND ABS(COALESCE(js.total_debit, 0) - COALESCE(js.total_credit, 0)) > 0.00005 THEN 1 ELSE 0 END), 0) AS unbalanced_vouchers'
            );
    }

    public function todayPayments(Request $request): Response
{
    $request->merge([
        'type' => 'BP',
        'date_from' => now()->toDateString(),
        'date_to' => now()->toDateString(),
    ]);

    return $this->paymentListResponse(
        $request,
        true
    );
}

public function allPayments(Request $request): Response
{
    $request->merge([
        'type' => 'BP',
    ]);

    return $this->paymentListResponse(
        $request,
        false
    );
}

private function paymentListResponse(
    Request $request,
    bool $todayOnly
): Response {
    $request->validate([
        'search' => [
            'nullable',
            'string',
            'max:150',
        ],

        'branch' => [
            'nullable',
            'integer',
        ],

        'user' => [
            'nullable',
            'integer',
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

    /*
     * Payment pages are ALWAYS BP.
     * Do not allow the URL to change them to BR/JV/etc.
     */
    $request->merge([
        'type' => 'BP',
    ]);

    $query = $this->voucherQuery($request);

    $summary = $this->summaryQuery($request)
        ->first();

    $vouchers = $query
        ->paginate(25)
        ->withQueryString();

    $branches = DB::table('branches')
        ->select(
            'id',
            'name',
            'legacy_id'
        )
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
                        ? (int) $branch->legacy_id
                        : null,
            ]
        )
        ->values()
        ->all();

    $users = DB::table('users')
        ->where(
            function (Builder $query) {
                $query
                    ->whereNotNull('legacy_username')
                    ->orWhere('id', 1);
            }
        )
        ->select(
            'id',
            'name',
            'legacy_username'
        )
        ->orderBy('name')
        ->get()
        ->map(
            fn ($user) => [
                'id' =>
                    (int) $user->id,

                'name' =>
                    (string) $user->name,

                'legacy_username' =>
                    $user->legacy_username !== null
                        ? (string) $user->legacy_username
                        : null,
            ]
        )
        ->values()
        ->all();

    return Inertia::render(
        'Accounting/Payments/List',
        [
            'mode' =>
                $todayOnly
                    ? 'today'
                    : 'all',

            'title' =>
                $todayOnly
                    ? "Today's Payments List"
                    : 'All Payments List',

            'subtitle' =>
                $todayOnly
                    ? 'Bank payments entered today.'
                    : 'All bank payment vouchers.',

            'vouchers' => $vouchers,

            'branches' => $branches,

            'users' => $users,

            'filters' => [
                'search' =>
                    (string) $request->input(
                        'search',
                        ''
                    ),

                'branch' =>
                    $request->input('branch')
                        ? (string) $request->input('branch')
                        : '',

                'user' =>
                    $request->input('user')
                        ? (string) $request->input('user')
                        : '',

                'date_from' =>
                    (string) $request->input(
                        'date_from',
                        ''
                    ),

                'date_to' =>
                    (string) $request->input(
                        'date_to',
                        ''
                    ),
            ],

            'summary' => [
                'total_vouchers' =>
                    (int) (
                        $summary->total_vouchers
                        ?? 0
                    ),

                'total_debit' =>
                    (float) (
                        $summary->total_debit
                        ?? 0
                    ),

                'total_credit' =>
                    (float) (
                        $summary->total_credit
                        ?? 0
                    ),

                'no_entry_vouchers' =>
                    (int) (
                        $summary->no_entry_vouchers
                        ?? 0
                    ),

                'unbalanced_vouchers' =>
                    (int) (
                        $summary->unbalanced_vouchers
                        ?? 0
                    ),
            ],
        ]
    );
}

    private function journalSummarySubquery(): Builder
    {
        return DB::table('journal_entries')
            ->select('voucher_id')
            ->selectRaw(
                'COALESCE(SUM(total_debit), 0) AS total_debit'
            )
            ->selectRaw(
                'COALESCE(SUM(total_credit), 0) AS total_credit'
            )
            ->selectRaw(
                'COALESCE(SUM(line_count), 0) AS line_count'
            )
            ->selectRaw(
                'COUNT(*) AS entry_count'
            )
            ->whereNotNull('voucher_id')
            ->groupBy('voucher_id');
    }

    /**
     * Find the most useful party/counterparty account for a voucher.
     *
     * Priority:
     * 1. Receivables / Customers (120...)
     * 2. Payables / Vendors (210...)
     * 3. Airlines (211...)
     * 4. Staff / other non-cash accounts
     *
     * Cash/bank accounts (110...) are deliberately excluded.
     */
    private function partySummarySubquery(): Builder
    {
        $ranked = DB::table(
            'journal_entry_lines as jl'
        )
            ->join(
                'accounts as a',
                'a.id',
                '=',
                'jl.account_id'
            )
            ->select([
                'jl.voucher_id',
                'jl.account_code',
                'a.name as account_name',
            ])
            ->whereNotNull('jl.voucher_id')
            ->where(function (Builder $query) {
                $query
                    ->where(
                        'jl.account_code',
                        'not like',
                        '110%'
                    )
                    ->where(
                        'jl.debit',
                        '>',
                        0
                    )
                    ->orWhere(function (Builder $q) {
                        $q
                            ->where(
                                'jl.account_code',
                                'not like',
                                '110%'
                            )
                            ->where(
                                'jl.credit',
                                '>',
                                0
                            );
                    });
            });

        return DB::query()
            ->fromSub(
                $ranked,
                'party'
            )
            ->select('party.voucher_id')
            ->selectRaw(
                "SUBSTRING_INDEX(
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            party.account_code,
                            ' — ',
                            party.account_name
                        )
                        ORDER BY
                            CASE
                                WHEN party.account_code LIKE '120%' THEN 1
                                WHEN party.account_code LIKE '210%' THEN 2
                                WHEN party.account_code LIKE '211%' THEN 3
                                ELSE 4
                            END,
                            party.account_code
                        SEPARATOR ' || '
                    ),
                    ' || ',
                    1
                ) AS party_display"
            )
            ->groupBy('party.voucher_id');
    }

    private function applyFilters(
        Builder $query,
        Request $request
    ): void {
        $search = trim(
            (string) $request->input(
                'search',
                ''
            )
        );

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->where(function (Builder $q) use ($like) {
                $q
                    ->where(
                        'v.voucher_no',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'v.ref_no',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'v.cash_bank_account_code',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'v.legacy_entered_by',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'u.name',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'b.name',
                        'like',
                        $like
                    );
            });
        }

        $type = trim(
            (string) $request->input(
                'type',
                ''
            )
        );

        if ($type !== '') {
            $query->where(
                'v.voucher_type',
                $type
            );
        }

        $branch = $request->input(
            'branch'
        );

        if (
            $branch !== null
            && $branch !== ''
        ) {
            $query->where(
                'v.branch_id',
                (int) $branch
            );
        }

        $user = $request->input(
            'user'
        );

        if (
            $user !== null
            && $user !== ''
        ) {
            $query->where(
                'v.created_by',
                (int) $user
            );
        }

        $dateFrom = $request->input(
            'date_from'
        );

        if ($dateFrom) {
            $query->whereDate(
                'v.voucher_date',
                '>=',
                $dateFrom
            );
        }

        $dateTo = $request->input(
            'date_to'
        );

        if ($dateTo) {
            $query->whereDate(
                'v.voucher_date',
                '<=',
                $dateTo
            );
        }
    }
}