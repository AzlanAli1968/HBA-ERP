<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('quotation_templates')) {
            return;
        }

        if (!Schema::hasColumn('quotation_templates', 'template_type')) {
            Schema::table('quotation_templates', function (Blueprint $table): void {
                $table->string('template_type', 30)
                    ->default('design')
                    ->index()
                    ->after('description');
            });
        }

        if (!Schema::hasColumn('quotation_templates', 'config_json')) {
            Schema::table('quotation_templates', function (Blueprint $table): void {
                $table->longText('config_json')
                    ->nullable()
                    ->after('design_json');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('quotation_templates')) {
            return;
        }

        if (
            Schema::hasColumn('quotation_templates', 'config_json')
            || Schema::hasColumn('quotation_templates', 'template_type')
        ) {
            Schema::table('quotation_templates', function (Blueprint $table): void {
                if (Schema::hasColumn('quotation_templates', 'config_json')) {
                    $table->dropColumn('config_json');
                }

                if (Schema::hasColumn('quotation_templates', 'template_type')) {
                    $table->dropColumn('template_type');
                }
            });
        }
    }
};