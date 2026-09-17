<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $table = 'company_settings';

    protected $guarded = [];

    protected $casts = [
        'decimal_places' =>
            'integer',

        'show_company_header' =>
            'boolean',

        'show_address' =>
            'boolean',

        'show_phone' =>
            'boolean',

        'show_email' =>
            'boolean',

        'show_website' =>
            'boolean',

        'show_govt_license' =>
            'boolean',

        'show_ntn' =>
            'boolean',

        'show_qr' =>
            'boolean',
    ];

    public static function current(): self
    {
        return static::query()
            ->firstOrCreate(
                ['id' => 1],
                [
                    'company_name' =>
                        'HBA TRAVEL & TOURS',

                    'tagline' =>
                        'EXCELLENCE IN HOSPITALITY AND TRAVELS',

                    'base_currency_code' =>
                        'PKR',

                    'decimal_places' =>
                        2,

                    'paper_size' =>
                        'A4',

                    'print_orientation' =>
                        'portrait',
                ]
            );
    }
}