@php
    $pdfMode = (bool) ($pdfMode ?? false);
@endphp 
<!doctype html>
<html lang="en">    
<head>
    <meta charset="utf-8">
    <title>Ledger - {{ $report['account']['name'] ?? $report['account_name'] ?? 'Account' }}</title>
    <style>
        @page {
    size: A4 landscape;
    margin: 12mm 0 16mm 0;
}

        * { box-sizing: border-box; }

        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
        }

        body.pdf-mode {
    padding: 0;
}

body.print-mode {
    padding: 0;
}

        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            color: #17263b;
            font-size: 9.2pt;
            line-height: 1.45;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .page {
    width: 100%;
}

.pdf-mode .page {
    width: auto;
    margin-left: 15mm;
    margin-right: 15mm;
}

        .page-break-avoid,
        .no-break {
            page-break-inside: avoid;
        }

        /* --------------------------------------------------------------
         * HBA brand header — intentionally aligned with invoice styling
         * ------------------------------------------------------------ */
        .brand {
            width: 100%;
            border-bottom: 1.25pt solid #173f6b;
            padding-bottom: 5.5mm;
        }

        .brand-table td {
            vertical-align: middle;
        }

        .logo-cell {
            width: 25%;
        }

        .brand-cell {
            width: 53%;
            padding-left: 4mm;
            text-align: left;
        }

        .qr-cell {
            width: 22%;
            text-align: right;
        }

        .logo {
            max-width: 54mm;
            max-height: 28mm;
        }

        .qr {
            max-width: 25mm;
            max-height: 25mm;
        }

        .company-name {
            color: #102f52;
            font-size: 20pt;
            font-weight: 800;
            letter-spacing: .15pt;
        }

        .tagline {
            margin-top: .6mm;
            color: #7b5a22;
            font-size: 8.6pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .55pt;
        }

        .contact {
            margin-top: 1.1mm;
            color: #566579;
            font-size: 7.5pt;
            line-height: 1.55;
        }

        /* --------------------------------------------------------------
         * Document title / metadata band
         * ------------------------------------------------------------ */
        .top-band {
            margin-top: 8mm;
            border: .65pt solid #d8e1eb;
            background: #f5f8fc;
            padding: 3.4mm 3.6mm;
            page-break-inside: avoid;
        }

        .meta td {
            vertical-align: top;
            padding: 1.2mm 1.6mm;
        }

        .doc-kicker {
            color: #8b6a2a;
            font-size: 6.9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }

        .doc-title {
            margin-top: .25mm;
            color: #102f52;
            font-size: 20pt;
            font-weight: 800;
            letter-spacing: .35pt;
        }

        .label {
            color: #748196;
            font-size: 6.6pt;
            text-transform: uppercase;
            letter-spacing: .45pt;
        }

        .value {
            margin-top: .55mm;
            color: #1f3046;
            font-size: 8pt;
            font-weight: 700;
        }

        .account-line {
            margin-top: 1mm;
            color: #65758a;
            font-size: 7.25pt;
        }

        .generated {
            margin-top: .8mm;
            color: #7a8798;
            font-size: 6.8pt;
        }

        /* --------------------------------------------------------------
         * Ledger table
         * ------------------------------------------------------------ */
        .section {
            margin-top: 7mm;
        }

        .section-title {
            background: #102f52;
            color: #ffffff;
            padding: 2.4mm 3.2mm;
            font-size: 9.2pt;
            font-weight: 800;
            letter-spacing: .12pt;
        }

        .section-title .tag {
            float: right;
            font-size: 6.8pt;
            font-weight: 600;
            letter-spacing: .7pt;
            opacity: .9;
            text-transform: uppercase;
        }

        .ledger-table {
            table-layout: fixed;
        }

        .ledger-table thead {
            display: table-header-group;
        }

        .ledger-table tr {
            page-break-inside: avoid;
        }

        .ledger-table th {
            background: #edf3f8;
            color: #173f6b;
            border: .55pt solid #cbd6e2;
            padding: 2mm 1.5mm;
            font-size: 7.2pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .2pt;
            vertical-align: middle;
        }

        .ledger-table td {
            border-bottom: .5pt solid #dfe6ed;
            padding: 1.8mm 1.5mm;
            vertical-align: top;
            font-size: 7.8pt;
            line-height: 1.4;
            overflow-wrap: break-word;
            word-break: break-word;
        }

        .ledger-table tbody tr:nth-child(even) td {
            background: #fbfcfe;
        }

        .col-date { width: 10%; }
        .col-vt { width: 6%; text-align: center; }
        .col-id { width: 8%; }
        .col-ref { width: 11%; }
        .col-desc { width: 30%; }
        .col-money { width: 10%; text-align: right; }
        .col-balance { width: 15%; text-align: right; }

        .invoice-link {
    color: #173f6b;
    border-bottom: .35pt solid #173f6b;
    font-weight: 800;
    text-decoration: none;
}

