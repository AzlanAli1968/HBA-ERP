<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->unsignedInteger('legacy_system_id')
                ->nullable()
                ->after('legacy_reference_id');

            $table->dropUnique(
                'journal_entries_legacy_reference_unique'
            );

            $table->unique(
                [
                    'legacy_reference_type',
                    'legacy_reference_id',
                    'legacy_system_id',
                    'voucher_type',
                ],
                'journal_entries_legacy_reference_unique'
            );

            $table->index('legacy_system_id');
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropUnique(
                'journal_entries_legacy_reference_unique'
            );

            $table->dropIndex(
                'journal_entries_legacy_system_id_index'
            );

            $table->dropColumn('legacy_system_id');

            $table->unique(
                [
                    'legacy_reference_type',
                    'legacy_reference_id',
                    'voucher_type',
                ],
                'journal_entries_legacy_reference_unique'
            );
        });
    }
};