<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('legacy_username', 255)
                ->nullable()
                ->unique()
                ->after('email');

            $table->unsignedInteger('legacy_authority')
                ->nullable()
                ->after('legacy_username');

            $table->unsignedInteger('legacy_branch_id')
                ->nullable()
                ->after('legacy_authority');

            $table->unsignedInteger('legacy_department_id')
                ->nullable()
                ->after('legacy_branch_id');

            $table->boolean('legacy_active')
                ->nullable()
                ->after('legacy_department_id');

            $table->datetime('legacy_created_at')
                ->nullable()
                ->after('legacy_active');

            $table->datetime('legacy_disabled_at')
                ->nullable()
                ->after('legacy_created_at');

            $table->boolean('must_change_password')
                ->default(false)
                ->after('legacy_disabled_at');

            $table->index('legacy_branch_id');
            $table->index('legacy_department_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['legacy_branch_id']);
            $table->dropIndex(['legacy_department_id']);

            $table->dropColumn([
                'legacy_username',
                'legacy_authority',
                'legacy_branch_id',
                'legacy_department_id',
                'legacy_active',
                'legacy_created_at',
                'legacy_disabled_at',
                'must_change_password',
            ]);
        });
    }
};