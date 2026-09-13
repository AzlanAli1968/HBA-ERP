<?php

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Carbon\Carbon;
use Throwable;

class ClearanceReportsController extends Controller
{
    public function clientwise(Request $request, CompanySettingsService $companyService)
    {
        /*
         * The report page itself must be openable without query parameters.
         * The old strict validator redirected the first visit back to the
         * previous page (often Vendor Balances - Foreign Currency) because
         * account_id/date_from/date_to were all required.
         *
         * Export endpoints below intentionally keep the strict validator.
         */
        $filters = $this->pageFilters($request);

        $data = $filters['account_id'] !== null
            ? $this->buildClientwiseReport($filters)
            : $this->emptyClientwiseReport($filters);

        $data['accounts'] = $this->accountOptions();
        $data['company'] = $companyService->reportData();

        return Inertia::render('Accounting/Clearance/Clientwise', $data);
    }

    public function clientwisePrint(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildClientwiseReport($filters);

        return response()->view('accounting.clearance.clientwise', [
            'report' => $report,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => true,
        ]);
    }

    public function clientwisePdf(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildClientwiseReport($filters);

        $pdf = Pdf::loadView('accounting.clearance.clientwise', [
            'report' => $report,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => false,
        ])->setPaper('a4', 'portrait');

        return $pdf->download(
            'Clientwise-Clearance-' . ($report['account']['code'] ?? 'report') . '-' . now()->format('Ymd-His') . '.pdf'
        );
    }

