<?php

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use DateTimeImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesReportsController extends Controller
{
    private const REPORTS = [
        'Simple Sale Register',
        'Simple Sale Register - Category wise Client Report',
        'Simple Sale Register - Client wise',
        'Simple Sale Register - Modewise',
    ];

    public function index(Request $request, CompanySettingsService $companyService)
    {
        return Inertia::render('Reports/Sales', array_merge(
            [
                'reportNames' => self::REPORTS,
                'company' => $companyService->reportData(),
            ],
            $this->buildReport($request),
        ));
    }

    public function print(Request $request, CompanySettingsService $companyService)
    {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();
        $generatedAt = now();

        // Render the report directly instead of resolving a named Blade view.
        // This keeps Print working even when the reports.sales view has not
        // been published/copied into resources/views on the local install.
        $html = $this->renderSalesReportHtml($report, $company, $generatedAt, true);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }

    public function pdf(Request $request, CompanySettingsService $companyService)
    {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();
        $generatedAt = now();

        // Use loadHtml() so PDF generation has no dependency on a named Blade
        // view (reports.sales).
        $html = $this->renderSalesReportHtml($report, $company, $generatedAt, false);

        $pdf = Pdf::loadHtml($html)->setPaper('a4', 'portrait');

        return $pdf->download($this->safeFilename(
            'Sales-' . $report['report_name'] . '-' . $generatedAt->format('Ymd-His') . '.pdf',
        ));
    }

    public function excel(Request $request, CompanySettingsService $companyService): StreamedResponse
    {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();
        $columns = $report['columns'];
        $lastColumn = $this->excelColumn(count($columns));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sales Report');

        $row = 1;
        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", (string) ($company['name'] ?? 'HBA TRAVEL & TOURS'));
        $this->excelTitle($sheet, "A{$row}:{$lastColumn}{$row}", 16);
        $row++;

        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", (string) ($company['tagline'] ?? ''));
        $this->excelSubtitle($sheet, "A{$row}:{$lastColumn}{$row}");
        $row += 2;

        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", $report['report_title']);
        $this->excelTitle($sheet, "A{$row}:{$lastColumn}{$row}", 14);
        $row++;

        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", 'From ' . $this->displayDate($report['date_from']) . ' To ' . $this->displayDate($report['date_to']));
        $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row += 2;

        if (!empty($report['groups'])) {
            foreach ($report['groups'] as $group) {
                $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
                $sheet->setCellValue("A{$row}", $group['title']);
                $this->excelSection($sheet, "A{$row}:{$lastColumn}{$row}");
                $row++;

                $this->writeExcelHeader($sheet, $row, $columns);
                $row++;
                foreach ($group['rows'] as $item) {
                    $this->writeExcelRow($sheet, $row, $columns, $item);
                    $row++;
                }
            }
        } else {
            $this->writeExcelHeader($sheet, $row, $columns);
            $row++;
            foreach ($report['rows'] as $item) {
                $this->writeExcelRow($sheet, $row, $columns, $item);
                $row++;
            }
        }

        $totalRow = $row;
        $sheet->setCellValue("A{$totalRow}", 'Total');
        if (count($columns) > 1) {
            $sheet->mergeCells('A' . $totalRow . ':' . $this->excelColumn(max(1, count($columns) - 3)) . $totalRow);
        }

        foreach ($columns as $index => $column) {
            if (!in_array($column['key'], ['receivable', 'payable', 'profit', 'fare', 'taxes'], true)) {
                continue;
            }
            $cell = $this->excelColumn($index + 1) . $totalRow;
            $sheet->setCellValue($cell, (float) ($report['totals'][$column['key']] ?? 0));
            $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
        }

        $sheet->getStyle("A{$totalRow}:{$lastColumn}{$totalRow}")->getFont()->setBold(true);
        $sheet->getStyle("A{$totalRow}:{$lastColumn}{$totalRow}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE);

        foreach ($columns as $index => $column) {
            $sheet->getColumnDimension($this->excelColumn($index + 1))->setWidth($column['width'] ?? 18);
        }

        $sheet->freezePane('A7');
        $sheet->getPageSetup()->setOrientation('landscape');
        $sheet->getPageSetup()->setPaperSize(9);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setScale(null);
        $sheet->getPageMargins()->setLeft(0.2);
        $sheet->getPageMargins()->setRight(0.2);
        $sheet->getPageMargins()->setTop(0.3);
        $sheet->getPageMargins()->setBottom(0.4);

        $filename = $this->safeFilename(
            'Sales-' . $report['report_name'] . '-' . now()->format('Ymd-His') . '.xlsx',
        );

        return response()->streamDownload(static function () use ($spreadsheet): void {
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function buildReport(Request $request): array
    {
        $data = $request->validate([
            'report_name' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $reportName = $data['report_name'] ?? self::REPORTS[0];
        if (!in_array($reportName, self::REPORTS, true)) {
            $reportName = self::REPORTS[0];
        }

        $from = $data['date_from'] ?? now()->startOfMonth()->toDateString();
        $to = $data['date_to'] ?? now()->toDateString();

        $isSimpleRegister = $reportName === 'Simple Sale Register';

        $sourceRows = $this->saleLines($from, $to, $isSimpleRegister);
        $accounts = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->get()
            ->keyBy(fn ($row) => (string) $row->code);
        $branches = DB::table('branches')
            ->select('id', 'name')
            ->get()
            ->keyBy('id');

        $journalEntryIds = $sourceRows
    ->pluck('journal_entry_id')
    ->filter()
    ->unique()
    ->values()
    ->all();

$vendorLines = collect();

if ($journalEntryIds !== []) {
    $vendorLines = DB::table('journal_entry_lines')
        ->whereIn('journal_entry_id', $journalEntryIds)
        ->where('account_code', 'like', '21%')
        ->where('credit', '>', 0)
        ->orderBy('journal_entry_id')
        ->orderBy('id')
        ->get()
        ->groupBy(fn ($row) => (int) $row->journal_entry_id);
}

        $rows = [];
        $usedVendorLineIds = [];

        foreach ($sourceRows as $line) {
            $rows[] = $this->decorateSaleLine(
                $line,
                $vendorLines->get((int) ($line->journal_entry_id ?? 0), collect()),
                $accounts,
                $branches,
                $isSimpleRegister,
                $usedVendorLineIds,
            );
        }

        return match ($reportName) {
            'Simple Sale Register' => $this->simpleRegister($reportName, $from, $to, $rows),
            'Simple Sale Register - Category wise Client Report' => $this->categoryClientRegister($reportName, $from, $to, $rows),
            'Simple Sale Register - Client wise' => $this->clientwiseRegister($reportName, $from, $to, $rows),
            'Simple Sale Register - Modewise' => $this->modewiseRegister($reportName, $from, $to, $rows),
            default => throw new \LogicException('Unknown sales report.'),
        };
    }

    private function saleLines(string $from, string $to, bool $simpleRegister = false): Collection
    {
        if ($simpleRegister) {
            /*
             * Simple Sale Register must use the invoice DETAIL rows only.
             *
             * Verified July-2026 legacy data shows:
             *   - normal sale/client detail rows are primarily 12xxxxx;
             *   - invoice 2050 is a legitimate exception whose client row is
             *     2100115 (BADR UL HARMAIN);
             *   - 32xxxxx debit rows are Commission Paid expense rows and are
             *     not sale-register rows;
             *   - Accu prints genuine 0/0 invoice-detail rows, but not their
             *     21xxxxx vendor-side 0/0 counterparts;
             *   - other reports must keep their original source query.
             *
             * Therefore positive INV rows are included unless they are a
             * 32xxxxx commission expense.  Zero/zero rows are included when
             * they are client/detail-side rows; 21/32/42 counterparts are
             * excluded when the same SubID already has a 12xxxxx zero row.
             */
            return DB::table('journal_entry_lines as jel')
                ->leftJoin('journal_entries as je', 'je.id', '=', 'jel.journal_entry_id')
                ->select('jel.*')
                ->whereRaw(
                    "UPPER(COALESCE(jel.voucher_type, je.voucher_type, '')) = 'INV'"
                )
                ->whereRaw(
                    'DATE(COALESCE(jel.voucher_date, jel.posting_date)) BETWEEN ? AND ?',
                    [$from, $to]
                )
                ->where(function ($query) {
                    // Positive invoice detail rows: exclude Commission Paid.
                    $query->where(function ($positive) {
                        $positive
                            ->where('jel.debit', '>', 0)
                            ->where('jel.account_code', 'not like', '32%');
                    });

                    // Accu prints true zero/zero invoice detail rows.
                    $query->orWhere(function ($zero) {
                        $zero
                            ->where('jel.debit', '=', 0)
                            ->where('jel.credit', '=', 0)
                            ->where(function ($zeroRole) {
                                // Normal client/detail accounts.
                                $zeroRole->where('jel.account_code', 'not like', '21%')
                                    ->where('jel.account_code', 'not like', '32%')
                                    ->where('jel.account_code', 'not like', '42%');

                                // Rare legacy client rows can themselves use a
                                // 21xxxxx account. Keep that row only when there
                                // is no matching 12xxxxx zero-detail row with the
                                // same legacy SubID in this journal entry.
                                $zeroRole->orWhere(function ($legacyClient) {
                                    $legacyClient
                                        ->where('jel.account_code', 'like', '21%')
                                        ->whereNotExists(function ($exists) {
                                            $exists
                                                ->select(DB::raw('1'))
                                                ->from('journal_entry_lines as z')
                                                ->whereColumn('z.journal_entry_id', 'jel.journal_entry_id')
                                                ->where('z.debit', '=', 0)
                                                ->where('z.credit', '=', 0)
                                                ->where('z.account_code', 'like', '12%')
                                                ->whereRaw(
                                                    "JSON_UNQUOTE(JSON_EXTRACT(z.legacy_data, CONCAT(CHAR(36),CHAR(46),CHAR(83),CHAR(117),CHAR(98),CHAR(73),CHAR(68)))) = JSON_UNQUOTE(JSON_EXTRACT(jel.legacy_data, CONCAT(CHAR(36),CHAR(46),CHAR(83),CHAR(117),CHAR(98),CHAR(73),CHAR(68))))"
                                                );
                                        });
                                });
                            });
                    });
                })
                ->orderByRaw('COALESCE(jel.voucher_date, jel.posting_date) ASC')
                ->orderBy('jel.voucher_id')
                ->orderBy('jel.id')
                ->get();
        }

        return DB::table('journal_entry_lines')
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->where('account_code', 'like', '12%')
            ->where('debit', '>', 0)
            ->whereRaw('DATE(COALESCE(voucher_date, posting_date)) BETWEEN ? AND ?', [$from, $to])
            ->orderByRaw('COALESCE(voucher_date, posting_date) ASC')
            ->orderBy('voucher_id')
            ->orderBy('id')
            ->get();
    }

    private function decorateSaleLine(
        object $line,
        Collection $vendorLines,
        Collection $accounts,
        Collection $branches,
        bool $simpleRegister = false,
        array &$usedVendorLineIds = [],
    ): array
    {
        $meta = $this->decodeLegacyData($line->legacy_data ?? null);
        $clientCode = trim((string) ($line->account_code ?? ''));
        $clientName = (string) (($accounts[$clientCode]->name ?? null) ?: $clientCode);

        $sectorDescription = trim((string) ($line->sector_description ?? ''));
        $modeDescription = trim((string) ($line->mode_description ?? $line->mode ?? ''));

        $ticketType = $this->ticketType(
            $meta,
            $modeDescription,
            $sectorDescription,
        );

        $vendor = $simpleRegister
            ? $this->bestVendorLineForSimpleRegister(
                $line,
                $vendorLines,
                $usedVendorLineIds,
            )
            : $this->bestVendorLine($line, $vendorLines);

        $vendorCode = $vendor?->account_code;
        $vendorName = $vendorCode !== null
            ? (string) (($accounts[(string) $vendorCode]->name ?? null) ?: $vendorCode)
            : '';

        $receivable = (float) ($line->debit ?? 0);
        $sourceProfit = $line->profit ?? null;
        $profit = $sourceProfit !== null && $sourceProfit !== ''
            ? (float) $sourceProfit
            : ($receivable - (float) ($vendor?->credit ?? 0));

        /*
         * Accu-Travel treats cancelled invoice detail differently from a
         * normal invoice line: the sale-register payable is 0 even though
         * the underlying journal may contain a vendor credit.
         */
        $isCancelled = $simpleRegister && $this->isCancelledLine(
            $ticketType,
            $meta,
            $modeDescription,
            $sectorDescription,
        );

        if ($isCancelled) {
            $payable = 0.0;
        } elseif ($vendor !== null) {
            $payable = (float) $vendor->credit;
        } else {
            $payable = max($receivable - $profit, 0);
        }

        $travelDates = $this->extractDates($meta, $sectorDescription);
        $fareTax = $this->fareTaxes(
            $meta,
            $receivable,
            (string) ($line->fare_taxes_service ?? ''),
        );

        return [
            'id' => (int) $line->id,
            'voucher_id' => (int) (
    $line->legacy_reference_id
    ?? $line->invoice_id
    ?? $line->voucher_id
    ?? 0
),
            'invoice_date' => $this->dateOnly($line->voucher_date ?? $line->posting_date),
            'online_date' => $this->dataValue($meta, ['online_date', 'online date', 'onlinedate'])
                ?: $this->dateOnly($line->voucher_date ?? $line->posting_date),
            'ticket_no' => $this->firstValue(
                [$line->ticket_no ?? null, $this->dataValue($meta, ['ticket_no', 'ticket no'])],
            ),
            'ticket_type' => $ticketType,
            'passenger' => trim((string) ($line->passenger ?? $this->dataValue($meta, ['passenger', 'passenger_name', 'passenger name']) ?? '')),
            'client_code' => $clientCode,
            'client_name' => $clientName,
            'vendor_code' => (string) ($vendorCode ?? ''),
            'vendor_name' => $vendorName,
            'sector' => $this->deriveSector($sectorDescription, $meta),
            'sector_description' => $sectorDescription,
            'mode' => trim((string) ($line->mode_description ?? $line->mode ?? '')),
            'receivable' => round($receivable, 4),
            'payable' => round($payable, 4),
            'profit' => round($profit, 4),
            'fare' => round($fareTax['fare'], 4),
            'taxes' => round($fareTax['taxes'], 4),
            'branch_id' => $line->branch_id !== null ? (int) $line->branch_id : null,
            'branch_name' => $line->branch_id !== null && isset($branches[$line->branch_id])
                ? (string) $branches[$line->branch_id]->name
                : 'Head Office',
            'passport_no' => $this->firstValue([
                $this->dataValue($meta, ['passport_no', 'passport no', 'passport']),
                $line->ticket_no ?? null,
            ]),
            'father_name' => $this->dataValue($meta, ['father_name', 'father name', 'father']) ?? '',
            'passenger_type' => $this->dataValue($meta, ['passenger_type', 'passenger type']) ?? 'Adult',
            'dob' => $this->dataValue($meta, ['dob', 'date_of_birth', 'date of birth']) ?? '',
            'doi' => $this->dataValue($meta, ['doi', 'date_of_issue', 'date of issue']) ?? '',
            'doe' => $this->dataValue($meta, ['doe', 'date_of_expiry', 'date of expiry']) ?? '',
            'relation' => $this->dataValue($meta, ['relation', 'relationship']) ?? '',
            'dep_date' => $travelDates[0] ?? '',
            'return_date' => $travelDates[1] ?? '',
            'legacy_data' => $meta,
        ];
    }

    private function simpleRegister(string $name, string $from, string $to, array $rows): array
    {
        $columns = [
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 14],
            ['key' => 'voucher_id', 'label' => 'Invoice ID', 'width' => 11],
            ['key' => 'ticket_no', 'label' => 'Ticket No', 'width' => 16],
            ['key' => 'ticket_type', 'label' => 'Ticket Type', 'width' => 14],
            ['key' => 'passenger', 'label' => 'Passenger Name', 'width' => 25],
            ['key' => 'sector', 'label' => 'Sector', 'width' => 16],
            ['key' => 'client_name', 'label' => 'Client Code', 'width' => 23],
            ['key' => 'vendor_name', 'label' => 'Payable To', 'width' => 23],
            ['key' => 'receivable', 'label' => 'Receivable', 'width' => 15],
            ['key' => 'payable', 'label' => 'Payable', 'width' => 15],
            ['key' => 'profit', 'label' => 'Profit', 'width' => 15],
        ];

        /*
         * Accu-Travel displays whole currency units in the Simple Sale
         * Register. The migrated source can contain quarter/half-unit
         * values, so round each printed row first and then calculate the
         * report totals from those displayed values.
         */
        $rows = array_map(static function (array $row): array {
            foreach (['receivable', 'payable', 'profit'] as $key) {
                $row[$key] = round((float) ($row[$key] ?? 0), 0);
            }

            return $row;
        }, $rows);

        return $this->finalReport($name, $from, $to, 'Simple Sale Register', $columns, $rows);
    }

    private function categoryClientRegister(string $name, string $from, string $to, array $rows): array
    {
        $columns = [
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 14],
            ['key' => 'voucher_id', 'label' => 'Invoice ID', 'width' => 11],
            ['key' => 'client_name', 'label' => 'Client Code', 'width' => 22],
            ['key' => 'ticket_no', 'label' => 'Ticket No', 'width' => 16],
            ['key' => 'ticket_type', 'label' => 'Ticket Type', 'width' => 14],
            ['key' => 'passenger', 'label' => 'Passenger Name', 'width' => 24],
            ['key' => 'sector', 'label' => 'Sector', 'width' => 15],
            ['key' => 'fare', 'label' => 'Fare', 'width' => 15],
            ['key' => 'taxes', 'label' => 'Taxes', 'width' => 13],
            ['key' => 'receivable', 'label' => 'Receivable', 'width' => 15],
            ['key' => 'profit', 'label' => 'Profit (Inc Com)', 'width' => 17],
        ];

        $groups = [];
        foreach ($rows as $row) {
            $groupName = $row['branch_name'] ?: 'Head Office';
            $groups[$groupName][] = $row;
        }
        ksort($groups, SORT_NATURAL | SORT_FLAG_CASE);

        $groupObjects = [];
        foreach ($groups as $title => $groupRows) {
            $groupObjects[] = ['title' => $title, 'rows' => $groupRows];
        }

        $report = $this->finalReport(
            $name,
            $from,
            $to,
            'Simple Sale Register - Category wise Client Report',
            $columns,
            $rows,
        );
        $report['groups'] = $groupObjects;
        return $report;
    }

    private function clientwiseRegister(string $name, string $from, string $to, array $rows): array
    {
        $columns = [
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 13],
            ['key' => 'online_date', 'label' => 'Online Date', 'width' => 13],
            ['key' => 'ticket_type', 'label' => 'Type', 'width' => 12],
            ['key' => 'passport_no', 'label' => 'Passport No', 'width' => 15],
            ['key' => 'passenger', 'label' => 'Passenger Name', 'width' => 24],
            ['key' => 'father_name', 'label' => 'Father Name', 'width' => 20],
            ['key' => 'passenger_type', 'label' => 'Type', 'width' => 10],
            ['key' => 'dob', 'label' => 'DOB', 'width' => 12],
            ['key' => 'doi', 'label' => 'DOI', 'width' => 12],
            ['key' => 'doe', 'label' => 'DOE', 'width' => 12],
            ['key' => 'relation', 'label' => 'Relation', 'width' => 11],
            ['key' => 'sector', 'label' => 'Sector', 'width' => 13],
            ['key' => 'dep_date', 'label' => 'Dep Date', 'width' => 12],
            ['key' => 'return_date', 'label' => 'Return Date', 'width' => 12],
            ['key' => 'receivable', 'label' => 'Receivable', 'width' => 15],
        ];

        $filtered = array_values(array_filter($rows, function (array $row): bool {
            $mode = strtoupper((string) ($row['mode'] ?? ''));
            $type = strtoupper((string) ($row['ticket_type'] ?? ''));
            return str_contains($mode, 'HOTEL') || str_contains($mode, 'ALLOTMENT') || $type === 'ALLOTMENT';
        }));

        $groups = [];
        foreach ($filtered as $row) {
            $groups[$row['client_name'] ?: 'Unknown Client'][] = $row;
        }
        ksort($groups, SORT_NATURAL | SORT_FLAG_CASE);

        $groupObjects = [];
        foreach ($groups as $title => $groupRows) {
            $groupObjects[] = ['title' => $title, 'rows' => $groupRows];
        }

        $report = $this->finalReport(
            $name,
            $from,
            $to,
            'Simple Sale Register - Client wise',
            $columns,
            $filtered,
        );
        $report['groups'] = $groupObjects;
        return $report;
    }

    private function modewiseRegister(string $name, string $from, string $to, array $rows): array
    {
        $columns = [
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 14],
            ['key' => 'voucher_id', 'label' => 'Invoice ID', 'width' => 11],
            ['key' => 'ticket_no', 'label' => 'Ticket No', 'width' => 16],
            ['key' => 'passenger', 'label' => 'Passenger Name', 'width' => 25],
            ['key' => 'sector', 'label' => 'Sector', 'width' => 18],
            ['key' => 'client_name', 'label' => 'Client Code', 'width' => 22],
            ['key' => 'vendor_name', 'label' => 'Payable To', 'width' => 22],
            ['key' => 'receivable', 'label' => 'Receivable', 'width' => 15],
            ['key' => 'payable', 'label' => 'Payable', 'width' => 15],
            ['key' => 'profit', 'label' => 'Profit', 'width' => 15],
        ];

        $groups = [
            'Transfer' => [],
            'Normal' => [],
        ];

        foreach ($rows as $row) {
            $mode = strtoupper((string) ($row['mode'] ?? ''));
            $groups[str_contains($mode, 'TRANSFER') ? 'Transfer' : 'Normal'][] = $row;
        }

        $groupObjects = [];
        foreach ($groups as $title => $groupRows) {
            if ($groupRows !== []) {
                $groupObjects[] = ['title' => $title, 'rows' => $groupRows];
            }
        }

        $report = $this->finalReport($name, $from, $to, 'Simple Sale Register - Modewise', $columns, $rows);
        $report['groups'] = $groupObjects;
        return $report;
    }

    private function finalReport(string $reportName, string $from, string $to, string $title, array $columns, array $rows): array
    {
        $totals = [
            'receivable' => 0.0,
            'payable' => 0.0,
            'profit' => 0.0,
            'fare' => 0.0,
            'taxes' => 0.0,
        ];

        foreach ($rows as $row) {
            foreach ($totals as $key => $_) {
                $totals[$key] += (float) ($row[$key] ?? 0);
            }
        }

        return [
            'report_name' => $reportName,
            'report_title' => $title,
            'date_from' => $from,
            'date_to' => $to,
            'columns' => $columns,
            'rows' => $rows,
            'groups' => [],
            'totals' => array_map(fn ($value) => round($value, 4), $totals),
        ];
    }

    private function bestVendorLineForSimpleRegister(
        object $clientLine,
        Collection $vendorLines,
        array &$usedVendorLineIds,
    ): ?object {
        if ($vendorLines->isEmpty()) {
            return null;
        }

        /*
         * The migrated legacy invoice rows carry the original SubID in
         * legacy_data.  For Simple Sale Register this is the authoritative
         * customer-detail -> vendor-detail relationship.
         *
         * Example (invoice 2174):
         *   SubID 53128 client 198,135 -> vendor 176,715
         *   SubID 53129 client  24,480 -> vendor  19,890
         * and so on.
         *
         * Do NOT use passenger/mode/sector scoring here: the same passenger
         * can legitimately have several services in one invoice.
         */
        $clientMeta = $this->decodeLegacyData($clientLine->legacy_data ?? null);
        $clientSubId = $this->dataValue($clientMeta, ['subid', 'sub_id', 'sub id']);

        if ($clientSubId !== null && trim($clientSubId) !== '') {
            foreach ($vendorLines as $vendor) {
                $vendorId = (int) ($vendor->id ?? 0);
                if ($vendorId > 0 && in_array($vendorId, $usedVendorLineIds, true)) {
                    continue;
                }

                $vendorMeta = $this->decodeLegacyData($vendor->legacy_data ?? null);
                $vendorSubId = $this->dataValue($vendorMeta, ['subid', 'sub_id', 'sub id']);

                if ($vendorSubId !== null && trim($vendorSubId) === trim($clientSubId)) {
                    if ($vendorId > 0) {
                        $usedVendorLineIds[] = $vendorId;
                    }

                    return $vendor;
                }
            }
        }

        /*
         * Fallback only for legacy rows that do not expose a SubID.  Keep the
         * fallback deliberately strict so it cannot silently attach a random
         * vendor line on multi-service invoices.
         */
        $clientPassenger = $this->norm($clientLine->passenger ?? '');
        $clientMode = $this->norm($clientLine->mode_description ?? $clientLine->mode ?? '');
        $clientSector = $this->norm($clientLine->sector_description ?? '');
        $clientTicket = $this->norm($clientLine->ticket_no ?? $clientLine->con_ticket_no ?? '');

        $receivable = (float) ($clientLine->debit ?? 0);
        $sourceProfit = $clientLine->profit ?? null;
        $hasSourceProfit = $sourceProfit !== null && $sourceProfit !== '';
        $derivedPayable = $hasSourceProfit
            ? max($receivable - (float) $sourceProfit, 0)
            : null;

        $candidate = null;
        $candidateCount = 0;

        foreach ($vendorLines as $vendor) {
            $vendorId = (int) ($vendor->id ?? 0);
            if ($vendorId > 0 && in_array($vendorId, $usedVendorLineIds, true)) {
                continue;
            }

            $vendorPassenger = $this->norm($vendor->passenger ?? '');
            $vendorMode = $this->norm($vendor->mode_description ?? $vendor->mode ?? '');
            $vendorSector = $this->norm($vendor->sector_description ?? '');
            $vendorTicket = $this->norm($vendor->ticket_no ?? $vendor->con_ticket_no ?? '');
            $vendorCredit = (float) ($vendor->credit ?? 0);

            $matchesIdentity = true;
            $identityCount = 0;

            if ($clientPassenger !== '' || $vendorPassenger !== '') {
                $matchesIdentity = $clientPassenger !== ''
                    && $vendorPassenger !== ''
                    && $clientPassenger === $vendorPassenger;
                $identityCount += $matchesIdentity ? 1 : 0;
            }

            if ($clientMode !== '' || $vendorMode !== '') {
                $matchesIdentity = $matchesIdentity
                    && $clientMode !== ''
                    && $vendorMode !== ''
                    && $clientMode === $vendorMode;
                $identityCount += ($clientMode !== '' && $vendorMode !== '' && $clientMode === $vendorMode) ? 1 : 0;
            }

            if ($clientSector !== '' || $vendorSector !== '') {
                $matchesIdentity = $matchesIdentity
                    && $clientSector !== ''
                    && $vendorSector !== ''
                    && $clientSector === $vendorSector;
                $identityCount += ($clientSector !== '' && $vendorSector !== '' && $clientSector === $vendorSector) ? 1 : 0;
            }

            $amountMatches = $derivedPayable !== null
                && abs($vendorCredit - $derivedPayable) < 0.00005;

            if ($matchesIdentity && $identityCount >= 2 && ($amountMatches || $derivedPayable === null)) {
                $candidate = $vendor;
                $candidateCount++;
            }
        }

        if ($candidateCount === 1 && $candidate !== null) {
            $vendorId = (int) ($candidate->id ?? 0);
            if ($vendorId > 0) {
                $usedVendorLineIds[] = $vendorId;
            }

            return $candidate;
        }

        // A single vendor line is safe to use when the invoice has only one.
        $available = $vendorLines->filter(function ($vendor) use ($usedVendorLineIds): bool {
            $vendorId = (int) ($vendor->id ?? 0);
            return $vendorId <= 0 || !in_array($vendorId, $usedVendorLineIds, true);
        });

        if ($available->count() === 1) {
            $vendor = $available->first();
            $vendorId = (int) ($vendor->id ?? 0);
            if ($vendorId > 0) {
                $usedVendorLineIds[] = $vendorId;
            }

            return $vendor;
        }

        return null;
    }

    private function isCancelledLine(
        string $ticketType,
        array $meta,
        string $mode,
        string $sector,
    ): bool {
        $values = [
            $ticketType,
            $mode,
            $sector,
            $this->dataValue($meta, ['status', 'ticket_status', 'ticket status', 'booking_status', 'booking status']),
            $this->dataValue($meta, ['remarks', 'remark']),
        ];

        foreach ($values as $value) {
            if (str_contains(strtoupper((string) $value), 'CANCEL')) {
                return true;
            }
        }

        return false;
    }

    private function bestVendorLine(object $clientLine, Collection $vendorLines): ?object
    {
        if ($vendorLines->isEmpty()) {
            return null;
        }

        $clientPassenger = $this->norm($clientLine->passenger ?? '');
        $clientMode = $this->norm($clientLine->mode_description ?? $clientLine->mode ?? '');
        $clientSector = $this->norm($clientLine->sector_description ?? '');

        $best = null;
        $bestScore = -1;

        foreach ($vendorLines as $vendor) {
            $score = 0;
            if ($clientPassenger !== '' && $clientPassenger === $this->norm($vendor->passenger ?? '')) {
                $score += 60;
            }
            if ($clientMode !== '' && $clientMode === $this->norm($vendor->mode_description ?? $vendor->mode ?? '')) {
                $score += 25;
            }
            if ($clientSector !== '' && $clientSector === $this->norm($vendor->sector_description ?? '')) {
                $score += 40;
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $vendor;
            }
        }

        if ($best !== null && $bestScore > 0) {
            return $best;
        }

        return $vendorLines->count() === 1 ? $vendorLines->first() : null;
    }

    private function decodeLegacyData($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    private function dataValue(array $data, array $keys): ?string
    {
        $normalized = [];
        foreach ($data as $key => $value) {
            $normalized[$this->normKey($key)] = $value;
        }

        foreach ($keys as $key) {
            $normalizedKey = $this->normKey($key);
            if (!array_key_exists($normalizedKey, $normalized)) {
                continue;
            }

            $value = $normalized[$normalizedKey];
            if ($value !== null && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }

        return null;
    }

    private function firstValue(array $values): string
    {
        foreach ($values as $value) {
            if ($value !== null && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }
        return '';
    }

    private function numberValue(array $data, array $keys): ?float
    {
        $value = $this->dataValue($data, $keys);
        if ($value === null) {
            return null;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', $value);
        if ($clean === '' || !is_numeric($clean)) {
            return null;
        }

        return (float) $clean;
    }

    private function fareTaxes(array $data, float $receivable, string $fareTaxesService): array
    {
        $fare = $this->numberValue($data, ['fare', 'base_fare', 'basic_fare', 'fare_amount']);
        $taxes = $this->numberValue($data, ['taxes', 'tax', 'tax_amount']);

        if ($fare === null || $taxes === null) {
            $text = trim($fareTaxesService);
            if ($text !== '') {
                if ($fare === null && preg_match('/fare\s*[:=]\s*([0-9,]+(?:\.[0-9]+)?)/i', $text, $match)) {
                    $fare = (float) str_replace(',', '', $match[1]);
                }
                if ($taxes === null && preg_match('/tax(?:es)?\s*[:=]\s*([0-9,]+(?:\.[0-9]+)?)/i', $text, $match)) {
                    $taxes = (float) str_replace(',', '', $match[1]);
                }
            }
        }

        return [
            'fare' => $fare ?? $receivable,
            'taxes' => $taxes ?? 0.0,
        ];
    }

    private function ticketType(array $data, string $mode, string $sector): string
    {
        $value = $this->dataValue($data, [
            'ticket_type',
            'ticket type',
            'tickettype',
            'booking_type',
            'booking type',
            'type',
            'status',
            'ticket_status',
            'ticket status',
            'booking_status',
            'booking status',
        ]);

        if ($value !== null) {
            return $value;
        }

        $upperMode = strtoupper($mode);
        $upperSector = strtoupper($sector);

        if (str_contains($upperMode, 'CANCEL') || str_contains($upperSector, 'CANCEL')) {
            return 'CANCELLED';
        }

        if (str_starts_with(trim($upperSector), 'ALLOTMENT-') || str_contains($upperSector, 'ALLOTMENT')) {
            return 'ALLOTMENT';
        }

        if (str_contains(strtoupper($mode), 'TRANSFER')) {
            return 'TRANSFER';
        }

        return '';
    }

    private function deriveSector(string $description, array $data): string
    {
        $explicit = $this->dataValue($data, ['sector', 'sector_name', 'sector name']);
        if ($explicit !== null) {
            return $explicit;
        }

        $text = trim($description);
        if ($text === '') {
            return '—';
        }

        $parts = array_values(array_filter(array_map('trim', preg_split('/-+/', $text))));
        if ($parts === []) {
            return $text;
        }

        $first = $parts[0];
        $upper = strtoupper($text);

        // Transfer-style descriptions normally begin with the transfer date.
        if (preg_match('/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/', $first) && isset($parts[1])) {
            return $parts[1];
        }

        // Hotel/allotment rows are displayed by city in the Accu-style reports.
        if (str_contains($upper, 'MAKKAH')) {
            return 'MAKKAH';
        }
        if (str_contains($upper, 'MADINA')) {
            return 'MADINA';
        }

        return $first === 'ALLOTMENT' && isset($parts[1]) ? $parts[1] : $first;
    }

    private function extractDates(array $data, string $description): array
    {
        $from = $this->dataValue($data, ['departure_date', 'departure date', 'dep_date', 'dep date', 'check_in', 'check in', 'checkin']);
        $to = $this->dataValue($data, ['return_date', 'return date', 'return_date', 'check_out', 'check out', 'checkout']);

        if ($from || $to) {
            return [
                $this->normalizeDateText($from),
                $this->normalizeDateText($to),
            ];
        }

        preg_match_all('/(?<!\d)(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?!\d)/', $description, $matches, PREG_SET_ORDER);
        if (count($matches) < 2) {
            return [];
        }

        $dates = [];
        foreach ($matches as $match) {
            $date = $this->makeDate((int) $match[1], (int) $match[2], (int) $match[3]);
            if ($date !== '') {
                $dates[] = $date;
            }
        }

        return array_slice($dates, 0, 2);
    }

    private function normalizeDateText(?string $value): string
    {
        if (!$value) {
            return '';
        }

        $value = trim($value);
        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'd/m/y', 'd-m-y', 'd-M-Y', 'd-M-y'] as $format) {
            $date = DateTimeImmutable::createFromFormat($format, $value);
            if ($date instanceof DateTimeImmutable) {
                return $date->format('d-M-y');
            }
        }

        return $value;
    }

    private function makeDate(int $day, int $month, int $year): string
    {
        if ($year < 100) {
            $year += 2000;
        }

        if (!checkdate($month, $day, $year)) {
            return '';
        }

        return sprintf('%02d-%s-%02d', $day, date('M', mktime(0, 0, 0, $month, 1, $year)), $year % 100);
    }

    private function dateOnly($value): string
    {
        return $value ? substr((string) $value, 0, 10) : '';
    }

    private function displayDate(string $value): string
    {
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $value);
        return $date instanceof DateTimeImmutable ? $date->format('d-M-Y') : $value;
    }

    private function normKey($value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/', '_', trim((string) $value)));
    }

    private function norm($value): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', (string) $value)));
    }

    private function writeExcelHeader($sheet, int $row, array $columns): void
    {
        foreach ($columns as $index => $column) {
            $sheet->setCellValue($this->excelColumn($index + 1) . $row, $column['label']);
        }

        $last = $this->excelColumn(count($columns));
        $style = $sheet->getStyle("A{$row}:{$last}{$row}");
        $style->getFont()->setBold(true);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEAF2FF');
        $style->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
    }

    private function writeExcelRow($sheet, int $row, array $columns, array $item): void
    {
        foreach ($columns as $index => $column) {
            $cell = $this->excelColumn($index + 1) . $row;
            $value = $item[$column['key']] ?? '';

            if (in_array($column['key'], ['receivable', 'payable', 'profit', 'fare', 'taxes'], true)) {
                $sheet->setCellValue($cell, (float) $value);
                $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
            } else {
                $sheet->setCellValue($cell, (string) $value);
            }
        }

        $last = $this->excelColumn(count($columns));
        $sheet->getStyle("A{$row}:{$last}{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_HAIR);
        $sheet->getStyle("A{$row}:{$last}{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
    }

    private function excelColumn(int $number): string
    {
        $result = '';
        while ($number > 0) {
            $remainder = ($number - 1) % 26;
            $result = chr(65 + $remainder) . $result;
            $number = intdiv($number - 1, 26);
        }
        return $result;
    }

    private function excelTitle($sheet, string $range, int $size): void
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true)->setSize($size);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function excelSubtitle($sheet, string $range): void
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setSize(10);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function excelSection($sheet, string $range): void
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEAF2FF');
    }

    private function renderSalesReportHtml(array $report, $company, $generatedAt, bool $autoPrint): string
    {
        $companyName = data_get($company, 'name') ?? data_get($company, 'company_name') ?? 'HBA TRAVEL & TOURS';
        $tagline = data_get($company, 'tagline') ?? '';
        $address = data_get($company, 'address') ?? '';
        $phone = data_get($company, 'phone') ?? '';
        $mobile = data_get($company, 'mobile') ?? '';
        $email = data_get($company, 'email') ?? '';
        $website = data_get($company, 'website') ?? '';
        $license = data_get($company, 'govt_license') ?? '';
        $ntn = data_get($company, 'ntn') ?? '';
        $logo = data_get($company, 'logo_data');
        $qr = data_get($company, 'qr_data');

        $money = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', ',');
        $esc = static fn ($value): string => htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
        $dateFmt = static function ($value): string {
            if (!$value) {
                return '—';
            }
            try {
                return \Carbon\Carbon::parse($value)->format('d-M-y');
            } catch (\Throwable $e) {
                return (string) $value;
            }
        };

        $columns = $report['columns'] ?? [];
        $numericKeys = ['receivable', 'payable', 'profit', 'fare', 'taxes'];
        $html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
        $html .= '<title>' . $esc($report['report_title'] ?? 'Sale Report') . '</title>';
        $html .= <<<'CSS'
<style>
@page { size: A4 portrait; margin: 7mm 5mm 10mm 5mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 7.2px; }
body { background: #fff; }
.paper { width: 100%; }
.header { border-bottom: 1px solid #111; padding-bottom: 5px; margin-bottom: 7px; }
.header-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.header-table td { vertical-align: top; }
.logo-cell, .qr-cell { width: 15%; }
.company-cell { width: 70%; text-align: center; }
.logo { max-width: 72px; max-height: 42px; object-fit: contain; }
.qr { width: 46px; height: 46px; object-fit: contain; }
.company-name { font-size: 12px; font-weight: 700; }
.tagline { font-size: 7px; margin-top: 1px; }
.details { font-size: 6.2px; line-height: 1.2; margin-top: 1px; }
.title { text-align: center; font-size: 12px; font-weight: 700; margin: 4px 0 1px; }
.period { text-align: center; font-size: 7px; margin-bottom: 2px; }
.generated { text-align: right; font-size: 6.3px; margin-bottom: 2px; }
.group-title { font-size: 7.8px; font-weight: 700; margin: 3px 0 1px; }
table.report { width: 100%; border-collapse: collapse; table-layout: fixed; }
table.report th { border: 1px solid #164ea5; padding: 2px 2px; font-size: 6.3px; line-height: 1.05; font-weight: 700; background: #fff; overflow-wrap: anywhere; }
table.report td { border-bottom: 1px dotted #999; padding: 2px 2px; vertical-align: top; font-size: 6.15px; line-height: 1.12; overflow-wrap: anywhere; word-break: break-word; }
table.report tbody tr { page-break-inside: avoid; }
table.report thead { display: table-header-group; }
table.report tfoot { display: table-footer-group; }
table.report tfoot td { border-top: 1.5px solid #164ea5; border-bottom: 2px double #164ea5; font-weight: 700; padding-top: 2px; }
.num { text-align: right; white-space: nowrap; font-size: 6px; }
.footer { position: fixed; left: 5mm; right: 5mm; bottom: 3mm; border-top: 1px solid #777; padding-top: 2px; font-size: 5.8px; }
.footer-table { width: 100%; border-collapse: collapse; }
.footer-table td:last-child { text-align: right; }
.col-date { width: 17mm; }
.col-id { width: 11mm; }
.col-ticket { width: 15mm; }
.col-type { width: 12mm; }
.col-passenger { width: 28mm; }
.col-sector { width: 23mm; }
.col-client { width: 20mm; }
.col-vendor { width: 24mm; }
.col-money { width: 15mm; }
.page:after { content: counter(page); }
@media screen {
    body { background: #e5e7eb; padding: 14px; }
    .paper { max-width: 760px; margin: 0 auto; padding: 16px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
    .footer { position: static; margin-top: 12px; }
}
</style>
CSS;

        $html .= '</head><body>';
        $html .= '<div class="paper">';
        $html .= '<div class="header"><table class="header-table"><tr>';

        $html .= '<td class="logo-cell">';
        if ($logo) {
            $html .= '<img src="' . $esc($logo) . '" class="logo" alt="HBA">';
        } else {
            $html .= '<strong style="font-size:20px;">HBA</strong>';
        }
        $html .= '</td>';

        $html .= '<td class="company-cell">';
        $html .= '<div class="company-name">' . $esc($companyName) . '</div>';
        if ($tagline) {
            $html .= '<div class="tagline">' . $esc($tagline) . '</div>';
        }
        if ($address) {
            $html .= '<div class="details"><strong>Address:</strong> ' . $esc($address) . '</div>';
        }
        if ($phone || $mobile) {
            $html .= '<div class="details"><strong>Phone:</strong> ' . $esc($phone);
            if ($mobile) {
                $html .= ', <strong>Mobile:</strong> ' . $esc($mobile);
            }
            $html .= '</div>';
        }
        if ($email || $website) {
            $html .= '<div class="details"><strong>E-Mail:</strong> ' . $esc($email);
            if ($website) {
                $html .= ', <strong>Website:</strong> ' . $esc($website);
            }
            $html .= '</div>';
        }
        if ($license || $ntn) {
            $html .= '<div class="details">';
            if ($license) {
                $html .= '<strong>Govt Lic No:</strong> ' . $esc($license);
            }
            if ($license && $ntn) {
                $html .= ', ';
            }
            if ($ntn) {
                $html .= '<strong>NTN:</strong> ' . $esc($ntn);
            }
            $html .= '</div>';
        }
        $html .= '</td>';

        $html .= '<td class="qr-cell" style="text-align:right;">';
        if ($qr) {
            $html .= '<img src="' . $esc($qr) . '" class="qr" alt="QR">';
        }
        $html .= '</td>';

        $html .= '</tr></table></div>';
        $html .= '<div class="title">' . $esc($report['report_title'] ?? 'Sale Report') . '</div>';
        $html .= '<div class="period">From ' . $esc($dateFmt($report['date_from'] ?? null)) . ' &nbsp; To ' . $esc($dateFmt($report['date_to'] ?? null)) . '</div>';
        $generatedText = method_exists($generatedAt, 'format') ? $generatedAt->format('d/m/Y g:i:s A') : date('d/m/Y g:i:s A');
        $html .= '<div class="generated">Printing Date: ' . $esc($generatedText) . '</div>';

        $renderRow = static function (array $row) use ($columns, $numericKeys, $money, $esc): string {
            $out = '<tr>';
            foreach ($columns as $column) {
                $key = $column['key'] ?? '';
                $value = $row[$key] ?? '';
                $isNum = in_array($key, $numericKeys, true);
                $widthClass = match ($key) {
                    'invoice_date' => ' col-date',
                    'voucher_id' => ' col-id',
                    'ticket_no' => ' col-ticket',
                    'ticket_type' => ' col-type',
                    'passenger' => ' col-passenger',
                    'sector' => ' col-sector',
                    'client_name' => ' col-client',
                    'vendor_name' => ' col-vendor',
                    'receivable', 'payable', 'profit', 'fare', 'taxes' => ' col-money',
                    default => '',
                };
                $class = ' class="' . trim(($isNum ? 'num' : '') . $widthClass) . '"';
                $display = $isNum
                    ? $money($value)
                    : (($value === null || $value === '') ? '—' : $value);
                $out .= '<td' . $class . '>' . ($isNum ? $display : $esc($display)) . '</td>';
            }
            return $out . '</tr>';
        };

        if (!empty($report['groups'])) {
            foreach ($report['groups'] as $group) {
                $html .= '<div class="group-title">' . $esc($group['title'] ?? '') . '</div>';
                $html .= '<table class="report"><thead><tr>';
                foreach ($columns as $column) {
                    $html .= '<th>' . $esc($column['label'] ?? '') . '</th>';
                }
                $html .= '</tr></thead><tbody>';
                foreach ($group['rows'] ?? [] as $row) {
                    $html .= $renderRow($row);
                }
                $html .= '</tbody></table>';
            }

            $html .= '<table class="report" style="margin-top:3px;"><tfoot><tr>';
            foreach ($columns as $index => $column) {
                $key = $column['key'] ?? '';
                $class = in_array($key, $numericKeys, true) ? ' class="num"' : '';
                $html .= '<td' . $class . '>';
                if ($index === 0) {
                    $html .= 'Total';
                } elseif (in_array($key, $numericKeys, true)) {
                    $html .= $money($report['totals'][$key] ?? 0);
                }
                $html .= '</td>';
            }
            $html .= '</tr></tfoot></table>';
        } else {
            $html .= '<table class="report"><thead><tr>';
            foreach ($columns as $column) {
                $html .= '<th>' . $esc($column['label'] ?? '') . '</th>';
            }
            $html .= '</tr></thead><tbody>';
            $rows = $report['rows'] ?? [];
            if ($rows === []) {
                $html .= '<tr><td colspan="' . count($columns) . '" style="text-align:center;padding:10px;">No records found for the selected period.</td></tr>';
            } else {
                foreach ($rows as $row) {
                    $html .= $renderRow($row);
                }
            }
            $html .= '</tbody><tfoot><tr>';
            foreach ($columns as $index => $column) {
                $key = $column['key'] ?? '';
                $class = in_array($key, $numericKeys, true) ? ' class="num"' : '';
                $html .= '<td' . $class . '>';
                if ($index === 0) {
                    $html .= 'Total';
                } elseif (in_array($key, $numericKeys, true)) {
                    $html .= $money($report['totals'][$key] ?? 0);
                }
                $html .= '</td>';
            }
            $html .= '</tr></tfoot></table>';
        }

        $html .= '<div class="footer"><table class="footer-table"><tr>';
        $html .= '<td>' . $esc($website) . '</td><td>Sales Report</td><td>Page <span class="page"></span></td>';
        $html .= '</tr></table></div>';
        $html .= '</div>';

        if ($autoPrint) {
            $html .= '<script>window.addEventListener("load", function(){ window.print(); });</script>';
        }

        return $html . '</body></html>';
    }

    private function safeFilename(string $value): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '-', $value) ?: 'sales-report';
    }
}
