<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('quotations')) {
            return;
        }

        Schema::create('quotations', function (Blueprint $table): void {
            $table->id();
            $table->string('quote_no', 50)->unique();
            $table->date('quotation_date');
            $table->date('valid_until')->nullable();
            $table->unsignedBigInteger('client_account_id')->nullable()->index();

            $table->string('title', 255);
            $table->string('package_name', 255)->nullable();
            $table->string('route', 255)->nullable();
            $table->date('travel_start_date')->nullable();
            $table->date('travel_end_date')->nullable();

            $table->unsignedInteger('adults')->default(1);
            $table->unsignedInteger('children')->default(0);
            $table->unsignedInteger('infants')->default(0);
            $table->boolean('children_enabled')->default(false);
            $table->boolean('infants_enabled')->default(false);

            $table->boolean('flight_enabled')->default(false);
            $table->string('currency_code', 10)->default('PKR')->index();

            $table->decimal('package_per_adult', 15, 2)->default(0);
            $table->decimal('package_per_child', 15, 2)->default(0);
            $table->decimal('package_per_infant', 15, 2)->default(0);

            $table->longText('template_snapshot')->nullable();
            $table->longText('render_snapshot')->nullable();

            $table->string('status', 30)->default('draft')->index();
            $table->text('notes')->nullable();
            $table->longText('terms_conditions')->nullable();

            $table->unsignedBigInteger('template_id')->nullable()->index();
            $table->unsignedBigInteger('branch_id')->nullable()->index();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
