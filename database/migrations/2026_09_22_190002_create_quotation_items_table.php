<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('quotation_items')) {
            return;
        }

        Schema::create('quotation_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('quotation_id')->index();

            $table->string('item_type', 30)->index(); // hotel, transport, visa, other
            $table->string('section', 100)->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();

            $table->string('title', 255);
            $table->longText('description')->nullable();

            $table->unsignedBigInteger('hotel_id')->nullable()->index();
            $table->string('city', 100)->nullable();
            $table->date('check_in')->nullable();
            $table->date('check_out')->nullable();
            $table->unsignedInteger('nights')->nullable();
            $table->string('room_type', 150)->nullable();
            $table->string('meal', 100)->nullable();
            $table->unsignedInteger('room_quantity')->nullable();

            $table->unsignedBigInteger('from_location_id')->nullable()->index();
            $table->unsignedBigInteger('to_location_id')->nullable()->index();
            $table->string('from_location_name', 255)->nullable();
            $table->string('to_location_name', 255)->nullable();
            $table->unsignedBigInteger('vehicle_id')->nullable()->index();

            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('rate', 15, 2)->default(0);
            $table->string('rate_currency_code', 10)->default('PKR');

            // Frozen package-price contribution in quote currency.
            $table->decimal('adult_amount', 15, 2)->default(0);
            $table->decimal('child_amount', 15, 2)->default(0);
            $table->decimal('infant_amount', 15, 2)->default(0);

            // Free-form snapshot for fields introduced later without breaking old quotes.
            $table->longText('metadata_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
