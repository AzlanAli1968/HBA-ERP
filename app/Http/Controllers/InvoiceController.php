<?php

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InvoiceController extends Controller
{
    private const MODES = ['Ticket', 'Visa', 'Hotel', 'Transfer', 'Other'];
    private const STATUSES = ['Definite', 'Definite / Non Refundable', 'Invoice', 'Tentative Confirmation'];

    public function index(Request $request): InertiaResponse
    {
        $search = trim($request->string('search')->toString());

        /*
         * The normalized invoice_transactions table is NOT authoritative for
         * imported Accu invoices.  Historical rows can be present without the
         * correct invoice_id, or contain incomplete financial columns.
         *
         * The real Accu source is InvTickets (detail rows) + Master (accounting
         * rows) keyed by the original Invoice ID.  Load the 250 visible invoice
         * headers first, then resolve their legacy values in one batched lookup.
         */
        $rows = DB::table('invoices as i')
            ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.invoice_date',
                'i.ref_no',
                'i.status',
                'i.is_active',
                'i.client_account_id',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('i.legacy_invoice_id', 'like', '%' . $search . '%')
                        ->orWhere('i.ref_no', 'like', '%' . $search . '%')
                        ->orWhere('a.code', 'like', '%' . $search . '%')
                        ->orWhere('a.name', 'like', '%' . $search . '%');
                });
            })
            ->orderByDesc('i.invoice_date')
            ->orderByDesc('i.id')
            ->limit(250)
            ->get();

        // Native HBA invoices can numerically overlap old Accu invoice numbers.
        // Historical imported rows may also exist in invoice_transactions, so that
        // table alone cannot identify a native invoice. Native saves stamp the
        // linked journal/transaction with legacy_data.native=true.
        $invoiceIds = $rows->pluck('id')->map(fn ($value) => (int) $value)->values()->all();
        $nativeInvoiceIds = $this->nativeInvoiceIds($invoiceIds);

        $nativeFinancials = empty($nativeInvoiceIds)
            ? collect()
            : DB::table('invoice_transactions')
                ->select('invoice_id')
                ->selectRaw('COUNT(*) AS line_count')
                ->selectRaw('COALESCE(SUM(COALESCE(total_fare, 0)), 0) AS receivable')
                ->selectRaw(
                    "COALESCE(SUM(
                        COALESCE(rate_vendor, vendor_rate, 0)
                        + COALESCE(fare_2, 0)
                        + COALESCE(fare_3, 0)
                        + CASE
                            WHEN UPPER(TRIM(COALESCE(mode, ''))) IN ('HOTEL', 'VISA', 'TRANSFER', 'TICKET', 'OTHER')
                            THEN COALESCE(agent_amount, 0)
                            ELSE 0
                          END
                    ), 0) AS payable"
                )
                ->selectRaw(
                    "COALESCE(SUM(
                        COALESCE(total_fare, 0)
                        - (COALESCE(rate_vendor, vendor_rate, 0) + COALESCE(fare_2, 0) + COALESCE(fare_3, 0))
                        - CASE
                            WHEN UPPER(TRIM(COALESCE(mode, ''))) IN ('HOTEL', 'VISA', 'TRANSFER', 'TICKET')
                            THEN COALESCE(agent_amount, 0)
                            ELSE 0
                          END
                    ), 0) AS profit"
                )
                ->whereIn('invoice_id', $nativeInvoiceIds)
                ->groupBy('invoice_id')
                ->get()
                ->keyBy(fn ($row) => (int) $row->invoice_id);

        $legacyNumbers = $rows
            ->pluck('legacy_invoice_id')
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();

        $legacy = $this->loadLegacyInvoiceContext($legacyNumbers);

        $legacyClientCodes = collect($legacy)
            ->map(fn (array $context) => trim((string) ($context['legacy_client_code'] ?? '')))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $legacyAccounts = $legacyClientCodes === []
            ? collect()
            : DB::table('accounts')
                ->select('id', 'code', 'name')
                ->whereIn('code', $legacyClientCodes)
                ->get()
                ->keyBy(fn ($account) => (string) $account->code);

        $invoices = $rows->map(function ($row) use ($legacy, $legacyAccounts, $nativeFinancials, $nativeInvoiceIds): array {
            $number = (int) $row->legacy_invoice_id;
            $key = (string) $number;
            $native = $nativeFinancials->get((int) $row->id);
            $context = $legacy[$key] ?? null;

            $receivable = 0.0;
            $payable = 0.0;
            $status = (string) ($row->status ?? '');
            $invoiceDate = $row->invoice_date
                ? substr((string) $row->invoice_date, 0, 10)
                : '';
            $lineCount = 0;
            $dataSource = 'normalized';
            $clientCode = (string) ($row->client_code ?? '');
            $clientName = (string) ($row->client_name ?? '');
            $refNo = (string) ($row->ref_no ?? '');
            $active = (int) ($row->is_active ?? 1) === 1;

            if ($native !== null) {
                $dataSource = 'normalized';
                $lineCount = (int) ($native->line_count ?? 0);
                $receivable = (float) ($native->receivable ?? 0);
                $payable = (float) ($native->payable ?? 0);
            } elseif (
                $context !== null
                && (
                    ($context['legacy_invoice'] ?? null) !== null
                    || !empty($context['tickets'])
                    || !empty($context['master'])
                )
            ) {
                $dataSource = 'accu';
                $lineCount = count($context['tickets']);

                // Imported historical invoices may have normalized transaction
                // rows even when the legacy ticket archive has no ticket rows.
                if ($lineCount === 0) {
                    $lineCount = (int) DB::table('invoice_transactions')
                        ->where('invoice_id', (int) $row->id)
                        ->count();

                    if ($lineCount === 0 && $number > 0) {
                        $lineCount = (int) DB::table('invoice_transactions')
                            ->where('legacy_invoice_id', $number)
                            ->count();
                    }
                }

                if (!empty($context['legacy_invoice'])) {
                    $legacyInvoice = $context['legacy_invoice'];
                    $status = trim((string) ($legacyInvoice->{'Status'} ?? '')) ?: $status;
                    if (!empty($legacyInvoice->{'Invoice Date'})) {
                        $invoiceDate = substr((string) $legacyInvoice->{'Invoice Date'}, 0, 10);
                    }
                    $refNo = trim((string) ($legacyInvoice->{'Ref #'} ?? ''));
                    $active = (int) ($legacyInvoice->{'Active'} ?? 1) === 1;
                    $legacyClientCode = trim((string) ($legacyInvoice->{'Client Code'} ?? ''));
                    if ($legacyClientCode !== '') {
                        $clientCode = $legacyClientCode;
                        $clientName = (string) ($legacyAccounts[$legacyClientCode]->name ?? $legacyClientCode);
                    }
                }

                $clientCode = $this->resolveLegacyClientCode($context, $clientCode);
                if ($clientCode !== '' && !isset($legacyAccounts[$clientCode])) {
                    $accountName = DB::table('accounts')->where('code', $clientCode)->value('name');
                    if ($accountName) {
                        $clientName = (string) $accountName;
                    }
                }

                if ($lineCount === 0 && !empty($context['master'])) {
                    $lineCount = $this->legacyDetailCountFromMaster($context, $clientCode);
                }

                [$receivable, $payable] = $this->legacyInvoiceTotals(
                    $context,
                    $clientCode,
                    $number,
                );
            } else {
                [$receivable, $payable, $lineCount, $nativeProfit] = $this->nativeInvoiceFinancials(
                    (int) $row->id,
                    (int) ($row->legacy_invoice_id ?? 0),
                );
            }

            $profit = $receivable - $payable;
            if ($dataSource !== 'accu' && $native !== null) {
                $profit = (float) ($native->profit ?? ($receivable - $payable));
            } elseif ($dataSource !== 'accu' && isset($nativeProfit)) {
                $profit = (float) $nativeProfit;
            } elseif ($dataSource === 'accu' && $context !== null) {
                $profit = $this->legacyInvoiceProfit(
                    $context,
                    $clientCode,
                    $number,
                    $receivable,
                    $payable,
                );
            }

            return [
                'id' => (int) $row->id,
                'invoice_number' => (string) $row->legacy_invoice_id,
                'invoice_date' => $invoiceDate,
                'ref_no' => $refNo,
                'client_code' => $clientCode,
                'client_name' => $clientName,
                'status' => $status,
                'active' => $active,
                'line_count' => $lineCount,
                'data_source' => $dataSource,
                'deletable' => in_array((int) $row->id, $nativeInvoiceIds, true),
                'receivable' => round($receivable, 2),
                'payable' => round($payable, 2),
                'profit' => round($profit, 2),
            ];
        })->values()->all();

        return Inertia::render('Sales/Index', $this->sanitizeUtf8([
            'invoices' => $invoices,
            'filters' => ['search' => $search],
        ]));
    }

    /**
     * Return transaction lines for inline expansion on the invoice list.
     *
     * Historical Accu invoices use Invoice + InvTickets + Master(SubID).
     * Native HBA invoices use the normalized invoice_transactions table.
     * The endpoint is lazy-loaded so the main invoice list stays fast even
     * when hundreds of invoices are visible.
     */
    public function lines(int $invoice): JsonResponse
    {
        $header = DB::table('invoices as i')
            ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.client_account_id',
                'a.code as client_code',
            ])
            ->where('i.id', $invoice)
            ->first();

        abort_unless($header, 404);

        $legacyNumber = (int) $header->legacy_invoice_id;

        // Only explicitly marked native invoices should bypass the authoritative
        // legacy archive. Imported Accu rows can also exist in invoice_transactions.
        $transactions = $this->isNativeInvoice($invoice)
            ? $this->nativeTransactionsForInvoice($invoice, $legacyNumber)
            : collect();
        if ($transactions->isNotEmpty()) {
            $lines = $transactions
                ->map(function ($line) use ($header): array {
                    return array_merge(
                        $this->decorateTransaction($line),
                        [
                            'customer_code' => (string) ($header->client_code ?? ''),
                            'customer_name' => (string) ($header->client_name ?? $header->client_code ?? ''),
                        ],
                    );
                })
                ->values()
                ->all();

            return response()->json($this->sanitizeUtf8([
                'data_source' => 'HBA ERP',
                'line_count' => count($lines),
                'lines' => $lines,
            ]));
        }

        $legacy = $this->loadLegacyInvoiceContext([$legacyNumber]);
        $context = $legacy[(string) $legacyNumber] ?? null;

        if (
            $context !== null
            && (
                ($context['legacy_invoice'] ?? null) !== null
                || !empty($context['tickets'])
                || !empty($context['master'])
            )
        ) {
            $clientCode = $this->resolveLegacyClientCode(
                $context,
                (string) ($header->client_code ?? ''),
            );

            $lines = collect($context['tickets'])
                ->map(function ($ticket) use ($context, $clientCode, $legacyNumber): array {
                    $masterRows = $this->legacyMasterRowsForTicket(
                        $context,
                        $ticket,
                    );

                    return array_merge(
                        $this->decorateLegacyTransaction(
                            $ticket,
                            $masterRows,
                            $clientCode,
                            $legacyNumber,
                        ),
                        [
                            'customer_code' => $clientCode,
                            'customer_name' => (string) (DB::table('accounts')->where('code', $clientCode)->value('name') ?? $clientCode),
                        ],
                    );
                })
                ->values()
                ->all();

            /*
             * Some historical invoices have no legacy ticket rows even though
             * their imported normalized transaction rows are present.
             * Use those rows for display only. The invoice remains legacy/read-only.
             */
            if ($lines === []) {
                $fallbackTransactions = $this->nativeTransactionsForInvoice(
                    $invoice,
                    $legacyNumber,
                );

                if ($fallbackTransactions->isNotEmpty()) {
                    $lines = $fallbackTransactions
                        ->map(function ($line) use ($header): array {
                            return array_merge(
                                $this->decorateTransaction($line),
                                [
                                    'customer_code' => (string) ($header->client_code ?? ''),
                                    'customer_name' => (string) ($header->client_name ?? $header->client_code ?? ''),
                                ],
                            );
                        })
                        ->values()
                        ->all();
                }
            }

            return response()->json($this->sanitizeUtf8([
                'data_source' => 'Accu-Travel',
                'line_count' => count($lines),
                'lines' => $lines,
            ]));
        }

        // If the legacy archive is temporarily unavailable but the import
        // already contains normalized transaction rows, still expose those
        // rows rather than returning an empty expansion.
        $fallbackTransactions = $this->nativeTransactionsForInvoice(
            $invoice,
            $legacyNumber,
        );

        if ($fallbackTransactions->isNotEmpty()) {
            $lines = $fallbackTransactions
                ->map(function ($line) use ($header): array {
                    return array_merge(
                        $this->decorateTransaction($line),
                        [
                            'customer_code' => (string) ($header->client_code ?? ''),
                            'customer_name' => (string) ($header->client_name ?? $header->client_code ?? ''),
                        ],
                    );
                })
                ->values()
                ->all();

            return response()->json($this->sanitizeUtf8([
                'data_source' => 'HBA ERP',
                'line_count' => count($lines),
                'lines' => $lines,
            ]));
        }

        return response()->json($this->sanitizeUtf8([
            'data_source' => 'HBA ERP',
            'line_count' => 0,
            'lines' => [],
        ]));
    }

    /**
     * Browser-printable A4 invoice document.
     */
    public function invoicePrint(int $invoice, CompanySettingsService $companyService)
    {
        $data = $this->buildDocumentData($invoice);

        return response()->view('documents.invoice', [
            'document' => $data,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => true,
        ]);
    }

    /**
     * Downloadable A4 invoice PDF.
     */
    public function invoicePdf(int $invoice, CompanySettingsService $companyService)
    {
        $data = $this->buildDocumentData($invoice);

        $pdf = Pdf::loadView('documents.invoice', [
            'document' => $data,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => false,
            'pdfDownload' => true,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->safeFilename(
            'Invoice-' . $data['invoice']['invoice_number'] . '-' . now()->format('Ymd-His') . '.pdf'
        ));
    }

    /**
     * Browser-printable service voucher. No financial or bank details are shown.
     */
    public function voucherPrint(int $invoice, CompanySettingsService $companyService)
    {
        $data = $this->buildDocumentData($invoice);

        return response()->view('documents.service-voucher', [
            'document' => $data,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => true,
        ]);
    }

    /**
     * Downloadable A4 service voucher PDF. No financial or bank details are shown.
     */
    public function voucherPdf(int $invoice, CompanySettingsService $companyService)
    {
        $data = $this->buildDocumentData($invoice);

        $pdf = Pdf::loadView('documents.service-voucher', [
            'document' => $data,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => false,
            'pdfDownload' => true,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->safeFilename(
            'Service-Voucher-' . $data['invoice']['invoice_number'] . '-' . now()->format('Ymd-His') . '.pdf'
        ));
    }

    /**
     * Build one authoritative document data set for both invoice and voucher.
     * Historical Accu invoices use Invoice + InvTickets + Master(SubID), while
     * native HBA invoices use invoices + invoice_transactions.
     */
    private function buildDocumentData(int $invoice): array
    {
        $header = DB::table('invoices as i')
            ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
            ->select([
                'i.*',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->where('i.id', $invoice)
            ->first();

        abort_unless($header, 404);

        $branchName = (string) (DB::table('branches')
            ->where('id', (int) ($header->branch_id ?? 0))
            ->value('name') ?? '');

        $departmentName = (string) (DB::table('departments')
            ->where('id', (int) ($header->department_id ?? 0))
            ->value('name') ?? '');

        $legacyNumber = (int) $header->legacy_invoice_id;
        $transactions = $this->isNativeInvoice($invoice)
            ? $this->nativeTransactionsForInvoice($invoice, $legacyNumber)
            : collect();

        if ($transactions->isNotEmpty()) {
            $lines = $transactions
                ->map(fn ($line) => $this->decorateTransaction($line))
                ->values()
                ->all();

            $receivable = collect($lines)->sum(fn (array $line) => (float) ($line['receivable_amount'] ?? 0));
            $payable = collect($lines)->sum(fn (array $line) => (float) ($line['payable_amount'] ?? (
                (float) ($line['vendor_amount'] ?? 0)
                + (float) ($line['vendor_amount_2'] ?? 0)
                + (float) ($line['vendor_amount_3'] ?? 0)
            )));
            $profit = collect($lines)->sum(fn (array $line) =>
                (float) ($line['profit_amount'] ?? (
                    (float) ($line['receivable_amount'] ?? 0)
                    - (float) ($line['payable_amount'] ?? (
                        (float) ($line['vendor_amount'] ?? 0)
                        + (float) ($line['vendor_amount_2'] ?? 0)
                        + (float) ($line['vendor_amount_3'] ?? 0)
                    ))
                ))
            );

            return $this->decorateDocumentData(
                $this->decorateHeader($header),
                $lines,
                $receivable,
                $payable,
                'HBA ERP',
                $branchName,
                $departmentName,
                $profit,
            );
        }

        $legacy = $this->loadLegacyInvoiceContext([$legacyNumber]);
        $context = $legacy[(string) $legacyNumber] ?? null;

        if (
            $context !== null
            && (
                ($context['legacy_invoice'] ?? null) !== null
                || !empty($context['tickets'])
                || !empty($context['master'])
            )
        ) {
            $headerData = $this->decorateHeader($header);
            $legacyInvoice = $context['legacy_invoice'] ?? null;

            if ($legacyInvoice !== null) {
                $headerData = $this->mergeLegacyInvoiceHeader($headerData, $legacyInvoice);
            }

            if ($branchName === '') {
                $branchName = (string) (DB::table('branches')
                    ->where('id', (int) ($headerData['branch_id'] ?? 0))
                    ->value('name') ?? '');
            }

            if ($departmentName === '') {
                $departmentName = (string) (DB::table('departments')
                    ->where('id', (int) ($headerData['department_id'] ?? 0))
                    ->value('name') ?? '');
            }

            $clientCode = $this->resolveLegacyClientCode(
                $context,
                (string) ($headerData['client_code'] ?? ''),
            );
            $headerData['client_code'] = $clientCode;
            if ($clientCode !== '') {
                $clientAccountName = DB::table('accounts')->where('code', $clientCode)->value('name');
                if ($clientAccountName) {
                    $headerData['client_name'] = (string) $clientAccountName;
                }
            }

            $lines = collect($context['tickets'])
                ->map(function ($ticket) use ($context, $clientCode, $legacyNumber): array {
                    $masterRows = $this->legacyMasterRowsForTicket(
                        $context,
                        $ticket,
                    );

                    return $this->decorateLegacyTransaction(
                        $ticket,
                        $masterRows,
                        $clientCode,
                        $legacyNumber,
                    );
                })
                ->values()
                ->all();

            /*
             * Historical invoices may have normalized transaction rows even
             * when the Accu ticket archive has no ticket rows.
             * Use them for display only; keep this invoice legacy/read-only.
             */
            if ($lines === []) {
                $fallbackTransactions = $this->nativeTransactionsForInvoice(
                    $invoice,
                    $legacyNumber,
                );

                if ($fallbackTransactions->isNotEmpty()) {
                    $lines = $fallbackTransactions
                        ->map(fn ($line) => $this->decorateTransaction($line))
                        ->values()
                        ->all();
                }
            }

            [$receivable, $payable] = $this->legacyInvoiceTotals(
                $context,
                $clientCode,
                $legacyNumber,
            );

            return $this->decorateDocumentData(
                $headerData,
                $lines,
                $receivable,
                $payable,
                'Accu-Travel',
                $branchName,
                $departmentName,
                $this->legacyInvoiceProfit(
                    $context,
                    $clientCode,
                    $legacyNumber,
                    $receivable,
                    $payable,
                ),
            );
        }

        $fallbackTransactions = $this->nativeTransactionsForInvoice(
            $invoice,
            $legacyNumber,
        );
        if ($fallbackTransactions->isNotEmpty()) {
            $lines = $fallbackTransactions
                ->map(fn ($line) => $this->decorateTransaction($line))
                ->values()
                ->all();

            $receivable = (float) collect($lines)->sum(
                fn (array $line) => (float) ($line['receivable_amount'] ?? 0),
            );
            $payable = (float) collect($lines)->sum(
                fn (array $line) => (float) ($line['payable_amount'] ?? (
                    (float) ($line['vendor_amount'] ?? 0)
                    + (float) ($line['vendor_amount_2'] ?? 0)
                    + (float) ($line['vendor_amount_3'] ?? 0)
                )),
            );
            $profit = (float) collect($lines)->sum(
                fn (array $line) => (float) ($line['profit_amount'] ?? (
                    (float) ($line['receivable_amount'] ?? 0)
                    - (float) ($line['payable_amount'] ?? (
                        (float) ($line['vendor_amount'] ?? 0)
                        + (float) ($line['vendor_amount_2'] ?? 0)
                        + (float) ($line['vendor_amount_3'] ?? 0)
                    ))
                )),
            );

            return $this->decorateDocumentData(
                $this->decorateHeader($header),
                $lines,
                $receivable,
                $payable,
                'HBA ERP',
                $branchName,
                $departmentName,
                $profit,
            );
        }

        return $this->decorateDocumentData(
            $this->decorateHeader($header),
            [],
            0,
            0,
            'HBA ERP',
            $branchName,
            $departmentName,
        );
    }

    private function decorateDocumentData(
        array $header,
        array $lines,
        float $receivable,
        float $payable,
        string $dataSource,
        string $branchName,
        string $departmentName,
        ?float $profitOverride = null,
    ): array {
        $passengers = collect($lines)
            ->map(fn (array $line) => trim((string) ($line['passenger_name'] ?? '')))
            ->filter(fn (string $name) => $name !== '')
            ->unique()
            ->values()
            ->all();

        $modeTotals = collect($lines)
            ->groupBy(fn (array $line) => $this->legacyMode((string) ($line['mode'] ?? 'Other')))
            ->map(fn ($group) => round(
                $group->sum(fn (array $line) => (float) ($line['receivable_amount'] ?? 0)),
                2,
            ))
            ->all();

        $profit = round($profitOverride ?? ($receivable - $payable), 4);

        return [
            'invoice' => $header,
            'lines' => $lines,
            'summary' => [
                'receivable' => round($receivable, 4),
                'payable' => round($payable, 4),
                'profit' => $profit,
                'line_count' => count($lines),
            ],
            'passengers' => $passengers,
            'mode_totals' => $modeTotals,
            'data_source' => $dataSource,
            'branch_name' => $branchName,
            'department_name' => $departmentName,
        ];
    }

    /**
     * Create a Visa Type / Package in the local ERP master and return it so
     * the sales form can select it immediately.
     *
     * Visa types are deliberately kept in their own master table, just like
     * hotels, rather than storing a text list in the React page.
     */
    public function storeVisaType(Request $request): JsonResponse
    {
        if (!Schema::hasTable('visa_types')) {
            return response()->json([
                'message' => 'The visa_types master table does not exist. Run the latest migrations first.',
            ], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $name = trim((string) $data['name']);
        if ($name === '') {
            return response()->json([
                'message' => 'Visa type / package name is required.',
            ], 422);
        }

        $existing = DB::table('visa_types')
            ->whereRaw('LOWER(name) = LOWER(?)', [$name])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This visa type already exists.',
                'visa_type' => [
                    'id' => (int) $existing->id,
                    'name' => (string) $existing->name,
                ],
            ], 422);
        }

        try {
            $id = (int) DB::table('visa_types')->insertGetId([
                'name' => $name,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Unable to save the visa type. Please check the visa_types table.',
            ], 422);
        }

        return response()->json([
            'visa_type' => [
                'id' => $id,
                'name' => $name,
            ],
        ]);
    }

    /**
     * Create a hotel directly from the sales form.
     * The existing hotel table is inspected dynamically so this works with
     * the current ERP schema without introducing a parallel master table.
     */
    public function storeHotel(Request $request): JsonResponse
    {
        return $this->storeServiceOption(
            $request,
            'hotels',
            'hotel',
            ['name', 'hotel_name'],
            ['city', 'city_name', 'sector', 'location'],
            [],
        );
    }

    /**
     * Create a vehicle in the native vehicle master.
     *
     * The old Accu system keeps vehicle selection on InvTickets.InvVehicle and
     * the human-readable vehicle/service text in the transaction/master data.
     * Native HBA invoices use the local vehicles table so the selected value is
     * stable and editable.
     */
    public function storeVehicle(Request $request): JsonResponse
    {
        if (! Schema::hasTable('vehicles')) {
            return response()->json([
                'message' => 'The vehicles master table does not exist. Run the transfer master migration first.',
            ], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:255'],
            'vendor_account_code' => ['nullable', 'string', 'max:100', 'exists:accounts,code'],
        ]);

        $name = trim((string) $data['name']);

        $existing = DB::table('vehicles')
            ->whereRaw('LOWER(name) = LOWER(?)', [$name])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This vehicle type already exists.',
                'vehicle' => $this->decorateVehicleOption($existing),
            ]);
        }

        $payload = [
            'name' => $name,
            'registration_no' => trim((string) ($data['registration_no'] ?? '')) ?: null,
            'vendor_account_code' => trim((string) ($data['vendor_account_code'] ?? '')) ?: null,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        try {
            $id = (int) DB::table('vehicles')->insertGetId($payload);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to save the vehicle. Check the vehicles table structure.',
            ], 422);
        }

        $vehicle = DB::table('vehicles')->where('id', $id)->first();

        return response()->json([
            'vehicle' => $this->decorateVehicleOption($vehicle),
        ]);
    }

    /**
     * Create a reusable Transfer From/To location.
     */
    public function storeTransferLocation(Request $request): JsonResponse
    {
        if (! Schema::hasTable('transfer_locations')) {
            return response()->json([
                'message' => 'The transfer_locations master table does not exist. Run the transfer master migration first.',
            ], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $name = trim((string) $data['name']);
        if ($name === '') {
            return response()->json([
                'message' => 'Transfer location is required.',
            ], 422);
        }

        $existing = DB::table('transfer_locations')
            ->whereRaw('LOWER(name) = LOWER(?)', [$name])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This transfer location already exists.',
                'location' => [
                    'id' => (int) $existing->id,
                    'name' => (string) $existing->name,
                ],
            ]);
        }

        try {
            $id = (int) DB::table('transfer_locations')->insertGetId([
                'name' => $name,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to save the transfer location. Check the transfer_locations table.',
            ], 422);
        }

        return response()->json([
            'location' => [
                'id' => $id,
                'name' => $name,
            ],
        ]);
    }

    private function storeServiceOption(
        Request $request,
        string $table,
        string $key,
        array $nameCandidates,
        array $locationCandidates,
        array $registrationCandidates,
    ): JsonResponse {
        if (!Schema::hasTable($table)) {
            return response()->json([
                'message' => "The {$table} table does not exist.",
            ], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:255'],
            'vendor_account_code' => [
                'nullable',
                'string',
                'max:100',
                'exists:accounts,code',
            ],
        ]);

        $columns = Schema::getColumnListing($table);

        $idColumn = $this->firstExisting(
            $columns,
            ['id', $table === 'hotels' ? 'hotel_id' : 'vehicle_id'],
        );
        $nameColumn = $this->firstExisting($columns, $nameCandidates);

        if ($idColumn === null || $nameColumn === null) {
            return response()->json([
                'message' => "The {$table} table does not expose a supported ID/name structure.",
            ], 422);
        }

        $payload = [
            $nameColumn => trim((string) $data['name']),
        ];

        $locationColumn = $this->firstExisting(
            $columns,
            $locationCandidates,
        );

        if ($locationColumn !== null && !empty($data['city'])) {
            $payload[$locationColumn] = trim((string) $data['city']);
        }

        $vendorColumn = $this->firstExisting(
            $columns,
            ['vendor_account_code', 'vendor_code', 'payable_account_code'],
        );

        if ($vendorColumn !== null && !empty($data['vendor_account_code'])) {
            $payload[$vendorColumn] = trim(
                (string) $data['vendor_account_code']
            );
        }

        $registrationColumn = $this->firstExisting(
            $columns,
            $registrationCandidates,
        );

        if (
            $registrationColumn !== null
            && !empty($data['registration_no'])
        ) {
            $payload[$registrationColumn] = trim(
                (string) $data['registration_no']
            );
        }

        $activeColumn = $this->firstExisting(
            $columns,
            ['is_active', 'active'],
        );

        if ($activeColumn !== null) {
            $payload[$activeColumn] = 1;
        }

        if (in_array('created_at', $columns, true)) {
            $payload['created_at'] = now();
        }

        if (in_array('updated_at', $columns, true)) {
            $payload['updated_at'] = now();
        }

        try {
            $id = (int) DB::table($table)->insertGetId($payload);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => "Unable to create this {$key}. Check the {$table} table's required fields.",
            ], 422);
        }

        $option = DB::table($table)
            ->where($idColumn, $id)
            ->first();

        if (!$option) {
            return response()->json([
                'message' => "The {$key} was created but could not be reloaded.",
            ], 500);
        }

        $result = [
            'id' => (int) $id,
            'name' => (string) ($option->{$nameColumn} ?? ''),
        ];

        foreach (
            [
                'vendor_account_code',
                'vendor_code',
                'payable_account_code',
                'city',
                'city_name',
                'sector',
                'location',
                'registration_no',
                'reg_no',
                'vehicle_no',
                'plate_no',
                'service_type',
            ] as $column
        ) {
            if (property_exists($option, $column)) {
                $result[$column] = $option->{$column};
            }
        }

        return response()->json([
            $key => $result,
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('Sales/Form', [
            'formMode' => 'create',
            'invoice' => null,
            'lines' => [$this->blankLine()],
            'master' => $this->masterData(),
            'modes' => self::MODES,
            'statuses' => self::STATUSES,
        ]);
    }

    public function show(int $invoice): InertiaResponse
    {
        $header = DB::table('invoices as i')
            ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
            ->select([
                'i.*',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->where('i.id', $invoice)
            ->first();

        abort_unless($header, 404);

        $legacyNumber = (int) $header->legacy_invoice_id;
        $transactions = $this->isNativeInvoice($invoice)
            ? $this->nativeTransactionsForInvoice($invoice, $legacyNumber)
            : collect();

        if ($transactions->isNotEmpty()) {
            $lines = $transactions
                ->map(fn ($line) => $this->decorateTransaction($line))
                ->values()
                ->all();

            $receivable = collect($lines)->sum(fn (array $line) => (float) ($line['receivable_amount'] ?? 0));
            $payable = collect($lines)->sum(fn (array $line) => (float) ($line['payable_amount'] ?? (
                (float) ($line['vendor_amount'] ?? 0)
                + (float) ($line['vendor_amount_2'] ?? 0)
                + (float) ($line['vendor_amount_3'] ?? 0)
            )));

            return Inertia::render('Sales/Show', $this->sanitizeUtf8([
                'invoice' => $this->decorateHeader($header),
                'lines' => $lines,
                'summary' => [
                    'receivable' => round($receivable, 4),
                    'payable' => round($payable, 4),
                    // Native HBA invoices do not have a legacy context. Their
                    // profit belongs to the native transaction rows, so never
                    // call legacyInvoiceProfit() from this branch.
                    'profit' => round(collect($lines)->sum(
                        fn (array $line) => (float) ($line['profit_amount'] ?? (
                            (float) ($line['receivable_amount'] ?? 0)
                            - (float) ($line['payable_amount'] ?? (
                                (float) ($line['vendor_amount'] ?? 0)
                                + (float) ($line['vendor_amount_2'] ?? 0)
                                + (float) ($line['vendor_amount_3'] ?? 0)
                            ))
                        )),
                    ), 4),
                    'line_count' => count($lines),
                ],
                'readOnly' => false,
                'dataSource' => 'HBA ERP',
                'master' => $this->masterData(
                    (int) $header->client_account_id,
                    $transactions->pluck('payable_account_code')->filter()->all(),
                ),
            ]));
        }

        $legacy = $this->loadLegacyInvoiceContext([$legacyNumber]);
        $context = $legacy[(string) $legacyNumber] ?? null;

        if (
            $context !== null
            && (
                ($context['legacy_invoice'] ?? null) !== null
                || !empty($context['tickets'])
                || !empty($context['master'])
            )
        ) {
            $headerData = $this->decorateHeader($header);
            $legacyInvoice = $context['legacy_invoice'] ?? null;

            if ($legacyInvoice !== null) {
                $headerData = $this->mergeLegacyInvoiceHeader($headerData, $legacyInvoice);
            }

            $clientCode = $this->resolveLegacyClientCode(
                $context,
                (string) ($headerData['client_code'] ?? ''),
            );
            $headerData['client_code'] = $clientCode;
            if ($clientCode !== '') {
                $clientAccountName = DB::table('accounts')->where('code', $clientCode)->value('name');
                if ($clientAccountName) {
                    $headerData['client_name'] = (string) $clientAccountName;
                }
            }

            $lines = collect($context['tickets'])
                ->map(function ($ticket) use ($context, $clientCode, $legacyNumber): array {
                    $masterRows = $this->legacyMasterRowsForTicket(
                        $context,
                        $ticket,
                    );

                    return $this->decorateLegacyTransaction(
                        $ticket,
                        $masterRows,
                        $clientCode,
                        $legacyNumber,
                    );
                })
                ->values()
                ->all();

            /*
             * Some imported historical invoices have no legacy ticket rows,
             * while normalized invoice_transactions contains the imported
             * transaction details. Use those rows for DISPLAY only.
             *
             * Financial totals below remain authoritative legacy totals and
             * the invoice remains read-only.
             */
            if ($lines === []) {
                $fallbackTransactions = $this->nativeTransactionsForInvoice(
                    $invoice,
                    $legacyNumber,
                );

                if ($fallbackTransactions->isNotEmpty()) {
                    $lines = $fallbackTransactions
                        ->map(fn ($line) => $this->decorateTransaction($line))
                        ->values()
                        ->all();
                }
            }

            [$receivable, $payable] = $this->legacyInvoiceTotals(
                $context,
                $clientCode,
                $legacyNumber,
            );

            return Inertia::render('Sales/Show', $this->sanitizeUtf8([
                'invoice' => $headerData,
                'lines' => $lines,
                'summary' => [
                    'receivable' => round($receivable, 4),
                    'payable' => round($payable, 4),
                    'profit' => round($receivable - $payable, 4),
                    'line_count' => count($lines),
                ],
                'readOnly' => true,
                'dataSource' => 'Accu-Travel',
                'master' => $this->masterData(
                    (int) $header->client_account_id,
                    collect($lines)->pluck('payable_account_code')->filter()->all(),
                ),
            ]));
        }

        $fallbackTransactions = $this->nativeTransactionsForInvoice(
            $invoice,
            $legacyNumber,
        );
        if ($fallbackTransactions->isNotEmpty()) {
            $lines = $fallbackTransactions
                ->map(fn ($line) => $this->decorateTransaction($line))
                ->values()
                ->all();

            $receivable = (float) collect($lines)->sum(
                fn (array $line) => (float) ($line['receivable_amount'] ?? 0),
            );
            $payable = (float) collect($lines)->sum(
                fn (array $line) => (float) ($line['payable_amount'] ?? (
                    (float) ($line['vendor_amount'] ?? 0)
                    + (float) ($line['vendor_amount_2'] ?? 0)
                    + (float) ($line['vendor_amount_3'] ?? 0)
                )),
            );

            return Inertia::render('Sales/Show', $this->sanitizeUtf8([
                'invoice' => $this->decorateHeader($header),
                'lines' => $lines,
                'summary' => [
                    'receivable' => round($receivable, 4),
                    'payable' => round($payable, 4),
                    'profit' => round($receivable - $payable, 4),
                    'line_count' => count($lines),
                ],
                'readOnly' => false,
                'dataSource' => 'HBA ERP',
                'master' => $this->masterData(
                    (int) $header->client_account_id,
                    $fallbackTransactions->pluck('payable_account_code')->filter()->all(),
                ),
            ]));
        }

        return Inertia::render('Sales/Show', $this->sanitizeUtf8([
            'invoice' => $this->decorateHeader($header),
            'lines' => [],
            'summary' => [
                'receivable' => 0,
                'payable' => 0,
                'profit' => 0,
                'line_count' => 0,
            ],
            'readOnly' => false,
            'dataSource' => 'HBA ERP',
            'master' => $this->masterData((int) $header->client_account_id),
        ]));
    }

    public function edit(int $invoice): InertiaResponse|RedirectResponse
    {
        $header = DB::table('invoices as i')
            ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
            ->select([
                'i.*',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->where('i.id', $invoice)
            ->first();

        abort_unless($header, 404);

        // Native HBA rows are authoritative for editable invoices. Only inspect
        // the legacy archive when no native transaction belongs to this invoice.
        $transactions = $this->isNativeInvoice($invoice)
            ? $this->nativeTransactionsForInvoice(
                $invoice,
                (int) $header->legacy_invoice_id,
            )
            : collect();

        if ($transactions->isEmpty()) {
            $legacy = $this->loadLegacyInvoiceContext([(int) $header->legacy_invoice_id]);
            $context = $legacy[(string) ((int) $header->legacy_invoice_id)] ?? null;

            if (
                $context !== null
                && (
                    ($context['legacy_invoice'] ?? null) !== null
                    || !empty($context['tickets'])
                    || !empty($context['master'])
                )
            ) {
                return to_route('invoices.show', ['invoice' => $invoice]);
            }

            $transactions = $this->nativeTransactionsForInvoice(
                $invoice,
                (int) $header->legacy_invoice_id,
            );
        }

        $lines = $transactions->map(fn ($line) => $this->decorateTransaction($line))->values()->all();
        if ($lines === []) {
            $lines = [$this->blankLine()];
        }

        return Inertia::render('Sales/Form', [
            'formMode' => 'edit',
            'invoice' => $this->decorateHeader($header),
            'lines' => $lines,
            'master' => $this->masterData(
                (int) $header->client_account_id,
                $transactions->pluck('payable_account_code')->filter()->all(),
            ),
            'modes' => self::MODES,
            'statuses' => self::STATUSES,
        ]);
    }


    public function addHotelLineFromWhatsApp(
    Request $request,
    int $invoice
): JsonResponse {
    /*
     * ----------------------------------------------------------
     * Load and lock the existing invoice.
     * ----------------------------------------------------------
     */
    $existing =
        DB::table('invoices')
            ->where(
                'id',
                $invoice
            )
            ->lockForUpdate()
            ->first();

    abort_unless(
        $existing,
        404,
        'Invoice not found.'
    );

    /*
     * ----------------------------------------------------------
     * Only native HBA invoices can be modified.
     *
     * Historical Accu invoices remain read-only.
     * This matches the normal web update behavior.
     * ----------------------------------------------------------
     */
    $existingNativeTransactions =
        $this->nativeTransactionsForInvoice(
            $invoice,
            (int) $existing->legacy_invoice_id
        );

    if (
        $existingNativeTransactions->isEmpty()
    ) {
        $legacy =
            $this->loadLegacyInvoiceContext([
                (int) $existing->legacy_invoice_id,
            ]);

        $legacyContext =
            $legacy[
                (string) (
                    (int)
                    $existing->legacy_invoice_id
                )
            ] ?? null;

        if (
            $legacyContext !== null
            && (
                ($legacyContext['legacy_invoice'] ?? null)
                    !== null
                || ! empty(
                    $legacyContext['tickets']
                )
                || ! empty(
                    $legacyContext['master']
                )
            )
        ) {
            abort(
                409,
                'Historical Accu-Travel invoices are read-only.'
            );
        }

        abort(
            409,
            'This invoice has no editable native invoice lines.'
        );
    }

    /*
     * ----------------------------------------------------------
     * Existing client remains unchanged.
     * ----------------------------------------------------------
     */
    $client =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'id',
                (int) $existing->client_account_id
            )
            ->first();

    $this->assertAccountType(
        $client,
        'client'
    );

    /*
     * ----------------------------------------------------------
     * Read new Hotel line.
     * ----------------------------------------------------------
     */
    $passengerName =
        trim(
            (string)
            $request->input(
                'passenger_name'
            )
        );

    $hotelName =
        trim(
            (string)
            $request->input(
                'hotel_name'
            )
        );

    $roomType =
        trim(
            (string)
            $request->input(
                'room_type'
            )
        );

    $meal =
        trim(
            (string)
            $request->input(
                'meal'
            )
        );

    $checkIn =
        trim(
            (string)
            $request->input(
                'check_in'
            )
        );

    $checkOut =
        trim(
            (string)
            $request->input(
                'check_out'
            )
        );

    $nights =
        (int)
        $request->input(
            'nights',
            0
        );

    $roomQuantity =
        max(
            (int)
            $request->input(
                'room_quantity',
                1
            ),
            1
        );

    /*
     * Hotel WhatsApp input may be BASE or SAR.
     * When SAR is supplied, every entered monetary amount
     * is converted to BASE using the supplied ROE.
     */
    $currencyCode =
        strtoupper(
            trim(
                (string)
                $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $saleRate =
        round(
            (float)
            $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorRate =
        round(
            (float)
            $request->input(
                'vendor_rate',
                0
            ),
            4
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float)
                $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    if (
        $passengerName === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger name is required.',
        ], 422);
    }

    if (
        $hotelName === ''
    ) {
        return response()->json([
            'message' =>
                'Hotel name is required.',
        ], 422);
    }

    if (
        $roomType === ''
    ) {
        return response()->json([
            'message' =>
                'Room type is required.',
        ], 422);
    }

    if (
        $meal === ''
    ) {
        return response()->json([
            'message' =>
                'Meal is required.',
        ], 422);
    }

    if (
        $checkIn === ''
    ) {
        return response()->json([
            'message' =>
                'Check-in date is required.',
        ], 422);
    }

    if (
        $checkOut === ''
        || $nights <= 0
    ) {
        return response()->json([
            'message' =>
                'A valid positive number of nights or checkout date is required.',
        ], 422);
    }

    if (
        $roomQuantity <= 0
    ) {
        return response()->json([
            'message' =>
                'Room quantity must be greater than zero.',
        ], 422);
    }

    if (
        $saleRate <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/night must be greater than zero.',
        ], 422);
    }

    if (
        $vendorRate < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor rate/night cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp Hotel command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }

    /*
     * ----------------------------------------------------------
     * Resolve Vendor.
     *
     * WhatsApp sends only the last 3 digits.
     * ----------------------------------------------------------
     */
    $vendorSuffix =
        trim(
            (string)
            $request->input(
                'vendor_suffix'
            )
        );

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    $saleRateBase =
        $saleRate;

    $vendorRateBase =
        $vendorRate;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRate *
                $currencyRate,
                4
            );

        $vendorRateBase =
            round(
                $vendorRate *
                $currencyRate,
                4
            );
    }

    $preferredVendorCode =
        '2100' .
        $vendorSuffix;

    $vendor =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                $preferredVendorCode
            )
            ->first();

    if (
        ! $vendor
    ) {
        $vendorMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '21%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $vendorSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $vendorMatches->count() ===
            0
        ) {
            return response()->json([
                'message' =>
                    "Vendor account ending in {$vendorSuffix} was not found.",
            ], 404);
        }

        if (
            $vendorMatches->count() >
            1
        ) {
            return response()->json([
                'message' =>
                    "Multiple vendor accounts end in {$vendorSuffix}.",
            ], 409);
        }

        $vendor =
            $vendorMatches->first();
    }

    $this->assertAccountType(
        $vendor,
        'vendor'
    );

    /*
     * ----------------------------------------------------------
     * Add the line inside one DB transaction.
     * ----------------------------------------------------------
     */
    DB::transaction(
        function () use (
            $request,
            $existing,
            $existingNativeTransactions,
            $client,
            $vendor,
            $hotelName,
            $passengerName,
            $roomType,
            $meal,
            $checkIn,
            $checkOut,
            $nights,
            $roomQuantity,
            $saleRateBase,
            $vendorRateBase,
            $currencyCode,
            $currencyRate,
            $invoice
        ): void {

            /*
             * Resolve existing Hotel or create it.
             *
             * Same Hotel master logic used by NEW INV.
             */
            $hotel =
                $this->resolveOrCreateWhatsAppHotel(
                    $hotelName,
                    (string) $vendor->code
                );

            /*
             * Existing native lines are converted to the same
             * shape used by the web Edit Invoice form.
             */
            $lines =
                $existingNativeTransactions
                    ->map(
                        fn ($line) =>
                            $this->decorateTransaction(
                                $line
                            )
                    )
                    ->values()
                    ->all();

            /*
             * --------------------------------------------------
             * New Hotel line.
             * --------------------------------------------------
             */
            $line =
                $this->blankLine();

            $units =
                $nights *
                $roomQuantity;

            $sellingTotal =
                round(
                    $saleRateBase *
                    $units,
                    4
                );

            $vendorTotal =
                round(
                    $vendorRateBase *
                    $units,
                    4
                );

            /*
             * Use the normal ERP Hotel line structure.
             */
            $line =
                array_merge(
                    $line,
                    [
                        'mode' =>
                            'Hotel',

                        'type' =>
                            'Normal',

                        'passenger_name' =>
                            $passengerName,

                        'passenger_type' =>
                            'Adult',

                        'hotel_name' =>
                            (string) (
                                $hotel['name']
                                ?? $hotelName
                            ),

                        'hotel_id' =>
                            $hotel['hotel_id'],

                        'legacy_hotel_id' =>
                            $hotel[
                                'legacy_hotel_id'
                            ],

                        'sector' =>
                            (string) (
                                $hotel['city']
                                ?? ''
                            ),

                        'room_type' =>
                            $roomType,

                        'meal' =>
                            $meal,

                        'room_quantity' =>
                            $roomQuantity,

                        'quantity' =>
                            1,

                        'nights' =>
                            $nights,

                        /*
                         * Keep the same rate semantics
                         * already used by NEW INV.
                         */
                        'rate' =>
                            $saleRateBase,

                        'receivable_amount' =>
                            $sellingTotal,

                        'payable_account_code' =>
                            (string) $vendor->code,

                        'vendor_rate_per_night' =>
                            $vendorRateBase,

                        'vendor_amount' =>
                            $vendorTotal,

                        'vendor_amount_2' =>
                            0,

                        'vendor_amount_3' =>
                            0,

                        'starting_date' =>
                            $checkIn,

                        'ending_date' =>
                            $checkOut,

                        /*
                         * Commission remains empty/zero.
                         */
                        'agent_code' =>
                            '',

                        'agent_amount' =>
                            0,

                        'commission_receivable' =>
                            0,

                        'commission_paid' =>
                            0,

                        'commission_to_client' =>
                            0,

                        'currency_code' =>
                            $currencyCode !== ''
                                ? $currencyCode
                                : null,

                        'currency_quantity' =>
                            $currencyCode !== ''
                                ? $units
                                : null,

                        'currency_rate' =>
                            $currencyCode !== ''
                                ? $currencyRate
                                : null,

                        'confirm_no' =>
                            '',

                        'room_no' =>
                            '',

                        'internal_ref_no' =>
                            '',

                        'particulars_2' =>
                            '',

                        'particulars_3' =>
                            '',
                    ]
                );

            $lines[] =
                $line;

            /*
             * --------------------------------------------------
             * Reuse the exact invoice validation/calculation
             * engine used by the native web invoice.
             * --------------------------------------------------
             */
            $request->merge([
                'invoice_date' =>
                    $existing->invoice_date,

                'ref_no' =>
                    $existing->ref_no,

                'branch_id' =>
                    (int)
                    $existing->branch_id,

                'department_id' =>
                    (int)
                    $existing->department_id,

                'client_account_id' =>
                    (int)
                    $existing->client_account_id,

                'employee' =>
                    $existing->employee,

                'sales_tax_invoice_no' =>
                    $existing->sales_tax_invoice_no,

                'payment_terms' =>
                    $existing->payment_terms,

                'due_date' =>
                    $existing->due_date,

                'due_date_vendor' =>
                    $existing->due_date_vendor,

                'ticket_query_id' =>
                    $existing->ticket_query_id,

                'umrah_query_id' =>
                    $existing->umrah_query_id,

                'remarks' =>
                    $existing->remarks,

                'supervised' =>
                    (bool)
                    $existing->supervised,

                'is_active' =>
                    (bool)
                    $existing->is_active,

                /*
                 * IMPORTANT:
                 * Keep the existing invoice status.
                 */
                'status' =>
                    trim(
                        (string)
                        (
                            $existing->status
                            ?? ''
                        )
                    ) !== ''
                        ? $existing->status
                        : 'Definite / Non Refundable',

                'lines' =>
                    $lines,
            ]);

            $data =
                $this->validateInvoice(
                    $request
                );

            /*
             * --------------------------------------------------
             * Keep the original invoice number.
             *
             * We are adding a line to the current invoice,
             * not creating another invoice.
             * --------------------------------------------------
             */
            $invoiceNumber =
                (int)
                $existing->legacy_invoice_id;

            $createdBy =
                $existing->created_by
                    ? (int)
                        $existing->created_by
                    : $request
                        ->user()
                        ->id;

            /*
             * Rebuild the existing invoice's normalized
             * transactions + journal using ALL lines.
             *
             * This is the same engine used by Update Invoice.
             */
            $this->replaceTransactionsAndJournal(
                $invoice,
                $invoiceNumber,
                $data,
                $client,
                $createdBy,
                $request
                    ->user()
                    ->name,
            );

            /*
             * Safety check.
             */
            $savedLineCount =
                DB::table(
                    'invoice_transactions'
                )
                    ->where(
                        'invoice_id',
                        $invoice
                    )
                    ->count();

            if (
                $savedLineCount !==
                count(
                    $data['lines']
                )
            ) {
                throw new \RuntimeException(
                    'Invoice lines were not saved correctly. Expected '
                    . count($data['lines'])
                    . ' but saved '
                    . $savedLineCount
                    . '.'
                );
            }
        }
    );

    /*
     * ----------------------------------------------------------
     * Reload summary.
     * ----------------------------------------------------------
     */
    $lineCount =
        (int)
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoice
            )
            ->count();

    $totals =
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoice
            )
            ->selectRaw(
                'COALESCE(SUM(total_fare), 0) AS receivable'
            )
            ->selectRaw(
                'COALESCE(SUM(COALESCE(rate_vendor, vendor_rate, 0) + COALESCE(fare_2, 0) + COALESCE(fare_3, 0)), 0) AS payable'
            )
            ->first();

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                $invoice,

            'invoice_number' =>
                (string)
                $existing->legacy_invoice_id,

            'client_code' =>
                (string)
                $client->code,

            'client_name' =>
                (string)
                $client->name,

            'line_count' =>
                $lineCount,

            'total_receivable' =>
                round(
                    (float)
                    (
                        $totals->receivable
                        ?? 0
                    ),
                    4
                ),

            'total_payable' =>
                round(
                    (float)
                    (
                        $totals->payable
                        ?? 0
                    ),
                    4
                ),

            'added_line' => [
                'mode' =>
                    'Hotel',

                'passenger_name' =>
                    $passengerName,

                'hotel_name' =>
                    $hotelName,

                'check_in' =>
                    $checkIn,

                'check_out' =>
                    $checkOut,

                'nights' =>
                    $nights,

                'room_quantity' =>
                    $roomQuantity,

                'rate' =>
                    $saleRate,

                'vendor_code' =>
                    $vendorSuffix,

                'vendor_rate' =>
                    $vendorRate,

                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,

                'currency_rate' =>
                    $currencyCode !== ''
                        ? $currencyRate
                        : null,
            ],
        ],
    ]);
}
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateInvoice($request);

        $invoiceId = DB::transaction(function () use ($data, $request): int {
            $invoiceNumber = $this->nextInvoiceNumber();

            $client = DB::table('accounts')
                ->select('id', 'code', 'name')
                ->where('id', $data['client_account_id'])
                ->first();

            $this->assertAccountType($client, 'client');

            $invoiceId = (int) DB::table('invoices')->insertGetId([
                'legacy_invoice_id' => $invoiceNumber,
                'invoice_date' => $data['invoice_date'],
                'ref_no' => $data['ref_no'] ?: null,
                'client_account_id' => (int) $client->id,
                'created_by' => $request->user()->id,
                'legacy_entered_by' => $request->user()->name,
                'date_time' => now(),
                'inv_entry_date' => now(),
                'employee' => $data['employee'] ?: null,
                'supervised' => $data['supervised'] ? 1 : 0,
                'sales_tax_invoice_no' => $data['sales_tax_invoice_no'] ?: null,
                'payment_terms' => $data['payment_terms'] ?: null,
                'due_date' => $data['due_date'] ?: null,
                'ticket_query_id' => $data['ticket_query_id'] ?: null,
                'remarks' => $data['remarks'] ?: null,
                'branch_id' => $data['branch_id'],
                'department_id' => $data['department_id'],
                'status' => $data['status'],
                'is_selected' => 0,
                'is_active' => $data['is_active'] ? 1 : 0,
                'due_date_vendor' => $data['due_date_vendor'] ?: null,
                'invoice_type' => 'Normal',
                'shirka' => null,
                'umrah_query_id' => $data['umrah_query_id'] ?: null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->replaceTransactionsAndJournal(
                $invoiceId,
                $invoiceNumber,
                $data,
                $client,
                $request->user()->id,
                $request->user()->name,
            );

            $savedLineCount = DB::table('invoice_transactions')
                ->where('invoice_id', $invoiceId)
                ->count();

            if ($savedLineCount !== count($data['lines'])) {
                throw new \RuntimeException(
                    'Invoice lines were not saved. Expected '
                    . count($data['lines'])
                    . ' but saved '
                    . $savedLineCount
                    . '.'
                );
            }

            return $invoiceId;
        });

        return to_route('invoices.edit', ['invoice' => $invoiceId])
            ->with('success', 'Invoice created successfully.')
            ->with('invoice_created', true);
    }


    /**
 * Create a native Hotel invoice from the WhatsApp bot.
 *
 * The WhatsApp bot supplies the first Hotel line together with
 * the client/header information. This method deliberately reuses
 * the existing InvoiceController validation and transaction/journal
 * generation so WhatsApp invoices behave exactly like web invoices.
 */
public function storeFromWhatsAppHotel(
    Request $request
): JsonResponse {
    $clientSuffix =
        trim(
            (string) $request->input(
                'client_suffix'
            )
        );

    $vendorSuffix =
        trim(
            (string) $request->input(
                'vendor_suffix'
            )
        );

    if (
        ! preg_match(
            '/^\d{3}$/',
            $clientSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Client code must be the last 3 digits of the client account.',
        ], 422);
    }

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    $passengerName =
        trim(
            (string) $request->input(
                'passenger_name'
            )
        );

    $hotelName =
        trim(
            (string) $request->input(
                'hotel_name'
            )
        );

    $roomType =
        trim(
            (string) $request->input(
                'room_type'
            )
        );

    $meal =
        trim(
            (string) $request->input(
                'meal'
            )
        );

    $checkIn =
        trim(
            (string) $request->input(
                'check_in'
            )
        );

    $checkOut =
        trim(
            (string) $request->input(
                'check_out'
            )
        );

    $nights =
        (int) $request->input(
            'nights',
            0
        );

    $roomQuantity =
        max(
            (int) $request->input(
                'room_quantity',
                1
            ),
            1
        );

    /*
     * IMPORTANT:
     *
     * WhatsApp Hotel rate input is treated as the
     * rate entered by the user.
     *
     * When currency_code = SAR:
     *   rate         = SAR rate/night
     *   vendor_rate  = SAR buy rate/night
     *   currency_rate = SAR -> BASE ROE
     *
     * The normalized ERP invoice_transactions table,
     * however, stores rate/vendor_rate in BASE currency.
     *
     * Therefore:
     *
     *   BASE rate = SAR rate × ROE
     *
     * This keeps the accounting model consistent with
     * the existing invoice engine and allows the PDF
     * renderer to recover the original SAR rate with:
     *
     *   BASE rate / ROE = SAR rate
     */

    $saleRateInput =
        round(
            (float) $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorRateInput =
        round(
            (float) $request->input(
                'vendor_rate',
                0
            ),
            4
        );

    $currencyCode =
        strtoupper(
            trim(
                (string) $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float) $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    if (
        $passengerName === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger name is required.',
        ], 422);
    }

    if (
        $hotelName === ''
    ) {
        return response()->json([
            'message' =>
                'Hotel name is required.',
        ], 422);
    }

    if (
        $roomType === ''
    ) {
        return response()->json([
            'message' =>
                'Room type is required.',
        ], 422);
    }

    if (
        $meal === ''
    ) {
        return response()->json([
            'message' =>
                'Meal is required.',
        ], 422);
    }

    if (
        $checkIn === ''
    ) {
        return response()->json([
            'message' =>
                'Check-in date is required.',
        ], 422);
    }

    if (
        $checkOut === ''
        || $nights <= 0
    ) {
        return response()->json([
            'message' =>
                'A valid positive number of nights or a checkout date is required.',
        ], 422);
    }

    if (
        $saleRateInput <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/night must be greater than zero.',
        ], 422);
    }

    if (
        $vendorRateInput < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor rate/night cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp Hotel command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }

    /*
     * ------------------------------------------------------
     * Convert foreign input into BASE ERP values
     * ------------------------------------------------------
     *
     * Example:
     *
     * SAR rate       = 1,250
     * ROE            = 76.5
     *
     * BASE rate      = 1,250 × 76.5
     *                = 95,625
     *
     * PDF later does:
     *
     * 95,625 / 76.5 = 1,250 SAR
     *
     * This is the key fix.
     */

    $saleRateBase =
        $saleRateInput;

    $vendorRateBase =
        $vendorRateInput;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRateInput *
                $currencyRate,
                4
            );

        $vendorRateBase =
            round(
                $vendorRateInput *
                $currencyRate,
                4
            );
    }

    /*
     * Preferred codes for the current 7-digit ERP structure.
     *
     * Example:
     *
     * 052 -> 1200052
     * 032 -> 2100032
     */
    $preferredClientCode =
        '1200' .
        $clientSuffix;

    $preferredVendorCode =
        '2100' .
        $vendorSuffix;

    /*
     * ------------------------------------------------------
     * Resolve client
     * ------------------------------------------------------
     */

    $client =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                $preferredClientCode
            )
            ->first();

    if (
        ! $client
    ) {
        $clientMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '12%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $clientSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $clientMatches->count() ===
            0
        ) {
            return response()->json([
                'message' =>
                    "Client account ending in {$clientSuffix} was not found.",
            ], 404);
        }

        if (
            $clientMatches->count() >
            1
        ) {
            return response()->json([
                'message' =>
                    "Multiple client accounts end in {$clientSuffix}.",
            ], 409);
        }

        $client =
            $clientMatches->first();
    }

    $this->assertAccountType(
        $client,
        'client'
    );

    /*
     * ------------------------------------------------------
     * Resolve vendor
     * ------------------------------------------------------
     */

    $vendor =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                $preferredVendorCode
            )
            ->first();

    if (
        ! $vendor
    ) {
        $vendorMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '21%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $vendorSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $vendorMatches->count() ===
            0
        ) {
            return response()->json([
                'message' =>
                    "Vendor account ending in {$vendorSuffix} was not found.",
            ], 404);
        }

        if (
            $vendorMatches->count() >
            1
        ) {
            return response()->json([
                'message' =>
                    "Multiple vendor accounts end in {$vendorSuffix}.",
            ], 409);
        }

        $vendor =
            $vendorMatches->first();
    }

    /*
     * ------------------------------------------------------
     * Build inside one DB transaction.
     *
     * If Hotel creation or Invoice creation fails,
     * neither should be left partially saved.
     * ------------------------------------------------------
     */

    $invoiceId =
        DB::transaction(
            function () use (
                $request,
                $client,
                $vendor,
                $hotelName,
                $passengerName,
                $roomType,
                $meal,
                $checkIn,
                $checkOut,
                $nights,
                $roomQuantity,
                $saleRateBase,
                $vendorRateBase,
                $currencyCode,
                $currencyRate
            ): int {

                /*
                 * Resolve existing hotel or create it.
                 */
                $hotel =
                    $this->resolveOrCreateWhatsAppHotel(
                        $hotelName,
                        (string) $vendor->code
                    );

                /*
                 * Existing blankLine() gives us all of the
                 * same fields/defaults used by the web invoice.
                 */
                $line =
                    $this->blankLine();

                $units =
                    $nights *
                    $roomQuantity;

                /*
                 * IMPORTANT:
                 *
                 * rate and vendor_rate below are BASE values.
                 */
                $sellingTotal =
                    round(
                        $saleRateBase *
                        $units,
                        4
                    );

                $vendorTotal =
                    round(
                        $vendorRateBase *
                        $units,
                        4
                    );

                /*
                 * Existing blankLine uses 4200003 as the
                 * default income/service account.
                 */
                $defaultIncome =
                    trim(
                        (string) (
                            $line[
                                'revenue_account_code'
                            ] ?? ''
                        )
                    );

                if (
                    $defaultIncome === ''
                ) {
                    throw ValidationException::withMessages([
                        'revenue_account_code' =>
                            'Default Hotel revenue account 4200003 was not found.',
                    ]);
                }

                $line =
                    array_merge(
                        $line,
                        [
                            'mode' =>
                                'Hotel',

                            'type' =>
                                'Normal',

                            'passenger_name' =>
                                $passengerName,

                            'passenger_type' =>
                                'Adult',

                            'hotel_name' =>
                                (string) (
                                    $hotel['name']
                                    ?? $hotelName
                                ),

                            'hotel_id' =>
                                $hotel['hotel_id'],

                            'legacy_hotel_id' =>
                                $hotel[
                                    'legacy_hotel_id'
                                ],

                            'sector' =>
                                (string) (
                                    $hotel['city']
                                    ?? ''
                                ),

                            'room_type' =>
                                $roomType,

                            'meal' =>
                                $meal,

                            'room_quantity' =>
                                $roomQuantity,

                            'quantity' =>
                                1,

                            'nights' =>
                                $nights,

                            /*
                             * BASE ERP rate.
                             */
                            'rate' =>
                                $saleRateBase,

                            /*
                             * BASE ERP receivable total.
                             */
                            'receivable_amount' =>
                                $sellingTotal,

                            'payable_account_code' =>
                                (string) $vendor->code,

                            /*
                             * BASE ERP vendor rate/night.
                             */
                            'vendor_rate_per_night' =>
                                $vendorRateBase,

                            /*
                             * BASE ERP vendor total.
                             */
                            'vendor_amount' =>
                                $vendorTotal,

                            'vendor_amount_2' =>
                                0,

                            'vendor_amount_3' =>
                                0,

                            'starting_date' =>
                                $checkIn,

                            'ending_date' =>
                                $checkOut,

                            /*
                             * No commission in this first version.
                             */
                            'agent_code' =>
                                '',

                            'agent_amount' =>
                                0,

                            'commission_receivable' =>
                                0,

                            'commission_paid' =>
                                0,

                            'commission_to_client' =>
                                0,

                            /*
                             * Foreign currency metadata.
                             *
                             * The actual financial rate fields above
                             * are BASE values. These fields preserve
                             * the SAR + ROE information needed for
                             * foreign-currency display.
                             */
                            'currency_code' =>
                                $currencyCode !== ''
                                    ? $currencyCode
                                    : null,

                            'currency_quantity' =>
                                $currencyCode !== ''
                                    ? $units
                                    : null,

                            'currency_rate' =>
                                $currencyCode !== ''
                                    ? $currencyRate
                                    : null,

                            'confirm_no' =>
                                '',

                            'room_no' =>
                                '',

                            'internal_ref_no' =>
                                '',

                            'particulars_2' =>
                                '',

                            'particulars_3' =>
                                '',
                        ]
                    );

                /*
                 * Prepare the exact standard InvoiceController
                 * request structure.
                 */
                $request->merge([
                    'invoice_date' =>
                        now()->toDateString(),

                    'ref_no' =>
                        null,

                    'branch_id' =>
                        DB::table('branches')
                            ->orderBy('name')
                            ->value('id'),

                    'department_id' =>
                        DB::table('departments')
                            ->orderBy('name')
                            ->value('id'),

                    'client_account_id' =>
                        (int) $client->id,

                    'employee' =>
                        null,

                    'sales_tax_invoice_no' =>
                        null,

                    'payment_terms' =>
                        null,

                    'due_date' =>
                        now()->toDateString(),

                    'due_date_vendor' =>
                        now()->toDateString(),

                    'ticket_query_id' =>
                        null,

                    'umrah_query_id' =>
                        null,

                    'remarks' =>
                        null,

                    'supervised' =>
                        false,

                    'is_active' =>
                        true,

                    /*
                     * WhatsApp Hotel invoice should be
                     * definite / non-refundable, not tentative.
                     */
                    'status' =>
                        'Definite / Non Refundable',

                    'lines' =>
                        [$line],
                ]);

                /*
                 * Run the existing InvoiceController validation.
                 */
                $data =
                    $this->validateInvoice(
                        $request
                    );

                $invoiceNumber =
                    $this->nextInvoiceNumber();

                $invoiceId =
                    (int) DB::table('invoices')
                        ->insertGetId([
                            'legacy_invoice_id' =>
                                $invoiceNumber,

                            'invoice_date' =>
                                $data['invoice_date'],

                            'ref_no' =>
                                $data['ref_no']
                                    ?: null,

                            'client_account_id' =>
                                (int)
                                $client->id,

                            'created_by' =>
                                $request
                                    ->user()
                                    ->id,

                            'legacy_entered_by' =>
                                $request
                                    ->user()
                                    ->name,

                            'date_time' =>
                                now(),

                            'inv_entry_date' =>
                                now(),

                            'employee' =>
                                $data['employee']
                                    ?: null,

                            'supervised' =>
                                $data['supervised']
                                    ? 1
                                    : 0,

                            'sales_tax_invoice_no' =>
                                $data[
                                    'sales_tax_invoice_no'
                                ] ?: null,

                            'payment_terms' =>
                                $data['payment_terms']
                                    ?: null,

                            'due_date' =>
                                $data['due_date']
                                    ?: null,

                            'ticket_query_id' =>
                                $data[
                                    'ticket_query_id'
                                ] ?: null,

                            'remarks' =>
                                $data['remarks']
                                    ?: null,

                            'branch_id' =>
                                $data['branch_id'],

                            'department_id' =>
                                $data[
                                    'department_id'
                                ],

                            'status' =>
                                $data['status'],

                            'is_selected' =>
                                0,

                            'is_active' =>
                                $data['is_active']
                                    ? 1
                                    : 0,

                            'due_date_vendor' =>
                                $data[
                                    'due_date_vendor'
                                ] ?: null,

                            'invoice_type' =>
                                'Normal',

                            'shirka' =>
                                null,

                            'umrah_query_id' =>
                                $data[
                                    'umrah_query_id'
                                ] ?: null,

                            'created_at' =>
                                now(),

                            'updated_at' =>
                                now(),
                        ]);

                /*
                 * Use the exact existing transaction + journal engine.
                 */
                $this->replaceTransactionsAndJournal(
                    $invoiceId,
                    $invoiceNumber,
                    $data,
                    $client,
                    $request
                        ->user()
                        ->id,
                    $request
                        ->user()
                        ->name,
                );

                $savedLineCount =
                    DB::table(
                        'invoice_transactions'
                    )
                        ->where(
                            'invoice_id',
                            $invoiceId
                        )
                        ->count();

                if (
                    $savedLineCount !==
                    count(
                        $data['lines']
                    )
                ) {
                    throw new \RuntimeException(
                        'Hotel invoice line was not saved.'
                    );
                }

                return $invoiceId;
            }
        );

    /*
     * Reload the resulting invoice.
     */
    $invoice =
        DB::table(
            'invoices as i'
        )
            ->leftJoin(
                'accounts as a',
                'a.id',
                '=',
                'i.client_account_id'
            )
            ->where(
                'i.id',
                $invoiceId
            )
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.invoice_date',
                'i.status',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->first();

    abort_unless(
        $invoice,
        500,
        'Invoice was created but could not be reloaded.'
    );

    $transaction =
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoiceId
            )
            ->orderBy('id')
            ->first();

    /*
     * API response:
     *
     * Keep "rate" and "vendor_rate" user-facing in SAR
     * when SAR was supplied, while also returning the BASE
     * values explicitly for debugging/integration.
     */
    $responseRate =
        $currencyCode === 'SAR'
            ? $saleRateInput
            : $saleRateBase;

    $responseVendorRate =
        $currencyCode === 'SAR'
            ? $vendorRateInput
            : $vendorRateBase;

    $responseRateBase =
        $saleRateBase;

    $responseVendorRateBase =
        $vendorRateBase;

    $sellingTotalBase =
        round(
            $saleRateBase *
            $nights *
            $roomQuantity,
            4
        );

    $vendorTotalBase =
        round(
            $vendorRateBase *
            $nights *
            $roomQuantity,
            4
        );

    $sellingTotalForeign =
        $currencyCode === 'SAR'
            ? round(
                $saleRateInput *
                $nights *
                $roomQuantity,
                4
            )
            : null;

    $vendorTotalForeign =
        $currencyCode === 'SAR'
            ? round(
                $vendorRateInput *
                $nights *
                $roomQuantity,
                4
            )
            : null;

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                (int) $invoice->id,

            'invoice_number' =>
                (string)
                $invoice->legacy_invoice_id,

            'invoice_date' =>
                (string)
                $invoice->invoice_date,

            'status' =>
                (string)
                $invoice->status,

            'client_code' =>
                (string)
                $invoice->client_code,

            'client_name' =>
                (string)
                $invoice->client_name,

            'passenger_name' =>
                $passengerName,

            'hotel_name' =>
                $transaction
                    ? (string)
                    (
                        $transaction->hotel_name
                        ?? $hotelName
                    )
                    : $hotelName,

            'check_in' =>
                $checkIn,

            'check_out' =>
                $checkOut,

            'nights' =>
                $nights,

            'room_quantity' =>
                $roomQuantity,

            /*
             * User-entered rate.
             * SAR when SAR was the selected currency.
             */
            'rate' =>
                $responseRate,

            /*
             * BASE ERP rate.
             */
            'rate_base' =>
                $responseRateBase,

            /*
             * User-entered vendor rate.
             * SAR when SAR was the selected currency.
             */
            'vendor_rate' =>
                $responseVendorRate,

            /*
             * BASE ERP vendor rate.
             */
            'vendor_rate_base' =>
                $responseVendorRateBase,

            /*
             * Total in BASE currency.
             */
            'selling_total' =>
                $sellingTotalBase,

            'vendor_total' =>
                $vendorTotalBase,

            /*
             * Foreign totals, when applicable.
             */
            'selling_total_sar' =>
                $sellingTotalForeign,

            'vendor_total_sar' =>
                $vendorTotalForeign,

            'currency_code' =>
                $currencyCode !== ''
                    ? $currencyCode
                    : null,

            'currency_rate' =>
                $currencyRate,

            'currency_quantity' =>
                $currencyCode !== ''
                    ? $nights *
                        $roomQuantity
                    : null,
        ],
    ]);
}


