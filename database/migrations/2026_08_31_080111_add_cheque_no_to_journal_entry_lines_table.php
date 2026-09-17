<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('journal_entry_lines', 'cheque_no')) {
            Schema::table('journal_entry_lines', function (Blueprint $table) {
                $table->string('cheque_no', 100)
                    ->nullable()
                    ->after('con_ticket_no');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('journal_entry_lines', 'cheque_no')) {
            Schema::table('journal_entry_lines', function (Blueprint $table) {
                $table->dropColumn('cheque_no');
            });
        }
    }
};