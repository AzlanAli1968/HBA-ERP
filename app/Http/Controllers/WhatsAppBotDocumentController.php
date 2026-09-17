<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class WhatsAppBotDocumentController extends Controller
{
    public function invoicePdf(
        Request $request,
        string $reference,
        CompanySettingsService $companySettings,
    ): Response {
        $this->authorizeBot($request);

        $invoiceId = $this->resolveInvoiceId(
            $reference,
        );

        abort_unless(
            $invoiceId !== null,
            404,
            'Invoice not found.',
        );

        /** @var InvoiceController $invoiceController */
        $invoiceController = app(
            InvoiceController::class,
        );

        return $invoiceController->invoicePdf(
            $invoiceId,
            $companySettings,
        );
    }

    public function voucherPdf(
        Request $request,
        string $reference,
        CompanySettingsService $companySettings,
    ): Response {
        $this->authorizeBot($request);

        $invoiceId = $this->resolveInvoiceId(
            $reference,
        );

        abort_unless(
            $invoiceId !== null,
            404,
            'Invoice not found.',
        );

        /** @var InvoiceController $invoiceController */
        $invoiceController = app(
            InvoiceController::class,
        );

        return $invoiceController->voucherPdf(
            $invoiceId,
            $companySettings,
        );
    }

    public function createVoucher(
    Request $request
): JsonResponse {

    $this->authorizeBot(
        $request
    );

    $data = $request->validate([
        'voucher_type' => [
            'required',
            'in:BR,BP',
        ],

        'cash_bank_suffix' => [
            'required',
            'regex:/^\d{3}$/',
        ],

        'party_type' => [
    'required',
    'string',
    'size:2',
    'regex:/^[A-Za-z]{2}$/',
],

        'party_suffix' => [
            'required',
            'regex:/^\d{3}$/',
        ],

        'invoice_reference' => [
            'nullable',
            'string',
            'max:100',
        ],

        'currency_code' => [
            'nullable',
            'string',
            'max:20',
        ],

        'amount' => [
    'nullable',
    'numeric',
    'gt:0',
],

        'currency_quantity' => [
            'nullable',
            'numeric',
            'gt:0',
        ],

        'currency_rate' => [
            'nullable',
            'numeric',
            'gt:0',
        ],
    ]);

    $voucherType =
        strtoupper(
            trim(
                (string) $data['voucher_type']
            )
        );

    $currencyCode =
        strtoupper(
            trim(
                (string) (
                    $data['currency_code'] ?? ''
                )
            )
        );

    /*
     * ------------------------------------------------------
     * Resolve Cash / Bank
     * ------------------------------------------------------
     *
     * Cash/bank accounts are 110...
     *
     * Only the final 3 digits are required by WhatsApp.
     */

    $cashBankAccounts =
        DB::table('accounts')
            ->where('is_active', 1)
            ->where(
                'code',
                'like',
                '110%'
            )
            ->whereRaw(
                'RIGHT(CAST(code AS CHAR), 3) = ?',
                [
                    $data['cash_bank_suffix'],
                ]
            )
            ->select(
                'id',
                'code',
                'name'
            )
            ->get();

    if (
        $cashBankAccounts->count() === 0
    ) {
        abort(
            404,
            'Cash/bank account ending in ' .
            $data['cash_bank_suffix'] .
            ' was not found.'
        );
    }

    if (
        $cashBankAccounts->count() > 1
    ) {
        abort(
            409,
            'Multiple cash/bank accounts end in ' .
            $data['cash_bank_suffix'] .
            '.'
        );
    }

    $cashBank =
        $cashBankAccounts->first();

    /*
     * ------------------------------------------------------
     * Resolve Client / Vendor
     * ------------------------------------------------------
     *
     * CL = 120...
     * VE = 210...
     *
     * This allows the same final 3 digits to exist for both.
     */

    $accountAlias =
    strtoupper(
        trim(
            (string) $data['party_type']
        )
    );

$accountTypes =
    $this->whatsappAccountTypeMap();

if (
    ! isset(
        $accountTypes[$accountAlias]
    )
) {
    abort(
        422,
        "Unknown account type code: {$accountAlias}."
    );
}

/*
 * CB is the cash/bank group and is already represented
 * by the separate third line of the WhatsApp command.
 * It cannot be the voucher detail account.
 */
if (
    $accountAlias === 'CB'
) {
    abort(
        422,
        'CB is reserved for the cash/bank account. Choose another account type for the voucher detail.'
    );
}

$partyPrefix =
    $accountTypes[
        $accountAlias
    ]['prefix'];

    $partyAccounts =
        DB::table('accounts')
            ->where('is_active', 1)
            ->where(
                'code',
                'like',
                $partyPrefix . '%'
            )
            ->whereRaw(
                'RIGHT(CAST(code AS CHAR), 3) = ?',
                [
                    $data['party_suffix'],
                ]
            )
            ->select(
                'id',
                'code',
                'name'
            )
            ->get();

    if (
        $partyAccounts->count() === 0
    ) {
        abort(
            404,
            sprintf(
                '%s account ending in %s was not found.',
                $data['party_type'] === 'CL'
                    ? 'Client'
                    : 'Vendor',
                $data['party_suffix']
            )
        );
    }

    if (
        $partyAccounts->count() > 1
    ) {
        abort(
            409,
            sprintf(
                'Multiple %s accounts end in %s.',
                $data['party_type'] === 'CL'
                    ? 'client'
                    : 'vendor',
                $data['party_suffix']
            )
        );
    }

    $party =
        $partyAccounts->first();

    /*
     * ------------------------------------------------------
     * Optional Invoice
     * ------------------------------------------------------
     */

    $invoiceId = null;
    $invoiceNumber = null;

    $invoiceReference =
        trim(
            (string) (
                $data['invoice_reference'] ?? ''
            )
        );

    if (
        $invoiceReference !== ''
    ) {
        $invoiceId =
            $this->resolveInvoiceId(
                $invoiceReference
            );

        if (
            $invoiceId === null
        ) {
            abort(
                404,
                'Invoice ' .
                $invoiceReference .
                ' was not found.'
            );
        }

        $invoice =
            DB::table('invoices')
                ->where(
                    'id',
                    $invoiceId
                )
                ->first();

        if (
            ! $invoice
        ) {
            abort(
                404,
                'Invoice not found.'
            );
        }

        $invoiceNumber =
            $invoice->legacy_invoice_id !== null
                ? (string) $invoice->legacy_invoice_id
                : (string) $invoice->id;
    }

    /*
     * ------------------------------------------------------
     * Currency
     * ------------------------------------------------------
     *
     * Base:
     *     amount is supplied directly.
     *
     * Foreign:
     *     amount = quantity × ROE.
     */

    $amount =
        round(
            (float) $data['amount'],
            4
        );

    $currencyQuantity = null;
    $currencyRate = null;

    if (
        $currencyCode !== ''
    ) {
        $currencyQuantity =
            isset(
                $data['currency_quantity']
            )
                ? round(
                    (float) $data['currency_quantity'],
                    4
                )
                : null;

        $currencyRate =
            isset(
                $data['currency_rate']
            )
                ? round(
                    (float) $data['currency_rate'],
                    8
                )
                : null;

        if (
            $currencyQuantity === null ||
            $currencyQuantity <= 0
        ) {
            abort(
                422,
                'Foreign currency quantity is required.'
            );
        }

        if (
            $currencyRate === null ||
            $currencyRate <= 0
        ) {
            abort(
                422,
                'Foreign currency ROE is required.'
            );
        }

        $amount =
            round(
                $currencyQuantity *
                $currencyRate,
                4
            );
    }

    /*
     * ------------------------------------------------------
     * Default Branch / Department
     * ------------------------------------------------------
     *
     * Match the current VoucherController create form:
     * first branch by name and first department by name.
     */

    $branchId =
        DB::table('branches')
            ->orderBy('name')
            ->value('id');

    $departmentId =
        DB::table('departments')
            ->orderBy('name')
            ->value('id');

    if (
        ! $branchId
    ) {
        abort(
            503,
            'No default branch is configured.'
        );
    }

    if (
        ! $departmentId
    ) {
        abort(
            503,
            'No default department is configured.'
        );
    }

    /*
     * ------------------------------------------------------
     * Particular
     * ------------------------------------------------------
     */

    $particular =
        $voucherType === 'BR'
            ? 'RCVD FROM ' .
                (string) $cashBank->name
            : 'Paid from ' .
                (string) $cashBank->name;

    /*
     * ------------------------------------------------------
     * Prepare the exact payload expected by the existing
     * VoucherController.
     * ------------------------------------------------------
     */

    $request->merge([
        'voucher_type' =>
            $voucherType,

        'voucher_no' =>
            null,

        'voucher_date' =>
            now()->toDateString(),

        'ref_no' =>
            null,

        'branch_id' =>
            (int) $branchId,

        'department_id' =>
            (int) $departmentId,

        'cash_bank_account_id' =>
            (int) $cashBank->id,

        'combine_voucher' =>
            false,

        'supervised' =>
            false,

        'lines' => [
            [
                'account_id' =>
                    (int) $party->id,

                'amount' =>
                    $amount,

                'inv_no' =>
                    $invoiceNumber,

                'invoice_id' =>
                    $invoiceId,

                'particulars' =>
                    $particular,

                'cheque_no' =>
                    '',

                'posting_date' =>
                    now()->toDateString(),

                'c' =>
                    false,

                'pa_ac' =>
                    false,

                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,

                'currency_quantity' =>
                    $currencyQuantity,

                'currency_rate' =>
                    $currencyRate,
            ],
        ],
    ]);

    /*
     * ------------------------------------------------------
     * Bot User
     * ------------------------------------------------------
     *
     * The normal VoucherController expects an authenticated user.
     * The WhatsApp endpoint uses the bot token instead, so give
     * the request the configured bot user.
     */

    $botUserId =
        (int) env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first([
                'id',
                'name',
            ]);

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /*
     * ------------------------------------------------------
     * Use the existing native BR/BP accounting engine.
     * ------------------------------------------------------
     */

    /** @var VoucherController $voucherController */
    $voucherController =
        app(
            VoucherController::class
        );

    $voucherId =
        $voucherController->storeFromWhatsApp(
            $request
        );

    $voucher =
        DB::table('vouchers')
            ->where(
                'id',
                $voucherId
            )
            ->first([
                'id',
                'voucher_no',
                'voucher_type',
                'voucher_date',
                'cash_bank_account_code',
            ]);

    return response()->json([
        'ok' =>
            true,

        'voucher' => [
            'id' =>
                (int) $voucher->id,

            'voucher_no' =>
                (string) $voucher->voucher_no,

            'voucher_type' =>
                (string) $voucher->voucher_type,

            'voucher_date' =>
                (string) $voucher->voucher_date,

            'cash_bank_account_code' =>
                (string) $voucher->cash_bank_account_code,

            'cash_bank_account_name' =>
                (string) $cashBank->name,

            'party_account_code' =>
                (string) $party->code,

            'party_account_name' =>
                (string) $party->name,

            'invoice_number' =>
                $invoiceNumber,

            'currency_code' =>
                $currencyCode !== ''
                    ? $currencyCode
                    : null,

            'currency_quantity' =>
                $currencyQuantity,

            'currency_rate' =>
                $currencyRate,

            'base_amount' =>
                $amount,

            'particulars' =>
                $particular,
        ],
    ]);
}

public function createJournalVoucher(
    Request $request
): \Illuminate\Http\JsonResponse {

    $this->authorizeBot(
        $request
    );

    $data =
        $request->validate([
            'lines' => [
                'required',
                'array',
                'min:2',
                'max:100',
            ],

            'lines.*.account_alias' => [
                'required',
                'string',
                'size:2',
                'regex:/^[A-Za-z]{2}$/',
            ],

            'lines.*.account_suffix' => [
                'required',
                'regex:/^\d{3}$/',
            ],

            'lines.*.side' => [
                'required',
                'in:debit,credit',
            ],

            'lines.*.amount' => [
                'nullable',
                'numeric',
                'gt:0',
            ],

            'lines.*.currency_code' => [
                'nullable',
                'in:SAR',
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

            'lines.*.invoice_reference' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

    $accountTypes =
        $this->whatsappAccountTypeMap();

    $journalLines = [];

    foreach (
        $data['lines'] as $index => $line
    ) {
        $alias =
            strtoupper(
                trim(
                    (string)
                    $line['account_alias']
                )
            );

        if (
            ! isset(
                $accountTypes[$alias]
            )
        ) {
            abort(
                422,
                "Unknown account type code: {$alias}."
            );
        }

        /*
         * Cash / Bank is the dedicated BR/BP account.
         * Do not allow it as a JV detail account.
         */
        if (
            $alias === 'CB'
        ) {
            abort(
                422,
                'CB cannot be used as a JV detail account.'
            );
        }

        $prefix =
    $accountTypes[
        $alias
    ]['prefix'];

$accountSuffix =
    trim(
        (string)
        $line['account_suffix']
    );

$accounts =
    DB::table('accounts')
        ->where(
            'code',
            'like',
            $prefix . '%'
        )
        ->whereRaw(
            'RIGHT(CAST(code AS CHAR), 3) = ?',
            [
                $accountSuffix,
            ]
        )
        ->where(
            function ($query) {
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
        ->get();

if (
    $accounts->count() === 0
) {
    abort(
        404,
        sprintf(
            '%s account ending in %s was not found.',
            $alias,
            $accountSuffix
        )
    );
}

if (
    $accounts->count() > 1
) {
    abort(
        409,
        sprintf(
            'Multiple %s accounts end in %s.',
            $alias,
            $accountSuffix
        )
    );
}

$account =
    $accounts->first();

        if (
            ! $account
        ) {
            abort(
                404,
                sprintf(
                    '%s account %s was not found.',
                    $alias,
                    $fullCode
                )
            );
        }

        $side =
            $line['side'] === 'credit'
                ? 'credit'
                : 'debit';

        $currencyCode =
            strtoupper(
                trim(
                    (string) (
                        $line['currency_code']
                        ?? ''
                    )
                )
            );

        $amount = 0.0;

        $currencyQuantity = null;
        $currencyRate = null;

        if (
            $currencyCode !== ''
        ) {
            $currencyQuantity =
                isset(
                    $line[
                        'currency_quantity'
                    ]
                )
                    ? (float) (
                        $line[
                            'currency_quantity'
                        ]
                    )
                    : null;

            $currencyRate =
                isset(
                    $line[
                        'currency_rate'
                    ]
                )
                    ? (float) (
                        $line[
                            'currency_rate'
                        ]
                    )
                    : null;

            if (
                $currencyQuantity === null ||
                $currencyRate === null ||
                $currencyQuantity <= 0 ||
                $currencyRate <= 0
            ) {
                abort(
                    422,
                    sprintf(
                        'Line %d requires a valid SAR quantity and ROE.',
                        $index + 1
                    )
                );
            }

            $amount =
                round(
                    $currencyQuantity *
                    $currencyRate,
                    4
                );
        } else {
            $amount =
                isset(
                    $line['amount']
                )
                    ? round(
                        (float)
                        $line['amount'],
                        4
                    )
                    : 0.0;

            if (
                $amount <= 0
            ) {
                abort(
                    422,
                    sprintf(
                        'Line %d requires an amount.',
                        $index + 1
                    )
                );
            }
        }

        /*
         * Optional invoice.
         */
        $invoiceId = null;
        $invoiceNo = null;

        $invoiceReference =
            trim(
                (string) (
                    $line[
                        'invoice_reference'
                    ] ?? ''
                )
            );

        if (
            $invoiceReference !== ''
        ) {
            $invoiceId =
                $this->resolveInvoiceId(
                    $invoiceReference
                );

            if (
                $invoiceId === null
            ) {
                abort(
                    404,
                    "Invoice {$invoiceReference} was not found."
                );
            }

            $invoice =
                DB::table('invoices')
                    ->where(
                        'id',
                        $invoiceId
                    )
                    ->select([
                        'id',
                        'legacy_invoice_id',
                    ])
                    ->first();

            if (
                ! $invoice
            ) {
                abort(
                    404,
                    "Invoice {$invoiceReference} was not found."
                );
            }

            $invoiceNo =
                $invoice->legacy_invoice_id !== null
                    ? (string)
                        $invoice->legacy_invoice_id
                    : (string)
                        $invoice->id;
        }

        /*
         * Automatic particulars.
         */
        $particulars =
            ($side === 'debit'
                ? 'Debit - '
                : 'Credit - '
            ) .
            (string) $account->name;

        $journalLines[] = [
            'account_id' =>
                (int) $account->id,

            'invoice_id' =>
                $invoiceId,

            'inv_no' =>
                $invoiceNo,

            'particulars' =>
                $particulars,

            'cheque_no' =>
                '',

            'posting_date' =>
                now()->toDateString(),

            'currency_code' =>
                $currencyCode,

            'currency_quantity' =>
                $currencyQuantity,

            'currency_rate' =>
                $currencyRate,

            'currency_side' =>
                $side,

            'debit' =>
                $side === 'debit'
                    ? $amount
                    : 0,

            'credit' =>
                $side === 'credit'
                    ? $amount
                    : 0,

            'c' =>
                false,

            'legacy_master_id' =>
                null,
        ];
    }

    /*
     * ------------------------------------------------------
     * Prevent accidental unbalanced creation before handing
     * the request to the native JV engine.
     * ------------------------------------------------------
     */

    $debitTotal =
        collect(
            $journalLines
        )->sum(
            fn ($line) =>
                (float)
                $line['debit']
        );

    $creditTotal =
        collect(
            $journalLines
        )->sum(
            fn ($line) =>
                (float)
                $line['credit']
        );

    if (
        abs(
            $debitTotal -
            $creditTotal
        ) >= 0.00005
    ) {
        abort(
            422,
            sprintf(
                'JV is not balanced. Debit %.4f does not equal Credit %.4f.',
                $debitTotal,
                $creditTotal
            )
        );
    }

    /*
     * ------------------------------------------------------
     * Default branch / department
     * ------------------------------------------------------
     */

    $branchId =
        DB::table('branches')
            ->orderBy('name')
            ->value('id');

    $departmentId =
        DB::table('departments')
            ->orderBy('name')
            ->value('id');

    if (
        ! $branchId
    ) {
        abort(
            503,
            'No default branch is configured.'
        );
    }

    if (
        ! $departmentId
    ) {
        abort(
            503,
            'No default department is configured.'
        );
    }

    /*
     * ------------------------------------------------------
     * Bot user
     * ------------------------------------------------------
     */

    $botUserId =
        (int) env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    /*
     * Prepare the exact request structure accepted by
     * JournalVoucherController::validateRequest().
     */
    $request->merge([
        'voucher_no' =>
            null,

        'voucher_date' =>
            now()->toDateString(),

        'ref_no' =>
            null,

        'branch_id' =>
            (int) $branchId,

        'department_id' =>
            (int) $departmentId,

        'combine_voucher' =>
            false,

        'supervised' =>
            false,

        'lines' =>
            $journalLines,
    ]);

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var JournalVoucherController $journalVoucherController */
    $journalVoucherController =
        app(
            JournalVoucherController::class
        );

    return $journalVoucherController
        ->storeFromWhatsApp(
            $request
        );
}



    public function otherReportPdf(
    Request $request,
    CompanySettingsService $companySettings,
): Response {

    $this->authorizeBot($request);

    $validated = $request->validate([
        'report_type' => [
            'required',
            'in:ARR,TRA',
        ],

        'date_from' => [
            'required',
            'date',
        ],

        'date_to' => [
            'required',
            'date',
            'after_or_equal:date_from',
        ],
    ]);

    $reportType = strtoupper(
        trim(
            (string) $validated['report_type']
        )
    );

    $reportName = match ($reportType) {
        'ARR' => 'Check In',
        'TRA' => 'Transportation Action Report',
    };

    /*
     * Reuse the existing Other Reports engine.
     *
     * We do not rebuild Check-In or Transport logic here.
     */
    $request->merge([
        'report_name' => $reportName,
        'date_from' => $validated['date_from'],
        'date_to' => $validated['date_to'],
        'filter_type' => 'all',
        'filter_value' => '',
    ]);

    /** @var OtherReportsController $otherReportsController */
    $otherReportsController = app(
        OtherReportsController::class,
    );

    return $otherReportsController->pdf(
        $request,
        $companySettings,
    );
}

    public function ledgerPdf(
    Request $request,
): Response {

    $this->authorizeBot($request);

    $validated = $request->validate([
        'account_suffix' => [
            'required',
            'regex:/^\d{3}$/',
        ],

        'date_from' => [
            'required',
            'date',
        ],

        'date_to' => [
            'required',
            'date',
            'after_or_equal:date_from',
        ],

        'currency_code' => [
            'nullable',
            'string',
            'max:20',
        ],

        'combine_invoices' => [
            'nullable',
            'boolean',
        ],
    ]);

    $accountSuffix = trim(
        (string) $validated['account_suffix']
    );

    /*
     * The WhatsApp command intentionally accepts only
     * the final 3 digits of the ERP account code.
     *
     * Example:
     * 1200052 -> 052
     */
    /*
 * Resolve the ERP account from the final 3 digits.
 *
 * The normal Accu/HBA account structure uses 7-digit codes,
 * so for:
 *
 *     052
 *
 * first try:
 *
 *     1200052
 *
 * This preserves the user's short WhatsApp command while
 * avoiding unnecessary ambiguity when the exact 7-digit
 * account exists.
 */
$preferredCode = '1200' . $accountSuffix;

$account = DB::table('accounts')
    ->where('code', $preferredCode)
    ->first([
        'id',
        'code',
        'name',
    ]);

if (!$account) {
    /*
     * Fallback: find accounts whose code ends in the
     * requested 3 digits.
     */
    $accounts = DB::table('accounts')
        ->whereRaw(
            'RIGHT(CAST(code AS CHAR), 3) = ?',
            [$accountSuffix]
        )
        ->orderBy('id')
        ->get([
            'id',
            'code',
            'name',
        ]);

    if ($accounts->count() === 0) {
        abort(
            404,
            "No account found ending with {$accountSuffix}."
        );
    }

    /*
     * If there is only one suffix match, use it.
     */
    if ($accounts->count() === 1) {
        $account = $accounts->first();
    } else {
        /*
         * We cannot safely guess between multiple accounts.
         */
        abort(
            409,
            "Multiple accounts found ending with {$accountSuffix}. No exact 7-digit account was found."
        );
    }
}

    /*
     * Reuse the existing LedgerController PDF engine.
     *
     * This is important:
     * We do NOT rebuild ledger calculations here.
     * The normal ERP ledger PDF remains the single source
     * of truth for balances, currencies and combined invoices.
     */
    $request->merge([
        'account_id' => (int) $account->id,

        'currency_code' =>
            !empty($validated['currency_code'])
                ? strtoupper(
                    trim(
                        (string) $validated['currency_code']
                    )
                )
                : null,

        'combine_invoices' =>
            filter_var(
                $validated['combine_invoices'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            ) ? 1 : 0,
    ]);

    /** @var LedgerController $ledgerController */
    $ledgerController = app(
        LedgerController::class
    );

    return $ledgerController->pdf(
        $request
    );
}

private function whatsappAccountTypeMap(): array
{
    return [
        'CB' => [
            'name' => 'Petty Cash & Bank',
            'prefix' => '110',
        ],

        'CL' => [
            'name' => 'Receivables / Customers',
            'prefix' => '120',
        ],

        'CA' => [
            'name' => 'Current Assets',
            'prefix' => '121',
        ],

        'IN' => [
            'name' => 'Investment',
            'prefix' => '122',
        ],

        'SA' => [
            'name' => 'Staff Salaries & Advances',
            'prefix' => '123',
        ],

        'AD' => [
            'name' => 'Advances & Deposits',
            'prefix' => '124',
        ],

        'FA' => [
            'name' => 'Fix Assets',
            'prefix' => '130',
        ],

        'VE' => [
            'name' => 'Payables / Vendors',
            'prefix' => '210',
        ],

        'AL' => [
            'name' => 'Airlines',
            'prefix' => '211',
        ],

        'ST' => [
            'name' => 'Short term loans',
            'prefix' => '212',
        ],

        'LT' => [
            'name' => 'Long term loans',
            'prefix' => '220',
        ],

        'CP' => [
            'name' => 'Capital',
            'prefix' => '230',
        ],

        'UP' => [
            'name' => 'Unappropriated Profit',
            'prefix' => '231',
        ],

        'CO' => [
            'name' => 'Cost of Revenue',
            'prefix' => '310',
        ],

        'EX' => [
            'name' => 'Operating Expenses',
            'prefix' => '320',
        ],

        'FE' => [
            'name' => 'Financial Expenses',
            'prefix' => '321',
        ],

        'DP' => [
            'name' => 'Depreciation',
            'prefix' => '322',
        ],

        'SL' => [
            'name' => 'Sales',
            'prefix' => '410',
        ],

        'OI' => [
            'name' => 'Other Income',
            'prefix' => '420',
        ],
    ];
}

public function accountsByType(
    Request $request,
    string $alias,
): JsonResponse {

    $this->authorizeBot(
        $request
    );

    $alias =
        strtoupper(
            trim($alias)
        );

    $types =
        $this->whatsappAccountTypeMap();

    if (
        ! isset($types[$alias])
    ) {
        abort(
            422,
            "Unknown account type code: {$alias}."
        );
    }

    $type =
        $types[$alias];

    $accounts =
        DB::table('accounts')
            ->where(
                'code',
                'like',
                $type['prefix'] . '%'
            )
            ->where(
                function ($query) {
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
                'code',
                'name',
            ])
            ->orderBy(
                'code'
            )
            ->get()
            ->map(
                function ($account) {
                    $code =
                        trim(
                            (string) $account->code
                        );

                    return [
                        'name' =>
                            trim(
                                (string) $account->name
                            ),

                        'last3' =>
                            substr(
                                $code,
                                -3
                            ),
                    ];
                }
            )
            ->values()
            ->all();

    return response()->json([
        'ok' => true,

        'type' => [
            'alias' =>
                $alias,

            'name' =>
                $type['name'],

            'prefix' =>
                $type['prefix'],
        ],

        'accounts' =>
            $accounts,
    ]);
}

public function createHotelInvoice(
    Request $request
): JsonResponse {

    $this->authorizeBot(
        $request
    );

    /*
     * The normal InvoiceController requires a user for
     * created_by / legacy_entered_by.
     *
     * Reuse the same bot-user approach already used by
     * the WhatsApp BR/BP and JV creation endpoints.
     */
    $botUserId =
        (int) env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->storeFromWhatsAppHotel(
            $request
        );
}

public function addHotelInvoiceLine(
    Request $request,
    string $reference
): JsonResponse {

    $this->authorizeBot(
        $request
    );

    $invoiceId =
        $this->resolveInvoiceId(
            $reference
        );

    abort_unless(
        $invoiceId !== null,
        404,
        'Invoice not found.'
    );

    /*
     * The existing WhatsApp bot user must become the
     * request user because InvoiceController's native
     * journal engine records the entry user.
     */
    $botUserId =
        (int)
        env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->addHotelLineFromWhatsApp(
            $request,
            $invoiceId
        );
}

public function createVisaInvoice(
    Request $request
): JsonResponse {
    $this->authorizeBot(
        $request
    );

    $botUserId =
        (int)
        env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->storeFromWhatsAppVisa(
            $request
        );
}


public function addVisaInvoiceLine(
    Request $request,
    string $reference
): JsonResponse {
    $this->authorizeBot(
        $request
    );

    $invoiceId =
        $this->resolveInvoiceId(
            $reference
        );

    abort_unless(
        $invoiceId !== null,
        404,
        'Invoice not found.'
    );

    $botUserId =
        (int)
        env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->addVisaLineFromWhatsApp(
            $request,
            $invoiceId
        );
}

public function createTransferInvoice(
    Request $request
): JsonResponse {
    $this->authorizeBot(
        $request
    );

    $botUserId =
        (int)
        env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->storeFromWhatsAppTransfer(
            $request
        );
}


public function addTransferInvoiceLine(
    Request $request,
    string $reference
): JsonResponse {
    $this->authorizeBot(
        $request
    );

    $invoiceId =
        $this->resolveInvoiceId(
            $reference
        );

    abort_unless(
        $invoiceId !== null,
        404,
        'Invoice not found.'
    );

    $botUserId =
        (int)
        env(
            'WHATSAPP_BOT_USER_ID',
            1
        );

    $botUser =
        DB::table('users')
            ->where(
                'id',
                $botUserId
            )
            ->first();

    if (
        ! $botUser
    ) {
        abort(
            503,
            'WhatsApp bot user is not configured.'
        );
    }

    $request->setUserResolver(
        static fn () =>
            $botUser
    );

    /** @var InvoiceController $invoiceController */
    $invoiceController =
        app(
            InvoiceController::class
        );

    return $invoiceController
        ->addTransferLineFromWhatsApp(
            $request,
            $invoiceId
        );
}

    /**
     * Verify that the request came from the local
     * WhatsApp bot service.
     */
    private function authorizeBot(
        Request $request,
    ): void {
        $configuredToken = trim(
    (string) config(
        'services.whatsapp_bot.token',
        '',
    ),
);

        if ($configuredToken === '') {
            abort(
                503,
                'WHATSAPP_BOT_TOKEN is not configured.',
            );
        }

        $authorization = trim(
            (string) $request->header(
                'Authorization',
                '',
            ),
        );

        if (
            ! preg_match(
                '/^Bearer\s+(.+)$/i',
                $authorization,
                $matches,
            )
        ) {
            abort(
                401,
                'Missing WhatsApp bot authorization token.',
            );
        }

        $providedToken = trim(
            (string) (
                $matches[1] ?? ''
            ),
        );

        if (
            $providedToken === '' ||
            ! hash_equals(
                $configuredToken,
                $providedToken,
            )
        ) {
            abort(
                403,
                'Invalid WhatsApp bot authorization token.',
            );
        }
    }

    /**
     * Resolve the visible ERP invoice number.
     *
     * In this ERP the invoice number displayed to users
     * is stored in invoices.legacy_invoice_id.
     *
     * Example:
     *
     * WhatsApp:
     * PDF
     * INV
     * 2009
     *
     * resolves to legacy_invoice_id = 2009.
     *
     * Internal database ID remains a fallback.
     */
    private function resolveInvoiceId(
        string $reference,
    ): ?int {
        $reference = trim(
            $reference,
        );

        if (
            $reference === '' ||
            ! ctype_digit($reference)
        ) {
            return null;
        }

        /*
         * PRIMARY:
         *
         * The ERP uses legacy_invoice_id as the visible
         * invoice number.
         */
        $invoice = DB::table('invoices')
            ->where(
                'legacy_invoice_id',
                (int) $reference,
            )
            ->orderByDesc('id')
            ->first();

        if ($invoice) {
            return (int) $invoice->id;
        }

        /*
         * FALLBACK:
         *
         * Allow an internal invoice ID as well.
         */
        $invoice = DB::table('invoices')
            ->where(
                'id',
                (int) $reference,
            )
            ->first();

        if ($invoice) {
            return (int) $invoice->id;
        }

        return null;
    }
}