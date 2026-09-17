<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_opening_balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('account_id')
                ->constrained('accounts')
                ->cascadeOnDelete();

            $table->foreignId('currency_id')
                ->constrained('currencies')
                ->restrictOnDelete();

            /*
             * Exchange rate used for this particular opening
             * balance row.
             *
             * We intentionally do NOT make currency unique per
             * account because the legacy system allows the same
             * currency to appear more than once with different
             * rates.
             */
            $table->decimal('exchange_rate', 18, 6)->default(1);

            $table->decimal('opening_debit', 18, 2)->default(0);
            $table->decimal('opening_credit', 18, 2)->default(0);

            $table->timestamps();

            $table->index([
                'account_id',
                'currency_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_opening_balances');
    }
};