<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('hotels')) {
            return;
        }

        Schema::create('hotels', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('legacy_hotel_id')->nullable()->index();
            $table->string('name', 255);
            $table->string('city', 255)->nullable();
            $table->string('vendor_account_code', 100)->nullable()->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index(['name', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
