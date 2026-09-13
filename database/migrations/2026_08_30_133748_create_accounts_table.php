<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('account_type_id')
                ->constrained('account_types')
                ->restrictOnDelete();

            // Keep account codes as strings so historical identifiers
            // are preserved exactly during future migration.
            $table->string('code', 30)->unique();

            $table->string('name', 200);

            $table->string('branch', 100)->default('Head Office');

            $table->string('city_category', 150)->nullable();

            $table->decimal('opening_debit', 18, 2)->default(0);

            $table->decimal('opening_credit', 18, 2)->default(0);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->dateTime('opening_date')->nullable();

            $table->text('details')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('name');
            $table->index('branch');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};