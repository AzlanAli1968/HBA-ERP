<?php

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancialReportsController extends Controller
{
    private const REPORTS = [
        'Balance Sheet' => [
            'Balance Sheet',
        ],
        'Commission Reports' => [
            'Commission Reports',
        ],
        'Profit & Loss' => [
            'Datewise Profit & Loss',
            'Datewise Profit & Loss - Branch',
            'Datewise Profit & Loss - Client Summary',
            'Datewise Profit & Loss - Department',
            'Datewise Profit & Loss - with Opening',
            'Profit & Loss',
        ],
        'Trial Balance' => [
            'Trial Balance',
        ],
    ];

    public function index(
        Request $request,
        CompanySettingsService $companyService,
    ) {
        $report = $this->buildReport($request);

        return Inertia::render(
            'Accounting/FinancialReports/Index',
            array_merge(
                [
                    'reportTypes' => array_keys(self::REPORTS),
                    'reportNames' => self::REPORTS,
                    'accounts' => $this->accountOptions(),
                    'branches' => $this->branchOptions(),
                    'departments' => $this->departmentOptions(),
                    'company' => $companyService->reportData(),
                ],
                $report,
            ),
        );
    }

    public function print(
        Request $request,
        CompanySettingsService $companyService,
    ) {
        return response()->view(
            'accounting.reports.financial',
            [
                'report' => $this->buildReport($request),
                'company' => $companyService->reportData(),
                'generatedAt' => now(),
                'autoPrint' => true,
            ],
        );
    }

    public function pdf(
        Request $request,
        CompanySettingsService $companyService,
    ) {
        $report = $this->buildReport($request);

        $pdf = Pdf::loadView(
            'accounting.reports.financial',
            [
                'report' => $report,
                'company' => $companyService->reportData(),
                'generatedAt' => now(),
                'autoPrint' => false,
            ],
        )->setPaper('a4', 'portrait');

        return $pdf->download(
            $this->safeFilename(
                'Financial-' . $report['report_name'] . '-' . now()->format('Ymd-His') . '.pdf',
            ),
        );
    }

    public function excel(
        Request $request,
        CompanySettingsService $companyService,
    ): StreamedResponse {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Financial Report');

        $row = 1;
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue("A{$row}", (string) ($company['name'] ?? 'HBA TRAVEL & TOURS'));
        $this->styleExcelTitle($sheet, "A{$row}:F{$row}", 16);
        $row++;

        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue("A{$row}", (string) ($company['tagline'] ?? ''));
        $this->styleExcelSubTitle($sheet, "A{$row}:F{$row}");
        $row += 2;

        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue("A{$row}", $report['report_title']);
        $this->styleExcelTitle($sheet, "A{$row}:F{$row}", 14);
        $row++;

        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue(
            "A{$row}",
            'From ' . $this->formatDate($report['date_from']) . ' To ' . $this->formatDate($report['date_to']),
        );
        $sheet->getStyle("A{$row}:F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row += 2;

        if ($report['report_type'] === 'Profit & Loss') {
            foreach ($report['sections'] as $section) {
                $sheet->mergeCells("A{$row}:F{$row}");
                $sheet->setCellValue("A{$row}", strtoupper($section['title']));
                $this->styleExcelSection($sheet, "A{$row}:F{$row}");
                $row++;

                foreach ($section['groups'] as $group) {
                    if (($group['title'] ?? '') !== '') {
                        $sheet->mergeCells("A{$row}:F{$row}");
                        $sheet->setCellValue("A{$row}", $group['title']);
                        $sheet->getStyle("A{$row}:F{$row}")->getFont()->setBold(true);
                        $sheet->getStyle("A{$row}:F{$row}")->getFont()->setItalic(false);
                        $row++;
                    }

                    foreach ($group['rows'] as $item) {
                        $sheet->setCellValue("A{$row}", $item['code']);
                        $sheet->setCellValue("B{$row}", $item['name']);
                        $sheet->setCellValue("C{$row}", $item['amount']);
                        $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
                        $row++;
                    }

                    if ($group['total'] !== null) {
                        $sheet->mergeCells("A{$row}:B{$row}");
                        $sheet->setCellValue("A{$row}", $group['total_label']);
                        $sheet->setCellValue("C{$row}", $group['total']);
                        $sheet->getStyle("A{$row}:C{$row}")->getFont()->setBold(true);
                        $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
                        $row++;
                    }
                }

                $row++;
            }

            $sheet->mergeCells("A{$row}:B{$row}");
            $sheet->setCellValue("A{$row}", 'Net Profit / (Loss)');
            $sheet->setCellValue("C{$row}", $report['net_profit_loss']);
            $sheet->getStyle("A{$row}:C{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:C{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE);
            $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
        } else {
            $sheet->setCellValue("A{$row}", 'Account Code');
            $sheet->setCellValue("B{$row}", 'Account Name');
            $sheet->setCellValue("C{$row}", 'Debit');
            $sheet->setCellValue("D{$row}", 'Credit');
            $sheet->setCellValue("E{$row}", 'Period Amount');
            $sheet->setCellValue("F{$row}", 'Balance');
            $this->styleExcelHeader($sheet, "A{$row}:F{$row}");
            $row++;

            foreach ($report['rows'] as $item) {
                $sheet->setCellValue("A{$row}", $item['code'] ?? '');
                $sheet->setCellValue("B{$row}", $item['name'] ?? '');
                $sheet->setCellValue("C{$row}", $item['debit'] ?? 0);
                $sheet->setCellValue("D{$row}", $item['credit'] ?? 0);
                $sheet->setCellValue("E{$row}", $item['period_amount'] ?? 0);
                $sheet->setCellValue("F{$row}", $item['balance'] ?? 0);
                $sheet->getStyle("C{$row}:F{$row}")->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
                $row++;
            }

            if (isset($report['totals'])) {
                $sheet->setCellValue("B{$row}", 'Total');
                $sheet->setCellValue("C{$row}", $report['totals']['debit'] ?? 0);
                $sheet->setCellValue("D{$row}", $report['totals']['credit'] ?? 0);
                $sheet->setCellValue("E{$row}", $report['totals']['period_amount'] ?? 0);
                $sheet->setCellValue("F{$row}", $report['totals']['balance'] ?? 0);
                $sheet->getStyle("B{$row}:F{$row}")->getFont()->setBold(true);
                $sheet->getStyle("C{$row}:F{$row}")->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
            }
        }

        foreach (['A' => 18, 'B' => 44, 'C' => 19, 'D' => 19, 'E' => 19, 'F' => 19] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
        $sheet->freezePane('A8');

        $filename = $this->safeFilename(
            'Financial-' . $report['report_name'] . '-' . now()->format('Ymd-His') . '.xlsx',
        );

        return response()->streamDownload(
            static function () use ($spreadsheet): void {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            },
            $filename,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
        );
    }

    private function buildReport(Request $request): array
    {
        $data = $request->validate([
            'report_type' => ['nullable', 'string'],
            'report_name' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'branch_id' => ['nullable', 'integer'],
            'department_id' => ['nullable', 'integer'],
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
        ]);

        $reportType = $data['report_type'] ?? 'Profit & Loss';
        if (!isset(self::REPORTS[$reportType])) {
            $reportType = 'Profit & Loss';
        }

        $reportName = $data['report_name'] ?? self::REPORTS[$reportType][0];
        if (!in_array($reportName, self::REPORTS[$reportType], true)) {
            $reportName = self::REPORTS[$reportType][0];
        }

        $dateFrom = $data['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $data['date_to'] ?? now()->toDateString();

        $base = [
            'report_type' => $reportType,
            'report_name' => $reportName,
            'report_title' => $this->displayReportTitle($reportName),
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'branch_id' => isset($data['branch_id']) ? (int) $data['branch_id'] : null,
            'department_id' => isset($data['department_id']) ? (int) $data['department_id'] : null,
            'account_id' => isset($data['account_id']) ? (int) $data['account_id'] : null,
            'filter_label' => $this->filterLabel($reportName, $data),
        ];

        return match ($reportType) {
            'Balance Sheet' => array_merge($base, $this->balanceSheet($dateTo)),
            'Commission Reports' => array_merge($base, $this->commissionReport($dateFrom, $dateTo)),
            'Trial Balance' => array_merge($base, $this->trialBalance($dateFrom, $dateTo, $data)),
            default => array_merge($base, $this->profitAndLoss($reportName, $dateFrom, $dateTo, $data)),
        };
    }

    private function profitAndLoss(string $reportName, string $dateFrom, string $dateTo, array $data): array
    {
        $includeOpening = str_contains(strtolower($reportName), 'with opening');
        $groupByBranch = str_contains(strtolower($reportName), 'branch');
        $groupByDepartment = str_contains(strtolower($reportName), 'department');

        $query = DB::table('journal_entry_lines as l')
            ->leftJoin('accounts as a', 'a.id', '=', 'l.account_id')
            ->whereBetween(DB::raw('DATE(COALESCE(l.posting_date, l.voucher_date))'), [$dateFrom, $dateTo])
            ->where(function ($q) {
                $q->where('l.account_code', 'like', '3%')
                    ->orWhere('l.account_code', 'like', '4%');
            });

        if (!empty($data['branch_id'])) {
            $query->where('l.branch_id', (int) $data['branch_id']);
        }
        if (!empty($data['department_id'])) {
            $query->where('l.department_id', (int) $data['department_id']);
        }

        if ($groupByBranch || $groupByDepartment) {
            $groupColumn = $groupByBranch ? 'l.branch_id' : 'l.department_id';
            $groupLabel = $groupByBranch ? 'Branch' : 'Department';
            $rows = $query
                ->selectRaw("{$groupColumn} as group_id, l.account_id, l.account_code, COALESCE(a.name,'') as account_name, SUM(l.debit) as debit, SUM(l.credit) as credit")
                ->groupBy($groupColumn, 'l.account_id', 'l.account_code', 'a.name')
                ->orderBy($groupColumn)
                ->orderBy('l.account_code')
                ->get();

            $sections = $this->buildProfitSections($rows, $includeOpening, $dateFrom, $dateTo, $groupLabel);
        } else {
            $rows = $query
                ->selectRaw("l.account_id, l.account_code, COALESCE(a.name,'') as account_name, SUM(l.debit) as debit, SUM(l.credit) as credit")
                ->groupBy('l.account_id', 'l.account_code', 'a.name')
                ->orderBy('l.account_code')
                ->get();

            $sections = $this->buildProfitSections($rows, $includeOpening, $dateFrom, $dateTo, null);
        }

        $income = 0.0;
        $expenses = 0.0;
        foreach ($sections as $section) {
            foreach ($section['groups'] as $group) {
                $amount = (float) ($group['total'] ?? 0);
                if (str_contains(strtolower($section['title']), 'income')) {
                    $income += $amount;
                } else {
                    $expenses += $amount;
                }
            }
        }

        return [
            'sections' => $sections,
            'net_profit_loss' => round($income - $expenses, 2),
        ];
    }

    private function buildProfitSections($rows, bool $includeOpening, string $dateFrom, string $dateTo, ?string $groupLabel): array
    {
        $containers = [
            'DIRECT INCOME' => [],
            'INDIRECT INCOME' => [],
            'DIRECT EXPENSES' => [],
            'INDIRECT EXPENSES' => [],
        ];

        foreach ($rows as $row) {
            $code = (string) $row->account_code;
            if ($code === '') {
                continue;
            }

            $debit = (float) $row->debit;
            $credit = (float) $row->credit;
            $amount = str_starts_with($code, '4') ? ($credit - $debit) : ($debit - $credit);

            if ($includeOpening) {
                $opening = $this->accountOpeningMovement((int) $row->account_id, $dateFrom);
                $amount += str_starts_with($code, '4')
                    ? ($opening['credit'] - $opening['debit'])
                    : ($opening['debit'] - $opening['credit']);
            }

            if (abs($amount) < 0.00001 && abs($debit) < 0.00001 && abs($credit) < 0.00001) {
                continue;
            }

            if (str_starts_with($code, '41')) {
                $section = 'DIRECT INCOME';
            } elseif (str_starts_with($code, '42')) {
                $section = 'INDIRECT INCOME';
            } elseif (str_starts_with($code, '31')) {
                $section = 'DIRECT EXPENSES';
            } else {
                $section = 'INDIRECT EXPENSES';
            }

            $groupKey = 'default';
            $groupTitle = $this->profitGroupTitle($code);
            if ($groupLabel !== null) {
                $groupKey = (string) ($row->group_id ?? '0');
                $groupTitle = $groupLabel . ': ' . $this->groupName($groupLabel, $row->group_id);
            }

            if (!isset($containers[$section][$groupKey])) {
                $containers[$section][$groupKey] = [
                    'title' => $groupTitle,
                    'rows' => [],
                    'total' => 0.0,
                    'total_label' => $groupLabel !== null ? 'Total ' . strtolower($groupTitle) : 'Total ' . $groupTitle . ':',
                ];
            }

            $containers[$section][$groupKey]['rows'][] = [
                'code' => $code,
                'name' => (string) $row->account_name,
                'amount' => round($amount, 2),
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
            ];
            $containers[$section][$groupKey]['total'] += $amount;
        }

        $sections = [];
        foreach ($containers as $title => $groups) {
            if (!$groups) {
                continue;
            }
            foreach ($groups as &$group) {
                $group['total'] = round($group['total'], 2);
                usort($group['rows'], static fn ($a, $b) => strcmp($a['code'], $b['code']));
            }
            unset($group);

            $sections[] = [
                'title' => $title,
                'groups' => array_values($groups),
            ];
        }

        return $sections;
    }

    private function balanceSheet(string $dateTo): array
    {
        $rows = DB::table('accounts as a')
            ->where(function ($q) {
                $q->where('a.code', 'like', '1%')
                    ->orWhere('a.code', 'like', '2%');
            })
            ->leftJoinSub(
                DB::table('journal_entry_lines as l')
                    ->whereRaw('DATE(COALESCE(l.posting_date,l.voucher_date)) <= ?', [$dateTo])
                    ->selectRaw('l.account_id, SUM(l.debit) debit, SUM(l.credit) credit')
                    ->groupBy('l.account_id'),
                'm',
                'm.account_id',
                '=',
                'a.id',
            )
            ->leftJoinSub(
                DB::table('account_opening_balances as o')
                    ->selectRaw('o.account_id, SUM(o.opening_debit) opening_debit, SUM(o.opening_credit) opening_credit')
                    ->where(function ($q) {
                        $q->whereNull('o.currency_code')->orWhere('o.currency_code', '')->orWhere('o.currency_code', 0);
                    })
                    ->groupBy('o.account_id'),
                'ob',
                'ob.account_id',
                '=',
                'a.id',
            )
            ->select([
                'a.code',
                'a.name',
                'a.id',
                DB::raw('COALESCE(m.debit,0) + COALESCE(ob.opening_debit,0) AS debit'),
                DB::raw('COALESCE(m.credit,0) + COALESCE(ob.opening_credit,0) AS credit'),
            ])
            ->orderBy('a.code')
            ->get();

        $sections = [
            ['title' => 'ASSETS', 'rows' => [], 'total' => 0.0],
            ['title' => 'LIABILITIES', 'rows' => [], 'total' => 0.0],
            ['title' => 'EQUITY', 'rows' => [], 'total' => 0.0],
        ];

        foreach ($rows as $row) {
            $code = (string) $row->code;
            $balance = (float) $row->debit - (float) $row->credit;
            if (abs($balance) < 0.00001) {
                continue;
            }

            $index = str_starts_with($code, '1') ? 0 : (str_starts_with($code, '23') ? 2 : 1);
            $sections[$index]['rows'][] = [
                'code' => $code,
                'name' => (string) $row->name,
                'debit' => (float) $row->debit,
                'credit' => (float) $row->credit,
                'period_amount' => 0.0,
                'balance' => $balance,
            ];
            $sections[$index]['total'] += $balance;
        }

        return [
            'sections' => array_values(array_filter($sections, static fn ($section) => count($section['rows']) > 0)),
            'rows' => [],
            'totals' => null,
        ];
    }

    private function trialBalance(string $dateFrom, string $dateTo, array $data): array
    {
        $query = DB::table('accounts as a')
            ->leftJoinSub(
                DB::table('journal_entry_lines as l')
                    ->whereRaw('DATE(COALESCE(l.posting_date,l.voucher_date)) BETWEEN ? AND ?', [$dateFrom, $dateTo])
                    ->selectRaw('l.account_id, SUM(l.debit) debit, SUM(l.credit) credit')
                    ->groupBy('l.account_id'),
                'p',
                'p.account_id',
                '=',
                'a.id',
            )
            ->select([
                'a.code',
                'a.name',
                'a.id',
                DB::raw('COALESCE(p.debit,0) AS debit'),
                DB::raw('COALESCE(p.credit,0) AS credit'),
            ])
            ->where(function ($q) {
                $q->where('a.code', 'like', '1%')
                    ->orWhere('a.code', 'like', '2%')
                    ->orWhere('a.code', 'like', '3%')
                    ->orWhere('a.code', 'like', '4%');
            })
            ->orderBy('a.code');

        if (!empty($data['branch_id'])) {
            $query->whereExists(function ($q) use ($data, $dateFrom, $dateTo) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_lines as bl')
                    ->whereColumn('bl.account_id', 'a.id')
                    ->where('bl.branch_id', (int) $data['branch_id'])
                    ->whereRaw('DATE(COALESCE(bl.posting_date,bl.voucher_date)) BETWEEN ? AND ?', [$dateFrom, $dateTo]);
            });
        }

        if (!empty($data['department_id'])) {
            $query->whereExists(function ($q) use ($data, $dateFrom, $dateTo) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_lines as dl')
                    ->whereColumn('dl.account_id', 'a.id')
                    ->where('dl.department_id', (int) $data['department_id'])
                    ->whereRaw('DATE(COALESCE(dl.posting_date,dl.voucher_date)) BETWEEN ? AND ?', [$dateFrom, $dateTo]);
            });
        }

        $rows = $query->get()->map(static function ($row) {
            $debit = (float) $row->debit;
            $credit = (float) $row->credit;
            return [
                'code' => (string) $row->code,
                'name' => (string) $row->name,
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
                'period_amount' => round($debit - $credit, 2),
                'balance' => round($debit - $credit, 2),
            ];
        })->filter(static fn ($row) => abs($row['debit']) > 0.00001 || abs($row['credit']) > 0.00001)->values()->all();

        return [
            'rows' => $rows,
            'totals' => [
                'debit' => round(array_sum(array_column($rows, 'debit')), 2),
                'credit' => round(array_sum(array_column($rows, 'credit')), 2),
                'period_amount' => round(array_sum(array_column($rows, 'period_amount')), 2),
                'balance' => round(array_sum(array_column($rows, 'balance')), 2),
            ],
        ];
    }

    private function commissionReport(string $dateFrom, string $dateTo): array
    {
        $rows = DB::table('journal_entry_lines as l')
            ->join('accounts as a', 'a.id', '=', 'l.account_id')
            ->whereBetween(DB::raw('DATE(COALESCE(l.posting_date,l.voucher_date))'), [$dateFrom, $dateTo])
            ->where(function ($q) {
                $q->whereRaw('LOWER(a.name) LIKE ?', ['%commission%'])
                    ->orWhereIn('a.code', ['4200001', '3200021']);
            })
            ->selectRaw('l.account_id, l.account_code as code, a.name, SUM(l.debit) debit, SUM(l.credit) credit')
            ->groupBy('l.account_id', 'l.account_code', 'a.name')
            ->orderBy('l.account_code')
            ->get()
            ->map(static function ($row) {
                $debit = (float) $row->debit;
                $credit = (float) $row->credit;
                return [
                    'code' => (string) $row->code,
                    'name' => (string) $row->name,
                    'debit' => round($debit, 2),
                    'credit' => round($credit, 2),
                    'period_amount' => round($credit - $debit, 2),
                    'balance' => round($credit - $debit, 2),
                ];
            })->all();

        return [
            'rows' => $rows,
            'totals' => [
                'debit' => round(array_sum(array_column($rows, 'debit')), 2),
                'credit' => round(array_sum(array_column($rows, 'credit')), 2),
                'period_amount' => round(array_sum(array_column($rows, 'period_amount')), 2),
                'balance' => round(array_sum(array_column($rows, 'balance')), 2),
            ],
        ];
    }

    private function accountOpeningMovement(int $accountId, string $dateFrom): array
    {
        $movement = DB::table('journal_entry_lines')
            ->where('account_id', $accountId)
            ->whereRaw('DATE(COALESCE(posting_date,voucher_date)) < ?', [$dateFrom])
            ->selectRaw('COALESCE(SUM(debit),0) debit, COALESCE(SUM(credit),0) credit')
            ->first();

        $opening = DB::table('account_opening_balances')
            ->where('account_id', $accountId)
            ->where(function ($q) {
                $q->whereNull('currency_code')->orWhere('currency_code', '')->orWhere('currency_code', 0);
            })
            ->selectRaw('COALESCE(SUM(opening_debit),0) debit, COALESCE(SUM(opening_credit),0) credit')
            ->first();

        return [
            'debit' => (float) ($movement->debit ?? 0) + (float) ($opening->debit ?? 0),
            'credit' => (float) ($movement->credit ?? 0) + (float) ($opening->credit ?? 0),
        ];
    }

    private function profitGroupTitle(string $code): string
    {
        return match (true) {
            str_starts_with($code, '41') => 'Sales',
            str_starts_with($code, '42') => 'Other Income',
            str_starts_with($code, '31') => 'Direct Expenses',
            str_starts_with($code, '321') => 'Financial Expenses',
            str_starts_with($code, '322') => 'Depreciation',
            default => 'Operating Expenses',
        };
    }

    private function groupName(string $type, $id): string
    {
        if (!$id) {
            return 'Unassigned';
        }

        $table = $type === 'Branch' ? 'branches' : 'departments';
        $row = DB::table($table)->where('id', (int) $id)->first();
        if (!$row) {
            return 'Unassigned';
        }

        foreach (['name', 'branch_name', 'department_name', 'title', 'code'] as $column) {
            if (isset($row->{$column}) && trim((string) $row->{$column}) !== '') {
                return trim((string) $row->{$column});
            }
        }

        return $type . ' #' . (int) $id;
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
            ->map(static fn ($row) => [
                'id' => (int) $row->id,
                'code' => (string) $row->code,
                'name' => (string) $row->name,
            ])
            ->values()
            ->all();
    }

    private function branchOptions(): array
    {
        if (!Schema::hasTable('branches')) {
            return [];
        }

        return DB::table('branches')->get()->map(function ($row) {
            return [
                'id' => (int) $row->id,
                'name' => $this->groupName('Branch', $row->id),
            ];
        })->values()->all();
    }

    private function departmentOptions(): array
    {
        if (!Schema::hasTable('departments')) {
            return [];
        }

        return DB::table('departments')->get()->map(function ($row) {
            return [
                'id' => (int) $row->id,
                'name' => $this->groupName('Department', $row->id),
            ];
        })->values()->all();
    }

    private function displayReportTitle(string $name): string
    {
        return match ($name) {
            'Profit & Loss' => 'Profit and Loss A/C',
            default => $name,
        };
    }

    private function filterLabel(string $reportName, array $data): string
    {
        if (str_contains(strtolower($reportName), 'branch') && !empty($data['branch_id'])) {
            return 'Branch: ' . $this->groupName('Branch', $data['branch_id']);
        }
        if (str_contains(strtolower($reportName), 'department') && !empty($data['department_id'])) {
            return 'Department: ' . $this->groupName('Department', $data['department_id']);
        }
        return 'No Filter';
    }

    private function formatDate(string $value): string
    {
        try {
            return date('d/m/Y', strtotime($value));
        } catch (\Throwable) {
            return $value;
        }
    }

    private function safeFilename(string $value): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '-', $value) ?: 'financial-report';
    }

    private function styleExcelTitle($sheet, string $range, int $size): void
    {
        $sheet->getStyle($range)->getFont()->setBold(true)->setSize($size);
        $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function styleExcelSubTitle($sheet, string $range): void
    {
        $sheet->getStyle($range)->getFont()->setSize(10)->setItalic(true);
        $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function styleExcelSection($sheet, string $range): void
    {
        $sheet->getStyle($range)->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEFEFEF');
    }

    private function styleExcelHeader($sheet, string $range): void
    {
        $sheet->getStyle($range)->getFont()->setBold(true);
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFD9E8FB');
        $sheet->getStyle($range)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }
}
