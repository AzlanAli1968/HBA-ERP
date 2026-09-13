<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            // Original Accu-Travel Invoice ID.
            $table->unsignedInteger('legacy_invoice_id')
                ->unique();

            $table->date('invoice_date')
                ->nullable();

            $table->string('ref_no', 255)
                ->nullable();

            $table->foreignId('client_account_id')
                ->nullable()
                ->constrained('accounts')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('legacy_entered_by', 255)
                ->nullable();

            $table->dateTime('date_time')
                ->nullable();

            $table->dateTime('inv_entry_date')
                ->nullable();

            $table->string('employee', 255)
                ->nullable();

            $table->boolean('supervised')
                ->default(false);

            $table->string('supervised_by', 255)
                ->nullable();

            $table->integer('sales_tax_invoice_no')
                ->nullable();

            $table->string('payment_terms', 255)
                ->nullable();

            $table->dateTime('due_date')
                ->nullable();

            $table->integer('ticket_query_id')
                ->nullable();

            $table->text('remarks')
                ->nullable();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->nullOnDelete();

            $table->unsignedInteger('legacy_branch_id')
                ->nullable();

            $table->unsignedInteger('legacy_department_id')
                ->nullable();

            $table->string('status', 255)
                ->nullable();

            $table->boolean('is_selected')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

            $table->dateTime('due_date_vendor')
                ->nullable();

            $table->string('invoice_type', 255)
                ->nullable();

            $table->integer('shirka')
                ->nullable();

            $table->integer('umrah_query_id')
                ->nullable();

            $table->timestamps();

            $table->index('invoice_date');
            $table->index('status');
            $table->index('client_account_id');
            $table->index('branch_id');
            $table->index('department_id');
            $table->index('created_by');
            $table->index('ticket_query_id');
            $table->index('umrah_query_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};