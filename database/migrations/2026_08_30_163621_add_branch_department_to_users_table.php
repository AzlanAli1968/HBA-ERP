<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()
                ->after('legacy_branch_id')
                ->constrained('branches')
                ->nullOnDelete();

            $table->foreignId('department_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('departments')
                ->nullOnDelete();

            $table->index('branch_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign([
                'branch_id',
            ]);

            $table->dropForeign([
                'department_id',
            ]);

            $table->dropIndex([
                'branch_id',
            ]);

            $table->dropIndex([
                'department_id',
            ]);

            $table->dropColumn([
                'branch_id',
                'department_id',
            ]);
        });
    }
};