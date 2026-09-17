<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_hotel_rate_details', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_id')
                ->unique();

            $table->unsignedInteger('legacy_transaction_id');

            $table->foreignId('invoice_transaction_id')
                ->nullable()
                ->constrained('invoice_transactions')
                ->nullOnDelete();

            $table->dateTime('night_date')
                ->nullable();

            $table->decimal('night_rate', 19, 4)
                ->nullable();

            $table->string('night_week_day', 20)
                ->nullable();

            $table->decimal('night_rate_vendor', 19, 4)
                ->nullable();

            $table->timestamps();

            $table->index('legacy_transaction_id');
            $table->index('invoice_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_hotel_rate_details');
    }
};