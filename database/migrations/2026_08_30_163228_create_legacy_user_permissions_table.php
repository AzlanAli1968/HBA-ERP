<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legacy_user_permissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('legacy_username', 255);

            /*
             * Exact source permission fields and their values.
             *
             * Example:
             * {
             *     "TAB_Accounts": 1,
             *     "BTN_SALE": 1,
             *     "SALE_ADD": 1
             * }
             */
            $table->json('permission_flags');

            $table->unsignedInteger('legacy_authority')
                ->nullable();

            $table->unsignedInteger('legacy_branch_id')
                ->nullable();

            $table->unsignedInteger('legacy_department_id')
                ->nullable();

            $table->boolean('legacy_active')
                ->nullable();

            $table->timestamp('imported_at')
                ->useCurrent();

            $table->timestamp('updated_at')
                ->useCurrent()
                ->useCurrentOnUpdate();

            $table->unique('user_id');
            $table->index('legacy_username');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legacy_user_permissions');
    }
};