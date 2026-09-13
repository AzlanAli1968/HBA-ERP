<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            Schema::create('company_settings', function (Blueprint $table) {
                $table->id();
                $table->string('company_name')->default('HBA TRAVEL & TOURS');
                $table->string('tagline')->nullable();
                $table->text('address')->nullable();
                $table->string('phone', 100)->nullable();
                $table->string('mobile', 100)->nullable();
                $table->string('email')->nullable();
                $table->string('website')->nullable();
                $table->string('govt_license', 100)->nullable();
                $table->string('ntn', 100)->nullable();

                $table->string('base_currency_code', 20)->default('PKR');
                $table->unsignedTinyInteger('decimal_places')->default(2);

                $table->string('paper_size', 30)->default('A4');
                $table->string('print_orientation', 30)->default('portrait');

                $table->string('logo_path')->nullable();
                $table->string('qr_path')->nullable();

                $table->boolean('show_company_header')->default(true);
                $table->boolean('show_address')->default(true);
                $table->boolean('show_phone')->default(true);
                $table->boolean('show_email')->default(true);
                $table->boolean('show_website')->default(true);
                $table->boolean('show_govt_license')->default(true);
                $table->boolean('show_ntn')->default(true);
                $table->boolean('show_qr')->default(true);

                $table->timestamps();
            });
        } else {
            $this->addMissingColumns();
        }

        \App\Models\CompanySetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'company_name' => 'HBA TRAVEL & TOURS',
                'tagline' => 'EXCELLENCE IN HOSPITALITY AND TRAVELS',
                'base_currency_code' => 'PKR',
                'decimal_places' => 2,
                'paper_size' => 'A4',
                'print_orientation' => 'portrait',
                'show_company_header' => true,
                'show_address' => true,
                'show_phone' => true,
                'show_email' => true,
                'show_website' => true,
                'show_govt_license' => true,
                'show_ntn' => true,
                'show_qr' => true,
            ]
        );
    }

    public function down(): void
    {
        // Intentionally do not drop company_settings because it may already
        // have existed before this migration. This migration is additive.
    }

    private function addMissingColumns(): void
    {
        $columns = [
            'company_name' => fn (Blueprint $table) => $table->string('company_name')
                ->default('HBA TRAVEL & TOURS'),
            'tagline' => fn (Blueprint $table) => $table->string('tagline')->nullable(),
            'address' => fn (Blueprint $table) => $table->text('address')->nullable(),
            'phone' => fn (Blueprint $table) => $table->string('phone', 100)->nullable(),
            'mobile' => fn (Blueprint $table) => $table->string('mobile', 100)->nullable(),
            'email' => fn (Blueprint $table) => $table->string('email')->nullable(),
            'website' => fn (Blueprint $table) => $table->string('website')->nullable(),
            'govt_license' => fn (Blueprint $table) => $table->string('govt_license', 100)->nullable(),
            'ntn' => fn (Blueprint $table) => $table->string('ntn', 100)->nullable(),
            'base_currency_code' => fn (Blueprint $table) => $table->string('base_currency_code', 20)->default('PKR'),
            'decimal_places' => fn (Blueprint $table) => $table->unsignedTinyInteger('decimal_places')->default(2),
            'paper_size' => fn (Blueprint $table) => $table->string('paper_size', 30)->default('A4'),
            'print_orientation' => fn (Blueprint $table) => $table->string('print_orientation', 30)->default('portrait'),
            'logo_path' => fn (Blueprint $table) => $table->string('logo_path')->nullable(),
            'qr_path' => fn (Blueprint $table) => $table->string('qr_path')->nullable(),
            'show_company_header' => fn (Blueprint $table) => $table->boolean('show_company_header')->default(true),
            'show_address' => fn (Blueprint $table) => $table->boolean('show_address')->default(true),
            'show_phone' => fn (Blueprint $table) => $table->boolean('show_phone')->default(true),
            'show_email' => fn (Blueprint $table) => $table->boolean('show_email')->default(true),
            'show_website' => fn (Blueprint $table) => $table->boolean('show_website')->default(true),
            'show_govt_license' => fn (Blueprint $table) => $table->boolean('show_govt_license')->default(true),
            'show_ntn' => fn (Blueprint $table) => $table->boolean('show_ntn')->default(true),
            'show_qr' => fn (Blueprint $table) => $table->boolean('show_qr')->default(true),
        ];

        foreach ($columns as $name => $definition) {
            if (! Schema::hasColumn('company_settings', $name)) {
                Schema::table('company_settings', $definition);
            }
        }
    }
};