.pdf-mode .invoice-link {
    color: inherit;
    border-bottom: 0;
    text-decoration: none;
}

        .invoice-link:hover {
            text-decoration: underline;
        }

        .number {
            text-align: right;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }

        .muted {
            color: #7a8798;
        }

        .currency {
            margin-top: .7mm;
            color: #6d7787;
            font-size: 6.8pt;
            line-height: 1.2;
        }

        .bf td {
            background: #f5f8fc !important;
            border-top: .7pt solid #cbd6e2;
            border-bottom: .7pt solid #cbd6e2;
            font-weight: 800;
        }

        .total td {
            background: #f5f8fc;
            border-top: 1pt solid #173f6b;
            border-bottom: 2px double #173f6b;
            padding-top: 1.9mm;
            padding-bottom: 1.9mm;
            font-weight: 800;
        }

        .closing {
            margin-top: 4mm;
            border: .7pt solid #cfdbe7;
            background: #f5f8fc;
        }

        .closing td {
            padding: 2.4mm 2.7mm;
        }

        .closing-label {
            color: #65738a;
            font-size: 6.9pt;
            text-transform: uppercase;
            letter-spacing: .45pt;
        }

        .closing-value {
            color: #102f52;
            font-size: 12pt;
            font-weight: 800;
            text-align: right;
            white-space: nowrap;
        }

        .side {
            color: #7b5a22;
            font-size: 7pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-left: 1mm;
        }

        /* --------------------------------------------------------------
         * Bank details — shared document language with HBA invoice
         * ------------------------------------------------------------ */
        .banks {
            page-break-inside: avoid;
        }

        .bank-grid {
            table-layout: fixed;
        }

        .bank-grid td {
            width: 50%;
            padding: 1.15mm;
            vertical-align: top;
        }

        .bank-card {
            min-height: 26mm;
            border: .7pt solid #cfdae5;
            background: #ffffff;
            padding: 2.4mm;
        }

        .bank-head {
            color: #102f52;
            font-size: 7.8pt;
            font-weight: 800;
            padding-bottom: 1mm;
            border-bottom: .5pt solid #e1e8ef;
        }

        .bank-logo {
            max-width: 16mm;
            max-height: 8mm;
            float: right;
            margin-left: 2mm;
        }

        .bank-line {
            margin-top: .85mm;
            color: #4f5f73;
            font-size: 6.35pt;
            line-height: 1.45;
        }

        .bank-line strong {
            color: #223247;
        }

        /* --------------------------------------------------------------
         * Footer
         * ------------------------------------------------------------ */
        .document-footer {
            margin-top: 6mm;
            border-top: .65pt solid #c8d5e4;
            padding-top: 2.5mm;
            color: #66758a;
            font-size: 6.7pt;
            line-height: 1.45;
            text-align: center;
            white-space: pre-line;
            page-break-inside: avoid;
        }

        .signature {
            margin-top: 6mm;
            width: 34%;
            border-top: .75pt solid #1b385c;
            padding-top: 1.2mm;
            color: #44546a;
            font-size: 6.8pt;
            font-weight: 700;
            page-break-inside: avoid;
        }

        .footer-fixed {
            position: fixed;
            left: 15mm;
            right: 15mm;
            bottom: 5mm;
            height: 8mm;
            border-top: .5pt solid #d8e1eb;
            color: #7b8795;
            font-size: 6.8pt;
        }

        .footer-fixed table td {
            width: 33.33%;
            vertical-align: top;
            padding-top: 1.2mm;
        }

        .center { text-align: center; }
        .right { text-align: right; }

        .page-no:after {
            content: counter(page);
        }
    </style>
