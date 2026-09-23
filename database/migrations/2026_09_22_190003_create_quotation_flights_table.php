<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('quotation_flights')) {
            return;
        }

        Schema::create('quotation_flights', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('quotation_id')->unique();
            $table->string('airline_name', 150);
            $table->string('route', 255)->nullable();
            $table->date('departure_date')->nullable();
            $table->date('return_date')->nullable();
            $table->longText('flight_details')->nullable();
            $table->string('currency_code', 10)->default('PKR');

            $table->decimal('adult_fare', 15, 2)->default(0);
            $table->decimal('child_fare', 15, 2)->default(0);
            $table->decimal('infant_fare', 15, 2)->default(0);

            $table->decimal('adult_total', 15, 2)->default(0);
            $table->decimal('child_total', 15, 2)->default(0);
            $table->decimal('infant_total', 15, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_flights');
    }
};
