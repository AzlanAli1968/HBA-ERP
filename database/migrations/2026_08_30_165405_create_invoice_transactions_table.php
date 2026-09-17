<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_transactions', function (Blueprint $table) {
            $table->id();

            /*
             * Original Accu-Travel identifiers.
             */
            $table->unsignedInteger('legacy_transaction_id')
                ->unique();

            $table->unsignedInteger('legacy_invoice_id')
                ->nullable();

            /*
             * New ERP relationship.
             *
             * Nullable because the source contains 9 transactions
             * without an Invoice ID.
             */
            $table->foreignId('invoice_id')
                ->nullable()
                ->constrained('invoices')
                ->nullOnDelete();

            /*
             * Transaction classification.
             *
             * Known values:
             * Ticket
             * Hotel
             * VISA
             * Transfer
             * Other
             */
            $table->string('mode', 50);

            $table->string('type', 255)
                ->nullable();

            /*
             * Ticket / airline data.
             */
            $table->string('airline_code', 10)
                ->nullable();

            $table->string('ticket_no', 255)
                ->nullable();

            $table->string('con_ticket_no', 255)
                ->nullable();

            $table->string('ticket_type', 255)
                ->nullable();

            $table->string('payable_account_code', 255)
                ->nullable();

            /*
             * Passenger data held directly on InvTickets.
             */
            $table->string('passenger_name', 255)
                ->nullable();

            $table->string('passport_no', 255)
                ->nullable();

            $table->text('address')
                ->nullable();

            $table->string('phone', 255)
                ->nullable();

            $table->dateTime('dob')
                ->nullable();

            $table->string('sector', 255)
                ->nullable();

            $table->dateTime('departure_date')
                ->nullable();

            $table->string('flight_no', 255)
                ->nullable();

            $table->string('pnr', 255)
                ->nullable();

            $table->string('route', 255)
                ->nullable();

            $table->string('passenger_type', 255)
                ->nullable();

            $table->string('xo', 255)
                ->nullable();

            /*
             * Fare and tax components.
             */
            $table->decimal('fare', 19, 4)
                ->nullable();

            $table->decimal('sp_apt', 19, 4)
                ->nullable();

            $table->decimal('sf_ftt', 19, 4)
                ->nullable();

            $table->decimal('aq_pk_yr', 19, 4)
                ->nullable();

            $table->decimal('fed_rg_cvt', 19, 4)
                ->nullable();

            $table->decimal('ced', 19, 4)
                ->nullable();

            $table->decimal('jo', 19, 4)
                ->nullable();

            $table->decimal('wh_airlines', 19, 4)
                ->nullable();

            $table->decimal('wh_client', 19, 4)
                ->nullable();

            $table->decimal('yq', 19, 4)
                ->nullable();

            $table->decimal('xut', 19, 4)
                ->nullable();

            $table->decimal('other', 19, 4)
                ->nullable();

            $table->decimal('commission_receivable', 19, 4)
                ->nullable();

            $table->decimal('commission_paid', 19, 4)
                ->nullable();

            $table->decimal('psf', 19, 4)
                ->nullable();

            $table->decimal('other_service_charges', 19, 4)
                ->nullable();

            $table->decimal('discount', 19, 4)
                ->nullable();

            $table->decimal('insurance', 19, 4)
                ->nullable();

            $table->decimal('fare_2', 19, 4)
                ->nullable();

            $table->decimal('fare_3', 19, 4)
                ->nullable();

            $table->string('payable_account_2', 255)
                ->nullable();

            $table->string('payable_account_3', 255)
                ->nullable();

            $table->string('doc_rec', 255)
                ->nullable();

            $table->decimal('fare_nc', 19, 4)
                ->nullable();

            /*
             * Passenger additional information.
             */
            $table->string('father_name', 255)
                ->nullable();

            $table->string('birth_place', 255)
                ->nullable();

            $table->dateTime('doi')
                ->nullable();

            $table->dateTime('doe')
                ->nullable();

            $table->string('relation', 255)
                ->nullable();

            $table->string('particulars_2', 255)
                ->nullable();

            $table->string('particulars_3', 255)
                ->nullable();

            $table->string('particulars_4', 255)
                ->nullable();

            $table->string('class', 255)
                ->nullable();

            $table->decimal('xz', 19, 4)
                ->nullable();

            $table->decimal('yd', 19, 4)
                ->nullable();

            $table->string('other_service_account', 10)
                ->nullable();

            $table->decimal('total_fare', 19, 4)
                ->nullable();

            $table->dateTime('return_date')
                ->nullable();

            $table->string('gds', 20)
                ->nullable();

            $table->dateTime('online_date')
                ->nullable();

            $table->string('group_no', 50)
                ->nullable();

            $table->decimal('pst', 19, 4)
                ->nullable();

            $table->string('cnic', 50)
                ->nullable();

            /*
             * Hotel / vehicle references.
             */
            $table->integer('hotel_id_legacy')
                ->nullable();

            $table->integer('vehicle_id_legacy')
                ->nullable();

            $table->string('ref_no', 100)
                ->nullable();

            $table->integer('nights')
                ->nullable();

            $table->decimal('tact_rate', 19, 4)
                ->nullable();

            /*
             * Cargo / airline values.
             */
            $table->decimal('gross_weight', 19, 4)
                ->nullable();

            $table->decimal('awc', 19, 4)
                ->nullable();

            $table->decimal('fsc', 19, 4)
                ->nullable();

            $table->decimal('gtc', 19, 4)
                ->nullable();

            $table->decimal('ssccgc', 19, 4)
                ->nullable();

            $table->decimal('rate', 19, 4)
                ->nullable();

            $table->decimal('net_rate', 19, 4)
                ->nullable();

            $table->decimal('commission_to_client', 19, 4)
                ->nullable();

            $table->decimal('fare_including', 19, 4)
                ->nullable();

            $table->decimal('taxes_including', 19, 4)
                ->nullable();

            /*
             * Currency.
             */
            $table->string('currency_code', 20)
                ->nullable();

            $table->decimal('currency_quantity', 19, 4)
                ->nullable();

            $table->decimal('currency_rate', 19, 4)
                ->nullable();

            $table->string('agent_code', 30)
                ->nullable();

            $table->decimal('agent_amount', 19, 4)
                ->nullable();

            $table->string('pnr_gds', 255)
                ->nullable();

            $table->double('pst_percentage')
                ->nullable();

            $table->decimal('pst_paid', 19, 4)
                ->nullable();

            /*
             * Hotel transaction fields.
             */
            $table->string('room_no', 10)
                ->nullable();

            $table->double('quantity')
                ->nullable();

            $table->string('meal', 255)
                ->nullable();

            $table->double('room_quantity')
                ->nullable();

            $table->string('internal_ref_no', 255)
                ->nullable();

            $table->decimal('vendor_rate', 19, 4)
                ->nullable();

            $table->decimal('rate_vendor', 19, 4)
                ->nullable();

            $table->dateTime('posting_date')
                ->nullable();

            $table->string('room_type', 255)
                ->nullable();

            $table->string('sector_to', 255)
                ->nullable();

            $table->string('flight_information', 255)
                ->nullable();

            $table->boolean('similar_hotel')
                ->default(false);

            $table->string('email', 255)
                ->nullable();

            $table->string('nationality', 50)
                ->nullable();

            $table->decimal('rate_wd', 19, 4)
                ->nullable();

            $table->decimal('rate_we', 19, 4)
                ->nullable();

            $table->decimal('rate_wd_payable', 19, 4)
                ->nullable();

            $table->decimal('rate_we_payable', 19, 4)
                ->nullable();

            /*
             * Original source transaction references.
             */
            $table->index('legacy_invoice_id');
            $table->index('invoice_id');
            $table->index('mode');
            $table->index('payable_account_code');
            $table->index('currency_code');
            $table->index('agent_code');
            $table->index('posting_date');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_transactions');
    }
};