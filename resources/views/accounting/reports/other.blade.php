<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $report['report_title'] ?? 'Sale Report' }}</title>
    <style>
        @page { size: A4 landscape; margin: 8mm 8mm 12mm 8mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 8.5px; }
        body { background: #fff; }
        .paper { width: 100%; }
        .header { border-bottom: 1px solid #111; padding-bottom: 5px; margin-bottom: 7px; }
        .header-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .header-table td { vertical-align: top; }
        .logo-cell, .qr-cell { width: 17%; }
        .company-cell { width: 66%; text-align: center; }
        .logo { max-width: 105px; max-height: 58px; object-fit: contain; }
        .qr { width: 62px; height: 62px; object-fit: contain; }
        .company-name { font-size: 15px; font-weight: 700; }
        .tagline { font-size: 8px; margin-top: 1px; }
        .details { font-size: 6.6px; line-height: 1.3; margin-top: 2px; }
        .title { text-align: center; font-size: 14px; font-weight: 700; margin: 5px 0 2px; }
        .period { text-align: center; font-size: 8px; margin-bottom: 3px; }
        .generated { text-align: right; font-size: 7px; margin-bottom: 3px; }
        .group-title { font-size: 9px; font-weight: 700; margin: 4px 0 1px; }
        table.report { width: 100%; border-collapse: collapse; table-layout: fixed; }
        table.report th { border: 1px solid #164ea5; padding: 3px 3px; font-size: 7.2px; font-weight: 700; background: #fff; }
        table.report td { border-bottom: 1px dotted #999; padding: 2.8px 3px; vertical-align: top; font-size: 7.1px; line-height: 1.25; overflow-wrap: anywhere; }
        table.report tfoot td { border-top: 2px solid #164ea5; border-bottom: 3px double #164ea5; font-weight: 700; padding-top: 3px; }
        .num { text-align: right; white-space: nowrap; }
        .footer { position: fixed; left: 8mm; right: 8mm; bottom: 3mm; border-top: 1px solid #777; padding-top: 2px; font-size: 6.5px; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td:last-child { text-align: right; }
        .page:after { content: counter(page); }
        @media screen {
            body { background: #e5e7eb; padding: 14px; }
            .paper { max-width: 1120px; margin: 0 auto; padding: 24px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
            .footer { position: static; margin-top: 16px; }
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
    $money = static function ($value) { return number_format((float) ($value ?? 0), 2, '.', ','); };
    $dateFmt = static function ($value) { if (!$value) return '—'; try { return \Carbon\Carbon::parse($value)->format('d-M-y'); } catch (Throwable $e) { return (string) $value; } };
@endphp

<div class="paper">
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logo)
                        <img src="{{ $logo }}" class="logo" alt="HBA">
                    @else
                        <strong style="font-size:20px;">HBA</strong>
                    @endif
                </td>
                <td class="company-cell">
                    <div class="company-name">{{ $companyName }}</div>
                    @if($tagline)<div class="tagline">{{ $tagline }}</div>@endif
                    @if($address)<div class="details"><strong>Address:</strong> {{ $address }}</div>@endif
                    @if($phone || $mobile)
                        <div class="details"><strong>Phone:</strong> {{ $phone }}@if($mobile), <strong>Mobile:</strong> {{ $mobile }}@endif</div>
                    @endif
                    @if($email || $website)
                        <div class="details"><strong>E-Mail:</strong> {{ $email }}@if($website), <strong>Website:</strong> {{ $website }}@endif</div>
                    @endif
                    @if($license || $ntn)
                        <div class="details">
                            @if($license)<strong>Govt Lic No:</strong> {{ $license }}@endif
                            @if($license && $ntn), @endif
                            @if($ntn)<strong>NTN:</strong> {{ $ntn }}@endif
                        </div>
                    @endif
                </td>
                <td class="qr-cell" style="text-align:right;">
                    @if($qr)<img src="{{ $qr }}" class="qr" alt="QR">@endif
                </td>
            </tr>
        </table>
    </div>

    <div class="title">{{ $report['report_title'] ?? 'Sale Report' }}</div>
    <div class="period">From {{ $dateFmt($report['date_from'] ?? null) }} &nbsp; To {{ $dateFmt($report['date_to'] ?? null) }}</div>
    <div class="generated">Printing Date: {{ $generatedAt instanceof \Carbon\CarbonInterface ? $generatedAt->format('d/m/Y g:i:s A') : now()->format('d/m/Y g:i:s A') }}</div>

    @php
        $columns = $report['columns'] ?? [];
    @endphp

    @if(!empty($report['groups']))
        @foreach($report['groups'] as $group)
            <div class="group-title">{{ $group['title'] }}</div>
            <table class="report">
                <thead>
                    <tr>
                        @foreach($columns as $column)
                            <th>{{ $column['label'] }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach($group['rows'] as $row)
                        <tr>
                            @foreach($columns as $column)
                                @php $value = $row[$column['key']] ?? ''; @endphp
                                <td class="{{ in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true) ? 'num' : '' }}">
                                    @if(in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true))
                                        {{ $money($value) }}
                                    @else
                                        {{ $value === null || $value === '' ? '—' : $value }}
                                    @endif
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endforeach
        <table class="report" style="margin-top:3px;">
            <tfoot>
                <tr>
                    @foreach($columns as $index => $column)
                        <td class="{{ in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true) ? 'num' : '' }}">
                            @if($index === 0)
                                Total
                            @elseif(in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true))
                                {{ $money($report['totals'][$column['key']] ?? 0) }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            </tfoot>
        </table>
    @else
        <table class="report">
            <thead>
                <tr>
                    @foreach($columns as $column)
                        <th>{{ $column['label'] }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @forelse($report['rows'] ?? [] as $row)
                    <tr>
                        @foreach($columns as $column)
                            @php $value = $row[$column['key']] ?? ''; @endphp
                            <td class="{{ in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true) ? 'num' : '' }}">
                                @if(in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true))
                                    {{ $money($value) }}
                                @else
                                    {{ $value === null || $value === '' ? '—' : $value }}
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @empty
                    <tr><td colspan="{{ count($columns) }}" style="text-align:center;padding:10px;">No records found for the selected period.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    @foreach($columns as $index => $column)
                        <td class="{{ in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true) ? 'num' : '' }}">
                            @if($index === 0)
                                Total
                            @elseif(in_array($column['key'], ['receivable','payable','profit','fare','taxes'], true))
                                {{ $money($report['totals'][$column['key']] ?? 0) }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            </tfoot>
        </table>
    @endif

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>{{ $website }}</td>
                <td>Sales Report</td>
                <td>Page <span class="page"></span></td>
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
