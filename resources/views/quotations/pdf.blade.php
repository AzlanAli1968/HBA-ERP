@php
    /*
    |--------------------------------------------------------------------------
    | SHARED COMPANY DOCUMENT DATA
    |--------------------------------------------------------------------------
    */
    $company = app(
        \App\Services\CompanySettingsService::class
    )->reportData();

    $meta = is_array($quoteMeta ?? null)
        ? $quoteMeta
        : [];

    $safe = static function ($value): string {
        $value = trim(
            (string) ($value ?? '')
        );

        return $value !== ''
            ? $value
            : '-';
    };

    $money = static function (
        $value,
        int $decimals = 0
    ): string {
        return number_format(
            (float) ($value ?? 0),
            $decimals,
            '.',
            ','
        );
    };


    /*
    |--------------------------------------------------------------------------
    | DATES
    |--------------------------------------------------------------------------
    */
    $quotationDate =
        $quotation->quotation_date
            ? \Carbon\Carbon::parse(
                $quotation->quotation_date
            )
            : null;

    $travelStart =
        $quotation->travel_start_date
            ? \Carbon\Carbon::parse(
                $quotation->travel_start_date
            )
            : null;

    $travelEnd =
        $quotation->travel_end_date
            ? \Carbon\Carbon::parse(
                $quotation->travel_end_date
            )
            : null;

    $validUntil =
        $quotation->valid_until
            ? \Carbon\Carbon::parse(
                $quotation->valid_until
            )
            : null;

    $durationDays =
        $meta['duration_days']
        ??
        (
            $travelStart && $travelEnd
                ? $travelStart->diffInDays(
                    $travelEnd
                ) + 1
                : null
        );


    /*
    |--------------------------------------------------------------------------
    | PASSENGERS
    |--------------------------------------------------------------------------
    */
    $adults =
        (int) (
            $quotation->adults
            ?? 0
        );

    $children =
        (int) (
            $quotation->children
            ?? 0
        );

    $infants =
        (int) (
            $quotation->infants
            ?? 0
        );

    $passengerTotal =
        $adults
        +
        $children
        +
        $infants;


    /*
    |--------------------------------------------------------------------------
    | PACKAGE CURRENCY
    |--------------------------------------------------------------------------
    */
    $packageCurrency =
        strtoupper(
            trim(
                (string) (
                    $quotation->currency_code
                    ?? 'PKR'
                )
            )
        );

    $packageCurrency =
        $packageCurrency !== ''
            ? $packageCurrency
            : 'PKR';


    /*
    |--------------------------------------------------------------------------
    | QUOTATION ITEMS
    |--------------------------------------------------------------------------
    */
    $hotelItems = collect(
        $quotation->items ?? []
    )
        ->where(
            'item_type',
            'hotel'
        )
        ->values();

    $transportItems = collect(
        $quotation->items ?? []
    )
        ->where(
            'item_type',
            'transport'
        )
        ->values();

    $visaItems = collect(
        $quotation->items ?? []
    )
        ->where(
            'item_type',
            'visa'
        )
        ->values();


    /*
    |--------------------------------------------------------------------------
    | FLIGHT
    |--------------------------------------------------------------------------
    */
    $flight =
        $quotation->flight;

    $hasFlight =
        (bool) (
            $quotation->flight_enabled
            &&
            $flight
        );


    /*
    |--------------------------------------------------------------------------
    | COMPANY BRAND ASSETS
    |--------------------------------------------------------------------------
    */
    $logo =
        !empty(
            $company['logo_data']
        )
            ? $company['logo_data']
            : (
                !empty(
                    $company['logo_url']
                )
                    ? $company['logo_url']
                    : null
            );

    $qr =
        !empty(
            $company['qr_data']
        )
            ? $company['qr_data']
            : (
                !empty(
                    $company['qr_url']
                )
                    ? $company['qr_url']
                    : null
            );


    $companyName =
        $safe(
            $company['name']
            ??
            'HBA TRAVEL & TOURS'
        );

    $tagline =
        trim(
            (string) (
                $company['tagline']
                ?? ''
            )
        );


    /*
    |--------------------------------------------------------------------------
    | COMPANY SETTINGS VISIBILITY
    |--------------------------------------------------------------------------
    */
    $showHeader =
        !array_key_exists(
            'show_company_header',
            $company
        )
        ||
        !empty(
            $company[
                'show_company_header'
            ]
        );

    $showAddress =
        !array_key_exists(
            'show_address',
            $company
        )
        ||
        !empty(
            $company[
                'show_address'
            ]
        );

    $showPhone =
        !array_key_exists(
            'show_phone',
            $company
        )
        ||
        !empty(
            $company[
                'show_phone'
            ]
        );

    $showEmail =
        !array_key_exists(
            'show_email',
            $company
        )
        ||
        !empty(
            $company[
                'show_email'
            ]
        );

    $showWebsite =
        !array_key_exists(
            'show_website',
            $company
        )
        ||
        !empty(
            $company[
                'show_website'
            ]
        );

    $showLicense =
        !array_key_exists(
            'show_govt_license',
            $company
        )
        ||
        !empty(
            $company[
                'show_govt_license'
            ]
        );

    $showNtn =
        !array_key_exists(
            'show_ntn',
            $company
        )
        ||
        !empty(
            $company[
                'show_ntn'
            ]
        );

    $showQr =
        !array_key_exists(
            'show_qr',
            $company
        )
        ||
        !empty(
            $company[
                'show_qr'
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | ONLY DOCUMENT FOOTER
    |--------------------------------------------------------------------------
    */
    $documentFooter =
        trim(
            (string) (
                $company[
                    'document_footer'
                ]
                ?? ''
            )
        );
@endphp


<!doctype html>
<html>
<head>

    <meta charset="utf-8">

    <title>
        Umrah Quotation -
        {{ $safe($quotation->quote_no) }}
    </title>


    <style>

        /*
        |--------------------------------------------------------------------------
        | PAGE
        |--------------------------------------------------------------------------
        */

        @page {
            size: A4 portrait;
            margin: 12mm 14mm 13mm 14mm;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            background: #ffffff;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #27384c;
            font-size: 9pt;
            line-height: 1.42;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .avoid-break {
            page-break-inside: avoid;
        }


        /*
        |--------------------------------------------------------------------------
        | DOCUMENT SHELL
        |--------------------------------------------------------------------------
        */

        .document-shell {
            width: 100%;
            margin: 0;
            padding: 0;
        }


        /*
        |--------------------------------------------------------------------------
        | COMPANY HEADER
        |--------------------------------------------------------------------------
        */

        .brand {
            width: 182mm;
            margin-left: auto;
            margin-right: auto;
            padding: 0 3mm 4.5mm 3mm;
            border-bottom: 1.15pt solid #173f6b;
            page-break-inside: avoid;
        }

        .brand-table {
            width: 100%;
            table-layout: fixed;
        }

        .brand-logo-cell {
            width: 36mm;
            vertical-align: middle;
        }

        .brand-main-cell {
            width: auto;
            vertical-align: middle;
            padding: 0 4mm;
        }

        .brand-qr-cell {
            width: 31mm;
            text-align: right;
            vertical-align: middle;
        }

        .brand-logo {
            display: block;
            width: 32mm;
            max-width: 32mm;
            max-height: 25mm;
        }

        .brand-qr {
            display: block;
            width: 25mm;
            max-width: 25mm;
            max-height: 25mm;
            margin-left: auto;
        }

        .company-name {
            color: #102f52;
            font-size: 16.2pt;
            line-height: 1.04;
            font-weight: 800;
            letter-spacing: .15pt;
        }

        .tagline {
            margin-top: 1.2mm;
            color: #9a742b;
            font-size: 6.9pt;
            line-height: 1.22;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .82pt;
        }

        .company-contact {
            margin-top: 1.55mm;
            color: #596a7e;
            font-size: 6.5pt;
            line-height: 1.45;
        }


        /*
        |--------------------------------------------------------------------------
        | QUOTATION HERO
        |--------------------------------------------------------------------------
        */

        .hero-wrap {
            width: 100%;
            margin: 5.5mm 0 0 0;
            padding: 0 3mm;
        }

        .hero {
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            background: #102f52;
            page-break-inside: avoid;
        }

        .hero-gold {
            height: 1.25mm;
            background: #d5a94f;
        }

        .hero-inner {
            padding: 5.8mm 6.5mm 5.2mm;
        }

        .hero-table {
            width: 100%;
            table-layout: fixed;
        }

        .hero-left {
            width: 69%;
            vertical-align: middle;
        }

        .hero-right {
            width: 31%;
            text-align: right;
            vertical-align: middle;
        }

        .hero-eyebrow {
            color: #dce7f1;
            font-size: 6.2pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.65pt;
        }

        .hero-title {
            margin-top: 1.1mm;
            color: #ffffff;
            font-size: 20pt;
            line-height: 1;
            font-weight: 900;
            letter-spacing: .15pt;
            white-space: nowrap;
        }

        .hero-package {
            margin-top: 1.8mm;
            color: #dce7f1;
            font-size: 7.5pt;
        }

        .hero-number {
            color: #ffffff;
            font-size: 9pt;
            font-weight: 900;
        }

        .hero-date {
            margin-top: .8mm;
            color: #dbe6f0;
            font-size: 6.7pt;
        }


        /*
        |--------------------------------------------------------------------------
        | OVERVIEW
        |--------------------------------------------------------------------------
        */

        .overview {
            width: 100%;
            margin-top: 4mm;
            table-layout: fixed;
        }

        .overview-cell {
            width: 25%;
            padding: 3.2mm 3.4mm;
            border: .75pt solid #d8e1ea;
            background: #fbfcfd;
            vertical-align: top;
        }

        .overview-cell + .overview-cell {
            border-left: 0;
        }

        .overview-label {
            color: #78889a;
            font-size: 6.1pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .67pt;
        }

        .overview-value {
            margin-top: .9mm;
            color: #17314f;
            font-size: 8.25pt;
            font-weight: 800;
            line-height: 1.44;
        }


        /*
        |--------------------------------------------------------------------------
        | SECTION HEADINGS
        |--------------------------------------------------------------------------
        */

        .section {
            width: 100%;
            margin-top: 5.2mm;
        }

        .section-heading {
            width: 100%;
            table-layout: fixed;
            margin-bottom: 2.7mm;
        }

        .section-title-cell {
            width: 58%;
            vertical-align: middle;
        }

        .section-title-inner {
            display: inline-block;
            padding: 1.2mm 0 1.2mm 3mm;
            border-left: 2.2pt solid #d5a94f;
        }

        .section-title-row {
            width: 100%;
        }

        .section-icon-cell {
            width: 9mm;
            vertical-align: middle;
        }

        .section-title {
            color: #102f52;
            font-size: 10pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .8pt;
        }

        .section-subtitle-cell {
            width: 42%;
            text-align: right;
            vertical-align: middle;
            padding-right: 1mm;
        }

        .section-subtitle {
            color: #8d99a8;
            font-size: 6.1pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .48pt;
        }


        /*
        |--------------------------------------------------------------------------
        | HOTEL ICON
        |--------------------------------------------------------------------------
        */

        .mini-icon-disc {
            display: inline-block;
            position: relative;
            width: 6.8mm;
            height: 6.8mm;
            border: .65pt solid #ccd9e5;
            border-radius: 50%;
            background: #f7fafc;
            vertical-align: middle;
        }

        .mini-hotel {
            position: absolute;
            left: 1.65mm;
            top: 1.55mm;
            width: 3.45mm;
            height: 3.9mm;
            border: .8pt solid #173f6b;
            border-radius: .35mm;
            background: #ffffff;
        }

        .mini-hotel:before {
            content: "";
            position: absolute;
            left: .55mm;
            top: .65mm;
            width: .62mm;
            height: .62mm;
            background: #d5a94f;
            box-shadow:
                1.05mm 0 0 #d5a94f,
                2.1mm 0 0 #d5a94f,
                0 1.02mm 0 #173f6b,
                1.05mm 1.02mm 0 #173f6b,
                2.1mm 1.02mm 0 #173f6b;
        }

        .mini-hotel:after {
            content: "";
            position: absolute;
            left: 1.28mm;
            bottom: 0;
            width: .72mm;
            height: 1.25mm;
            background: #173f6b;
        }


        /*
        |--------------------------------------------------------------------------
        | ACCOMMODATION TABLE
        |--------------------------------------------------------------------------
        */

        .hotel-wrap {
            width: 100%;
            border: .75pt solid #d4dee8;
            border-radius: 7px;
            overflow: hidden;
            background: #ffffff;
        }

        .hotel-table {
            width: 100%;
            table-layout: fixed;
        }

        .hotel-table th {
            padding: 2.9mm 2.4mm;
            background: #173f6b;
            color: #ffffff !important;
            border-right: .45pt solid #4b6c8b;
            text-align: left;
            font-size: 6.6pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .52pt;
        }

        .hotel-table th:last-child {
            border-right: 0;
        }

        .hotel-table th.hotel-number,
        .hotel-table th.hotel-sector,
        .hotel-table th.hotel-name,
        .hotel-table th.hotel-room,
        .hotel-table th.hotel-meal,
        .hotel-table th.hotel-nights,
        .hotel-table th.hotel-dates {
            color: #ffffff !important;
            background: #173f6b !important;
        }

        .hotel-table td {
            padding: 3.2mm 2.4mm;
            border-bottom: .6pt solid #e1e8ef;
            color: #35485c;
            font-size: 7.6pt;
            line-height: 1.42;
            vertical-align: middle;
        }

        .hotel-table tbody tr:last-child td {
            border-bottom: 0;
        }

        .hotel-table tbody tr:nth-child(even) td {
            background: #fbfcfd;
        }

        .hotel-number {
            width: 7%;
            text-align: center;
        }

        .hotel-sector {
            width: 14%;
            font-weight: 900;
        }

        .hotel-name {
            width: 27%;
            color: #203750 !important;
            font-weight: 900;
        }

        .hotel-room {
            width: 16%;
        }

        .hotel-meal {
            width: 10%;
            text-align: center;
        }

        .hotel-nights {
            width: 8%;
            text-align: center;
            font-weight: 900;
        }

        .hotel-dates {
            width: 18%;
            text-align: right;
        }

        .hotel-table td.hotel-number {
            color: #b2872d !important;
            font-size: 7.1pt;
            font-weight: 900;
            text-align: center;
        }

        .hotel-table td.hotel-sector {
            color: #102f52 !important;
        }

        .hotel-city {
            margin-top: .5mm;
            color: #8995a4;
            font-size: 6.25pt;
            font-weight: 400;
        }


        /*
        |--------------------------------------------------------------------------
        | TRANSPORT
        |--------------------------------------------------------------------------
        */

        .transport-panel {
            width: 100%;
            border: .8pt solid #cfdbe6;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
            page-break-inside: avoid;
        }

        .transport-head {
            padding: 4mm 4.2mm;
            background: #f3f6f9;
            border-top: 3pt solid #173f6b;
            border-bottom: .8pt solid #d8e1e9;
        }

        .transport-head-table {
            width: 100%;
            table-layout: fixed;
        }

        .transport-icon-cell {
            width: 17mm;
            vertical-align: middle;
        }

        .transport-head-content {
            width: 65%;
            vertical-align: middle;
            padding-left: 1mm;
        }

        .transport-passenger-cell {
            width: 25%;
            text-align: right;
            vertical-align: middle;
        }

        .transport-head-label {
            color: #7d8997;
            font-size: 6.1pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .75pt;
        }

        .transport-head-title {
            margin-top: 1mm;
            color: #102f52;
            font-size: 12pt;
            line-height: 1.05;
            font-weight: 900;
            white-space: nowrap;
        }

        .transport-head-meta {
            margin-top: 1mm;
            color: #647487;
            font-size: 7pt;
            font-weight: 600;
        }

        .transport-passenger-label {
            color: #8a96a4;
            font-size: 6pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .45pt;
        }

        .transport-passenger-count {
            margin-top: .8mm;
            color: #173f6b;
            font-size: 10pt;
            line-height: 1;
            font-weight: 900;
        }


        /*
        |--------------------------------------------------------------------------
        | TRANSPORT ICON
        |--------------------------------------------------------------------------
        */

        .transport-icon-disc {
            position: relative;
            display: block;
            width: 11mm;
            height: 11mm;
            border: .8pt solid #ccd9e5;
            border-radius: 50%;
            background: #ffffff;
        }

        .car-body {
            position: absolute;
            left: 2.2mm;
            top: 4.35mm;
            width: 6.3mm;
            height: 3.1mm;
            border-radius: 1mm 1mm .7mm .7mm;
            background: #173f6b;
        }

        .car-roof {
            position: absolute;
            left: 3.25mm;
            top: 2.85mm;
            width: 3.95mm;
            height: 2mm;
            background: #173f6b;
            border-radius: 1.3mm 1.3mm 0 0;
        }

        .car-wheel {
            position: absolute;
            width: 1.45mm;
            height: 1.45mm;
            border-radius: 50%;
            background: #ffffff;
            border: .38mm solid #173f6b;
            bottom: 2.15mm;
        }

        .car-wheel-left {
            left: 2.75mm;
        }

        .car-wheel-right {
            right: 2.75mm;
        }

        .car-window {
            position: absolute;
            width: 1.2mm;
            height: .95mm;
            background: #ffffff;
            top: .6mm;
        }

        .car-window-left {
            left: .8mm;
        }

        .car-window-right {
            right: .8mm;
        }


        /*
        |--------------------------------------------------------------------------
        | TRANSPORT SECTORS
        |--------------------------------------------------------------------------
        */

        .transport-list {
            width: 100%;
            table-layout: fixed;
        }

        .transport-row {
            border-bottom: .65pt solid #e0e7ed;
        }

        .transport-row:last-child {
            border-bottom: 0;
        }

        .transport-row td {
            padding: 3mm 4mm;
            vertical-align: middle;
        }

        .transport-number {
            width: 13mm;
            color: #b88928;
            font-size: 7.2pt;
            font-weight: 900;
        }

        .transport-route-main {
            color: #102f52;
            font-size: 8pt;
            line-height: 1.35;
            font-weight: 900;
            white-space: nowrap;
        }

        .transport-route-detail {
            margin-top: .55mm;
            color: #7a8999;
            font-size: 6.7pt;
        }

        .transport-to {
            display: inline-block;
            margin: 0 1.5mm;
            color: #b88928;
            font-size: 6.7pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .35pt;
        }


        /*
        |--------------------------------------------------------------------------
        | VISA
        |--------------------------------------------------------------------------
        */

        .visa-card {
            width: 100%;
            border: .75pt solid #d4dee8;
            border-radius: 7px;
            overflow: hidden;
            background: #ffffff;
            page-break-inside: avoid;
        }

        .visa-accent {
            width: 2mm;
            background: #d5a94f;
        }

        .visa-icon-area {
            width: 16mm;
            text-align: center;
            vertical-align: middle;
            background: #f5f8fb;
        }

        .visa-icon-disc {
            position: relative;
            display: inline-block;
            width: 8.5mm;
            height: 8.5mm;
            border: .7pt solid #d1dce8;
            border-radius: 50%;
            background: #ffffff;
        }

        .visa-document {
            position: absolute;
            left: 2.15mm;
            top: 1.55mm;
            width: 4mm;
            height: 5.3mm;
            border: .85pt solid #173f6b;
            border-radius: .4mm;
            background: #ffffff;
        }

        .visa-document:before {
            content: "";
            position: absolute;
            left: .55mm;
            top: .8mm;
            width: 2.55mm;
            height: .55mm;
            background: #d5a94f;
            box-shadow:
                0 1.2mm 0 #173f6b,
                0 2.4mm 0 #173f6b;
        }

        .visa-content {
            padding: 3.3mm 3.8mm;
            vertical-align: middle;
        }

        .visa-title {
            color: #102f52;
            font-size: 8.5pt;
            font-weight: 900;
        }

        .visa-detail {
            margin-top: .9mm;
            color: #65758a;
            font-size: 7.2pt;
            line-height: 1.35;
        }


        /*
        |--------------------------------------------------------------------------
        | PACKAGE PRICE
        |--------------------------------------------------------------------------
        */

        .pricing-box {
            width: 182mm;
            margin-left: auto;
            margin-right: auto;
            margin-top: 5.5mm;
            padding: 5.2mm 5.5mm;
            border: 1pt solid #d5a94f;
            border-radius: 8px;
            overflow: hidden;
            background: #102f52;
            page-break-inside: avoid;
        }

        .pricing-top-line {
            width: 31mm;
            height: 1.1pt;
            margin: 0 auto 2.1mm;
            background: #d5a94f;
        }

        .pricing-title {
            text-align: center;
            color: #ffffff;
            font-size: 11.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .95pt;
        }

        .pricing-subtitle {
            margin-top: .7mm;
            text-align: center;
            color: #dbe6f0;
            font-size: 6.7pt;
        }

        .pricing-table {
            width: 100%;
            margin: 3.8mm auto 0 auto;
            table-layout: fixed;
        }

        .pricing-cell {
            width: 33.333%;
            padding: 3.7mm 2.5mm;
            text-align: center;
            background: #ffffff;
            border-left: .45pt solid #d5dee8;
            vertical-align: middle;
        }

        .pricing-cell:first-child {
            border-left: 0;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
        }

        .pricing-cell:last-child {
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
        }

        .pricing-label {
            color: #7b899a;
            font-size: 6.35pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .45pt;
        }

        .pricing-value {
            margin-top: 1.1mm;
            color: #102f52;
            font-size: 14.5pt;
            line-height: 1.04;
            font-weight: 900;
        }


        /*
        |--------------------------------------------------------------------------
        | AIRFARE
        |--------------------------------------------------------------------------
        */

        .airfare-box {
            width: 100%;
            margin: 5mm auto 0 auto;
            border: .75pt solid #ccd8e4;
            border-radius: 7px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .airfare-header {
            padding: 3.3mm 4mm;
            background: #173f6b;
        }

        .airfare-title {
            color: #ffffff;
            font-size: 9.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .7pt;
        }

        .airfare-subtitle {
            margin-top: .6mm;
            color: #dbe6f0;
            font-size: 6.7pt;
        }

        .airfare-body {
            padding: 3.8mm;
            background: #ffffff;
        }

        .airline-info {
            width: 100%;
            table-layout: fixed;
        }

        .airline-info td {
            width: 50%;
            padding: 1mm 2mm 2.2mm 0;
            vertical-align: top;
        }

        .airline-label {
            color: #7b8999;
            font-size: 6.2pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .4pt;
        }

        .airline-value {
            margin-top: .65mm;
            color: #243a55;
            font-size: 8pt;
            font-weight: 800;
        }

        .fare-table {
            width: 100%;
            margin: 1.8mm auto 0 auto;
            table-layout: fixed;
        }

        .fare-cell {
            width: 33.333%;
            padding: 3mm 2.5mm;
            background: #f7fafc;
            border: .75pt solid #d8e1e9;
            text-align: center;
            vertical-align: middle;
        }

        .fare-cell + .fare-cell {
            border-left: 0;
        }

        .fare-label {
            color: #7b8999;
            font-size: 6.35pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .4pt;
        }

        .fare-value {
            margin-top: .75mm;
            color: #102f52;
            font-size: 10pt;
            font-weight: 900;
        }

        .airfare-note {
            margin-top: 2.8mm;
            padding: 2.5mm 3mm;
            border-left: 2.4pt solid #c62828;
            background: #fff5f5;
            color: #b42318;
            font-size: 6.8pt;
            font-weight: 900;
        }


        /*
        |--------------------------------------------------------------------------
        | FOOTER
        |--------------------------------------------------------------------------
        */

        .document-footer {
            width: 100%;
            margin: 5mm auto 0 auto;
            padding-top: 3mm;
            border-top: .75pt solid #d9e1ea;
            text-align: center;
            color: #7a8797;
            font-size: 6.25pt;
            line-height: 1.45;
            page-break-inside: avoid;
        }

        .footer-company {
            color: #102f52;
            font-weight: 900;
        }

    </style>

</head>


<body>

<div class="document-shell">


    {{-- ================================================================== --}}
    {{-- COMPANY HEADER --}}
    {{-- ================================================================== --}}

    @if($showHeader)

        <div class="brand avoid-break">

            <table class="brand-table">

                <tr>

                    <td class="brand-logo-cell">

                        @if($logo)

                            <img
                                src="{{ $logo }}"
                                class="brand-logo"
                                alt="Company Logo"
                            >

                        @endif

                    </td>


                    <td class="brand-main-cell">

                        <div class="company-name">
                            {{ $companyName }}
                        </div>


                        @if($tagline !== '')

                            <div class="tagline">
                                {{ $tagline }}
                            </div>

                        @endif


                        <div class="company-contact">

                            @if(
                                $showAddress
                                &&
                                !empty(
                                    $company['address']
                                )
                            )

                                {{ $company['address'] }}

                                <br>

                            @endif


                            @if(
                                $showPhone
                                &&
                                !empty(
                                    $company['phone']
                                )
                            )

                                Phone:
                                {{ $company['phone'] }}

                            @endif


                            @if(
                                $showPhone
                                &&
                                !empty(
                                    $company['mobile']
                                )
                            )

                                @if(
                                    !empty(
                                        $company['phone']
                                    )
                                )
                                    |
                                @endif

                                Mobile:
                                {{ $company['mobile'] }}

                            @endif


                            @if(
                                $showEmail
                                &&
                                !empty(
                                    $company['email']
                                )
                            )

                                <br>

                                E-mail:
                                {{ $company['email'] }}

                            @endif


                            @if(
                                $showWebsite
                                &&
                                !empty(
                                    $company['website']
                                )
                            )

                                @if(
                                    $showEmail
                                    &&
                                    !empty(
                                        $company['email']
                                    )
                                )
                                    |
                                @endif

                                Website:
                                {{ $company['website'] }}

                            @endif


                            @if(
                                $showLicense
                                &&
                                !empty(
                                    $company[
                                        'govt_license'
                                    ]
                                )
                            )

                                <br>

                                License:
                                {{
                                    $company[
                                        'govt_license'
                                    ]
                                }}

                            @endif


                            @if(
                                $showNtn
                                &&
                                !empty(
                                    $company['ntn']
                                )
                            )

                                @if(
                                    $showLicense
                                    &&
                                    !empty(
                                        $company[
                                            'govt_license'
                                        ]
                                    )
                                )
                                    |
                                @endif

                                NTN:
                                {{ $company['ntn'] }}

                            @endif

                        </div>

                    </td>


                    <td class="brand-qr-cell">

                        @if(
                            $showQr
                            &&
                            $qr
                        )

                            <img
                                src="{{ $qr }}"
                                class="brand-qr"
                                alt="QR"
                            >

                        @endif

                    </td>

                </tr>

            </table>

        </div>

    @endif


    {{-- ================================================================== --}}
    {{-- QUOTATION HERO --}}
    {{-- ================================================================== --}}

    <div class="hero-wrap">

        <div class="hero">

            <div class="hero-gold"></div>

            <div class="hero-inner">

                <table class="hero-table">

                    <tr>

                        <td class="hero-left">

                            <div class="hero-eyebrow">
                                HBA Travel & Tours
                            </div>

                            <div class="hero-title">
                                UMRAH QUOTATION
                            </div>

                            <div class="hero-package">

                                {{
                                    $safe(
                                        $quotation->package_name
                                        ?:
                                        $quotation->title
                                        ?:
                                        'Umrah Package'
                                    )
                                }}

                            </div>

                        </td>


                        <td class="hero-right">

                            <div class="hero-number">

                                {{
                                    $safe(
                                        $quotation->quote_no
                                    )
                                }}

                            </div>


                            @if($quotationDate)

                                <div class="hero-date">

                                    Issued:
                                    {{
                                        $quotationDate->format(
                                            'd M Y'
                                        )
                                    }}

                                </div>

                            @endif


                            @if($validUntil)

                                <div class="hero-date">

                                    Valid until:
                                    {{
                                        $validUntil->format(
                                            'd M Y'
                                        )
                                    }}

                                </div>

                            @endif

                        </td>

                    </tr>

                </table>

            </div>

        </div>

    </div>


    {{-- ================================================================== --}}
    {{-- OVERVIEW --}}
    {{-- ================================================================== --}}

    <table class="overview avoid-break">

        <tr>

            <td class="overview-cell">

                <div class="overview-label">
                    Main Guest
                </div>

                <div class="overview-value">

                    {{
                        $safe(
                            $meta[
                                'main_guest_name'
                            ]
                            ?? ''
                        )
                    }}

                </div>

            </td>


            <td class="overview-cell">

                <div class="overview-label">
                    Passengers
                </div>

                <div class="overview-value">

                    {{ $adults }}
                    Adult{{ $adults === 1 ? '' : 's' }}

                    @if($children > 0)

                        <br>

                        {{ $children }}
                        Child{{ $children === 1 ? '' : 'ren' }}

                    @endif

                    @if($infants > 0)

                        <br>

                        {{ $infants }}
                        Infant{{ $infants === 1 ? '' : 's' }}

                    @endif

                </div>

            </td>


            <td class="overview-cell">

                <div class="overview-label">
                    Travel Dates
                </div>

                <div class="overview-value">

                    @if($travelStart)

                        {{
                            $travelStart->format(
                                'd M Y'
                            )
                        }}

                    @else
                        -
                    @endif

                    <br>

                    @if($travelEnd)

                        {{
                            $travelEnd->format(
                                'd M Y'
                            )
                        }}

                    @else
                        -
                    @endif

                </div>

            </td>


            <td class="overview-cell">

                <div class="overview-label">
                    Duration
                </div>

                <div class="overview-value">

                    {{
                        $durationDays !== null
                            ? $durationDays . ' Days'
                            : '-'
                    }}

                </div>

            </td>

        </tr>

    </table>


    {{-- ================================================================== --}}
    {{-- ACCOMMODATION --}}
    {{-- ================================================================== --}}

    @if(
        $hotelItems->count() > 0
    )

        <div class="section">

            <table class="section-heading">

                <tr>

                    <td class="section-title-cell">

                        <div class="section-title-inner">

                            <table class="section-title-row">

                                <tr>

                                    <td class="section-icon-cell">

                                        <span class="mini-icon-disc">
                                            <span class="mini-hotel"></span>
                                        </span>

                                    </td>

                                    <td>

                                        <div class="section-title">
                                            Accommodation
                                        </div>

                                    </td>

                                </tr>

                            </table>

                        </div>

                    </td>


                    <td class="section-subtitle-cell">

                        <div class="section-subtitle">
                            Hotel arrangements
                        </div>

                    </td>

                </tr>

            </table>


            <div class="hotel-wrap">

                <table class="hotel-table">

                    <thead>

                        <tr>

                            <th class="hotel-number">
                                No.
                            </th>

                            <th class="hotel-sector">
                                Sector
                            </th>

                            <th class="hotel-name">
                                Hotel
                            </th>

                            <th class="hotel-room">
                                Room
                            </th>

                            <th class="hotel-meal">
                                Meal
                            </th>

                            <th class="hotel-nights">
                                Nights
                            </th>

                            <th class="hotel-dates">
                                Stay
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        @foreach(
                            $hotelItems as $index => $item
                        )

                            <tr>

                                <td class="hotel-number">

                                    {{
                                        str_pad(
                                            (string) (
                                                $index + 1
                                            ),
                                            2,
                                            '0',
                                            STR_PAD_LEFT
                                        )
                                    }}

                                </td>


                                <td class="hotel-sector">

                                    {{
                                        $safe(
                                            $item->section
                                        )
                                    }}

                                </td>


                                <td class="hotel-name">

                                    {{
                                        $safe(
                                            data_get(
                                                $item->metadata_json,
                                                'hotel_name_snapshot'
                                            )
                                            ??
                                            $item->title
                                        )
                                    }}


                                    @if(
                                        trim(
                                            (string) (
                                                $item->city
                                                ?? ''
                                            )
                                        ) !== ''
                                    )

                                        <div class="hotel-city">

                                            {{
                                                $item->city
                                            }}

                                        </div>

                                    @endif

                                </td>


                                <td class="hotel-room">

                                    {{
                                        $safe(
                                            $item->room_type
                                        )
                                    }}

                                </td>


                                <td class="hotel-meal">

                                    {{
                                        $safe(
                                            $item->meal
                                        )
                                    }}

                                </td>


                                <td class="hotel-nights">

                                    {{
                                        (int) (
                                            $item->nights
                                            ?? 0
                                        )
                                    }}

                                </td>


                                <td class="hotel-dates">

                                    @if(
                                        $item->check_in
                                    )

                                        {{
                                            \Carbon\Carbon::parse(
                                                $item->check_in
                                            )->format(
                                                'd M Y'
                                            )
                                        }}

                                    @else
                                        -
                                    @endif

                                    <br>

                                    @if(
                                        $item->check_out
                                    )

                                        {{
                                            \Carbon\Carbon::parse(
                                                $item->check_out
                                            )->format(
                                                'd M Y'
                                            )
                                        }}

                                    @else
                                        -
                                    @endif

                                </td>

                            </tr>

                        @endforeach

                    </tbody>

                </table>

            </div>

        </div>

    @endif


    {{-- ================================================================== --}}
    {{-- TRANSPORT --}}
    {{-- ================================================================== --}}

    @if(
        $transportItems->count() > 0
    )

        <div class="section">

            <table class="section-heading">

                <tr>

                    <td class="section-title-cell">

                        <div class="section-title-inner">

                            <div class="section-title">
                                Transport
                            </div>

                        </div>

                    </td>


                    <td class="section-subtitle-cell">

                        <div class="section-subtitle">
                            Ground arrangements
                        </div>

                    </td>

                </tr>

            </table>


            @php

                $firstTransport =
                    $transportItems->first();

                $selectedVehicleName =
                    trim(
                        (string) (
                            data_get(
                                $firstTransport?->metadata_json,
                                'vehicle_name_snapshot'
                            )
                            ??
                            ''
                        )
                    );

                if (
                    $selectedVehicleName === ''
                ) {
                    $selectedVehicleName =
                        'Transportation arrangement';
                }

            @endphp


            <div class="transport-panel">

                <div class="transport-head">

                    <table class="transport-head-table">

                        <tr>

                            <td class="transport-icon-cell">

                                <span class="transport-icon-disc">

                                    <span class="car-roof">

                                        <span
                                            class="car-window car-window-left"
                                        ></span>

                                        <span
                                            class="car-window car-window-right"
                                        ></span>

                                    </span>

                                    <span class="car-body"></span>

                                    <span
                                        class="car-wheel car-wheel-left"
                                    ></span>

                                    <span
                                        class="car-wheel car-wheel-right"
                                    ></span>

                                </span>

                            </td>


                            <td class="transport-head-content">

                                <div class="transport-head-label">
                                    Vehicle & Ground Transport
                                </div>

                                <div class="transport-head-title">

                                    {{
                                        $selectedVehicleName
                                    }}

                                </div>

                                <div class="transport-head-meta">
                                    Selected for the complete transport itinerary
                                </div>

                            </td>


                            <td class="transport-passenger-cell">

                                <div class="transport-passenger-label">
                                    Passengers
                                </div>

                                <div class="transport-passenger-count">

                                    {{
                                        $passengerTotal
                                    }}

                                </div>

                            </td>

                        </tr>

                    </table>

                </div>


                <table class="transport-list">

                    <tbody>

                        @foreach(
                            $transportItems as $index => $item
                        )

                            @php

                                $from =
                                    trim(
                                        (string) (
                                            $item->from_location_name
                                            ?? ''
                                        )
                                    );

                                $to =
                                    trim(
                                        (string) (
                                            $item->to_location_name
                                            ?? ''
                                        )
                                    );

                                $fallbackRoute =
                                    trim(
                                        (string) (
                                            $item->title
                                            ?? ''
                                        )
                                    );

                                $fallbackRoute =
                                    preg_replace(
                                        '/\s*\?\s*/',
                                        ' TO ',
                                        $fallbackRoute
                                    );

                                $fallbackRoute =
                                    preg_replace(
                                        '/\s+/',
                                        ' ',
                                        $fallbackRoute
                                    );

                            @endphp


                            <tr class="transport-row">

                                <td class="transport-number">

                                    {{
                                        str_pad(
                                            (string) (
                                                $index + 1
                                            ),
                                            2,
                                            '0',
                                            STR_PAD_LEFT
                                        )
                                    }}

                                </td>


                                <td>

                                    <div class="transport-route-main">

                                        @if(
                                            $from !== ''
                                            ||
                                            $to !== ''
                                        )

                                            {{
                                                $from !== ''
                                                    ? $from
                                                    : '-'
                                            }}

                                            <span class="transport-to">
                                                TO
                                            </span>

                                            {{
                                                $to !== ''
                                                    ? $to
                                                    : '-'
                                            }}

                                        @else

                                            {{
                                                $fallbackRoute
                                            }}

                                        @endif

                                    </div>


                                    @if(
                                        trim(
                                            (string) (
                                                $item->description
                                                ?? ''
                                            )
                                        ) !== ''
                                    )

                                        <div class="transport-route-detail">

                                            {{
                                                $item->description
                                            }}

                                        </div>

                                    @endif

                                </td>

                            </tr>

                        @endforeach

                    </tbody>

                </table>

            </div>

        </div>

    @endif


    {{-- ================================================================== --}}
    {{-- VISA --}}
    {{-- ================================================================== --}}

    @if(
        $visaItems->count() > 0
    )

        <div class="section">

            <table class="section-heading">

                <tr>

                    <td class="section-title-cell">

                        <div class="section-title-inner">

                            <div class="section-title">
                                Visa
                            </div>

                        </div>

                    </td>


                    <td class="section-subtitle-cell">

                        <div class="section-subtitle">
                            Visa arrangement
                        </div>

                    </td>

                </tr>

            </table>


            @foreach(
                $visaItems as $item
            )

                @php

                    $visaPassengers =
                        (int) (
                            $item->quantity
                            ??
                            $passengerTotal
                        );

                    $visaDuration =
                        (int) (
                            data_get(
                                $item->metadata_json,
                                'duration_days'
                            )
                            ??
                            $durationDays
                            ??
                            0
                        );

                    $visaPassengerLabel =
                        $visaPassengers === 1
                            ? 'passenger'
                            : 'passengers';

                    $visaDayLabel =
                        $visaDuration === 1
                            ? 'day'
                            : 'days';

                @endphp


                <div class="visa-card avoid-break">

                    <table>

                        <tr>

                            <td class="visa-accent">
                            </td>


                            <td class="visa-icon-area">

                                <span class="visa-icon-disc">

                                    <span class="visa-document"></span>

                                </span>

                            </td>


                            <td class="visa-content">

                                <div class="visa-title">

                                    {{
                                        $safe(
                                            data_get(
                                                $item->metadata_json,
                                                'visa_name_snapshot'
                                            )
                                            ??
                                            $item->title
                                        )
                                    }}

                                </div>


                                <div class="visa-detail">

                                    {{
                                        $visaPassengers
                                    }}
                                    {{
                                        $visaPassengerLabel
                                    }}

                                    &nbsp;&nbsp;

                                    <span
                                        style="
                                            color:#d5a94f;
                                            font-weight:900;
                                        "
                                    >
                                        |
                                    </span>

                                    &nbsp;&nbsp;

                                    {{
                                        $visaDuration
                                    }}
                                    {{
                                        $visaDayLabel
                                    }}

                                </div>

                            </td>

                        </tr>

                    </table>

                </div>

            @endforeach

        </div>

    @endif


    {{-- ================================================================== --}}
    {{-- PACKAGE PRICE --}}
    {{-- ================================================================== --}}

    <div class="pricing-box avoid-break">

        <div class="pricing-top-line"></div>

        <div class="pricing-title">
            Package Price
        </div>

        <div class="pricing-subtitle">
            Final price per person
        </div>


        <table class="pricing-table">

            <tr>

                <td class="pricing-cell">

                    <div class="pricing-label">
                        Adult
                    </div>

                    <div class="pricing-value">

                        {{
                            $packageCurrency
                        }}

                        {{
                            $money(
                                $quotation->package_per_adult
                            )
                        }}

                    </div>

                </td>


                @if(
                    $children > 0
                )

                    <td class="pricing-cell">

                        <div class="pricing-label">
                            Child
                        </div>

                        <div class="pricing-value">

                            {{
                                $packageCurrency
                            }}

                            {{
                                $money(
                                    $quotation->package_per_child
                                )
                            }}

                        </div>

                    </td>

                @else

                    <td class="pricing-cell">

                        <div class="pricing-label">
                            Passengers
                        </div>

                        <div class="pricing-value">

                            {{
                                $passengerTotal
                            }}

                        </div>

                    </td>

                @endif


                @if(
                    $infants > 0
                )

                    <td class="pricing-cell">

                        <div class="pricing-label">
                            Infant
                        </div>

                        <div class="pricing-value">

                            {{
                                $packageCurrency
                            }}

                            {{
                                $money(
                                    $quotation->package_per_infant
                                )
                            }}

                        </div>

                    </td>

                @else

                    <td class="pricing-cell">

                        <div class="pricing-label">
                            Duration
                        </div>

                        <div class="pricing-value">

                            {{
                                $durationDays
                                ??
                                '-'
                            }}

                            <span
                                style="
                                    font-size:6.6pt;
                                    font-weight:700;
                                "
                            >
                                Days
                            </span>

                        </div>

                    </td>

                @endif

            </tr>

        </table>

    </div>


    {{-- ================================================================== --}}
    {{-- AIRFARE --}}
    {{-- ================================================================== --}}

    @if($hasFlight)

        <div class="airfare-box avoid-break">

            <div class="airfare-header">

                <div class="airfare-title">
                    Airfare
                </div>

                <div class="airfare-subtitle">
                    Airfare is separate from the package price.
                </div>

            </div>


            <div class="airfare-body">

                <table class="airline-info">

                    <tr>

                        <td>

                            <div class="airline-label">
                                Airline
                            </div>

                            <div class="airline-value">

                                {{
                                    $safe(
                                        $flight->airline_name
                                    )
                                }}

                            </div>

                        </td>


                        <td>

                            <div class="airline-label">
                                Sector / Route
                            </div>

                            <div class="airline-value">

                                {{
                                    $safe(
                                        $flight->route
                                    )
                                }}

                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td>

                            <div class="airline-label">
                                Departure
                            </div>

                            <div class="airline-value">

                                @if(
                                    $flight->departure_date
                                )

                                    {{
                                        \Carbon\Carbon::parse(
                                            $flight->departure_date
                                        )->format(
                                            'd M Y'
                                        )
                                    }}

                                @else
                                    -
                                @endif

                            </div>

                        </td>


                        <td>

                            <div class="airline-label">
                                Return
                            </div>

                            <div class="airline-value">

                                @if(
                                    $flight->return_date
                                )

                                    {{
                                        \Carbon\Carbon::parse(
                                            $flight->return_date
                                        )->format(
                                            'd M Y'
                                        )
                                    }}

                                @else
                                    -
                                @endif

                            </div>

                        </td>

                    </tr>

                </table>


                <table class="fare-table">

                    <tr>

                        <td class="fare-cell">

                            <div class="fare-label">
                                Adult Fare
                            </div>

                            <div class="fare-value">

                                {{
                                    strtoupper(
                                        $flight->currency_code
                                        ?: 'PKR'
                                    )
                                }}

                                {{
                                    $money(
                                        $flight->adult_fare
                                    )
                                }}

                            </div>

                        </td>


                        <td class="fare-cell">

                            @if(
                                $children > 0
                            )

                                <div class="fare-label">
                                    Child Fare
                                </div>

                                <div class="fare-value">

                                    {{
                                        strtoupper(
                                            $flight->currency_code
                                            ?: 'PKR'
                                        )
                                    }}

                                    {{
                                        $money(
                                            $flight->child_fare
                                        )
                                    }}

                                </div>

                            @else

                                <div class="fare-label">
                                    Child
                                </div>

                                <div class="fare-value">
                                    -
                                </div>

                            @endif

                        </td>


                        <td class="fare-cell">

                            @if(
                                $infants > 0
                            )

                                <div class="fare-label">
                                    Infant Fare
                                </div>

                                <div class="fare-value">

                                    {{
                                        strtoupper(
                                            $flight->currency_code
                                            ?: 'PKR'
                                        )
                                    }}

                                    {{
                                        $money(
                                            $flight->infant_fare
                                        )
                                    }}

                                </div>

                            @else

                                <div class="fare-label">
                                    Infant
                                </div>

                                <div class="fare-value">
                                    -
                                </div>

                            @endif

                        </td>

                    </tr>

                </table>


                @if(
                    trim(
                        (string) (
                            $flight->flight_details
                            ?? ''
                        )
                    ) !== ''
                )

                    <div
                        style="
                            margin-top:2.5mm;
                            padding:2.5mm 3mm;
                            border:.7pt solid #dce4ec;
                            border-radius:5px;
                            background:#f8fafc;
                            color:#607084;
                            font-size:6.7pt;
                            line-height:1.4;
                        "
                    >

                        {{
                            $flight->flight_details
                        }}

                    </div>

                @endif


                <div class="airfare-note">
                    Airfare is subject to market change.
                </div>

            </div>

        </div>

    @endif


    {{-- ================================================================== --}}
    {{-- COMPANY FOOTER --}}
    {{-- ================================================================== --}}

    @if(
        $documentFooter !== ''
    )

        <div class="document-footer">

            <span class="footer-company">
                {{
                    $companyName
                }}
            </span>

            <br>

            {{
                $documentFooter
            }}

        </div>

    @endif

</div>

</body>
</html>