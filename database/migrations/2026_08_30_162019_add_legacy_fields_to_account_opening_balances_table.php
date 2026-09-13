<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_opening_balances', function (Blueprint $table) {
            $table->dropForeign([
                'currency_id',
            ]);

            $table->unsignedBigInteger('currency_id')
                ->nullable()
                ->change();

            $table->unsignedInteger('legacy_id')
                ->nullable()
                ->unique()
                ->after('id');

            $table->string('currency_code', 10)
                ->nullable()
                ->after('currency_id');

            $table->decimal('opening_currency', 19, 4)
                ->nullable()
                ->after('opening_credit');

            $table->foreign('currency_id')
                ->references('id')
                ->on('currencies')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('account_opening_balances', function (Blueprint $table) {
            $table->dropForeign([
                'currency_id',
            ]);

            $table->dropUnique([
                'legacy_id',
            ]);

            $table->dropColumn([
                'legacy_id',
                'currency_code',
                'opening_currency',
            ]);

            $table->unsignedBigInteger('currency_id')
                ->nullable(false)
                ->change();

            $table->foreign('currency_id')
                ->references('id')
                ->on('currencies')
                ->cascadeOnDelete();
        });
    }
};