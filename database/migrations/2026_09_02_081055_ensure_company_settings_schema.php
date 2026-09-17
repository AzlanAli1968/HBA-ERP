<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * The table already exists in your database, but it was
         * created with an older/incomplete schema.
         *
         * Add every required column without destroying existing
         * settings data.
         */

        $columns = [
            'company_name' => function (Blueprint $table) {
                $table->string(
                    'company_name',
                    255
                )->default(
                    'HBA TRAVEL & TOURS'
                );
            },

            'tagline' => function (Blueprint $table) {
                $table->string(
                    'tagline',
                    255
                )->nullable();
            },

            'address' => function (Blueprint $table) {
                $table->text(
                    'address'
                )->nullable();
            },

            'city' => function (Blueprint $table) {
                $table->string(
                    'city',
                    100
                )->nullable();
            },

            'phone' => function (Blueprint $table) {
                $table->string(
                    'phone',
                    100
                )->nullable();
            },

            'mobile' => function (Blueprint $table) {
                $table->string(
                    'mobile',
                    100
                )->nullable();
            },

            'phone_2' => function (Blueprint $table) {
                $table->string(
                    'phone_2',
                    100
                )->nullable();
            },

            'fax' => function (Blueprint $table) {
                $table->string(
                    'fax',
                    100
                )->nullable();
            },

            'email' => function (Blueprint $table) {
                $table->string(
                    'email',
                    255
                )->nullable();
            },

            'website' => function (Blueprint $table) {
                $table->string(
                    'website',
                    255
                )->nullable();
            },

            'govt_license' => function (Blueprint $table) {
                $table->string(
                    'govt_license',
                    100
                )->nullable();
            },

            'ntn' => function (Blueprint $table) {
                $table->string(
                    'ntn',
                    100
                )->nullable();
            },

            'iata_no' => function (Blueprint $table) {
                $table->string(
                    'iata_no',
                    100
                )->nullable();
            },

            'accounts_manager' => function (Blueprint $table) {
                $table->string(
                    'accounts_manager',
                    255
                )->nullable();
            },

            'base_currency_code' => function (Blueprint $table) {
                $table->string(
                    'base_currency_code',
                    10
                )->default(
                    'PKR'
                );
            },

            'date_format' => function (Blueprint $table) {
                $table->string(
                    'date_format',
                    30
                )->default(
                    'dd-MMM-yyyy'
                );
            },

            'decimal_places' => function (Blueprint $table) {
                $table->unsignedTinyInteger(
                    'decimal_places'
                )->default(
                    2
                );
            },

            'paper_size' => function (Blueprint $table) {
                $table->string(
                    'paper_size',
                    20
                )->default(
                    'A4'
                );
            },

            'print_orientation' => function (Blueprint $table) {
                $table->string(
                    'print_orientation',
                    20
                )->default(
                    'portrait'
                );
            },

            'show_company_header' => function (Blueprint $table) {
                $table->boolean(
                    'show_company_header'
                )->default(
                    true
                );
            },

            'show_address' => function (Blueprint $table) {
                $table->boolean(
                    'show_address'
                )->default(
                    true
                );
            },

            'show_phone' => function (Blueprint $table) {
                $table->boolean(
                    'show_phone'
                )->default(
                    true
                );
            },

            'show_email' => function (Blueprint $table) {
                $table->boolean(
                    'show_email'
                )->default(
                    true
                );
            },

            'show_website' => function (Blueprint $table) {
                $table->boolean(
                    'show_website'
                )->default(
                    true
                );
            },

            'show_govt_license' => function (Blueprint $table) {
                $table->boolean(
                    'show_govt_license'
                )->default(
                    true
                );
            },

            'show_ntn' => function (Blueprint $table) {
                $table->boolean(
                    'show_ntn'
                )->default(
                    true
                );
            },

            'show_qr' => function (Blueprint $table) {
                $table->boolean(
                    'show_qr'
                )->default(
                    true
                );
            },

            'logo_path' => function (Blueprint $table) {
                $table->string(
                    'logo_path'
                )->nullable();
            },

            'qr_code_path' => function (Blueprint $table) {
                $table->string(
                    'qr_code_path'
                )->nullable();
            },

            'created_at' => function (Blueprint $table) {
                $table->timestamp(
                    'created_at'
                )->nullable();
            },

            'updated_at' => function (Blueprint $table) {
                $table->timestamp(
                    'updated_at'
                )->nullable();
            },
        ];

        foreach (
            $columns as $column => $definition
        ) {
            if (
                ! Schema::hasColumn(
                    'company_settings',
                    $column
                )
            ) {
                Schema::table(
                    'company_settings',
                    $definition
                );
            }
        }

        /*
         * Ensure a settings record exists.
         */
        $exists =
            DB::table(
                'company_settings'
            )
                ->where(
                    'id',
                    1
                )
                ->exists();

        if (
            ! $exists
        ) {
            DB::table(
                'company_settings'
            )->insert([
                'id' =>
                    1,

                'company_name' =>
                    'HBA TRAVEL & TOURS',

                'tagline' =>
                    'EXCELLENCE IN HOSPITALITY AND TRAVELS',

                'address' =>
                    'Office No. 302, 3rd Floor, Lane 3, 16c Khayaban-e-Rahat, D.H.A Phase 6, Rahat Commercial Area Karachi, Pakistan',

                'city' =>
                    'Karachi',

                'phone' =>
                    '+92 332 6873756',

                'mobile' =>
                    '+92 300 3349314',

                'email' =>
                    'info@hbatravels.org',

                'website' =>
                    'www.hbatravels.org',

                'govt_license' =>
                    '5979',

                'ntn' =>
                    'D944343',

                'base_currency_code' =>
                    'PKR',

                'date_format' =>
                    'dd-MMM-yyyy',

                'decimal_places' =>
                    2,

                'paper_size' =>
                    'A4',

                'print_orientation' =>
                    'portrait',

                'show_company_header' =>
                    true,

                'show_address' =>
                    true,

                'show_phone' =>
                    true,

                'show_email' =>
                    true,

                'show_website' =>
                    true,

                'show_govt_license' =>
                    true,

                'show_ntn' =>
                    true,

                'show_qr' =>
                    true,

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ]);
        }
    }

    public function down(): void
    {
        /*
         * Do not drop the table here.
         *
         * This migration is an upgrade/fix migration for an
         * existing company_settings table.
         */
    }
};