    public function clientwiseExcel(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildClientwiseReport($filters);
        $company = $companyService->reportData();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Clientwise Clearance');

        $row = 1;
        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", $company['name'] ?? 'HBA TRAVEL & TOURS');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row++;

        if (($company['tagline'] ?? '') !== '') {
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", $company['tagline']);
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", 'Clientwise Clearance Report');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(13);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row++;

        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", 'From ' . $this->formatDate($report['date_from']) . '  To ' . $this->formatDate($report['date_to']));
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row++;

        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", ($report['account']['code'] ?? '') . '  ' . ($report['account']['name'] ?? ''));
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row += 2;

        $headers = ['Invoice ID', 'Invoice Date', 'First Passenger of Invoice', 'Age', 'Invoice', 'Refund', 'Vouchers', 'Net Payable'];
        foreach ($headers as $i => $header) {
            $sheet->setCellValue(chr(65 + $i) . $row, $header);
        }
        $headerRow = $row;
        $sheet->getStyle("A{$row}:H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:H{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('E5E7EB');
        $sheet->getStyle("A{$row}:H{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $row++;

        foreach ($report['rows'] as $item) {
            $values = [
                $item['invoice_id'],
                $this->formatDate($item['invoice_date']),
                $item['first_passenger'],
                $item['age'] === null ? null : $item['age'],
                $item['invoice'],
                $item['refund'],
                $item['vouchers'],
                $item['net_payable'],
            ];
            foreach ($values as $i => $value) {
                $sheet->setCellValue(chr(65 + $i) . $row, $value);
            }
            $row++;
        }

        $sheet->setCellValue("C{$row}", 'Total:');
        $sheet->setCellValue("D{$row}", $report['totals']['age_average']);
        $sheet->setCellValue("E{$row}", $report['totals']['invoice']);
        $sheet->setCellValue("F{$row}", $report['totals']['refund']);
        $sheet->setCellValue("G{$row}", $report['totals']['vouchers']);
        $sheet->setCellValue("H{$row}", $report['totals']['net_payable']);
        $sheet->getStyle("C{$row}:H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("C{$row}:H{$row}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_MEDIUM);

        $widths = [
            'A' => 14,
            'B' => 16,
            'C' => 42,
            'D' => 10,
            'E' => 16,
            'F' => 16,
            'G' => 16,
            'H' => 18,
        ];
        foreach ($widths as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
        $sheet->getStyle("E1:H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->freezePane('A' . ($headerRow + 1));
        $sheet->setAutoFilter("A{$headerRow}:H{$headerRow}");
        $sheet->getPageSetup()->setOrientation('portrait')->setPaperSize('A4')->setFitToWidth(1)->setFitToHeight(0);
        $sheet->getPageMargins()->setLeft(0.25)->setRight(0.25)->setTop(0.5)->setBottom(0.5);

        return $this->downloadSpreadsheet($spreadsheet, 'Clientwise-Clearance-' . ($report['account']['code'] ?? 'report') . '-' . now()->format('Ymd-His') . '.xlsx');
    }

    public function difference(Request $request, CompanySettingsService $companyService)
    {
        /*
         * The report page itself must be openable without query parameters.
         * The strict validated() helper is reserved for print/PDF/Excel.
         */
        $filters = $this->pageFilters($request);

        $data = $filters['account_id'] !== null
            ? $this->buildDifferenceReport($filters)
            : $this->emptyDifferenceReport($filters);

        $data['accounts'] = $this->accountOptions();
        $data['company'] = $companyService->reportData();

        return Inertia::render('Accounting/Clearance/Difference', $data);
    }

    public function differencePrint(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildDifferenceReport($filters);

        return response()->view('accounting.clearance.difference', [
            'report' => $report,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => true,
        ]);
    }

    public function differencePdf(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildDifferenceReport($filters);

        $pdf = Pdf::loadView('accounting.clearance.difference', [
            'report' => $report,
            'company' => $companyService->reportData(),
            'generatedAt' => now(),
            'autoPrint' => false,
        ])->setPaper('a4', 'portrait');

        return $pdf->download(
            'Ledger-Clearance-Difference-' . ($report['account']['code'] ?? 'report') . '-' . now()->format('Ymd-His') . '.pdf'
        );
    }

    public function differenceExcel(Request $request, CompanySettingsService $companyService)
    {
        $filters = $this->validated($request);
        $report = $this->buildDifferenceReport($filters);
        $company = $companyService->reportData();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Ledger vs Clearance');

        $row = 1;
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", $company['name'] ?? 'HBA TRAVEL & TOURS');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row++;
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'Difference in Ledger Balance and Invoice Clearance');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(13);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row++;
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'From ' . $this->formatDate($report['date_from']) . '  To ' . $this->formatDate($report['date_to']));
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row += 2;

        $summary = [
            ['Ledger Balance', $report['ledger_balance']],
            ['Clearance Balance', $report['clearance_balance']],
            ['Difference', $report['difference']],
        ];
        foreach ($summary as $item) {
            $sheet->setCellValue("A{$row}", $item[0]);
            $sheet->setCellValue("B{$row}", $item[1]);
            $sheet->setCellValue("C{$row}", $this->side($item[1]));
            $row++;
        }
        $row += 2;

        $row = $this->writeDifferenceSectionExcel($sheet, $row, 'Vouchers without Invoice Number', ['Date', 'VT', 'Voucher No', 'Debit', 'Credit'], $report['vouchers_without_invoice'], ['date', 'type', 'voucher_no', 'debit', 'credit']);
        $row += 2;
        $row = $this->writeDifferenceSectionExcel($sheet, $row, 'Refunds without Invoice Number', ['Date', 'VT', 'Refund No', 'Amount'], $report['refunds_without_invoice'], ['date', 'type', 'refund_no', 'amount']);
        $row += 2;
        $row = $this->writeDifferenceSectionExcel($sheet, $row, 'Pending Refunds', ['Date', 'VT', 'Refund No', 'Amount'], $report['pending_refunds'], ['date', 'type', 'refund_no', 'amount']);

        foreach (['A' => 24, 'B' => 14, 'C' => 24, 'D' => 18, 'E' => 18] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
        $sheet->getPageSetup()->setOrientation('portrait')->setPaperSize('A4')->setFitToWidth(1)->setFitToHeight(0);
        $sheet->getPageMargins()->setLeft(0.25)->setRight(0.25)->setTop(0.5)->setBottom(0.5);

        return $this->downloadSpreadsheet($spreadsheet, 'Ledger-Clearance-Difference-' . ($report['account']['code'] ?? 'report') . '-' . now()->format('Ymd-His') . '.xlsx');
    }

    private function buildClientwiseReport(array $filters): array
    {
        $accountId = (int) $filters['account_id'];
        $dateFrom = $filters['date_from'];
        $dateTo = $filters['date_to'];

        $account = DB::table('accounts')
            ->where('id', $accountId)
            ->select('id', 'code', 'name')
            ->first();

        if (!$account) {
            return $this->emptyClientwiseReport($filters);
        }

        $legacyAccountCode = trim((string) $account->code);

        /*
         * Accu clientwise clearance is invoice driven.
         *
         * 1. Get invoices belonging to the selected client from Invoice.
         * 2. Read all Master rows for those invoice IDs and total the invoice
         *    debit.  We deliberately DO NOT require Master.Account Code to
         *    equal the client code because an invoice may contain multiple
         *    accounting rows/accounts.
         * 3. Exclude cancelled/inactive invoices.
         * 4. Match receipts using Transuction.Inv No OR Inv No2.
         * 5. Match refunds using Transuction.Rfd No.
         * 6. Clearance matching is NOT limited to the invoice/report date range.
         *    Accu keeps the invoice in the report based on invoice date, while
         *    all linked clearance activity is considered regardless of when it
         *    was posted.
         * 7. Show every active invoice whose final outstanding balance is non-zero.
         */

        $invoiceRows = DB::connection('legacy')
            ->table('Invoice')
            ->whereRaw(
                "CAST(TRIM(COALESCE(`Client Code`, '0')) AS UNSIGNED) = ?",
                [(int) $legacyAccountCode]
            )
            ->whereRaw(
                'DATE(`Invoice Date`) BETWEEN ? AND ?',
                [$dateFrom, $dateTo]
            )
            ->select([
                'Invoice ID',
                'Invoice Date',
                'Status',
                'Active',
            ])
            ->orderBy('Invoice Date')
            ->orderBy('Invoice ID')
            ->get();

        if ($invoiceRows->isEmpty()) {
            $empty = $this->emptyClientwiseReport($filters);
            $empty['account'] = [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
            ];
            return $empty;
        }

        $invoiceMeta = [];
        foreach ($invoiceRows as $invoice) {
            $invoiceId = trim((string) ($invoice->{'Invoice ID'} ?? ''));
            if ($invoiceId === '') {
                continue;
            }

            $status = strtoupper(trim((string) ($invoice->Status ?? '')));
            $active = $invoice->Active;
            $cancelled = str_contains($status, 'CANCEL')
                || str_contains($status, 'VOID')
                || str_contains($status, 'REJECT')
                || ($active !== null && (int) $active === 0);

            if ($cancelled) {
                continue;
            }

            $invoiceMeta[$invoiceId] = [
                'date' => $this->dateValue($invoice->{'Invoice Date'} ?? null),
            ];
        }

        if (empty($invoiceMeta)) {
            $empty = $this->emptyClientwiseReport($filters);
            $empty['account'] = [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
            ];
            return $empty;
        }

        $invoiceIds = array_keys($invoiceMeta);

        /* All Master rows belonging to these invoice IDs. */
        $masterRows = DB::connection('legacy')
            ->table('Master')
            ->whereIn('Voucher ID', $invoiceIds)
            ->whereRaw("UPPER(TRIM(COALESCE(`Voucher Type`, ''))) = 'INV'")
            ->select([
                'ID',
                'Voucher ID',
                'Passenger',
                'Sector/Description',
                'Mode',
                'Debit',
                'Credit',
                'Voucher Date',
                'Posting Date',
            ])
            ->orderByRaw('COALESCE(`Posting Date`,`Voucher Date`) ASC')
            ->orderBy('ID')
            ->get();

        $groups = [];
        foreach ($invoiceMeta as $invoiceId => $meta) {
            $groups[$invoiceId] = [
                'invoice_id' => $invoiceId,
                'invoice_date' => $meta['date'],
                'first_passenger' => '',
                'age' => null,
                'invoice' => 0.0,
                'refund' => 0.0,
                'vouchers' => 0.0,
                'has_clearance_activity' => false,
            ];
        }

        foreach ($masterRows as $row) {
            $invoiceId = trim((string) ($row->{'Voucher ID'} ?? ''));
            if ($invoiceId === '' || !isset($groups[$invoiceId])) {
                continue;
            }

            /* Cancel markers can exist only on Master text. */
            $description = strtoupper(trim((string) ($row->{'Sector/Description'} ?? '')));
            $mode = strtoupper(trim((string) ($row->Mode ?? '')));
            if (
                str_contains($description, 'CANCEL') ||
                str_contains($description, 'VOID') ||
                str_contains($description, 'REJECT') ||
                str_contains($mode, 'CANCEL') ||
                str_contains($mode, 'VOID') ||
                str_contains($mode, 'REJECT')
            ) {
                continue;
            }

            $groups[$invoiceId]['invoice'] += max(
                (float) ($row->Debit ?? 0),
                0
            );

            if ($groups[$invoiceId]['first_passenger'] === '') {
                $passenger = trim((string) ($row->Passenger ?? ''));
                if ($passenger !== '') {
                    $groups[$invoiceId]['first_passenger'] = $passenger;
                }
            }
        }

        /* Passenger + DOB from Accu's invoice ticket table. */
        try {
            $ticketRows = DB::connection('legacy')
                ->table('InvTickets')
                ->whereIn('InvInvoice ID', $invoiceIds)
                ->select(
                    'InvInvoice ID',
                    'InvPassenger Name',
                    'InvDOB',
                    'InvTransuction ID'
                )
                ->orderBy('InvTransuction ID')
                ->get();

            foreach ($ticketRows as $ticket) {
                $invoiceId = trim((string) ($ticket->{'InvInvoice ID'} ?? ''));
                if ($invoiceId === '' || !isset($groups[$invoiceId])) {
                    continue;
                }

                $name = trim((string) ($ticket->{'InvPassenger Name'} ?? ''));
                if ($groups[$invoiceId]['first_passenger'] === '' && $name !== '') {
                    $groups[$invoiceId]['first_passenger'] = $name;
                }

                if ($groups[$invoiceId]['age'] === null && !empty($ticket->{'InvDOB'})) {
                    try {
                        $groups[$invoiceId]['age'] = Carbon::parse($ticket->{'InvDOB'})
                            ->diffInYears(Carbon::parse($groups[$invoiceId]['invoice_date']));
                    } catch (Throwable $e) {
                        // Keep searching for a valid DOB for this invoice.
                    }
                }
            }
        } catch (Throwable $e) {
            // Passenger data is supplementary.
        }

        /*
         * Accu clearance is linked globally by invoice number.  Do not filter
         * Transuction by Account Code here: Inv No / Inv No2 is the stronger
         * relation and is exactly how the old report ties receipts to invoices.
         */
        $voucherRows = DB::connection('legacy')
            ->table('Transuction')
            ->where(function ($q) use ($invoiceIds) {
                $q->whereIn('Inv No', $invoiceIds)
                    ->orWhereIn('Inv No2', $invoiceIds);
            })
            ->get([
                'Transuction ID',
                'Inv No',
                'Inv No2',
                'Rfd No',
                'Debit',
                'Credit',
            ]);

        foreach ($voucherRows as $voucher) {
            $inv1 = trim((string) ($voucher->{'Inv No'} ?? ''));
            $inv2 = trim((string) ($voucher->{'Inv No2'} ?? ''));
            $refundNo = trim((string) ($voucher->{'Rfd No'} ?? ''));

            $invoiceId = isset($groups[$inv1])
                ? $inv1
                : (isset($groups[$inv2]) ? $inv2 : null);

            if ($invoiceId === null) {
                continue;
            }

            $debit = (float) ($voucher->Debit ?? 0);
            $credit = (float) ($voucher->Credit ?? 0);

            if ($refundNo !== '') {
                $amount = $debit - $credit;
                if ($amount != 0.0) {
                    $groups[$invoiceId]['refund'] += $amount;
                    $groups[$invoiceId]['has_clearance_activity'] = true;
                }
                continue;
            }

            $amount = $credit - $debit;
            if ($amount != 0.0) {
                $groups[$invoiceId]['vouchers'] += $amount;
                $groups[$invoiceId]['has_clearance_activity'] = true;
            }
        }

        /*
         * Accu's Clientwise Clearance is invoice-driven, not receipt-driven.
         * An invoice can legitimately appear with zero matched vouchers/refunds.
         * The deciding condition is the final outstanding balance.
         */
        $rows = [];
        foreach ($groups as $group) {
            if ($group['invoice'] <= 0) {
                continue;
            }

            $group['invoice'] = round($group['invoice'], 4);
            $group['refund'] = round($group['refund'], 4);
            $group['vouchers'] = round($group['vouchers'], 4);
            $group['net_payable'] = round(
                $group['invoice'] - $group['refund'] - $group['vouchers'],
                4
            );

            if (abs($group['net_payable']) < 0.00001) {
                continue;
            }

            $rows[] = $group;
        }

        usort(
            $rows,
            fn ($a, $b) => strcmp(
                (string) ($a['invoice_date'] ?? ''),
                (string) ($b['invoice_date'] ?? '')
            ) ?: ((int) $a['invoice_id'] <=> (int) $b['invoice_id'])
        );

        $ages = array_values(array_filter(
            array_map(fn ($row) => $row['age'], $rows),
            fn ($age) => $age !== null
        ));

        return [
            'report_type' => 'clientwise',
            'title' => 'Clientwise Clearance Report',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'account' => [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
            ],
            'rows' => $rows,
            'totals' => [
                'age_average' => !empty($ages)
                    ? round(array_sum($ages) / count($ages), 4)
                    : 0,
                'invoice' => round(array_sum(array_column($rows, 'invoice')), 4),
                'refund' => round(array_sum(array_column($rows, 'refund')), 4),
                'vouchers' => round(array_sum(array_column($rows, 'vouchers')), 4),
                'net_payable' => round(array_sum(array_column($rows, 'net_payable')), 4),
            ],
        ];
    }

    private function buildClientwiseReportFromModernData(array $filters, $account): array
    {
        $accountId = (int) $filters['account_id'];
        $dateFrom = $filters['date_from'];
        $dateTo = $filters['date_to'];

        $invoiceLines = DB::table('journal_entry_lines as l')
            ->where('l.account_id', $accountId)
            ->whereRaw('DATE(COALESCE(l.posting_date,l.voucher_date)) BETWEEN ? AND ?', [$dateFrom, $dateTo])
            ->where(function ($q) {
                $q->whereRaw('LOWER(COALESCE(l.legacy_reference_type,\'\')) = ?', ['invoice'])
                    ->orWhereRaw('UPPER(COALESCE(l.voucher_type,\'\')) = ?', ['INV'])
                    ->orWhereNotNull('l.invoice_id');
            })
            ->select([
                'l.id', 'l.debit', 'l.credit', 'l.posting_date', 'l.voucher_date',
                'l.invoice_id', 'l.legacy_reference_id', 'l.legacy_reference_type',
                'l.passenger', 'l.legacy_data',
            ])
            ->orderByRaw('COALESCE(l.posting_date,l.voucher_date) asc')
            ->orderBy('l.id')
            ->get();

        $groups = [];
        foreach ($invoiceLines as $line) {
            $legacyId = $line->legacy_reference_id !== null && $line->legacy_reference_id !== ''
                ? (string) $line->legacy_reference_id : null;
            $modernId = $line->invoice_id !== null ? (int) $line->invoice_id : null;
            $key = $legacyId !== null ? 'legacy:' . $legacyId : ($modernId !== null ? 'modern:' . $modernId : 'line:' . $line->id);
            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'invoice_id' => $legacyId ?? ($modernId !== null ? (string) $modernId : (string) $line->id),
                    'legacy_invoice_id' => $legacyId,
                    'modern_invoice_id' => $modernId,
                    'invoice_date' => $this->dateValue($line->posting_date ?? $line->voucher_date),
                    'first_passenger' => '',
                    'age' => null,
                    'invoice' => 0.0,
                    'refund' => 0.0,
                    'vouchers' => 0.0,
                    'has_clearance_activity' => false,
                ];
            }
            $groups[$key]['invoice'] += max((float) ($line->debit ?? 0), 0);
            $passenger = trim((string) ($line->passenger ?? ''));
            if ($groups[$key]['first_passenger'] === '' && $passenger !== '') {
                $groups[$key]['first_passenger'] = $passenger;
            }
            $age = $this->extractAgeFromLegacyData($line->legacy_data, $line->posting_date ?? $line->voucher_date);
            if ($groups[$key]['age'] === null && $age !== null) {
                $groups[$key]['age'] = $age;
            }
        }

        $legacyIds = [];
        foreach ($groups as $item) {
            if ($item['legacy_invoice_id'] !== null) {
                $legacyIds[] = $item['legacy_invoice_id'];
            }
        }

        if ($legacyIds !== []) {
            $voucherRows = DB::table('legacy_transactions')
                ->where('account_id', $accountId)
                ->whereRaw('DATE(posting_date) BETWEEN ? AND ?', [$dateFrom, $dateTo])
                ->where(function ($q) use ($legacyIds) {
                    foreach ($legacyIds as $invoiceNo) {
                        $q->orWhere('legacy_invoice_no', $invoiceNo)
                            ->orWhere('legacy_invoice_no_2', $invoiceNo);
                    }
                })
                ->get();

            foreach ($voucherRows as $voucher) {
                $legacyNo = trim((string) ($voucher->legacy_invoice_no ?? ''));
                $legacyNo2 = trim((string) ($voucher->legacy_invoice_no_2 ?? ''));
                $key = $legacyNo !== '' && isset($groups['legacy:' . $legacyNo])
                    ? 'legacy:' . $legacyNo
                    : ($legacyNo2 !== '' && isset($groups['legacy:' . $legacyNo2]) ? 'legacy:' . $legacyNo2 : null);
                if ($key === null) {
                    continue;
                }
                if (trim((string) ($voucher->refund_no ?? '')) !== '') {
                    $groups[$key]['refund'] += max((float) ($voucher->debit ?? 0) - (float) ($voucher->credit ?? 0), 0);
                } else {
                    $groups[$key]['vouchers'] += max((float) ($voucher->credit ?? 0) - (float) ($voucher->debit ?? 0), 0);
                }
                $groups[$key]['has_clearance_activity'] = true;
            }
        }

        $rows = [];
        foreach ($groups as $item) {
            $item['invoice'] = round($item['invoice'], 2);
            $item['refund'] = round($item['refund'], 2);
            $item['vouchers'] = round($item['vouchers'], 2);
            $item['net_payable'] = round($item['invoice'] - $item['refund'] - $item['vouchers'], 2);
            if (! $item['has_clearance_activity'] || abs($item['net_payable']) < 0.00001) {
                continue;
            }
            unset($item['has_clearance_activity']);
            $rows[] = $item;
        }

        usort($rows, fn ($a, $b) => strcmp((string) ($a['invoice_date'] ?? ''), (string) ($b['invoice_date'] ?? '')));
        $ages = array_values(array_filter(array_map(fn ($r) => $r['age'], $rows), fn ($v) => $v !== null));

        return [
            'report_type' => 'clientwise',
            'title' => 'Clientwise Clearance Report',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'account' => $account ? ['id' => (int) $account->id, 'code' => (string) $account->code, 'name' => (string) $account->name] : null,
            'rows' => $rows,
            'totals' => [
                'age_average' => ! empty($ages) ? round(array_sum($ages) / count($ages), 4) : 0,
                'invoice' => round(array_sum(array_column($rows, 'invoice')), 2),
                'refund' => round(array_sum(array_column($rows, 'refund')), 2),
                'vouchers' => round(array_sum(array_column($rows, 'vouchers')), 2),
                'net_payable' => round(array_sum(array_column($rows, 'net_payable')), 2),
            ],
        ];
    }

    private function buildDifferenceReport(array $filters): array
    {
        $accountId = (int) $filters['account_id'];
        $dateFrom = $filters['date_from'];
        $dateTo = $filters['date_to'];

        $account = DB::table('accounts')
            ->where('id', $accountId)
            ->select('id', 'code', 'name')
            ->first();

        if (!$account) {
            return $this->emptyDifferenceReport($filters);
        }

        $legacyAccountCode = trim((string) $account->code);

        /*
         * Ledger Balance is the actual ledger closing balance for the selected
         * period.  This intentionally uses the same normalized accounting
         * tables as the main ledger page.
         */
        $openingBeforePeriod = 0.0;

        if (Schema::hasTable('account_opening_balances')) {
            $openingRow = DB::table('account_opening_balances')
                ->where('account_id', $accountId)
                ->where(function ($q) {
                    $q->whereNull('currency_code')
                        ->orWhere('currency_code', '')
                        ->orWhere('currency_code', 0);
                })
                ->selectRaw(
                    'COALESCE(SUM(opening_debit),0) AS debit, COALESCE(SUM(opening_credit),0) AS credit'
                )
                ->first();

            $openingBeforePeriod += (float) ($openingRow->debit ?? 0)
                - (float) ($openingRow->credit ?? 0);
        }

        $prePeriod = DB::table('journal_entry_lines')
            ->where('account_id', $accountId)
            ->whereRaw(
                'DATE(COALESCE(posting_date,voucher_date)) < ?',
                [$dateFrom]
            )
            ->selectRaw(
                'COALESCE(SUM(debit),0) AS debit, COALESCE(SUM(credit),0) AS credit'
            )
            ->first();

        $openingBeforePeriod += (float) ($prePeriod->debit ?? 0)
            - (float) ($prePeriod->credit ?? 0);

        $period = DB::table('journal_entry_lines')
            ->where('account_id', $accountId)
            ->whereRaw(
                'DATE(COALESCE(posting_date,voucher_date)) BETWEEN ? AND ?',
                [$dateFrom, $dateTo]
            )
            ->selectRaw(
                'COALESCE(SUM(debit),0) AS debit, COALESCE(SUM(credit),0) AS credit'
            )
            ->first();

        $periodDebit = (float) ($period->debit ?? 0);
        $periodCredit = (float) ($period->credit ?? 0);

        $ledgerBalance = $openingBeforePeriod + $periodDebit - $periodCredit;

        /*
         * IMPORTANT: The Accu Difference report's mismatch is caused by
         * vouchers/refunds which exist in the ledger but are NOT attached to an
         * invoice.  These rows are not limited to the report period: the old
         * report shows historical unmatched items (e.g. TURISMO JV 177 dated
         * 01-Feb-2026 while the selected ledger period is July 2026).
         */
        $vouchersWithoutInvoice = [];
        $refundsWithoutInvoice = [];
        $pendingRefunds = [];

        $unmatchedNet = 0.0;

        try {
            $legacyRows = DB::connection('legacy')
                ->table('Transuction as t')
                ->leftJoin('Vouchers as v', 'v.Voucher ID', '=', 't.Voucher ID')
                ->whereRaw(
                    "CAST(TRIM(COALESCE(t.`Account Code`,'0')) AS UNSIGNED) = ?",
                    [(int) $legacyAccountCode]
                )
                ->orderBy('t.`Posting Date`')
                ->orderBy('t.`Transuction ID`')
                ->get([
                    't.`Posting Date` as date',
                    't.`Inv No` as inv_no',
                    't.`Inv No2` as inv_no2',
                    't.`Rfd No` as refund_no',
                    't.`Debit` as debit',
                    't.`Credit` as credit',
                    't.`Cleared` as cleared',
                    'v.`Voucher No` as voucher_no',
                    'v.`Voucher Type` as voucher_type',
                ]);

            foreach ($legacyRows as $row) {
                $inv1 = trim((string) ($row->inv_no ?? ''));
                $inv2 = trim((string) ($row->inv_no2 ?? ''));
                $refundNo = trim((string) ($row->refund_no ?? ''));
                $debit = round((float) ($row->debit ?? 0), 2);
                $credit = round((float) ($row->credit ?? 0), 2);
                $type = strtoupper(trim((string) ($row->voucher_type ?? '')));

                if ($refundNo !== '' && $inv1 === '' && $inv2 === '') {
                    $amount = round($debit - $credit, 2);
                    if ($amount != 0.0) {
                        $refundsWithoutInvoice[] = [
                            'date' => $this->dateValue($row->date),
                            'type' => 'Rfd',
                            'refund_no' => $refundNo,
                            'amount' => abs($amount),
                        ];
                        $unmatchedNet += $amount;

                        if ((int) ($row->cleared ?? 0) === 0) {
                            $pendingRefunds[] = [
                                'date' => $this->dateValue($row->date),
                                'type' => 'Rfd',
                                'refund_no' => $refundNo,
                                'amount' => abs($amount),
                            ];
                        }
                    }

                    continue;
                }

                if ($inv1 !== '' || $inv2 !== '') {
                    continue;
                }

                /* Accu's unmatched section is for non-invoice vouchers. */
                if (in_array($type, ['INV', 'RFD'], true)) {
                    continue;
                }

                if ($debit == 0.0 && $credit == 0.0) {
                    continue;
                }

                $vouchersWithoutInvoice[] = [
                    'date' => $this->dateValue($row->date),
                    'type' => $type !== '' ? $type : 'JV',
                    'voucher_no' => (string) ($row->voucher_no ?? ''),
                    'debit' => $debit,
                    'credit' => $credit,
                ];

                /* Debit increases the difference; credit reduces it. */
                $unmatchedNet += $debit - $credit;
            }
        } catch (Throwable $e) {
            /*
             * If the legacy connection is temporarily unavailable, use the
             * migrated equivalent with the exact same semantics. This fallback
             * must not alter the primary legacy calculation when legacy works.
             */
            $modernRows = DB::table('legacy_transactions as t')
                ->leftJoin('vouchers as v', 'v.id', '=', 't.voucher_id')
                ->where('t.account_id', $accountId)
                ->orderBy('t.posting_date')
                ->orderBy('t.legacy_transaction_id')
                ->get([
                    't.posting_date as date',
                    't.legacy_invoice_no as inv_no',
                    't.legacy_invoice_no_2 as inv_no2',
                    't.refund_no',
                    't.debit',
                    't.credit',
                    't.cleared',
                    'v.voucher_no',
                    'v.voucher_type',
                ]);

            foreach ($modernRows as $row) {
                $inv1 = trim((string) ($row->inv_no ?? ''));
                $inv2 = trim((string) ($row->inv_no2 ?? ''));
                $refundNo = trim((string) ($row->refund_no ?? ''));
                $debit = round((float) ($row->debit ?? 0), 2);
                $credit = round((float) ($row->credit ?? 0), 2);
                $type = strtoupper(trim((string) ($row->voucher_type ?? '')));

                if ($refundNo !== '' && $inv1 === '' && $inv2 === '') {
                    $amount = round($debit - $credit, 2);
                    if ($amount != 0.0) {
                        $refundsWithoutInvoice[] = [
                            'date' => $this->dateValue($row->date),
                            'type' => 'Rfd',
                            'refund_no' => $refundNo,
                            'amount' => abs($amount),
                        ];
                        $unmatchedNet += $amount;
                        if ((int) ($row->cleared ?? 0) === 0) {
                            $pendingRefunds[] = [
                                'date' => $this->dateValue($row->date),
                                'type' => 'Rfd',
                                'refund_no' => $refundNo,
                                'amount' => abs($amount),
                            ];
                        }
                    }
                    continue;
                }

                if ($inv1 !== '' || $inv2 !== '' || in_array($type, ['INV', 'RFD'], true)) {
                    continue;
                }

                if ($debit == 0.0 && $credit == 0.0) {
                    continue;
                }

                $vouchersWithoutInvoice[] = [
                    'date' => $this->dateValue($row->date),
                    'type' => $type !== '' ? $type : 'JV',
                    'voucher_no' => (string) ($row->voucher_no ?? ''),
                    'debit' => $debit,
                    'credit' => $credit,
                ];
                $unmatchedNet += $debit - $credit;
            }
        }

        /*
         * This is the relationship shown by the Accu report:
         *
         * Difference          = unmatched voucher/refund net
         * Clearance Balance   = Ledger Balance - Difference
         *
         * TURISMO example: 1,531,051 - 30 = 1,531,021 and Difference = 30 Dr.
         */
        $difference = round($unmatchedNet, 2);
        $clearanceBalance = round($ledgerBalance - $difference, 2);

        return [
            'report_type' => 'difference',
            'title' => 'Difference in Ledger Balance and Invoice Clearance',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'account' => [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
            ],
            'ledger_balance' => round($ledgerBalance, 2),
            'clearance_balance' => $clearanceBalance,
            'difference' => $difference,
            'ledger_balance_side' => $this->side($ledgerBalance),
            'clearance_balance_side' => $this->side($clearanceBalance),
            'difference_side' => $this->side($difference),
            'clientwise_totals' => [
                'age_average' => 0,
                'invoice' => 0,
                'refund' => 0,
                'vouchers' => 0,
                'net_payable' => 0,
            ],
            'vouchers_without_invoice' => $vouchersWithoutInvoice,
            'refunds_without_invoice' => $refundsWithoutInvoice,
            'pending_refunds' => $pendingRefunds,
        ];
    }

    private function accountOptions(): array
    {
        return DB::table('accounts')
            ->where(function ($q) {
                $q->where('is_active', 1)->orWhereNull('is_active');
            })
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get()
            ->map(fn ($a) => [
                'id' => (int) $a->id,
                'code' => (string) $a->code,
                'name' => (string) $a->name,
            ])
            ->all();
    }

    private function combineMasterInvoiceRows(array $rows): array
    {
        // Kept here as a compatibility helper if this controller is extended later.
        return $rows;
    }

    private function pageFilters(Request $request): array
    {
        $dateFrom = $request->input(
            'date_from',
            Carbon::now()->startOfMonth()->toDateString()
        );

        $dateTo = $request->input(
            'date_to',
            Carbon::now()->toDateString()
        );

        $input = [
            'account_id' => $request->filled('account_id')
                ? $request->input('account_id')
                : null,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        return Validator::make($input, [
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ])->validate();
    }

    private function emptyClientwiseReport(array $filters): array
    {
        return [
            'report_type' => 'clientwise',
            'title' => 'Clientwise Clearance Report',
            'date_from' => $filters['date_from'],
            'date_to' => $filters['date_to'],
            'account' => null,
            'rows' => [],
            'totals' => [
                'age_average' => 0,
                'invoice' => 0,
                'refund' => 0,
                'vouchers' => 0,
                'net_payable' => 0,
            ],
        ];
    }

    private function emptyDifferenceReport(array $filters): array
    {
        return [
            'report_type' => 'difference',
            'title' => 'Difference in Ledger Balance and Invoice Clearance',
            'date_from' => $filters['date_from'],
            'date_to' => $filters['date_to'],
            'account' => null,
            'ledger_balance' => 0,
            'clearance_balance' => 0,
            'difference' => 0,
            'ledger_balance_side' => $this->side(0),
            'clearance_balance_side' => $this->side(0),
            'difference_side' => $this->side(0),
            'clientwise_totals' => [
                'age_average' => 0,
                'invoice' => 0,
                'refund' => 0,
                'vouchers' => 0,
                'net_payable' => 0,
            ],
            'vouchers_without_invoice' => [],
            'refunds_without_invoice' => [],
            'pending_refunds' => [],
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ]);
    }

    private function dateValue($value): ?string
    {
        if (!$value) {
            return null;
        }
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (Throwable $e) {
            return substr((string) $value, 0, 10);
        }
    }

    private function formatDate(?string $value): string
    {
        if (!$value) {
            return '';
        }
        try {
            return Carbon::parse($value)->format('d-M-Y');
        } catch (Throwable $e) {
            return (string) $value;
        }
    }

    private function side(float $value): string
    {
        return $value < 0 ? 'Cr' : 'Dr';
    }

    private function objectValue(object $object, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (isset($object->{$key}) && trim((string) $object->{$key}) !== '') {
                return trim((string) $object->{$key});
            }
        }
        return null;
    }

    private function extractAgeFromLegacyData($json, $invoiceDate): ?int
    {
        if (!$json) {
            return null;
        }
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = json_decode((string) $json, true);
        }
        if (!is_array($data)) {
            return null;
        }

        $ageKeys = ['Age', 'age', 'Passenger Age', 'Pax Age', 'passenger_age'];
        foreach ($ageKeys as $key) {
            if (isset($data[$key]) && is_numeric($data[$key])) {
                return (int) round((float) $data[$key]);
            }
        }

        $dobKeys = ['DOB', 'Dob', 'dob', 'Date of Birth', 'date_of_birth'];
        foreach ($dobKeys as $key) {
            if (!empty($data[$key])) {
                try {
                    $dob = Carbon::parse($data[$key]);
                    $asOf = $invoiceDate ? Carbon::parse($invoiceDate) : now();
                    return $dob->diffInYears($asOf);
                } catch (Throwable $e) {
                    return null;
                }
            }
        }

        return null;
    }

    private function writeDifferenceSectionExcel($sheet, int $row, string $title, array $headers, array $data, array $keys): int
    {
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", $title);
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
        $row++;

        foreach ($headers as $i => $header) {
            $sheet->setCellValue(chr(65 + $i) . $row, $header);
        }
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('E5E7EB');
        $row++;

        foreach ($data as $item) {
            foreach ($keys as $i => $key) {
                $value = $item[$key] ?? null;
                if ($key === 'date') {
                    $value = $this->formatDate($value);
                }
                $sheet->setCellValue(chr(65 + $i) . $row, $value);
            }
            $row++;
        }

        return $row;
    }

    private function downloadSpreadsheet(Spreadsheet $spreadsheet, string $filename)
    {
        $writer = new Xlsx($spreadsheet);
        $path = storage_path('app/' . uniqid('clearance_', true) . '.xlsx');
        $writer->save($path);
        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }
}