/**
 * Create a new Invoice with its first Visa line from WhatsApp.
 *
 * WhatsApp Visa values are entered in SAR.
 * The native invoice engine stores financial amounts in BASE
 * currency and keeps SAR + ROE as foreign-currency metadata.
 */
public function storeFromWhatsAppVisa(
    Request $request
): JsonResponse {
    $clientSuffix =
        trim(
            (string) $request->input(
                'client_suffix'
            )
        );

    $passengerName =
        trim(
            (string) $request->input(
                'passenger_name'
            )
        );

    $passportNo =
        trim(
            (string) $request->input(
                'passport_no'
            )
        );

    $visaType =
        trim(
            (string) $request->input(
                'visa_type'
            )
        );

    $vendorSuffix =
        trim(
            (string) $request->input(
                'vendor_suffix'
            )
        );

    $saleRateSar =
        round(
            (float) $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorAmountSar =
        round(
            (float) $request->input(
                'vendor_amount',
                0
            ),
            4
        );

    $currencyCode =
        strtoupper(
            trim(
                (string) $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float) $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    /*
     * ------------------------------------------------------
     * Validate WhatsApp-specific fields
     * ------------------------------------------------------
     */

    if (
        ! preg_match(
            '/^\d{3}$/',
            $clientSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Client code must be the last 3 digits of the client account.',
        ], 422);
    }

    if (
        $passengerName === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger name is required.',
        ], 422);
    }

    if (
        $passportNo === ''
    ) {
        return response()->json([
            'message' =>
                'Passport number is required.',
        ], 422);
    }

    if (
        $visaType === ''
    ) {
        return response()->json([
            'message' =>
                'Visa type / package is required.',
        ], 422);
    }

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    if (
        $saleRateSar <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/Transfer must be greater than zero.',
        ], 422);
    }

    if (
        $vendorAmountSar < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor amount cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }
    /*
     * ------------------------------------------------------
     * Resolve Client
     * ------------------------------------------------------
     */

    $client =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                '1200' . $clientSuffix
            )
            ->first();

    if (
        ! $client
    ) {
        $clientMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '12%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $clientSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $clientMatches->count() === 0
        ) {
            return response()->json([
                'message' =>
                    "Client account ending in {$clientSuffix} was not found.",
            ], 404);
        }

        if (
            $clientMatches->count() > 1
        ) {
            return response()->json([
                'message' =>
                    "Multiple client accounts end in {$clientSuffix}.",
            ], 409);
        }

        $client =
            $clientMatches->first();
    }

    $this->assertAccountType(
        $client,
        'client'
    );

    /*
     * ------------------------------------------------------
     * Resolve Vendor
     * ------------------------------------------------------
     */

    $vendor =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                '2100' . $vendorSuffix
            )
            ->first();

    if (
        ! $vendor
    ) {
        $vendorMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '21%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $vendorSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $vendorMatches->count() === 0
        ) {
            return response()->json([
                'message' =>
                    "Vendor account ending in {$vendorSuffix} was not found.",
            ], 404);
        }

        if (
            $vendorMatches->count() > 1
        ) {
            return response()->json([
                'message' =>
                    "Multiple vendor accounts end in {$vendorSuffix}.",
            ], 409);
        }

        $vendor =
            $vendorMatches->first();
    }

    $this->assertAccountType(
        $vendor,
        'vendor'
    );

    /*
     * ------------------------------------------------------
     * Resolve/Create Visa Type
     * ------------------------------------------------------
     */

    $resolvedVisaType =
        $this->resolveOrCreateWhatsAppVisaType(
            $visaType
        );

    /*
     * ------------------------------------------------------
     * Convert SAR -> BASE
     * ------------------------------------------------------
     *
     * Example:
     *
     * Sale:
     *   250 SAR × 76.5 = 19,125 BASE
     *
     * Vendor:
     *   240 SAR × 76.5 = 18,360 BASE
     *
     * Quantity is always 1 for this command.
     * ------------------------------------------------------
     */

    $saleRateBase =
        $saleRateSar;

    $vendorAmountBase =
        $vendorAmountSar;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRateSar *
                $currencyRate,
                4
            );

        $vendorAmountBase =
            round(
                $vendorAmountSar *
                $currencyRate,
                4
            );
    }

    $invoiceId =
        DB::transaction(
            function () use (
                $request,
                $client,
                $vendor,
                $resolvedVisaType,
                $passengerName,
                $passportNo,
                $saleRateBase,
                $vendorAmountBase,
                $currencyCode,
                $currencyRate
            ): int {

                $line =
                    $this->blankLine();

                $line =
                    array_merge(
                        $line,
                        [
                            'mode' =>
                                'Visa',

                            'type' =>
                                'Normal',

                            'passenger_name' =>
                                $passengerName,

                            'passport_no' =>
                                $passportNo,

                            /*
                             * Visa No is deliberately blank.
                             * WhatsApp field is PPT NO.
                             */
                            'visa_no' =>
                                '',

                            'documents' =>
                                '',

                            'package' =>
                                $resolvedVisaType,

                            /*
                             * Same behavior as the web form.
                             */
                            'sector' =>
                                $resolvedVisaType,

                            /*
                             * One passenger = one Visa.
                             */
                            'quantity' =>
                                1,

                            /*
                             * Stored as BASE values.
                             */
                            'rate' =>
                                $saleRateBase,

                            'receivable_amount' =>
                                $saleRateBase,

                            'payable_account_code' =>
                                (string)
                                $vendor->code,

                            'vendor_amount' =>
                                $vendorAmountBase,

                            'vendor_amount_2' =>
                                0,

                            'vendor_amount_3' =>
                                0,

                            /*
                             * No commission fields yet.
                             */
                            'agent_code' =>
                                '',

                            'agent_amount' =>
                                0,

                            'commission_receivable' =>
                                0,

                            'commission_paid' =>
                                0,

                            'commission_to_client' =>
                                0,

                            /*
                             * Foreign currency metadata.
                             */
                            'currency_code' =>
                                $currencyCode !== ''
                                    ? $currencyCode
                                    : null,

                            'currency_quantity' =>
                                $currencyCode !== ''
                                    ? 1
                                    : null,

                            'currency_rate' =>
                                $currencyCode !== ''
                                    ? $currencyRate
                                    : null,

                            /*
                             * Visa-specific dates/details
                             * are intentionally blank for now.
                             */
                            'online_date' =>
                                '',

                            'starting_date' =>
                                '',

                            'ending_date' =>
                                '',

                            'confirm_no' =>
                                '',

                            'room_no' =>
                                '',

                            'internal_ref_no' =>
                                '',

                            'particulars_2' =>
                                $resolvedVisaType,

                            'particulars_3' =>
                                '',

                            'passenger_type' =>
                                'Adult',
                        ]
                    );

                /*
                 * Use today's date/defaults.
                 */
                $request->merge([
                    'invoice_date' =>
                        now()->toDateString(),

                    'ref_no' =>
                        null,

                    'branch_id' =>
                        DB::table('branches')
                            ->orderBy('name')
                            ->value('id'),

                    'department_id' =>
                        DB::table('departments')
                            ->orderBy('name')
                            ->value('id'),

                    'client_account_id' =>
                        (int) $client->id,

                    'employee' =>
                        null,

                    'sales_tax_invoice_no' =>
                        null,

                    'payment_terms' =>
                        null,

                    'due_date' =>
                        now()->toDateString(),

                    'due_date_vendor' =>
                        now()->toDateString(),

                    'ticket_query_id' =>
                        null,

                    'umrah_query_id' =>
                        null,

                    'remarks' =>
                        null,

                    'supervised' =>
                        false,

                    'is_active' =>
                        true,

                    'status' =>
                        'Definite / Non Refundable',

                    'lines' =>
                        [$line],
                ]);

                $data =
                    $this->validateInvoice(
                        $request
                    );

                $invoiceNumber =
                    $this->nextInvoiceNumber();

                $invoiceId =
                    (int)
                    DB::table('invoices')
                        ->insertGetId([
                            'legacy_invoice_id' =>
                                $invoiceNumber,

                            'invoice_date' =>
                                $data['invoice_date'],

                            'ref_no' =>
                                $data['ref_no']
                                    ?: null,

                            'client_account_id' =>
                                (int) $client->id,

                            'created_by' =>
                                $request
                                    ->user()
                                    ->id,

                            'legacy_entered_by' =>
                                $request
                                    ->user()
                                    ->name,

                            'date_time' =>
                                now(),

                            'inv_entry_date' =>
                                now(),

                            'employee' =>
                                $data['employee']
                                    ?: null,

                            'supervised' =>
                                $data['supervised']
                                    ? 1
                                    : 0,

                            'sales_tax_invoice_no' =>
                                $data[
                                    'sales_tax_invoice_no'
                                ] ?: null,

                            'payment_terms' =>
                                $data['payment_terms']
                                    ?: null,

                            'due_date' =>
                                $data['due_date']
                                    ?: null,

                            'ticket_query_id' =>
                                $data[
                                    'ticket_query_id'
                                ] ?: null,

                            'remarks' =>
                                $data['remarks']
                                    ?: null,

                            'branch_id' =>
                                $data[
                                    'branch_id'
                                ],

                            'department_id' =>
                                $data[
                                    'department_id'
                                ],

                            'status' =>
                                $data['status'],

                            'is_selected' =>
                                0,

                            'is_active' =>
                                $data['is_active']
                                    ? 1
                                    : 0,

                            'due_date_vendor' =>
                                $data[
                                    'due_date_vendor'
                                ] ?: null,

                            'invoice_type' =>
                                'Normal',

                            'shirka' =>
                                null,

                            'umrah_query_id' =>
                                $data[
                                    'umrah_query_id'
                                ] ?: null,

                            'created_at' =>
                                now(),

                            'updated_at' =>
                                now(),
                        ]);

                $this->replaceTransactionsAndJournal(
                    $invoiceId,
                    $invoiceNumber,
                    $data,
                    $client,
                    $request
                        ->user()
                        ->id,
                    $request
                        ->user()
                        ->name,
                );

                $savedLineCount =
                    DB::table(
                        'invoice_transactions'
                    )
                        ->where(
                            'invoice_id',
                            $invoiceId
                        )
                        ->count();

                if (
                    $savedLineCount !== 1
                ) {
                    throw new \RuntimeException(
                        'Visa invoice line was not saved correctly.'
                    );
                }

                return $invoiceId;
            }
        );

    $invoice =
        DB::table(
            'invoices as i'
        )
            ->leftJoin(
                'accounts as a',
                'a.id',
                '=',
                'i.client_account_id'
            )
            ->where(
                'i.id',
                $invoiceId
            )
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.invoice_date',
                'i.status',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->first();

    abort_unless(
        $invoice,
        500,
        'Visa invoice was created but could not be reloaded.'
    );

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                (int)
                $invoice->id,

            'invoice_number' =>
                (string)
                $invoice->legacy_invoice_id,

            'invoice_date' =>
                (string)
                $invoice->invoice_date,

            'status' =>
                (string)
                $invoice->status,

            'client_code' =>
                (string)
                $invoice->client_code,

            'client_name' =>
                (string)
                $invoice->client_name,

            'passenger_name' =>
                $passengerName,

            'passport_no' =>
                $passportNo,

            'visa_type' =>
                $resolvedVisaType,

            'rate_sar' =>
                $saleRateSar,

            'vendor_code' =>
                $vendorSuffix,

            'vendor_amount_sar' =>
                $vendorAmountSar,

            'currency_code' =>
                $currencyCode !== ''
                    ? $currencyCode
                    : null,

            'currency_rate' =>
                $currencyCode !== ''
                    ? $currencyRate
                    : null,

            'quantity' =>
                1,

            'receivable_base' =>
                $saleRateBase,

            'vendor_base' =>
                $vendorAmountBase,

            'profit_base' =>
                round(
                    $saleRateBase -
                    $vendorAmountBase,
                    4
                ),
        ],
    ]);
}