</head>
<body class="{{ $pdfMode ? 'pdf-mode' : 'print-mode' }}">
@php
    /*
     * PDF-only rendering mode.
     *
     * The same Blade is used by browser Print and downloadable PDF.
     * The controller passes $pdfMode=true only for the PDF action so
     * PDF-specific layout and link behavior never changes browser Print.
     */
    $pdfMode = (bool) ($pdfMode ?? false);

    $selectedAccount =
        data_get($report, 'account')
        ?? data_get($report, 'selectedAccount')
        ?? data_get($report, 'selected_account')
        ?? [];

    if (is_object($selectedAccount)) {
        $selectedAccount = (array) $selectedAccount;
    }

    $accountName =
        data_get($selectedAccount, 'name')
        ?? data_get($report, 'accountName')
        ?? data_get($report, 'account_name')
        ?? 'Ledger';

    $accountCode =
        data_get($selectedAccount, 'code')
        ?? data_get($report, 'accountCode')
        ?? data_get($report, 'account_code')
        ?? '';

    $dateFrom =
        data_get($report, 'date_from')
        ?? data_get($report, 'dateFrom')
        ?? '';

    $dateTo =
        data_get($report, 'date_to')
        ?? data_get($report, 'dateTo')
        ?? '';

    $openingBalance = (float) (
        data_get($report, 'opening.balance')
        ?? data_get($report, 'openingBalance')
        ?? data_get($report, 'opening_balance')
        ?? 0
    );

    $periodDebit = (float) (
        data_get($report, 'period.debit')
        ?? data_get($report, 'periodDebit')
        ?? data_get($report, 'period_debit')
        ?? 0
    );

    $periodCredit = (float) (
        data_get($report, 'period.credit')
        ?? data_get($report, 'periodCredit')
        ?? data_get($report, 'period_credit')
        ?? 0
    );

    $closingBalance = (float) (
        data_get($report, 'closing.balance')
        ?? data_get($report, 'closingBalance')
        ?? data_get($report, 'closing_balance')
        ?? ($openingBalance + $periodDebit - $periodCredit)
    );

    $openingSide =
        data_get($report, 'opening.side')
        ?? ($openingBalance < 0 ? 'Cr' : 'Dr');

    $closingSide =
        data_get($report, 'closing.side')
        ?? ($closingBalance < 0 ? 'Cr' : 'Dr');

    $rows =
        data_get($report, 'rows')
        ?? data_get($report, 'transactions')
        ?? [];

    $rows = is_iterable($rows) ? $rows : [];

    $companyName =
        data_get($company, 'name')
        ?? data_get($company, 'company_name')
        ?? 'HBA TRAVEL & TOURS';

    $tagline = data_get($company, 'tagline') ?? '';
    $address = data_get($company, 'address') ?? '';
    $phone = data_get($company, 'phone') ?? '';
    $mobile = data_get($company, 'mobile') ?? '';
    $email = data_get($company, 'email') ?? '';
    $website = data_get($company, 'website') ?? '';
    $govtLicense = data_get($company, 'govt_license') ?? '';
    $ntn = data_get($company, 'ntn') ?? '';

    $logoData = data_get($company, 'logo_data')
        ?? data_get($company, 'logo_url')
        ?? null;

    $qrData = data_get($company, 'qr_data')
        ?? data_get($company, 'qr_url')
        ?? null;

    $banks = collect(data_get($company, 'banks', []))
        ->filter(fn($bank) =>
            !empty($bank['is_active']) &&
            !empty($bank['show_on_documents'])
        )
        ->values();

    $documentFooter = trim((string) (
        data_get($company, 'document_footer')
        ?? ''
    ));

    $formatDate = static function ($value) {
        if (!$value) {
            return '';
        }

        try {
            return \Carbon\Carbon::parse($value)->format('d-M-Y');
        } catch (\Throwable $e) {
            return (string) $value;
        }
    };

    $number = static function ($value, $decimals = 0) {
        return number_format(
            (float) ($value ?? 0),
            $decimals,
            '.',
            ','
        );
    };

    $rowValue = static function ($row, $camel, $snake = null, $default = null) {
        $value = data_get($row, $camel);

        if ($value === null && $snake) {
            $value = data_get($row, $snake);
        }

        return $value ?? $default;
    };

    // Same SAR calculation used on the web ledger. It is shown only for
    // INV rows whose service is Hotel, Visa, or Transfer.
    $serviceModeFromDescription = static function (string $description): ?string {
        $text = strtoupper($description);

        if (preg_match('/\bVISA\b/', $text)) {
            return 'visa';
        }

        if (preg_match('/\bTRANSFER\b|\bVEHICLE\b|\bTRANSPORT\b|\bCAR RENT\b/', $text)) {
            return 'transfer';
        }

        if (preg_match('/\bHOTEL\b/', $text)) {
            return 'hotel';
        }

        return null;
    };

    $hotelNightsFromDescription = static function (string $description): int {
        if (! preg_match(
            '/(\d{2}\/\d{2}\/(?:\d{2}|\d{4}))\D+(\d{2}\/\d{2}\/(?:\d{2}|\d{4}))/',
            $description,
            $match
        )) {
            return 0;
        }

        $parse = static function (string $value): int {
            [$day, $month, $year] = array_map('intval', explode('/', $value));
            if ($year < 100) {
                $year += 2000;
            }
            return gmmktime(0, 0, 0, $month, $day, $year);
        };

        $from = $parse($match[1]);
        $to = $parse($match[2]);

        if ($from <= 0 || $to <= $from) {
            return 0;
        }

        return (int) round(($to - $from) / 86400);
    };

    $deriveCurrencyBreakdown = static function (
        $row,
        callable $serviceModeFromDescription,
        callable $hotelNightsFromDescription,
    ): ?string {
        $existing = trim((string) data_get($row, 'currency_breakdown', ''));
        if ($existing !== '') {
            return $existing;
        }

        $rowType = strtoupper(trim((string) data_get($row, 'type', data_get($row, 'voucher_type', ''))));
        if ($rowType !== 'INV') {
            return null;
        }

        $description = trim((string) (
            data_get($row, 'description')
            ?: data_get($row, 'rich_description_export')
            ?: data_get($row, 'particulars')
            ?: ''
        ));

        $mode = $serviceModeFromDescription($description);
        if ($mode === null) {
            return null;
        }

        $currency = strtoupper(trim((string) data_get($row, 'currency_code', '')));
        $roe = (float) data_get($row, 'currency_rate', 0);
        $debit = (float) data_get($row, 'debit', 0);
        $credit = (float) data_get($row, 'credit', 0);
        $baseAmount = abs($debit > 0 ? $debit : $credit);

        if ($currency === '' || $roe <= 0 || $baseAmount <= 0) {
            return null;
        }

        $quantity = (float) data_get($row, 'currency_quantity', 0);

        if ($mode === 'hotel') {
            $quantity = (float) $hotelNightsFromDescription($description);
        } elseif ($quantity <= 0) {
            $quantity = 1.0;
        }

        if ($quantity <= 0) {
            return null;
        }

        $unitRate = $baseAmount / $roe / $quantity;
        if ($unitRate <= 0) {
            return null;
        }

        $formatFactor = static function (float $value): string {
            if (abs($value - round($value)) < 0.005) {
                return number_format(round($value), 0, '.', ',');
            }

            return number_format($value, 2, '.', ',');
        };

        return $currency . ' '
            . $formatFactor($unitRate)
            . ' × '
            . $formatFactor($quantity)
            . ' × '
            . $formatFactor($roe);
    };
