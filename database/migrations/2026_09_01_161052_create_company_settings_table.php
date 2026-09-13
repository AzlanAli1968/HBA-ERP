<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'company_settings',
            function (Blueprint $table) {
                $table->id();

                /*
                 * Company identity
                 */
                $table->string(
                    'company_name',
                    255
                )->default(
                    'HBA TRAVEL & TOURS'
                );

                $table->string(
                    'tagline',
                    255
                )->nullable();

                $table->text(
                    'address'
                )->nullable();

                $table->string(
                    'city',
                    100
                )->nullable();

                $table->string(
                    'phone',
                    100
                )->nullable();

                $table->string(
                    'mobile',
                    100
                )->nullable();

                $table->string(
                    'phone_2',
                    100
                )->nullable();

                $table->string(
                    'fax',
                    100
                )->nullable();

                $table->string(
                    'email',
                    255
                )->nullable();

                $table->string(
                    'website',
                    255
                )->nullable();

                $table->string(
                    'govt_license',
                    100
                )->nullable();

                $table->string(
                    'ntn',
                    100
                )->nullable();

                $table->string(
                    'iata_no',
                    100
                )->nullable();

                $table->string(
                    'accounts_manager',
                    255
                )->nullable();

                /*
                 * Accounting/report defaults
                 */
                $table->string(
                    'base_currency_code',
                    10
                )->default(
                    'PKR'
                );

                $table->string(
                    'date_format',
                    30
                )->default(
                    'dd-MMM-yyyy'
                );

                $table->unsignedTinyInteger(
                    'decimal_places'
                )->default(
                    2
                );

                /*
                 * Printing defaults
                 */
                $table->string(
                    'paper_size',
                    20
                )->default(
                    'A4'
                );

                $table->string(
                    'print_orientation',
                    20
                )->default(
                    'portrait'
                );

                $table->boolean(
                    'show_company_header'
                )->default(
                    true
                );

                $table->boolean(
                    'show_address'
                )->default(
                    true
                );

                $table->boolean(
                    'show_phone'
                )->default(
                    true
                );

                $table->boolean(
                    'show_email'
                )->default(
                    true
                );

                $table->boolean(
                    'show_website'
                )->default(
                    true
                );

                $table->boolean(
                    'show_govt_license'
                )->default(
                    true
                );

                $table->boolean(
                    'show_ntn'
                )->default(
                    true
                );

                $table->boolean(
                    'show_qr'
                )->default(
                    true
                );

                /*
                 * Uploaded files
                 */
                $table->string(
                    'logo_path'
                )->nullable();

                $table->string(
                    'qr_code_path'
                )->nullable();

                $table->timestamps();
            }
        );

        /*
         * Create one real settings record immediately.
         *
         * These defaults are based on the old HBA company
         * information already present in the legacy system.
         */
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

    public function down(): void
    {
        Schema::dropIfExists(
            'company_settings'
        );
    }
};