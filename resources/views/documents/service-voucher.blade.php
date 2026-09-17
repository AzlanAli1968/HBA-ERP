<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Service Voucher #{{ $document['invoice']['invoice_number'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 11mm 10mm 14mm 10mm; }
        @if(!empty($pdfDownload))
            @page { margin-left: 0; margin-right: 0; }
        @endif
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #17263b; font-size: 8.2pt; line-height: 1.32; background: #fff; }
        table { width: 100%; border-collapse: collapse; }

        .document-footer { margin-top: 6mm; border-top: .6pt solid #c8d5e4; padding-top: 2.2mm; font-size: 6.7pt; line-height: 1.35; color: #66758a; text-align: center; white-space: pre-line; page-break-inside: avoid; }

        .brand { width: 100%; border-bottom: 1.2pt solid #173f6b; padding-bottom: 4mm; page-break-inside: avoid; }
        .brand-table { width: 100%; border-collapse: collapse; }
        .logo-cell { width: 22%; vertical-align: middle; }
        .brand-cell { width: 58%; vertical-align: middle; text-align: left; padding-left: 3mm; }
        .qr-cell { width: 20%; text-align: right; vertical-align: middle; }
        .logo { max-width: 48mm; max-height: 22mm; }
        .qr { max-width: 20mm; max-height: 20mm; }
        .company-name { font-size: 16.5pt; font-weight: 800; color: #102f52; letter-spacing: .2pt; }
        .tagline { margin-top: .7mm; color: #7b5a22; font-size: 8.1pt; text-transform: uppercase; letter-spacing: .6pt; }
        .contact { margin-top: 1.2mm; color: #566579; font-size: 7pt; line-height: 1.45; }

        .hero { margin-top: 4mm; padding: 4.2mm 5mm; background: #102f52; color: #fff; border-radius: 5px; page-break-inside: avoid; }
        .hero-title { font-size: 18pt; font-weight: 800; letter-spacing: .6pt; }
        .hero-sub { margin-top: 1mm; font-size: 7.2pt; color: #dce8f4; letter-spacing: .45pt; }

        .meta { margin-top: 3mm; width: 100%; border-collapse: collapse; page-break-inside: avoid; }
        .meta td { width: 25%; padding: 2.1mm 2.3mm; border: .6pt solid #d8e1eb; background: #f7f9fc; vertical-align: top; }
        .label { font-size: 6.35pt; color: #748196; text-transform: uppercase; letter-spacing: .55pt; }
        .value { margin-top: .65mm; font-weight: 700; font-size: 8pt; }

        .section { margin-top: 4mm; }
        .section-title { background: #eef4f9; color: #173f6b; border-left: 3pt solid #b98b38; padding: 2.1mm 3mm; font-size: 9.1pt; font-weight: 800; page-break-after: avoid; }
        .passengers { padding: 2.4mm; border: .5pt solid #d8e1eb; border-top: 0; page-break-inside: avoid; }
        .pill { display: inline-block; margin: .7mm 1mm 0 0; padding: 1.05mm 1.85mm; border-radius: 9px; background: #eef4fa; border: .5pt solid #d6e2ee; font-weight: 700; font-size: 7.25pt; }

        .service-table { page-break-inside: auto; table-layout: fixed; }
        .service-table thead { display: table-header-group; }
        .service-table tr { page-break-inside: avoid; }
        .service-table th { background: #102f52; color: #fff; padding: 1.7mm 1.35mm; border: .5pt solid #254d78; font-size: 6.35pt; text-transform: uppercase; vertical-align: middle; }
        .service-table td { padding: 1.55mm 1.35mm; border-bottom: .5pt solid #dce4eb; vertical-align: top; font-size: 7.15pt; overflow-wrap: break-word; }
        .service-table tbody tr:nth-child(even) td { background: #fbfcfe; }
        .pdf-download .pdf-content { margin-left: 15mm; margin-right: 15mm; }

        .two-col { width: 100%; border-collapse: separate; border-spacing: 2.4mm 0; margin-left: -2.4mm; }
        .two-col td { width: 50%; vertical-align: top; }
        .card { border: .6pt solid #d8e1eb; border-radius: 5px; padding: 3mm; background: #fff; page-break-inside: avoid; }
        .card-title { font-size: 8pt; color: #173f6b; font-weight: 800; margin-bottom: 1.3mm; }
        .notes { white-space: pre-line; font-size: 7.15pt; color: #45556c; }
        .contact-line { font-size: 7.3pt; line-height: 1.5; }
        .signature { margin-top: 7mm; width: 40%; border-top: .8pt solid #1b385c; padding-top: 1.1mm; font-size: 6.9pt; font-weight: 700; color: #44546a; page-break-inside: avoid; }
    </style>
</head>
<body class="{{ !empty($pdfDownload) ? 'pdf-download' : '' }}">
@php
    $inv = $document['invoice'];
    $lines = collect($document['lines'] ?? []);
    $d = static function ($value) {
        $value = trim((string)($value ?? ''));
        if ($value === '') return '';
        try { return (new DateTime($value))->format('d-M-Y'); } catch (Throwable $e) { return $value; }
    };
    $safe = static fn($value) => trim((string)($value ?? '')) !== '' ? trim((string)$value) : '-';
    $modeLabels = ['Ticket'=>'Air Ticket','Hotel'=>'Hotel','Transfer'=>'Transfer','Visa'=>'Visa','Other'=>'Other Service'];
@endphp

<div class="pdf-content">
<div class="brand">
    <table class="brand-table"><tr>
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
    </tr></table>
</div>

<div class="hero">
    <div class="hero-title">Service Voucher</div>
    <div class="hero-sub">SERVICE CONFIRMATION</div>
</div>

<table class="meta">
    <tr>
        <td><div class="label">Voucher No.</div><div class="value">#{{ $safe($inv['invoice_number'] ?? '') }}</div></td>
        <td><div class="label">Issue Date</div><div class="value">{{ $d($inv['invoice_date'] ?? '') }}</div></td>
        <td><div class="label">Reference</div><div class="value">{{ $safe($inv['ref_no'] ?? '') }}</div></td>
        <td><div class="label">Status</div><div class="value">{{ $safe($inv['status'] ?? '') }}</div></td>
    </tr>
    @if(empty($pdfDownload))
    <tr>
        <td colspan="4"><div class="label">Client</div><div class="value">{{ $safe($inv['client_name'] ?? '') }}</div><div class="label">{{ $safe($inv['client_code'] ?? '') }}</div></td>
    </tr>
    @endif
</table>

<div class="section">
    <div class="section-title">Passenger Details</div>
    <div class="passengers">
        @foreach(($document['passengers'] ?? []) as $passenger)<span class="pill">{{ $passenger }}</span>@endforeach
        @if(empty($document['passengers']))<span>-</span>@endif
    </div>
</div>

@foreach(['Hotel','Transfer','Ticket','Visa','Other'] as $mode)
    @php
            $modeLines = $lines->filter(fn($line) => ($line['mode'] ?? 'Other') === $mode);

            if ($mode === 'Hotel' || $mode === 'Transfer') {
                $modeLines = $modeLines->sortBy(function ($line) {
                    $date = trim((string) ($line['departure_date'] ?? ''));
                    return $date === '' ? '9999-12-31 23:59:59' : $date;
                })->values();
            }
        @endphp
    @if($modeLines->isNotEmpty())
        <div class="section">
            <div class="section-title">{{ $modeLabels[$mode] }}</div>
            <table class="service-table">
                <thead>
                @if($mode === 'Hotel')
                    <tr><th>Passenger</th><th>Hotel</th><th>Confirmation</th><th>Rooms</th><th>Room Type</th><th>Meal</th><th>Check In</th><th>Nights</th><th>Check Out</th></tr>
                @elseif($mode === 'Transfer')
                    <tr><th>Passenger</th><th>From</th><th>To</th><th>Service / Vehicle</th><th>Date</th><th>Qty</th></tr>
                @elseif($mode === 'Ticket')
                    <tr><th>Passenger</th><th>PNR / Ticket No.</th><th>Sector / Route</th><th>Departure</th><th>Return</th></tr>
                @elseif($mode === 'Visa')
                    <tr><th>Passenger</th><th>Package / Visa</th><th>Passport</th><th>Visa No.</th><th>Start</th><th>Qty</th></tr>
                @else
                    <tr><th>Passenger</th><th>Service / Description</th><th>Reference</th><th>Date</th><th>Qty</th></tr>
                @endif
                </thead>
                <tbody>
                @foreach($modeLines as $line)
                    @if($mode === 'Hotel')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['hotel_name'] ?? '') }}</td>
                            <td>{{ $safe($line['confirm_no'] ?? '') }}</td>
                            <td>{{ $safe($line['room_quantity'] ?? '') }}</td>
                            <td>{{ $safe($line['room_type'] ?? '') }}</td>
                            <td>{{ $safe($line['meal'] ?? '') }}</td>
                            <td>{{ $d($line['departure_date'] ?? '') }}</td>
                            <td>{{ $safe($line['nights'] ?? '') }}</td>
                            <td>{{ $d($line['return_date'] ?? '') }}</td>
                        </tr>
                    @elseif($mode === 'Transfer')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['sector'] ?? '') }}</td>
                            <td>{{ $safe($line['sector_to'] ?? '') }}</td>
                            <td>{{ $safe($line['service_description'] ?? $line['flight_information'] ?? '') }}</td>
                            <td>{{ $d($line['departure_date'] ?? '') }}</td>
                            <td>{{ $safe($line['quantity'] ?? 1) }}</td>
                        </tr>
                    @elseif($mode === 'Ticket')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['pnr'] ?? '') }}<br>{{ $safe($line['ticket_no'] ?? '') }}</td>
                            <td>{{ $safe($line['sector'] ?? $line['route'] ?? '') }}</td>
                            <td>{{ $d($line['departure_date'] ?? '') }}</td>
                            <td>{{ $d($line['return_date'] ?? '') }}</td>
                        </tr>
                    @elseif($mode === 'Visa')
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['package'] ?? $line['service_description'] ?? '') }}</td>
                            <td>{{ $safe($line['passport_no'] ?? '') }}</td>
                            <td>{{ $safe($line['visa_no'] ?? '') }}</td>
                            <td>{{ $d($line['starting_date'] ?? '') }}</td>
                            <td>1</td>
                        </tr>
                    @else
                        <tr>
                            <td>{{ $safe($line['passenger_name'] ?? '') }}</td>
                            <td>{{ $safe($line['service_description'] ?? $line['package'] ?? $line['particulars_2'] ?? '') }}</td>
                            <td>{{ $safe($line['ref_no'] ?? $line['internal_ref_no'] ?? '') }}</td>
                            <td>{{ $d($line['starting_date'] ?? $line['departure_date'] ?? '') }}</td>
                            <td>{{ $safe($line['quantity'] ?? 1) }}</td>
                        </tr>
                    @endif
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
@endforeach

<div class="section">
    <table class="two-col">
        <tr>
            <td>
                <div class="card">
                    <div class="card-title">Notes & Terms</div>
                    <div class="notes">{{ $company['document_notes'] ?? 'Please reconfirm all services before travel.' }}</div>
                </div>
            </td>
            <td>
                <div class="card">
                    <div class="card-title">Emergency Contact Details</div>
                    <div class="contact-line"><strong>{{ $safe($company['name'] ?? 'HBA TRAVEL & TOURS') }}</strong></div>
                    @if(!empty($company['phone']))<div class="contact-line">Phone: {{ $company['phone'] }}</div>@endif
                    @if(!empty($company['mobile']))<div class="contact-line">Mobile / WhatsApp: {{ $company['mobile'] }}</div>@endif
                    @if(!empty($company['email']))<div class="contact-line">E-mail: {{ $company['email'] }}</div>@endif
                </div>
            </td>
        </tr>
    </table>
</div>

<div class="signature">Authorized / Prepared By: {{ $safe($inv['employee'] ?? '') }}</div>

@if(trim((string)($company['document_footer'] ?? '')) !== '')
    <div class="document-footer">{{ trim((string)$company['document_footer']) }}</div>
@endif

@if(($autoPrint ?? false) === true)
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 250); });</script>
@endif
</div>
</body>
</html>
