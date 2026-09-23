<?php

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use App\Services\LedgerReportService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class LedgerExportController extends Controller
{
    public function print(
        Request $request,
        LedgerReportService $ledgerService,
        CompanySettingsService $companyService
    ): Response {
        $data =
            $this->validated(
                $request
            );

        $report =
            $this->buildExportReport(
                $ledgerService,
                $data
            );

        $company =
            $companyService->reportData();

        return response()->view(
            'accounting.ledger.print',
            [
                'report' =>
                    $report,

                'company' =>
                    $company,

                'generatedAt' =>
                    now(),

                'autoPrint' =>
                    true,
            ]
        );
    }

    public function pdf(
        Request $request,
        LedgerReportService $ledgerService,
        CompanySettingsService $companyService
    ) {
        $data =
            $this->validated(
                $request
            );

        $report =
            $this->buildExportReport(
                $ledgerService,
                $data
            );

        $company =
            $companyService->reportData();

        // The ledger PDF uses the same A4 portrait document family as the HBA invoice.
        // The Blade view provides the full branded header, bank details and footer.
        $pdf =
            Pdf::loadView(
                'accounting.ledger.print',
                [
                    'report' =>
                        $report,

                    'company' =>
                        $company,

                    'generatedAt' =>
                        now(),

                    'autoPrint' =>
                        false,
                ]
            )
            ->setPaper(
                'a4',
                'portrait'
            );

        $filename =
            'Ledger-' .
            $report['account']['code'] .
            '-' .
            now()->format('Ymd-His') .
            '.pdf';

        return $pdf->download(
            $filename
        );
    }

    public function excel(
        Request $request,
        LedgerReportService $ledgerService,
        CompanySettingsService $companyService
    ) {
        $data =
            $this->validated(
                $request
            );

        $report =
            $this->buildExportReport(
                $ledgerService,
                $data
            );

        $company =
            $companyService->reportData();

        $spreadsheet =
            new Spreadsheet();

        $sheet =
            $spreadsheet->getActiveSheet();

        $sheet->setTitle(
            'Ledger'
        );

        $row = 1;

        $sheet->mergeCells(
            "A{$row}:H{$row}"
        );

        $sheet->setCellValue(
            "A{$row}",
            $company['name']
        );

        $sheet->getStyle(
            "A{$row}"
        )->getFont()->setBold(
            true
        )->setSize(
            16
        );

        $sheet->getStyle(
            "A{$row}"
        )->getAlignment()->setHorizontal(
            Alignment::HORIZONTAL_CENTER
        );

        $row++;

        if (
            $company['tagline'] !== ''
        ) {
            $sheet->mergeCells(
                "A{$row}:H{$row}"
            );

            $sheet->setCellValue(
                "A{$row}",
                $company['tagline']
            );

            $sheet->getStyle(
                "A{$row}"
            )->getAlignment()->setHorizontal(
                Alignment::HORIZONTAL_CENTER
            );

            $row++;
        }

        if (
            $company['address'] !== ''
        ) {
            $sheet->mergeCells(
                "A{$row}:H{$row}"
            );

            $sheet->setCellValue(
                "A{$row}",
                $company['address']
            );

            $sheet->getStyle(
                "A{$row}"
            )->getAlignment()->setHorizontal(
                Alignment::HORIZONTAL_CENTER
            );

            $row++;
        }

        $contact = [];

        if (
            $company['phone'] !== ''
        ) {
            $contact[] =
                'Phone: ' .
                $company['phone'];
        }

        if (
            $company['mobile'] !== ''
        ) {
            $contact[] =
                'Mobile: ' .
                $company['mobile'];
        }

        if (
            $company['email'] !== ''
        ) {
            $contact[] =
                'E-Mail: ' .
                $company['email'];
        }

        if (
            $company['website'] !== ''
        ) {
            $contact[] =
                'Website: ' .
                $company['website'];
        }

        if (
            ! empty($contact)
        ) {
            $sheet->mergeCells(
                "A{$row}:H{$row}"
            );

            $sheet->setCellValue(
                "A{$row}",
                implode(
                    ' | ',
                    $contact
                )
            );

            $sheet->getStyle(
                "A{$row}"
            )->getAlignment()->setHorizontal(
                Alignment::HORIZONTAL_CENTER
            );

            $row++;
        }

        $companyExtra = [];

        if (
            $company['govt_license'] !== ''
        ) {
            $companyExtra[] =
                'Govt Lic No: ' .
                $company['govt_license'];
        }

        if (
            $company['ntn'] !== ''
        ) {
            $companyExtra[] =
                'NTN: ' .
                $company['ntn'];
        }

        if (
            ! empty($companyExtra)
        ) {
            $sheet->mergeCells(
                "A{$row}:H{$row}"
            );

            $sheet->setCellValue(
                "A{$row}",
                implode(
                    ' | ',
                    $companyExtra
                )
            );

            $sheet->getStyle(
                "A{$row}"
            )->getAlignment()->setHorizontal(
                Alignment::HORIZONTAL_CENTER
            );

            $row += 2;
        }

        $sheet->mergeCells(
            "A{$row}:H{$row}"
        );

        $sheet->setCellValue(
            "A{$row}",
            'Ledger of ' .
            $report['account']['name']
        );

        $sheet->getStyle(
            "A{$row}"
        )->getFont()->setBold(
            true
        )->setSize(
            14
        );

        $sheet->getStyle(
            "A{$row}"
        )->getAlignment()->setHorizontal(
            Alignment::HORIZONTAL_CENTER
        );

        $row++;

        $sheet->mergeCells(
            "A{$row}:H{$row}"
        );

        $sheet->setCellValue(
            "A{$row}",
            'From: ' .
            $this->formatDate(
                $report['date_from']
            ) .
            '  |  To: ' .
            $this->formatDate(
                $report['date_to']
            )
        );

        $sheet->getStyle(
            "A{$row}"
        )->getAlignment()->setHorizontal(
            Alignment::HORIZONTAL_CENTER
        );

        $row += 2;

        $headers = [
            'Date',
            'VT',
            'V. ID',
            'Ref',
            'Description',
            'Debit',
            'Credit',
            'Balance',
        ];

        foreach (
            $headers as $index => $header
        ) {
            $column =
                chr(
                    ord('A') +
                    $index
                );

            $sheet->setCellValue(
                "{$column}{$row}",
                $header
            );
        }

        $headerRow =
            $row;

        $sheet->getStyle(
            "A{$headerRow}:H{$headerRow}"
        )->getFont()->setBold(
            true
        );

        $sheet->getStyle(
            "A{$headerRow}:H{$headerRow}"
        )->getFill()
            ->setFillType(
                Fill::FILL_SOLID
            )
            ->getStartColor()
            ->setARGB(
                'E5E7EB'
            );

        $sheet->getStyle(
            "A{$headerRow}:H{$headerRow}"
        )->getBorders()
            ->getAllBorders()
            ->setBorderStyle(
                Border::BORDER_THIN
            );

        $row++;

        /*
         * Opening B/F
         */
        $sheet->setCellValue(
            "A{$row}",
            ''
        );

        $sheet->setCellValue(
            "B{$row}",
            'B/F'
        );

        $sheet->setCellValue(
            "C{$row}",
            ''
        );

        $sheet->setCellValue(
            "D{$row}",
            ''
        );

        $sheet->setCellValue(
            "E{$row}",
            'Balance B/F'
        );

        $sheet->setCellValue(
            "F{$row}",
            $report['opening']['balance'] > 0
                ? abs(
                    $report['opening']['balance']
                )
                : null
        );

        $sheet->setCellValue(
            "G{$row}",
            $report['opening']['balance'] < 0
                ? abs(
                    $report['opening']['balance']
                )
                : null
        );

        $sheet->setCellValue(
            "H{$row}",
            abs(
                $report['opening']['balance']
            )
        );

        $row++;

        foreach (
            $report['rows'] as $item
        ) {
            $sheet->setCellValue(
                "A{$row}",
                $item['date']
                    ? $this->formatDate(
                        $item['date']
                    )
                    : '—'
            );

            $sheet->setCellValue(
                "B{$row}",
                $item['type']
            );

            $sheet->setCellValue(
                "C{$row}",
                $item['voucher_id']
            );

            $sheet->setCellValue(
                "D{$row}",
                $item['ref']
                    ?? $item['reference']
                    ?? $item['invoice_no']
                    ?? ''
            );

            // Use the exact description prepared by LedgerReportService.
            // This is the same field rendered by the web ledger.
            $description =
                $item['description']
                ?? $item['rich_description_export']
                ?? '';

            if (
                ! empty($item['currency_note'])
            ) {
                $description .=
                    "\n" .
                    $item['currency_note'];
            }

            $sheet->setCellValue(
                "E{$row}",
                $description
            );

            $sheet->setCellValue(
                "F{$row}",
                $item['debit'] > 0
                    ? $item['debit']
                    : null
            );

            $sheet->setCellValue(
                "G{$row}",
                $item['credit'] > 0
                    ? $item['credit']
                    : null
            );

            $sheet->setCellValue(
                "H{$row}",
                abs(
                    $item['balance']
                ) .
                ' ' .
                $item['side']
            );

            $row++;
        }

        /*
         * Totals
         */
        $row++;

        $sheet->setCellValue(
            "E{$row}",
            'Period Total'
        );

        $sheet->getStyle(
            "E{$row}:H{$row}"
        )->getFont()->setBold(
            true
        );

        $sheet->setCellValue(
            "F{$row}",
            $report['period']['debit']
        );

        $sheet->setCellValue(
            "G{$row}",
            $report['period']['credit']
        );

        $row += 2;

        $sheet->setCellValue(
            "E{$row}",
            'Closing Balance'
        );

        $sheet->getStyle(
            "E{$row}:H{$row}"
        )->getFont()->setBold(
            true
        );

        $sheet->setCellValue(
            "H{$row}",
            abs(
                $report['closing']['balance']
            ) .
            ' ' .
            $report['closing']['side']
        );

        /*
         * Layout
         */
        $widths = [
            'A' => 13,
            'B' => 8,
            'C' => 12,
            'D' => 15,
            'E' => 70,
            'F' => 18,
            'G' => 18,
            'H' => 20,
        ];

        foreach (
            $widths as $column => $width
        ) {
            $sheet->getColumnDimension(
                $column
            )->setWidth(
                $width
            );
        }

        $sheet->getStyle(
            "E1:E{$row}"
        )->getAlignment()
            ->setWrapText(
                true
            )
            ->setVertical(
                Alignment::VERTICAL_TOP
            );

        $sheet->getStyle(
            "A{$headerRow}:H{$row}"
        )->getFont()->setSize(11);

        $sheet->getStyle(
            "A{$headerRow}:H{$row}"
        )->getAlignment()
            ->setVertical(
                Alignment::VERTICAL_TOP
            );

        $sheet->freezePane(
            'A' .
            ($headerRow + 1)
        );

        $sheet->getPageSetup()
            ->setOrientation(
                \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
            )
            ->setPaperSize(
                \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4
            );

        $sheet->getPageMargins()
            ->setTop(0.3)
            ->setRight(0.3)
            ->setBottom(0.3)
            ->setLeft(0.3);

        $writer =
            new Xlsx(
                $spreadsheet
            );

        $filename =
            'Ledger-' .
            $report['account']['code'] .
            '-' .
            now()->format('Ymd-His') .
            '.xlsx';

        return response()->streamDownload(
            function () use (
                $writer
            ) {
                $writer->save(
                    'php://output'
                );
            },
            $filename,
            [
                'Content-Type' =>
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]
        );
    }


    /**
     * Build one fast export report for Base or a selected foreign currency.
     */
    private function buildExportReport(
        LedgerReportService $ledgerService,
        array $data
    ): array {
        $report = $ledgerService->report(
            (int) $data['account_id'],
            $data['date_from'],
            $data['date_to']
        );

        $report = $this->enrichReportForExport(
            $report
        );

        $currencyCode = strtoupper(
            trim(
                (string) ($data['currency_code'] ?? '')
            )
        );

        if ($currencyCode === '') {
            return $report;
        }

        return $this->applyFastForeignCurrencyReport(
            $report,
            $currencyCode
        );
    }

    /**
     * Convert the fast base report to a foreign-currency report without
     * entering LedgerController's legacy-heavy Currency path.
     */
    private function applyFastForeignCurrencyReport(
        array $report,
        string $selectedCurrency
    ): array {
        $selectedCurrency = strtoupper(
            trim($selectedCurrency)
        );

        $accountId = (int) data_get(
            $report,
            'account.id',
            0
        );

        $dateFrom = trim(
            (string) data_get($report, 'date_from', '')
        );

        $financialYearStart =
            $this->legacyFinancialYearStartForExport(
                $dateFrom
            );

        $foreignOpening = 0.0;

        if (
            $accountId > 0
            && Schema::hasTable('account_opening_balances')
        ) {
            $openingRow = DB::table(
                'account_opening_balances'
            )
                ->where('account_id', $accountId)
                ->whereRaw(
                    'UPPER(TRIM(COALESCE(currency_code, ?))) = ?',
                    ['', $selectedCurrency]
                )
                ->selectRaw(
                    'COALESCE(SUM(CASE WHEN opening_currency IS NOT NULL THEN opening_currency WHEN COALESCE(exchange_rate, 0) > 0 THEN (opening_debit - opening_credit) / exchange_rate ELSE 0 END), 0) AS foreign_opening'
                )
                ->first();

            $foreignOpening = (float) (
                $openingRow->foreign_opening
                ?? 0
            );
        }

        $prePeriodDebit = 0.0;
        $prePeriodCredit = 0.0;

        if ($accountId > 0 && Schema::hasTable('journal_entry_lines')) {
            $movementQuery = DB::table(
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
                    'UPPER(TRIM(COALESCE(l.currency_code, ?))) = ?',
                    ['', $selectedCurrency]
                )
                ->whereRaw(
                    'DATE(COALESCE(l.posting_date, l.voucher_date, v.voucher_date)) < ?',
                    [$dateFrom]
                );

            if ($financialYearStart !== null) {
                $movementQuery->whereRaw(
                    'DATE(COALESCE(l.posting_date, l.voucher_date, v.voucher_date)) >= ?',
                    [$financialYearStart]
                );
            }

            $movement = $movementQuery
                ->selectRaw(
                    'COALESCE(SUM(CASE WHEN ABS(COALESCE(l.foreign_debit, 0)) > 0.00005 THEN ABS(l.foreign_debit) WHEN ABS(COALESCE(l.debit, 0)) > 0.00005 AND COALESCE(l.currency_rate, 0) > 0 THEN ABS(l.debit) / l.currency_rate ELSE 0 END), 0) AS debit_amount'
                )
                ->selectRaw(
                    'COALESCE(SUM(CASE WHEN ABS(COALESCE(l.foreign_credit, 0)) > 0.00005 THEN ABS(l.foreign_credit) WHEN ABS(COALESCE(l.credit, 0)) > 0.00005 AND COALESCE(l.currency_rate, 0) > 0 THEN ABS(l.credit) / l.currency_rate ELSE 0 END), 0) AS credit_amount'
                )
                ->first();

            $prePeriodDebit = (float) (
                $movement->debit_amount
                ?? 0
            );

            $prePeriodCredit = (float) (
                $movement->credit_amount
                ?? 0
            );
        }

        $openingBalance =
            $foreignOpening
            + $prePeriodDebit
            - $prePeriodCredit;

        $runningBalance = $openingBalance;
        $periodDebit = 0.0;
        $periodCredit = 0.0;
        $foreignRows = [];

        foreach (($report['rows'] ?? []) as $rawRow) {
            $row = is_object($rawRow)
                ? (array) $rawRow
                : (is_array($rawRow) ? $rawRow : []);

            if ($row === []) {
                continue;
            }

            $rowCurrency = strtoupper(
                trim(
                    (string) ($row['currency_code'] ?? '')
                )
            );

            if ($rowCurrency !== $selectedCurrency) {
                continue;
            }

            $debit = abs(
                (float) ($row['foreign_debit'] ?? 0)
            );
            $credit = abs(
                (float) ($row['foreign_credit'] ?? 0)
            );

            if (
                $debit <= 0.00005
                && $credit <= 0.00005
            ) {
                $baseDebit = abs(
                    (float) ($row['debit'] ?? 0)
                );
                $baseCredit = abs(
                    (float) ($row['credit'] ?? 0)
                );
                $roe = (float) (
                    $row['currency_rate']
                    ?? 0
                );

                if ($roe > 0) {
                    $debit = $baseDebit / $roe;
                    $credit = $baseCredit / $roe;
                }
            }

            if (
                $debit <= 0.00005
                && $credit <= 0.00005
            ) {
                continue;
            }

            $row['debit'] = round($debit, 4);
            $row['credit'] = round($credit, 4);

            $periodDebit += $debit;
            $periodCredit += $credit;
            $runningBalance += $debit - $credit;
            $row['balance'] = round(
                $runningBalance,
                4
            );
            $row['side'] =
                $runningBalance < 0
                    ? 'Cr'
                    : 'Dr';

            if (! empty($row['currency_breakdown'])) {
                $description = trim(
                    (string) ($row['description'] ?? '')
                );
                $breakdown = trim(
                    (string) $row['currency_breakdown']
                );

                if (
                    $breakdown !== ''
                    && ! str_contains(
                        $description,
                        $breakdown
                    )
                ) {
                    $row['description'] = $description !== ''
                        ? $description . "\n" . $breakdown
                        : $breakdown;
                }

                $row['currency_note'] = $breakdown;
            }

            $foreignRows[] = $row;
        }

        $closingBalance = $runningBalance;

        $report['selectedCurrency'] = $selectedCurrency;
        $report['selectedCurrencyName'] =
            $this->currencyNameForExport(
                $selectedCurrency
            );
        $report['isForeignCurrencyLedger'] = true;
        $report['financialYearStart'] = $financialYearStart;

        $report['opening'] = array_replace(
            is_array($report['opening'] ?? null)
                ? $report['opening']
                : [],
            [
                'balance' => round(
                    $openingBalance,
                    4
                ),
                'side' =>
                    $openingBalance < 0
                        ? 'Cr'
                        : 'Dr',
            ]
        );

        $report['period'] = array_replace(
            is_array($report['period'] ?? null)
                ? $report['period']
                : [],
            [
                'debit' => round(
                    $periodDebit,
                    4
                ),
                'credit' => round(
                    $periodCredit,
                    4
                ),
            ]
        );

        $report['closing'] = array_replace(
            is_array($report['closing'] ?? null)
                ? $report['closing']
                : [],
            [
                'balance' => round(
                    $closingBalance,
                    4
                ),
                'side' =>
                    $closingBalance < 0
                        ? 'Cr'
                        : 'Dr',
            ]
        );

        $report['rows'] = $foreignRows;

        /* Compatibility aliases used by older ledger Blade variants. */
        $report['openingBalance'] = round(
            $openingBalance,
            4
        );
        $report['periodDebit'] = round(
            $periodDebit,
            4
        );
        $report['periodCredit'] = round(
            $periodCredit,
            4
        );
        $report['closingBalance'] = round(
            $closingBalance,
            4
        );

        return $report;
    }

    private function legacyFinancialYearStartForExport(
        string $dateFrom
    ): ?string {
        $dateFrom = trim($dateFrom);

        if ($dateFrom === '') {
            return null;
        }

        try {
            $legacySchema =
                DB::connection('legacy')
                    ->getSchemaBuilder();

            if (! $legacySchema->hasTable('tblfinancialyears')) {
                return null;
            }

            $financialYear =
                DB::connection('legacy')
                    ->table('tblfinancialyears')
                    ->where(
                        'StartingDate',
                        '<=',
                        $dateFrom . ' 23:59:59'
                    )
                    ->where(
                        'EndingDate',
                        '>=',
                        $dateFrom . ' 00:00:00'
                    )
                    ->orderByDesc('StartingDate')
                    ->first();

            if ($financialYear) {
                return substr(
                    (string) $financialYear->StartingDate,
                    0,
                    10
                );
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }

    private function currencyNameForExport(
        string $selectedCurrency
    ): string {
        $selectedCurrency = strtoupper(
            trim($selectedCurrency)
        );

        if (
            $selectedCurrency === ''
            || ! Schema::hasTable('currencies')
        ) {
            return $selectedCurrency;
        }

        try {
            $columns = Schema::getColumnListing(
                'currencies'
            );

            $codeColumn = null;

            foreach (
                ['code', 'currency_code', 'currency', 'Currency']
                as $candidate
            ) {
                if (in_array($candidate, $columns, true)) {
                    $codeColumn = $candidate;
                    break;
                }
            }

            if ($codeColumn === null) {
                return $selectedCurrency;
            }

            $nameColumn = null;

            foreach (
                ['name', 'currency_name', 'full_name', 'FullName']
                as $candidate
            ) {
                if (in_array($candidate, $columns, true)) {
                    $nameColumn = $candidate;
                    break;
                }
            }

            if ($nameColumn !== null) {
                $currency = DB::table('currencies')
                    ->where($codeColumn, $selectedCurrency)
                    ->first([
                        $codeColumn,
                        $nameColumn,
                    ]);

                return trim(
                    (string) (
                        $currency->{$nameColumn}
                        ?? $selectedCurrency
                    )
                ) ?: $selectedCurrency;
            }
        } catch (\Throwable $e) {
            return $selectedCurrency;
        }

        return $selectedCurrency;
    }

    /**
     * Calculate a human-readable foreign-currency formula from the normalized
     * journal row. This intentionally avoids legacy InvTickets queries.
     */
    private function currencyCalculationForExportRow(
        array $row,
        $line,
        array $legacyData
    ): array {
        $currency = strtoupper(
            trim(
                (string) (
                    $line->currency_code
                    ?? ($legacyData['Cur'] ?? '')
                    ?? ''
                )
            )
        );

        $roe = (float) (
            $line->currency_rate
            ?? ($legacyData['CurRate'] ?? 0)
            ?? 0
        );

        $currencyQty = (float) (
            $line->currency_quantity
            ?? ($legacyData['CurQty'] ?? 0)
            ?? 0
        );

        $foreignDebit = abs(
            (float) ($line->foreign_debit ?? 0)
        );
        $foreignCredit = abs(
            (float) ($line->foreign_credit ?? 0)
        );

        if ($foreignDebit <= 0.00005) {
            $foreignDebit = abs(
                (float) ($legacyData['CurDr'] ?? 0)
            );
        }

        if ($foreignCredit <= 0.00005) {
            $foreignCredit = abs(
                (float) ($legacyData['CurCr'] ?? 0)
            );
        }

        $foreignAmount = max(
            $foreignDebit,
            $foreignCredit
        );

        if (
            $foreignAmount <= 0.00005
            && $roe > 0
        ) {
            $baseAmount = max(
                abs((float) ($row['debit'] ?? 0)),
                abs((float) ($row['credit'] ?? 0))
            );

            if ($baseAmount > 0.00005) {
                $foreignAmount =
                    $baseAmount / $roe;
            }
        }

        if (
            $currency === ''
            || $roe <= 0
            || $foreignAmount <= 0.00005
        ) {
            return [
                'currency_code' => $currency,
                'currency_quantity' => $currencyQty,
                'currency_rate' => $roe,
                'foreign_debit' => $foreignDebit,
                'foreign_credit' => $foreignCredit,
                'currency_breakdown' => null,
                'currency_note' => null,
            ];
        }

        $rawMode = strtoupper(
            trim(
                (string) (
                    $legacyData['Mode']
                    ?? ($row['mode_description_export'] ?? '')
                    ?? ($row['mode'] ?? '')
                    ?? ''
                )
            )
        );

        $quantity = $currencyQty;

        if (str_contains($rawMode, 'HOTEL')) {
            $quantity = $this->hotelNightsForExport(
                $legacyData
            );
        } else {
            if ($quantity <= 0) {
                $quantity = (float) (
                    $legacyData['Quantity']
                    ?? 0
                );
            }
        }

        if ($quantity <= 0) {
            $quantity = 1.0;
        }

        $unitRate =
            $foreignAmount / $quantity;

        if ($unitRate <= 0.00005) {
            return [
                'currency_code' => $currency,
                'currency_quantity' => $currencyQty,
                'currency_rate' => $roe,
                'foreign_debit' => $foreignDebit,
                'foreign_credit' => $foreignCredit,
                'currency_breakdown' => null,
                'currency_note' => null,
            ];
        }

        $breakdown = sprintf(
            '%s %s × %s × %s',
            $currency,
            $this->formatCurrencyFactorForExport($unitRate),
            $this->formatCurrencyFactorForExport($quantity),
            number_format($roe, 2, '.', '')
        );

        return [
            'currency_code' => $currency,
            'currency_quantity' => $currencyQty,
            'currency_rate' => $roe,
            'foreign_debit' => $foreignDebit,
            'foreign_credit' => $foreignCredit,
            'currency_breakdown' => $breakdown,
            'currency_note' => $breakdown,
        ];
    }

    private function hotelNightsForExport(
        array $legacyData
    ): float {
        $direct = (float) (
            $legacyData['InvNights']
            ?? $legacyData['nights']
            ?? 0
        );

        if ($direct > 0) {
            return $direct;
        }

        $from = trim(
            (string) (
                $legacyData['ServiceDateFrom']
                ?? $legacyData['service_date_from']
                ?? ''
            )
        );
        $to = trim(
            (string) (
                $legacyData['ServiceDateTo']
                ?? $legacyData['service_date_to']
                ?? ''
            )
        );

        if ($from !== '' && $to !== '') {
            try {
                $fromDate = \Carbon\Carbon::parse($from)->startOfDay();
                $toDate = \Carbon\Carbon::parse($to)->startOfDay();
                $days = $fromDate->diffInDays($toDate);

                if ($days > 0) {
                    return (float) $days;
                }
            } catch (\Throwable $e) {
                // Continue to sector-text fallback.
            }
        }

        $sector = trim(
            (string) (
                $legacyData['Sector/Description']
                ?? $legacyData['sector_description']
                ?? ''
            )
        );

        if ($sector !== '') {
            $patterns = [
                '/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}).*?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i',
                '/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}).*?(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i',
            ];

            foreach ($patterns as $pattern) {
                if (! preg_match($pattern, $sector, $matches)) {
                    continue;
                }

                try {
                    $fromDate = \Carbon\Carbon::parse($matches[1])->startOfDay();
                    $toDate = \Carbon\Carbon::parse($matches[2])->startOfDay();
                    $days = $fromDate->diffInDays($toDate);

                    if ($days > 0) {
                        return (float) $days;
                    }
                } catch (\Throwable $e) {
                    continue;
                }
            }
        }

        return 0.0;
    }

    private function formatCurrencyFactorForExport(
        float $value
    ): string {
        $formatted = number_format(
            $value,
            4,
            '.',
            ''
        );

        $formatted = rtrim(
            rtrim($formatted, '0'),
            '.'
        );

        return $formatted !== ''
            ? $formatted
            : '0';
    }

    /**
     * Enrich ledger rows with the legacy invoice number and the
     * underlying invoice/service detail fields that are already stored
     * on journal_entry_lines / legacy_data.
     *
     * Amounts and running balances remain untouched.
     */
    private function enrichReportForExport(array $report): array
    {
        $rows = $report['rows'] ?? [];

        if (! is_iterable($rows)) {
            return $report;
        }

        $rowList = [];

        foreach ($rows as $row) {
            $rowList[] = is_object($row)
                ? (array) $row
                : (is_array($row) ? $row : []);
        }

        if (empty($rowList)) {
            return $report;
        }

        $lineIds = collect($rowList)
            ->map(fn (array $row) => (int) ($row['id'] ?? 0))
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if (empty($lineIds) || ! Schema::hasTable('journal_entry_lines')) {
            $report['rows'] = $rowList;
            return $report;
        }

        $select = [
            'id',
            'legacy_invoice_no',
            'legacy_invoice_no_2',
            'legacy_data',
            'invoice_id',
            'passenger',
            'ticket_no',
            'con_ticket_no',
            'mode',
            'mode_description',
            'sector_description',
            'fare_taxes_service',
            'particulars',
            'currency_code',
            'currency_quantity',
            'currency_rate',
            'foreign_debit',
            'foreign_credit',
        ];

        $availableColumns = Schema::getColumnListing('journal_entry_lines');
        $select = array_values(
            array_filter(
                $select,
                fn (string $column) => in_array($column, $availableColumns, true)
            )
        );

        $lineMap = DB::table('journal_entry_lines')
            ->whereIn('id', $lineIds)
            ->get($select)
            ->keyBy('id');

        /*
         * Resolve normalized invoice numbers where the invoice_id is
         * available. Handle both common PK naming variants safely.
         */
        $invoiceMap = collect();

        if (
            Schema::hasTable('invoices')
            && Schema::hasColumn('journal_entry_lines', 'invoice_id')
        ) {
            $invoiceIds = $lineMap
                ->pluck('invoice_id')
                ->filter(fn ($id) => $id !== null && $id !== '')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            if (! empty($invoiceIds)) {
                $invoiceColumns = Schema::getColumnListing('invoices');
                $invoicePk = in_array('invoice_id', $invoiceColumns, true)
                    ? 'invoice_id'
                    : (in_array('id', $invoiceColumns, true) ? 'id' : null);

                if ($invoicePk) {
                    $invoiceSelect = array_values(
                        array_filter(
                            [
                                $invoicePk,
                                in_array('invoice_number', $invoiceColumns, true)
                                    ? 'invoice_number'
                                    : null,
                                in_array('legacy_invoice_id', $invoiceColumns, true)
                                    ? 'legacy_invoice_id'
                                    : null,
                                in_array('reference_no', $invoiceColumns, true)
                                    ? 'reference_no'
                                    : null,
                                in_array('legacy_invoice_ref', $invoiceColumns, true)
                                    ? 'legacy_invoice_ref'
                                    : null,
                            ],
                            fn ($column) => $column !== null
                        )
                    );

                    $invoiceMap = DB::table('invoices')
                        ->whereIn($invoicePk, $invoiceIds)
                        ->get($invoiceSelect)
                        ->keyBy($invoicePk);
                }
            }
        }

        foreach ($rowList as &$row) {
            $id = (int) ($row['id'] ?? 0);
            $line = $lineMap->get($id);

            if (! $line) {
                continue;
            }

            $legacyData = [];
            $ui = [];

            if (! empty($line->legacy_data)) {
                $decoded = json_decode((string) $line->legacy_data, true);

                if (is_array($decoded)) {
                    $legacyData = $decoded;

                    if (isset($decoded['ui']) && is_array($decoded['ui'])) {
                        $ui = $decoded['ui'];
                    }
                }
            }

            $invoiceNo = '';

            foreach (
                [
                    $line->legacy_invoice_no ?? null,
                    $line->legacy_invoice_no_2 ?? null,
                    $legacyData['inv_no'] ?? null,
                    $legacyData['invoice_no'] ?? null,
                    $legacyData['invoice_number'] ?? null,
                    $ui['inv_no'] ?? null,
                ] as $candidate
            ) {
                $candidate = trim((string) ($candidate ?? ''));

                if ($candidate !== '') {
                    $invoiceNo = $candidate;
                    break;
                }
            }

            if (
                $invoiceNo === ''
                && $line->invoice_id !== null
                && $invoiceMap->isNotEmpty()
            ) {
                $invoiceColumns = Schema::getColumnListing('invoices');
                $invoicePk = in_array('invoice_id', $invoiceColumns, true)
                    ? 'invoice_id'
                    : (in_array('id', $invoiceColumns, true) ? 'id' : null);

                if ($invoicePk) {
                    $invoice = $invoiceMap->get((int) $line->invoice_id);

                    if ($invoice) {
                        $invoiceNo = trim(
                            (string) ($invoice->invoice_number ?? '')
                        );

                        if (
                            $invoiceNo === ''
                            && isset($invoice->legacy_invoice_id)
                            && $invoice->legacy_invoice_id !== null
                        ) {
                            $invoiceNo = (string) $invoice->legacy_invoice_id;
                        }

                        if (
                            $invoiceNo === ''
                            && isset($invoice->legacy_invoice_ref)
                        ) {
                            $invoiceNo = trim(
                                (string) $invoice->legacy_invoice_ref
                            );
                        }

                        if (
                            $invoiceNo === ''
                            && isset($invoice->reference_no)
                        ) {
                            $invoiceNo = trim(
                                (string) $invoice->reference_no
                            );
                        }
                    }
                }
            }

            $row['invoice_no'] = $invoiceNo !== ''
                ? $invoiceNo
                : null;


            $row['passenger'] = trim(
                (string) ($line->passenger ?? $row['passenger'] ?? '')
            );

            $row['ticket_no'] = trim(
                (string) ($line->ticket_no ?? $row['ticket_no'] ?? '')
            );

            $row['con_ticket_no'] = trim(
                (string) ($line->con_ticket_no ?? $row['con_ticket_no'] ?? '')
            );

            $row['mode_description_export'] = trim(
                (string) (
                    $line->mode_description
                    ?? $line->mode
                    ?? ''
                )
            );

            $row['service_details_export'] = trim(
                (string) ($line->sector_description ?? '')
            );

            $row['fare_taxes_service_export'] = trim(
                (string) ($line->fare_taxes_service ?? '')
            );

            $row['particulars_export'] = trim(
                (string) ($line->particulars ?? '')
            );

            $type = strtoupper(
                trim((string) ($row['type'] ?? ''))
            );

            // Build a rich, human-readable export description without
            // changing the accounting description or any amounts.
            $richParts = [];

            if ($row['passenger'] !== '') {
                $richParts[] = $row['passenger'];
            }

            if ($invoiceNo !== '') {
                $richParts[] = $invoiceNo;
            }

            if ($row['service_details_export'] !== '') {
                $richParts[] = $row['service_details_export'];
            }

            if (
                $row['mode_description_export'] !== ''
                && strtoupper($row['mode_description_export']) !== strtoupper($type)
            ) {
                $richParts[] = $row['mode_description_export'];
            }

            if ($row['ticket_no'] !== '') {
                $richParts[] = 'Ticket ' . $row['ticket_no'];
            }

            if ($row['con_ticket_no'] !== '') {
                $richParts[] = 'Con ' . $row['con_ticket_no'];
            }

            if ($row['fare_taxes_service_export'] !== '') {
                $richParts[] = $row['fare_taxes_service_export'];
            }

            $row['rich_description_export'] = ! empty($richParts)
                ? implode(' - ', $richParts)
                : trim((string) ($row['description'] ?? ''));

            /*
             * The optimized LedgerReportService path is intentionally kept
             * for WhatsApp performance.  Its base description can be only the
             * generic service mode (for example HOTEL / VISA).  When the
             * enrichment above recovered a real service description, replace
             * only those generic labels with the enriched text.  This does not
             * add any queries or change accounting amounts/balances.
             */
            $currentDescription = trim(
                (string) ($row['description'] ?? '')
            );

            $genericDescriptions = [
                'HOTEL',
                'VISA',
                'TICKET',
                'TRANSFER',
                'OTHER',
            ];

            if (
                $row['rich_description_export'] !== ''
                && (
                    $currentDescription === ''
                    || in_array(
                        strtoupper($currentDescription),
                        $genericDescriptions,
                        true
                    )
                )
            ) {
                $row['description'] =
                    $row['rich_description_export'];
            }

            /*
             * Build the foreign-currency calculation from the normalized
             * journal line / imported Master JSON only. This is display-side
             * enrichment: accounting amounts remain untouched. It also avoids
             * the legacy InvTickets/HotelRateDetails lookups that caused the
             * old WhatsApp Currency path to lag.
             */
            $currencyData = $this->currencyCalculationForExportRow(
                $row,
                $line,
                $legacyData
            );

            foreach ($currencyData as $currencyKey => $currencyValue) {
                $row[$currencyKey] = $currencyValue;
            }

            /*
             * Accu-style convention: invoice number belongs in Ref.
             * Only fill it when the normal report reference is empty.
             */

            if (
                ($type === 'INV' || $type === 'RFD' || $type === 'INV')
                && trim((string) ($row['ref'] ?? '')) === ''
                && $invoiceNo !== ''
            ) {
                $row['ref'] = $invoiceNo;
            }
        }
        unset($row);

        /*
         * Resolve legacy invoice numbers to the normalized invoices.id in one
         * batched query.  This gives the web ledger and print/PDF view a real
         * internal invoice key even when the original journal line only carries
         * the old Accu invoice number.
         */
        if (Schema::hasTable('invoices')) {
            $legacyInvoiceNumbers = collect($rowList)
                ->filter(function (array $row): bool {
                    $type = strtoupper(trim((string) ($row['type'] ?? $row['voucher_type'] ?? '')));

                    return $type === 'INV'
                        && empty($row['invoice_id'])
                        && trim((string) ($row['invoice_no'] ?? '')) !== '';
                })
                ->pluck('invoice_no')
                ->map(fn ($value) => trim((string) $value))
                ->filter(fn (string $value): bool => $value !== '')
                ->unique()
                ->values()
                ->all();

            if ($legacyInvoiceNumbers !== []) {
                $legacyInvoiceMap = DB::table('invoices')
                    ->whereIn('legacy_invoice_id', $legacyInvoiceNumbers)
                    ->get(['id', 'legacy_invoice_id'])
                    ->keyBy(fn ($invoice) => trim((string) $invoice->legacy_invoice_id));

                foreach ($rowList as &$row) {
                    $type = strtoupper(trim((string) ($row['type'] ?? $row['voucher_type'] ?? '')));

                    if ($type !== 'INV' || ! empty($row['invoice_id'])) {
                        continue;
                    }

                    $invoiceNumber = trim((string) ($row['invoice_no'] ?? ''));
                    $invoice = $legacyInvoiceMap->get($invoiceNumber);

                    if ($invoice) {
                        $row['invoice_id'] = (int) $invoice->id;
                    }
                }
                unset($row);
            }
        }

        $report['rows'] = $rowList;

        return $report;
    }

    private function validated(
        Request $request
    ): array {
        return $request->validate([
            'account_id' => [
                'required',
                'integer',
                'exists:accounts,id',
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
        ]);
    }

    private function formatDate(
        ?string $value
    ): string {
        if (
            ! $value
        ) {
            return '—';
        }

        $date =
            substr(
                $value,
                0,
                10
            );

        $parts =
            explode(
                '-',
                $date
            );

        if (
            count($parts) !== 3
        ) {
            return $value;
        }

        return
            $parts[2] .
            '-' .
            $this->monthName(
                (int) $parts[1]
            ) .
            '-' .
            substr(
                $parts[0],
                2
            );
    }

    private function monthName(
        int $month
    ): string {
        return match ($month) {
            1 => 'Jan',
            2 => 'Feb',
            3 => 'Mar',
            4 => 'Apr',
            5 => 'May',
            6 => 'Jun',
            7 => 'Jul',
            8 => 'Aug',
            9 => 'Sep',
            10 => 'Oct',
            11 => 'Nov',
            12 => 'Dec',
            default => '---',
        };
    }
}