@endphp

<div class="page">
    {{-- ==============================================================
         BRAND HEADER
         ============================================================== --}}
    <div class="brand page-break-avoid">
        <table class="brand-table">
            <tr>
                <td class="logo-cell">
                    @if($logoData)
                        <img class="logo" src="{{ $logoData }}" alt="{{ $companyName }}">
                    @else
                        <strong style="font-size:20px;color:#102f52;">HBA</strong>
                    @endif
                </td>

                <td class="brand-cell">
                    <div class="company-name">{{ $companyName }}</div>

                    @if($tagline)
                        <div class="tagline">{{ $tagline }}</div>
                    @endif

                    <div class="contact">
                        @if($address){{ $address }}<br>@endif

                        @if($phone)Phone: {{ $phone }}@endif
                        @if($mobile)
                            @if($phone) | @endif Mobile: {{ $mobile }}
                        @endif

                        @if($email || $website)<br>@endif

                        @if($email)E-mail: {{ $email }}@endif
                        @if($website)
                            @if($email) | @endif Website: {{ $website }}
                        @endif

                        @if($govtLicense || $ntn)<br>@endif

                        @if($govtLicense)Govt Lic No: {{ $govtLicense }}@endif
                        @if($ntn)
                            @if($govtLicense) | @endif NTN: {{ $ntn }}
                        @endif
                    </div>
                </td>

                <td class="qr-cell">
                    @if($qrData)
                        <img class="qr" src="{{ $qrData }}" alt="QR">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- ==============================================================
         LEDGER META
         ============================================================== --}}
    <div class="top-band">
        <table class="meta">
            <tr>
                <td style="width:35%;">
                    <div class="doc-kicker">Accounting Statement</div>
                    <div class="doc-title">Ledger</div>
                    <div class="account-line">Account: {{ $accountName }}</div>
                    @if($accountCode)
                        <div class="account-line">Code: {{ $accountCode }}</div>
                    @endif
                </td>

                <td style="width:22%;">
                    <div class="label">Period</div>
                    <div class="value">
                        {{ $dateFrom ? $formatDate($dateFrom) : '—' }}
                        @if($dateFrom || $dateTo) – @endif
                        {{ $dateTo ? $formatDate($dateTo) : '—' }}
                    </div>
                </td>

                <td style="width:21%;">
                    <div class="label">Opening Balance</div>
                    <div class="value">
                        {{ $number(abs($openingBalance)) }}
                        <span class="side">{{ $openingSide }}</span>
                    </div>
                </td>

                <td style="width:22%;">
                    <div class="label">Printed</div>
                    <div class="value">
                        {{ $generatedAt instanceof \Carbon\CarbonInterface
                            ? $generatedAt->format('d/m/Y g:i A')
                            : now()->format('d/m/Y g:i A') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==============================================================
         LEDGER DETAIL
         ============================================================== --}}
    <div class="section no-break">
        <div class="section-title">
            Transaction Ledger
            <span class="tag">{{ $accountCode ?: 'Account Statement' }}</span>
        </div>
    </div>

    <table class="ledger-table">
        <thead>
            <tr>
                <th class="col-date">Date</th>
                <th class="col-vt">Type</th>
                <th class="col-id">V. ID</th>
                <th class="col-ref">Reference</th>
                <th class="col-desc">Description</th>
                <th class="col-money">Debit</th>
                <th class="col-money">Credit</th>
                <th class="col-balance">Balance</th>
            </tr>
        </thead>

        <tbody>
            {{-- Opening --}}
            <tr class="bf">
                <td></td>
                <td class="col-vt">B/F</td>
                <td></td>
                <td></td>
                <td>Balance B/F</td>

                <td class="number">
                    @if($openingBalance > 0)
                        {{ $number($openingBalance) }}
                    @else
                        -
                    @endif
                </td>

                <td class="number">
                    @if($openingBalance < 0)
                        {{ $number(abs($openingBalance)) }}
                    @else
                        -
                    @endif
                </td>

                <td class="number">
                    {{ $number(abs($openingBalance)) }}
                    <span class="side">{{ $openingSide }}</span>
                </td>
            </tr>

            @forelse($rows as $row)
                @php
                    $rowDate = $rowValue($row, 'date', 'posting_date');
                    $rowType = $rowValue($row, 'type', 'voucher_type', '');
                    $rowVoucher = $rowValue($row, 'voucher_id', 'voucher_no', '');
                    $rowRef =
                        $rowValue($row, 'ref', 'reference', '')
                        ?: $rowValue($row, 'invoice_no', null, '');

                    $rowDescription =
                        $rowValue($row, 'description', 'particulars', '')
                        ?: $rowValue($row, 'rich_description_export', null, '');

                    $rowDebit = (float) $rowValue($row, 'debit', null, 0);
                    $rowCredit = (float) $rowValue($row, 'credit', null, 0);
                    $rowBalance = (float) $rowValue($row, 'balance', null, 0);

                    $currencyCode =
                        $rowValue($row, 'currency_code', null, '');

                    $currencyQty =
                        $rowValue($row, 'currency_quantity', null, null);

                    $currencyRate =
                        $rowValue($row, 'currency_rate', null, null);

                    $currencyBreakdown = $deriveCurrencyBreakdown(
                        $row,
                        $serviceModeFromDescription,
                        $hotelNightsFromDescription,
                    );

                    $isInvoiceRow = strtoupper(trim((string) $rowType)) === 'INV';

                    $side =
                        $rowValue(
                            $row,
                            'side',
                            null,
                            $rowBalance < 0 ? 'Cr' : 'Dr'
                        );

                    $invoiceId = (int) $rowValue(
                        $row,
                        'invoice_id',
                        null,
                        0
                    );

                    $isInvoiceRow = strtoupper(trim((string) $rowType)) === 'INV';
                @endphp

                <tr>
                    <td class="col-date">{{ $formatDate($rowDate) ?: '—' }}</td>

                    <td class="col-vt" style="text-align:center;">
                        {{ $rowType ?: '—' }}
                    </td>

                    <td>
                        @if(
    ! $pdfMode
    && $invoiceId > 0
    && $isInvoiceRow
)
    <a
        href="{{ url('/invoices/' . $invoiceId) }}"
        class="invoice-link"
        title="Open invoice"
    >
        {{ $rowVoucher ?: 'Invoice' }}
    </a>