private function resolveOrCreateWhatsAppVisaType(
    string $visaType
): string {
    $name =
        trim(
            preg_replace(
                '/\s+/',
                ' ',
                $visaType
            )
        );

    if (
        $name === ''
    ) {
        throw ValidationException::withMessages([
            'visa_type' =>
                'Visa type / package name is required.',
        ]);
    }

    if (
        ! Schema::hasTable(
            'visa_types'
        )
    ) {
        throw ValidationException::withMessages([
            'visa_type' =>
                'The visa_types master table does not exist.',
        ]);
    }

    /*
     * Use existing visa type when found.
     */
    $existing =
        DB::table('visa_types')
            ->whereRaw(
                'LOWER(name) = LOWER(?)',
                [
                    $name,
                ]
            )
            ->first();

    if (
        $existing
    ) {
        return trim(
            (string)
            $existing->name
        );
    }

    /*
     * Create only when it does not exist.
     *
     * Same schema used by the normal Sales form.
     */
    try {
        $id =
            DB::table('visa_types')
                ->insertGetId([
                    'name' =>
                        $name,

                    'is_active' =>
                        1,

                    'created_at' =>
                        now(),

                    'updated_at' =>
                        now(),
                ]);

        $created =
            DB::table('visa_types')
                ->where(
                    'id',
                    $id
                )
                ->first();

        if (
            $created
        ) {
            return trim(
                (string)
                $created->name
            );
        }
    } catch (
        \Throwable $e
    ) {
        /*
         * Another request may have created the same Visa
         * type concurrently. Try the case-insensitive lookup
         * one more time before failing.
         */
        $existing =
            DB::table('visa_types')
                ->whereRaw(
                    'LOWER(name) = LOWER(?)',
                    [
                        $name,
                    ]
                )
                ->first();

        if (
            $existing
        ) {
            return trim(
                (string)
                $existing->name
            );
        }

        report($e);

        throw ValidationException::withMessages([
            'visa_type' =>
                'Unable to create the Visa type / package.',
        ]);
    }

    return $name;
}


/**
 * Add one Visa line to an existing native HBA invoice.
 *
 * Historical Accu invoices remain read-only.
 */
public function addVisaLineFromWhatsApp(
    Request $request,
    int $invoice
): JsonResponse {
    $existing =
        DB::table('invoices')
            ->where(
                'id',
                $invoice
            )
            ->lockForUpdate()
            ->first();

    abort_unless(
        $existing,
        404,
        'Invoice not found.'
    );

    /*
     * Never modify a historical Accu invoice.
     */
    if (
        ! $this->isNativeInvoice(
            $invoice
        )
    ) {
        abort(
            409,
            'Historical Accu-Travel invoices are read-only.'
        );
    }

    $existingLines =
        $this->nativeTransactionsForInvoice(
            $invoice,
            (int)
            $existing->legacy_invoice_id
        );

    if (
        $existingLines->isEmpty()
    ) {
        abort(
            409,
            'This invoice has no editable native invoice lines.'
        );
    }

    /*
     * Existing client remains the invoice client.
     */
    $client =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'id',
                (int)
                $existing->client_account_id
            )
            ->first();

    $this->assertAccountType(
        $client,
        'client'
    );

    /*
     * Read new Visa fields.
     */
    $passengerName =
        trim(
            (string)
            $request->input(
                'passenger_name'
            )
        );

    $passportNo =
        trim(
            (string)
            $request->input(
                'passport_no'
            )
        );

    $visaType =
        trim(
            (string)
            $request->input(
                'visa_type'
            )
        );

    $vendorSuffix =
        trim(
            (string)
            $request->input(
                'vendor_suffix'
            )
        );

    $saleRateSar =
        round(
            (float)
            $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorAmountSar =
        round(
            (float)
            $request->input(
                'vendor_amount',
                0
            ),
            4
        );

    $currencyCode =
        strtoupper(
            trim(
                (string)
                $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float)
                $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    if (
        $passengerName === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger name is required.',
        ], 422);
    }

    if (
        $passportNo === ''
    ) {
        return response()->json([
            'message' =>
                'Passport number is required.',
        ], 422);
    }

    if (
        $visaType === ''
    ) {
        return response()->json([
            'message' =>
                'Visa type / package is required.',
        ], 422);
    }

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    if (
        $saleRateSar <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/Transfer must be greater than zero.',
        ], 422);
    }

    if (
        $vendorAmountSar < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor amount cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }
    /*
     * Resolve vendor.
     */
    $vendor =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'code',
                '2100' .
                $vendorSuffix
            )
            ->first();

    if (
        ! $vendor
    ) {
        $vendorMatches =
            DB::table('accounts')
                ->where(
                    'code',
                    'like',
                    '21%'
                )
                ->whereRaw(
                    'RIGHT(CAST(code AS CHAR), 3) = ?',
                    [
                        $vendorSuffix,
                    ]
                )
                ->select([
                    'id',
                    'code',
                    'name',
                ])
                ->get();

        if (
            $vendorMatches->count() ===
            0
        ) {
            return response()->json([
                'message' =>
                    "Vendor account ending in {$vendorSuffix} was not found.",
            ], 404);
        }

        if (
            $vendorMatches->count() > 1
        ) {
            return response()->json([
                'message' =>
                    "Multiple vendor accounts end in {$vendorSuffix}.",
            ], 409);
        }

        $vendor =
            $vendorMatches->first();
    }

    $this->assertAccountType(
        $vendor,
        'vendor'
    );

    $resolvedVisaType =
        $this->resolveOrCreateWhatsAppVisaType(
            $visaType
        );

    /*
     * SAR -> BASE.
     */
    $saleRateBase =
        $saleRateSar;

    $vendorAmountBase =
        $vendorAmountSar;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRateSar *
                $currencyRate,
                4
            );

        $vendorAmountBase =
            round(
                $vendorAmountSar *
                $currencyRate,
                4
            );
    }

    /*
     * ------------------------------------------------------
     * Add the new line and rebuild the existing invoice.
     * ------------------------------------------------------
     */
    DB::transaction(
        function () use (
            $request,
            $existing,
            $existingLines,
            $client,
            $vendor,
            $resolvedVisaType,
            $passengerName,
            $passportNo,
            $saleRateBase,
            $vendorAmountBase,
            $currencyRate,
            $invoice
        ): void {

            $lines =
                $existingLines
                    ->map(
                        fn ($row) =>
                            $this->decorateTransaction(
                                $row
                            )
                    )
                    ->values()
                    ->all();

            $newLine =
                $this->blankLine();

            $newLine =
                array_merge(
                    $newLine,
                    [
                        'mode' =>
                            'Visa',

                        'type' =>
                            'Normal',

                        'passenger_name' =>
                            $passengerName,

                        'passport_no' =>
                            $passportNo,

                        'visa_no' =>
                            '',

                        'documents' =>
                            '',

                        'package' =>
                            $resolvedVisaType,

                        'sector' =>
                            $resolvedVisaType,

                        'quantity' =>
                            1,

                        'rate' =>
                            $saleRateBase,

                        'receivable_amount' =>
                            $saleRateBase,

                        'payable_account_code' =>
                            (string)
                            $vendor->code,

                        'vendor_amount' =>
                            $vendorAmountBase,

                        'vendor_amount_2' =>
                            0,

                        'vendor_amount_3' =>
                            0,

                        'agent_code' =>
                            '',

                        'agent_amount' =>
                            0,

                        'commission_receivable' =>
                            0,

                        'commission_paid' =>
                            0,

                        'commission_to_client' =>
                            0,

                        'currency_code' =>
                            $currencyCode !== ''
                                ? $currencyCode
                                : null,

                        'currency_quantity' =>
                            $currencyCode !== ''
                                ? 1
                                : null,

                        'currency_rate' =>
                            $currencyCode !== ''
                                ? $currencyRate
                                : null,

                        'online_date' =>
                            '',

                        'starting_date' =>
                            '',

                        'ending_date' =>
                            '',

                        'confirm_no' =>
                            '',

                        'room_no' =>
                            '',

                        'internal_ref_no' =>
                            '',

                        'particulars_2' =>
                            $resolvedVisaType,

                        'particulars_3' =>
                            '',

                        'passenger_type' =>
                            'Adult',
                    ]
                );

            $lines[] =
                $newLine;

            /*
             * Preserve the existing invoice header.
             */
            $request->merge([
                'invoice_date' =>
                    $existing->invoice_date,

                'ref_no' =>
                    $existing->ref_no,

                'branch_id' =>
                    (int)
                    $existing->branch_id,

                'department_id' =>
                    (int)
                    $existing->department_id,

                'client_account_id' =>
                    (int)
                    $existing->client_account_id,

                'employee' =>
                    $existing->employee,

                'sales_tax_invoice_no' =>
                    $existing->sales_tax_invoice_no,

                'payment_terms' =>
                    $existing->payment_terms,

                'due_date' =>
                    $existing->due_date,

                'due_date_vendor' =>
                    $existing->due_date_vendor,

                'ticket_query_id' =>
                    $existing->ticket_query_id,

                'umrah_query_id' =>
                    $existing->umrah_query_id,

                'remarks' =>
                    $existing->remarks,

                'supervised' =>
                    (bool)
                    $existing->supervised,

                'is_active' =>
                    (bool)
                    $existing->is_active,

                /*
                 * Never change status when ADD is used.
                 */
                'status' =>
                    $existing->status,

                'lines' =>
                    $lines,
            ]);

            $data =
                $this->validateInvoice(
                    $request
                );

            /*
             * Keep the same invoice number.
             */
            $invoiceNumber =
                (int)
                $existing->legacy_invoice_id;

            $this->replaceTransactionsAndJournal(
                $invoice,
                $invoiceNumber,
                $data,
                $client,
                $existing->created_by
                    ? (int)
                        $existing->created_by
                    : $request
                        ->user()
                        ->id,
                $request
                    ->user()
                    ->name
            );

            $savedLineCount =
                DB::table(
                    'invoice_transactions'
                )
                    ->where(
                        'invoice_id',
                        $invoice
                    )
                    ->count();

            if (
                $savedLineCount !==
                count($lines)
            ) {
                throw new \RuntimeException(
                    'Visa line was not added correctly.'
                );
            }
        }
    );

    $lineCount =
        (int)
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoice
            )
            ->count();

    $totals =
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoice
            )
            ->selectRaw(
                'COALESCE(SUM(total_fare), 0) AS receivable'
            )
            ->selectRaw(
                'COALESCE(SUM(COALESCE(rate_vendor, vendor_rate, 0) + COALESCE(fare_2, 0) + COALESCE(fare_3, 0)), 0) AS payable'
            )
            ->first();

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                $invoice,

            'invoice_number' =>
                (string)
                $existing->legacy_invoice_id,

            'client_code' =>
                (string)
                $client->code,

            'client_name' =>
                (string)
                $client->name,

            'line_count' =>
                $lineCount,

            'total_receivable' =>
                round(
                    (float)
                    ($totals->receivable ?? 0),
                    4
                ),

            'total_payable' =>
                round(
                    (float)
                    ($totals->payable ?? 0),
                    4
                ),

            'added_line' => [
                'mode' =>
                    'Visa',

                'passenger_name' =>
                    $passengerName,

                'passport_no' =>
                    $passportNo,

                'visa_type' =>
                    $resolvedVisaType,

                'rate_sar' =>
                    $saleRateSar,

                'vendor_code' =>
                    $vendorSuffix,

                'vendor_amount_sar' =>
                    $vendorAmountSar,

                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,

                'currency_rate' =>
                    $currencyCode !== ''
                        ? $currencyRate
                        : null,
            ],
        ],
    ]);
}

