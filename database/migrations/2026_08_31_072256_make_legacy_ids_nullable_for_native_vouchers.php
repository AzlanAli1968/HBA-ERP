<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_voucher_id')
                ->nullable()
                ->change();
        });

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_master_id')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_voucher_id')
                ->nullable(false)
                ->change();
        });

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_master_id')
                ->nullable(false)
                ->change();
        });
    }
};