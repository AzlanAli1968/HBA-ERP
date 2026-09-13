<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (
            Schema::hasTable(
                'transfer_locations'
            )
        ) {
            return;
        }

        Schema::create(
            'transfer_locations',
            function (Blueprint $table): void {
                $table->id();

                $table->string(
                    'name',
                    255
                );

                $table->boolean(
                    'is_active'
                )->default(true);

                $table->timestamps();

                $table->index(
                    'is_active'
                );

                $table->index(
                    'name'
                );
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'transfer_locations'
        );
    }
};