public function storeFromWhatsAppTransfer(
    Request $request
): JsonResponse {
    $clientSuffix =
        trim(
            (string) $request->input(
                'client_suffix'
            )
        );

    $passengerName =
        trim(
            (string) $request->input(
                'passenger_name'
            )
        );

    $toLocation =
        trim(
            (string) $request->input(
                'to'
            )
        );

    $fromLocation =
        trim(
            (string) $request->input(
                'from'
            )
        );

    $vehicleName =
        trim(
            (string) $request->input(
                'vehicle'
            )
        );

    $transferDate =
        trim(
            (string) $request->input(
                'transfer_date'
            )
        );

    $flightInfo =
        trim(
            (string) $request->input(
                'flight_info'
            )
        );

    /*
     * WhatsApp input is SAR.
     */
    $saleRateSar =
        round(
            (float) $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorSuffix =
        trim(
            (string) $request->input(
                'vendor_suffix'
            )
        );

    $vendorAmountSar =
        round(
            (float) $request->input(
                'vendor_amount',
                0
            ),
            4
        );

    $currencyCode =
        strtoupper(
            trim(
                (string) $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float) $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    /*
     * ------------------------------------------------------
     * Validation
     * ------------------------------------------------------
     */

    if (
        ! preg_match(
            '/^\d{3}$/',
            $clientSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Client code must be the last 3 digits of the client account.',
        ], 422);
    }

    if (
        $passengerName === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger name is required.',
        ], 422);
    }

    if (
        $toLocation === ''
    ) {
        return response()->json([
            'message' =>
                'To location is required.',
        ], 422);
    }

    if (
        $fromLocation === ''
    ) {
        return response()->json([
            'message' =>
                'From location is required.',
        ], 422);
    }

    if (
        $vehicleName === ''
    ) {
        return response()->json([
            'message' =>
                'Vehicle is required.',
        ], 422);
    }

    if (
        $transferDate === ''
    ) {
        return response()->json([
            'message' =>
                'Transfer date is required.',
        ], 422);
    }

    if (
        $saleRateSar <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/Transfer must be greater than zero.',
        ], 422);
    }

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    if (
        $vendorAmountSar < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor amount cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }
    /*
     * ------------------------------------------------------
     * Resolve client
     * ------------------------------------------------------
     */

    $client =
        $this->resolveWhatsAppTransferClient(
            $clientSuffix
        );

    /*
     * ------------------------------------------------------
     * Resolve vendor
     * ------------------------------------------------------
     */

    $vendor =
        $this->resolveWhatsAppTransferVendor(
            $vendorSuffix
        );

    /*
     * ------------------------------------------------------
     * Convert SAR -> BASE.
     *
     * Quantity is always 1 for this command.
     * ------------------------------------------------------
     */

    $saleRateBase =
        $saleRateSar;

    $vendorAmountBase =
        $vendorAmountSar;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRateSar *
                $currencyRate,
                4
            );

        $vendorAmountBase =
            round(
                $vendorAmountSar *
                $currencyRate,
                4
            );
    }

    /*
     * ------------------------------------------------------
     * Resolve / create From location
     * ------------------------------------------------------
     */

    $from =
        $this->resolveOrCreateWhatsAppTransferLocation(
            $fromLocation
        );

    /*
     * ------------------------------------------------------
     * Resolve / create To location
     * ------------------------------------------------------
     */

    $to =
        $this->resolveOrCreateWhatsAppTransferLocation(
            $toLocation
        );

    /*
     * ------------------------------------------------------
     * Resolve / create Vehicle
     * ------------------------------------------------------
     */

    $vehicle =
        $this->resolveOrCreateWhatsAppTransferVehicle(
            $vehicleName,
            (string) $vendor->code
        );

    /*
     * ------------------------------------------------------
     * Create invoice + first Transfer line
     * ------------------------------------------------------
     */

    $invoiceId =
        DB::transaction(
            function () use (
                $request,
                $client,
                $vendor,
                $from,
                $to,
                $vehicle,
                $passengerName,
                $transferDate,
                $flightInfo,
                $saleRateBase,
                $vendorAmountBase,
                $currencyCode,
                $currencyRate
            ): int {

                $line =
                    $this->blankLine();

                /*
                 * Transfer quantity is always 1 for the
                 * first WhatsApp implementation.
                 */
                $quantity = 1;

                $baseSale =
                    round(
                        $saleRateBase *
                        $quantity,
                        4
                    );

                $baseVendor =
                    round(
                        $vendorAmountBase,
                        4
                    );

                if (
                    $baseVendor -
                        $baseSale >
                    0.00005
                ) {
                    throw ValidationException::withMessages([
                        'vendor_amount' =>
                            'Vendor amount cannot exceed the Transfer customer sale.',
                    ]);
                }

                $line =
                    array_merge(
                        $line,
                        [
                            'mode' =>
                                'Transfer',

                            'type' =>
                                'Normal',

                            'passenger_name' =>
                                $passengerName,

                            'passenger_type' =>
                                'Adult',

                            /*
                             * From
                             */
                            'sector' =>
                                $from,

                            /*
                             * To
                             */
                            'sector_to' =>
                                $to,

                            /*
                             * Vehicle master
                             */
                            'vehicle_id' =>
                                $vehicle['id'],

                            /*
                             * From Date
                             */
                            'departure_date' =>
                                $transferDate,

                            'starting_date' =>
                                $transferDate,

                            /*
                             * No return date for this
                             * single-date transfer.
                             */
                            'return_date' =>
                                '',

                            'ending_date' =>
                                '',

                            /*
                             * Flight information
                             */
                            'flight_information' =>
                                $flightInfo,

                            'quantity' =>
                                $quantity,

                            /*
                             * Existing ERP expects BASE
                             * financial rate.
                             */
                            'rate' =>
                                $saleRateBase,

                            'receivable_amount' =>
                                $baseSale,

                            /*
                             * Main vendor
                             */
                            'payable_account_code' =>
                                (string)
                                $vendor->code,

                            'vendor_amount' =>
                                $baseVendor,

                            'vendor_amount_2' =>
                                0,

                            'vendor_amount_3' =>
                                0,

                            /*
                             * No commission yet.
                             */
                            'agent_code' =>
                                '',

                            'agent_amount' =>
                                0,

                            'commission_receivable' =>
                                0,

                            'commission_paid' =>
                                0,

                            'commission_to_client' =>
                                0,

                            /*
                             * Foreign currency
                             */
                            'currency_code' =>
                                $currencyCode !== ''
                                    ? $currencyCode
                                    : null,

                            'currency_quantity' =>
                                $currencyCode !== ''
                                    ? 1
                                    : null,

                            'currency_rate' =>
                                $currencyCode !== ''
                                    ? $currencyRate
                                    : null,

                            /*
                             * Not applicable to Transfer.
                             */
                            'hotel_id' =>
                                null,

                            'hotel_name' =>
                                '',

                            'room_type' =>
                                '',

                            'meal' =>
                                '',

                            'room_quantity' =>
                                1,

                            'nights' =>
                                0,

                            'package' =>
                                '',

                            'visa_no' =>
                                '',

                            'documents' =>
                                '',

                            'confirm_no' =>
                                '',

                            'room_no' =>
                                '',

                            'internal_ref_no' =>
                                '',

                            'particulars_2' =>
                                '',

                            'particulars_3' =>
                                '',
                        ]
                    );

                /*
                 * --------------------------------------------------
                 * Default invoice header
                 * --------------------------------------------------
                 */

                $branchId =
                    DB::table(
                        'branches'
                    )
                        ->orderBy(
                            'name'
                        )
                        ->value(
                            'id'
                        );

                $departmentId =
                    DB::table(
                        'departments'
                    )
                        ->orderBy(
                            'name'
                        )
                        ->value(
                            'id'
                        );

                if (
                    ! $branchId
                ) {
                    throw new \RuntimeException(
                        'No default branch is configured.'
                    );
                }

                if (
                    ! $departmentId
                ) {
                    throw new \RuntimeException(
                        'No default department is configured.'
                    );
                }

                $request->merge([
                    'invoice_date' =>
                        now()->toDateString(),

                    'ref_no' =>
                        null,

                    'branch_id' =>
                        (int) $branchId,

                    'department_id' =>
                        (int) $departmentId,

                    'client_account_id' =>
                        (int) $client->id,

                    'employee' =>
                        null,

                    'sales_tax_invoice_no' =>
                        null,

                    'payment_terms' =>
                        null,

                    'due_date' =>
                        now()->toDateString(),

                    'due_date_vendor' =>
                        now()->toDateString(),

                    'ticket_query_id' =>
                        null,

                    'umrah_query_id' =>
                        null,

                    'remarks' =>
                        null,

                    'supervised' =>
                        false,

                    'is_active' =>
                        true,

                    'status' =>
                        'Definite / Non Refundable',

                    'lines' =>
                        [$line],
                ]);

                /*
                 * Existing native validation/calculation engine.
                 */
                $data =
                    $this->validateInvoice(
                        $request
                    );

                $invoiceNumber =
                    $this->nextInvoiceNumber();

                $invoiceId =
                    (int)
                    DB::table(
                        'invoices'
                    )->insertGetId([
                        'legacy_invoice_id' =>
                            $invoiceNumber,

                        'invoice_date' =>
                            $data[
                                'invoice_date'
                            ],

                        'ref_no' =>
                            $data['ref_no']
                                ?: null,

                        'client_account_id' =>
                            (int)
                            $client->id,

                        'created_by' =>
                            $request
                                ->user()
                                ->id,

                        'legacy_entered_by' =>
                            $request
                                ->user()
                                ->name,

                        'date_time' =>
                            now(),

                        'inv_entry_date' =>
                            now(),

                        'employee' =>
                            $data['employee']
                                ?: null,

                        'supervised' =>
                            $data['supervised']
                                ? 1
                                : 0,

                        'sales_tax_invoice_no' =>
                            $data[
                                'sales_tax_invoice_no'
                            ] ?: null,

                        'payment_terms' =>
                            $data['payment_terms']
                                ?: null,

                        'due_date' =>
                            $data['due_date']
                                ?: null,

                        'ticket_query_id' =>
                            $data[
                                'ticket_query_id'
                            ] ?: null,

                        'remarks' =>
                            $data['remarks']
                                ?: null,

                        'branch_id' =>
                            $data['branch_id'],

                        'department_id' =>
                            $data[
                                'department_id'
                            ],

                        'status' =>
                            $data['status'],

                        'is_selected' =>
                            0,

                        'is_active' =>
                            $data['is_active']
                                ? 1
                                : 0,

                        'due_date_vendor' =>
                            $data[
                                'due_date_vendor'
                            ] ?: null,

                        'invoice_type' =>
                            'Normal',

                        'shirka' =>
                            null,

                        'umrah_query_id' =>
                            $data[
                                'umrah_query_id'
                            ] ?: null,

                        'created_at' =>
                            now(),

                        'updated_at' =>
                            now(),
                    ]);

                /*
                 * Build invoice transactions + journal using
                 * the same native engine as web Invoice creation.
                 */
                $this->replaceTransactionsAndJournal(
                    $invoiceId,
                    $invoiceNumber,
                    $data,
                    $client,
                    $request
                        ->user()
                        ->id,
                    $request
                        ->user()
                        ->name,
                );

                $savedLines =
                    DB::table(
                        'invoice_transactions'
                    )
                        ->where(
                            'invoice_id',
                            $invoiceId
                        )
                        ->count();

                if (
                    $savedLines !== 1
                ) {
                    throw new \RuntimeException(
                        'Transfer invoice line was not saved correctly.'
                    );
                }

                return $invoiceId;
            }
        );

    $invoice =
        DB::table(
            'invoices as i'
        )
            ->leftJoin(
                'accounts as a',
                'a.id',
                '=',
                'i.client_account_id'
            )
            ->where(
                'i.id',
                $invoiceId
            )
            ->select([
                'i.id',
                'i.legacy_invoice_id',
                'i.invoice_date',
                'i.status',
                'a.code as client_code',
                'a.name as client_name',
            ])
            ->first();

    abort_unless(
        $invoice,
        500,
        'Transfer invoice was created but could not be reloaded.'
    );

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                (int)
                $invoice->id,

            'invoice_number' =>
                (string)
                $invoice->legacy_invoice_id,

            'invoice_date' =>
                (string)
                $invoice->invoice_date,

            'status' =>
                (string)
                $invoice->status,

            'client_code' =>
                (string)
                $invoice->client_code,

            'client_name' =>
                (string)
                $invoice->client_name,

            'passenger_name' =>
                $passengerName,

            'from' =>
                $from,

            'to' =>
                $to,

            'vehicle' =>
                $vehicle['name'],

            'date' =>
                $transferDate,

            'flight_info' =>
                $flightInfo,

            'quantity' =>
                1,

            'rate_sar' =>
                $saleRateSar,

            'vendor_code' =>
                $vendorSuffix,

            'vendor_amount_sar' =>
                $vendorAmountSar,

            'currency_code' =>
                $currencyCode !== ''
                    ? $currencyCode
                    : null,

            'currency_rate' =>
                $currencyCode !== ''
                    ? $currencyRate
                    : null,

            'selling_total_base' =>
                round(
                    $saleRateBase,
                    4
                ),

            'vendor_total_base' =>
                round(
                    $vendorAmountBase,
                    4
                ),

            'profit_base' =>
                round(
                    $saleRateBase -
                    $vendorAmountBase,
                    4
                ),
        ],
    ]);
}

private function resolveWhatsAppTransferClient(
    string $suffix
): object {
    $matches =
        DB::table('accounts')
            ->where(
                'code',
                'like',
                '12%'
            )
            ->whereRaw(
                'RIGHT(CAST(code AS CHAR), 3) = ?',
                [
                    $suffix,
                ]
            )
            ->select([
                'id',
                'code',
                'name',
            ])
            ->get();

    if (
        $matches->count() === 0
    ) {
        throw ValidationException::withMessages([
            'client_suffix' =>
                "Client account ending in {$suffix} was not found.",
        ]);
    }

    if (
        $matches->count() > 1
    ) {
        throw ValidationException::withMessages([
            'client_suffix' =>
                "Multiple client accounts end in {$suffix}.",
        ]);
    }

    $client =
        $matches->first();

    $this->assertAccountType(
        $client,
        'client'
    );

    return $client;
}


private function resolveWhatsAppTransferVendor(
    string $suffix
): object {
    $matches =
        DB::table('accounts')
            ->where(
                'code',
                'like',
                '21%'
            )
            ->whereRaw(
                'RIGHT(CAST(code AS CHAR), 3) = ?',
                [
                    $suffix,
                ]
            )
            ->select([
                'id',
                'code',
                'name',
            ])
            ->get();

    if (
        $matches->count() === 0
    ) {
        throw ValidationException::withMessages([
            'vendor_suffix' =>
                "Vendor account ending in {$suffix} was not found.",
        ]);
    }

    if (
        $matches->count() > 1
    ) {
        throw ValidationException::withMessages([
            'vendor_suffix' =>
                "Multiple vendor accounts end in {$suffix}.",
        ]);
    }

    $vendor =
        $matches->first();

    $this->assertAccountType(
        $vendor,
        'vendor'
    );

    return $vendor;
}


private function resolveOrCreateWhatsAppTransferLocation(
    string $name
): string {
    $name =
        trim(
            preg_replace(
                '/\s+/',
                ' ',
                $name
            )
        );

    if (
        $name === ''
    ) {
        throw ValidationException::withMessages([
            'location' =>
                'Transfer location cannot be empty.',
        ]);
    }

    if (
        ! Schema::hasTable(
            'transfer_locations'
        )
    ) {
        throw new \RuntimeException(
            'The transfer_locations master table does not exist.'
        );
    }

    /*
     * Existing location.
     */
    $existing =
        DB::table(
            'transfer_locations'
        )
            ->whereRaw(
                'LOWER(name) = LOWER(?)',
                [
                    $name,
                ]
            )
            ->first();

    if (
        $existing
    ) {
        return (string)
            $existing->name;
    }

    /*
     * Create automatically when missing.
     *
     * This matches the native storeTransferLocation()
     * master-data behavior.
     */
    $id =
        DB::table(
            'transfer_locations'
        )
            ->insertGetId([
                'name' =>
                    $name,

                'is_active' =>
                    1,

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ]);

    $created =
        DB::table(
            'transfer_locations'
        )
            ->where(
                'id',
                $id
            )
            ->first();

    if (
        ! $created
    ) {
        throw new \RuntimeException(
            "Transfer location {$name} was created but could not be reloaded."
        );
    }

    return (string)
        $created->name;
}


private function resolveOrCreateWhatsAppTransferVehicle(
    string $name,
    string $vendorAccountCode
): array {
    $name =
        trim(
            preg_replace(
                '/\s+/',
                ' ',
                $name
            )
        );

    if (
        $name === ''
    ) {
        throw ValidationException::withMessages([
            'vehicle' =>
                'Vehicle cannot be empty.',
        ]);
    }

    if (
        ! Schema::hasTable(
            'vehicles'
        )
    ) {
        throw new \RuntimeException(
            'The vehicles master table does not exist.'
        );
    }

    /*
     * Existing vehicle type.
     */
    $existing =
        DB::table(
            'vehicles'
        )
            ->whereRaw(
                'LOWER(name) = LOWER(?)',
                [
                    $name,
                ]
            )
            ->first();

    if (
        $existing
    ) {
        return [
            'id' =>
                (int)
                $existing->id,

            'name' =>
                (string)
                $existing->name,

            'registration_no' =>
                (string)
                (
                    $existing->registration_no
                    ?? ''
                ),
        ];
    }

    /*
     * Create missing vehicle.
     *
     * No registration was supplied by WhatsApp,
     * so it remains blank.
     */
    $id =
        DB::table(
            'vehicles'
        )
            ->insertGetId([
                'name' =>
                    $name,

                'registration_no' =>
                    null,

                'vendor_account_code' =>
                    $vendorAccountCode,

                'is_active' =>
                    1,

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ]);

    $created =
        DB::table(
            'vehicles'
        )
            ->where(
                'id',
                $id
            )
            ->first();

    if (
        ! $created
    ) {
        throw new \RuntimeException(
            "Vehicle {$name} was created but could not be reloaded."
        );
    }

    return [
        'id' =>
            (int)
            $created->id,

        'name' =>
            (string)
            $created->name,

        'registration_no' =>
            (string)
            (
                $created->registration_no
                ?? ''
            ),
    ];
}

public function addTransferLineFromWhatsApp(
    Request $request,
    int $invoice
): JsonResponse {
    $existing =
        DB::table('invoices')
            ->where(
                'id',
                $invoice
            )
            ->lockForUpdate()
            ->first();

    abort_unless(
        $existing,
        404,
        'Invoice not found.'
    );

    /*
     * Historical Accu invoices remain read-only.
     */
    if (
        ! $this->isNativeInvoice(
            $invoice
        )
    ) {
        abort(
            409,
            'Historical Accu-Travel invoices are read-only.'
        );
    }

    $existingTransactions =
        $this->nativeTransactionsForInvoice(
            $invoice,
            (int)
            $existing->legacy_invoice_id
        );

    if (
        $existingTransactions->isEmpty()
    ) {
        abort(
            409,
            'This invoice has no editable native invoice lines.'
        );
    }

    $client =
        DB::table('accounts')
            ->select([
                'id',
                'code',
                'name',
            ])
            ->where(
                'id',
                (int)
                $existing->client_account_id
            )
            ->first();

    $this->assertAccountType(
        $client,
        'client'
    );

    /*
     * New Transfer data.
     */
    $passengerName =
        trim(
            (string)
            $request->input(
                'passenger_name'
            )
        );

    $toLocation =
        trim(
            (string)
            $request->input(
                'to'
            )
        );

    $fromLocation =
        trim(
            (string)
            $request->input(
                'from'
            )
        );

    $vehicleName =
        trim(
            (string)
            $request->input(
                'vehicle'
            )
        );

    $transferDate =
        trim(
            (string)
            $request->input(
                'transfer_date'
            )
        );

    $flightInfo =
        trim(
            (string)
            $request->input(
                'flight_info'
            )
        );

    $saleRateSar =
        round(
            (float)
            $request->input(
                'rate',
                0
            ),
            4
        );

    $vendorSuffix =
        trim(
            (string)
            $request->input(
                'vendor_suffix'
            )
        );

    $vendorAmountSar =
        round(
            (float)
            $request->input(
                'vendor_amount',
                0
            ),
            4
        );

    $currencyCode =
        strtoupper(
            trim(
                (string)
                $request->input(
                    'currency_code',
                    ''
                )
            )
        );

    $currencyRate =
        $request->input(
            'currency_rate'
        ) !== null
            ? round(
                (float)
                $request->input(
                    'currency_rate'
                ),
                8
            )
            : null;

    if (
        $passengerName === '' ||
        $toLocation === '' ||
        $fromLocation === '' ||
        $vehicleName === '' ||
        $transferDate === ''
    ) {
        return response()->json([
            'message' =>
                'Passenger, To, From, Vehicle and Date are all required.',
        ], 422);
    }

    if (
        $saleRateSar <= 0
    ) {
        return response()->json([
            'message' =>
                'Rate/Transfer must be greater than zero.',
        ], 422);
    }

    if (
        ! preg_match(
            '/^\d{3}$/',
            $vendorSuffix
        )
    ) {
        return response()->json([
            'message' =>
                'Vendor code must be the last 3 digits of the vendor account.',
        ], 422);
    }

    if (
        $vendorAmountSar < 0
    ) {
        return response()->json([
            'message' =>
                'Vendor amount cannot be negative.',
        ], 422);
    }

    if (
        $currencyCode !== ''
        && $currencyCode !== 'SAR'
    ) {
        return response()->json([
            'message' =>
                'Only SAR is supported by the WhatsApp command.',
        ], 422);
    }

    if (
        $currencyCode === 'SAR'
        && (
            $currencyRate === null
            || $currencyRate <= 0
        )
    ) {
        return response()->json([
            'message' =>
                'SAR requires a valid ROE.',
        ], 422);
    }
    $vendor =
        $this->resolveWhatsAppTransferVendor(
            $vendorSuffix
        );

    /*
     * Convert new line from SAR to BASE.
     */
    $saleRateBase =
        $saleRateSar;

    $vendorAmountBase =
        $vendorAmountSar;

    if (
        $currencyCode === 'SAR'
    ) {
        $saleRateBase =
            round(
                $saleRateSar *
                $currencyRate,
                4
            );

        $vendorAmountBase =
            round(
                $vendorAmountSar *
                $currencyRate,
                4
            );
    }

    $from =
        $this->resolveOrCreateWhatsAppTransferLocation(
            $fromLocation
        );

    $to =
        $this->resolveOrCreateWhatsAppTransferLocation(
            $toLocation
        );

    $vehicle =
        $this->resolveOrCreateWhatsAppTransferVehicle(
            $vehicleName,
            (string)
            $vendor->code
        );

    DB::transaction(
        function () use (
            $request,
            $existing,
            $existingTransactions,
            $client,
            $vendor,
            $from,
            $to,
            $vehicle,
            $passengerName,
            $transferDate,
            $flightInfo,
            $saleRateBase,
            $vendorAmountBase,
            $currencyRate,
            $invoice
        ): void {

            /*
             * Convert every existing native transaction back
             * into the same line structure used by the web form.
             */
            $lines =
                $existingTransactions
                    ->map(
                        fn ($row) =>
                            $this->decorateTransaction(
                                $row
                            )
                    )
                    ->values()
                    ->all();

            /*
             * New Transfer line.
             */
            $newLine =
                $this->blankLine();

            $newLine =
                array_merge(
                    $newLine,
                    [
                        'mode' =>
                            'Transfer',

                        'type' =>
                            'Normal',

                        'passenger_name' =>
                            $passengerName,

                        'passenger_type' =>
                            'Adult',

                        'sector' =>
                            $from,

                        'sector_to' =>
                            $to,

                        'vehicle_id' =>
                            $vehicle['id'],

                        'departure_date' =>
                            $transferDate,

                        'starting_date' =>
                            $transferDate,

                        'return_date' =>
                            '',

                        'ending_date' =>
                            '',

                        'flight_information' =>
                            $flightInfo,

                        'quantity' =>
                            1,

                        'rate' =>
                            $saleRateBase,

                        'receivable_amount' =>
                            $saleRateBase,

                        'payable_account_code' =>
                            (string)
                            $vendor->code,

                        'vendor_amount' =>
                            $vendorAmountBase,

                        'vendor_amount_2' =>
                            0,

                        'vendor_amount_3' =>
                            0,

                        'agent_code' =>
                            '',

                        'agent_amount' =>
                            0,

                        'commission_receivable' =>
                            0,

                        'commission_paid' =>
                            0,

                        'commission_to_client' =>
                            0,

                        'currency_code' =>
                            $currencyCode !== ''
                                ? $currencyCode
                                : null,

                        'currency_quantity' =>
                            $currencyCode !== ''
                                ? 1
                                : null,

                        'currency_rate' =>
                            $currencyCode !== ''
                                ? $currencyRate
                                : null,

                        'hotel_id' =>
                            null,

                        'hotel_name' =>
                            '',

                        'room_type' =>
                            '',

                        'meal' =>
                            '',

                        'room_quantity' =>
                            1,

                        'nights' =>
                            0,

                        'package' =>
                            '',

                        'visa_no' =>
                            '',

                        'documents' =>
                            '',

                        'confirm_no' =>
                            '',

                        'room_no' =>
                            '',

                        'internal_ref_no' =>
                            '',

                        'particulars_2' =>
                            '',

                        'particulars_3' =>
                            '',
                    ]
                );

            $lines[] =
                $newLine;

            /*
             * Preserve all invoice header fields.
             */
            $request->merge([
                'invoice_date' =>
                    $existing->invoice_date,

                'ref_no' =>
                    $existing->ref_no,

                'branch_id' =>
                    (int)
                    $existing->branch_id,

                'department_id' =>
                    (int)
                    $existing->department_id,

                'client_account_id' =>
                    (int)
                    $existing->client_account_id,

                'employee' =>
                    $existing->employee,

                'sales_tax_invoice_no' =>
                    $existing->sales_tax_invoice_no,

                'payment_terms' =>
                    $existing->payment_terms,

                'due_date' =>
                    $existing->due_date,

                'due_date_vendor' =>
                    $existing->due_date_vendor,

                'ticket_query_id' =>
                    $existing->ticket_query_id,

                'umrah_query_id' =>
                    $existing->umrah_query_id,

                'remarks' =>
                    $existing->remarks,

                'supervised' =>
                    (bool)
                    $existing->supervised,

                'is_active' =>
                    (bool)
                    $existing->is_active,

                /*
                 * ADD must not change the invoice status.
                 */
                'status' =>
                    $existing->status,

                'lines' =>
                    $lines,
            ]);

            $data =
                $this->validateInvoice(
                    $request
                );

            /*
             * Keep the same invoice number.
             */
            $invoiceNumber =
                (int)
                $existing->legacy_invoice_id;

            /*
             * Keep existing header and only touch updated_at.
             */
            DB::table('invoices')
                ->where(
                    'id',
                    $invoice
                )
                ->update([
                    'updated_at' =>
                        now(),
                ]);

            /*
             * Rebuild all transactions + journal.
             */
            $this->replaceTransactionsAndJournal(
                $invoice,
                $invoiceNumber,
                $data,
                $client,
                $existing->created_by
                    ? (int)
                        $existing->created_by
                    : $request
                        ->user()
                        ->id,
                $request
                    ->user()
                    ->name,
            );

            $savedLines =
                DB::table(
                    'invoice_transactions'
                )
                    ->where(
                        'invoice_id',
                        $invoice
                    )
                    ->count();

            if (
                $savedLines !==
                count($lines)
            ) {
                throw new \RuntimeException(
                    'Transfer line was not added correctly.'
                );
            }
        }
    );

    $lineCount =
        (int)
        DB::table(
            'invoice_transactions'
        )
            ->where(
                'invoice_id',
                $invoice
            )
            ->count();

    return response()->json([
        'ok' =>
            true,

        'invoice' => [
            'id' =>
                $invoice,

            'invoice_number' =>
                (string)
                $existing->legacy_invoice_id,

            'client_code' =>
                (string)
                $client->code,

            'client_name' =>
                (string)
                $client->name,

            'line_count' =>
                $lineCount,

            'added_line' => [
                'mode' =>
                    'Transfer',

                'passenger_name' =>
                    $passengerName,

                'from' =>
                    $from,

                'to' =>
                    $to,

                'vehicle' =>
                    $vehicle['name'],

                'date' =>
                    $transferDate,

                'flight_info' =>
                    $flightInfo,

                'rate_sar' =>
                    $saleRateSar,

                'vendor_code' =>
                    $vendorSuffix,

                'vendor_amount_sar' =>
                    $vendorAmountSar,

                'currency_code' =>
                    $currencyCode !== ''
                        ? $currencyCode
                        : null,

                'currency_rate' =>
                    $currencyCode !== ''
                        ? $currencyRate
                        : null,
            ],
        ],
    ]);
}


/**
 * Resolve an existing Hotel master record or create a new local
 * Hotel master record when the requested name does not exist.
 */
