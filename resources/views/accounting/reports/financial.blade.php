<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $report['report_title'] ?? 'Financial Report' }}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 9mm 14mm 9mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 9px; }
        body { background: #fff; }
        .paper { width: 100%; }
        .header { border-bottom: 1px solid #111; padding-bottom: 8px; margin-bottom: 8px; }
        .header-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .header-table td { vertical-align: top; }
        .logo-cell { width: 18%; }
        .company-cell { width: 64%; text-align: center; }
        .qr-cell { width: 18%; text-align: right; }
        .logo { max-width: 105px; max-height: 65px; object-fit: contain; }
        .qr { width: 70px; height: 70px; object-fit: contain; }
        .company-name { font-size: 18px; font-weight: 700; }
        .tagline { font-size: 9px; margin-top: 2px; }
        .details { font-size: 7px; line-height: 1.35; margin-top: 3px; }
        .title { text-align: center; font-size: 16px; font-weight: 700; margin: 8px 0 2px; }
        .period { text-align: center; font-size: 9px; margin-bottom: 7px; }
        .generated { text-align: right; font-size: 8px; margin-bottom: 4px; }
        .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .report-table th { border: 1px solid #164ea5; padding: 4px 5px; font-size: 8px; font-weight: 700; }
        .report-table td { padding: 4px 5px; border-bottom: 1px dotted #888; vertical-align: top; font-size: 8px; }
        .col-code { width: 17%; }
        .col-name { width: 63%; }
        .col-amount { width: 20%; text-align: right; }
        .section-title { font-size: 11px; font-weight: 700; padding-top: 8px; padding-bottom: 3px; }
        .group-title { color: #164ea5; font-size: 9px; padding: 2px 5px 4px; }
        .total-row td { border-top: 1px solid #164ea5; border-bottom: 0; font-weight: 700; }
        .grand-total { border-top: 3px double #164ea5; margin-top: 8px; padding-top: 5px; text-align: right; font-size: 11px; font-weight: 700; }
        .final-row { text-align: right; margin-top: 8px; font-size: 13px; font-weight: 700; }
        .generic-table th:nth-child(1) { width: 16%; }
        .generic-table th:nth-child(2) { width: 39%; }
        .generic-table th:nth-child(3), .generic-table th:nth-child(4), .generic-table th:nth-child(5), .generic-table th:nth-child(6) { width: 11.25%; }
        .num { text-align: right; white-space: nowrap; }
        .footer { position: fixed; left: 9mm; right: 9mm; bottom: 4mm; border-top: 1px solid #888; padding-top: 3px; font-size: 7px; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td:last-child { text-align: right; }
        .page-number:after { content: counter(page); }
        @media screen {
            body { background: #e5e7eb; padding: 18px; }
            .paper { max-width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; padding: 32px; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
            .footer { position: static; margin-top: 24px; }
        }
    </style>
</head>
<body>
@php
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
    $fmt = static function ($value) { $n = (float) ($value ?? 0); return $n < 0 ? '(' . number_format(abs($n), 2, '.', ',') . ')' : number_format($n, 2, '.', ','); };
    $dateFmt = static function ($value) { if (!$value) return '—'; try { return \Carbon\Carbon::parse($value)->format('d/M/Y'); } catch (Throwable $e) { return (string) $value; } };
@endphp

<div class="paper">
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logo)
                        <img src="{{ $logo }}" class="logo" alt="HBA">
                    @else
                        <strong style="font-size:24px">HBA</strong>
                    @endif
                </td>
                <td class="company-cell">
                    <div class="company-name">{{ $companyName }}</div>
                    @if($tagline)<div class="tagline">{{ $tagline }}</div>@endif
                    @if($address)<div class="details"><strong>Address:</strong> {{ $address }}</div>@endif
                    @if($phone || $mobile)
                        <div class="details">
                            <strong>Phone:</strong> {{ $phone }}
                            @if($mobile), <strong>Mobile:</strong> {{ $mobile }}@endif
                        </div>
                    @endif
                    @if($email || $website)
                        <div class="details">
                            <strong>E-Mail:</strong> {{ $email }}
                            @if($website), <strong>Website:</strong> {{ $website }}@endif
                        </div>
                    @endif
                    @if($license || $ntn)
                        <div class="details">
                            @if($license)<strong>Govt Lic No:</strong> {{ $license }}@endif
                            @if($license && $ntn), @endif
                            @if($ntn)<strong>NTN:</strong> {{ $ntn }}@endif
                        </div>
                    @endif
                </td>
                <td class="qr-cell">
                    @if($qr)<img src="{{ $qr }}" class="qr" alt="QR">@endif
                </td>
            </tr>
        </table>
    </div>

    <div class="title">{{ $report['report_title'] ?? 'Financial Report' }}</div>
    <div class="period">From {{ $dateFmt($report['date_from'] ?? null) }} &nbsp; To {{ $dateFmt($report['date_to'] ?? null) }}</div>
    <div class="generated">Printing Date: {{ $generatedAt instanceof \Carbon\CarbonInterface ? $generatedAt->format('d/m/Y g:i:s A') : now()->format('d/m/Y g:i:s A') }}</div>

    @if(($report['report_type'] ?? '') === 'Profit & Loss')
        @foreach($report['sections'] ?? [] as $section)
            <div class="section-title">{{ strtoupper($section['title']) }}</div>
            @foreach($section['groups'] ?? [] as $group)
                <div class="group-title">{{ $group['title'] }}</div>
                <table class="report-table">
                    <tbody>
                        @foreach($group['rows'] ?? [] as $row)
                            <tr>
                                <td class="col-code">{{ $row['code'] }}</td>
                                <td class="col-name">{{ $row['name'] }}</td>
                                <td class="col-amount">{{ $fmt($row['amount'] ?? 0) }}</td>
                            </tr>
                        @endforeach
                        @if($group['total'] !== null)
                            <tr class="total-row">
                                <td colspan="2" style="text-align:right">{{ $group['total_label'] }}</td>
                                <td class="col-amount">{{ $fmt($group['total']) }}</td>
                            </tr>
                        @endif
                    </tbody>
                </table>
            @endforeach
        @endforeach
        <div class="final-row">
            {{ ((float)($report['net_profit_loss'] ?? 0)) < 0 ? '(' . number_format(abs((float)$report['net_profit_loss']), 2, '.', ',') . ')' : number_format((float)($report['net_profit_loss'] ?? 0), 2, '.', ',') }}
        </div>
    @elseif(($report['report_type'] ?? '') === 'Balance Sheet')
        @foreach($report['sections'] ?? [] as $section)
            <div class="section-title">{{ $section['title'] }}</div>
            <table class="report-table">
                <thead>
                    <tr><th class="col-code">Account Code</th><th class="col-name">Account Name</th><th class="col-amount">Balance</th></tr>
                </thead>
                <tbody>
                    @foreach($section['rows'] ?? [] as $row)
                        <tr>
                            <td>{{ $row['code'] }}</td>
                            <td>{{ $row['name'] }}</td>
                            <td class="num">{{ $fmt($row['balance'] ?? 0) }}</td>
                        </tr>
                    @endforeach
                    <tr class="total-row"><td colspan="2" style="text-align:right">Total {{ ucfirst(strtolower($section['title'])) }}</td><td class="num">{{ $fmt($section['total'] ?? 0) }}</td></tr>
                </tbody>
            </table>
        @endforeach
    @else
        <table class="report-table generic-table">
            <thead>
                <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Period Amount</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                @forelse($report['rows'] ?? [] as $row)
                    <tr>
                        <td>{{ $row['code'] }}</td>
                        <td>{{ $row['name'] }}</td>
                        <td class="num">{{ $fmt($row['debit'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($row['credit'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($row['period_amount'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($row['balance'] ?? 0) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="6" style="text-align:center;padding:12px">No records found for the selected period.</td></tr>
                @endforelse
                @if(!empty($report['totals']))
                    <tr class="total-row">
                        <td colspan="2" style="text-align:right">Total:</td>
                        <td class="num">{{ $fmt($report['totals']['debit'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($report['totals']['credit'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($report['totals']['period_amount'] ?? 0) }}</td>
                        <td class="num">{{ $fmt($report['totals']['balance'] ?? 0) }}</td>
                    </tr>
                @endif
            </tbody>
        </table>
    @endif

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>{{ $website }}</td>
                <td>Page <span class="page-number"></span></td>
            </tr>
        </table>
    </div>
</div>

@if(!empty($autoPrint))
<script>
    window.addEventListener('load', function () { window.print(); });
</script>
@endif
</body>
</html>
