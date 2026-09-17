<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = now()->startOfDay();
        $todayIso = $today->toDateString();
        $yesterdayIso = $today->copy()->subDay()->toDateString();
        $monthStart = $today->copy()->startOfMonth();
        $monthStartIso = $monthStart->toDateString();

        $todaySales = $this->salesAggregate($todayIso, $todayIso);
        $yesterdaySales = $this->salesAggregate($yesterdayIso, $yesterdayIso);
        $monthSales = $this->salesAggregate($monthStartIso, $todayIso);

        $receivables = $this->balanceTotal('12', $todayIso, 'debit');
        $payables = $this->balanceTotal('21', $todayIso, 'credit');

        $tomorrowIso = $today->copy()->addDay()->toDateString();
        $tomorrowCheckIns = $this->tomorrowBookingRows('HOTEL', $tomorrowIso);
        $tomorrowTransfers = $this->tomorrowBookingRows('TRANSFER', $tomorrowIso);

        $recentSales = $this->recentSalesRows(8);

        $daily = $this->dailyChart($monthStartIso, $todayIso);

        $activeCustomers = $this->activeAccountCount('12');
        $activeVendors = $this->activeAccountCount('21');
        $hotelBookings = $this->serviceTransactionCount($monthStartIso, $todayIso, 'HOTEL');
        $ticketTransactions = $this->serviceTransactionCount($monthStartIso, $todayIso, 'TICKET');

        return Inertia::render('dashboard', [
            'todayLabel' => $today->format('d M Y'),
            'tomorrowLabel' => $today->copy()->addDay()->format('d M Y'),
            'monthLabel' => $today->format('F Y'),
            'chartLabel' => $monthStart->format('d M') . ' – ' . $today->format('d M Y'),
            'currency' => 'PKR',

            'kpis' => [
                'todaySales' => round($todaySales['sales'], 2),
                'todayTransactions' => $todaySales['transactions'],
                'todayProfit' => round($todaySales['profit'], 2),
                'receivables' => round($receivables['amount'], 2),
                'receivableAccounts' => $receivables['accounts'],
                'payables' => round($payables['amount'], 2),
                'payableAccounts' => $payables['accounts'],
                'salesTrend' => $this->trend($todaySales['sales'], $yesterdaySales['sales']),
                'profitTrend' => $this->trend($todaySales['profit'], $yesterdaySales['profit']),
                'monthSales' => round($monthSales['sales'], 2),
                'monthProfit' => round($monthSales['profit'], 2),
            ],

            'chart' => $daily,

            'tomorrow' => [
                'checkIns' => array_values($tomorrowCheckIns['rows']),
                'checkInsCount' => $tomorrowCheckIns['count'],
                'transfers' => array_values($tomorrowTransfers['rows']),
                'transfersCount' => $tomorrowTransfers['count'],
            ],

            'recentSales' => $recentSales,

            'overview' => [
                'activeCustomers' => $activeCustomers,
                'activeVendors' => $activeVendors,
                'hotelBookings' => $hotelBookings,
                'ticketTransactions' => $ticketTransactions,
            ],

            'quickActions' => [
                [
                    'title' => 'New Invoice',
                    'description' => 'Create a customer invoice',
                    'href' => '/invoices/create',
                    'icon' => 'invoice',
                ],
                [
                    'title' => 'New Voucher',
                    'description' => 'Record an accounting voucher',
                    'href' => '/accounting/vouchers/create',
                    'icon' => 'voucher',
                ],
                [
                    'title' => 'Receipts',
                    'description' => 'Review customer receipts',
                    'href' => '/accounting/receipts/all',
                    'icon' => 'receipt',
                ],
                [
                    'title' => 'Payments',
                    'description' => 'Review supplier payments',
                    'href' => '/accounting/payments/all',
                    'icon' => 'payment',
                ],
            ],
        ]);
    }

    private function salesAggregate(string $from, string $to): array
    {
        $dateSql = "DATE(COALESCE(l.voucher_date, l.posting_date))";

        $row = DB::table('journal_entry_lines as l')
            ->whereRaw("UPPER(COALESCE(l.voucher_type, '')) = 'INV'")
            ->where('l.account_code', 'like', '12%')
            ->where('l.debit', '>', 0)
            ->whereRaw("{$dateSql} BETWEEN ? AND ?", [$from, $to])
            ->selectRaw('COALESCE(SUM(l.debit), 0) AS sales')
            ->selectRaw('COALESCE(SUM(COALESCE(l.profit, 0)), 0) AS profit')
            ->selectRaw(
                "COUNT(DISTINCT COALESCE(
                    NULLIF(l.voucher_id, 0),
                    NULLIF(l.legacy_reference_id, 0),
                    l.journal_entry_id
                )) AS transactions"
            )
            ->first();

        return [
            'sales' => (float) ($row->sales ?? 0),
            'profit' => (float) ($row->profit ?? 0),
            'transactions' => (int) ($row->transactions ?? 0),
        ];
    }

    private function dailyChart(string $from, string $to): array
    {
        $dateSql = "DATE(COALESCE(l.voucher_date, l.posting_date))";

        $rows = DB::table('journal_entry_lines as l')
            ->whereRaw("UPPER(COALESCE(l.voucher_type, '')) = 'INV'")
            ->where('l.account_code', 'like', '12%')
            ->where('l.debit', '>', 0)
            ->whereRaw("{$dateSql} BETWEEN ? AND ?", [$from, $to])
            ->selectRaw("{$dateSql} AS sale_date")
            ->selectRaw('COALESCE(SUM(l.debit), 0) AS sales')
            ->selectRaw('COALESCE(SUM(COALESCE(l.profit, 0)), 0) AS profit')
            ->groupBy('sale_date')
            ->orderBy('sale_date')
            ->get()
            ->keyBy('sale_date');

        $result = [];
        $cursor = new \DateTimeImmutable($from);
        $end = new \DateTimeImmutable($to);

        while ($cursor <= $end) {
            $iso = $cursor->format('Y-m-d');
            $row = $rows->get($iso);

            $result[] = [
                'date' => $iso,
                'label' => $cursor->format('d M'),
                'sales' => round((float) ($row->sales ?? 0), 2),
                'profit' => round((float) ($row->profit ?? 0), 2),
            ];

            $cursor = $cursor->modify('+1 day');
        }

        return $result;
    }

    private function balanceTotal(string $prefix, string $asOfDate, string $normalSide): array
    {
        $accounts = DB::table('accounts')
            ->select('id', 'code')
            ->where('code', 'like', $prefix . '%')
            ->where(function ($query) {
                $query->where('is_active', 1)->orWhereNull('is_active');
            })
            ->get();

        if ($accounts->isEmpty()) {
            return ['amount' => 0.0, 'accounts' => 0];
        }

        $opening = $this->openingBalanceMap();
        $movement = $this->movementBalanceMap($asOfDate);

        $amount = 0.0;
        $count = 0;

        foreach ($accounts as $account) {
            $accountId = (int) $account->id;

            $open = $opening[$accountId] ?? ['debit' => 0.0, 'credit' => 0.0];
            $move = $movement[$accountId] ?? ['debit' => 0.0, 'credit' => 0.0];

            $balance = ((float) $open['debit'] - (float) $open['credit'])
                + ((float) $move['debit'] - (float) $move['credit']);

            $outstanding = $normalSide === 'debit'
                ? max($balance, 0)
                : max(-$balance, 0);

            if ($outstanding > 0.00005) {
                $amount += $outstanding;
                $count++;
            }
        }

        return [
            'amount' => round($amount, 2),
            'accounts' => $count,
        ];
    }

    private function openingBalanceMap(): array
    {
        $map = [];

        if (Schema::hasTable('account_opening_balances')) {
            $columns = Schema::getColumnListing('account_opening_balances');

            $accountIdColumn = $this->firstColumn($columns, ['account_id', 'account']);
            $accountCodeColumn = $this->firstColumn($columns, ['account_code', 'code']);
            $debitColumn = $this->firstColumn($columns, ['opening_debit', 'debit', 'opening_db']);
            $creditColumn = $this->firstColumn($columns, ['opening_credit', 'credit', 'opening_cr']);
            $currencyColumn = $this->firstColumn($columns, ['currency_code', 'cur', 'currency_id']);

            if ($debitColumn && $creditColumn) {
                if ($accountIdColumn) {
                    $query = DB::table('account_opening_balances')
                        ->select($accountIdColumn)
                        ->selectRaw("COALESCE(SUM(`{$debitColumn}`),0) AS debit")
                        ->selectRaw("COALESCE(SUM(`{$creditColumn}`),0) AS credit");

                    if ($currencyColumn) {
                        $query->where(function ($q) use ($currencyColumn) {
                            $q->whereNull($currencyColumn)
                                ->orWhere($currencyColumn, '')
                                ->orWhere($currencyColumn, 0);
                        });
                    }

                    foreach ($query->groupBy($accountIdColumn)->get() as $row) {
                        $map[(int) $row->{$accountIdColumn}] = [
                            'debit' => (float) $row->debit,
                            'credit' => (float) $row->credit,
                        ];
                    }

                    if ($map !== []) {
                        return $map;
                    }
                }

                if ($accountCodeColumn) {
                    $query = DB::table('account_opening_balances as o')
                        ->join('accounts as a', 'a.code', '=', "o.{$accountCodeColumn}")
                        ->selectRaw('a.id AS account_id')
                        ->selectRaw("COALESCE(SUM(o.`{$debitColumn}`),0) AS debit")
                        ->selectRaw("COALESCE(SUM(o.`{$creditColumn}`),0) AS credit");

                    if ($currencyColumn) {
                        $query->where(function ($q) use ($currencyColumn) {
                            $q->whereNull("o.{$currencyColumn}")
                                ->orWhere("o.{$currencyColumn}", '')
                                ->orWhere("o.{$currencyColumn}", 0);
                        });
                    }

                    foreach ($query->groupBy('a.id')->get() as $row) {
                        $map[(int) $row->account_id] = [
                            'debit' => (float) $row->debit,
                            'credit' => (float) $row->credit,
                        ];
                    }

                    if ($map !== []) {
                        return $map;
                    }
                }
            }
        }

        $accountColumns = Schema::getColumnListing('accounts');

        if (
            in_array('opening_debit', $accountColumns, true)
            && in_array('opening_credit', $accountColumns, true)
        ) {
            foreach (
                DB::table('accounts')
                    ->select('id', 'opening_debit', 'opening_credit')
                    ->get() as $row
            ) {
                $map[(int) $row->id] = [
                    'debit' => (float) $row->opening_debit,
                    'credit' => (float) $row->opening_credit,
                ];
            }
        }

        return $map;
    }

    private function movementBalanceMap(string $asOfDate): array
    {
        $rows = DB::table('journal_entry_lines')
            ->select(
                'account_id',
                DB::raw('COALESCE(SUM(debit),0) AS debit'),
                DB::raw('COALESCE(SUM(credit),0) AS credit'),
            )
            ->whereNotNull('account_id')
            ->where(function ($query) use ($asOfDate) {
                $query->whereNull('posting_date')
                    ->orWhereDate('posting_date', '<=', $asOfDate);
            })
            ->groupBy('account_id')
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $map[(int) $row->account_id] = [
                'debit' => (float) $row->debit,
                'credit' => (float) $row->credit,
            ];
        }

        return $map;
    }

    private function tomorrowBookingRows(string $mode, string $tomorrowIso): array
    {
        $sourceRows = DB::table('journal_entry_lines')
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->where('account_code', 'like', '12%')
            ->where('debit', '>', 0)
            ->orderBy('id')
            ->get([
                'id',
                'journal_entry_id',
                'voucher_id',
                'voucher_date',
                'posting_date',
                'account_code',
                'passenger',
                'ticket_no',
                'mode',
                'mode_description',
                'sector_description',
                'legacy_data',
            ]);

        $accounts = DB::table('accounts')
            ->select('code', 'name')
            ->get()
            ->keyBy(fn ($row) => (string) $row->code);

        $rows = [];

        foreach ($sourceRows as $line) {
            $meta = $this->decodeLegacyData($line->legacy_data ?? null);
            $lineMode = strtoupper(trim((string) (
                $this->legacyValue($meta, ['Mode', 'mode'])
                ?? $line->mode_description
                ?? $line->mode
                ?? ''
            )));

            if (!str_contains($lineMode, strtoupper($mode))) {
                continue;
            }

            $sector = trim((string) (
                $this->legacyValue($meta, [
                    'Sector/Description',
                    'sector_description',
                    'sector',
                    'description',
                ])
                ?? $line->sector_description
                ?? ''
            ));

            $dateFromKeys = [
                'ServiceDateFrom',
                'check_in',
                'checkin',
                'service_date_from',
                'starting_date',
                'departure_date',
                'transfer_date',
            ];

            $dateFrom = $this->legacyDateIso(
                $this->legacyValue($meta, $dateFromKeys)
            );

            $dateTo = $this->legacyDateIso(
                $this->legacyValue($meta, [
                    'ServiceDateTo',
                    'check_out',
                    'checkout',
                    'service_date_to',
                    'ending_date',
                    'return_date',
                ])
            );

            if ($dateFrom === '' && $mode === 'TRANSFER') {
                $dateFrom = $this->firstTravelDate($meta, $sector);
            }

            if ($dateFrom !== $tomorrowIso) {
                continue;
            }

            $invoiceId = (int) (
                $this->legacyValue($meta, ['Voucher ID', 'voucher_id', 'invoice_id'])
                ?? $line->voucher_id
                ?? 0
            );

            $invoiceDate = $this->dateOnly(
                $this->legacyValue($meta, ['Voucher Date', 'voucher_date'])
                ?? $line->voucher_date
                ?? $line->posting_date
            );

            $passenger = trim((string) (
                $this->legacyValue($meta, ['Passenger', 'passenger', 'passenger_name'])
                ?? $line->passenger
                ?? ''
            ));

            $clientCode = trim((string) $line->account_code);
            $clientName = (string) ($accounts[$clientCode]->name ?? $clientCode);

            $hotelName = $this->legacyValue($meta, ['HotelName', 'hotel_name', 'hotel name'])
                ?? $this->deriveHotelName($sector);

            $roomType = $this->legacyValue($meta, ['RoomType', 'room_type', 'room type'])
                ?? $this->deriveRoomType($sector);

            $rooms = $this->numberValue($meta, [
                'NoOfRooms',
                'no_of_rooms',
                'rooms',
                'room_count',
            ]) ?? $this->deriveRooms($sector);

            if ($rooms <= 0) {
                $rooms = 1;
            }

            $transferDescription = $this->legacyValue($meta, [
                'TransferDescription',
                'transfer_description',
                'service_type',
                'ServiceType',
            ]) ?? $sector;

            $rows[] = $mode === 'HOTEL'
                ? [
                    'invoice' => $invoiceId,
                    'passenger' => $passenger,
                    'hotel' => (string) $hotelName,
                    'check_in' => $this->displayShortDate($dateFrom),
                    'check_out' => $this->displayShortDate($dateTo),
                    'room_type' => (string) $roomType,
                    'rooms' => $rooms,
                    'client' => $clientName !== '' ? $clientName : $clientCode,
                ]
                : [
                    'invoice' => $invoiceId,
                    'passenger' => $passenger,
                    'transfer_date' => $this->displayShortDate($dateFrom),
                    'route' => $transferDescription !== '' ? (string) $transferDescription : $sector,
                    'ticket_no' => trim((string) (
                        $this->legacyValue($meta, ['Ticket No', 'ticket_no', 'ticket no'])
                        ?? $line->ticket_no
                        ?? ''
                    )),
                    'client' => $clientName !== '' ? $clientName : $clientCode,
                ];
        }

        usort($rows, function (array $a, array $b): int {
            return [
                (string) ($a['passenger'] ?? ''),
                (string) ($a['invoice'] ?? ''),
            ] <=> [
                (string) ($b['passenger'] ?? ''),
                (string) ($b['invoice'] ?? ''),
            ];
        });

        return [
            'rows' => array_slice($rows, 0, 10),
            'count' => count($rows),
        ];
    }

    private function recentSalesRows(int $limit): array
    {
        $rows = DB::table('journal_entry_lines as l')
            ->whereRaw("UPPER(COALESCE(l.voucher_type, '')) = 'INV'")
            ->where('l.account_code', 'like', '12%')
            ->where('l.debit', '>', 0)
            ->orderByRaw('COALESCE(l.voucher_date, l.posting_date) DESC')
            ->orderByDesc('l.id')
            ->limit(80)
            ->get([
                'l.id',
                'l.journal_entry_id',
                'l.voucher_id',
                'l.legacy_reference_id',
                'l.voucher_date',
                'l.posting_date',
                'l.account_code',
                'l.passenger',
                'l.mode',
                'l.mode_description',
                'l.debit',
                'l.profit',
                'l.legacy_data',
            ]);

        $accounts = DB::table('accounts')
            ->select('code', 'name')
            ->get()
            ->keyBy(fn ($row) => (string) $row->code);

        $grouped = [];

        foreach ($rows as $line) {
            $key = (string) (
                $line->voucher_id
                ?: $line->legacy_reference_id
                ?: $line->journal_entry_id
            );

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'invoice' => (int) ($line->voucher_id ?: $line->legacy_reference_id ?: 0),
                    'customer' => (string) ($accounts[(string) $line->account_code]->name ?? $line->account_code),
                    'service' => trim((string) ($line->mode_description ?: $line->mode ?: 'Other')),
                    'amount' => 0.0,
                    'profit' => 0.0,
                    'date' => $this->dateOnly($line->voucher_date ?: $line->posting_date),
                ];
            }

            $grouped[$key]['amount'] += (float) $line->debit;
            $grouped[$key]['profit'] += (float) ($line->profit ?? 0);

            if ($grouped[$key]['customer'] === '' && $line->account_code) {
                $grouped[$key]['customer'] = (string) ($accounts[(string) $line->account_code]->name ?? $line->account_code);
            }
        }

        $result = array_values($grouped);

        usort($result, function (array $a, array $b): int {
            return [$b['date'], $b['invoice']] <=> [$a['date'], $a['invoice']];
        });

        return array_map(function (array $row): array {
            return [
                'invoice' => $row['invoice'],
                'customer' => $row['customer'],
                'service' => $row['service'],
                'amount' => round($row['amount'], 2),
                'profit' => round($row['profit'], 2),
                'date' => $row['date'],
            ];
        }, array_slice($result, 0, $limit));
    }

    private function activeAccountCount(string $prefix): int
    {
        return (int) DB::table('accounts')
            ->where('code', 'like', $prefix . '%')
            ->where(function ($query) {
                $query->where('is_active', 1)->orWhereNull('is_active');
            })
            ->count();
    }

    private function serviceTransactionCount(string $from, string $to, string $mode): int
    {
        $rows = DB::table('journal_entry_lines')
            ->whereRaw("UPPER(COALESCE(voucher_type, '')) = 'INV'")
            ->where('account_code', 'like', '12%')
            ->where('debit', '>', 0)
            ->whereRaw(
                "UPPER(COALESCE(mode_description, mode, '')) = ?",
                [$mode]
            )
            ->whereRaw(
                "DATE(COALESCE(voucher_date, posting_date)) BETWEEN ? AND ?",
                [$from, $to]
            )
            ->count();

        return (int) $rows;
    }

    private function trend(float $current, float $previous): ?array
    {
        if (abs($previous) < 0.00005) {
            return abs($current) < 0.00005
                ? ['direction' => 'flat', 'percentage' => 0.0, 'label' => 'No change vs yesterday']
                : ['direction' => 'up', 'percentage' => null, 'label' => 'New today'];
        }

        $percentage = (($current - $previous) / abs($previous)) * 100;

        return [
            'direction' => $percentage > 0.00005
                ? 'up'
                : ($percentage < -0.00005 ? 'down' : 'flat'),
            'percentage' => round($percentage, 1),
            'label' => number_format(abs($percentage), 1) . '% vs yesterday',
        ];
    }

    private function firstColumn(array $columns, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            if (in_array($candidate, $columns, true)) {
                return $candidate;
            }
        }

        return null;
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

    private function legacyValue(array $data, array $keys): ?string
    {
        $sources = [$data];

        if (isset($data['ui']) && is_array($data['ui'])) {
            $sources[] = $data['ui'];
        }

        foreach ($sources as $source) {
            $normalized = [];

            foreach ($source as $key => $value) {
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
        }

        return null;
    }

    private function numberValue(array $data, array $keys): ?float
    {
        $value = $this->legacyValue($data, $keys);

        if ($value === null) {
            return null;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', $value);

        return $clean !== '' && is_numeric($clean)
            ? (float) $clean
            : null;
    }

    private function legacyDateIso(?string $value): string
    {
        if (!$value) {
            return '';
        }

        return $this->toIso(trim($value));
    }

    private function toIso(string $value): string
    {
        if ($value === '') {
            return '';
        }

        foreach (
            [
                'Y-m-d H:i:s',
                'Y-m-d',
                'd/m/Y',
                'd-m-Y',
                'd/m/y',
                'd-m-y',
                'd-M-Y',
                'd-M-y',
            ] as $format
        ) {
            $date = \DateTimeImmutable::createFromFormat($format, trim($value));

            if ($date instanceof \DateTimeImmutable) {
                return $date->format('Y-m-d');
            }
        }

        return '';
    }

    private function firstTravelDate(array $data, string $sector): string
    {
        $explicit = $this->legacyValue($data, [
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

        preg_match(
            '/(?<!\d)(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?!\d)/',
            $sector,
            $match
        );

        if (!$match) {
            return '';
        }

        return $this->makeIsoDate(
            (int) $match[1],
            (int) $match[2],
            (int) $match[3]
        );
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

    private function dateOnly($value): string
    {
        return $value ? substr((string) $value, 0, 10) : '';
    }

    private function displayShortDate(string $iso): string
    {
        if ($iso === '') {
            return '';
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $iso);

        return $date instanceof \DateTimeImmutable
            ? $date->format('d-M-y')
            : $iso;
    }

    private function deriveHotelName(string $sector): string
    {
        $parts = array_values(
            array_filter(
                array_map('trim', preg_split('/-+/', $sector))
            )
        );

        foreach ($parts as $part) {
            $upper = strtoupper($part);

            if ($upper === 'ALLOTMENT' || preg_match('/^\d/', $part)) {
                continue;
            }

            if (preg_match('/\b(MAKKAH|MADINA|JED|APT|HTL)\b/i', $part)) {
                continue;
            }

            if (
                preg_match(
                    '/\b(SINGLE|DOUBLE|TRIPLE|QUAD|QUINT|EXECUTIVE|PRESIDENTIAL)\b/i',
                    $part
                )
            ) {
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
        foreach (
            [
                'PRESIDENTIAL SUITE',
                'EXECUTIVE SUITE',
                'SINGLE',
                'DOUBLE',
                'TRIPLE',
                'QUAD',
                'QUINT',
            ] as $type
        ) {
            if (str_contains(strtoupper($sector), $type)) {
                return $type;
            }
        }

        return '—';
    }

    private function deriveRooms(string $sector): float
    {
        $typePattern = '(SINGLE|DOUBLE|TRIPLE|QUAD|QUINT|EXECUTIVE|PRESIDENTIAL)';

        if (
            preg_match(
                '/(?:^|-)(\d+)\-' . $typePattern . '(?:-|$)/i',
                $sector,
                $match
            )
        ) {
            return max((float) $match[1], 1.0);
        }

        return 1.0;
    }

    private function normKey($value): string
    {
        return preg_replace(
            '/[^a-z0-9]+/',
            '_',
            strtolower(trim((string) $value))
        );
    }
}
    