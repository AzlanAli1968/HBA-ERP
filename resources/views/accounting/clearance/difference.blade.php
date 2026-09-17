<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ledger Clearance Difference</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 9mm 12mm 9mm; }
        * { box-sizing: border-box; }
        html, body { margin:0; padding:0; font-family:Arial,Helvetica,sans-serif; color:#111; font-size:9px; }
        .header { border-bottom:1px solid #111; padding-bottom:8px; margin-bottom:8px; }
        .header-table, .simple-table { width:100%; border-collapse:collapse; }
        .header-table td { vertical-align:top; }
        .logo-cell{width:18%}.company-cell{width:64%;text-align:center}.qr-cell{width:18%;text-align:right}
        .logo{max-width:100px;max-height:62px;object-fit:contain}.qr{width:68px;height:68px;object-fit:contain}
        .company-name{font-size:18px;font-weight:700}.tagline{font-size:9px;margin-top:2px}.details{font-size:7px;line-height:1.4;margin-top:4px}
        .title{text-align:center;font-size:16px;font-weight:700;border-top:1px solid #1d4ed8;border-bottom:1px solid #1d4ed8;padding:4px 0;margin:8px 0}
        .period{text-align:right;font-size:8px;margin-bottom:5px}.account-label{font-style:italic}.account-name{font-size:10px;font-weight:700;margin-top:3px}
        .summary{margin-top:14px;width:58%}.summary td{padding:4px 0;border-bottom:1px solid #ddd}.summary td:last-child{text-align:right;font-weight:700;white-space:nowrap}
        h2{font-size:12px;margin:13px 0 5px}.simple-table{table-layout:fixed}.simple-table th{border:1px solid #1d4ed8;padding:4px;background:#f7f7f7;font-size:8px;text-align:left}.simple-table td{border-bottom:1px dotted #999;padding:4px;font-size:8px;vertical-align:top}.num{text-align:right;white-space:nowrap}
        .footer{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #888;padding-top:3px;font-size:7px}.footer table{width:100%}.footer td:last-child{text-align:right}
        @media screen{body{background:#e5e7eb;padding:18px}.paper{max-width:794px;min-height:1123px;margin:auto;background:#fff;padding:36px;box-shadow:0 2px 10px rgba(0,0,0,.12)}}
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
    $logo = data_get($company, 'logo_data'); $qr = data_get($company, 'qr_data');
    $account = data_get($report,'account') ?? [];
    $money = static fn($v) => number_format(abs((float)($v ?? 0)), 2, '.', ',');
    $fdate = static function($v){ if(!$v)return '—'; try{return \Carbon\Carbon::parse($v)->format('d-M-y');}catch(Throwable $e){return (string)$v;} };
@endphp
<div class="paper">
<div class="header"><table class="header-table"><tr>
<td class="logo-cell">@if($logo)<img src="{{ $logo }}" class="logo" alt="HBA">@else<strong style="font-size:24px">HBA</strong>@endif</td>
<td class="company-cell">
    <div class="company-name">{{ $companyName }}</div>

    @if($tagline)
        <div class="tagline">{{ $tagline }}</div>
    @endif

    @if($address)
        <div class="details">
            <strong>Address:</strong> {{ $address }}
        </div>
    @endif

    @if($phone || $mobile)
        <div class="details">
            <strong>Phone:</strong> {{ $phone }}
            @if($mobile)
                , <strong>Mobile:</strong> {{ $mobile }}
            @endif
        </div>
    @endif

    @if($email || $website)
        <div class="details">
            <strong>E-Mail:</strong> {{ $email }}
            @if($website)
                , <strong>Website:</strong> {{ $website }}
            @endif
        </div>
    @endif

    @if($license || $ntn)
        <div class="details">
            @if($license)
                <strong>Govt Lic No:</strong> {{ $license }}
            @endif

            @if($license && $ntn)
                ,
            @endif

            @if($ntn)
                <strong>NTN:</strong> {{ $ntn }}
            @endif
        </div>
    @endif
</td>
</tr></table></div>

<div class="title">Difference in Ledger Balance and Invoice Clearance</div>
<div class="period">Printing Date: {{ $generatedAt instanceof \Carbon\CarbonInterface ? $generatedAt->format('d/m/Y g:i:s A') : now()->format('d/m/Y g:i:s A') }}</div>
<div class="account-label">Statement of,</div><div class="account-name">{{ data_get($account,'name') }}</div>

<table class="summary">
<tr><td>Ledger Balance</td><td>{{ $money(data_get($report,'ledger_balance')) }} {{ data_get($report,'ledger_balance_side') }}</td></tr>
<tr><td>Clearance Balance</td><td>{{ $money(data_get($report,'clearance_balance')) }} {{ data_get($report,'clearance_balance_side') }}</td></tr>
<tr><td style="font-weight:700">Difference</td><td style="font-weight:700">{{ $money(data_get($report,'difference')) }} {{ data_get($report,'difference_side') }}</td></tr>
</table>

<h2>Vouchers without Invoice Number</h2>
<table class="simple-table"><thead><tr><th style="width:18%">Date</th><th style="width:12%">VT</th><th style="width:28%">Voucher No</th><th style="width:21%">Debit</th><th style="width:21%">Credit</th></tr></thead><tbody>
@forelse(data_get($report,'vouchers_without_invoice',[]) as $r)<tr><td>{{ $fdate($r['date'] ?? null) }}</td><td>{{ $r['type'] }}</td><td>{{ $r['voucher_no'] }}</td><td class="num">{{ $money($r['debit'] ?? 0) }}</td><td class="num">{{ $money($r['credit'] ?? 0) }}</td></tr>@empty<tr><td colspan="5" style="text-align:center">No records found.</td></tr>@endforelse
</tbody></table>

<h2>Refunds without Invoice Number</h2>
<table class="simple-table"><thead><tr><th style="width:22%">Date</th><th style="width:14%">VT</th><th style="width:34%">Refund No</th><th style="width:30%">Amount</th></tr></thead><tbody>
@forelse(data_get($report,'refunds_without_invoice',[]) as $r)<tr><td>{{ $fdate($r['date'] ?? null) }}</td><td>{{ $r['type'] }}</td><td>{{ $r['refund_no'] }}</td><td class="num">{{ $money($r['amount'] ?? 0) }}</td></tr>@empty<tr><td colspan="4" style="text-align:center">Rfd</td></tr>@endforelse
</tbody></table>

<h2>Pending Refunds</h2>
<table class="simple-table"><thead><tr><th style="width:22%">Date</th><th style="width:14%">VT</th><th style="width:34%">Refund No</th><th style="width:30%">Amount</th></tr></thead><tbody>
@forelse(data_get($report,'pending_refunds',[]) as $r)<tr><td>{{ $fdate($r['date'] ?? null) }}</td><td>{{ $r['type'] }}</td><td>{{ $r['refund_no'] }}</td><td class="num">{{ $money($r['amount'] ?? 0) }}</td></tr>@empty<tr><td colspan="4" style="text-align:center">Rfd</td></tr>@endforelse
</tbody></table>

<div class="footer"><table><tr><td>{{ $website }}</td><td>Page <span style="display:inline-block;min-width:10px">{{ '{PAGE_NUM}' }}</span></td></tr></table></div>
</div>
@if(!empty($autoPrint))
    <script>
        window.addEventListener('load', function () {
            window.print();
        });
    </script>
@endif
</body></html>
