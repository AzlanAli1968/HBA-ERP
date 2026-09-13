<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_fare_breakups', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_id')
                ->unique();

            $table->unsignedInteger('legacy_transaction_id');

            $table->foreignId('invoice_transaction_id')
                ->nullable()
                ->constrained('invoice_transactions')
                ->nullOnDelete();

            $table->string('sector', 255)
                ->nullable();

            $table->decimal('amount', 19, 4)
                ->nullable();

            $table->boolean('commissionable')
                ->default(false);

            $table->string('pnr', 255)
                ->nullable();

            $table->string('airline', 255)
                ->nullable();

            $table->string('flight_no', 255)
                ->nullable();

            $table->string('class', 255)
                ->nullable();

            $table->string('from', 255)
                ->nullable();

            $table->string('to', 255)
                ->nullable();

            $table->dateTime('departure_date')
                ->nullable();

            $table->dateTime('etd')
                ->nullable();

            $table->dateTime('eta')
                ->nullable();

            $table->string('status', 255)
                ->nullable();

            $table->timestamps();

            $table->index('legacy_transaction_id');
            $table->index('invoice_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_fare_breakups');
    }
};