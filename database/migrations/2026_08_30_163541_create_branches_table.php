<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_id')
                ->unique();

            $table->string('name', 100);

            $table->string('company_name', 255)
                ->nullable();

            $table->text('address')
                ->nullable();

            $table->string('city', 100)
                ->nullable();

            $table->string('phone', 100)
                ->nullable();

            $table->string('mobile', 100)
                ->nullable();

            $table->string('email', 150)
                ->nullable();

            $table->string('website', 255)
                ->nullable();

            $table->string('license_no', 50)
                ->nullable();

            $table->string('fax', 50)
                ->nullable();

            $table->string('phone_2', 100)
                ->nullable();

            $table->string('accounts_manager', 150)
                ->nullable();

            /*
             * Legacy tblBranches.Logo is a binary/longblob field.
             * Laravel's binary() is the supported schema type.
             */
            $table->binary('logo')
                ->nullable();

            $table->string('ntn', 50)
                ->nullable();

            $table->string('ntn_label', 50)
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};