@else
    {{ $rowVoucher ?: '—' }}
@endif
                    </td>

                    <td>{{ $rowRef ?: '—' }}</td>

                    <td class="col-desc">
                        {{ $rowDescription ?: '—' }}

                        @if($isInvoiceRow && $currencyBreakdown)
                            <div class="currency">
                                {{ $currencyBreakdown }}
                            </div>
                        @endif
                    </td>

                    <td class="number">
                        {{ $rowDebit > 0 ? $number($rowDebit) : '-' }}
                    </td>

                    <td class="number">
                        {{ $rowCredit > 0 ? $number($rowCredit) : '-' }}
                    </td>

                    <td class="number">
                        {{ $number(abs($rowBalance)) }}
                        <span class="side">{{ $side }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8"
                        style="text-align:center;padding:10mm 3mm;color:#7a8798;">
                        No transactions found for the selected period.
                    </td>
                </tr>
            @endforelse

            {{-- Period totals --}}
            <tr class="total">
                <td colspan="5"></td>

                <td class="number">
                    {{ $number($periodDebit) }}
                </td>

                <td class="number">
                    {{ $number($periodCredit) }}
                </td>

                <td class="number">
                    {{ $number(abs($closingBalance)) }}
                    <span class="side">{{ $closingSide }}</span>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- ==============================================================
         SUMMARY
         ============================================================== --}}
    <table class="closing no-break">
        <tr>
            <td style="width:45%;">
                <div class="closing-label">Closing Balance</div>
                <div style="margin-top:1mm;color:#57677b;font-size:6.7pt;">
                    {{ $formatDate($dateTo ?: $dateFrom) ?: 'Selected period' }}
                </div>
            </td>

            <td style="width:55%;" class="number">
                <span class="closing-value">
                    {{ $number(abs($closingBalance)) }}
                </span>
                <span class="side">{{ $closingSide }}</span>
            </td>
        </tr>
    </table>

    {{-- ==============================================================
         BANK DETAILS
         ============================================================== --}}
    @if($banks->isNotEmpty())
        <div class="section banks">
            <div class="section-title">
                Bank Details
                <span class="tag">Payment Information</span>
            </div>

            <table class="bank-grid">
                <tr>
                    @foreach($banks as $index => $bank)
                        <td>
                            <div class="bank-card">
                                @if(!empty($bank['logo_data']) || !empty($bank['logo_url']))
                                    <img
                                        class="bank-logo"
                                        src="{{ $bank['logo_data'] ?: $bank['logo_url'] }}"
                                        alt="Bank"
                                    >
                                @endif

                                <div class="bank-head">
                                    {{ trim((string)($bank['label'] ?: ($bank['bank_name'] ?? 'Bank'))) }}
                                </div>

                                @if(!empty($bank['account_title']))
                                    <div class="bank-line">
                                        <strong>Account Title:</strong>
                                        {{ $bank['account_title'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['bank_name']))
                                    <div class="bank-line">
                                        <strong>Bank:</strong>
                                        {{ $bank['bank_name'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['account_number']))
                                    <div class="bank-line">
                                        <strong>Account No:</strong>
                                        {{ $bank['account_number'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['iban']))
                                    <div class="bank-line">
                                        <strong>IBAN:</strong>
                                        {{ $bank['iban'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['branch_name']))
                                    <div class="bank-line">
                                        <strong>Branch:</strong>
                                        {{ $bank['branch_name'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['swift_code']))
                                    <div class="bank-line">
                                        <strong>SWIFT/BIC:</strong>
                                        {{ $bank['swift_code'] }}
                                    </div>
                                @endif

                                @if(!empty($bank['currency_code']))
                                    <div class="bank-line">
                                        <strong>Currency:</strong>
                                        {{ $bank['currency_code'] }}
                                    </div>
                                @endif
                            </div>
                        </td>

                        @if(($index + 1) % 2 === 0 && $index + 1 < $banks->count())
                            </tr><tr>
                        @endif
                    @endforeach
                </tr>
            </table>
        </div>
    @endif

    {{-- Optional document footer from Company Settings --}}
    @if($documentFooter !== '')
        <div class="document-footer">
            {{ $documentFooter }}
        </div>
    @endif

    <div class="signature">
        Authorized / Prepared By: {{ data_get($report, 'prepared_by') ?? data_get($report, 'entry_by') ?? '-' }}
    </div>
</div>

{{-- Fixed footer repeats on each PDF page without covering the ledger body. --}}
<div class="footer-fixed">
    <table>
        <tr>
            <td>{{ $website ?: $email }}</td>
            <td class="center">HBA Travel &amp; Tours • Ledger Statement</td>
            <td class="right">Page <span class="page-no"></span></td>
        </tr>
    </table>
</div>

@if(($autoPrint ?? false) === true)
    <script>
        window.addEventListener('load', function () {
            setTimeout(function () {
                window.print();
            }, 250);
        });
    </script>
@endif
</body>
</html>
