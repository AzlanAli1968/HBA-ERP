<?php

namespace App\Services\Migration;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class LegacyInvoiceImporter
{
    private array $accountMap = [];

    private array $userMap = [];

    private array $branchMap = [];

    private array $departmentMap = [];

    private array $invoiceMap = [];

    private array $transactionMap = [];

    public function import(): array
    {
        $this->loadMaps();

        $stats = [
            'source_invoices' => 0,
            'invoices_created' => 0,
            'invoices_updated' => 0,
            'invoice_errors' => 0,

            'source_transactions' => 0,
            'transactions_created' => 0,
            'transactions_updated' => 0,
            'transaction_errors' => 0,

            'source_passengers' => 0,
            'passengers_created' => 0,
            'passengers_updated' => 0,
            'passenger_errors' => 0,

            'source_fare_breakups' => 0,
            'fare_breakups_created' => 0,
            'fare_breakups_updated' => 0,
            'fare_breakup_errors' => 0,

            'source_hotel_rates' => 0,
            'hotel_rates_created' => 0,
            'hotel_rates_updated' => 0,
            'hotel_rate_errors' => 0,

            'orphan_transactions' => 0,

            'errors' => [],
        ];

        $this->importInvoices($stats);
        $this->importTransactions($stats);
        $this->importPassengers($stats);
        $this->importFareBreakups($stats);
        $this->importHotelRates($stats);

        return $stats;
    }

    private function loadMaps(): void
    {
        /*
         * Account code → new ERP account ID.
         */
        $this->accountMap = [];

        foreach (
            DB::table('accounts')
                ->select('id', 'code')
                ->get()
            as $account
        ) {
            $this->accountMap[
                trim((string) $account->code)
            ] = (int) $account->id;
        }

        /*
         * Legacy username → new Laravel user ID.
         */
        $this->userMap = [];

        foreach (
            DB::table('users')
                ->whereNotNull('legacy_username')
                ->select('id', 'legacy_username')
                ->get()
            as $user
        ) {
            $this->userMap[
                strtoupper(
                    trim(
                        (string) $user->legacy_username
                    )
                )
            ] = (int) $user->id;
        }

        /*
         * Legacy BranchId → new Branch ID.
         */
        $this->branchMap = [];

        foreach (
            DB::table('branches')
                ->select('id', 'legacy_id')
                ->get()
            as $branch
        ) {
            $this->branchMap[
                (int) $branch->legacy_id
            ] = (int) $branch->id;
        }

        /*
         * Legacy DepartmentID → new Department ID.
         */
        $this->departmentMap = [];

        foreach (
            DB::table('departments')
                ->select('id', 'legacy_id')
                ->get()
            as $department
        ) {
            $this->departmentMap[
                (int) $department->legacy_id
            ] = (int) $department->id;
        }
    }

