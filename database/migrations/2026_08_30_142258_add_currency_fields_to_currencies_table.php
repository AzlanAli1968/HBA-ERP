<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('currencies', function (Blueprint $table) {
            $table->string('code', 10)
                ->unique()
                ->after('id');

            $table->string('name', 100)
                ->after('code');

            $table->string('symbol', 10)
                ->nullable()
                ->after('name');

            $table->boolean('is_base')
                ->default(false)
                ->after('symbol');

            $table->boolean('is_active')
                ->default(true)
                ->after('is_base');
        });
    }

    public function down(): void
    {
        Schema::table('currencies', function (Blueprint $table) {
            $table->dropUnique(['code']);

            $table->dropColumn([
                'code',
                'name',
                'symbol',
                'is_base',
                'is_active',
            ]);
        });
    }
};