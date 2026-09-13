<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clientwise Clearance Report</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 9mm 12mm 9mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 9px; }
        .header { width: 100%; border-bottom: 1px solid #111; padding-bottom: 7px; margin-bottom: 8px; }
        .header-table, .report-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: top; }
        .logo-cell { width: 18%; }
        .company-cell { width: 64%; text-align: center; }
        .qr-cell { width: 18%; text-align: right; }
        .logo { max-width: 100px; max-height: 62px; object-fit: contain; }
        .qr { width: 68px; height: 68px; object-fit: contain; }
        .company-name { font-size: 18px; font-weight: 700; line-height: 1.1; }
        .tagline { font-size: 9px; margin-top: 2px; }
        .details { margin-top: 4px; font-size: 7px; line-height: 1.4; }
        .title { text-align: center; font-size: 16px; font-weight: 700; margin: 10px 0 5px; }
        .period { text-align: center; font-size: 9px; margin-bottom: 7px; }
        .account { font-weight: 700; font-size: 10px; margin-bottom: 6px; }
        .report-table { table-layout: fixed; }
        .report-table th { border: 1px solid #1d4ed8; padding: 4px 4px; font-size: 8px; font-weight: 700; background: #f7f7f7; }
        .report-table td { border-bottom: 1px dotted #999; padding: 4px 4px; font-size: 8px; line-height: 1.25; vertical-align: top; }
        .report-table th:nth-child(1), .report-table td:nth-child(1) { width: 10%; }
        .report-table th:nth-child(2), .report-table td:nth-child(2) { width: 13%; }
        .report-table th:nth-child(3), .report-table td:nth-child(3) { width: 33%; }
        .report-table th:nth-child(4), .report-table td:nth-child(4) { width: 7%; text-align: right; }
        .report-table th:nth-child(5), .report-table td:nth-child(5),
        .report-table th:nth-child(6), .report-table td:nth-child(6),
        .report-table th:nth-child(7), .report-table td:nth-child(7),
        .report-table th:nth-child(8), .report-table td:nth-child(8) { width: 9.25%; text-align: right; }
        .num { white-space: nowrap; text-align: right; }
        .total td { font-weight: 700; border-top: 1px solid #111; border-bottom: 3px double #111; padding-top: 5px; }
        .footer { position: fixed; left: 0; right: 0; bottom: 0; border-top: 1px solid #888; padding-top: 3px; font-size: 7px; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td:first-child { text-align: left; }
        .footer-table td:last-child { text-align: right; }
        a { color: inherit; text-decoration: none; }
        @media screen {
            body { background: #e5e7eb; padding: 18px; }
            .paper { max-width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; padding: 36px; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        }
        @media print { .paper { width: 100%; } }
    </style>
</head>
<body>
@php
    $companyName = data_get($company, 'name') ?? 'HBA TRAVEL & TOURS';
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
    $account = data_get($report, 'account') ?? [];
    $rows = data_get($report, 'rows') ?? [];
    $totals = data_get($report, 'totals') ?? [];
    $fmt = static function ($value) { return number_format((float) ($value ?? 0), 2, '.', ','); };
    $fmtPlain = static function ($value) { return number_format((float) ($value ?? 0), 0, '.', ','); };
    $fdate = static function ($value) { if (!$value) return '—'; try { return \Carbon\Carbon::parse($value)->format('d-M-y'); } catch (Throwable $e) { return (string) $value; } };
@endphp
<div class="paper">
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logo)<img src="{{ $logo }}" class="logo" alt="HBA">@else<strong style="font-size:24px">HBA</strong>@endif
                </td>
                <td class="company-cell">
                    <div class="company-name">{{ $companyName }}</div>
                    @if($tagline)<div class="tagline">{{ $tagline }}</div>@endif
                    @if($address)<div class="details"><strong>Address:</strong> {{ $address }}</div>@endif
                    @if($phone || $mobile)<div class="details"><strong>Phone:</strong> {{ $phone }} @if($mobile), <strong>Mobile:</strong> {{ $mobile }}@endif</div>@endif
                    @if($email || $website)<div class="details"><strong>E-Mail:</strong> {{ $email }} @if($website), <strong>Website:</strong> {{ $website }}@endif</div>@endif
                    @if($license || $ntn)<div class="details">@if($license)<strong>Govt Lic No:</strong> {{ $license }}@endif @if($license && $ntn), @endif @if($ntn)<strong>NTN:</strong> {{ $ntn }}@endif</div>@endif
                </td>
                <td class="qr-cell">@if($qr)<img src="{{ $qr }}" class="qr" alt="QR">@endif</td>
            </tr>
        </table>
    </div>

    <div class="title">Clientwise Clearance Report</div>
    <div class="period">From {{ $fdate(data_get($report,'date_from')) }} &nbsp; To {{ $fdate(data_get($report,'date_to')) }}</div>
    <div class="account">{{ data_get($account,'code') }} &nbsp; {{ data_get($account,'name') }}</div>

    <table class="report-table">
        <thead><tr>
            <th>Invoice ID</th><th>Invoice Date</th><th>First Passenger of Invoice</th><th>Age</th>
            <th>Invoice</th><th>Refund</th><th>Vouchers</th><th>Net Payable</th>
        </tr></thead>
        <tbody>
            @forelse($rows as $item)
                <tr>
                    <td>{{ data_get($item,'invoice_id','—') }}</td>
                    <td>{{ $fdate(data_get($item,'invoice_date')) }}</td>
                    <td>{{ data_get($item,'first_passenger') ?: '—' }}</td>
                    <td class="num">{{ data_get($item,'age') !== null ? number_format((float) data_get($item,'age'), 0) : '—' }}</td>
                    <td class="num">{{ $fmt(data_get($item,'invoice')) }}</td>
                    <td class="num">{{ $fmt(data_get($item,'refund')) }}</td>
                    <td class="num">{{ $fmt(data_get($item,'vouchers')) }}</td>
                    <td class="num">{{ $fmt(data_get($item,'net_payable')) }}</td>
                </tr>
            @empty
                <tr><td colspan="8" style="text-align:center;padding:14px;">No invoice clearance records found.</td></tr>
            @endforelse
            <tr class="total">
                <td colspan="3" style="text-align:right">Total:</td>
                <td class="num">{{ number_format((float) data_get($totals,'age_average',0), 4) }}</td>
                <td class="num">{{ $fmt(data_get($totals,'invoice')) }}</td>
                <td class="num">{{ $fmt(data_get($totals,'refund')) }}</td>
                <td class="num">{{ $fmt(data_get($totals,'vouchers')) }}</td>
                <td class="num">{{ $fmt(data_get($totals,'net_payable')) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <table class="footer-table"><tr><td>{{ $website }}</td><td>Page <span style="display:inline-block;min-width:10px;">{{ '{PAGE_NUM}' }}</span></td></tr></table>
    </div>
</div>
@if(!empty($autoPrint))
<script>window.addEventListener('load', function(){ window.print(); });</script>
@endif
</body>
</html>
