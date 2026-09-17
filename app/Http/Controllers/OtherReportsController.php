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

class OtherReportsController extends Controller
{
    private const REPORTS = [
        'Check In',
        'Transportation Action Report',
    ];

    public function index(Request $request, CompanySettingsService $companyService)
    {
        return Inertia::render('Reports/Other', array_merge(
            [
                'reportNames' => self::REPORTS,
                'clients' => $this->accountOptions('12%'),
                'vendors' => $this->accountOptions('21%'),
                'company' => $companyService->reportData(),
            ],
            $this->buildReport($request),
        ));
    }

    public function print(Request $request, CompanySettingsService $companyService)
    {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();
        $html = $this->renderOtherReportHtml($report, $company, now(), true);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function pdf(Request $request, CompanySettingsService $companyService)
    {
        $report = $this->buildReport($request);
        $company = $companyService->reportData();
        $html = $this->renderOtherReportHtml($report, $company, now(), false);

        $pdf = Pdf::loadHtml($html)
            ->setPaper('a4', 'landscape');

        return $pdf->download($this->safeFilename(
            'Other-' . $report['report_name'] . '-' . now()->format('Ymd-His') . '.pdf',
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
        $sheet->setTitle('Other Report');

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

        $period = 'From ' . $this->displayDate($report['date_from']) . ' To ' . $this->displayDate($report['date_to']);
        if (($report['filter_label'] ?? 'All') !== 'All') {
            $period .= ' | Filter: ' . $report['filter_label'];
        }
        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", $period);
        $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $row += 2;

        $this->writeHeader($sheet, $row, $columns);
        $row++;

        foreach ($report['rows'] as $item) {
            $this->writeRow($sheet, $row, $columns, $item);
            $row++;
        }

        $sheet->setCellValue("A{$row}", 'Total');
        foreach ($columns as $index => $column) {
            if (!in_array($column['key'], ['receivable', 'payable', 'rooms'], true)) {
                continue;
            }
            $cell = $this->excelColumn($index + 1) . $row;
            $sheet->setCellValue($cell, (float) ($report['totals'][$column['key']] ?? 0));
            $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0.00;(#,##0.00)');
        }

        $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE);

        foreach ($columns as $index => $column) {
            $sheet->getColumnDimension($this->excelColumn($index + 1))->setWidth($column['width'] ?? 18);
        }

        $sheet->freezePane('A7');
        $sheet->getPageSetup()->setOrientation('landscape');
        $sheet->getPageSetup()->setPaperSize(9);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageMargins()->setLeft(0.2);
        $sheet->getPageMargins()->setRight(0.2);
        $sheet->getPageMargins()->setTop(0.3);
        $sheet->getPageMargins()->setBottom(0.4);

        $filename = $this->safeFilename(
            'Other-' . $report['report_name'] . '-' . now()->format('Ymd-His') . '.xlsx',
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
            'filter_type' => ['nullable', 'in:all,client,vendor'],
            'filter_value' => ['nullable', 'string'],
        ]);

        $reportName = $data['report_name'] ?? self::REPORTS[0];
        if (!in_array($reportName, self::REPORTS, true)) {
            $reportName = self::REPORTS[0];
        }

        $from = $data['date_from'] ?? now()->startOfMonth()->toDateString();
        $to = $data['date_to'] ?? now()->toDateString();
        $filterType = $data['filter_type'] ?? 'all';
        $filterValue = trim((string) ($data['filter_value'] ?? ''));

        if ($filterType === 'all') {
            $filterValue = '';
        }

        if ($reportName === 'Check In') {
            return $this->buildCheckIn($reportName, $from, $to, $filterType, $filterValue);
        }

        return $this->buildTransportation($reportName, $from, $to, $filterType, $filterValue);
    }

    private function buildCheckIn(string $name, string $from, string $to, string $filterType, string $filterValue): array
    {
        // Check In is a stay-based report. The migration kept the authoritative
        // Accu booking fields inside legacy_data, while voucher_id is NULL on
        // the migrated hotel detail lines. Therefore this report intentionally
        // uses legacy_data directly and does not pass through the generic
        // bookingLines()/decorateBookingLines() path.
        $sourceLines = DB::table('journal_entry_lines')
            ->whereIn('voucher_type', ['Inv', 'INV', 'inv'])
            ->where('account_code', 'like', '12%')
            ->where('debit', '>', 0)
            ->orderByRaw('COALESCE(voucher_date, posting_date) ASC')
            ->orderBy('id')
            ->get();

        $hotelRows = [];

        foreach ($sourceLines as $line) {
            $meta = $this->decodeLegacyData($line->legacy_data ?? null);

            /*
             * HBA_CHECKIN_REPORT_ALIGN_20260916_V6
             *
             * The dashboard and Check-In report must use the same effective
             * hotel arrival date. Migrated/native rows may store the start
             * date under ServiceDateFrom OR a normalized/native fallback such
             * as check_in / starting_date / departure_date.
             *
             * Profit is deliberately NOT used to decide whether a booking
             * belongs in the Check-In report.
             */
            $mode = strtoupper(trim((string) (
                $this->legacyValue($meta, 'Mode')
                ?? $line->mode_description
                ?? $line->mode
                ?? ''
            )));
            if ($mode !== 'HOTEL') {
                continue;
            }

            $checkInRaw = $this->legacyValue($meta, 'ServiceDateFrom')
                ?? $this->legacyValue($meta, 'check_in')
                ?? $this->legacyValue($meta, 'checkin')
                ?? $this->legacyValue($meta, 'service_date_from')
                ?? $this->legacyValue($meta, 'starting_date')
                ?? $this->legacyValue($meta, 'departure_date')
                ?? $this->legacyValue($meta, 'transfer_date');

            $checkOutRaw = $this->legacyValue($meta, 'ServiceDateTo')
                ?? $this->legacyValue($meta, 'check_out')
                ?? $this->legacyValue($meta, 'checkout')
                ?? $this->legacyValue($meta, 'service_date_to')
                ?? $this->legacyValue($meta, 'return_date')
                ?? $this->legacyValue($meta, 'ending_date');

            $checkInIso = $this->legacyDateIso($checkInRaw);
            if ($checkInIso === '' || $checkInIso < $from || $checkInIso > $to) {
                continue;
            }

            $hotelRows[] = [
                'line' => $line,
                'meta' => $meta,
                'check_in_iso' => $checkInIso,
                'check_out_iso' => $this->legacyDateIso($checkOutRaw),
            ];
        }

        $accounts = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->get()
            ->keyBy(fn ($row) => (string) $row->code);

        $journalIds = collect($hotelRows)
            ->map(fn (array $item) => (int) ($item['line']->journal_entry_id ?? 0))
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        $vendorLookup = [];
        if ($journalIds !== []) {
            $vendorRows = DB::table('journal_entry_lines')
                ->whereIn('journal_entry_id', $journalIds)
                ->where('account_code', 'like', '21%')
                ->where('credit', '>', 0)
                ->orderBy('journal_entry_id')
                ->orderBy('id')
                ->get();

            foreach ($vendorRows as $vendorRow) {
                $vendorMeta = $this->decodeLegacyData($vendorRow->legacy_data ?? null);
                $subId = $this->legacyValue($vendorMeta, 'SubID');
                if ($subId === null || trim($subId) === '') {
                    continue;
                }

                $key = (int) $vendorRow->journal_entry_id . '|' . trim($subId);
                if (!isset($vendorLookup[$key])) {
                    $vendorLookup[$key] = $vendorRow;
                }
            }
        }

        $rows = [];

        foreach ($hotelRows as $item) {
            $line = $item['line'];
            $meta = $item['meta'];

            $subId = trim((string) ($this->legacyValue($meta, 'SubID') ?? ''));
            $vendor = $vendorLookup[((int) ($line->journal_entry_id ?? 0)) . '|' . $subId] ?? null;

            $clientCode = trim((string) ($line->account_code ?? ''));
            $clientName = (string) (($accounts[$clientCode]->name ?? null) ?: $clientCode);
            $vendorCode = $vendor?->account_code;
            $vendorName = $vendorCode !== null
                ? (string) (($accounts[(string) $vendorCode]->name ?? null) ?: $vendorCode)
                : '';

            $receivable = (float) ($line->debit ?? 0);
            $payable = $vendor !== null ? (float) $vendor->credit : 0.0;
            $profit = $line->profit !== null && $line->profit !== ''
                ? (float) $line->profit
                : ($receivable - $payable);

            $sector = trim((string) ($this->legacyValue($meta, 'Sector/Description') ?? $line->sector_description ?? ''));
            $invoiceId = (int) ($this->legacyValue($meta, 'Voucher ID') ?? $line->voucher_id ?? 0);
            $invoiceDateRaw = $this->legacyValue($meta, 'Voucher Date') ?? $line->voucher_date ?? $line->posting_date;
            $passenger = trim((string) ($this->legacyValue($meta, 'Passenger') ?? $line->passenger ?? ''));
            $hotelName = (string) ($this->legacyValue($meta, 'HotelName') ?? $this->deriveHotelName($sector));
            $roomType = (string) ($this->legacyValue($meta, 'RoomType') ?? $this->deriveRoomType($sector));
            $meal = (string) ($this->legacyValue($meta, 'Meal') ?? $this->deriveMeal($sector));
            $roomsValue = $this->legacyValue($meta, 'NoOfRooms');
            $rooms = $roomsValue !== null && $roomsValue !== ''
                ? (float) preg_replace('/[^0-9.\-]/', '', $roomsValue)
                : $this->deriveRooms($sector);
            if ($rooms <= 0) {
                $rooms = 1.0;
            }

            $confirmNo = $this->legacyValue($meta, 'Tick/Chq/Ref');
            if ($confirmNo === null || trim($confirmNo) === '') {
                $confirmNo = str_contains(strtoupper($sector), 'ALLOTMENT') ? 'ALLOTMENT' : '';
            }

            $rows[] = [
                'voucher_id' => $invoiceId,
                'invoice_date' => $this->dateOnly($invoiceDateRaw),
                'ticket_no' => trim((string) ($this->legacyValue($meta, 'Ticket No') ?? '')),
                'passenger' => $passenger,
                'sector_description' => $sector,
                'client_code' => $clientCode,
                'client_name' => $clientName,
                'vendor_code' => (string) ($vendorCode ?? ''),
                'vendor_name' => $vendorName,
                'receivable' => round($receivable, 4),
                'payable' => round($payable, 4),
                'profit' => round($profit, 4),
                'transfer_date' => $this->displayShortDate($item['check_in_iso']),
                'transfer_date_iso' => $item['check_in_iso'],
                'check_in' => $this->displayShortDate($item['check_in_iso']),
                'check_out' => $this->displayShortDate($item['check_out_iso']),
                'check_in_iso' => $item['check_in_iso'],
                'check_out_iso' => $item['check_out_iso'],
                'confirm_no' => trim((string) $confirmNo),
                'hotel_name' => $hotelName,
                'room_type' => $roomType,
                'meal' => $meal,
                'rooms' => $rooms,
                'legacy_data' => $meta,
            ];
        }

        $rows = $this->applyFilter($rows, $filterType, $filterValue);

        usort($rows, static function (array $a, array $b): int {
            return [$a['check_in_iso'], $a['voucher_id']] <=> [$b['check_in_iso'], $b['voucher_id']];
        });

        foreach ($rows as $index => &$row) {
            $row['sr'] = $index + 1;
        }
        unset($row);

        $columns = [
            ['key' => 'sr', 'label' => 'Sr', 'width' => 6],
            ['key' => 'voucher_id', 'label' => 'Invoice ID', 'width' => 12],
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 14],
            ['key' => 'check_in', 'label' => 'Check In', 'width' => 13],
            ['key' => 'check_out', 'label' => 'Check Out', 'width' => 13],
            ['key' => 'confirm_no', 'label' => 'Confirm No', 'width' => 17],
            ['key' => 'passenger', 'label' => 'Pax', 'width' => 24],
            ['key' => 'hotel_name', 'label' => 'Hotel Name', 'width' => 27],
            ['key' => 'client_name', 'label' => 'Client Code', 'width' => 22],
            ['key' => 'vendor_name', 'label' => 'Payable To', 'width' => 24],
            ['key' => 'room_type', 'label' => 'Room Type', 'width' => 16],
            ['key' => 'meal', 'label' => 'Meal', 'width' => 9],
            ['key' => 'rooms', 'label' => 'No of Rooms', 'width' => 13],
        ];

        return [
            'report_name' => $name,
            'report_title' => 'Arrival Report',
            'date_from' => $from,
            'date_to' => $to,
            'filter_type' => $filterType,
            'filter_value' => $filterValue,
            'filter_label' => $this->filterLabel($filterType, $filterValue),
            'columns' => $columns,
            'rows' => $rows,
            'groups' => [],
            'totals' => [
                'receivable' => array_sum(array_map(fn ($row) => (float) $row['receivable'], $rows)),
                'payable' => array_sum(array_map(fn ($row) => (float) $row['payable'], $rows)),
                'rooms' => array_sum(array_map(fn ($row) => (float) $row['rooms'], $rows)),
            ],
        ];
    }

    private function legacyValue(array $data, string $wanted): ?string
    {
        /*
         * HBA_CHECKIN_LEGACYVALUE_UI_20260916_V1
         *
         * Some native/migrated invoice rows keep normalized service fields
         * inside legacy_data.ui instead of the top-level legacy_data object.
         * Search both locations while preserving the existing string-key API.
         */
        $needle = preg_replace('/[^a-z0-9]/', '', strtolower($wanted));

        $sources = [$data];

        if (isset($data['ui']) && is_array($data['ui'])) {
            $sources[] = $data['ui'];
        }

        foreach ($sources as $source) {
            foreach ($source as $key => $value) {
                $normalized = preg_replace('/[^a-z0-9]/', '', strtolower((string) $key));

                if ($normalized !== $needle) {
                    continue;
                }

                if ($value === null) {
                    continue;
                }

                $text = trim((string) $value);

                if ($text !== '') {
                    return $text;
                }
            }
        }

        return null;
    }

    private function legacyDateIso(?string $value): string
    {
        if ($value === null || trim($value) === '') {
            return '';
        }

        $value = trim($value);
        if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $value, $match)) {
            return $match[1];
        }

