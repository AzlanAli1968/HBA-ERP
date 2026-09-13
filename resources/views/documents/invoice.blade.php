<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $document['invoice']['invoice_number'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 11mm 15mm 14mm 15mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #17263b;
            font-size: 8.2pt;
            line-height: 1.32;
            background: #fff;
        }
        /* Extra horizontal inset for downloaded PDFs only. The browser Print
           route does not set pdfDownload, so its existing print layout is unchanged. */
        body.pdf-download {
            padding-left: 4mm;
            padding-right: 4mm;
        }
        table { width: 100%; border-collapse: collapse; }

        .document-footer {
            margin-top: 6mm;
            border-top: 0.6pt solid #c8d5e4;
            padding-top: 2.2mm;
            font-size: 6.7pt;
            line-height: 1.35;
            color: #66758a;
            text-align: center;
            white-space: pre-line;
            page-break-inside: avoid;
        }

        .brand {
            width: 100%;
            border-bottom: 1.2pt solid #173f6b;
            padding-bottom: 4mm;
        }
        .brand-table { width: 100%; border-collapse: collapse; }
        .logo-cell { width: 22%; vertical-align: middle; }
        .brand-cell { width: 58%; vertical-align: middle; text-align: left; padding-left: 3mm; }
        .qr-cell { width: 20%; text-align: right; vertical-align: middle; }
        .logo { max-width: 48mm; max-height: 22mm; }
        .qr { max-width: 20mm; max-height: 20mm; }
        .company-name { font-size: 16.5pt; font-weight: 800; color: #102f52; letter-spacing: .2pt; }
        .tagline { margin-top: .7mm; color: #7b5a22; font-size: 8.1pt; text-transform: uppercase; letter-spacing: .6pt; }
        .contact { margin-top: 1.2mm; color: #566579; font-size: 7pt; line-height: 1.45; }

        .top-band {
            margin-top: 4mm;
            padding: 3.2mm 3.5mm;
            background: #f5f8fc;
            border: 0.6pt solid #d8e1eb;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        .meta td { vertical-align: top; padding: 1.3mm 1.7mm; }
        .meta .label { color: #748196; font-size: 6.5pt; text-transform: uppercase; letter-spacing: .55pt; }
        .meta .value { font-size: 8.1pt; font-weight: 700; margin-top: .6mm; }
        .doc-subtitle { color: #8b6a2a; font-size: 7.4pt; letter-spacing: 1.1pt; text-transform: uppercase; font-weight: 700; }
        .doc-title { margin: .2mm 0 0; font-size: 19pt; font-weight: 800; letter-spacing: .5pt; color: #102f52; }

        .section { margin-top: 4mm; }
        .no-break { page-break-inside: avoid; }
        .section-title {
            background: #102f52;
            color: #fff;
            padding: 2.1mm 3mm;
            font-size: 9.1pt;
            font-weight: 800;
            letter-spacing: .15pt;
            page-break-after: avoid;
        }
        .section-title .tag { float: right; font-size: 6.5pt; font-weight: 600; letter-spacing: .75pt; opacity: .85; text-transform: uppercase; }

        .passenger-box { border: 0.6pt solid #d8e1eb; border-top: 0; padding: 2.2mm 3mm; }
        .passenger {
            display: inline-block;
            padding: 1.1mm 2mm;
            margin: .7mm 1mm 0 0;
            border-radius: 10px;
            background: #eef4fa;
            border: .5pt solid #d6e2ee;
            font-size: 7.3pt;
            font-weight: 700;
        }

        .service-table { page-break-inside: auto; table-layout: fixed; }
        .service-table thead { display: table-header-group; }
        .service-table tr { page-break-inside: avoid; }
        .service-table th {
            background: #edf3f8;
            color: #173f6b;
            border: .6pt solid #cbd6e2;
            padding: 1.55mm 1.3mm;
            font-size: 6.45pt;
            text-transform: uppercase;
            letter-spacing: .25pt;
            vertical-align: middle;
        }
        .service-table td {
            border-bottom: .5pt solid #dfe6ed;
            padding: 1.45mm 1.3mm;
            vertical-align: top;
            font-size: 7.15pt;
            overflow-wrap: break-word;
        }
        .service-table tbody tr:nth-child(even) td { background: #fbfcfe; }
        .num { text-align: right; white-space: nowrap; }
        .muted { color: #778599; }
        .small { font-size: 6.75pt; }

        .total-wrap { margin-top: 4mm; page-break-inside: avoid; }
        .totals-table td { padding: 1.35mm 2mm; border-bottom: .5pt solid #dbe3eb; }
        .totals-table .label { color: #65738a; }
        .mode-label { white-space: nowrap; }
        .mode-icon { display: inline-block; width: 4.5mm; margin-right: 1.4mm; color: #17263b; vertical-align: -1px; }
        .mode-icon svg { width: 3.5mm; height: 3.5mm; display: block; }
        .balance-zero { color: #65738a; }
        .totals-table .amount { text-align: right; font-weight: 800; white-space: nowrap; }
        .grand td { background: #102f52; color: #fff; border: none; padding: 2.5mm 2mm; font-size: 10.3pt; font-weight: 800; }
        .roe-line { margin-top: 2.2mm; text-align: center; color: #173f6b; font-size: 8.2pt; font-weight: 800; letter-spacing: .2pt; }

        .notes {
            border: .6pt solid #d8e1eb;
            background: #f9fbfd;
            padding: 3mm;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        .notes-title { font-weight: 800; color: #173f6b; margin-bottom: 1.3mm; }
        .notes-body { white-space: pre-line; font-size: 7.15pt; color: #45556c; }

        .banks { page-break-inside: avoid; }
        .bank-grid { width: 100%; }
        .bank-grid td { width: 50%; padding: 1.15mm; vertical-align: top; }
        .bank-card { border: .7pt solid #cfdae5; border-radius: 5px; padding: 2.6mm; min-height: 27mm; background: #fff; }
        .bank-head { color: #102f52; font-weight: 800; font-size: 7.9pt; }
        .bank-logo { max-width: 17mm; max-height: 9mm; float: right; }
        .bank-line { margin-top: 1mm; font-size: 6.75pt; color: #4f5f73; }
        .bank-line strong { color: #223247; }

        .signature { margin-top: 7mm; width: 40%; border-top: .8pt solid #1b385c; padding-top: 1.1mm; font-size: 6.9pt; font-weight: 700; color: #44546a; page-break-inside: avoid; }
        .page-break-avoid { page-break-inside: avoid; }
    </style>
</head>
<body class="{{ ($pdfDownload ?? false) ? 'pdf-download' : '' }}">
@php
    $inv = $document['invoice'];
    $lines = collect($document['lines'] ?? []);
    $money = static fn($value) => number_format((float) $value, 2);
    $d = static function ($value) {
        $value = trim((string) ($value ?? ''));
        if ($value === '') return '';
        try { return (new DateTime($value))->format('d-M-Y'); } catch (Throwable $e) { return $value; }
    };
    $safe = static fn($value) => trim((string) ($value ?? '')) !== '' ? trim((string) $value) : '-';
    $banks = collect($company['banks'] ?? [])->filter(fn($b) => !empty($b['is_active']) && !empty($b['show_on_documents']))->values();
    $roe = $lines->map(fn($line) => (float) ($line['roe'] ?? 0))->first(fn($value) => $value > 0);
    if (!$roe) {
        $roe = $lines->map(fn($line) => (float) ($line['currency_rate'] ?? 0))->first(fn($value) => $value > 0);
    }
    $roeCurrency = $lines->map(fn($line) => trim((string) ($line['currency_code'] ?? '')))->first(fn($value) => $value !== '') ?: 'SAR';
    $modeLabels = ['Ticket' => 'AIR TICKET', 'Hotel' => 'HOTEL', 'Transfer' => 'TRANSFER', 'Visa' => 'VISA', 'Other' => 'OTHER'];
    $invoiceId = (int) ($inv['id'] ?? 0);
    $invoiceNumber = trim((string) ($inv['invoice_number'] ?? ''));
    $clientCode = trim((string) ($inv['client_code'] ?? ''));

    /*
     * Receipts follow the same linkage used by the legacy Accu clearance logic:
     * historical receipts are attached to invoices by Inv No / Inv No2. The
     * normalized legacy_transactions table is the authoritative settlement copy
     * for imported Accu data. Native HBA invoices use their exact invoice_id on
     * journal_entry_lines.
     *
     * This intentionally does NOT require the customer account code for legacy
     * invoices because the invoice-number relation is the stronger legacy link.
     */
    $receipts = 0.0;
    $isLegacyInvoice = strtoupper(trim((string) ($document['data_source'] ?? ''))) === 'ACCU-TRAVEL';

    if ($isLegacyInvoice && $invoiceNumber !== '') {
        try {
            $receipts = (float) DB::table('legacy_transactions')
                ->where(function ($query) use ($invoiceNumber) {
                    $query->where('legacy_invoice_no', $invoiceNumber)
                        ->orWhere('legacy_invoice_no_2', $invoiceNumber);
                })
                ->where(function ($query) {
                    $query->whereNull('refund_no')
                        ->orWhere('refund_no', '');
                })
                ->where('credit', '>', 0)
                ->sum('credit');
        } catch (Throwable $e) {
            // Fall through to the normalized journal-line fallback.
            $receipts = 0.0;
        }
    }

    if ($receipts <= 0.00005) {
        try {
            $receiptQuery = DB::table('journal_entry_lines')
                ->whereIn('voucher_type', ['BR', 'Br', 'br'])
                ->where('credit', '>', 0);

            if ($isLegacyInvoice && $invoiceNumber !== '') {
                $receiptQuery->where(function ($query) use ($invoiceNumber) {
                    $query->where('legacy_invoice_no', $invoiceNumber)
                        ->orWhere('legacy_invoice_no_2', $invoiceNumber);
                });
            } elseif ($invoiceId > 0) {
                $receiptQuery->where('invoice_id', $invoiceId);
            }

            $receipts = (float) $receiptQuery->sum('credit');
        } catch (Throwable $e) {
            $receipts = 0.0;
        }
    }

    $receipts = round($receipts, 4);
    $netBalance = round((float) ($document['summary']['receivable'] ?? 0) - $receipts, 4);

    $modeIcons = [
        'Ticket' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5a2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 0 5h18v-5a2.5 2.5 0 0 1 0-5v-5H3a2.5 2.5 0 0 0 0 5Z"/><path d="M12 5v2m0 10v2"/></svg>',
        'Hotel' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19V8.5A1.5 1.5 0 0 1 4.5 7H11a3 3 0 0 1 3 3v9"/><path d="M3 13h17.5A.5.5 0 0 1 21 13.5V19"/><path d="M7 10h3"/><path d="M2 19h20"/></svg>',
        'Transfer' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16h2l1.5-7h10L19 12h2v4h-2"/><path d="M6.5 16a1.5 1.5 0 1 0 3 0m5 0a1.5 1.5 0 1 0 3 0"/><path d="M8 12h6"/></svg>',
        'Visa' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h5M8 15h3"/><path d="m15 15 1.5 1.5L20 13"/></svg>',
        'Other' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    ];
@endphp

<div class="brand page-break-avoid">
    <table class="brand-table">
        <tr>
            <td class="logo-cell">
                @if(!empty($company['logo_data']) || !empty($company['logo_url']))
                    <img class="logo" src="{{ $company['logo_data'] ?: $company['logo_url'] }}" alt="Logo">
                @endif
            </td>
            <td class="brand-cell">
                <div class="company-name">{{ $safe($company['name'] ?? 'HBA TRAVEL & TOURS') }}</div>
                @if(!empty($company['tagline']))<div class="tagline">{{ $company['tagline'] }}</div>@endif
                <div class="contact">
                    @if(!empty($company['address'])){{ $company['address'] }}<br>@endif
                    @if(!empty($company['phone']))Phone: {{ $company['phone'] }}@endif
                    @if(!empty($company['mobile'])) @if(!empty($company['phone'])) | @endif Mobile: {{ $company['mobile'] }}@endif
                    @if(!empty($company['email']) || !empty($company['website']))<br>@endif
                    @if(!empty($company['email']))E-mail: {{ $company['email'] }}@endif
                    @if(!empty($company['website'])) @if(!empty($company['email'])) | @endif Website: {{ $company['website'] }}@endif
                </div>
            </td>
            <td class="qr-cell">
                @if(!empty($company['qr_data']) || !empty($company['qr_url']))
                    <img class="qr" src="{{ $company['qr_data'] ?: $company['qr_url'] }}" alt="QR">
                @endif
            </td>
        </tr>
    </table>
</div>

<div class="top-band">
    <table class="meta">
        <tr>
            <td style="width:34%">
                <div class="doc-title">Invoice</div>
            </td>
            <td style="width:16%"><div class="label">Invoice ID</div><div class="value">#{{ $safe($inv['invoice_number'] ?? $inv['id']) }}</div></td>
            <td style="width:16%"><div class="label">Invoice Date</div><div class="value">{{ $d($inv['invoice_date'] ?? '') }}</div></td>
            <td style="width:17%"><div class="label">Due Date</div><div class="value">{{ $d($inv['due_date'] ?? '') ?: '-' }}</div></td>
            <td style="width:17%"><div class="label">Reference</div><div class="value">{{ $safe($inv['ref_no'] ?? '') }}</div></td>
        </tr>
        <tr>
            <td colspan="3"><div class="label">Client</div><div class="value">{{ $safe($inv['client_name'] ?? $inv['client_code'] ?? '') }}</div><div class="small muted">{{ $safe($inv['client_code'] ?? '') }}</div></td>
            <td colspan="2"><div class="label">Status</div><div class="value">{{ $safe($inv['status'] ?? '') }}</div></td>
        </tr>
    </table>
</div>

<div class="section no-break">
    <div class="section-title">Passenger Details <span class="tag">{{ count($document['passengers'] ?? []) }} passenger(s)</span></div>
    <div class="passenger-box">
        @foreach(($document['passengers'] ?? []) as $passenger)
            <span class="passenger">{{ $passenger }}</span>
        @endforeach
        @if(empty($document['passengers']))<span class="muted">No passenger recorded</span>@endif
    </div>
</div>

@foreach(['Ticket','Hotel','Transfer','Visa','Other'] as $mode)
    @php $modeLines = $lines->filter(fn($line) => ($line['mode'] ?? 'Other') === $mode); @endphp
    @if($modeLines->isNotEmpty())
        <div class="section">
            <div class="section-title">{{ $modeLabels[$mode] }} <span class="tag">{{ $modeLines->count() }} line(s)</span></div>
            <table class="service-table">
                <thead>
                @if($mode === 'Ticket')
                    <tr><th>Passenger</th><th>PNR / Ticket</th><th>Sector / Route</th><th>Departure</th><th>Return</th><th class="num">Amount</th></tr>
                @elseif($mode === 'Hotel')
                    <tr><th>Passenger</th><th>Hotel</th><th>Room</th><th>Meal</th><th>Check In</th><th>Nights</th><th>Check Out</th><th class="num">Rate / Night</th><th class="num">Net</th></tr>
                @elseif($mode === 'Transfer')
                    <tr><th>Passenger</th><th>From</th><th>To</th><th>Service / Vehicle</th><th>Date</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                @elseif($mode === 'Visa')
                    <tr><th>Visa</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                @else
                    <tr><th>Passenger</th><th>Description</th><th>Date</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                @endif
                </thead>
                <tbody>
                @foreach($modeLines as $line)
                    @if($mode === 'Ticket')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['pnr'] ?? '') }}<br><span class="muted">{{ $safe($line['ticket_no'] ?? '') }}</span></td>
                            <td>{{ $safe($line['sector'] ?? $line['route'] ?? '') }}<br><span class="muted">{{ $safe($line['route'] ?? '') }}</span></td>
                            <td>{{ $d($line['departure_date'] ?? '') }}</td><td>{{ $d($line['return_date'] ?? '') }}</td>
                            <td class="num">{{ $money($line['receivable_amount'] ?? 0) }}</td>
                        </tr>
                    @elseif($mode === 'Hotel')
    @php
        /*
         * ----------------------------------------------------------
         * HOTEL RATE DISPLAY
         * ----------------------------------------------------------
         *
         * Legacy Accu invoices:
         *     rate is stored in BASE currency.
         *     rate_sar is therefore the correct foreign display rate.
         *
         * Native HBA / Web / WhatsApp invoices:
         *     rate is already the rate entered for the invoice line.
         *     When the invoice is SAR, this is the SAR rate that
         *     should be displayed.
         *
         * The NET / Receivable remains the BASE-currency amount.
         */
        $hotelCurrency =
            strtoupper(
                trim(
                    (string) (
                        $line['currency_code']
                        ?? ''
                    )
                )
            );

        $hotelRoe =
            (float) (
                $line['roe']
                ?? $line['currency_rate']
                ?? 0
            );

        if ($isLegacyInvoice) {
            $hotelDisplayRate =
                $hotelCurrency !== ''
                    && $hotelRoe > 0
                    ? (
                        (float) (
                            $line['rate_sar']
                            ?? 0
                        )
                    )
                    : (
                        (float) (
                            $line['rate']
                            ?? 0
                        )
                    );
        } else {
            /*
             * Native HBA invoice:
             * use the actual invoice-line rate rather than
             * rate_sar, because rate_sar may be a derived
             * display field.
             */
            $hotelDisplayRate =
                (float) (
                    $line['rate']
                    ?? 0
                );
        }
    @endphp

    <tr>
        <td>{{ $safe($line['passenger_name'] ?? '') }}</td>

        <td>{{ $safe($line['hotel_name'] ?? '') }}</td>

        <td>
            {{ $safe($line['room_type'] ?? '') }}
            <br>
            <span class="muted">
                {{ $safe($line['room_no'] ?? '') }}
            </span>
        </td>

        <td>{{ $safe($line['meal'] ?? '') }}</td>

        <td>
            {{ $d($line['departure_date'] ?? '') }}
        </td>

        <td>
            {{ $safe($line['nights'] ?? '') }}
        </td>

        <td>
            {{ $d($line['return_date'] ?? '') }}
        </td>

        <td class="num">
            {{ $money($hotelDisplayRate) }}
        </td>

        <td class="num">
            {{ $money($line['receivable_amount'] ?? 0) }}
        </td>
    </tr>
                    @elseif($mode === 'Transfer')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td><td>{{ $safe($line['sector'] ?? '') }}</td><td>{{ $safe($line['sector_to'] ?? '') }}</td>
                            <td>{{ $safe($line['flight_information'] ?? $line['service_description'] ?? '') }}</td>
                            <td>{{ $d($line['departure_date'] ?? '') }}</td><td class="num">{{ $money($line['quantity'] ?? 1) }}</td>
                            <td class="num">{{ $money($line['rate_sar'] ?? $line['rate'] ?? 0) }}</td><td class="num">{{ $money($line['receivable_amount'] ?? 0) }}</td>
                        </tr>
                    @elseif($mode === 'Visa')
                        @php
                            // Historical Visa rows can repeat the invoice-level quantity
                            // (for example Quantity=4 on each of four passenger rows).
                            // Each displayed passenger is one visa, so show Qty=1 and
                            // derive the unit SAR rate from that passenger's full amount.
                            $visaAmount = (float) ($line['receivable_amount'] ?? 0);
                            $visaRoe = (float) ($line['roe'] ?? $line['currency_rate'] ?? 0);
                            $visaRate = $visaRoe > 0 ? $visaAmount / $visaRoe : (float) ($line['rate_sar'] ?? $line['rate'] ?? 0);
                        @endphp
                        <tr>
                            <td>{{ $safe($line['package'] ?? $line['service_description'] ?? 'VISA') }}</td>
                            <td class="num">1</td>
                            <td class="num">{{ $money($visaRate) }}</td>
                            <td class="num">{{ $money($visaAmount) }}</td>
                        </tr>
                    @else
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td><td>{{ $safe($line['service_description'] ?? $line['package'] ?? $line['particulars_2'] ?? '') }}</td>
                            <td>{{ $d($line['starting_date'] ?? $line['departure_date'] ?? '') }}</td><td class="num">{{ $money($line['quantity'] ?? 1) }}</td>
                            <td class="num">{{ $money($line['rate_sar'] ?? $line['rate'] ?? 0) }}</td><td class="num">{{ $money($line['receivable_amount'] ?? 0) }}</td>
                        </tr>
                    @endif
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
@endforeach

<div class="total-wrap">
    <table class="totals-table">
        @foreach(['Ticket','Hotel','Transfer','Visa','Other'] as $mode)
            @if(isset($document['mode_totals'][$mode]) && (float) $document['mode_totals'][$mode] > 0)
                <tr>
                    <td class="label mode-label">
                        @if(isset($modeIcons[$mode]))<span class="mode-icon">{!! $modeIcons[$mode] !!}</span>@endif
                        {{ $mode }}
                    </td>
                    <td class="amount">{{ $money($document['mode_totals'][$mode]) }}</td>
                </tr>
            @endif
        @endforeach
        <tr>
            <td class="label">Total Receivable</td>
            <td class="amount">{{ $money($document['summary']['receivable'] ?? 0) }}</td>
        </tr>
        <tr>
            <td class="label">Total Receipts</td>
            <td class="amount">{{ $money($receipts) }}</td>
        </tr>
        <tr>
            <td class="label">Net Balance</td>
            <td class="amount {{ abs($netBalance) < 0.005 ? 'balance-zero' : '' }}">{{ abs($netBalance) < 0.005 ? '-' : $money($netBalance) }}</td>
        </tr>
        <tr class="grand"><td>Total Invoice Value</td><td class="amount">{{ $money($document['summary']['receivable'] ?? 0) }}</td></tr>
    </table>
    @if($roe > 0)
        <div class="roe-line">{{ $roeCurrency }} @ {{ rtrim(rtrim(number_format($roe, 2), '0'), '.') }}</div>
    @endif
</div>

@if(!empty($company['document_notes']))
    <div class="section no-break">
        <div class="notes">
            <div class="notes-title">Notes & Terms</div>
            <div class="notes-body">{{ $company['document_notes'] }}</div>
        </div>
    </div>
@endif

@if($banks->isNotEmpty())
    <div class="section banks">
        <div class="section-title">Bank Details <span class="tag">Payment Information</span></div>
        <table class="bank-grid">
            <tr>
            @foreach($banks as $index => $bank)
                <td>
                    <div class="bank-card">
                        @if(!empty($bank['logo_data']) || !empty($bank['logo_url']))
                            <img class="bank-logo" src="{{ $bank['logo_data'] ?: $bank['logo_url'] }}" alt="Bank">
                        @endif
                        <div class="bank-head">{{ $safe($bank['label'] ?: $bank['bank_name']) }}</div>
                        @if(!empty($bank['account_title']))<div class="bank-line"><strong>Account Title:</strong> {{ $bank['account_title'] }}</div>@endif
                        @if(!empty($bank['bank_name']))<div class="bank-line"><strong>Bank:</strong> {{ $bank['bank_name'] }}</div>@endif
                        @if(!empty($bank['account_number']))<div class="bank-line"><strong>Account No:</strong> {{ $bank['account_number'] }}</div>@endif
                        @if(!empty($bank['iban']))<div class="bank-line"><strong>IBAN:</strong> {{ $bank['iban'] }}</div>@endif
                        @if(!empty($bank['branch_name']))<div class="bank-line"><strong>Branch:</strong> {{ $bank['branch_name'] }}</div>@endif
                        @if(!empty($bank['swift_code']))<div class="bank-line"><strong>SWIFT/BIC:</strong> {{ $bank['swift_code'] }}</div>@endif
                        @if(!empty($bank['currency_code']))<div class="bank-line"><strong>Currency:</strong> {{ $bank['currency_code'] }}</div>@endif
                    </div>
                </td>
                @if(($index + 1) % 2 === 0 && $index + 1 < $banks->count())</tr><tr>@endif
            @endforeach
            </tr>
        </table>
    </div>
@endif

<div class="signature">Authorized / Prepared By: {{ $safe($inv['employee'] ?? '') }}</div>

@if(trim((string)($company['document_footer'] ?? '')) !== '')
    <div class="document-footer">{{ trim((string)$company['document_footer']) }}</div>
@endif

@if(($autoPrint ?? false) === true)
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 250); });</script>
@endif
</body>
</html>
