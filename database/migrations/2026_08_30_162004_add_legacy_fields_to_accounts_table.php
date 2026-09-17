<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('state_province', 100)
                ->nullable()
                ->after('city_category');

            $table->string('postal_code', 30)
                ->nullable()
                ->after('state_province');

            $table->text('notes')
                ->nullable()
                ->after('details');

            $table->string('tax_title', 50)
                ->nullable()
                ->after('tax_type');

            $table->boolean('is_cash_account')
                ->default(false)
                ->after('is_active');

            $table->string('category', 255)
                ->nullable()
                ->after('is_cash_account');

            $table->string('expense_account', 255)
                ->nullable()
                ->after('category');

            $table->unsignedInteger('legacy_branch_id')
                ->nullable()
                ->after('branch');

            $table->unsignedInteger('legacy_department_id')
                ->nullable()
                ->after('legacy_branch_id');

            $table->string('legacy_created_by', 255)
                ->nullable()
                ->after('legacy_department_id');

            $table->index('legacy_branch_id');
            $table->index('legacy_department_id');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex(['legacy_branch_id']);
            $table->dropIndex(['legacy_department_id']);

            $table->dropColumn([
                'state_province',
                'postal_code',
                'notes',
                'tax_title',
                'is_cash_account',
                'category',
                'expense_account',
                'legacy_branch_id',
                'legacy_department_id',
                'legacy_created_by',
            ]);
        });
    }
};