        return $this->toIso($value);
    }

    private function buildTransportation(string $name, string $from, string $to, string $filterType, string $filterValue): array
    {
        $rows = $this->decorateBookingLines($this->bookingLines('TRANSFER'));

        // No transport screenshot was supplied, so the layout follows the
        // same Accu-style detail convention, with transfer date as the range key.
        $rows = array_values(array_filter($rows, function (array $row) use ($from, $to): bool {
            $date = $row['transfer_date_iso'];
            return $date !== '' && $date >= $from && $date <= $to;
        }));

        $rows = $this->applyFilter($rows, $filterType, $filterValue);

        usort($rows, static function (array $a, array $b): int {
            return [$a['transfer_date_iso'], $a['voucher_id']] <=> [$b['transfer_date_iso'], $b['voucher_id']];
        });

        $columns = [
            ['key' => 'transfer_date', 'label' => 'Transfer Date', 'width' => 14],
            ['key' => 'invoice_date', 'label' => 'Invoice Date', 'width' => 14],
            ['key' => 'voucher_id', 'label' => 'Invoice ID', 'width' => 11],
            ['key' => 'ticket_no', 'label' => 'Ticket No', 'width' => 17],
            ['key' => 'passenger', 'label' => 'Passenger Name', 'width' => 24],
            ['key' => 'sector_description', 'label' => 'Transfer / Sector', 'width' => 37],
            ['key' => 'client_name', 'label' => 'Client Code', 'width' => 22],
            ['key' => 'vendor_name', 'label' => 'Payable To', 'width' => 23],
            ['key' => 'receivable', 'label' => 'Receivable', 'width' => 15],
            ['key' => 'payable', 'label' => 'Payable', 'width' => 15],
            ['key' => 'profit', 'label' => 'Profit', 'width' => 15],
        ];

        $totals = [
            'receivable' => array_sum(array_map(fn ($row) => (float) $row['receivable'], $rows)),
            'payable' => array_sum(array_map(fn ($row) => (float) $row['payable'], $rows)),
            'profit' => array_sum(array_map(fn ($row) => (float) $row['profit'], $rows)),
        ];

        return [
            'report_name' => $name,
            'report_title' => 'Transportation Action Report',
            'date_from' => $from,
            'date_to' => $to,
            'filter_type' => $filterType,
            'filter_value' => $filterValue,
            'filter_label' => $this->filterLabel($filterType, $filterValue),
            'columns' => $columns,
            'rows' => $rows,
            'groups' => [],
            'totals' => $totals,
        ];
    }

    private function bookingLines(string $mode): Collection
    {
        return DB::table('journal_entry_lines')
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->where('account_code', 'like', '12%')
            ->where('debit', '>', 0)
            ->where(function ($query) use ($mode) {
                $query->whereRaw('UPPER(COALESCE(mode_description, mode, \'\')) LIKE ?', ['%' . $mode . '%'])
                    ->orWhereRaw('UPPER(COALESCE(mode, \'\')) LIKE ?', ['%' . $mode . '%']);
            })
            ->orderByRaw('COALESCE(voucher_date, posting_date) ASC')
            ->orderBy('voucher_id')
            ->orderBy('id')
            ->get();
    }

    private function decorateBookingLines(Collection $lines): array
    {
        if ($lines->isEmpty()) {
            return [];
        }

        $accounts = DB::table('accounts')
            ->select('id', 'code', 'name')
            ->get()
            ->keyBy(fn ($row) => (string) $row->code);

        $voucherIds = $lines->pluck('voucher_id')->filter()->unique()->values()->all();
        $vendorLines = DB::table('journal_entry_lines')
            ->whereIn('voucher_id', $voucherIds)
            ->where('account_code', 'like', '21%')
            ->where('credit', '>', 0)
            ->orderBy('voucher_id')
            ->orderBy('id')
            ->get()
            ->groupBy(fn ($row) => (int) $row->voucher_id);

        $result = [];

        foreach ($lines as $line) {
            $meta = $this->decodeLegacyData($line->legacy_data ?? null);
            $clientCode = trim((string) ($line->account_code ?? ''));
            $clientName = (string) (($accounts[$clientCode]->name ?? null) ?: $clientCode);
            $vendors = $vendorLines->get((int) ($line->voucher_id ?? 0), collect());
            $vendor = $this->bestVendorLine($line, $vendors);

            $vendorCode = $vendor?->account_code;
            $vendorName = $vendorCode !== null
                ? (string) (($accounts[(string) $vendorCode]->name ?? null) ?: $vendorCode)
                : '';

            $receivable = (float) ($line->debit ?? 0);
            $profit = $line->profit !== null && $line->profit !== ''
                ? (float) $line->profit
                : ($receivable - (float) ($vendor?->credit ?? 0));
            $payable = $vendor !== null
                ? (float) $vendor->credit
                : max($receivable - $profit, 0);

            $sector = trim((string) ($line->sector_description ?? ''));
            $dates = $this->extractDates($meta, $sector);
            $checkInIso = $this->toIso($dates[0] ?? '');
            $checkOutIso = $this->toIso($dates[1] ?? '');
            $transferDateIso = $this->firstTravelDate($meta, $sector);

            $hotelName = $this->dataValue($meta, ['hotel_name', 'hotel name', 'hotelname']) ?? $this->deriveHotelName($sector);
            $roomType = $this->dataValue($meta, ['room_type', 'room type', 'roomtype']) ?? $this->deriveRoomType($sector);
            $meal = $this->dataValue($meta, ['meal', 'meal_plan', 'meal plan', 'board']) ?? $this->deriveMeal($sector);
            $rooms = $this->numberValue($meta, ['no_of_rooms', 'no of rooms', 'rooms', 'room_count']) ?? $this->deriveRooms($sector);

            $result[] = [
                'voucher_id' => (int) ($line->voucher_id ?? 0),
                'invoice_date' => $this->dateOnly($line->voucher_date ?? $line->posting_date),
                'ticket_no' => trim((string) ($line->ticket_no ?? $this->dataValue($meta, ['ticket_no', 'ticket no']) ?? '')),
                'passenger' => trim((string) ($line->passenger ?? $this->dataValue($meta, ['passenger', 'passenger_name', 'passenger name']) ?? '')),
                'sector_description' => $sector,
                'client_code' => $clientCode,
                'client_name' => $clientName,
                'vendor_code' => (string) ($vendorCode ?? ''),
                'vendor_name' => $vendorName,
                'receivable' => round($receivable, 4),
                'payable' => round($payable, 4),
                'profit' => round($profit, 4),
                'transfer_date' => $this->displayShortDate($transferDateIso),
                'transfer_date_iso' => $transferDateIso,
                'check_in' => $dates[0] ?? '',
                'check_out' => $dates[1] ?? '',
                'check_in_iso' => $checkInIso,
                'check_out_iso' => $checkOutIso,
                'confirm_no' => $this->dataValue($meta, ['confirm_no', 'confirm no', 'confirmation_no', 'confirmation number'])
                    ?? (str_contains(strtoupper($sector), 'ALLOTMENT') ? 'ALLOTMENT' : ''),
                'hotel_name' => $hotelName,
                'room_type' => $roomType,
                'meal' => $meal,
                'rooms' => $rooms,
                'legacy_data' => $meta,
            ];
        }

        return $result;
    }

    private function applyFilter(array $rows, string $filterType, string $filterValue): array
    {
        if ($filterType === 'client' && $filterValue !== '') {
            return array_values(array_filter($rows, static fn (array $row): bool => $row['client_code'] === $filterValue));
        }

        if ($filterType === 'vendor' && $filterValue !== '') {
            return array_values(array_filter($rows, static fn (array $row): bool => $row['vendor_code'] === $filterValue));
        }

        return $rows;
    }

    private function accountOptions(string $pattern): array
    {
        return DB::table('accounts')
            ->where('code', 'like', $pattern)
            ->where(function ($query) {
                $query->where('is_active', 1)->orWhereNull('is_active');
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

    private function filterLabel(string $type, string $value): string
    {
        if ($type === 'all' || $value === '') {
            return 'All';
        }

        $account = DB::table('accounts')
            ->where('code', $value)
            ->select('code', 'name')
            ->first();

        return $account ? $account->code . ' — ' . $account->name : $value;
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

    private function numberValue(array $data, array $keys): ?float
    {
        $value = $this->dataValue($data, $keys);
        if ($value === null) {
            return null;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', $value);
        return $clean !== '' && is_numeric($clean) ? (float) $clean : null;
    }

    private function firstTravelDate(array $data, string $sector): string
    {
        $explicit = $this->dataValue($data, [
            'transfer_date',
            'transfer date',
            'departure_date',
            'departure date',
            'check_in',
            'check in',
            'checkin',
        ]);

        if ($explicit !== null) {
            $iso = $this->toIso($explicit);
            if ($iso !== '') {
                return $iso;
            }
        }

        preg_match('/(?<!\d)(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?!\d)/', $sector, $match);
        if (!$match) {
            return '';
        }

        return $this->makeIsoDate((int) $match[1], (int) $match[2], (int) $match[3]);
    }

    private function deriveHotelName(string $sector): string
    {
        $parts = array_values(array_filter(array_map('trim', preg_split('/-+/', $sector))));
        if ($parts === []) {
            return '';
        }

        foreach ($parts as $part) {
            $upper = strtoupper($part);
            if ($upper === 'ALLOTMENT' || preg_match('/^\d/', $part)) {
                continue;
            }
            if (preg_match('/\b(MAKKAH|MADINA|JED|APT|HTL)\b/i', $part)) {
                continue;
            }
            if (preg_match('/\b(SINGLE|DOUBLE|TRIPLE|QUAD|QUINT|EXECUTIVE|PRESIDENTIAL)\b/i', $part)) {
                continue;
            }
            if (preg_match('/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/', $part)) {
                continue;
            }
            if (strlen($part) > 3) {
                return $part;
            }
        }

        return '';
    }

    private function deriveRoomType(string $sector): string
    {
        foreach (['PRESIDENTIAL SUITE', 'EXECUTIVE SUITE', 'SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'QUINT'] as $type) {
            if (str_contains(strtoupper($sector), $type)) {
                return $type;
            }
        }
        return '—';
    }

    private function deriveMeal(string $sector): string
    {
        $upper = strtoupper($sector);
        foreach (['RO', 'BB', 'HB', 'FB'] as $meal) {
            if (preg_match('/(?:^|[-\s])' . preg_quote($meal, '/') . '(?:$|[-\s])/i', $upper)) {
                return $meal;
            }
        }
        return 'RO';
    }

    private function deriveRooms(string $sector): float
    {
        $typePattern = '(SINGLE|DOUBLE|TRIPLE|QUAD|QUINT|EXECUTIVE|PRESIDENTIAL)';
        if (preg_match('/(?:^|-)(\d+)\-' . $typePattern . '(?:-|$)/i', $sector, $match)) {
            return max((float) $match[1], 1.0);
        }
        return 1.0;
    }

    private function extractDates(array $data, string $description): array
    {
        $from = $this->dataValue($data, [
            'check_in',
            'check in',
            'checkin',
            'departure_date',
            'departure date',
            'dep_date',
            'service_date_from',
            'service date from',
            'servicedatefrom',
        ]);
        $to = $this->dataValue($data, [
            'check_out',
            'check out',
            'checkout',
            'return_date',
            'return date',
            'service_date_to',
            'service date to',
            'servicedateto',
        ]);

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
        foreach (['Y-m-d H:i:s', 'Y-m-d', 'd/m/Y', 'd-m-Y', 'd/m/y', 'd-m-y', 'd-M-Y', 'd-M-y'] as $format) {
            $date = DateTimeImmutable::createFromFormat($format, $value);
            if ($date instanceof DateTimeImmutable) {
                return $date->format('d-M-y');
            }
        }

        return $value;
    }

    private function toIso(string $value): string
    {
        if ($value === '') {
            return '';
        }

        foreach (['Y-m-d H:i:s', 'Y-m-d', 'd/m/Y', 'd-m-Y', 'd/m/y', 'd-m-y', 'd-M-Y', 'd-M-y'] as $format) {
            $date = DateTimeImmutable::createFromFormat($format, trim($value));
            if ($date instanceof DateTimeImmutable) {
                return $date->format('Y-m-d');
            }
        }

        return '';
    }

    private function makeIsoDate(int $day, int $month, int $year): string
    {
        if ($year < 100) {
            $year += 2000;
        }
        if (!checkdate($month, $day, $year)) {
            return '';
        }
        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    private function makeDate(int $day, int $month, int $year): string
    {
        $iso = $this->makeIsoDate($day, $month, $year);
        return $iso === '' ? '' : (new DateTimeImmutable($iso))->format('d-M-y');
    }

    private function displayShortDate(string $iso): string
    {
        if ($iso === '') {
            return '';
        }
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $iso);
        return $date instanceof DateTimeImmutable ? $date->format('d-M-y') : $iso;
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
        $value = strtolower(trim((string) $value));
        return preg_replace('/[^a-z0-9]+/', '_', $value);
    }

    private function norm($value): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', (string) $value)));
    }

    private function renderOtherReportHtml(array $report, array $company, DateTimeImmutable|\DateTimeInterface $generatedAt, bool $autoPrint): string
    {
        $e = static fn ($value): string => htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $title = $e($report['report_title'] ?? $report['report_name'] ?? 'Other Report');
        $companyName = $e($company['name'] ?? 'HBA TRAVEL & TOURS');
        $tagline = $e($company['tagline'] ?? '');
        $from = $e($this->displayDate((string) ($report['date_from'] ?? '')));
        $to = $e($this->displayDate((string) ($report['date_to'] ?? '')));
        $filterLabel = $e($report['filter_label'] ?? 'All');
        $generated = $e($generatedAt->format('d-M-Y h:i:s A'));

        $columns = $report['columns'] ?? [];
        $rows = $report['rows'] ?? [];
        $totals = $report['totals'] ?? [];

        $numericKeys = ['receivable', 'payable', 'profit', 'rooms'];
        $html = '<!doctype html><html><head><meta charset="utf-8">';
        $html .= '<title>' . $title . '</title>';
        $html .= '<style>
            @page { size: A4 landscape; margin: 7mm 6mm 10mm 6mm; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 8.5pt; }
            .header { text-align: center; margin-bottom: 8px; }
            .company { font-size: 14pt; font-weight: 700; }
            .tagline { font-size: 8pt; margin-top: 2px; }
            .report-title { font-size: 12pt; font-weight: 700; margin-top: 8px; }
            .period { font-size: 8.5pt; margin-top: 2px; }
            .filter { font-size: 8pt; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead { display: table-header-group; }
            tfoot { display: table-row-group; }
            th, td {
                border: 0.4pt solid #444;
                padding: 3px 3px;
                vertical-align: top;
                overflow-wrap: anywhere;
                word-break: break-word;
            }
            th {
                font-weight: 700;
                text-align: center;
                font-size: 7.5pt;
                background: #f4f4f4;
            }
            td { font-size: 7.5pt; }
            td.num { text-align: right; white-space: nowrap; }
            .total td { font-weight: 700; border-top: 1.2pt solid #222; }
            .empty { text-align: center; padding: 12px; color: #666; }
            .footer {
                margin-top: 5px;
                font-size: 7pt;
                color: #444;
                display: flex;
                justify-content: space-between;
            }
            @media print {
                .no-print { display: none !important; }
            }
        </style></head><body>';

        $html .= '<div class="header">';
        $html .= '<div class="company">' . $companyName . '</div>';
        if ($tagline !== '') {
            $html .= '<div class="tagline">' . $tagline . '</div>';
        }
        $html .= '<div class="report-title">' . $title . '</div>';
        $html .= '<div class="period">From ' . $from . ' To ' . $to . '</div>';
        if ($filterLabel !== 'All') {
            $html .= '<div class="filter">Filter: ' . $filterLabel . '</div>';
        }
        $html .= '</div>';

        $html .= '<table><colgroup>';
        foreach ($columns as $column) {
            $width = max(4, min(35, (float) ($column['width'] ?? 12)));
            $html .= '<col style="width:' . $width . '%">';
        }
        $html .= '</colgroup><thead><tr>';

        foreach ($columns as $column) {
            $html .= '<th>' . $e($column['label'] ?? $column['key'] ?? '') . '</th>';
        }
        $html .= '</tr></thead><tbody>';

        if ($rows === []) {
            $html .= '<tr><td colspan="' . max(1, count($columns)) . '" class="empty">No records found for the selected filters.</td></tr>';
        } else {
            foreach ($rows as $item) {
                $html .= '<tr>';
                foreach ($columns as $column) {
                    $key = (string) ($column['key'] ?? '');
                    $value = $item[$key] ?? '';
                    $class = in_array($key, $numericKeys, true) ? ' class="num"' : '';

                    if (in_array($key, $numericKeys, true) && is_numeric($value)) {
                        $value = number_format((float) $value, 2);
                    }

                    $html .= '<td' . $class . '>' . $e($value) . '</td>';
                }
                $html .= '</tr>';
            }
        }

        $html .= '</tbody><tfoot><tr class="total">';
        foreach ($columns as $index => $column) {
            $key = (string) ($column['key'] ?? '');
            if ($index === 0) {
                $html .= '<td>Total</td>';
            } elseif (in_array($key, $numericKeys, true)) {
                $value = $totals[$key] ?? 0;
                $html .= '<td class="num">' . $e(number_format((float) $value, 2)) . '</td>';
            } else {
                $html .= '<td></td>';
            }
        }
        $html .= '</tr></tfoot></table>';

        $html .= '<div class="footer"><span>Printing Date: ' . $generated . '</span><span>HBA TRAVEL &amp; TOURS</span></div>';

        if ($autoPrint) {
            $html .= '<script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 150); });</script>';
        }

        $html .= '</body></html>';

        return $html;
    }

    private function writeHeader($sheet, int $row, array $columns): void
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

    private function writeRow($sheet, int $row, array $columns, array $item): void
    {
        foreach ($columns as $index => $column) {
            $cell = $this->excelColumn($index + 1) . $row;
            $value = $item[$column['key']] ?? '';

            if (in_array($column['key'], ['receivable', 'payable', 'rooms'], true)) {
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

    private function excelTitle($sheet, string $range, int $size): void
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true)->setSize($size);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function excelSubtitle($sheet, string $range): void
    {
        $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle($range)->getFont()->setSize(10);
    }

    private function excelColumn(int $number): string
    {
        $result = '';
        while ($number > 0) {
            $result = chr(65 + (($number - 1) % 26)) . $result;
            $number = intdiv($number - 1, 26);
        }
        return $result;
    }

    private function safeFilename(string $value): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '-', $value) ?: 'other-report';
    }
}
