<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Legacy Accu-Travel voucher headers.
         */
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_voucher_id')
                ->unique();

            $table->string('voucher_no', 100)
                ->nullable();

            $table->dateTime('voucher_date')
                ->nullable();

            $table->string('voucher_type', 30)
                ->nullable();

            $table->string('cash_bank_account_code', 50)
                ->nullable();

            $table->foreignId('cash_bank_account_id')
                ->nullable()
                ->constrained('accounts')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('legacy_entered_by', 150)
                ->nullable();

            $table->dateTime('entry_date')
                ->nullable();

            $table->string('ref_no', 255)
                ->nullable();

            $table->boolean('combine_voucher')
                ->default(false);

            $table->boolean('supervised')
                ->default(false);

            $table->string('supervised_by', 150)
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

            /*
             * Complete source-row preservation.
             */
            $table->longText('legacy_data')
                ->nullable();

            $table->timestamps();

            $table->index('voucher_date');
            $table->index('voucher_type');
            $table->index('created_by');
            $table->index('branch_id');
            $table->index('department_id');
        });

        /*
         * Historical accounting batches reconstructed from Master.
         *
         * IMPORTANT:
         * legacy_reference_id is intentionally NOT a foreign key.
         *
         * Master.Voucher ID is overloaded in Accu-Travel and can refer to:
         * - a real Voucher
         * - an Invoice
         * - another historical reference
         *
         * reference_type makes that distinction explicit.
         */
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();

            $table->string('legacy_reference_type', 30);

            $table->unsignedInteger('legacy_reference_id');

            $table->string('voucher_type', 30)
                ->default('UNKNOWN');

            $table->foreignId('voucher_id')
                ->nullable()
                ->constrained('vouchers')
                ->nullOnDelete();

            $table->foreignId('invoice_id')
                ->nullable()
                ->constrained('invoices')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

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

            $table->dateTime('entry_date')
                ->nullable();

            $table->dateTime('last_posting_date')
                ->nullable();

            /*
             * An invoice reference can contain multiple service modes.
             */
            $table->longText('source_modes')
                ->nullable();

            /*
             * A historical reference can contain multiple system IDs.
             */
            $table->longText('source_system_ids')
                ->nullable();

            $table->decimal('total_debit', 20, 4)
                ->default(0);

            $table->decimal('total_credit', 20, 4)
                ->default(0);

            $table->unsignedInteger('line_count')
                ->default(0);

            $table->boolean('is_balanced')
                ->default(false);

            /*
             * Source summary/preservation.
             */
            $table->longText('legacy_data')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'legacy_reference_type',
                'legacy_reference_id',
                'voucher_type',
            ], 'journal_entries_legacy_reference_unique');

            $table->index('voucher_id');
            $table->index('invoice_id');
            $table->index('entry_date');
            $table->index('legacy_reference_type');
            $table->index('is_balanced');
        });

        /*
         * One row for every historical Master accounting record
         * except opening-balance records (Voucher Type = O), which
         * are represented by account_opening_balances.
         */
        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('journal_entry_id')
                ->constrained('journal_entries')
                ->cascadeOnDelete();

            $table->unsignedInteger('legacy_master_id')
                ->unique();

            $table->unsignedInteger('legacy_reference_id');

            $table->unsignedInteger('legacy_system_id')
                ->nullable();

            $table->string('legacy_reference_type', 30);

            $table->string('voucher_type', 30)
                ->default('UNKNOWN');

            $table->string('mode', 50)
                ->nullable();

            $table->foreignId('account_id')
                ->constrained('accounts')
                ->restrictOnDelete();

            $table->string('account_code', 50);

            $table->decimal('debit', 20, 4)
                ->default(0);

            $table->decimal('credit', 20, 4)
                ->default(0);

            $table->dateTime('voucher_date')
                ->nullable();

            $table->dateTime('posting_date')
                ->nullable();

            $table->foreignId('voucher_id')
                ->nullable()
                ->constrained('vouchers')
                ->nullOnDelete();

            $table->foreignId('invoice_id')
                ->nullable()
                ->constrained('invoices')
                ->nullOnDelete();

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

            /*
             * Currency.
             */
            $table->string('currency_code', 20)
                ->nullable();

            $table->decimal('currency_quantity', 20, 4)
                ->nullable();

            $table->decimal('currency_rate', 20, 6)
                ->nullable();

            $table->decimal('foreign_debit', 20, 4)
                ->nullable();

            $table->decimal('foreign_credit', 20, 4)
                ->nullable();

            /*
             * Accounting/business references.
             */
            $table->decimal('profit', 20, 4)
                ->nullable();

            $table->string('legacy_invoice_no', 100)
                ->nullable();

            $table->string('legacy_invoice_no_2', 100)
                ->nullable();

            $table->string('ticket_no', 255)
                ->nullable();

            $table->string('con_ticket_no', 255)
                ->nullable();

            $table->string('passenger', 255)
                ->nullable();

            $table->string('mode_description', 500)
                ->nullable();

            $table->string('sector_description', 500)
                ->nullable();

            $table->string('fare_taxes_service', 500)
                ->nullable();

            $table->string('entry_by', 150)
                ->nullable();

            $table->unsignedInteger('umrah_query_id')
                ->nullable();

            /*
             * Complete source Master row.
             */
            $table->longText('legacy_data')
                ->nullable();

            $table->timestamps();

            $table->index('journal_entry_id');
            $table->index('legacy_reference_id');
            $table->index('legacy_system_id');
            $table->index('legacy_reference_type');
            $table->index('voucher_type');
            $table->index('mode');
            $table->index('account_id');
            $table->index('posting_date');
            $table->index('invoice_id');
            $table->index('voucher_id');
        });

        /*
         * Complete Transuction history.
         *
         * This is intentionally separate from journal_entry_lines.
         * Transuction is preserved as its own historical register.
         */
        Schema::create('legacy_transactions', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('legacy_transaction_id')
                ->unique();

            $table->unsignedInteger('legacy_voucher_id')
                ->nullable();

            $table->foreignId('voucher_id')
                ->nullable()
                ->constrained('vouchers')
                ->nullOnDelete();

            /*
             * Safe relationship:
             * Transuction ID -> InvTickets.InvTransuction ID
             */
            $table->foreignId('invoice_transaction_id')
                ->nullable()
                ->constrained('invoice_transactions')
                ->nullOnDelete();

            $table->foreignId('account_id')
                ->nullable()
                ->constrained('accounts')
                ->nullOnDelete();

            $table->string('account_code', 50)
                ->nullable();

            $table->string('form_no', 100)
                ->nullable();

            $table->string('legacy_invoice_no', 100)
                ->nullable();

            $table->string('legacy_invoice_no_2', 100)
                ->nullable();

            $table->string('refund_no', 100)
                ->nullable();

            $table->text('particulars')
                ->nullable();

            $table->string('cheque_no', 150)
                ->nullable();

            $table->decimal('debit', 20, 4)
                ->default(0);

            $table->decimal('credit', 20, 4)
                ->default(0);

            $table->dateTime('posting_date')
                ->nullable();

            $table->boolean('cleared')
                ->default(false);

            $table->string('currency_code', 20)
                ->nullable();

            $table->decimal('currency_quantity', 20, 4)
                ->nullable();

            $table->decimal('currency_rate', 20, 6)
                ->nullable();

            $table->decimal('currency_debit', 20, 4)
                ->nullable();

            $table->decimal('currency_credit', 20, 4)
                ->nullable();

            $table->boolean('payee_account_only')
                ->default(false);

            $table->unsignedInteger('umrah_query_id')
                ->nullable();

            $table->longText('legacy_data')
                ->nullable();

            $table->timestamps();

            $table->index('legacy_voucher_id');
            $table->index('voucher_id');
            $table->index('invoice_transaction_id');
            $table->index('account_id');
            $table->index('posting_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legacy_transactions');
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('vouchers');
    }
};