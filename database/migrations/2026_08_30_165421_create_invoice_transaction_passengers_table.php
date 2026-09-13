<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_transaction_passengers', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_id')
                ->unique();

            $table->unsignedInteger('legacy_transaction_id');

            $table->foreignId('invoice_transaction_id')
                ->nullable()
                ->constrained('invoice_transactions')
                ->nullOnDelete();

            $table->string('passport_no', 255)
                ->nullable();

            $table->string('passenger_name', 255)
                ->nullable();

            $table->string('passenger_type', 255)
                ->nullable();

            $table->string('mofa_no', 255)
                ->nullable();

            $table->decimal('frc', 19, 4)
                ->nullable();

            $table->decimal('return_case', 19, 4)
                ->nullable();

            $table->decimal('payable', 19, 4)
                ->nullable();

            $table->decimal('receivable', 19, 4)
                ->nullable();

            $table->timestamps();

            $table->index('legacy_transaction_id');
            $table->index('invoice_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_transaction_passengers');
    }
};