    private function importInvoices(
        array &$stats
    ): void {
        $sourceInvoices =
            DB::connection('legacy')
                ->table('Invoice')
                ->orderBy('Invoice ID')
                ->get();

        $stats['source_invoices'] =
            $sourceInvoices->count();

        foreach ($sourceInvoices as $source) {
            try {
                $legacyId =
                    (int) $source->{'Invoice ID'};

                $clientCode =
                    $this->nullableString(
                        $source->{'Client Code'}
                    );

                $clientAccountId = null;

                if ($clientCode !== null) {
                    if (
                        ! isset(
                            $this->accountMap[$clientCode]
                        )
                    ) {
                        throw new RuntimeException(
                            "Client account {$clientCode} " .
                            "not found for invoice {$legacyId}."
                        );
                    }

                    $clientAccountId =
                        $this->accountMap[$clientCode];
                }

                $enteredBy =
                    $this->nullableString(
                        $source->InvEnteredby
                    );

                $createdBy = null;

                if ($enteredBy !== null) {
                    $key = strtoupper($enteredBy);

                    if (isset($this->userMap[$key])) {
                        $createdBy =
                            $this->userMap[$key];
                    }
                }

                $legacyBranchId =
                    $this->nullableInt(
                        $source->Branch
                    );

                $branchId =
                    $legacyBranchId !== null
                    && isset(
                        $this->branchMap[
                            $legacyBranchId
                        ]
                    )
                        ? $this->branchMap[
                            $legacyBranchId
                        ]
                        : null;

                $legacyDepartmentId =
                    $this->nullableInt(
                        $source->Department
                    );

                $departmentId =
                    $legacyDepartmentId !== null
                    && isset(
                        $this->departmentMap[
                            $legacyDepartmentId
                        ]
                    )
                        ? $this->departmentMap[
                            $legacyDepartmentId
                        ]
                        : null;

                $createdAt =
                    $source->InvEntrydate
                    ?? $source->{'Invoice Date'}
                    ?? now();

                $updatedAt =
                    $source->InvEntrydate
                    ?? $source->{'Invoice Date'}
                    ?? now();

                $existing =
                    DB::table('invoices')
                        ->where(
                            'legacy_invoice_id',
                            $legacyId
                        )
                        ->first();

                $data = [
                    'legacy_invoice_id' =>
                        $legacyId,

                    'invoice_date' =>
                        $this->dateValue(
                            $source->{'Invoice Date'}
                        ),

                    'ref_no' =>
                        $this->nullableString(
                            $source->{'Ref #'}
                        ),

                    'client_account_id' =>
                        $clientAccountId,

                    'created_by' =>
                        $createdBy,

                    'legacy_entered_by' =>
                        $enteredBy,

                    'date_time' =>
                        $source->{'Date/Time'},

                    'inv_entry_date' =>
                        $source->InvEntrydate,

                    'employee' =>
                        $this->nullableString(
                            $source->Employee
                        ),

                    'supervised' =>
                        (bool) $source->Supervised,

                    'supervised_by' =>
                        $this->nullableString(
                            $source->SupervisedBy
                        ),

                    'sales_tax_invoice_no' =>
                        $this->nullableInt(
                            $source->SalesTaxInvoiceNo
                        ),

                    'payment_terms' =>
                        $this->nullableString(
                            $source->PaymentTerms
                        ),

                    'due_date' =>
                        $source->DueDate,

                    'ticket_query_id' =>
                        $this->nullableInt(
                            $source->TicketQueryID
                        ),

                    'remarks' =>
                        $this->nullableString(
                            $source->Remarks
                        ),

                    'branch_id' =>
                        $branchId,

                    'department_id' =>
                        $departmentId,

                    'legacy_branch_id' =>
                        $legacyBranchId,

                    'legacy_department_id' =>
                        $legacyDepartmentId,

                    'status' =>
                        $this->nullableString(
                            $source->Status
                        ),

                    'is_selected' =>
                        (bool) $source->Select,

                    'is_active' =>
                        (bool) $source->Active,

                    'due_date_vendor' =>
                        $source->DueDateVendor,

                    'invoice_type' =>
                        $this->nullableString(
                            $source->InvoiceType
                        ),

                    'shirka' =>
                        $this->nullableInt(
                            $source->Shirka
                        ),

                    'umrah_query_id' =>
                        $this->nullableInt(
                            $source->UmrahQueryID
                        ),

                    'updated_at' =>
                        $updatedAt,
                ];

                if ($existing) {
                    DB::table('invoices')
                        ->where(
                            'id',
                            $existing->id
                        )
                        ->update($data);

                    $targetId =
                        (int) $existing->id;

                    $stats['invoices_updated']++;
                } else {
                    $data['created_at'] =
                        $createdAt;

                    $targetId =
                        (int) DB::table('invoices')
                            ->insertGetId($data);

                    $stats['invoices_created']++;
                }

                $this->invoiceMap[$legacyId] =
                    $targetId;
            } catch (Throwable $e) {
                $stats['invoice_errors']++;

                $stats['errors'][] = [
                    'type' => 'invoice',
                    'id' =>
                        $source->{'Invoice ID'}
                        ?? null,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }
    }

    private function importTransactions(
        array &$stats
    ): void {
        $sourceTransactions =
            DB::connection('legacy')
                ->table('InvTickets')
                ->orderBy('InvTransuction ID')
                ->get();

        $stats['source_transactions'] =
            $sourceTransactions->count();

        foreach ($sourceTransactions as $source) {
            try {
                $legacyTransactionId =
                    (int) $source->{'InvTransuction ID'};

                $legacyInvoiceId =
                    $this->nullableInt(
                        $source->{'InvInvoice ID'}
                    );

                $invoiceId = null;

                if ($legacyInvoiceId !== null) {
                    $invoiceId =
                        $this->invoiceMap[
                            $legacyInvoiceId
                        ] ?? null;

                    if ($invoiceId === null) {
                        throw new RuntimeException(
                            "Invoice {$legacyInvoiceId} " .
                            "was not imported for transaction " .
                            "{$legacyTransactionId}."
                        );
                    }
                } else {
                    $stats['orphan_transactions']++;
                }

                $data = [
                    'legacy_transaction_id' =>
                        $legacyTransactionId,

                    'legacy_invoice_id' =>
                        $legacyInvoiceId,

                    'invoice_id' =>
                        $invoiceId,

                    'mode' =>
                        trim(
                            (string) $source->InvMode
                        ),

                    'type' =>
                        $this->nullableString(
                            $source->InvType
                        ),

                    'airline_code' =>
                        $this->nullableString(
                            $source->{'InvAirlines Code'}
                        ),

                    'ticket_no' =>
                        $this->nullableString(
                            $source->{'InvTicket No'}
                        ),

                    'con_ticket_no' =>
                        $this->nullableString(
                            $source->{'InvCon Ticket No'}
                        ),

                    'ticket_type' =>
                        $this->nullableString(
                            $source->{'InvTicket Type'}
                        ),

                    'payable_account_code' =>
                        $this->nullableString(
                            $source->InvPayable
                        ),

                    'passenger_name' =>
                        $this->nullableString(
                            $source->{'InvPassenger Name'}
                        ),

                    'passport_no' =>
                        $this->nullableString(
                            $source->{'InvPassport No'}
                        ),

                    'address' =>
                        $this->nullableString(
                            $source->InvAddress
                        ),

                    'phone' =>
                        $this->nullableString(
                            $source->InvPhone
                        ),

                    'dob' =>
                        $source->InvDOB,

                    'sector' =>
                        $this->nullableString(
                            $source->InvSector
                        ),

                    'departure_date' =>
                        $source->{'InvDeparture Date'},

                    'flight_no' =>
                        $this->nullableString(
                            $source->{'InvFlight No'}
                        ),

                    'pnr' =>
                        $this->nullableString(
                            $source->{'InvPNR #'}
                        ),

                    'route' =>
                        $this->nullableString(
                            $source->InvRoute
                        ),

                    'passenger_type' =>
                        $this->nullableString(
                            $source->{'InvPassenger Type'}
                        ),

                    'xo' =>
                        $this->nullableString(
                            $source->InvXO
                        ),

                    'fare' =>
                        $source->InvFare,

                    'sp_apt' =>
                        $source->{'InvSP/APT'},

                    'sf_ftt' =>
                        $source->{'InvSF/FTT'},

                    'aq_pk_yr' =>
                        $source->{'InvAQ/PK/YR'},

                    'fed_rg_cvt' =>
                        $source->{'InvFED/RG/CVT'},

                    'ced' =>
                        $source->InvCED,

                    'jo' =>
                        $source->InvJO,

                    'wh_airlines' =>
                        $source->{'InvWH Airlines'},

                    'wh_client' =>
                        $source->{'InvWH Client'},

                    'yq' =>
                        $source->InvYQ,

                    'xut' =>
                        $source->InvXUT,

                    'other' =>
                        $source->InvOther,

                    'commission_receivable' =>
                        $source->{'InvCommission Rec'},

                    'commission_paid' =>
                        $source->{'InvCommission Paid'},

                    'psf' =>
                        $source->InvPSF,

                    'other_service_charges' =>
                        $source->{'InvOther Service Charges'},

                    'discount' =>
                        $source->InvDiscount,

                    'insurance' =>
                        $source->InvInsurance,

                    'fare_2' =>
                        $source->InvFare2,

                    'fare_3' =>
                        $source->InvFare3,

                    'payable_account_2' =>
                        $this->nullableString(
                            $source->InvPayable2
                        ),

                    'payable_account_3' =>
                        $this->nullableString(
                            $source->InvPayable3
                        ),

                    'doc_rec' =>
                        $this->nullableString(
                            $source->InvDocRec
                        ),

                    'fare_nc' =>
                        $source->InvFareNC,

                    'father_name' =>
                        $this->nullableString(
                            $source->InvFatherName
                        ),

                    'birth_place' =>
                        $this->nullableString(
                            $source->InvBirthPlace
                        ),

                    'doi' =>
                        $source->InvDOI,

                    'doe' =>
                        $source->InvDOE,

                    'relation' =>
                        $this->nullableString(
                            $source->InvRelation
                        ),

                    'particulars_2' =>
                        $this->nullableString(
                            $source->InvParticulars2
                        ),

                    'particulars_3' =>
                        $this->nullableString(
                            $source->InvParticulars3
                        ),

                    'particulars_4' =>
                        $this->nullableString(
                            $source->InvParticulars4
                        ),

                    'class' =>
                        $this->nullableString(
                            $source->InvClass
                        ),

                    'xz' =>
                        $source->InvXZ,

                    'yd' =>
                        $source->InvYD,

                    'other_service_account' =>
                        $this->nullableString(
                            $source->{'Other Service Account'}
                        ),

                    'total_fare' =>
                        $source->{'Total Fare'},

                    'return_date' =>
                        $source->InvReturnDate,

                    'gds' =>
                        $this->nullableString(
                            $source->GDS
                        ),

                    'online_date' =>
                        $source->InvOnlineDate,

                    'group_no' =>
                        $this->nullableString(
                            $source->GroupNo
                        ),

                    'pst' =>
                        $source->InvPST,

                    'cnic' =>
                        $this->nullableString(
                            $source->InvCNIC
                        ),

                    'hotel_id_legacy' =>
                        $this->nullableInt(
                            $source->InvHotel
                        ),

                    'vehicle_id_legacy' =>
                        $this->nullableInt(
                            $source->InvVehicle
                        ),

                    'ref_no' =>
                        $this->nullableString(
                            $source->InvRefNo
                        ),

                    'nights' =>
                        $this->nullableInt(
                            $source->InvNights
                        ),

                    'tact_rate' =>
                        $source->InvTACTRate,

                    'gross_weight' =>
                        $source->InvGrossWeight,

                    'awc' =>
                        $source->InvAWC,

                    'fsc' =>
                        $source->InvFSC,

                    'gtc' =>
                        $source->InvGTC,

                    'ssccgc' =>
                        $source->InvSSCCGC,

                    'rate' =>
                        $source->InvRate,

                    'net_rate' =>
                        $source->InvNetRate,

                    'commission_to_client' =>
                        $source->InvCommissiontoClient,

                    'fare_including' =>
                        $source->InvFareInc,

                    'taxes_including' =>
                        $source->InvTaxesInc,

                    'currency_code' =>
                        $this->nullableString(
                            $source->Cur
                        ),

                    'currency_quantity' =>
                        $source->CurQty,

                    'currency_rate' =>
                        $source->CurRate,

                    'agent_code' =>
                        $this->nullableString(
                            $source->AgentCode
                        ),

                    'agent_amount' =>
                        $source->AgentAmount,

                    'pnr_gds' =>
                        $this->nullableString(
                            $source->PNRGDS
                        ),

                    'pst_percentage' =>
                        $source->InvPSTPercentage,

                    'pst_paid' =>
                        $source->PSTPaid,

                    'room_no' =>
                        $this->nullableString(
                            $source->RoomNo
                        ),

                    'quantity' =>
                        $source->Quantity,

                    'meal' =>
                        $this->nullableString(
                            $source->Meal
                        ),

                    'room_quantity' =>
                        $source->RoomQty,

                    'internal_ref_no' =>
                        $this->nullableString(
                            $source->InternalRefNo
                        ),

                    /*
                     * Legacy InvTickets contains both Rate
                     * and InvRateVendor. We preserve both.
                     */
                    'vendor_rate' =>
                        $source->Rate,

                    'rate_vendor' =>
                        $source->InvRateVendor,

                    'posting_date' =>
                        $source->PostingDate,

                    'room_type' =>
                        $this->nullableString(
                            $source->InvRoomType
                        ),

                    'sector_to' =>
                        $this->nullableString(
                            $source->invSectorTo
                        ),

                    'flight_information' =>
                        $this->nullableString(
                            $source->InvFlightInformation
                        ),

                    'similar_hotel' =>
                        (bool) $source->SimilarHotel,

                    'email' =>
                        $this->nullableString(
                            $source->InvEmail
                        ),

                    'nationality' =>
                        $this->nullableString(
                            $source->InvNationality
                        ),

                    'rate_wd' =>
                        $source->RateWD,

                    'rate_we' =>
                        $source->RateWE,

                    'rate_wd_payable' =>
                        $source->RateWDPayable,

                    'rate_we_payable' =>
                        $source->RateWEPayable,

                    'legacy_upsize_ts' =>
                        $source->upsize_ts,

                    'updated_at' =>
                        $source->InvOnlineDate
                        ?? $source->PostingDate
                        ?? now(),
                ];

                $existing =
                    DB::table('invoice_transactions')
                        ->where(
                            'legacy_transaction_id',
                            $legacyTransactionId
                        )
                        ->first();

                if ($existing) {
                    DB::table('invoice_transactions')
                        ->where(
                            'id',
                            $existing->id
                        )
                        ->update($data);

                    $targetId =
                        (int) $existing->id;

                    $stats['transactions_updated']++;
                } else {
                    $data['created_at'] =
                        $source->PostingDate
                        ?? $source->InvOnlineDate
                        ?? now();

                    $targetId =
                        (int) DB::table(
                            'invoice_transactions'
                        )->insertGetId(
                            $data
                        );

                    $stats['transactions_created']++;
                }

                $this->transactionMap[
                    $legacyTransactionId
                ] = $targetId;
            } catch (Throwable $e) {
                $stats['transaction_errors']++;

                $stats['errors'][] = [
                    'type' => 'transaction',
                    'id' =>
                        $source->{'InvTransuction ID'}
                        ?? null,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }
    }

    private function importPassengers(
        array &$stats
    ): void {
        $sourceRows =
            DB::connection('legacy')
                ->table('InvTickets_Passengers')
                ->orderBy('ID')
                ->get();

        $stats['source_passengers'] =
            $sourceRows->count();

        foreach ($sourceRows as $source) {
            try {
                $legacyId =
                    (int) $source->ID;

                $legacyTransactionId =
                    $this->nullableInt(
                        $source->TransactionID
                    );

                $transactionId =
                    $legacyTransactionId !== null
                    ? (
                        $this->transactionMap[
                            $legacyTransactionId
                        ] ?? null
                    )
                    : null;

                $data = [
                    'legacy_id' =>
                        $legacyId,

                    'legacy_transaction_id' =>
                        $legacyTransactionId,

                    'invoice_transaction_id' =>
                        $transactionId,

                    'passport_no' =>
                        $this->nullableString(
                            $source->PassportNo
                        ),

                    'passenger_name' =>
                        $this->nullableString(
                            $source->PassengerName
                        ),

                    'passenger_type' =>
                        $this->nullableString(
                            $source->PassengerType
                        ),

                    'mofa_no' =>
                        $this->nullableString(
                            $source->MofaNo
                        ),

                    'frc' =>
                        $source->FRC,

                    'return_case' =>
                        $source->ReturnCase,

                    'payable' =>
                        $source->Payable,

                    'receivable' =>
                        $source->Receivable,

                    'updated_at' =>
                        now(),
                ];

                $existing =
                    DB::table(
                        'invoice_transaction_passengers'
                    )
                    ->where(
                        'legacy_id',
                        $legacyId
                    )
                    ->first();

                if ($existing) {
                    DB::table(
                        'invoice_transaction_passengers'
                    )
                    ->where(
                        'id',
                        $existing->id
                    )
                    ->update($data);

                    $stats['passengers_updated']++;
                } else {
                    $data['created_at'] =
                        now();

                    DB::table(
                        'invoice_transaction_passengers'
                    )->insert($data);

                    $stats['passengers_created']++;
                }
            } catch (Throwable $e) {
                $stats['passenger_errors']++;

                $stats['errors'][] = [
                    'type' => 'passenger',
                    'id' =>
                        $source->ID ?? null,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }
    }

    private function importFareBreakups(
        array &$stats
    ): void {
        $sourceRows =
            DB::connection('legacy')
                ->table('InvTickets_FareBreakUp')
                ->orderBy('ID')
                ->get();

        $stats['source_fare_breakups'] =
            $sourceRows->count();

        foreach ($sourceRows as $source) {
            try {
                $legacyId =
                    (int) $source->ID;

                $legacyTransactionId =
                    $this->nullableInt(
                        $source->TransactionID
                    );

                $transactionId =
                    $legacyTransactionId !== null
                    ? (
                        $this->transactionMap[
                            $legacyTransactionId
                        ] ?? null
                    )
                    : null;

                $data = [
                    'legacy_id' =>
                        $legacyId,

                    'legacy_transaction_id' =>
                        $legacyTransactionId,

                    'invoice_transaction_id' =>
                        $transactionId,

                    'sector' =>
                        $this->nullableString(
                            $source->Sector
                        ),

                    'amount' =>
                        $source->Amount,

                    'commissionable' =>
                        (bool) $source->Commissionable,

                    'pnr' =>
                        $this->nullableString(
                            $source->PNR
                        ),

                    'airline' =>
                        $this->nullableString(
                            $source->Airline
                        ),

                    'flight_no' =>
                        $this->nullableString(
                            $source->FlightNo
                        ),

                    'class' =>
                        $this->nullableString(
                            $source->Class
                        ),

                    'from' =>
                        $this->nullableString(
                            $source->From
                        ),

                    'to' =>
                        $this->nullableString(
                            $source->To
                        ),

                    'departure_date' =>
                        $source->DepartureDate,

                    'etd' =>
                        $source->ETD,

                    'eta' =>
                        $source->ETA,

                    'status' =>
                        $this->nullableString(
                            $source->Status
                        ),

                    'updated_at' =>
                        now(),
                ];

                $existing =
                    DB::table(
                        'invoice_fare_breakups'
                    )
                    ->where(
                        'legacy_id',
                        $legacyId
                    )
                    ->first();

                if ($existing) {
                    DB::table(
                        'invoice_fare_breakups'
                    )
                    ->where(
                        'id',
                        $existing->id
                    )
                    ->update($data);

                    $stats['fare_breakups_updated']++;
                } else {
                    $data['created_at'] =
                        now();

                    DB::table(
                        'invoice_fare_breakups'
                    )->insert($data);

                    $stats['fare_breakups_created']++;
                }
            } catch (Throwable $e) {
                $stats['fare_breakup_errors']++;

                $stats['errors'][] = [
                    'type' => 'fare_breakup',
                    'id' =>
                        $source->ID ?? null,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }
    }

    private function importHotelRates(
        array &$stats
    ): void {
        $sourceRows =
            DB::connection('legacy')
                ->table('InvTickets_HotelRateDetails')
                ->orderBy('ID')
                ->get();

        $stats['source_hotel_rates'] =
            $sourceRows->count();

        foreach ($sourceRows as $source) {
            try {
                $legacyId =
                    (int) $source->ID;

                $legacyTransactionId =
                    $this->nullableInt(
                        $source->TransactionID
                    );

                $transactionId =
                    $legacyTransactionId !== null
                    ? (
                        $this->transactionMap[
                            $legacyTransactionId
                        ] ?? null
                    )
                    : null;

                $data = [
                    'legacy_id' =>
                        $legacyId,

                    'legacy_transaction_id' =>
                        $legacyTransactionId,

                    'invoice_transaction_id' =>
                        $transactionId,

                    'night_date' =>
                        $source->NightDate,

                    'night_rate' =>
                        $source->NightRate,

                    'night_week_day' =>
                        $this->nullableString(
                            $source->NightWeekDay
                        ),

                    'night_rate_vendor' =>
                        $source->NightRateVendor,

                    'updated_at' =>
                        now(),
                ];

                $existing =
                    DB::table(
                        'invoice_hotel_rate_details'
                    )
                    ->where(
                        'legacy_id',
                        $legacyId
                    )
                    ->first();

                if ($existing) {
                    DB::table(
                        'invoice_hotel_rate_details'
                    )
                    ->where(
                        'id',
                        $existing->id
                    )
                    ->update($data);

                    $stats['hotel_rates_updated']++;
                } else {
                    $data['created_at'] =
                        now();

                    DB::table(
                        'invoice_hotel_rate_details'
                    )->insert($data);

                    $stats['hotel_rates_created']++;
                }
            } catch (Throwable $e) {
                $stats['hotel_rate_errors']++;

                $stats['errors'][] = [
                    'type' => 'hotel_rate',
                    'id' =>
                        $source->ID ?? null,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }
    }

    private function nullableString(
        mixed $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === ''
            ? null
            : $value;
    }

    private function nullableInt(
        mixed $value
    ): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function dateValue(
        mixed $value
    ): ?string {
        if ($value === null || $value === '') {
            return null;
        }

        return date(
            'Y-m-d',
            strtotime((string) $value)
        );
    }
}