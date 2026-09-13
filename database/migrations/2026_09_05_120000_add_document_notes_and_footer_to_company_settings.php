<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        if (! Schema::hasColumn('company_settings', 'document_notes')) {
            Schema::table('company_settings', function (Blueprint $table): void {
                $table->text('document_notes')->nullable();
            });
        }

        if (! Schema::hasColumn('company_settings', 'document_footer')) {
            Schema::table('company_settings', function (Blueprint $table): void {
                $table->text('document_footer')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        $columns = [];

        if (Schema::hasColumn('company_settings', 'document_notes')) {
            $columns[] = 'document_notes';
        }

        if (Schema::hasColumn('company_settings', 'document_footer')) {
            $columns[] = 'document_footer';
        }

        if ($columns !== []) {
            Schema::table('company_settings', function (Blueprint $table) use ($columns): void {
                $table->dropColumn($columns);
            });
        }
    }
};
    