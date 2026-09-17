<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        if (! Schema::hasTable('company_banks')) {
            Schema::create('company_banks', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('company_setting_id')
                    ->constrained('company_settings')
                    ->cascadeOnDelete();
                $table->string('label', 100)->nullable();
                $table->string('bank_name', 255);
                $table->string('account_title', 255)->nullable();
                $table->string('account_number', 100)->nullable();
                $table->string('iban', 100)->nullable();
                $table->string('branch_name', 255)->nullable();
                $table->string('swift_code', 50)->nullable();
                $table->string('currency_code', 20)->nullable();
                $table->string('logo_path', 500)->nullable();
                $table->boolean('is_active')->default(true);
                $table->boolean('show_on_documents')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['company_setting_id', 'is_active', 'show_on_documents']);
                $table->index(['company_setting_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('company_banks');
    }
};