private function resolveOrCreateWhatsAppHotel(
    string $hotelName,
    string $vendorAccountCode
): array {

    $normalized =
        mb_strtolower(
            preg_replace(
                '/\s+/',
                ' ',
                trim($hotelName)
            )
        );

    /*
     * 1. Prefer an actual local Hotel master record.
     */
    if (
        Schema::hasTable('hotels')
    ) {
        $columns =
            Schema::getColumnListing(
                'hotels'
            );

        $idColumn =
            $this->firstExisting(
                $columns,
                [
                    'id',
                    'hotel_id',
                ]
            );

        $nameColumn =
            $this->firstExisting(
                $columns,
                [
                    'name',
                    'hotel_name',
                ]
            );

        if (
            $idColumn !== null &&
            $nameColumn !== null
        ) {
            $local =
                DB::table('hotels')
                    ->whereRaw(
                        'LOWER(TRIM(`' .
                        $nameColumn .
                        '`)) = ?',
                        [
                            $normalized,
                        ]
                    )
                    ->first();

            if (
                $local
            ) {
                $cityColumn =
                    $this->firstExisting(
                        $columns,
                        [
                            'city',
                            'city_name',
                            'sector',
                            'location',
                        ]
                    );

                return [
                    'hotel_id' =>
                        (int)
                        $local->{$idColumn},

                    'legacy_hotel_id' =>
                        null,

                    'name' =>
                        (string)
                        (
                            $local->{$nameColumn}
                            ?? $hotelName
                        ),

                    'city' =>
                        $cityColumn !== null
                            ? (string)
                                (
                                    $local->{$cityColumn}
                                    ?? ''
                                )
                            : '',
                ];
            }
        }
    }

    /*
     * 2. If it exists only in the migrated Accu Hotel master,
     *    use its legacy hotel ID rather than creating a duplicate.
     */
    foreach (
        $this->hotelOptions()
        as $option
    ) {
        $optionName =
            mb_strtolower(
                preg_replace(
                    '/\s+/',
                    ' ',
                    trim(
                        (string)
                        (
                            $option['name']
                            ?? ''
                        )
                    )
                )
            );

        if (
            $optionName !==
            $normalized
        ) {
            continue;
        }

        $legacyHotelId =
            ! empty(
                $option[
                    'legacy_hotel_id'
                ]
            )
                ? (int)
                    $option[
                        'legacy_hotel_id'
                    ]
                : null;

        /*
         * Only use the migrated option here if it is
         * genuinely backed by a legacy Hotel ID.
         */
        if (
            $legacyHotelId !== null
        ) {
            return [
                'hotel_id' =>
                    null,

                'legacy_hotel_id' =>
                    $legacyHotelId,

                'name' =>
                    (string)
                    (
                        $option['name']
                        ?? $hotelName
                    ),

                'city' =>
                    (string)
                    (
                        $option['city']
                        ?? ''
                    ),
            ];
        }
    }

    /*
     * 3. It does not exist.
     *
     * Create it using the SAME hotel-master creation logic
     * already used by the Sales form.
     */
    $hotelRequest =
        Request::create(
            '/whatsapp-bot/internal/hotel',
            'POST',
            [
                'name' =>
                    trim($hotelName),

                'city' =>
                    '',

                'vendor_account_code' =>
                    $vendorAccountCode,
            ]
        );

    $response =
        $this->storeServiceOption(
            $hotelRequest,
            'hotels',
            'hotel',
            [
                'name',
                'hotel_name',
            ],
            [
                'city',
                'city_name',
                'sector',
                'location',
            ],
            []
        );

    if (
        $response->getStatusCode() >=
        300
    ) {
        $payload =
            $response->getData(
                true
            );

        throw ValidationException::withMessages([
            'hotel_name' =>
                $payload['message']
                ?? 'Unable to create the Hotel master record.',
        ]);
    }

    $payload =
        $response->getData(
            true
        );

    $created =
        $payload['hotel']
        ?? null;

    if (
        ! is_array($created)
        || empty($created['id'])
    ) {
        throw new \RuntimeException(
            'Hotel was created but could not be resolved.'
        );
    }

    return [
        'hotel_id' =>
            (int) $created['id'],

        'legacy_hotel_id' =>
            null,

        'name' =>
            (string)
            (
                $created['name']
                ?? $hotelName
            ),

        'city' =>
            (string)
            (
                $created['city']
                ?? ''
            ),
    ];
}

    public function update(Request $request, int $invoice): RedirectResponse
    {
        $data = $this->validateInvoice($request);

        DB::transaction(function () use ($data, $invoice, $request): void {
            $existing = DB::table('invoices')
                ->where('id', $invoice)
                ->lockForUpdate()
                ->first();

            abort_unless($existing, 404);

            $existingNativeTransactions = $this->nativeTransactionsForInvoice(
                $invoice,
                (int) $existing->legacy_invoice_id,
            );

            if ($existingNativeTransactions->isEmpty()) {
                $legacy = $this->loadLegacyInvoiceContext([(int) $existing->legacy_invoice_id]);
                $legacyContext = $legacy[(string) ((int) $existing->legacy_invoice_id)] ?? null;
                if (
                    $legacyContext !== null
                    && (
                        ($legacyContext['legacy_invoice'] ?? null) !== null
                        || !empty($legacyContext['tickets'])
                        || !empty($legacyContext['master'])
                    )
                ) {
                    abort(409, 'Historical Accu-Travel invoices are read-only.');
                }
            }


            $client = DB::table('accounts')
                ->select('id', 'code', 'name')
                ->where('id', $data['client_account_id'])
                ->first();

            $this->assertAccountType($client, 'client');

            $invoiceNumber = (int) $existing->legacy_invoice_id;

            DB::table('invoices')
                ->where('id', $invoice)
                ->update([
                    'invoice_date' => $data['invoice_date'],
                    'ref_no' => $data['ref_no'] ?: null,
                    'client_account_id' => (int) $client->id,
                    'employee' => $data['employee'] ?: null,
                    'supervised' => $data['supervised'] ? 1 : 0,
                    'sales_tax_invoice_no' => $data['sales_tax_invoice_no'] ?: null,
                    'payment_terms' => $data['payment_terms'] ?: null,
                    'due_date' => $data['due_date'] ?: null,
                    'ticket_query_id' => $data['ticket_query_id'] ?: null,
                    'remarks' => $data['remarks'] ?: null,
                    'branch_id' => $data['branch_id'],
                    'department_id' => $data['department_id'],
                    'status' => $data['status'],
                    'is_active' => $data['is_active'] ? 1 : 0,
                    'due_date_vendor' => $data['due_date_vendor'] ?: null,
                    'umrah_query_id' => $data['umrah_query_id'] ?: null,
                    'updated_at' => now(),
                ]);

            $this->replaceTransactionsAndJournal(
                $invoice,
                $invoiceNumber,
                $data,
                $client,
                $existing->created_by ? (int) $existing->created_by : $request->user()->id,
                $request->user()->name,
            );

            $savedLineCount = DB::table('invoice_transactions')
                ->where('invoice_id', $invoice)
                ->count();

            if ($savedLineCount !== count($data['lines'])) {
                throw new \RuntimeException(
                    'Invoice lines were not saved. Expected '
                    . count($data['lines'])
                    . ' but saved '
                    . $savedLineCount
                    . '.'
                );
            }
        });

        return to_route('invoices.edit', ['invoice' => $invoice])
            ->with('success', 'Invoice updated successfully.');
    }

    public function destroy(int $invoice): RedirectResponse
    {
        DB::transaction(function () use ($invoice): void {
            $header = DB::table('invoices')
                ->where('id', $invoice)
                ->lockForUpdate()
                ->first();

            abort_unless($header, 404);

            if (! $this->isNativeInvoice($invoice)) {
                abort(409, 'Historical Accu-Travel invoices are read-only and cannot be deleted.');
            }

            $journalEntryIds = DB::table('journal_entries')
                ->where('invoice_id', $invoice)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->filter()
                ->values()
                ->all();

            if ($journalEntryIds !== []) {
                DB::table('journal_entry_lines')
                    ->whereIn('journal_entry_id', $journalEntryIds)
                    ->delete();

                DB::table('journal_entries')
                    ->whereIn('id', $journalEntryIds)
                    ->delete();
            }

            DB::table('invoice_transactions')
                ->where('invoice_id', $invoice)
                ->delete();

            DB::table('invoices')
                ->where('id', $invoice)
                ->delete();
        });

        return to_route('invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }

    private function validateInvoice(Request $request): array
    {
        $data = $request->validate([
            'invoice_date' => ['required', 'date'],
            'ref_no' => ['nullable', 'string', 'max:255'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'client_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'employee' => ['nullable', 'string', 'max:255'],
            'sales_tax_invoice_no' => ['nullable', 'integer'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'due_date_vendor' => ['nullable', 'date'],
            'ticket_query_id' => ['nullable', 'integer'],
            'umrah_query_id' => ['nullable', 'integer'],
            'remarks' => ['nullable', 'string'],
            'supervised' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'status' => ['required', 'string', 'max:255'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.mode' => ['required', 'in:' . implode(',', self::MODES)],
            'lines.*.type' => ['nullable', 'string', 'max:100'],
            'lines.*.airline_code' => ['nullable', 'string', 'max:20'],
            'lines.*.passenger_name' => ['nullable', 'string', 'max:255'],
            'lines.*.passport_no' => ['nullable', 'string', 'max:255'],
            'lines.*.nationality' => ['nullable', 'string', 'max:100'],
            'lines.*.passenger_type' => ['nullable', 'string', 'max:50'],
            'lines.*.group_no' => ['nullable', 'string', 'max:100'],
            'lines.*.phone' => ['nullable', 'string', 'max:100'],
            'lines.*.address' => ['nullable', 'string', 'max:500'],
            'lines.*.dob' => ['nullable', 'date'],
            'lines.*.payable_account_code' => ['nullable', 'string', 'exists:accounts,code'],
            'lines.*.payable_account_2' => ['nullable', 'string', 'exists:accounts,code'],
            'lines.*.payable_account_3' => ['nullable', 'string', 'exists:accounts,code'],
            'lines.*.vendor_amount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.vendor_amount_2' => ['nullable', 'numeric', 'min:0'],
            'lines.*.vendor_amount_3' => ['nullable', 'numeric', 'min:0'],
            'lines.*.receivable_amount' => ['required', 'numeric', 'min:0'],
            'lines.*.revenue_account_code' => ['nullable', 'string', 'exists:accounts,code'],
            'lines.*.ticket_no' => ['nullable', 'string', 'max:255'],
            'lines.*.con_ticket_no' => ['nullable', 'string', 'max:255'],
            'lines.*.ticket_type' => ['nullable', 'string', 'max:100'],
            'lines.*.sector' => ['nullable', 'string', 'max:500'],
            'lines.*.departure_date' => ['nullable', 'date'],
            'lines.*.return_date' => ['nullable', 'date'],
            'lines.*.flight_no' => ['nullable', 'string', 'max:100'],
            'lines.*.pnr' => ['nullable', 'string', 'max:100'],
            'lines.*.route' => ['nullable', 'string', 'max:500'],
            'lines.*.gds' => ['nullable', 'string', 'max:100'],
            'lines.*.class' => ['nullable', 'string', 'max:100'],
            'lines.*.xo' => ['nullable', 'string', 'max:100'],
            'lines.*.visa_no' => ['nullable', 'string', 'max:255'],
            'lines.*.documents' => ['nullable', 'string', 'max:255'],
            'lines.*.package' => ['nullable', 'string', 'max:500'],
            'lines.*.hotel_name' => ['nullable', 'string', 'max:255'],
            'lines.*.confirm_no' => ['nullable', 'string', 'max:255'],
            'lines.*.hotel_id' => ['nullable', 'integer'],
            'lines.*.legacy_hotel_id' => ['nullable', 'integer'],
            'lines.*.vehicle_id' => ['nullable', 'integer'],
            'lines.*.room_type' => ['nullable', 'string', 'max:255'],
            'lines.*.meal' => ['nullable', 'string', 'max:100'],
            'lines.*.room_no' => ['nullable', 'string', 'max:100'],
            'lines.*.room_quantity' => ['nullable', 'numeric', 'min:0'],
'lines.*.quantity' => ['nullable', 'numeric', 'min:0'],
'lines.*.nights' => ['nullable', 'integer', 'min:0'],
'lines.*.rate' => ['nullable', 'numeric', 'min:0'],
'lines.*.vendor_rate_per_night' => ['nullable', 'numeric', 'min:0'],
            'lines.*.internal_ref_no' => ['nullable', 'string', 'max:255'],
            'lines.*.confirm_no' => ['nullable', 'string', 'max:255'],
            'lines.*.sector_to' => ['nullable', 'string', 'max:255'],
            'lines.*.flight_information' => ['nullable', 'string', 'max:500'],
            'lines.*.package' => ['nullable', 'string', 'max:500'],
            'lines.*.starting_date' => ['nullable', 'date'],
            'lines.*.ending_date' => ['nullable', 'date'],
            'lines.*.online_date' => ['nullable', 'date'],
            'lines.*.other_service_charges' => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.insurance' => ['nullable', 'numeric', 'min:0'],
            'lines.*.psf' => ['nullable', 'numeric', 'min:0'],
            'lines.*.psf_amount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.commission_receivable' => ['nullable', 'numeric', 'min:0'],
            'lines.*.commission_paid' => ['nullable', 'numeric', 'min:0'],
            'lines.*.commission_to_client' => ['nullable', 'numeric', 'min:0'],
            'lines.*.fare' => ['nullable', 'numeric', 'min:0'],
            'lines.*.sp_apt' => ['nullable', 'numeric', 'min:0'],
            'lines.*.sf_ftt' => ['nullable', 'numeric', 'min:0'],
            'lines.*.aq_pk_yr' => ['nullable', 'numeric', 'min:0'],
            'lines.*.fed_rg_cvt' => ['nullable', 'numeric', 'min:0'],
            'lines.*.ced' => ['nullable', 'numeric', 'min:0'],
            'lines.*.jo' => ['nullable', 'numeric', 'min:0'],
            'lines.*.wh_airlines' => ['nullable', 'numeric', 'min:0'],
            'lines.*.wh_client' => ['nullable', 'numeric', 'min:0'],
            'lines.*.yq' => ['nullable', 'numeric', 'min:0'],
            'lines.*.xut' => ['nullable', 'numeric', 'min:0'],
            'lines.*.other_tax' => ['nullable', 'numeric', 'min:0'],
            'lines.*.xz' => ['nullable', 'numeric', 'min:0'],
            'lines.*.yd' => ['nullable', 'numeric', 'min:0'],
            'lines.*.fare_including' => ['nullable', 'numeric', 'min:0'],
            'lines.*.taxes_including' => ['nullable', 'numeric', 'min:0'],
            'lines.*.pst_percentage' => ['nullable', 'numeric', 'min:0'],
            'lines.*.pst' => ['nullable', 'numeric', 'min:0'],
            'lines.*.pst_paid' => ['nullable', 'numeric', 'min:0'],
            'lines.*.fare_nc' => ['nullable', 'numeric', 'min:0'],
            'lines.*.currency_code' => ['nullable', 'string', 'max:20'],
            'lines.*.currency_quantity' => ['nullable', 'numeric', 'min:0'],
            'lines.*.currency_rate' => ['nullable', 'numeric', 'min:0'],
            'lines.*.agent_code' => ['nullable', 'string', 'max:100'],
            'lines.*.agent_amount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.particulars_2' => ['nullable', 'string', 'max:500'],
            'lines.*.particulars_3' => ['nullable', 'string', 'max:500'],
        ]);

        $client = DB::table('accounts')->select('id', 'code', 'name')->where('id', $data['client_account_id'])->first();
        $this->assertAccountType($client, 'client');

        $totalReceivable = 0.0;
        $totalVendor = 0.0;

        foreach ($data['lines'] as $index => &$line) {
            $mode = trim((string) ($line['mode'] ?? 'Other'));
            $agentAmount = round((float) ($line['agent_amount'] ?? 0), 4);


            if ($mode === 'Ticket') {
                // Ticket legacy behavior:
                // customer receivable is the gross charge, agent commission
                // is an additional customer-side charge, and service profit
                // is the base sale (gross charge less agent commission) less
                // the ticket/vendor cost. With no agent, agentAmount is zero.
                $enteredReceivable = round((float) ($line['receivable_amount'] ?? 0), 4);
                $quantity = max((float) ($line['quantity'] ?? 1), 1);
                $rate = max((float) ($line['rate'] ?? 0), 0);
                $baseSale = $rate > 0
                    ? round($rate * $quantity, 4)
                    : max(round($enteredReceivable - $agentAmount, 4), 0);
                $receivable = $rate > 0
                    ? round($baseSale + $agentAmount, 4)
                    : $enteredReceivable;
                $vendor = round(
                    (float) ($line['vendor_amount'] ?? 0)
                    + (float) ($line['vendor_amount_2'] ?? 0)
                    + (float) ($line['vendor_amount_3'] ?? 0),
                    4
                );


                $profit = round($baseSale - $vendor, 4);

                if ($agentAmount > 0.00005) {
                    $agentCode = trim((string) ($line['agent_code'] ?? ''));
                    if ($agentCode === '') {
                        throw ValidationException::withMessages([
                            "lines.{$index}.agent_code" => 'Select the agent / commission account when an agent amount is entered.',
                        ]);
                    }
                    $this->assertOptionalAccountType($agentCode, 'agent', $index, 'agent_code');
                }

                $line['receivable_amount'] = $receivable;
            } elseif (in_array($mode, ['Hotel', 'Visa', 'Transfer'], true)) {
                if ($mode === 'Hotel') {
                    $nights = max((float) ($line['nights'] ?? 0), 0);
                    $rooms = max((float) ($line['room_quantity'] ?? 1), 1);
                    $units = $nights * $rooms;
                    $rate = max((float) ($line['rate'] ?? 0), 0);
                    $baseSale = $rate > 0 && $units > 0
                        ? round($rate * $units, 4)
                        : max(round((float) ($line['receivable_amount'] ?? 0) - $agentAmount, 4), 0);

                    $vendor = round(
                        (float) ($line['vendor_rate_per_night'] ?? 0) * $units
                        + (float) ($line['vendor_amount_2'] ?? 0)
                        + (float) ($line['vendor_amount_3'] ?? 0),
                        4
                    );

                    // Hotel legacy behavior: agent commission is charged to
                    // the customer separately and posted to the agent account.
                    $receivable = round($baseSale + $agentAmount, 4);
                    $profit = round($baseSale - $vendor, 4);
                } elseif ($mode === 'Visa') {
                    $quantity = max((float) ($line['quantity'] ?? 1), 1);
                    $rate = max((float) ($line['rate'] ?? 0), 0);
                    $baseSale = $rate > 0
                        ? round($rate * $quantity, 4)
                        : round((float) ($line['receivable_amount'] ?? 0), 4);

                    $vendor = round(
                        (float) ($line['vendor_amount'] ?? 0)
                        + (float) ($line['vendor_amount_2'] ?? 0)
                        + (float) ($line['vendor_amount_3'] ?? 0),
                        4
                    );

                    // Visa commission is charged separately to the customer
                    // and posted to the selected agent account.
                    $receivable = round($baseSale + $agentAmount, 4);
                    $profit = round($baseSale - $vendor, 4);
                } else {
                    // Transfer follows the legacy transfer structure:
                    // customer receivable = customer sale + agent commission,
                    // vendor payable = transport cost, and service profit is
                    // customer sale less transport cost. The agent commission
                    // is a separate credit to the selected agent account.
                    $quantity = max((float) ($line['quantity'] ?? 1), 1);
                    $rate = max((float) ($line['rate'] ?? 0), 0);
                    $baseSale = $rate > 0
                        ? round($rate * $quantity, 4)
                        : max(round((float) ($line['receivable_amount'] ?? 0) - $agentAmount, 4), 0);

                    $vendor = round(
                        (float) ($line['vendor_amount'] ?? 0)
                        + (float) ($line['vendor_amount_2'] ?? 0)
                        + (float) ($line['vendor_amount_3'] ?? 0),
                        4
                    );

                    $receivable = round($baseSale + $agentAmount, 4);
                    $profit = round($baseSale - $vendor, 4);
                }

                $line['receivable_amount'] = $receivable;

                if ($agentAmount > 0.00005) {
                    $agentCode = trim((string) ($line['agent_code'] ?? ''));
                    if ($agentCode === '') {
                        throw ValidationException::withMessages([
                            "lines.{$index}.agent_code" => 'Select the agent / commission account when an agent amount is entered.',
                        ]);
                    }
                    $this->assertOptionalAccountType($agentCode, 'agent', $index, 'agent_code');
                }

            } elseif ($mode === 'Other') {
                // Other services use the same optional customer-side agent
                // commission model as Ticket: base sale + agent = gross
                // customer receivable, while profit remains sale less cost.
                $quantity = max((float) ($line['quantity'] ?? 1), 1);
                $rate = max((float) ($line['rate'] ?? 0), 0);
                $enteredReceivable = round((float) ($line['receivable_amount'] ?? 0), 4);
                $baseSale = $rate > 0
                    ? round($rate * $quantity, 4)
                    : max(round($enteredReceivable - $agentAmount, 4), 0);

                $vendor = round(
                    (float) ($line['vendor_amount'] ?? 0)
                    + (float) ($line['vendor_amount_2'] ?? 0)
                    + (float) ($line['vendor_amount_3'] ?? 0),
                    4
                );

                $receivable = round($baseSale + $agentAmount, 4);
                $profit = round($baseSale - $vendor, 4);

                if ($agentAmount > 0.00005) {
                    $agentCode = trim((string) ($line['agent_code'] ?? ''));
                    if ($agentCode === '') {
                        throw ValidationException::withMessages([
                            "lines.{$index}.agent_code" => 'Select the agent / commission account when an agent amount is entered.',
                        ]);
                    }
                    $this->assertOptionalAccountType($agentCode, 'agent', $index, 'agent_code');
                }

                $line['receivable_amount'] = $receivable;
            } else {
                $receivable = round((float) ($line['receivable_amount'] ?? 0), 4);
                $vendor = round(
                    (float) ($line['vendor_amount'] ?? 0)
                    + (float) ($line['vendor_amount_2'] ?? 0)
                    + (float) ($line['vendor_amount_3'] ?? 0),
                    4
                );

                $profit = round($receivable - $vendor, 4);
            }

            if (abs($profit) > 0.00005 && trim((string) ($line['revenue_account_code'] ?? '')) === '') {
                throw ValidationException::withMessages([
                    "lines.{$index}.revenue_account_code" => 'Select the income/service account for this line.',
                ]);
            }

            $allowCustomerAsPayable =
    $request->header('X-Inertia') === 'true';

$this->assertInvoicePayableAccountType(
    $line['payable_account_code'] ?? null,
    $index,
    'payable_account_code',
    $allowCustomerAsPayable,
);

$this->assertInvoicePayableAccountType(
    $line['payable_account_2'] ?? null,
    $index,
    'payable_account_2',
    $allowCustomerAsPayable,
);

$this->assertInvoicePayableAccountType(
    $line['payable_account_3'] ?? null,
    $index,
    'payable_account_3',
    $allowCustomerAsPayable,
);

            if (in_array($mode, ['Transfer', 'Ticket'], true)) {
                $vendorChecks = [
                    ['payable_account_code', 'vendor_amount', 'Select the main payable/vendor account for the Transfer line.'],
                    ['payable_account_2', 'vendor_amount_2', 'Select Vendor 2 account when Vendor Amount 2 is entered.'],
                    ['payable_account_3', 'vendor_amount_3', 'Select Vendor 3 account when Vendor Amount 3 is entered.'],
                ];

                foreach ($vendorChecks as [$accountField, $amountField, $message]) {
                    if ((float) ($line[$amountField] ?? 0) > 0.00005
                        && trim((string) ($line[$accountField] ?? '')) === '') {
                        throw ValidationException::withMessages([
                            "lines.{$index}.{$accountField}" => $message,
                        ]);
                    }
                }
            }

            if (!empty($line['revenue_account_code'])) {
                $this->assertOptionalAccountType($line['revenue_account_code'], 'income', $index, 'revenue_account_code');
            }

            $line['_receivable'] = $receivable;
            $line['_vendor'] = $vendor;
            $line['_profit'] = $profit;
            $totalReceivable += $receivable;
            $totalVendor += $vendor;
        }
        unset($line);

        if ($totalReceivable <= 0.00005 && $totalVendor <= 0.00005) {
            throw ValidationException::withMessages([
                'lines' => 'Enter at least one sales line with a receivable amount or vendor cost.',
            ]);
        }

        $data['is_active'] = $request->boolean(
            'is_active',
            $request->boolean('active', true)
        );

        return $data;
    }

    /**
     * Load native invoice transactions using the normalized invoice FK first.
     *
     * Some older native saves populated legacy_invoice_id but missed invoice_id.
     * Falling back to the legacy invoice number keeps those rows visible while
     * new saves continue to use the proper invoice_id relationship.
     */
    private function nativeInvoiceIds(array $invoiceIds): array
    {
        $invoiceIds = collect($invoiceIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();
        if ($invoiceIds === []) return [];

        $native = [];
        $journals = DB::table('journal_entries')
            ->whereIn('invoice_id', $invoiceIds)
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->select('invoice_id', 'legacy_data')
            ->orderByDesc('id')
            ->get();
        foreach ($journals as $journal) {
            $decoded = json_decode((string) ($journal->legacy_data ?? ''), true);
            if (is_array($decoded) && !empty($decoded['native'])) {
                $native[(int) $journal->invoice_id] = true;
            }
        }

        // Do not inspect invoice_transactions.legacy_data here: that column
        // does not exist in the current production/dev schema. Native invoices
        // are already stamped on journal_entries.legacy_data by the native save
        // workflow, so the journal marker is sufficient and schema-safe.

        return array_keys($native);
    }

    private function isNativeInvoice(int $invoiceId): bool
    {
        return in_array($invoiceId, $this->nativeInvoiceIds([$invoiceId]), true);
    }

    private function nativeTransactionsForInvoice(
        int $invoiceId,
        ?int $legacyInvoiceId = null,
    ): Collection {
        $transactions = DB::table('invoice_transactions')
            ->where('invoice_id', $invoiceId)
            ->orderBy('id')
            ->get();

        if ($transactions->isEmpty() && $legacyInvoiceId !== null && $legacyInvoiceId > 0) {
            $transactions = DB::table('invoice_transactions')
                ->where('legacy_invoice_id', $legacyInvoiceId)
                ->orderBy('id')
                ->get();
        }

        return $transactions;
    }

    /**
     * Return native invoice financial totals and line count. Prefer invoice_id,
     * but recover rows that were created against legacy_invoice_id only.
     */
    private function nativeInvoiceFinancials(
        int $invoiceId,
        ?int $legacyInvoiceId = null,
    ): array {
        $query = DB::table('invoice_transactions')
            ->where('invoice_id', $invoiceId);

        $lineCount = (int) (clone $query)->count();

        if ($lineCount === 0 && $legacyInvoiceId !== null && $legacyInvoiceId > 0) {
            $query = DB::table('invoice_transactions')
                ->where('legacy_invoice_id', $legacyInvoiceId);
            $lineCount = (int) (clone $query)->count();
        }

        $financials = $query
            ->selectRaw('COALESCE(SUM(COALESCE(total_fare, 0)), 0) AS receivable')
            ->selectRaw(
                    "COALESCE(SUM(
                        COALESCE(rate_vendor, vendor_rate, 0)
                        + COALESCE(fare_2, 0)
                        + COALESCE(fare_3, 0)
                        + CASE
                            WHEN UPPER(TRIM(COALESCE(mode, ''))) IN ('HOTEL', 'VISA', 'TRANSFER', 'TICKET', 'OTHER')
                            THEN COALESCE(agent_amount, 0)
                            ELSE 0
                          END
                    ), 0) AS payable"
                )
            ->selectRaw(
                "COALESCE(SUM(
                    COALESCE(total_fare, 0)
                    - (COALESCE(rate_vendor, vendor_rate, 0) + COALESCE(fare_2, 0) + COALESCE(fare_3, 0))
                    - CASE WHEN UPPER(TRIM(COALESCE(mode, ''))) IN ('HOTEL', 'VISA', 'TRANSFER', 'TICKET', 'OTHER') THEN COALESCE(agent_amount, 0) ELSE 0 END
                ), 0) AS profit"
            )
            ->first();

        return [
            (float) ($financials?->receivable ?? 0),
            (float) ($financials?->payable ?? 0),
            $lineCount,
            (float) ($financials?->profit ?? 0),
        ];
    }

    private function replaceTransactionsAndJournal(
        int $invoiceId,
        int $invoiceNumber,
        array $data,
        object $client,
        int $createdBy,
        string $entryBy,
    ): void {
        $journal = DB::table('journal_entries')
            ->where('invoice_id', $invoiceId)
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        $journalPayload = [
            'legacy_reference_type' => 'invoice',
            'legacy_reference_id' => $invoiceNumber,
            'legacy_system_id' => null,
            'voucher_type' => 'INV',
            'voucher_id' => null,
            'invoice_id' => $invoiceId,
            'created_by' => $journal?->created_by ?? $createdBy,
            'branch_id' => $data['branch_id'],
            'department_id' => $data['department_id'],
            'legacy_branch_id' => null,
            'legacy_department_id' => null,
            'entry_date' => $data['invoice_date'],
            'last_posting_date' => $data['invoice_date'],
            'source_modes' => implode(', ', array_values(array_unique(array_map(
                fn ($line) => (string) $line['mode'],
                $data['lines'],
            )))),
            'source_system_ids' => null,
            'total_debit' => 0,
            'total_credit' => 0,
            'line_count' => 0,
            'is_balanced' => true,
            'legacy_data' => json_encode([
                'native' => true,
                'form_type' => 'INV',
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
            ], JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ];

        if ($journal) {
            DB::table('journal_entries')->where('id', $journal->id)->update($journalPayload);
            $journalEntryId = (int) $journal->id;
        } else {
            $journalPayload['created_at'] = now();
            $journalEntryId = (int) DB::table('journal_entries')->insertGetId($journalPayload);
        }

        DB::table('invoice_transactions')->where('invoice_id', $invoiceId)->delete();
        DB::table('journal_entry_lines')->where('journal_entry_id', $journalEntryId)->delete();

        $transactionRows = [];
        $journalRows = [];

        $nextLegacyTransactionId = (int) (
            DB::table('invoice_transactions')
                ->lockForUpdate()
                ->max('legacy_transaction_id')
            ?? 0
        ) + 1;

        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $journalLineCount = 0;

        foreach ($data['lines'] as $index => $line) {
            $receivable = (float) $line['_receivable'];
            $vendor1 = (float) ($line['vendor_amount'] ?? 0);
            $vendor2 = (float) ($line['vendor_amount_2'] ?? 0);
            $vendor3 = (float) ($line['vendor_amount_3'] ?? 0);
            $profit = (float) $line['_profit'];
            $subId = (string) ($index + 1);

            $departureDate = $this->nullableDate(
                !empty($line['departure_date'])
                    ? $line['departure_date']
                    : ($line['starting_date'] ?? null)
            );

            $returnDate = $this->nullableDate(
                !empty($line['return_date'])
                    ? $line['return_date']
                    : ($line['ending_date'] ?? null)
            );

            $transactionRows[] = [
                'legacy_transaction_id' => $nextLegacyTransactionId++,
                'legacy_invoice_id' => $invoiceNumber,
                'invoice_id' => $invoiceId,
                'mode' => $line['mode'],
                'type' => $line['type'] ?: 'Normal',
                'airline_code' => $line['airline_code'] ?: null,
                'ticket_no' => $line['ticket_no'] ?: null,
                'con_ticket_no' => $line['con_ticket_no'] ?: null,
                'ticket_type' => $line['ticket_type'] ?: null,
                'payable_account_code' => $line['payable_account_code'] ?: null,
                'passenger_name' => $line['passenger_name'] ?: null,
                'passport_no' => $line['passport_no'] ?: null,
                'address' => $line['address'] ?: null,
                'phone' => $line['phone'] ?: null,
                'dob' => $line['dob'] ?: null,
                'sector' => $line['sector'] ?: null,
                'departure_date' => $departureDate,
                'flight_no' => $line['flight_no'] ?: null,
                'pnr' => $line['pnr'] ?: null,
                'route' => $line['route'] ?: null,
                'passenger_type' => $line['passenger_type'] ?? 'Adult',
                'xo' => $line['xo'] ?: null,
                'fare' => $line['fare'] ?? 0,
                'sp_apt' => $line['sp_apt'] ?? 0,
                'sf_ftt' => $line['sf_ftt'] ?? 0,
                'aq_pk_yr' => $line['aq_pk_yr'] ?? 0,
                'fed_rg_cvt' => $line['fed_rg_cvt'] ?? 0,
                'ced' => $line['ced'] ?? 0,
                'jo' => $line['jo'] ?? 0,
                'wh_airlines' => $line['wh_airlines'] ?? 0,
                'wh_client' => $line['wh_client'] ?? 0,
                'yq' => $line['yq'] ?? 0,
                'xut' => $line['xut'] ?? 0,
                'other' => $line['other_tax'] ?? 0,
                'commission_receivable' => $line['commission_receivable'] ?? 0,
                'commission_paid' => $line['commission_paid'] ?? 0,
                'psf' => $line['psf'] ?? 0,
                'other_service_charges' => $line['other_service_charges'] ?? 0,
                'discount' => $line['discount'] ?? 0,
                'insurance' => $line['insurance'] ?? 0,
                'fare_2' => $vendor2,
                'fare_3' => $vendor3,
                'payable_account_2' => $line['payable_account_2'] ?: null,
                'payable_account_3' => $line['payable_account_3'] ?: null,
                'doc_rec' => $line['documents'] ?: null,
                'fare_nc' => $line['fare_nc'] ?? 0,
                'father_name' => null,
                'birth_place' => null,
                'doi' => null,
                'doe' => $returnDate,
                'relation' => null,
                'particulars_2' => $this->detailParticular2($line),
                'particulars_3' => $this->detailParticular3($line),
                'particulars_4' => null,
                'class' => $line['class'] ?: null,
                'xz' => null,
                'yd' => null,
                'other_service_account' => $line['revenue_account_code'] ?: null,
                'total_fare' => $receivable,
                'return_date' => $returnDate,
                'gds' => $line['gds'] ?: null,
                'online_date' => $this->nullableDate($line['online_date'] ?? null),
                'group_no' => $line['group_no'] ?? null,
                'cnic' => null,
                'hotel_id_legacy' => (
                    !empty($line['legacy_hotel_id'])
                        ? (int) $line['legacy_hotel_id']
                        : (
                            isset($line['hotel_id']) && (int) $line['hotel_id'] > 0
                                ? (int) $line['hotel_id']
                                : null
                        )
                ),
                'vehicle_id_legacy' => $line['vehicle_id'] ?? null,
                'ref_no' => $data['ref_no'] ?: null,
                'nights' => $line['nights'] ?? null,
                'tact_rate' => 0,
                'gross_weight' => 0,
                'awc' => 0,
                'fsc' => 0,
                'gtc' => 0,
                'ssccgc' => 0,
                'rate' => $line['rate'] ?? 0,
                'net_rate' => $receivable,
                'commission_to_client' => $line['commission_to_client'] ?? 0,
                'fare_including' => $line['fare_including'] ?? 0,
                'taxes_including' => $line['taxes_including'] ?? 0,
                'currency_code' => $line['currency_code'] ?: null,
                'currency_quantity' => $line['currency_quantity'] ?? null,
                'currency_rate' => $line['currency_rate'] ?? null,
                'agent_code' => $line['agent_code'] ?: null,
                'agent_amount' => $line['agent_amount'] ?? 0,
                'pnr_gds' => $line['pnr'] ?: null,
                'pst_percentage' => $line['pst_percentage'] ?? 0,
                'pst' => $line['pst'] ?? 0,
                'pst_paid' => $line['pst_paid'] ?? 0,
                'room_no' => $line['room_no'] ?: null,
                'quantity' => $line['quantity'] ?? 1,
                'meal' => $line['meal'] ?: null,
                'room_quantity' => $line['room_quantity'] ?? null,
                'internal_ref_no' => $line['internal_ref_no'] ?: null,
                'vendor_rate' => $vendor1,
                'rate_vendor' => $vendor1,
                'posting_date' => $data['invoice_date'],
                'room_type' => $line['room_type'] ?: null,
                'sector_to' => $line['sector_to'] ?: null,
                'flight_information' => $line['flight_information'] ?: null,
                'similar_hotel' => 0,
                'email' => null,
                'nationality' => $line['nationality'] ?: null,
                'rate_wd' => null,
                'rate_we' => null,
                'rate_wd_payable' => null,
                'rate_we_payable' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $commonMeta = [
                'native' => true,
                'form_type' => 'INV',
                'SubID' => $subId,
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'mode' => $line['mode'],
                'ui' => array_diff_key(
                    $line,
                    array_flip(['_receivable', '_vendor', '_profit'])
                ),
            ];

            $journalRows[] = $this->journalLine(
                $journalEntryId,
                $invoiceNumber,
                $invoiceId,
                $client,
                $line,
                $data,
                $entryBy,
                $receivable,
                0,
                $profit,
                $commonMeta,
            );
            $totalDebit += $receivable;
            $journalLineCount++;

            $vendorDefinitions = [
                [$line['payable_account_code'] ?? null, $vendor1, 1],
                [$line['payable_account_2'] ?? null, $vendor2, 2],
                [$line['payable_account_3'] ?? null, $vendor3, 3],
            ];

            foreach ($vendorDefinitions as [$accountCode, $amount, $vendorIndex]) {
                if (!$accountCode || (float) $amount <= 0.00005) {
                    continue;
                }

                $vendorAccount = DB::table('accounts')
                    ->select('id', 'code', 'name')
                    ->where('code', $accountCode)
                    ->first();

                $journalRows[] = $this->journalLine(
                    $journalEntryId,
                    $invoiceNumber,
                    $invoiceId,
                    $vendorAccount,
                    $line,
                    $data,
                    $entryBy,
                    0,
                    (float) $amount,
                    0,
                    array_merge($commonMeta, [
                        'role' => 'vendor',
                        'vendor_index' => $vendorIndex,
                    ]),
                );
                $totalCredit += (float) $amount;
                $journalLineCount++;
            }

            $agentAmount = round((float) ($line['agent_amount'] ?? 0), 4);
            if (
                in_array((string) ($line['mode'] ?? ''), ['Hotel', 'Visa', 'Transfer', 'Ticket', 'Other'], true)
                && $agentAmount > 0.00005
            ) {
                $agentCode = trim((string) ($line['agent_code'] ?? ''));
                $agentAccount = DB::table('accounts')
                    ->select('id', 'code', 'name')
                    ->where('code', $agentCode)
                    ->first();

                if (!$agentAccount) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.agent_code" => 'The selected agent / commission account could not be found.',
                    ]);
                }

                $journalRows[] = $this->journalLine(
                    $journalEntryId,
                    $invoiceNumber,
                    $invoiceId,
                    $agentAccount,
                    $line,
                    $data,
                    $entryBy,
                    0,
                    $agentAmount,
                    0,
                    array_merge($commonMeta, [
                        'role' => 'agent',
                    ]),
                );
                $totalCredit += $agentAmount;
                $journalLineCount++;
            }

            if (abs($profit) > 0.00005) {
                $revenueAccount = DB::table('accounts')
                    ->select('id', 'code', 'name')
                    ->where('code', $line['revenue_account_code'])
                    ->first();

                if (!$revenueAccount) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.revenue_account_code" => 'The selected income/service account could not be found.',
                    ]);
                }

                $incomeDebit = $profit < -0.00005 ? abs($profit) : 0.0;
                $incomeCredit = $profit > 0.00005 ? $profit : 0.0;

                $journalRows[] = $this->journalLine(
                    $journalEntryId,
                    $invoiceNumber,
                    $invoiceId,
                    $revenueAccount,
                    $line,
                    $data,
                    $entryBy,
                    $incomeDebit,
                    $incomeCredit,
                    0,
                    array_merge($commonMeta, [
                        'role' => $profit < -0.00005 ? 'loss' : 'income',
                    ]),
                );

                $totalDebit += $incomeDebit;
                $totalCredit += $incomeCredit;
                $journalLineCount++;
            }
        }

        DB::table('invoice_transactions')->insert($transactionRows);
        DB::table('journal_entry_lines')->insert($journalRows);

        if (abs($totalDebit - $totalCredit) > 0.00005) {
            throw new \RuntimeException(
                'Sales journal is not balanced. Debit='
                . $totalDebit
                . ' Credit='
                . $totalCredit
            );
        }

        DB::table('journal_entries')
            ->where('id', $journalEntryId)
            ->update([
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'line_count' => $journalLineCount,
                'is_balanced' => true,
                'updated_at' => now(),
            ]);
    }

    private function journalLine(
        int $journalEntryId,
        int $invoiceNumber,
        int $invoiceId,
        object $account,
        array $line,
        array $data,
        string $entryBy,
        float $debit,
        float $credit,
        float $profit,
        array $meta,
    ): array {
        $sector = trim((string) ($line['sector'] ?? ''));
        $mode = trim((string) ($line['mode'] ?? ''));
        $passenger = trim((string) ($line['passenger_name'] ?? ''));

        $lineMeta = array_merge($meta, [
            'passenger' => $passenger,
            'sector' => $sector,
            'SubID' => (string) ($meta['SubID'] ?? ''),
        ]);

        $descriptionParts = [];
        if ($passenger !== '') {
            $descriptionParts[] = $passenger;
        }

        if ($mode === 'Hotel') {
            $hotelParts = array_filter([
                trim((string) ($line['confirm_no'] ?? '')),
                trim((string) ($line['hotel_name'] ?? '')),
                $sector,
                number_format(max((float) ($line['room_quantity'] ?? 1), 1), 0, '.', ''),
                trim((string) ($line['room_type'] ?? '')),
                $this->formatDescriptionDate($line['starting_date'] ?? null),
                $this->formatDescriptionDate($line['ending_date'] ?? null),
            ], fn ($value) => (string) $value !== '');

            if ($hotelParts !== []) {
                $descriptionParts[] = implode('-', $hotelParts);
            }
            $descriptionParts[] = 'Hotel';
        } elseif ($mode === 'Visa') {
            $package = trim((string) ($line['package'] ?? ''));
            if ($package !== '') {
                $descriptionParts[] = $package;
            } elseif ($sector !== '') {
                $descriptionParts[] = $sector;
            }
            $descriptionParts[] = 'Visa';
        } elseif ($mode === 'Transfer') {
            $transferParts = array_filter([
                $sector,
                trim((string) ($line['sector_to'] ?? '')),
                trim((string) ($line['flight_information'] ?? '')),
                number_format(max((float) ($line['quantity'] ?? 1), 1), 0, '.', ''),
            ], fn ($value) => (string) $value !== '');

            if ($transferParts !== []) {
                $descriptionParts[] = implode('-', $transferParts);
            }
            $descriptionParts[] = 'Transfer';
        } elseif ($mode === 'Ticket') {
            $ticketParts = array_filter([
                trim((string) ($line['ticket_no'] ?? '')),
                $sector,
            ], fn ($value) => (string) $value !== '');

            if ($ticketParts !== []) {
                $descriptionParts[] = implode(' - ', $ticketParts);
            }
        } elseif ($mode === 'Other') {
            $package = trim((string) ($line['package'] ?? ''));
            if ($package !== '') {
                $descriptionParts[] = $package;
            } elseif ($sector !== '') {
                $descriptionParts[] = $sector;
            }
            $descriptionParts[] = 'Other';
        } elseif ($sector !== '') {
            $descriptionParts[] = $sector;
            if ($mode !== '') {
                $descriptionParts[] = $mode;
            }
        } elseif ($mode !== '') {
            $descriptionParts[] = $mode;
        }

        $particulars = implode(' - ', $descriptionParts);
        $currencyCode = trim((string) ($line['currency_code'] ?? ''));

        return [
            'journal_entry_id' => $journalEntryId,
            'legacy_master_id' => null,
            'legacy_reference_id' => $invoiceNumber,
            'legacy_system_id' => null,
            'legacy_reference_type' => 'invoice',
            'voucher_type' => 'INV',
            'mode' => $mode ?: null,
            'account_id' => (int) $account->id,
            'account_code' => (string) $account->code,
            'debit' => round($debit, 4),
            'credit' => round($credit, 4),
            'particulars' => $particulars !== '' ? $particulars : null,
            'voucher_date' => $data['invoice_date'],
            'posting_date' => $data['invoice_date'],
            'voucher_id' => null,
            'invoice_id' => $invoiceId,
            'branch_id' => $data['branch_id'],
            'department_id' => $data['department_id'],
            'legacy_branch_id' => null,
            'legacy_department_id' => null,
            'currency_code' => $currencyCode !== '' ? $currencyCode : null,
            'currency_quantity' => $currencyCode !== ''
                ? ($line['currency_quantity'] ?? null)
                : null,
            'currency_rate' => $currencyCode !== ''
                ? ($line['currency_rate'] ?? null)
                : null,
            'foreign_debit' => $currencyCode !== '' && $line['currency_rate'] !== null && (float) $line['currency_rate'] > 0 && $debit > 0
                ? round($debit / (float) $line['currency_rate'], 6)
                : null,
            'foreign_credit' => $currencyCode !== '' && $line['currency_rate'] !== null && (float) $line['currency_rate'] > 0 && $credit > 0
                ? round($credit / (float) $line['currency_rate'], 6)
                : null,
            'profit' => round($profit, 4),
            'legacy_invoice_no' => (string) $invoiceNumber,
            'legacy_invoice_no_2' => null,
            'ticket_no' => $line['ticket_no'] ?: null,
            'con_ticket_no' => $line['con_ticket_no'] ?: null,
            'passenger' => $passenger ?: null,
            'mode_description' => $mode ?: null,
            'sector_description' => $sector ?: null,
            'fare_taxes_service' => null,
            'entry_by' => $entryBy,
            'umrah_query_id' => $data['umrah_query_id'] ?: null,
            'legacy_data' => json_encode($lineMeta, JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function nextInvoiceNumber(): int
    {
        $last = DB::table('invoices')
            ->select('legacy_invoice_id')
            ->orderByDesc('legacy_invoice_id')
            ->lockForUpdate()
            ->first();

        return ((int) ($last?->legacy_invoice_id ?? 0)) + 1;
    }

    /**
     * Read the real Accu invoice detail/accounting source for a batch of
     * invoice numbers. The normalized tables remain the fallback for native
     * HBA invoices which do not have a matching InvTickets record.
     */
    private function loadLegacyInvoiceContext(array $invoiceNumbers): array
    {
        $invoiceNumbers = collect($invoiceNumbers)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (int) $value)
            ->filter(fn (int $value) => $value > 0)
            ->unique()
            ->values()
            ->all();

        if ($invoiceNumbers === []) {
            return [];
        }

        $contexts = [];
        foreach ($invoiceNumbers as $invoiceNumber) {
            $contexts[(string) $invoiceNumber] = [
                'legacy_invoice' => null,
                'tickets' => collect(),
                'master' => collect(),
                'master_by_subid' => [],
            ];
        }

        try {
            $legacyInvoiceRows = DB::connection('legacy')
                ->table('Invoice')
                ->whereIn('Invoice ID', $invoiceNumbers)
                ->select([
                    'Invoice ID',
                    'Invoice Date',
                    'Ref #',
                    'Client Code',
                    'Entered By',
                    'Date/Time',
                    'InvEnteredby',
                    'InvEntrydate',
                    'Employee',
                    'Supervised',
                    'SupervisedBy',
                    'SalesTaxInvoiceNo',
                    'PaymentTerms',
                    'DueDate',
                    'TicketQueryID',
                    'Remarks',
                    'Branch',
                    'Status',
                    'Select',
                    'Active',
                    'DueDateVendor',
                    'InvoiceType',
                    'Shirka',
                    'UmrahQueryID',
                    'Department',
                ])
                ->get();

            foreach ($legacyInvoiceRows as $invoice) {
                $key = (string) ((int) ($invoice->{'Invoice ID'} ?? 0));
                if (isset($contexts[$key])) {
                    $contexts[$key]['legacy_invoice'] = $invoice;
                    $contexts[$key]['legacy_client_code'] = trim((string) ($invoice->{'Client Code'} ?? ''));
                }
            }
        } catch (\Throwable $e) {
            // Legacy Invoice metadata is supplementary. Detail data below is
            // still attempted, and normalized data remains a safe fallback.
        }

        try {
            $ticketRows = DB::connection('legacy')
                ->table('InvTickets')
                ->whereIn('InvInvoice ID', $invoiceNumbers)
                ->orderBy('InvInvoice ID')
                ->orderBy('InvTransuction ID')
                ->get();

            foreach ($ticketRows as $ticket) {
                $key = (string) ((int) ($ticket->{'InvInvoice ID'} ?? 0));
                if (isset($contexts[$key])) {
                    $contexts[$key]['tickets']->push($ticket);
                }
            }
        } catch (\Throwable $e) {
            // If the legacy detail table is unavailable, callers use the
            // normalized invoice_transactions fallback.
        }

        try {
            $masterRows = DB::connection('legacy')
                ->table('Master')
                ->whereIn('Voucher ID', $invoiceNumbers)
                ->whereRaw("UPPER(TRIM(COALESCE(`Voucher Type`, ''))) = 'INV'")
                ->select([
                    'ID',
                    'Voucher ID',
                    'System ID',
                    'Account Code',
                    'Mode',
                    'Inv Type',
                    'Tick/Chq/Ref',
                    'Ticket Type',
                    'Passenger',
                    'PP',
                    'Sector/Description',
                    'Fare/Taxes/Service',
                    'Debit',
                    'Credit',
                    'Voucher Date',
                    'Posting Date',
                    'Fare',
                    'Taxes',
                    'Service',
                    'Deduction Fee',
                    'Rfd Service Charges',
                    'Ticket No',
                    'Con Ticket No',
                    'FareNZ',
                    'Passenger Type',
                    'Commission',
                    'SubID',
                    'Profit',
                    'Cur',
                    'CurQty',
                    'CurRate',
                    'CurDr',
                    'CurCr',
                    'XO',
                    'EntryDate',
                    'EntryBy',
                    'Branch',
                    'Account2',
                    'ServiceDateFrom',
                    'ServiceDateTo',
                    'Department',
                    'UmrahQueryID',
                    'HotelName',
                ])
                ->orderByRaw('COALESCE(`Posting Date`,`Voucher Date`) ASC')
                ->orderBy('ID')
                ->get();

            foreach ($masterRows as $master) {
                $key = (string) ((int) ($master->{'Voucher ID'} ?? 0));
                if (!isset($contexts[$key])) {
                    continue;
                }

                $contexts[$key]['master']->push($master);

                $subId = $master->{'SubID'} ?? null;
                if ($subId !== null && $subId !== '') {
                    $subKey = (string) ((int) $subId);
                    $contexts[$key]['master_by_subid'][$subKey] ??= collect();
                    $contexts[$key]['master_by_subid'][$subKey]->push($master);
                }
            }
        } catch (\Throwable $e) {
            // Master is used for exact accounting amounts; InvTickets values
            // remain available as a line-level fallback if Master is absent.
        }

        return $contexts;
    }

    private function legacyDetailCountFromMaster(array $context, string $clientCode): int
    {
        $clientCode = trim($clientCode);
        $rows = $context['master'] ?? collect();
        if ($rows->isEmpty()) {
            return 0;
        }

        $clientRows = $rows->filter(function ($row) use ($clientCode): bool {
            $accountCode = trim((string) ($row->{'Account Code'} ?? ''));
            $debit = (float) ($row->{'Debit'} ?? 0);
            $credit = (float) ($row->{'Credit'} ?? 0);

            if ($clientCode !== '' && $accountCode === $clientCode) {
                return true;
            }

            // Accu has rare historical invoices where the client/detail row
            // is not a 12xxxxx account. Do not count vendor/expense/income rows.
            return ($debit > 0.00005 || abs($debit) + abs($credit) <= 0.00005)
                && !str_starts_with($accountCode, '21')
                && !str_starts_with($accountCode, '32')
                && !str_starts_with($accountCode, '42');
        });

        return $clientRows
            ->map(fn ($row) => $row->{'SubID'} ?? null)
            ->filter(fn ($subId) => $subId !== null && $subId !== '')
            ->map(fn ($subId) => (string) (int) $subId)
            ->unique()
            ->count();
    }

    /**
     * Return the customer debit and vendor credit exactly from the legacy
     * Master rows where possible. The selected invoice's client account code
     * identifies the customer-side rows, while 21xxxxx rows are vendor-side.
     */
        /**
     * Build the same line shape used by the native form, but preserve every
     * historical Accu field and pair it with Master accounting rows by SubID.
     */
    /**
     * Resolve the legacy Master accounting rows belonging to one
     * historical InvTickets transaction.
     *
     * Preferred relationship:
     *     InvTickets.InvTransuction ID -> Master.SubID
     *
     * Older Accu records are not always perfectly consistent, so
     * descriptive/reference matching is used as a display-only fallback.
     *
     * This method never modifies legacy data and does not affect the
     * invoice-level authoritative totals.
     */
    private function legacyMasterRowsForTicket(
        array $context,
        object $ticket,
    ): Collection {
        $transactionId = (int) ($ticket->{'InvTransuction ID'} ?? 0);

        $masterBySubId = $context['master_by_subid'] ?? [];

        /*
         * Primary exact relationship.
         */
        if ($transactionId > 0) {
            $exact = $masterBySubId[(string) $transactionId] ?? null;

            if ($exact instanceof Collection && $exact->isNotEmpty()) {
                return $exact;
            }
        }

        $masterRows = $context['master'] ?? collect();

        if ($masterRows->isEmpty()) {
            return collect();
        }

        /*
         * Retry directly against Master.SubID. This handles old records
         * where the grouped map key was not built exactly as expected.
         */
        if ($transactionId > 0) {
            $bySubId = $masterRows->filter(
                fn ($row): bool =>
                    (int) ($row->{'SubID'} ?? 0) === $transactionId
            );

            if ($bySubId->isNotEmpty()) {
                return $bySubId;
            }
        }

        $passenger = trim(
            (string) ($ticket->{'InvPassenger Name'} ?? '')
        );

        $mode = strtoupper(
            trim((string) ($ticket->{'InvMode'} ?? ''))
        );

        $sector = trim(
            (string) ($ticket->{'InvSector'} ?? '')
        );

        $ticketNo = trim(
            (string) ($ticket->{'InvTicket No'} ?? '')
        );

        $conTicketNo = trim(
            (string) ($ticket->{'InvCon Ticket No'} ?? '')
        );

        $refNo = trim(
            (string) ($ticket->{'InvRefNo'} ?? '')
        );

        /*
         * Passenger + mode + sector is the safest descriptive fallback.
         * Blank historical fields are treated as wildcards.
         */
        $candidates = $masterRows->filter(
            function ($row) use (
                $passenger,
                $mode,
                $sector,
            ): bool {
                $rowPassenger = trim(
                    (string) ($row->{'Passenger'} ?? '')
                );

                $rowMode = strtoupper(
                    trim((string) ($row->{'Mode'} ?? ''))
                );

                $rowSector = trim(
                    (string) ($row->{'Sector/Description'} ?? '')
                );

                if (
                    $passenger !== ''
                    && strcasecmp($rowPassenger, $passenger) !== 0
                ) {
                    return false;
                }

                if (
                    $mode !== ''
                    && $rowMode !== ''
                    && $rowMode !== $mode
                ) {
                    return false;
                }

                if (
                    $sector !== ''
                    && $rowSector !== ''
                    && strcasecmp($rowSector, $sector) !== 0
                ) {
                    return false;
                }

                return true;
            }
        );

        if ($candidates->isNotEmpty()) {
            /*
             * Prefer complete SubID groups so we never combine accounting
             * rows belonging to different historical transactions.
             */
            $groups = $candidates
                ->filter(
                    fn ($row): bool =>
                        ($row->{'SubID'} ?? null) !== null
                        && ($row->{'SubID'} ?? '') !== ''
                )
                ->groupBy(
                    fn ($row): string =>
                        (string) ((int) ($row->{'SubID'} ?? 0))
                );

            if ($groups->isNotEmpty()) {
                $ticketReceivable = (float) (
                    $ticket->{'Total Fare'} ?? 0
                );

                $ticketVendor = (float) (
                    $ticket->{'InvRateVendor'} ?? 0
                );

                $scored = $groups->map(
                    function (
                        Collection $rows,
                        string $subId,
                    ) use (
                        $ticketReceivable,
                        $ticketVendor,
                        $ticketNo,
                        $conTicketNo,
                        $refNo,
                    ): array {
                        $customerAmount = (float) $rows
                            ->filter(
                                fn ($row): bool =>
                                    str_starts_with(
                                        trim(
                                            (string) (
                                                $row->{'Account Code'} ?? ''
                                            )
                                        ),
                                        '12'
                                    )
                            )
                            ->sum(
                                fn ($row): float =>
                                    (float) ($row->{'Debit'} ?? 0)
                                    - (float) ($row->{'Credit'} ?? 0)
                            );

                        $vendorAmount = (float) $rows
                            ->filter(
                                fn ($row): bool =>
                                    str_starts_with(
                                        trim(
                                            (string) (
                                                $row->{'Account Code'} ?? ''
                                            )
                                        ),
                                        '21'
                                    )
                            )
                            ->sum(
                                fn ($row): float =>
                                    (float) ($row->{'Credit'} ?? 0)
                                    - (float) ($row->{'Debit'} ?? 0)
                            );

                        $referenceBonus = 0;

                        foreach ($rows as $row) {
                            $rowTicket = trim(
                                (string) ($row->{'Ticket No'} ?? '')
                            );

                            $rowRef = trim(
                                (string) (
                                    $row->{'Tick/Chq/Ref'} ?? ''
                                )
                            );

                            if (
                                $ticketNo !== ''
                                && $rowTicket === $ticketNo
                            ) {
                                $referenceBonus += 1000000;
                            }

                            if (
                                $conTicketNo !== ''
                                && $rowTicket === $conTicketNo
                            ) {
                                $referenceBonus += 1000000;
                            }

                            if (
                                $refNo !== ''
                                && $rowRef === $refNo
                            ) {
                                $referenceBonus += 1000000;
                            }
                        }

                        $distance = 0.0;

                        if ($ticketReceivable > 0) {
                            $distance += abs(
                                $customerAmount
                                - $ticketReceivable
                            );
                        }

                        if ($ticketVendor > 0) {
                            $distance += abs(
                                $vendorAmount
                                - $ticketVendor
                            );
                        }

                        return [
                            'sub_id' => $subId,
                            'rows' => $rows,
                            'score' =>
                                $referenceBonus
                                - $distance,
                        ];
                    }
                )
                ->sortByDesc('score')
                ->values();

                $best = $scored->first();

                if (
                    $best !== null
                    && ($best['rows'] ?? null)
                        instanceof Collection
                ) {
                    return $best['rows'];
                }
            }

            return $candidates;
        }

        /*
         * Final reference-only fallback.
         */
        if (
            $ticketNo !== ''
            || $conTicketNo !== ''
            || $refNo !== ''
        ) {
            $referenceMatches = $masterRows->filter(
                function ($row) use (
                    $ticketNo,
                    $conTicketNo,
                    $refNo,
                ): bool {
                    $rowTicket = trim(
                        (string) ($row->{'Ticket No'} ?? '')
                    );

                    $rowRef = trim(
                        (string) (
                            $row->{'Tick/Chq/Ref'} ?? ''
                        )
                    );

                    return (
                        $ticketNo !== ''
                        && $rowTicket === $ticketNo
                    ) || (
                        $conTicketNo !== ''
                        && $rowTicket === $conTicketNo
                    ) || (
                        $refNo !== ''
                        && $rowRef === $refNo
                    );
                }
            );

            if ($referenceMatches->isNotEmpty()) {
                return $referenceMatches;
            }
        }

        return collect();
    }

    private function decorateLegacyTransaction(
        object $ticket,
        Collection $masterRows,
        string $clientCode,
        ?int $invoiceNumber = null,
    ): array {
        $receivable = $this->legacyCustomerAmount($masterRows, $clientCode);
        $vendorRows = $masterRows->filter(function ($row) use ($clientCode): bool {
            $accountCode = trim((string) ($row->{'Account Code'} ?? ''));
            return str_starts_with($accountCode, '21') && $accountCode !== trim($clientCode);
        });

        $payable = $vendorRows->sum(
            fn ($row) => (float) ($row->{'Credit'} ?? 0) - (float) ($row->{'Debit'} ?? 0),
        );

        $normalized = $invoiceNumber !== null
            ? $this->legacyNormalizedLineFinancials($invoiceNumber, $clientCode, $ticket)
            : ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];

        if (abs($receivable) <= 0.00005 && $normalized['receivable'] > 0.00005) {
            $receivable = $normalized['receivable'];
        }
        if (abs($payable) <= 0.00005 && $normalized['payable'] > 0.00005) {
            $payable = $normalized['payable'];
        }

        if (abs($receivable) <= 0.00005) {
            $receivable = (float) ($ticket->{'Total Fare'} ?? 0);
        }

        if (abs($payable) <= 0.00005) {
            $payable = (float) ($ticket->{'InvRateVendor'} ?? 0);
            if (!empty($ticket->{'InvPayable2'})) {
                $payable += (float) ($ticket->{'InvFare2'} ?? 0);
            }
            if (!empty($ticket->{'InvPayable3'})) {
                $payable += (float) ($ticket->{'InvFare3'} ?? 0);
            }
        }

        $clientMasterRows = $masterRows->filter(function ($row) use ($clientCode): bool {
            return trim((string) ($row->{'Account Code'} ?? '')) === trim($clientCode);
        });

        $masterProfitAvailable = $clientMasterRows->isNotEmpty();
        $masterProfit = $masterProfitAvailable
            ? (float) $clientMasterRows->sum(fn ($row) => (float) ($row->{'Profit'} ?? 0))
            : null;

        $profit = $masterProfitAvailable
            ? $masterProfit
            : ($normalized['profit'] !== null && abs((float) $normalized['profit']) > 0.00005
                ? (float) $normalized['profit']
                : ($receivable - $payable));

        $vendorCodes = $vendorRows
            ->map(fn ($row) => trim((string) ($row->{'Account Code'} ?? '')))
            ->filter()
            ->values()
            ->all();

        $mode = $this->legacyMode((string) ($ticket->{'InvMode'} ?? 'Other'));
        $legacyTransactionId = (int) ($ticket->{'InvTransuction ID'} ?? 0);

        $masterHotelName = $masterRows
            ->map(fn ($row) => trim((string) ($row->{'HotelName'} ?? '')))
            ->first(fn (string $value): bool => $this->isMeaningfulLegacyText($value));

        $ticketHotelName = trim((string) ($ticket->{'SimilarHotel'} ?? ''));
        $hotelName = $masterHotelName
            ?: ($this->isMeaningfulLegacyText($ticketHotelName) ? $ticketHotelName : '');

        $vendorDetails = collect($vendorCodes)
            ->map(function (string $code): array {
                return [
                    'code' => $code,
                    'name' => $this->vendorNameFromCodes([$code]),
                ];
            })
            ->values()
            ->all();

        // Accu stores the local/base-currency service rate separately from the
        // foreign-currency rate/ROE.  Historical Visa rows can have both Rate
        // and InvRate as 0, so derive the unit rate from the actual receivable
        // before converting it to the transaction currency.
        $localRate = (float) ($ticket->{'InvRate'} ?? 0);
        if ($localRate <= 0) {
            $localRate = (float) ($ticket->{'Rate'} ?? 0);
        }

        $roe = $masterRows
            ->map(fn ($row) => (float) ($row->{'CurRate'} ?? 0))
            ->first(fn (float $value): bool => $value > 0)
            ?? (float) ($ticket->{'CurRate'} ?? 0);

        $rooms = (float) ($ticket->{'RoomQty'} ?? 0);
        $nights = (float) ($ticket->{'InvNights'} ?? 0);
        $quantity = (float) ($ticket->{'Quantity'} ?? 0);

        if ($localRate <= 0 && $receivable > 0) {
            if ($mode === 'Hotel') {
                $units = max(1.0, ($rooms > 0 ? $rooms : 1.0) * ($nights > 0 ? $nights : 1.0));
            } else {
                $units = max(1.0, $quantity);
            }

            $localRate = $receivable / $units;
        }

        $rateSar = ($localRate > 0 && $roe > 0)
            ? $localRate / $roe
            : 0.0;

        return [
            'legacy_transaction_id' => $legacyTransactionId,
            'transaction_key' => (string) $legacyTransactionId,
            'mode' => $mode,
            'type' => (string) ($ticket->{'InvType'} ?? 'Normal'),
            'airline_code' => (string) ($ticket->{'InvAirlines Code'} ?? ''),
            'passenger_name' => (string) ($ticket->{'InvPassenger Name'} ?? ''),
            'passport_no' => (string) ($ticket->{'InvPassport No'} ?? ''),
            'nationality' => (string) ($ticket->{'InvNationality'} ?? ''),
            'phone' => (string) ($ticket->{'InvPhone'} ?? ''),
            'address' => (string) ($ticket->{'InvAddress'} ?? ''),
            'dob' => $this->dateOnlyNullable($ticket->{'InvDOB'} ?? null),
            'passenger_type' => (string) ($ticket->{'InvPassenger Type'} ?? 'Adult'),
            'group_no' => (string) ($ticket->{'GroupNo'} ?? ''),
            'payable_account_code' => (string) ($vendorCodes[0] ?? ($ticket->{'InvPayable'} ?? '')),
            'payable_account_2' => (string) ($vendorCodes[1] ?? ($ticket->{'InvPayable2'} ?? '')),
            'payable_account_3' => (string) ($vendorCodes[2] ?? ($ticket->{'InvPayable3'} ?? '')),
            'vendor_name' => (string) (($vendorDetails[0]['name'] ?? '') ?: ($vendorCodes[0] ?? '')),
            'vendor_details' => $vendorDetails,
            'vendor_amount' => (float) ($ticket->{'InvRateVendor'} ?? ($vendorRows->first()?->{'Credit'} ?? 0)),
            'vendor_amount_2' => (float) ($ticket->{'InvFare2'} ?? 0),
            'vendor_amount_3' => (float) ($ticket->{'InvFare3'} ?? 0),
            'receivable_amount' => round($receivable, 4),
            'payable_amount' => round($payable, 4),
            'profit_amount' => round($profit, 4),
            'revenue_account_code' => (string) ($ticket->{'Other Service Account'} ?? ''),
            'ticket_no' => (string) ($ticket->{'InvTicket No'} ?? ''),
            'con_ticket_no' => (string) ($ticket->{'InvCon Ticket No'} ?? ''),
            'ticket_type' => (string) ($ticket->{'InvTicket Type'} ?? ''),
            'sector' => (string) ($ticket->{'InvSector'} ?? ''),
            'departure_date' => $this->dateOnlyNullable($ticket->{'InvDeparture Date'} ?? null),
            'return_date' => $this->dateOnlyNullable($ticket->{'InvReturnDate'} ?? null),
            'flight_no' => (string) ($ticket->{'InvFlight No'} ?? ''),
            'pnr' => (string) ($ticket->{'InvPNR #'} ?? ''),
            'route' => (string) ($ticket->{'InvRoute'} ?? ''),
            'gds' => (string) ($ticket->{'GDS'} ?? ''),
            'class' => (string) ($ticket->{'InvClass'} ?? ''),
            'xo' => (string) ($ticket->{'InvXO'} ?? ''),
            'visa_no' => (string) ($ticket->{'InvParticulars3'} ?? ''),
            'documents' => (string) ($ticket->{'InvDocRec'} ?? ''),
            'hotel_id' => $ticket->{'InvHotel'} !== null ? (int) $ticket->{'InvHotel'} : null,
            'vehicle_id' => $ticket->{'InvVehicle'} !== null ? (int) $ticket->{'InvVehicle'} : null,
            'hotel_name' => $hotelName,
            'service_description' => trim((string) (
                $masterRows->map(fn ($row) => trim((string) ($row->{'Sector/Description'} ?? '')))
                    ->first(fn (string $value): bool => $this->isMeaningfulLegacyText($value))
                ?: ($ticket->{'InvSector'} ?? '')
            )),
            'room_type' => (string) ($ticket->{'InvRoomType'} ?? ''),
            'meal' => (string) ($ticket->{'Meal'} ?? ''),
            'room_no' => (string) ($ticket->{'RoomNo'} ?? ''),
            'room_quantity' => (float) ($ticket->{'RoomQty'} ?? 0),
            'quantity' => (float) ($ticket->{'Quantity'} ?? 0),
            'nights' => $ticket->{'InvNights'} !== null ? (int) $ticket->{'InvNights'} : null,
            // Accu stores the invoice/detail rate in InvRate; Rate is often 0 on historical rows.
            // Keep Rate as a fallback for older records where InvRate is empty.
            'rate' => $localRate,
            'roe' => $roe,
            'rate_sar' => $rateSar,
            'internal_ref_no' => (string) ($ticket->{'InternalRefNo'} ?? ''),
            'ref_no' => (string) ($ticket->{'InvRefNo'} ?? ''),
            'confirm_no' => (string) ($ticket->{'InvParticulars2'} ?? ''),
            'sector_to' => (string) ($ticket->{'invSectorTo'} ?? ''),
            'flight_information' => (string) ($ticket->{'InvFlightInformation'} ?? ''),
            'package' => (string) ($ticket->{'InvParticulars2'} ?? ''),
            'starting_date' => $this->dateOnlyNullable($ticket->{'InvDeparture Date'} ?? null),
            'ending_date' => $this->dateOnlyNullable($ticket->{'InvReturnDate'} ?? null),
            'online_date' => $this->dateOnlyNullable($ticket->{'InvOnlineDate'} ?? null),
            'other_service_charges' => (float) ($ticket->{'InvOther Service Charges'} ?? 0),
            'discount' => (float) ($ticket->{'InvDiscount'} ?? 0),
            'insurance' => (float) ($ticket->{'InvInsurance'} ?? 0),
            'psf' => (float) ($ticket->{'InvPSF'} ?? 0),
            'psf_amount' => 0,
            'commission_receivable' => (float) ($ticket->{'InvCommission Rec'} ?? 0),
            'commission_paid' => (float) ($ticket->{'InvCommission Paid'} ?? 0),
            'commission_to_client' => (float) ($ticket->{'InvCommissiontoClient'} ?? 0),
            'fare' => (float) ($ticket->{'InvFare'} ?? 0),
            'sp_apt' => (float) ($ticket->{'InvSP/APT'} ?? 0),
            'sf_ftt' => (float) ($ticket->{'InvSF/FTT'} ?? 0),
            'aq_pk_yr' => (float) ($ticket->{'InvAQ/PK/YR'} ?? 0),
            'fed_rg_cvt' => (float) ($ticket->{'InvFED/RG/CVT'} ?? 0),
            'ced' => (float) ($ticket->{'InvCED'} ?? 0),
            'jo' => (float) ($ticket->{'InvJO'} ?? 0),
            'wh_airlines' => (float) ($ticket->{'InvWH Airlines'} ?? 0),
            'wh_client' => (float) ($ticket->{'InvWH Client'} ?? 0),
            'yq' => (float) ($ticket->{'InvYQ'} ?? 0),
            'xut' => (float) ($ticket->{'InvXUT'} ?? 0),
            'other_tax' => (float) ($ticket->{'InvOther'} ?? 0),
            'xz' => (float) ($ticket->{'InvXZ'} ?? 0),
            'yd' => (float) ($ticket->{'InvYD'} ?? 0),
            'fare_including' => (float) ($ticket->{'InvFareInc'} ?? 0),
            'taxes_including' => (float) ($ticket->{'InvTaxesInc'} ?? 0),
            'pst_percentage' => (float) ($ticket->{'InvPSTPercentage'} ?? 0),
            'pst' => (float) ($ticket->{'InvPST'} ?? 0),
            'pst_paid' => (float) ($ticket->{'PSTPaid'} ?? 0),
            'fare_nc' => (float) ($ticket->{'InvFareNC'} ?? 0),
            'currency_code' => (string) ($ticket->{'Cur'} ?? ''),
            'currency_quantity' => $ticket->{'CurQty'} !== null ? (float) $ticket->{'CurQty'} : null,
            'currency_rate' => $ticket->{'CurRate'} !== null ? (float) $ticket->{'CurRate'} : null,
            'agent_code' => (string) ($ticket->{'AgentCode'} ?? ''),
            'agent_amount' => (float) ($ticket->{'AgentAmount'} ?? 0),
            'particulars_2' => (string) ($ticket->{'InvParticulars2'} ?? ''),
            'particulars_3' => (string) ($ticket->{'InvParticulars3'} ?? ''),
            'legacy_raw' => $this->legacyRawTicket($ticket),
            'master_rows' => $masterRows->map(fn ($row) => [
                'id' => (int) ($row->{'ID'} ?? 0),
                'account_code' => (string) ($row->{'Account Code'} ?? ''),
                'debit' => (float) ($row->{'Debit'} ?? 0),
                'credit' => (float) ($row->{'Credit'} ?? 0),
                'sub_id' => $row->{'SubID'} !== null ? (int) $row->{'SubID'} : null,
                'profit' => (float) ($row->{'Profit'} ?? 0),
                'role' => $this->masterRowRole($row, $clientCode),
            ])->values()->all(),
        ];
    }

    private function masterRowRole(object $row, string $clientCode): string
    {
        $accountCode = trim((string) ($row->{'Account Code'} ?? ''));

        if ($accountCode !== '' && $accountCode === trim($clientCode)) {
            return 'Customer / Receivable';
        }

        if (str_starts_with($accountCode, '21')) {
            return 'Vendor / Payable';
        }

        if (str_starts_with($accountCode, '4')) {
            return 'Sales / Income';
        }

        if ($accountCode !== '') {
            return 'Other';
        }

        return 'Other';
    }

    private function isMeaningfulLegacyText(string $value): bool
    {
        $normalized = strtoupper(trim($value));

        return $normalized !== ''
            && !in_array($normalized, ['0', '-', '—', 'N/A', 'NA', 'NULL'], true);
    }

    private function legacyCustomerAmount(Collection $masterRows, string $clientCode): float
    {
        $rows = $this->legacyCustomerMasterRows($masterRows, trim($clientCode));
        return (float) $rows->sum(
            fn ($row) => (float) ($row->{'Debit'} ?? 0) - (float) ($row->{'Credit'} ?? 0),
        );
    }

    private function legacyCustomerMasterRows(Collection $masterRows, string $clientCode): Collection
    {
        $clientCode = trim($clientCode);

        if ($clientCode !== '') {
            $exact = $masterRows->filter(function ($row) use ($clientCode): bool {
                if (! $this->accountCodesEqual(
                    (string) ($row->{'Account Code'} ?? ''),
                    $clientCode,
                )) {
                    return false;
                }

                return abs((float) ($row->{'Debit'} ?? 0))
                    + abs((float) ($row->{'Credit'} ?? 0)) > 0.00005;
            });
            if ($exact->isNotEmpty()) {
                return $exact;
            }
        }

        return $masterRows->filter(function ($row): bool {
            $accountCode = trim((string) ($row->{'Account Code'} ?? ''));
            return str_starts_with($accountCode, '12')
                && abs((float) ($row->{'Debit'} ?? 0)) + abs((float) ($row->{'Credit'} ?? 0)) > 0.00005;
        });
    }

    private function accountCodesEqual(string $left, string $right): bool
    {
        $left = trim($left);
        $right = trim($right);
        if ($left === '' || $right === '') return false;
        if ($left === $right) return true;
        if (is_numeric($left) && is_numeric($right)) {
            return (string) ((int) $left) === (string) ((int) $right);
        }
        return false;
    }

    private function resolveLegacyClientCode(array $context, string $fallback = ''): string
    {
        $headerCode = trim((string) ($context['legacy_client_code'] ?? ''));
        if ($headerCode !== '') return $headerCode;

        $fallback = trim($fallback);
        $masterRows = $context['master'] ?? collect();
        if ($fallback !== '' && $this->legacyCustomerMasterRows($masterRows, $fallback)->isNotEmpty()) {
            return $fallback;
        }

        $code = $masterRows
            ->filter(function ($row): bool {
                $accountCode = trim((string) ($row->{'Account Code'} ?? ''));
                return str_starts_with($accountCode, '12')
                    && (float) ($row->{'Debit'} ?? 0) > 0.00005;
            })
            ->groupBy(fn ($row) => trim((string) ($row->{'Account Code'} ?? '')))
            ->map(fn (Collection $rows) => $rows->sum(fn ($row) => (float) ($row->{'Debit'} ?? 0)))
            ->sortDesc()
            ->keys()
            ->first();

        return trim((string) ($code ?? $fallback));
    }

    private function legacyNormalizedFinancials(int $invoiceNumber, string $clientCode): array
    {
        if ($invoiceNumber <= 0 || !Schema::hasTable('journal_entry_lines')) {
            return ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];
        }

        $rows = DB::table('journal_entry_lines')
            ->where('legacy_reference_id', $invoiceNumber)
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->select(['account_code', 'debit', 'credit', 'profit'])
            ->get();

        if ($rows->isEmpty()) {
            return ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];
        }

        $clientRows = $clientCode === ''
            ? collect()
            : $rows->filter(function ($row) use ($clientCode): bool {
                if (! $this->accountCodesEqual((string) ($row->account_code ?? ''), $clientCode)) {
                    return false;
                }

                return abs((float) ($row->debit ?? 0))
                    + abs((float) ($row->credit ?? 0)) > 0.00005;
            });

        // Some imported historical journal rows carry the correct customer
        // code but are zero-only placeholders. In that case use the actual
        // positive 12xxxx customer posting(s) for the invoice.
        if ($clientRows->isEmpty()) {
            $clientRows = $rows->filter(function ($row): bool {
                $code = trim((string) ($row->account_code ?? ''));
                return str_starts_with($code, '12')
                    && (float) ($row->debit ?? 0) > 0.00005;
            });
        }

        $receivable = (float) $clientRows->sum(
            fn ($row) => (float) ($row->debit ?? 0) - (float) ($row->credit ?? 0),
        );
        $payable = (float) $rows
            ->filter(fn ($row) => str_starts_with(trim((string) ($row->account_code ?? '')), '21'))
            ->sum(fn ($row) => max(
                (float) ($row->credit ?? 0) - (float) ($row->debit ?? 0),
                0.0,
            ));
        $profit = $clientRows->isNotEmpty()
            ? (float) $clientRows->sum(fn ($row) => (float) ($row->profit ?? 0))
            : null;

        return [
            'receivable' => max($receivable, 0.0),
            'payable' => max($payable, 0.0),
            'profit' => $profit,
        ];
    }

    private function legacyNormalizedLineFinancials(
        int $invoiceNumber,
        string $clientCode,
        object $ticket,
    ): array {
        if ($invoiceNumber <= 0 || ! Schema::hasTable('journal_entry_lines')) {
            return ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];
        }

        $rows = DB::table('journal_entry_lines')
            ->where('legacy_reference_id', $invoiceNumber)
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->select([
                'journal_entry_id',
                'account_code',
                'debit',
                'credit',
                'profit',
                'passenger',
                'mode_description',
                'sector_description',
            ])
            ->get();

        $customerRows = $rows->filter(function ($row) use ($clientCode): bool {
            $code = trim((string) ($row->account_code ?? ''));
            if (trim($clientCode) !== '') {
                if (! $this->accountCodesEqual($code, $clientCode)) {
                    return false;
                }
            } elseif (! str_starts_with($code, '12')) {
                return false;
            }

            return abs((float) ($row->debit ?? 0))
                + abs((float) ($row->credit ?? 0)) > 0.00005;
        });

        if ($customerRows->isEmpty()) {
            $customerRows = $rows->filter(function ($row): bool {
                $code = trim((string) ($row->account_code ?? ''));
                return str_starts_with($code, '12')
                    && (float) ($row->debit ?? 0) > 0.00005;
            });
        }

        if ($customerRows->isEmpty()) {
            return ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];
        }

        $passenger = trim((string) ($ticket->{'InvPassenger Name'} ?? ''));
        $mode = strtoupper(trim((string) ($ticket->{'InvMode'} ?? '')));
        $sector = trim((string) ($ticket->{'InvSector'} ?? ''));

        $matched = $customerRows;
        if ($passenger !== '') {
            $byPassenger = $customerRows->filter(
                fn ($row) => strcasecmp(trim((string) ($row->passenger ?? '')), $passenger) === 0,
            );
            if ($byPassenger->isNotEmpty()) {
                $matched = $byPassenger;
            }
        }

        if ($mode !== '' && $matched->count() > 1) {
            $byMode = $matched->filter(
                fn ($row) => strtoupper(trim((string) ($row->mode_description ?? ''))) === $mode,
            );
            if ($byMode->isNotEmpty()) {
                $matched = $byMode;
            }
        }

        if ($sector !== '' && $matched->count() > 1) {
            $bySector = $matched->filter(
                fn ($row) => trim((string) ($row->sector_description ?? '')) === $sector,
            );
            if ($bySector->isNotEmpty()) {
                $matched = $bySector;
            }
        }

        // When several identical customer postings remain, only use this
        // transaction-specific fallback if there is a unique journal line set.
        if ($matched->count() > 1 && $matched->pluck('journal_entry_id')->unique()->count() > 1) {
            return ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];
        }

        $receivable = (float) $matched->sum(
            fn ($row) => (float) ($row->debit ?? 0) - (float) ($row->credit ?? 0),
        );
        $profit = (float) $matched->sum(fn ($row) => (float) ($row->profit ?? 0));

        $journalIds = $matched->pluck('journal_entry_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $vendorRows = empty($journalIds)
            ? collect()
            : $rows->filter(function ($row) use ($journalIds): bool {
                $journalId = $row->journal_entry_id !== null ? (int) $row->journal_entry_id : 0;
                $code = trim((string) ($row->account_code ?? ''));
                return $journalId > 0
                    && in_array($journalId, $journalIds, true)
                    && str_starts_with($code, '21');
            });

        $payable = (float) $vendorRows->sum(fn ($row) => max(
            (float) ($row->credit ?? 0) - (float) ($row->debit ?? 0),
            0.0,
        ));

        return [
            'receivable' => max($receivable, 0.0),
            'payable' => max($payable, 0.0),
            'profit' => $profit,
        ];
    }

    private function legacyNormalizedTransactionFinancials(int $invoiceNumber): array
    {
        if ($invoiceNumber <= 0 || ! Schema::hasTable('invoice_transactions')) {
            return ['receivable' => 0.0, 'payable' => 0.0];
        }

        // These rows are a secondary recovery source for imported Accu data.
        // They are deliberately consulted only from the legacy path so native
        // HBA invoices cannot accidentally be mixed with the archive.
        $rows = DB::table('invoice_transactions')
            ->where('legacy_invoice_id', $invoiceNumber)
            ->get();

        if ($rows->isEmpty()) {
            return ['receivable' => 0.0, 'payable' => 0.0];
        }

        $receivable = (float) $rows->sum(fn ($row) => max(
            (float) ($row->total_fare ?? 0),
            0.0,
        ));

        $payable = (float) $rows->sum(fn ($row) => max(
            (float) ($row->rate_vendor ?? $row->vendor_rate ?? 0)
                + (float) ($row->fare_2 ?? 0)
                + (float) ($row->fare_3 ?? 0),
            0.0,
        ));

        return [
            'receivable' => $receivable,
            'payable' => $payable,
        ];
    }

    private function legacyInvoiceTotals(array $context, string $clientCode, ?int $invoiceNumber = null): array
    {
        $clientCode = $this->resolveLegacyClientCode($context, $clientCode);
        $masterRows = $context['master'] ?? collect();

        $customerRows = $this->legacyCustomerMasterRows($masterRows, $clientCode);
        $receivable = (float) $customerRows->sum(
            fn ($row) => (float) ($row->{'Debit'} ?? 0) - (float) ($row->{'Credit'} ?? 0),
        );

        $vendorRows = $masterRows->filter(fn ($row) => str_starts_with(
            trim((string) ($row->{'Account Code'} ?? '')),
            '21',
        ));
        $payable = (float) $vendorRows->sum(fn ($row) => max(
            (float) ($row->{'Credit'} ?? 0) - (float) ($row->{'Debit'} ?? 0),
            0.0,
        ));

        $normalized = $invoiceNumber !== null
            ? $this->legacyNormalizedFinancials($invoiceNumber, $clientCode)
            : ['receivable' => 0.0, 'payable' => 0.0, 'profit' => null];

        if (abs($receivable) <= 0.00005 && $normalized['receivable'] > 0.00005) {
            $receivable = $normalized['receivable'];
        }
        if (abs($payable) <= 0.00005 && $normalized['payable'] > 0.00005) {
            $payable = $normalized['payable'];
        }

        $normalizedTransactions = $invoiceNumber !== null
            ? $this->legacyNormalizedTransactionFinancials($invoiceNumber)
            : ['receivable' => 0.0, 'payable' => 0.0];

        if (abs($receivable) <= 0.00005 && $normalizedTransactions['receivable'] > 0.00005) {
            $receivable = $normalizedTransactions['receivable'];
        }
        if (abs($payable) <= 0.00005 && $normalizedTransactions['payable'] > 0.00005) {
            $payable = $normalizedTransactions['payable'];
        }

        $ticketReceivable = 0.0;
        $ticketPayable = 0.0;
        foreach ($context['tickets'] ?? [] as $ticket) {
            $ticketReceivable += (float) ($ticket->{'Total Fare'} ?? 0);
            $ticketPayable += (float) ($ticket->{'InvRateVendor'} ?? 0);
            if (!empty($ticket->{'InvPayable2'})) {
                $ticketPayable += (float) ($ticket->{'InvFare2'} ?? 0);
            }
            if (!empty($ticket->{'InvPayable3'})) {
                $ticketPayable += (float) ($ticket->{'InvFare3'} ?? 0);
            }
        }

        if (abs($receivable) <= 0.00005 && $ticketReceivable > 0.00005) {
            $receivable = $ticketReceivable;
        }
        if (abs($payable) <= 0.00005 && $ticketPayable > 0.00005) {
            $payable = $ticketPayable;
        }

        return [max($receivable, 0.0), max($payable, 0.0)];
    }

    private function legacyInvoiceProfit(
        array $context,
        string $clientCode,
        ?int $invoiceNumber,
        float $receivable,
        float $payable,
    ): float {
        /*
         * For legacy invoices, the authoritative displayed profit is the
         * reconciled receivable minus payable. Historical master/customer
         * rows can contain stale Profit values after rate corrections.
         */
        return $receivable - $payable;
    }

    private function vendorNameFromCodes(array $codes): string
    {
        $code = trim((string) ($codes[0] ?? ''));
        if ($code === '') {
            return '';
        }

        return (string) (DB::table('accounts')->where('code', $code)->value('name') ?? $code);
    }

    private function legacyMode(string $mode): string
    {
        return match (strtoupper(trim($mode))) {
            'TICKET', 'AIR TICKET' => 'Ticket',
            'VISA' => 'Visa',
            'HOTEL' => 'Hotel',
            'TRANSFER', 'TRANSPORT' => 'Transfer',
            default => trim($mode) !== '' ? trim($mode) : 'Other',
        };
    }

    private function legacyRawTicket(object $ticket): array
    {
        $data = [];
        foreach (get_object_vars($ticket) as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $data[$key] = $value;
            }
        }
        return $data;
    }

    /**
     * Legacy Accu data may contain bytes that are not valid UTF-8. Laravel's
     * Inertia/JSON responses require valid UTF-8, so normalize the final
     * response payload instead of allowing one malformed legacy field to
     * crash the entire invoice screen. Invalid byte sequences are replaced
     * with the Unicode replacement character while all normal data is kept.
     */
    private function sanitizeUtf8(mixed $value): mixed
    {
        $json = json_encode($value, JSON_INVALID_UTF8_SUBSTITUTE);

        if ($json === false) {
            return $value;
        }

        $decoded = json_decode($json, true);

        return $decoded === null && $json !== 'null' ? $value : $decoded;
    }

    private function masterData(?int $selectedClientId = null, array $selectedVendorCodes = []): array
    {
        $customerAccounts = $this->accountsByPrefix('12', $selectedClientId);
        $vendorAccounts = $this->accountsByPrefix('21');
        $incomeAccounts = $this->accountsByPrefix('4');

        return [
            'customers' => $customerAccounts,
            'vendors' => $vendorAccounts,
            'income_accounts' => $incomeAccounts,
            'branches' => DB::table('branches')
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($row) => [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                ])->values()->all(),
            'departments' => DB::table('departments')
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($row) => [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                ])->values()->all(),
            'employees' => DB::table('users')
                ->select('id', 'name')
                ->orderBy('name')
                ->limit(500)
                ->get()
                ->map(fn ($row) => [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                ])->values()->all(),
            'currencies' => $this->currencyOptions(),
            'hotels' => $this->hotelOptions(),
            'visa_types' => $this->visaOptions(),
            'vehicles' => $this->vehicleOptions(),
            'transfer_locations' => $this->transferLocationOptions(),
            'passengers' => $this->dynamicOptions('passengers', ['id', 'passenger_id'], ['name', 'full_name'], ['passport_no', 'nationality', 'phone']),
            'airlines' => $this->dynamicOptions('airlines', ['id', 'airline_id'], ['name', 'airline_name'], ['airline_code']),
        ];
    }

    private function currencyOptions(): array
    {
        if (!Schema::hasTable('currencies')) {
            return [];
        }

        $columns = Schema::getColumnListing('currencies');
        $codeColumn = $this->firstExisting($columns, ['currency_code', 'code', 'currency', 'iso_code', 'currency_id']);

        if ($codeColumn === null) {
            return [];
        }

        $nameColumn = $this->firstExisting($columns, ['currency_name', 'name', 'title', 'description']);
        $symbolColumn = $this->firstExisting($columns, ['symbol', 'currency_symbol']);
        $decimalsColumn = $this->firstExisting($columns, ['decimals', 'decimal_places', 'precision']);
        $activeColumn = $this->firstExisting($columns, ['is_active', 'active', 'status']);

        $query = DB::table('currencies')
            ->select([$codeColumn . ' as code']);

        if ($nameColumn !== null) {
            $query->addSelect($nameColumn . ' as name');
        }

        if ($symbolColumn !== null) {
            $query->addSelect($symbolColumn . ' as symbol');
        }

        if ($decimalsColumn !== null) {
            $query->addSelect($decimalsColumn . ' as decimals');
        }

        if ($activeColumn !== null) {
            $query->where(function ($q) use ($activeColumn): void {
                $q->where($activeColumn, 1)->orWhereNull($activeColumn);
            });
        }

        return $query
            ->orderBy($codeColumn)
            ->limit(100)
            ->get()
            ->map(function ($row): array {
                return [
                    'code' => (string) ($row->code ?? ''),
                    'name' => (string) ($row->name ?? $row->code ?? ''),
                    'symbol' => (string) ($row->symbol ?? ''),
                    'decimals' => isset($row->decimals) ? (int) $row->decimals : 2,
                ];
            })
            ->filter(fn (array $row): bool => $row['code'] !== '')
            ->values()
            ->all();
    }

    private function accountsByPrefix(string $prefix, ?int $selectedId = null): array
    {
        return DB::table('accounts')
            ->select('id', 'code', 'name')
            ->where(function ($q) use ($prefix): void {
                $q->where('code', 'like', $prefix . '%');
            })
            ->orderBy('code')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'code' => (string) $row->code,
                'name' => (string) $row->name,
            ])
            ->values()
            ->all();
    }

    private function decorateVehicleOption(object $row): array
    {
        return [
            'id' => (int) ($row->id ?? 0),
            'name' => (string) ($row->name ?? ''),
            'registration_no' => (string) ($row->registration_no ?? ''),
            'vendor_account_code' => (string) ($row->vendor_account_code ?? ''),
            'legacy_vehicle_id' => isset($row->legacy_vehicle_id) && $row->legacy_vehicle_id !== null
                ? (int) $row->legacy_vehicle_id
                : null,
            'source' => (string) ($row->source ?? 'native'),
        ];
    }

    /**
     * Vehicle master used by Transfer. Local migrated rows are authoritative;
     * legacy data is merged as a fallback so the selector remains populated
     * during rollout.
     */
    private function vehicleOptions(): array
    {
        $options = [];
        $byKey = [];

        try {
            if (Schema::hasTable('vehicles')) {
                $columns = Schema::getColumnListing('vehicles');
                $idColumn = $this->firstExisting($columns, ['id', 'vehicle_id']);
                $nameColumn = $this->firstExisting($columns, ['name', 'vehicle_name', 'vehicle_type']);
                if ($idColumn !== null && $nameColumn !== null) {
                    $select = [$idColumn . ' as id', $nameColumn . ' as name'];
                    foreach (['registration_no', 'reg_no', 'vehicle_no', 'plate_no', 'vendor_account_code', 'vendor_code', 'payable_account_code', 'legacy_vehicle_id', 'is_active'] as $column) {
                        if (in_array($column, $columns, true)) {
                            $select[] = $column;
                        }
                    }
                    $rows = DB::table('vehicles')->select($select)->orderBy($nameColumn)->limit(10000)->get();
                    foreach ($rows as $row) {
                        $name = trim((string) ($row->name ?? ''));
                        if ($name === '') continue;
                        if (isset($row->is_active) && $row->is_active !== null && (int) $row->is_active !== 1) continue;
                        $option = $this->decorateVehicleOption($row);
                        $option['source'] = 'native';
                        $byKey[strtolower($name)] = $option;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Legacy fallback below remains available.
        }

        foreach ($this->legacyVehicleOptions() as $legacy) {
            $key = strtolower(trim((string) ($legacy['name'] ?? '')));
            if ($key === '') continue;
            if (! isset($byKey[$key])) {
                $byKey[$key] = $legacy;
            } elseif (
                empty($byKey[$key]['vendor_account_code'])
                && !empty($legacy['vendor_account_code'])
            ) {
                $byKey[$key]['vendor_account_code'] = $legacy['vendor_account_code'];
            }
        }

        $options = array_values($byKey);
        usort($options, static fn (array $a, array $b): int => strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? '')));

        return $options;
    }

    private function legacyVehicleOptions(): array
    {
        $vehicles = [];
        $transactionVehicleIds = [];
        $vendorByLegacyId = [];
        $vehicleNameByLegacyId = [];

        try {
            $legacy = DB::connection('legacy');
            $schema = $legacy->getSchemaBuilder();

            if ($schema->hasTable('InvTickets')) {
                $columns = $schema->getColumnListing('InvTickets');
                $txnColumn = $this->firstExisting($columns, ['InvTransuction ID', 'InvTransaction ID']);
                $vehicleIdColumn = $this->firstExisting($columns, ['InvVehicle', 'VehicleID', 'Vehicle Id']);
                $vendorColumn = $this->firstExisting($columns, ['InvPayable', 'Payable', 'VendorCode']);

                $select = [];
                if ($txnColumn !== null) $select[] = $txnColumn . ' as txn_id';
                if ($vehicleIdColumn !== null) $select[] = $vehicleIdColumn . ' as legacy_vehicle_id';
                if ($vendorColumn !== null) $select[] = $vendorColumn . ' as vendor_code';

                if ($select !== []) {
                    foreach ($legacy->table('InvTickets')->select($select)->limit(100000)->get() as $row) {
                        $txnId = isset($row->txn_id) ? (int) $row->txn_id : 0;
                        $legacyId = isset($row->legacy_vehicle_id) && $row->legacy_vehicle_id !== null && $row->legacy_vehicle_id !== ''
                            ? (int) $row->legacy_vehicle_id
                            : 0;
                        if ($txnId > 0 && $legacyId > 0) {
                            $transactionVehicleIds[$txnId] = $legacyId;
                        }
                        if ($legacyId > 0 && empty($vendorByLegacyId[$legacyId])) {
                            $vendorCode = trim((string) ($row->vendor_code ?? ''));
                            if ($vendorCode !== '') {
                                $vendorByLegacyId[$legacyId] = $vendorCode;
                            }
                        }
                    }
                }
            }

            if ($schema->hasTable('Master')) {
                $columns = $schema->getColumnListing('Master');
                $modeColumn = $this->firstExisting($columns, ['Mode']);
                $subIdColumn = $this->firstExisting($columns, ['SubID']);
                $descriptionColumn = $this->firstExisting($columns, ['Sector/Description', 'Sector Description', 'Sector']);

                if ($descriptionColumn !== null) {
                    $query = $legacy->table('Master')->select([$descriptionColumn . ' as description']);
                    if ($subIdColumn !== null) $query->addSelect($subIdColumn . ' as sub_id');
                    if ($modeColumn !== null) {
                        $query->whereRaw("UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?", ['TRANSFER']);
                    }

                    foreach ($query->whereNotNull($descriptionColumn)->limit(100000)->get() as $row) {
                        $description = trim((string) ($row->description ?? ''));
                        if ($description === '') continue;

                        $parts = preg_split('/\s*-\s*/', $description);
                        if (!is_array($parts) || count($parts) < 5) continue;

                        // Accu Transfer description shape:
                        // date-from-to-quantity-vehicle type
                        $vehicleName = trim(implode('-', array_slice($parts, 4)));
                        if (!$this->isMeaningfulLegacyText($vehicleName) || is_numeric($vehicleName)) continue;

                        $subId = isset($row->sub_id) ? (int) $row->sub_id : 0;
                        $legacyId = $subId > 0 ? (int) ($transactionVehicleIds[$subId] ?? 0) : 0;
                        $key = strtolower($vehicleName);

                        if (!isset($vehicles[$key])) {
                            $vehicles[$key] = [
                                'id' => $legacyId > 0 ? $legacyId : -(100000000 + (int) (sprintf('%u', crc32($key)) % 899999999)),
                                'name' => $vehicleName,
                                'registration_no' => '',
                                'vendor_account_code' => $legacyId > 0 ? ($vendorByLegacyId[$legacyId] ?? '') : '',
                                'legacy_vehicle_id' => $legacyId > 0 ? $legacyId : null,
                                'source' => 'accu',
                            ];
                        } elseif ($vehicles[$key]['legacy_vehicle_id'] === null && $legacyId > 0) {
                            $vehicles[$key]['legacy_vehicle_id'] = $legacyId;
                            $vehicles[$key]['vendor_account_code'] = $vendorByLegacyId[$legacyId] ?? '';
                            $vehicles[$key]['id'] = $legacyId;
                        }

                        if ($legacyId > 0) {
                            $vehicleNameByLegacyId[$legacyId] = $vehicleName;
                        }
                    }
                }
            }

            // Also surface legacy vehicle IDs that exist on InvTickets but do not
            // have a parseable Transfer Master description yet.
            foreach ($transactionVehicleIds as $legacyId) {
                if ($legacyId <= 0 || isset($vehicleNameByLegacyId[$legacyId])) continue;
                $name = 'Vehicle ' . $legacyId;
                $key = strtolower($name);
                $vehicles[$key] = [
                    'id' => $legacyId,
                    'name' => $name,
                    'registration_no' => '',
                    'vendor_account_code' => $vendorByLegacyId[$legacyId] ?? '',
                    'legacy_vehicle_id' => $legacyId,
                    'source' => 'accu',
                ];
            }
        } catch (\Throwable $e) {
            // Native migration remains the authoritative long-term source.
        }

        $result = array_values($vehicles);
        usort($result, static fn (array $a, array $b): int => strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? '')));
        return $result;
    }

    private function transferLocationOptions(): array
    {
        $names = [];

        $add = static function ($value) use (&$names): void {
            $name = trim((string) ($value ?? ''));
            if ($name === '') return;
            if (in_array(strtoupper($name), ['-', '0', 'N/A', 'NA', 'NULL'], true)) return;
            $names[strtolower($name)] = $name;
        };

        try {
            if (Schema::hasTable('transfer_locations')) {
                $columns = Schema::getColumnListing('transfer_locations');
                $nameColumn = $this->firstExisting($columns, ['name', 'location', 'sector']);
                if ($nameColumn !== null) {
                    $query = DB::table('transfer_locations')
                        ->select($nameColumn)
                        ->whereNotNull($nameColumn)
                        ->where($nameColumn, '<>', '');
                    if (in_array('is_active', $columns, true)) {
                        $query->where('is_active', 1);
                    }
                    foreach ($query->orderBy($nameColumn)->limit(10000)->pluck($nameColumn) as $name) {
                        $add($name);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Continue with the legacy mirror.
        }

        try {
            $legacy = DB::connection('legacy');
            $schema = $legacy->getSchemaBuilder();
            if ($schema->hasTable('InvTickets')) {
                $columns = $schema->getColumnListing('InvTickets');
                $fromColumn = $this->firstExisting($columns, ['InvSector', 'Sector']);
                $toColumn = $this->firstExisting($columns, ['invSectorTo', 'InvSectorTo', 'SectorTo']);
                $modeColumn = $this->firstExisting($columns, ['InvMode', 'Mode']);

                $select = [];
                if ($fromColumn !== null) $select[] = $fromColumn . ' as sector_from';
                if ($toColumn !== null) $select[] = $toColumn . ' as sector_to';

                if ($select !== []) {
                    $query = $legacy->table('InvTickets')->select($select);
                    if ($modeColumn !== null) {
                        $query->whereRaw(
                            "UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?",
                            ['TRANSFER'],
                        );
                    }

                    foreach ($query->limit(100000)->get() as $row) {
                        $add($row->sector_from ?? '');
                        $add($row->sector_to ?? '');
                    }
                }
            }
        } catch (\Throwable $e) {
            // The local master remains usable if the legacy mirror is unavailable.
        }

        $result = [];
        foreach ($names as $name) {
            $result[] = [
                'id' => crc32(strtolower($name)),
                'name' => $name,
                'source' => Schema::hasTable('transfer_locations') ? 'native/accu' : 'accu',
            ];
        }

        usort($result, static fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));
        return $result;
    }

    /**
     * Visa package/type options for the sales form.
     *
     * Primary source is the local visa_types master populated by migration.
     * During migration/transition, retain safe fallbacks from existing local
     * invoice transactions and the Accu archive so the form never becomes an
     * empty hard-coded dropdown just because one source is temporarily empty.
     */
    private function visaOptions(): array
    {
        $names = [];

        $add = static function ($value) use (&$names): void {
            $name = trim((string) ($value ?? ''));
            if ($name === '') {
                return;
            }
            $names[strtolower($name)] = $name;
        };

        // 1) Dedicated local master (authoritative for new entries).
        try {
            if (Schema::hasTable('visa_types')) {
                $query = DB::table('visa_types')
                    ->select('name')
                    ->whereNotNull('name')
                    ->where('name', '<>', '');

                if (Schema::hasColumn('visa_types', 'is_active')) {
                    $query->where('is_active', 1);
                }

                foreach ($query->orderBy('name')->limit(10000)->pluck('name') as $name) {
                    $add($name);
                }
            }
        } catch (\Throwable $e) {
            // Continue to transition fallbacks.
        }

        // 2) Existing normalized/imported invoice lines.
        try {
            if (Schema::hasTable('invoice_transactions')
                && Schema::hasColumn('invoice_transactions', 'particulars_2')
            ) {
                $query = DB::table('invoice_transactions')
                    ->select('particulars_2')
                    ->whereNotNull('particulars_2')
                    ->where('particulars_2', '<>', '')
                    ->whereRaw("UPPER(TRIM(COALESCE(mode, ''))) = ?", ['VISA']);

                foreach ($query->distinct()->orderBy('particulars_2')->limit(10000)->pluck('particulars_2') as $name) {
                    $add($name);
                }
            }
        } catch (\Throwable $e) {
            // Optional transition fallback.
        }

        // 3) Legacy Accu source.
        try {
            $legacySchema = Schema::connection('legacy');
            if ($legacySchema->hasTable('InvTickets')) {
                $columns = $legacySchema->getColumnListing('InvTickets');
                $packageColumn = $this->firstExisting($columns, [
                    'InvParticulars2', 'Package', 'VisaType', 'Visa Type', 'InvPackage',
                ]);
                $modeColumn = $this->firstExisting($columns, [
                    'InvMode', 'Mode',
                ]);

                if ($packageColumn !== null) {
                    $query = DB::connection('legacy')
                        ->table('InvTickets')
                        ->select($packageColumn . ' as visa_name')
                        ->whereNotNull($packageColumn)
                        ->where($packageColumn, '<>', '');

                    if ($modeColumn !== null) {
                        $query->whereRaw(
                            "UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?",
                            ['VISA'],
                        );
                    }

                    foreach ($query->orderBy($packageColumn)->limit(10000)->pluck('visa_name') as $name) {
                        $add($name);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Archive is optional at runtime.
        }

        return array_values($names);
    }


    /**
     * Hotel master for the sales form.
     *
     * HBA was migrated from Accu-Travel, where the hotel master is part of the
     * legacy source database rather than necessarily being present as a local
     * `hotels` table.  Keep the native local table (when present) and merge the
     * migrated Accu hotel names so the form can search the complete list.
     */
    private function hotelOptions(): array
    {
        $local = $this->dynamicOptions(
            'hotels',
            ['id', 'hotel_id'],
            ['name', 'hotel_name'],
            [
                'vendor_account_code',
                'vendor_code',
                'payable_account_code',
                'city',
                'city_name',
                'sector',
                'location',
                'legacy_hotel_id',
            ],
        );

        $legacy = $this->legacyHotelOptions();

        if ($local === [] && $legacy === []) {
            return [];
        }

        $merged = [];
        foreach (array_merge($local, $legacy) as $option) {
            $name = trim((string) ($option['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $city = trim((string) (
                $option['city']
                ?? $option['city_name']
                ?? $option['sector']
                ?? $option['location']
                ?? ''
            ));
            $option['name'] = $name;
            if ($city !== '') {
                $option['city'] = $city;
            }

            $key = strtolower($name . '|' . $city);
            if (!isset($merged[$key])) {
                $merged[$key] = $option;
            } else {
                // Prefer a real local record/actual legacy hotel ID over a
                // name-only fallback from another source.
                $existing = $merged[$key];
                if (
                    (empty($existing['legacy_hotel_id']) && !empty($option['legacy_hotel_id']))
                    || (!empty($option['vendor_account_code']) && empty($existing['vendor_account_code']))
                ) {
                    $merged[$key] = array_merge($existing, $option);
                }
            }
        }

        return array_values($merged);
    }

    /**
     * Read the migrated hotel master from the legacy Accu-Travel database.
     * InvTickets is the primary source because it contains InvHotel +
     * SimilarHotel. Master is used as a secondary name-only fallback.
     */
    private function legacyHotelOptions(): array
    {
        $options = [];
        $byKey = [];

        try {
            $legacySchema = Schema::connection('legacy');
            if ($legacySchema->hasTable('InvTickets')) {
                $columns = $legacySchema->getColumnListing('InvTickets');

                $idColumn = $this->firstExisting(
                    $columns,
                    ['InvHotel', 'HotelID', 'Hotel Id', 'HotelIDNo']
                );
                $nameColumn = $this->firstExisting(
                    $columns,
                    ['SimilarHotel', 'HotelName', 'Hotel Name']
                );
                $cityColumn = $this->firstExisting(
                    $columns,
                    ['InvHotelCity', 'HotelCity', 'City', 'InvCity', 'Sector']
                );
                $modeColumn = $this->firstExisting(
                    $columns,
                    ['InvMode', 'Mode']
                );

                if ($nameColumn !== null) {
                    $query = DB::connection('legacy')
                        ->table('InvTickets')
                        ->select([$nameColumn . ' as hotel_name']);

                    if ($idColumn !== null) {
                        $query->addSelect($idColumn . ' as legacy_hotel_id');
                    }
                    if ($cityColumn !== null) {
                        $query->addSelect($cityColumn . ' as city');
                    }

                    if ($modeColumn !== null) {
                        $query->where(function ($q) use ($modeColumn): void {
                            $q->whereRaw('UPPER(TRIM(COALESCE(`' . $modeColumn . '`, \'\'))) = ?', ['HOTEL'])
                                ->orWhereNull($modeColumn)
                                ->orWhereRaw('TRIM(COALESCE(`' . $modeColumn . '`, \'\')) = ?', ['']);
                        });
                    }

                    $rows = $query
                        ->whereNotNull($nameColumn)
                        ->orderBy($nameColumn)
                        ->limit(10000)
                        ->get();

                    foreach ($rows as $row) {
                        $name = trim((string) ($row->hotel_name ?? ''));
                        if (!$this->isMeaningfulHotelMasterName($name)) {
                            continue;
                        }

                        $city = trim((string) ($row->city ?? ''));
                        if ($city === '') {
                            $city = $this->inferHotelCityFromText($name);
                        }

                        $legacyId = isset($row->legacy_hotel_id) && $row->legacy_hotel_id !== ''
                            ? (int) $row->legacy_hotel_id
                            : null;

                        $key = strtolower($name . '|' . $city);
                        if (isset($byKey[$key])) {
                            if ($byKey[$key]['legacy_hotel_id'] === null && $legacyId !== null) {
                                $byKey[$key]['legacy_hotel_id'] = $legacyId;
                                $byKey[$key]['id'] = $this->legacyHotelUiId($legacyId, $name);
                            }
                            continue;
                        }

                        $byKey[$key] = [
                            'id' => $this->legacyHotelUiId($legacyId, $name),
                            'name' => $name,
                            'city' => $city,
                            'legacy_hotel_id' => $legacyId,
                            'source' => 'accu',
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            // Legacy hotel data is supplementary. If the connection/table is
            // unavailable, the normalized/local sources below remain usable.
        }

        // Some migrated Accu installations carry hotel names only in Master.
        // Use it to fill any names that are not exposed through InvTickets.
        try {
            $legacySchema = Schema::connection('legacy');
            if ($legacySchema->hasTable('Master')) {
                $columns = $legacySchema->getColumnListing('Master');
                $nameColumn = $this->firstExisting($columns, ['HotelName', 'Hotel Name']);
                $descriptionColumn = $this->firstExisting($columns, ['Sector/Description', 'Sector Description', 'Sector']);
                $modeColumn = $this->firstExisting($columns, ['Mode']);

                if ($nameColumn !== null) {
                    $query = DB::connection('legacy')
                        ->table('Master')
                        ->select([$nameColumn . ' as hotel_name']);

                    if ($descriptionColumn !== null) {
                        $query->addSelect($descriptionColumn . ' as description');
                    }

                    if ($modeColumn !== null) {
                        $query->whereRaw('UPPER(TRIM(COALESCE(`' . $modeColumn . '`, \'\'))) = ?', ['HOTEL']);
                    }

                    $rows = $query
                        ->whereNotNull($nameColumn)
                        ->orderBy($nameColumn)
                        ->limit(10000)
                        ->get();

                    foreach ($rows as $row) {
                        $name = trim((string) ($row->hotel_name ?? ''));
                        if (!$this->isMeaningfulHotelMasterName($name)) {
                            continue;
                        }

                        $city = $this->inferHotelCityFromText(
                            trim((string) ($row->description ?? ''))
                        );
                        $key = strtolower($name . '|' . $city);

                        if (!isset($byKey[$key])) {
                            $byKey[$key] = [
                                'id' => $this->legacyHotelUiId(null, $name . '|' . $city),
                                'name' => $name,
                                'city' => $city,
                                'legacy_hotel_id' => null,
                                'source' => 'accu-master',
                            ];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Same fallback behaviour as above.
        }

        $options = array_values($byKey);
        usort($options, static function (array $a, array $b): int {
            return strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
        });

        return $options;
    }

    private function legacyHotelUiId(?int $legacyId, string $seed): int
    {
        if ($legacyId !== null && $legacyId > 0) {
            // Keep legacy IDs visually separate from the local auto-increment
            // IDs used by the native HBA hotel master.
            return -abs($legacyId);
        }

        $hash = sprintf('%u', crc32(strtolower(trim($seed))));
        return -(100000000 + (int) ($hash % 899999999));
    }

    private function isMeaningfulHotelMasterName(string $name): bool
    {
        $normalized = strtolower(trim($name));
        if ($normalized === '' || in_array($normalized, ['-', 'n/a', 'na', 'null', 'none'], true)) {
            return false;
        }

        return true;
    }

    private function inferHotelCityFromText(string $text): string
    {
        $text = trim($text);
        if ($text === '') {
            return '';
        }

        // Most Accu hotel descriptions follow:
        // PREFIX-HOTEL NAME-CITY-...
        $parts = array_values(array_filter(
            array_map('trim', explode('-', $text)),
            static fn ($value) => $value !== ''
        ));

        if (count($parts) >= 3) {
            $candidate = $parts[2];
            if (
                strlen($candidate) <= 80
                && !is_numeric($candidate)
                && !str_contains(strtolower($candidate), 'pax')
            ) {
                return $candidate;
            }
        }

        return '';
    }

    private function dynamicOptions(
        string $table,
        array $idCandidates,
        array $nameCandidates,
        array $extraCandidates,
    ): array {
        if (!Schema::hasTable($table)) {
            return [];
        }

        $columns = Schema::getColumnListing($table);
        $idColumn = $this->firstExisting($columns, $idCandidates);
        $nameColumn = $this->firstExisting($columns, $nameCandidates);

        if ($idColumn === null || $nameColumn === null) {
            return [];
        }

        $select = [
            $idColumn . ' as id',
            $nameColumn . ' as name',
        ];

        foreach ($extraCandidates as $candidate) {
            if (in_array($candidate, $columns, true)) {
                $select[] = $candidate;
            }
        }

        return DB::table($table)
            ->select($select)
            ->orderBy($nameColumn)
            ->limit(500)
            ->get()
            ->map(function ($row): array {
                $data = [
                    'id' => (int) $row->id,
                    'name' => (string) ($row->name ?? ''),
                ];

                foreach (get_object_vars($row) as $key => $value) {
                    if ($key === 'id' || $key === 'name') {
                        continue;
                    }
                    $data[$key] = $value;
                }

                return $data;
            })
            ->values()
            ->all();
    }

    private function mergeLegacyInvoiceHeader(array $header, object $legacyInvoice): array
    {
        $clientCode = trim((string) ($legacyInvoice->{'Client Code'} ?? ''));
        $clientAccount = $clientCode !== ''
            ? DB::table('accounts')
                ->select('id', 'code', 'name')
                ->where('code', $clientCode)
                ->first()
            : null;

        $date = static fn ($value): string => $value
            ? substr((string) $value, 0, 10)
            : '';

        $header['invoice_date'] = $date($legacyInvoice->{'Invoice Date'} ?? null) ?: $header['invoice_date'];
        $header['ref_no'] = trim((string) ($legacyInvoice->{'Ref #'} ?? ''));
        if ($clientAccount) {
            $header['client_account_id'] = (int) $clientAccount->id;
            $header['client_code'] = (string) $clientAccount->code;
            $header['client_name'] = (string) $clientAccount->name;
        } elseif ($clientCode !== '') {
            $header['client_code'] = $clientCode;
            $header['client_name'] = $clientCode;
        }

        $header['employee'] = trim((string) ($legacyInvoice->{'Employee'} ?? ''));
        $header['sales_tax_invoice_no'] = $legacyInvoice->{'SalesTaxInvoiceNo'} !== null
            ? (string) $legacyInvoice->{'SalesTaxInvoiceNo'}
            : '';
        $header['payment_terms'] = trim((string) ($legacyInvoice->{'PaymentTerms'} ?? ''));
        $header['due_date'] = $date($legacyInvoice->{'DueDate'} ?? null);
        $header['due_date_vendor'] = $date($legacyInvoice->{'DueDateVendor'} ?? null);
        $header['supervised'] = (bool) ($legacyInvoice->{'Supervised'} ?? false);
        $header['ticket_query_id'] = $legacyInvoice->{'TicketQueryID'} !== null
            ? (string) $legacyInvoice->{'TicketQueryID'}
            : '';
        $header['umrah_query_id'] = $legacyInvoice->{'UmrahQueryID'} !== null
            ? (string) $legacyInvoice->{'UmrahQueryID'}
            : '';
        $header['branch_id'] = (int) ($legacyInvoice->{'Branch'} ?? $header['branch_id']);
        $header['department_id'] = (int) ($legacyInvoice->{'Department'} ?? $header['department_id']);
        $header['status'] = trim((string) ($legacyInvoice->{'Status'} ?? '')) ?: $header['status'];
        $header['active'] = (int) ($legacyInvoice->{'Active'} ?? 1) === 1;
        $header['remarks'] = (string) ($legacyInvoice->{'Remarks'} ?? '');

        return $header;
    }

    private function decorateHeader(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'invoice_number' => (string) $row->legacy_invoice_id,
            'invoice_date' => $row->invoice_date ? substr((string) $row->invoice_date, 0, 10) : now()->format('Y-m-d'),
            'ref_no' => (string) ($row->ref_no ?? ''),
            'branch_id' => (int) ($row->branch_id ?? 0),
            'department_id' => (int) ($row->department_id ?? 0),
            'client_account_id' => (int) ($row->client_account_id ?? 0),
            'client_code' => (string) ($row->client_code ?? ''),
            'client_name' => (string) ($row->client_name ?? ''),
            'payment_terms' => (string) ($row->payment_terms ?? ''),
            'employee' => (string) ($row->employee ?? ''),
            'sales_tax_invoice_no' => $row->sales_tax_invoice_no !== null ? (string) $row->sales_tax_invoice_no : '',
            'due_date' => $row->due_date ? substr((string) $row->due_date, 0, 10) : '',
            'due_date_vendor' => $row->due_date_vendor ? substr((string) $row->due_date_vendor, 0, 10) : '',
            'supervised' => (bool) $row->supervised,
            'ticket_query_id' => $row->ticket_query_id !== null ? (string) $row->ticket_query_id : '',
            'umrah_query_id' => $row->umrah_query_id !== null ? (string) $row->umrah_query_id : '',
            'active' => (bool) $row->is_active,
            'status' => (string) ($row->status ?? 'Invoice'),
            'remarks' => (string) ($row->remarks ?? ''),
        ];
    }

    /**
     * Resolve a native invoice's hotel name from the normalized hotel master.
     *
     * `invoice_transactions.similar_hotel` is a legacy boolean flag, so it must
     * never be used as the text storage for the selected hotel's name.
     */
    private function resolveNativeHotelName(?int $storedHotelId): string
    {
        if ($storedHotelId === null || $storedHotelId <= 0) {
            return '';
        }

        if (Schema::hasTable('hotels')) {
            try {
                $columns = Schema::getColumnListing('hotels');
                $idColumn = $this->firstExisting($columns, ['id', 'hotel_id']);
                $nameColumn = $this->firstExisting($columns, ['name', 'hotel_name']);

                if ($idColumn !== null && $nameColumn !== null) {
                    $name = trim((string) (
                        DB::table('hotels')
                            ->where($idColumn, $storedHotelId)
                            ->value($nameColumn) ?? ''
                    ));

                    if ($name !== '') {
                        return $name;
                    }

                    if (in_array('legacy_hotel_id', $columns, true)) {
                        $name = trim((string) (
                            DB::table('hotels')
                                ->where('legacy_hotel_id', $storedHotelId)
                                ->value($nameColumn) ?? ''
                        ));

                        if ($name !== '') {
                            return $name;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Fall through to the legacy mirror lookup below.
            }
        }

        try {
            $legacySchema = Schema::connection('legacy');
            if ($legacySchema->hasTable('InvTickets')) {
                $columns = $legacySchema->getColumnListing('InvTickets');
                $idColumn = $this->firstExisting(
                    $columns,
                    ['InvHotel', 'HotelID', 'Hotel Id', 'HotelIDNo']
                );
                $nameColumn = $this->firstExisting(
                    $columns,
                    ['SimilarHotel', 'HotelName', 'Hotel Name']
                );

                if ($idColumn !== null && $nameColumn !== null) {
                    $name = trim((string) (
                        DB::connection('legacy')
                            ->table('InvTickets')
                            ->where($idColumn, $storedHotelId)
                            ->orderBy($nameColumn)
                            ->value($nameColumn) ?? ''
                    ));

                    if ($this->isMeaningfulLegacyText($name)) {
                        return $name;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Historical fallback is optional for native invoices.
        }

        return '';
    }

    /**
     * Resolve financial values for an imported legacy transaction from the
     * migrated production journal.
     *
     * This method is strictly read-only and is used only for DISPLAY.
     */
    private function importedLegacyJournalFinancials(object $row): ?array
    {
        $invoiceId = (int) ($row->invoice_id ?? 0);
        $legacyInvoiceId = (int) ($row->legacy_invoice_id ?? 0);
        $legacyTransactionId = (int) ($row->legacy_transaction_id ?? 0);

        if (
            $invoiceId <= 0
            || $legacyInvoiceId <= 0
            || $legacyTransactionId <= 0
        ) {
            return null;
        }

        try {
            $journalId = DB::table('journal_entries')
                ->where('invoice_id', $invoiceId)
                ->where('legacy_reference_id', $legacyInvoiceId)
                ->whereRaw(
                    "UPPER(TRIM(COALESCE(voucher_type, ''))) = ?",
                    ['INV'],
                )
                ->orderByDesc('id')
                ->value('id');

            if (!$journalId) {
                return null;
            }

            $rows = DB::table('journal_entry_lines')
                ->where('journal_entry_id', (int) $journalId)
                ->where('legacy_system_id', $legacyTransactionId)
                ->get([
                    'account_code',
                    'debit',
                    'credit',
                ]);

            if ($rows->isEmpty()) {
                return null;
            }

            /*
             * Use the invoice's actual client account code for the customer
             * side. This avoids confusing an agent/other account with the
             * customer simply because both may use a 12xxxx code.
             */
            $clientCode = trim((string) (
                DB::table('invoices as i')
                    ->leftJoin('accounts as a', 'a.id', '=', 'i.client_account_id')
                    ->where('i.id', $invoiceId)
                    ->value('a.code') ?? ''
            ));

            $customerRows = $rows->filter(
                fn ($journalRow): bool =>
                    $clientCode !== ''
                    && trim((string) ($journalRow->account_code ?? '')) === $clientCode
            );

            /*
             * Strong fallback for older imported rows where the invoice
             * client's local account code is unavailable.
             */
            if ($customerRows->isEmpty()) {
                $customerRows = $rows->filter(
                    fn ($journalRow): bool =>
                        str_starts_with(
                            trim((string) ($journalRow->account_code ?? '')),
                            '12',
                        )
                        && (float) ($journalRow->debit ?? 0) > 0.00005
                );
            }

            if ($customerRows->isEmpty()) {
                return null;
            }

            /*
             * Vendor codes stored on this normalized legacy transaction are
             * used to identify the exact payable posting in the migrated
             * journal.
             */
            $vendorCodes = collect([
                $row->payable_account_code ?? null,
                $row->payable_account_2 ?? null,
                $row->payable_account_3 ?? null,
            ])
                ->map(fn ($code) => trim((string) ($code ?? '')))
                ->filter()
                ->unique()
                ->values()
                ->all();

            $vendorRows = $vendorCodes === []
                ? $rows->filter(
                    fn ($journalRow): bool =>
                        str_starts_with(
                            trim((string) ($journalRow->account_code ?? '')),
                            '21',
                        )
                        && (float) ($journalRow->credit ?? 0) > 0.00005
                )
                : $rows->filter(
                    fn ($journalRow): bool =>
                        in_array(
                            trim((string) ($journalRow->account_code ?? '')),
                            $vendorCodes,
                            true,
                        )
                );

            $receivable = (float) $customerRows->sum(
                fn ($journalRow): float =>
                    (float) ($journalRow->debit ?? 0)
                    - (float) ($journalRow->credit ?? 0)
            );

            $payable = (float) $vendorRows->sum(
                fn ($journalRow): float =>
                    (float) ($journalRow->credit ?? 0)
                    - (float) ($journalRow->debit ?? 0)
            );

            if ($receivable <= 0.00005) {
                return null;
            }

            return [
                'receivable_amount' => round($receivable, 4),
                'payable_amount' => round(max($payable, 0), 4),
                'profit_amount' => round($receivable - max($payable, 0), 4),
                'vendor_amount' => round(max($payable, 0), 4),
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function decorateTransaction(object $row): array
    {
        $hotelId = $row->hotel_id_legacy !== null
            ? (int) $row->hotel_id_legacy
            : null;

        $hotelName = $this->resolveNativeHotelName($hotelId);

        $vendorCodes = collect([
            $row->payable_account_code ?? null,
            $row->payable_account_2 ?? null,
            $row->payable_account_3 ?? null,
        ])
            ->map(fn ($code) => trim((string) ($code ?? '')))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $vendorAccounts = $vendorCodes === []
            ? collect()
            : DB::table('accounts')
                ->select('code', 'name')
                ->whereIn('code', $vendorCodes)
                ->get()
                ->keyBy(fn ($account) => (string) $account->code);

        $vendorDetails = collect($vendorCodes)
            ->map(fn (string $code): array => [
                'code' => $code,
                'name' => (string) ($vendorAccounts[$code]->name ?? $code),
            ])
            ->values()
            ->all();

        $vendorTotal = (float) ($row->rate_vendor ?? $row->vendor_rate ?? 0)
            + (float) ($row->fare_2 ?? 0)
            + (float) ($row->fare_3 ?? 0);
        $receivable = (float) ($row->total_fare ?? 0);
        $agentAmount = max((float) ($row->agent_amount ?? 0), 0);
        $mode = (string) ($row->mode ?? 'Other');

        $payableTotal = $vendorTotal
            + (
                in_array(
                    strtoupper(trim($mode)),
                    ['HOTEL', 'VISA', 'TRANSFER', 'TICKET', 'OTHER'],
                    true
                )
                ? $agentAmount
                : 0
            );

        $profit = $receivable - $payableTotal;

        /*
         * Imported legacy transactions have reliable financial values in the
         * migrated journal even when invoice_transactions financial columns
         * are incomplete. Replace ONLY the display variables.
         */
        $importedLegacyFinancials =
            $this->importedLegacyJournalFinancials($row);

        if ($importedLegacyFinancials !== null) {
            $receivable =
                (float) $importedLegacyFinancials['receivable_amount'];

            $payable =
                (float) $importedLegacyFinancials['payable_amount'];

            $profit =
                (float) $importedLegacyFinancials['profit_amount'];
        }


        return [
            'mode' => $mode,
            'type' => (string) ($row->type ?? 'Normal'),
            'airline_code' => (string) ($row->airline_code ?? ''),
            'passenger_name' => (string) ($row->passenger_name ?? ''),
            'passport_no' => (string) ($row->passport_no ?? ''),
            'nationality' => (string) ($row->nationality ?? ''),
            'phone' => (string) ($row->phone ?? ''),
            'address' => (string) ($row->address ?? ''),
            'dob' => $this->dateOnlyNullable($row->dob),
            'payable_account_code' => (string) ($row->payable_account_code ?? ''),
            'payable_account_2' => (string) ($row->payable_account_2 ?? ''),
            'payable_account_3' => (string) ($row->payable_account_3 ?? ''),
            'vendor_name' => (string) ($vendorDetails[0]['name'] ?? ($row->payable_account_code ?? '')),
            'vendor_details' => $vendorDetails,
            'vendor_amount' => (float) ($row->rate_vendor ?? $row->vendor_rate ?? 0),
            'vendor_amount_2' => (float) ($row->fare_2 ?? 0),
            'vendor_amount_3' => (float) ($row->fare_3 ?? 0),
            'vendor_rate_per_night' => (function () use ($row): float {
                $nights = max((float) ($row->nights ?? 0), 0);
                $rooms = max((float) ($row->room_quantity ?? 1), 1);
                $units = $nights * $rooms;
                $vendorTotal = (float) ($row->rate_vendor ?? $row->vendor_rate ?? 0);
                return $units > 0 ? $vendorTotal / $units : 0.0;
            })(),
            'payable_amount' => round($payableTotal, 4),
            'receivable_amount' => $receivable,
            'profit_amount' => round($profit, 4),
            'revenue_account_code' => (string) ($row->other_service_account ?? ''),
            'ticket_no' => (string) ($row->ticket_no ?? ''),
            'con_ticket_no' => (string) ($row->con_ticket_no ?? ''),
            'ticket_type' => (string) ($row->ticket_type ?? ''),
            'sector' => (string) ($row->sector ?? ''),
            'departure_date' => $this->dateOnlyNullable($row->departure_date),
            'return_date' => $this->dateOnlyNullable($row->return_date),
            'flight_no' => (string) ($row->flight_no ?? ''),
            'pnr' => (string) ($row->pnr ?? ''),
            'route' => (string) ($row->route ?? ''),
            'gds' => (string) ($row->gds ?? ''),
            'class' => (string) ($row->class ?? ''),
            'xo' => (string) ($row->xo ?? ''),
            'visa_no' => (string) ($row->particulars_3 ?? ''),
            'documents' => (string) ($row->doc_rec ?? ''),
            'hotel_id' => $row->hotel_id_legacy !== null ? (int) $row->hotel_id_legacy : null,
            'legacy_hotel_id' => $row->hotel_id_legacy !== null ? (int) $row->hotel_id_legacy : null,
            'vehicle_id' => $row->vehicle_id_legacy !== null ? (int) $row->vehicle_id_legacy : null,
            'hotel_name' => $hotelName,
            'room_type' => (string) ($row->room_type ?? ''),
            'meal' => (string) ($row->meal ?? ''),
            'room_no' => (string) ($row->room_no ?? ''),
            'room_quantity' => (float) ($row->room_quantity ?? 0),
            'quantity' => (float) ($row->quantity ?? 0),
            'nights' => $row->nights !== null ? (int) $row->nights : null,
            'rate' => (float) ($row->rate ?? 0),
            'roe' => $row->currency_rate !== null ? (float) $row->currency_rate : 0,
            'rate_sar' => ((float) ($row->currency_rate ?? 0)) > 0
                ? (float) ($row->rate ?? 0) / (float) $row->currency_rate
                : 0,
            'internal_ref_no' => (string) ($row->internal_ref_no ?? ''),
            'confirm_no' => (string) ($row->particulars_2 ?? ''),
            'sector_to' => (string) ($row->sector_to ?? ''),
            'flight_information' => (string) ($row->flight_information ?? ''),
            'package' => (string) ($row->particulars_2 ?? ''),
            'starting_date' => $this->dateOnlyNullable($row->departure_date),
            'ending_date' => $this->dateOnlyNullable($row->return_date),
            'online_date' => $this->dateOnlyNullable($row->online_date),
            'other_service_charges' => (float) ($row->other_service_charges ?? 0),
            'discount' => (float) ($row->discount ?? 0),
            'insurance' => (float) ($row->insurance ?? 0),
            'psf' => (float) ($row->psf ?? 0),
            'psf_amount' => 0,
            'commission_receivable' => (float) ($row->commission_receivable ?? 0),
            'commission_paid' => (float) ($row->commission_paid ?? 0),
            'commission_to_client' => (float) ($row->commission_to_client ?? 0),
            'fare' => (float) ($row->fare ?? 0),
            'sp_apt' => (float) ($row->sp_apt ?? 0),
            'sf_ftt' => (float) ($row->sf_ftt ?? 0),
            'aq_pk_yr' => (float) ($row->aq_pk_yr ?? 0),
            'fed_rg_cvt' => (float) ($row->fed_rg_cvt ?? 0),
            'ced' => (float) ($row->ced ?? 0),
            'jo' => (float) ($row->jo ?? 0),
            'wh_airlines' => (float) ($row->wh_airlines ?? 0),
            'wh_client' => (float) ($row->wh_client ?? 0),
            'yq' => (float) ($row->yq ?? 0),
            'xut' => (float) ($row->xut ?? 0),
            'other_tax' => (float) ($row->other ?? 0),
            'xz' => (float) ($row->xz ?? 0),
            'yd' => (float) ($row->yd ?? 0),
            'fare_including' => (float) ($row->fare_including ?? 0),
            'taxes_including' => (float) ($row->taxes_including ?? 0),
            'pst_percentage' => (float) ($row->pst_percentage ?? 0),
            'pst' => (float) ($row->pst ?? 0),
            'pst_paid' => (float) ($row->pst_paid ?? 0),
            'fare_nc' => (float) ($row->fare_nc ?? 0),
            'currency_code' => (string) ($row->currency_code ?? ''),
            'currency_quantity' => $row->currency_quantity !== null ? (float) $row->currency_quantity : null,
            'currency_rate' => $row->currency_rate !== null ? (float) $row->currency_rate : null,
            'agent_code' => (string) ($row->agent_code ?? ''),
            'agent_amount' => $agentAmount,
            'particulars_2' => (string) ($row->particulars_2 ?? ''),
            'particulars_3' => (string) ($row->particulars_3 ?? ''),
            'passenger_type' => (string) ($row->passenger_type ?? 'Adult'),
            'group_no' => $row->group_no !== null ? (string) $row->group_no : '',
        ];
    }

    private function blankLine(): array
    {
        $defaultIncome = DB::table('accounts')
            ->where('code', '4200003')
            ->value('code');

        return [
            'mode' => 'Ticket',
            'type' => 'Normal',
            'airline_code' => '',
            'passenger_name' => '',
            'passport_no' => '',
            'nationality' => '',
            'phone' => '',
            'address' => '',
            'dob' => '',
            'passenger_type' => 'Adult',
            'group_no' => '',
            'payable_account_code' => '',
            'payable_account_2' => '',
            'payable_account_3' => '',
            'vendor_amount' => 0,
            'vendor_amount_2' => 0,
            'vendor_amount_3' => 0,
            'vendor_rate_per_night' => 0,
            'receivable_amount' => 0,
            'revenue_account_code' => (string) ($defaultIncome ?? ''),
            'ticket_no' => '',
            'con_ticket_no' => '',
            'ticket_type' => '',
            'sector' => '',
            'departure_date' => '',
            'return_date' => '',
            'flight_no' => '',
            'pnr' => '',
            'route' => '',
            'gds' => '',
            'class' => '',
            'xo' => '',
            'visa_no' => '',
            'documents' => '',
            'hotel_id' => null,
            'vehicle_id' => null,
            'hotel_name' => '',
            'room_type' => '',
            'meal' => '',
            'room_no' => '',
            'room_quantity' => 1,
            'quantity' => 1,
            'nights' => 0,
            'rate' => 0,
            'internal_ref_no' => '',
            'confirm_no' => '',
            'sector_to' => '',
            'flight_information' => '',
            'package' => '',
            'starting_date' => '',
            'ending_date' => '',
            'online_date' => '',
            'other_service_charges' => 0,
            'discount' => 0,
            'insurance' => 0,
            'psf' => 0,
            'psf_amount' => 0,
            'commission_receivable' => 0,
            'commission_paid' => 0,
            'commission_to_client' => 0,
            'fare' => 0,
            'sp_apt' => 0,
            'sf_ftt' => 0,
            'aq_pk_yr' => 0,
            'fed_rg_cvt' => 0,
            'ced' => 0,
            'jo' => 0,
            'wh_airlines' => 0,
            'wh_client' => 0,
            'yq' => 0,
            'xut' => 0,
            'other_tax' => 0,
            'xz' => 0,
            'yd' => 0,
            'fare_including' => 0,
            'taxes_including' => 0,
            'pst_percentage' => 0,
            'pst' => 0,
            'pst_paid' => 0,
            'fare_nc' => 0,
            'currency_code' => '',
            'currency_quantity' => null,
            'currency_rate' => null,
            'agent_code' => '',
            'agent_amount' => 0,
            'particulars_2' => '',
            'particulars_3' => '',
        ];
    }

    private function assertAccountType(?object $account, string $type): void
    {
        if (!$account) {
            throw ValidationException::withMessages([
                'client_account_id' => 'The selected account was not found.',
            ]);
        }

        $code = (string) $account->code;

        if (
            $type === 'client'
            && !str_starts_with($code, '12')
            && !str_starts_with($code, '21')
        ) {
            throw ValidationException::withMessages([
                'client_account_id' =>
                    'Select a receivable/customer or payable/vendor account (12xxxxx or 21xxxxx).',
            ]);
        }

        if ($type === 'vendor' && !str_starts_with($code, '21')) {
            throw ValidationException::withMessages([
                'account' => 'Select a payable/vendor account (21xxxxx).',
            ]);
        }

        if ($type === 'income' && !str_starts_with($code, '4')) {
            throw ValidationException::withMessages([
                'account' => 'Select an income/sales account (4xxxxx).',
            ]);
        }
    }

	private function assertInvoicePayableAccountType(
    ?string $code,
    int $index,
    string $field,
    bool $allowCustomerAsPayable,
): void {
    if ($code === null || trim($code) === '') {
        return;
    }

    $account = DB::table('accounts')
        ->select('id', 'code', 'name')
        ->where('code', $code)
        ->first();

    if (!$account) {
        throw ValidationException::withMessages([
            "lines.{$index}.{$field}" => 'The selected account does not exist.',
        ]);
    }

    $accountCode = (string) $account->code;

    /*
     * Normal vendor/payable accounts remain 21xxxxx.
     */
    if (str_starts_with($accountCode, '21')) {
        return;
    }

    /*
     * Web Invoice UI may intentionally use a customer account
     * as the payable/vendor account.
     *
     * WhatsApp requests do not carry X-Inertia, so they remain
     * restricted to normal 21xxxxx vendor accounts.
     */
    if (
        $allowCustomerAsPayable &&
        str_starts_with($accountCode, '12')
    ) {
        return;
    }

    throw ValidationException::withMessages([
        "lines.{$index}.{$field}" =>
            'Select a vendor/payable account (21xxxxx).',
    ]);
}

    private function assertOptionalAccountType(?string $code, string $type, int $index, string $field): void
    {
        if ($code === null || trim($code) === '') {
            return;
        }

        $account = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->where('code', $code)
            ->first();

        if (!$account) {
            throw ValidationException::withMessages([
                "lines.{$index}.{$field}" => 'The selected account does not exist.',
            ]);
        }

        $expected = match ($type) {
            'vendor' => '21',
            'income' => '4',
            'agent' => '12',
            default => '',
        };

        if ($expected !== '' && !str_starts_with((string) $account->code, $expected)) {
            throw ValidationException::withMessages([
                "lines.{$index}.{$field}" => match ($type) {
                    'vendor' => 'Select a vendor/payable account (21xxxxx).',
                    'income' => 'Select a sales/income account (4xxxxx).',
                    'agent' => 'Select a customer/agent commission account (12xxxxx).',
                    default => 'Select a valid account.',
                },
            ]);
        }
    }

    private function nullableDate($value): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        return substr((string) $value, 0, 10);
    }

    private function dateOnlyNullable($value): string
    {
        return $value ? substr((string) $value, 0, 10) : '';
    }

    private function decorateNullableScalar($value)
    {
        return $value;
    }

    private function detailParticular2(array $line): ?string
    {
        return match ((string) ($line['mode'] ?? '')) {
            'Visa', 'Other' => $this->nullableText($line['package'] ?? null),
            'Hotel' => $this->nullableText($line['confirm_no'] ?? null),
            default => $this->nullableText($line['particulars_2'] ?? null),
        };
    }

    private function detailParticular3(array $line): ?string
    {
        return match ((string) ($line['mode'] ?? '')) {
            'Visa' => $this->nullableText($line['visa_no'] ?? null),
            default => $this->nullableText($line['particulars_3'] ?? null),
        };
    }

    private function formatDescriptionDate($value): string
    {
        if ($value === null || trim((string) $value) === '') {
            return '';
        }

        $value = substr((string) $value, 0, 10);
        $parts = explode('-', $value);
        if (count($parts) !== 3) {
            return $value;
        }

        return $parts[2] . '/' . $parts[1] . '/' . substr($parts[0], -2);
    }

    private function nullableText($value): ?string
    {
        $text = trim((string) ($value ?? ''));
        return $text !== '' ? $text : null;
    }

    private function safeFilename(string $value): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '-', $value) ?: 'document';
    }

    private function firstExisting(array $columns, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            if (in_array($candidate, $columns, true)) {
                return $candidate;
            }
        }

        return null;
    }
}
