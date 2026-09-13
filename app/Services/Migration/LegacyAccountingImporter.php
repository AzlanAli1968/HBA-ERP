<?php

namespace App\Services\Migration;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class LegacyAccountingImporter
{
    private array $accountMap = [];

    private array $userMap = [];

    private array $branchMap = [];

    private array $departmentMap = [];

    private array $invoiceMap = [];

    private array $invoiceTransactionMap = [];

    private array $voucherMap = [];

    public function import(): array
    {
        $this->loadMaps();

        $stats = [
            'source_vouchers' => 0,
            'vouchers_created' => 0,
            'vouchers_updated' => 0,
            'voucher_errors' => 0,

            'source_master_lines' => 0,
            'master_lines_imported' => 0,
            'master_lines_skipped_opening' => 0,
            'master_line_errors' => 0,

            'journal_entries_created' => 0,
            'journal_entries_updated' => 0,

            'source_transactions' => 0,
            'transactions_created' => 0,
            'transactions_updated' => 0,
            'transaction_errors' => 0,

            'balanced_entries' => 0,
            'unbalanced_entries' => 0,

            'errors' => [],
        ];

        $this->importVouchers($stats);

        $this->importMasterAccounting($stats);

        $this->importLegacyTransactions($stats);

        return $stats;
    }

    private function loadMaps(): void
    {
        $this->accountMap = [];

        foreach (
            DB::table('accounts')
                ->select('id', 'code')
                ->get()
            as $row
        ) {
            $code = $this->stringValue($row->code);

            if ($code !== null) {
                $this->accountMap[$code] = (int) $row->id;
            }
        }

        $this->userMap = [];

        foreach (
            DB::table('users')
                ->whereNotNull('legacy_username')
                ->select('id', 'legacy_username')
                ->get()
            as $row
        ) {
            $username = $this->stringValue(
                $row->legacy_username
            );

            if ($username !== null) {
                $this->userMap[strtoupper($username)] =
                    (int) $row->id;
            }
        }

        $this->branchMap = [];

        foreach (
            DB::table('branches')
                ->select('id', 'legacy_id')
                ->get()
            as $row
        ) {
            $this->branchMap[(int) $row->legacy_id] =
                (int) $row->id;
        }

        $this->departmentMap = [];

        foreach (
            DB::table('departments')
                ->select('id', 'legacy_id')
                ->get()
            as $row
        ) {
            $this->departmentMap[(int) $row->legacy_id] =
                (int) $row->id;
        }

        $this->invoiceMap = [];

        foreach (
            DB::table('invoices')
                ->select('id', 'legacy_invoice_id')
                ->get()
            as $row
        ) {
            $this->invoiceMap[(int) $row->legacy_invoice_id] =
                (int) $row->id;
        }

        $this->invoiceTransactionMap = [];

        foreach (
            DB::table('invoice_transactions')
                ->select('id', 'legacy_transaction_id')
                ->get()
            as $row
        ) {
            $this->invoiceTransactionMap[
                (int) $row->legacy_transaction_id
            ] = (int) $row->id;
        }
    }

    private function importVouchers(
        array &$stats
    ): void {
        $now = now();

        $sourceRows = DB::connection('legacy')
            ->table('Vouchers')
            ->orderBy('Voucher ID')
            ->get();

        $stats['source_vouchers'] =
            $sourceRows->count();

        $batch = [];

        foreach ($sourceRows as $source) {
            try {
                $legacyId = $this->intValue(
                    $this->value(
                        $source,
                        'Voucher ID'
                    )
                );

                if ($legacyId === null) {
                    throw new RuntimeException(
                        'Voucher ID is missing.'
                    );
                }

                $enteredBy = $this->stringValue(
                    $this->value(
                        $source,
                        'VEnteredby'
                    )
                );

                $createdBy = null;

                if ($enteredBy !== null) {
                    $createdBy =
                        $this->userMap[
                            strtoupper($enteredBy)
                        ] ?? null;
                }

                $legacyBranchId = $this->intValue(
                    $this->value(
                        $source,
                        'Branch'
                    )
                );

                $legacyDepartmentId = $this->intValue(
                    $this->value(
                        $source,
                        'Department'
                    )
                );

                $branchId =
                    $legacyBranchId !== null
                    ? (
                        $this->branchMap[
                            $legacyBranchId
                        ] ?? null
                    )
                    : null;

                $departmentId =
                    $legacyDepartmentId !== null
                    ? (
                        $this->departmentMap[
                            $legacyDepartmentId
                        ] ?? null
                    )
                    : null;

                $cashBankCode = $this->stringValue(
                    $this->value(
                        $source,
                        'Cash/Bank Account'
                    )
                );

                $cashBankAccountId =
                    $cashBankCode !== null
                    ? (
                        $this->accountMap[
                            $cashBankCode
                        ] ?? null
                    )
                    : null;

                if (
                    $cashBankCode !== null
                    && $cashBankAccountId === null
                ) {
                    throw new RuntimeException(
                        "Cash/Bank account {$cashBankCode} " .
                        "does not exist in HBA ERP."
                    );
                }

                $batch[] = [
                    'legacy_voucher_id' =>
                        $legacyId,

                    'voucher_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Voucher No'
                            )
                        ),

                    'voucher_date' =>
                        $this->value(
                            $source,
                            'Voucher Date'
                        ),

                    'voucher_type' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Voucher Type'
                            )
                        ),

                    'cash_bank_account_code' =>
                        $cashBankCode,

                    'cash_bank_account_id' =>
                        $cashBankAccountId,

                    'created_by' =>
                        $createdBy,

                    'legacy_entered_by' =>
                        $enteredBy,

                    'entry_date' =>
                        $this->value(
                            $source,
                            'VEntrydate'
                        ),

                    'ref_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Ref No'
                            )
                        ),

                    'combine_voucher' =>
                        (bool) $this->value(
                            $source,
                            'CombineVoucher'
                        ),

                    'supervised' =>
                        (bool) $this->value(
                            $source,
                            'Supervised'
                        ),

                    'supervised_by' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'SupervisedBy'
                            )
                        ),

                    'branch_id' =>
                        $branchId,

                    'department_id' =>
                        $departmentId,

                    'legacy_branch_id' =>
                        $legacyBranchId,

                    'legacy_department_id' =>
                        $legacyDepartmentId,

                    'legacy_data' =>
                        $this->json(
                            $source
                        ),

                    'created_at' =>
                        $now,

                    'updated_at' =>
                        $now,
                ];

                if (count($batch) >= 500) {
                    $this->upsertVouchers(
                        $batch,
                        $stats
                    );

                    $batch = [];
                }
            } catch (Throwable $e) {
                $stats['voucher_errors']++;

                $stats['errors'][] = [
                    'type' => 'voucher',
                    'id' =>
                        $this->value(
                            $source,
                            'Voucher ID'
                        ),
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }

        if (! empty($batch)) {
            $this->upsertVouchers(
                $batch,
                $stats
            );
        }

        $this->voucherMap = [];

        foreach (
            DB::table('vouchers')
                ->select('id', 'legacy_voucher_id')
                ->get()
            as $row
        ) {
            $this->voucherMap[
                (int) $row->legacy_voucher_id
            ] = (int) $row->id;
        }
    }

    private function upsertVouchers(
        array $rows,
        array &$stats
    ): void {
        $existingIds = DB::table('vouchers')
            ->whereIn(
                'legacy_voucher_id',
                array_column(
                    $rows,
                    'legacy_voucher_id'
                )
            )
            ->pluck(
                'legacy_voucher_id'
            )
            ->map(
                fn ($value) => (int) $value
            )
            ->all();

        DB::table('vouchers')->upsert(
            $rows,
            ['legacy_voucher_id'],
            [
                'voucher_no',
                'voucher_date',
                'voucher_type',
                'cash_bank_account_code',
                'cash_bank_account_id',
                'created_by',
                'legacy_entered_by',
                'entry_date',
                'ref_no',
                'combine_voucher',
                'supervised',
                'supervised_by',
                'branch_id',
                'department_id',
                'legacy_branch_id',
                'legacy_department_id',
                'legacy_data',
                'updated_at',
            ]
        );

        foreach ($rows as $row) {
            if (
                in_array(
                    (int) $row['legacy_voucher_id'],
                    $existingIds,
                    true
                )
            ) {
                $stats['vouchers_updated']++;
            } else {
                $stats['vouchers_created']++;
            }
        }
    }

    private function importMasterAccounting(
        array &$stats
    ): void {
        /*
         * First pass:
         * build accounting groups without loading all Master rows
         * into memory.
         */
        $groups = [];

        foreach (
            DB::connection('legacy')
                ->table('Master')
                ->orderBy('ID')
                ->cursor()
            as $source
        ) {
            $stats['source_master_lines']++;

            $legacyId = $this->intValue(
                $this->value($source, 'ID')
            );

            $voucherReferenceId = $this->intValue(
                $this->value(
                    $source,
                    'Voucher ID'
                )
            );

            if (
                $legacyId === null
                || $voucherReferenceId === null
            ) {
                $stats['master_line_errors']++;

                $stats['errors'][] = [
                    'type' => 'master',
                    'id' => $legacyId,
                    'message' =>
                        'Missing Master ID or Voucher ID.',
                ];

                continue;
            }

            $voucherType =
                $this->stringValue(
                    $this->value(
                        $source,
                        'Voucher Type'
                    )
                ) ?? 'UNKNOWN';

            /*
             * Opening balance records are already represented
             * in account_opening_balances.
             */
            if (strtoupper($voucherType) === 'O') {
                $stats['master_lines_skipped_opening']++;
                continue;
            }

            $referenceType =
                $this->referenceType(
                    $voucherType
                );

            $systemId =
                $this->intValue(
                    $this->value(
                        $source,
                        'System ID'
                    )
                );

            $groupSystemId =
                $this->usesVoucherSystemId($voucherType)
                    ? $systemId
                    : null;

            $groupKey = $this->journalKey(
                $referenceType,
                $voucherReferenceId,
                $groupSystemId,
                $voucherType
            );

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'reference_type' =>
                        $referenceType,

                    'reference_id' =>
                        $voucherReferenceId,

                    'system_id' =>
                        $groupSystemId,

                    'voucher_type' =>
                        $voucherType,

                    'total_debit' =>
                        0.0,

                    'total_credit' =>
                        0.0,

                    'line_count' =>
                        0,

                    'entry_date' =>
                        $this->value(
                            $source,
                            'Posting Date'
                        ),

                    'last_posting_date' =>
                        $this->value(
                            $source,
                            'Posting Date'
                        ),

                    'modes' => [],

                    'system_ids' => [],

                    'created_by' => null,

                    'branch_id' => null,

                    'department_id' => null,

                    'legacy_branch_id' => null,

                    'legacy_department_id' => null,
                ];
            }

            $group =& $groups[$groupKey];

            $debit = (float) (
                $this->value(
                    $source,
                    'Debit'
                ) ?? 0
            );

            $credit = (float) (
                $this->value(
                    $source,
                    'Credit'
                ) ?? 0
            );

            $group['total_debit'] += $debit;
            $group['total_credit'] += $credit;
            $group['line_count']++;

            $postingDate =
                $this->value(
                    $source,
                    'Posting Date'
                );

            if (
                $postingDate !== null
                && (
                    $group['last_posting_date'] === null
                    || strtotime((string) $postingDate)
                        >
                    strtotime(
                        (string) $group['last_posting_date']
                    )
                )
            ) {
                $group['last_posting_date'] =
                    $postingDate;
            }

            $mode =
                $this->stringValue(
                    $this->value(
                        $source,
                        'Mode'
                    )
                );

            if ($mode !== null) {
                $group['modes'][$mode] = true;
            }

            if ($systemId !== null) {
                $group['system_ids'][
                    (string) $systemId
                ] = true;
            }

            $entryBy =
                $this->stringValue(
                    $this->value(
                        $source,
                        'EntryBy'
                    )
                );

            if (
                $group['created_by'] === null
                && $entryBy !== null
            ) {
                $group['created_by'] =
                    $this->userMap[
                        strtoupper($entryBy)
                    ] ?? null;
            }

            $legacyBranchId =
                $this->intValue(
                    $this->value(
                        $source,
                        'Branch'
                    )
                );

            $legacyDepartmentId =
                $this->intValue(
                    $this->value(
                        $source,
                        'Department'
                    )
                );

            if (
                $group['legacy_branch_id'] === null
            ) {
                $group['legacy_branch_id'] =
                    $legacyBranchId;

                $group['branch_id'] =
                    $legacyBranchId !== null
                    ? (
                        $this->branchMap[
                            $legacyBranchId
                        ] ?? null
                    )
                    : null;
            }

            if (
                $group['legacy_department_id'] === null
            ) {
                $group['legacy_department_id'] =
                    $legacyDepartmentId;

                $group['department_id'] =
                    $legacyDepartmentId !== null
                    ? (
                        $this->departmentMap[
                            $legacyDepartmentId
                        ] ?? null
                    )
                    : null;
            }

            unset($group);
        }

        /*
         * Create/update journal headers.
         */
        $journalBatch = [];
        $now = now();

        foreach ($groups as $group) {
            $voucherId = null;
            $invoiceId = null;

            if (
                $group['reference_type'] === 'voucher'
                && $group['system_id'] !== null
            ) {
                $voucherId =
                    $this->voucherMap[
                        $group['system_id']
                    ] ?? null;
            }

            if (
                $group['reference_type'] === 'invoice'
                || $group['reference_type'] === 'refund'
            ) {
                $invoiceId =
                    $this->invoiceMap[
                        $group['reference_id']
                    ] ?? null;
            }

            $isBalanced =
                abs(
                    $group['total_debit']
                    -
                    $group['total_credit']
                ) < 0.00005;

            if ($isBalanced) {
                $stats['balanced_entries']++;
            } else {
                $stats['unbalanced_entries']++;
            }

            $legacyData = [
                'reference_type' =>
                    $group['reference_type'],

                'reference_id' =>
                    $group['reference_id'],

                'voucher_type' =>
                    $group['voucher_type'],

                'source_modes' =>
                    array_keys(
                        $group['modes']
                    ),

                'source_system_ids' =>
                    array_keys(
                        $group['system_ids']
                    ),
            ];

            $journalBatch[] = [
                'legacy_reference_type' =>
                    $group['reference_type'],

                'legacy_reference_id' =>
                    $group['reference_id'],

                'legacy_system_id' =>
                    $group['system_id'],

                'voucher_type' =>
                    $group['voucher_type'],

                'voucher_id' =>
                    $voucherId,

                'invoice_id' =>
                    $invoiceId,

                'created_by' =>
                    $group['created_by'],

                'branch_id' =>
                    $group['branch_id'],

                'department_id' =>
                    $group['department_id'],

                'legacy_branch_id' =>
                    $group['legacy_branch_id'],

                'legacy_department_id' =>
                    $group['legacy_department_id'],

                'entry_date' =>
                    $group['entry_date'],

                'last_posting_date' =>
                    $group['last_posting_date'],

                'source_modes' =>
                    implode(
                        ', ',
                        array_keys(
                            $group['modes']
                        )
                    ),

                'source_system_ids' =>
                    implode(
                        ', ',
                        array_keys(
                            $group['system_ids']
                        )
                    ),

                'total_debit' =>
                    $group['total_debit'],

                'total_credit' =>
                    $group['total_credit'],

                'line_count' =>
                    $group['line_count'],

                'is_balanced' =>
                    $isBalanced,

                'legacy_data' =>
                    $this->json(
                        $legacyData
                    ),

                'created_at' =>
                    $now,

                'updated_at' =>
                    $now,
            ];

            if (count($journalBatch) >= 500) {
                $this->upsertJournalEntries(
                    $journalBatch,
                    $stats
                );

                $journalBatch = [];
            }
        }

        if (! empty($journalBatch)) {
            $this->upsertJournalEntries(
                $journalBatch,
                $stats
            );
        }

        /*
         * Build target journal group map.
         */
        $journalMap = [];

        foreach (
            DB::table('journal_entries')
                ->select(
                    'id',
                    'legacy_reference_type',
                    'legacy_reference_id',
                    'legacy_system_id',
                    'voucher_type'
                )
                ->get()
            as $entry
        ) {
            $journalMap[
                $this->journalKey(
                    $entry->legacy_reference_type,
                    (int) $entry->legacy_reference_id,
                    $entry->legacy_system_id !== null
                        ? (int) $entry->legacy_system_id
                        : null,
                    $entry->voucher_type
                )
            ] = (int) $entry->id;
        }

        /*
         * Second pass:
         * import the actual Master accounting lines.
         */
        $lineBatch = [];

        foreach (
            DB::connection('legacy')
                ->table('Master')
                ->orderBy('ID')
                ->cursor()
            as $source
        ) {
            $legacyMasterId =
                $this->intValue(
                    $this->value(
                        $source,
                        'ID'
                    )
                );

            $legacyReferenceId =
                $this->intValue(
                    $this->value(
                        $source,
                        'Voucher ID'
                    )
                );

            if (
                $legacyMasterId === null
                || $legacyReferenceId === null
            ) {
                continue;
            }

            $voucherType =
                $this->stringValue(
                    $this->value(
                        $source,
                        'Voucher Type'
                    )
                ) ?? 'UNKNOWN';

            if (strtoupper($voucherType) === 'O') {
                continue;
            }

            $referenceType =
                $this->referenceType(
                    $voucherType
                );

            $systemId =
                $this->intValue(
                    $this->value(
                        $source,
                        'System ID'
                    )
                );

            $groupSystemId =
                $this->usesVoucherSystemId($voucherType)
                    ? $systemId
                    : null;

            $journalKey = $this->journalKey(
                $referenceType,
                $legacyReferenceId,
                $groupSystemId,
                $voucherType
            );

            if (! isset($journalMap[$journalKey])) {
                $stats['master_line_errors']++;

                $stats['errors'][] = [
                    'type' => 'master',
                    'id' =>
                        $legacyMasterId,
                    'message' =>
                        'Journal entry group was not created.',
                ];

                continue;
            }

            $accountCode =
                $this->stringValue(
                    $this->value(
                        $source,
                        'Account Code'
                    )
                );

            if (
                $accountCode === null
                || ! isset(
                    $this->accountMap[
                        $accountCode
                    ]
                )
            ) {
                $stats['master_line_errors']++;

                $stats['errors'][] = [
                    'type' => 'master',
                    'id' =>
                        $legacyMasterId,
                    'message' =>
                        "Account {$accountCode} " .
                        "does not exist in HBA ERP.",
                ];

                continue;
            }

            $invoiceId = null;

            if (
                $referenceType === 'invoice'
                || $referenceType === 'refund'
            ) {
                $invoiceId =
                    $this->invoiceMap[
                        $legacyReferenceId
                    ] ?? null;
            }

            $voucherId = null;

            if (
                $referenceType === 'voucher'
                && $systemId !== null
            ) {
                $voucherId =
                    $this->voucherMap[
                        $systemId
                    ] ?? null;
            }

            $branchLegacyId =
                $this->intValue(
                    $this->value(
                        $source,
                        'Branch'
                    )
                );

            $departmentLegacyId =
                $this->intValue(
                    $this->value(
                        $source,
                        'Department'
                    )
                );

            $lineBatch[] = [
                'journal_entry_id' =>
                    $journalMap[$journalKey],

                'legacy_master_id' =>
                    $legacyMasterId,

                'legacy_reference_id' =>
                    $legacyReferenceId,

                'legacy_system_id' =>
                    $this->intValue(
                        $this->value(
                            $source,
                            'System ID'
                        )
                    ),

                'legacy_reference_type' =>
                    $referenceType,

                'voucher_type' =>
                    $voucherType,

                'mode' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Mode'
                        )
                    ),

                'account_id' =>
                    $this->accountMap[
                        $accountCode
                    ],

                'account_code' =>
                    $accountCode,

                'debit' =>
                    (float) (
                        $this->value(
                            $source,
                            'Debit'
                        ) ?? 0
                    ),

                'credit' =>
                    (float) (
                        $this->value(
                            $source,
                            'Credit'
                        ) ?? 0
                    ),

                'voucher_date' =>
                    $this->value(
                        $source,
                        'Voucher Date'
                    ),

                'posting_date' =>
                    $this->value(
                        $source,
                        'Posting Date'
                    ),

                'voucher_id' =>
                    $voucherId,

                'invoice_id' =>
                    $invoiceId,

                'branch_id' =>
                    $branchLegacyId !== null
                    ? (
                        $this->branchMap[
                            $branchLegacyId
                        ] ?? null
                    )
                    : null,

                'department_id' =>
                    $departmentLegacyId !== null
                    ? (
                        $this->departmentMap[
                            $departmentLegacyId
                        ] ?? null
                    )
                    : null,

                'legacy_branch_id' =>
                    $branchLegacyId,

                'legacy_department_id' =>
                    $departmentLegacyId,

                'currency_code' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Cur'
                        )
                    ),

                'currency_quantity' =>
                    $this->decimalValue(
                        $this->value(
                            $source,
                            'CurQty'
                        )
                    ),

                'currency_rate' =>
                    $this->decimalValue(
                        $this->value(
                            $source,
                            'CurRate'
                        )
                    ),

                'foreign_debit' =>
                    $this->decimalValue(
                        $this->value(
                            $source,
                            'CurDr'
                        )
                    ),

                'foreign_credit' =>
                    $this->decimalValue(
                        $this->value(
                            $source,
                            'CurCr'
                        )
                    ),

                'profit' =>
                    $this->decimalValue(
                        $this->value(
                            $source,
                            'Profit'
                        )
                    ),

                'legacy_invoice_no' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Inv No'
                        )
                    ),

                'legacy_invoice_no_2' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Inv No2'
                        )
                    ),

                'ticket_no' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Ticket No'
                        )
                    ),

                'con_ticket_no' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Con Ticket No'
                        )
                    ),

                'passenger' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Passenger'
                        )
                    ),

                'mode_description' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Mode'
                        )
                    ),

                'sector_description' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Sector/Description'
                        )
                    ),

                'fare_taxes_service' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Fare/Taxes/Service'
                        )
                    ),

                'entry_by' =>
                    $this->stringValue(
                        $this->value(
                            $source,
                            'EntryBy'
                        )
                    ),

                'umrah_query_id' =>
                    $this->intValue(
                        $this->value(
                            $source,
                            'UmrahQueryID'
                        )
                    ),

                'legacy_data' =>
                    $this->json(
                        $source
                    ),

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ];

            if (count($lineBatch) >= 500) {
                DB::table(
                    'journal_entry_lines'
                )->upsert(
                    $lineBatch,
                    ['legacy_master_id'],
                    [
                        'journal_entry_id',
                        'legacy_reference_id',
                        'legacy_system_id',
                        'legacy_reference_type',
                        'voucher_type',
                        'mode',
                        'account_id',
                        'account_code',
                        'debit',
                        'credit',
                        'voucher_date',
                        'posting_date',
                        'voucher_id',
                        'invoice_id',
                        'branch_id',
                        'department_id',
                        'legacy_branch_id',
                        'legacy_department_id',
                        'currency_code',
                        'currency_quantity',
                        'currency_rate',
                        'foreign_debit',
                        'foreign_credit',
                        'profit',
                        'legacy_invoice_no',
                        'legacy_invoice_no_2',
                        'ticket_no',
                        'con_ticket_no',
                        'passenger',
                        'mode_description',
                        'sector_description',
                        'fare_taxes_service',
                        'entry_by',
                        'umrah_query_id',
                        'legacy_data',
                        'updated_at',
                    ]
                );

                $stats['master_lines_imported'] +=
                    count($lineBatch);

                $lineBatch = [];
            }
        }

        if (! empty($lineBatch)) {
            DB::table(
                'journal_entry_lines'
            )->upsert(
                $lineBatch,
                ['legacy_master_id'],
                [
                    'journal_entry_id',
                    'legacy_reference_id',
                    'legacy_system_id',
                    'legacy_reference_type',
                    'voucher_type',
                    'mode',
                    'account_id',
                    'account_code',
                    'debit',
                    'credit',
                    'voucher_date',
                    'posting_date',
                    'voucher_id',
                    'invoice_id',
                    'branch_id',
                    'department_id',
                    'legacy_branch_id',
                    'legacy_department_id',
                    'currency_code',
                    'currency_quantity',
                    'currency_rate',
                    'foreign_debit',
                    'foreign_credit',
                    'profit',
                    'legacy_invoice_no',
                    'legacy_invoice_no_2',
                    'ticket_no',
                    'con_ticket_no',
                    'passenger',
                    'mode_description',
                    'sector_description',
                    'fare_taxes_service',
                    'entry_by',
                    'umrah_query_id',
                    'legacy_data',
                    'updated_at',
                ]
            );

            $stats['master_lines_imported'] +=
                count($lineBatch);
        }
    }

    private function upsertJournalEntries(
        array $rows,
        array &$stats
    ): void {
        $existing = [];

        foreach ($rows as $row) {
            $key = $this->journalKey(
                $row['legacy_reference_type'],
                (int) $row['legacy_reference_id'],
                $row['legacy_system_id'] !== null
                    ? (int) $row['legacy_system_id']
                    : null,
                $row['voucher_type']
            );

            $exists = DB::table('journal_entries')
                ->where(
                    'legacy_reference_type',
                    $row['legacy_reference_type']
                )
                ->where(
                    'legacy_reference_id',
                    $row['legacy_reference_id']
                )
                ->where(
                    'voucher_type',
                    $row['voucher_type']
                )
                ->when(
                    $row['legacy_system_id'] === null,
                    fn ($query) => $query->whereNull(
                        'legacy_system_id'
                    ),
                    fn ($query) => $query->where(
                        'legacy_system_id',
                        $row['legacy_system_id']
                    )
                )
                ->exists();

            if ($exists) {
                $existing[$key] = true;
            }
        }

        DB::table('journal_entries')->upsert(
            $rows,
            [
                'legacy_reference_type',
                'legacy_reference_id',
                'legacy_system_id',
                'voucher_type',
            ],
            [
                'voucher_id',
                'invoice_id',
                'created_by',
                'branch_id',
                'department_id',
                'legacy_branch_id',
                'legacy_department_id',
                'entry_date',
                'last_posting_date',
                'source_modes',
                'source_system_ids',
                'total_debit',
                'total_credit',
                'line_count',
                'is_balanced',
                'legacy_data',
                'updated_at',
            ]
        );

        foreach ($rows as $row) {
            $key = $this->journalKey(
                $row['legacy_reference_type'],
                (int) $row['legacy_reference_id'],
                $row['legacy_system_id'] !== null
                    ? (int) $row['legacy_system_id']
                    : null,
                $row['voucher_type']
            );

            if (isset($existing[$key])) {
                $stats['journal_entries_updated']++;
            } else {
                $stats['journal_entries_created']++;
            }
        }
    }

    private function importLegacyTransactions(
        array &$stats
    ): void {
        $stats['source_transactions'] =
            DB::connection('legacy')
                ->table('Transuction')
                ->count();

        $batch = [];

        foreach (
            DB::connection('legacy')
                ->table('Transuction')
                ->orderBy('Transuction ID')
                ->cursor()
            as $source
        ) {
            try {
                $legacyTransactionId =
                    $this->intValue(
                        $this->value(
                            $source,
                            'Transuction ID'
                        )
                    );

                if ($legacyTransactionId === null) {
                    throw new RuntimeException(
                        'Transuction ID is missing.'
                    );
                }

                $legacyVoucherId =
                    $this->intValue(
                        $this->value(
                            $source,
                            'Voucher ID'
                        )
                    );

                $voucherId =
                    $legacyVoucherId !== null
                    ? (
                        $this->voucherMap[
                            $legacyVoucherId
                        ] ?? null
                    )
                    : null;

                $accountCode =
                    $this->stringValue(
                        $this->value(
                            $source,
                            'Account Code'
                        )
                    );

                $accountId = null;

                if ($accountCode !== null) {
                    $accountId =
                        $this->accountMap[
                            $accountCode
                        ] ?? null;

                    if ($accountId === null) {
                        throw new RuntimeException(
                            "Account {$accountCode} " .
                            "does not exist in HBA ERP."
                        );
                    }
                }

                $invoiceTransactionId =
                    $this->invoiceTransactionMap[
                        $legacyTransactionId
                    ] ?? null;

                $batch[] = [
                    'legacy_transaction_id' =>
                        $legacyTransactionId,

                    'legacy_voucher_id' =>
                        $legacyVoucherId,

                    'voucher_id' =>
                        $voucherId,

                    'invoice_transaction_id' =>
                        $invoiceTransactionId,

                    'account_id' =>
                        $accountId,

                    'account_code' =>
                        $accountCode,

                    'form_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Form No'
                            )
                        ),

                    'legacy_invoice_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Inv No'
                            )
                        ),

                    'legacy_invoice_no_2' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Inv No2'
                            )
                        ),

                    'refund_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Rfd No'
                            )
                        ),

                    'particulars' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Particulars'
                            )
                        ),

                    'cheque_no' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Cheque No'
                            )
                        ),

                    'debit' =>
                        (float) (
                            $this->value(
                                $source,
                                'Debit'
                            ) ?? 0
                        ),

                    'credit' =>
                        (float) (
                            $this->value(
                                $source,
                                'Credit'
                            ) ?? 0
                        ),

                    'posting_date' =>
                        $this->value(
                            $source,
                            'Posting Date'
                        ),

                    'cleared' =>
                        (bool) $this->value(
                            $source,
                            'Cleared'
                        ),

                    'currency_code' =>
                        $this->stringValue(
                            $this->value(
                                $source,
                                'Cur'
                            )
                        ),

                    'currency_quantity' =>
                        $this->decimalValue(
                            $this->value(
                                $source,
                                'CurQty'
                            )
                        ),

                    'currency_rate' =>
                        $this->decimalValue(
                            $this->value(
                                $source,
                                'CurRate'
                            )
                        ),

                    'currency_debit' =>
                        $this->decimalValue(
                            $this->value(
                                $source,
                                'CurDr'
                            )
                        ),

                    'currency_credit' =>
                        $this->decimalValue(
                            $this->value(
                                $source,
                                'CurCr'
                            )
                        ),

                    'payee_account_only' =>
                        (bool) (
                            $this->value(
                                $source,
                                'Payee Account Only',
                                'PayeeAccountOnly'
                            ) ?? false
                        ),

                    'umrah_query_id' =>
                        $this->intValue(
                            $this->value(
                                $source,
                                'UmrahQueryID'
                            )
                        ),

                    'legacy_data' =>
                        $this->json(
                            $source
                        ),

                    'created_at' =>
                        now(),

                    'updated_at' =>
                        now(),
                ];

                if (count($batch) >= 500) {
                    $this->upsertLegacyTransactions(
                        $batch,
                        $stats
                    );

                    $batch = [];
                }
            } catch (Throwable $e) {
                $stats['transaction_errors']++;

                $stats['errors'][] = [
                    'type' => 'transaction',
                    'id' =>
                        $this->value(
                            $source,
                            'Transuction ID'
                        ),
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }

        if (! empty($batch)) {
            $this->upsertLegacyTransactions(
                $batch,
                $stats
            );
        }
    }

    private function upsertLegacyTransactions(
        array $rows,
        array &$stats
    ): void {
        $existingIds =
            DB::table('legacy_transactions')
                ->whereIn(
                    'legacy_transaction_id',
                    array_column(
                        $rows,
                        'legacy_transaction_id'
                    )
                )
                ->pluck(
                    'legacy_transaction_id'
                )
                ->map(
                    fn ($value) => (int) $value
                )
                ->all();

        DB::table('legacy_transactions')->upsert(
            $rows,
            ['legacy_transaction_id'],
            [
                'legacy_voucher_id',
                'voucher_id',
                'invoice_transaction_id',
                'account_id',
                'account_code',
                'form_no',
                'legacy_invoice_no',
                'legacy_invoice_no_2',
                'refund_no',
                'particulars',
                'cheque_no',
                'debit',
                'credit',
                'posting_date',
                'cleared',
                'currency_code',
                'currency_quantity',
                'currency_rate',
                'currency_debit',
                'currency_credit',
                'payee_account_only',
                'umrah_query_id',
                'legacy_data',
                'updated_at',
            ]
        );

        foreach ($rows as $row) {
            if (
                in_array(
                    (int) $row['legacy_transaction_id'],
                    $existingIds,
                    true
                )
            ) {
                $stats['transactions_updated']++;
            } else {
                $stats['transactions_created']++;
            }
        }
    }

    private function referenceType(
        string $voucherType
    ): string {
        return match (strtoupper(trim($voucherType))) {
            'INV' => 'invoice',
            'RFD' => 'refund',
            'BP',
            'BR',
            'CP',
            'CR',
            'JV' => 'voucher',
            default => 'unknown',
        };
    }

    private function usesVoucherSystemId(
        string $voucherType
    ): bool {
        return in_array(
            strtoupper(trim($voucherType)),
            [
                'BP',
                'BR',
                'CP',
                'CR',
                'JV',
            ],
            true
        );
    }

    private function journalKey(
        string $referenceType,
        int $referenceId,
        ?int $systemId,
        string $voucherType
    ): string {
        return $referenceType .
            '|' .
            $referenceId .
            '|' .
            ($systemId ?? 0) .
            '|' .
            $voucherType;
    }

    private function value(
        object $row,
        string ...$names
    ): mixed {
        foreach ($names as $name) {
            if (property_exists($row, $name)) {
                return $row->{$name};
            }
        }

        return null;
    }

    private function stringValue(
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

    private function intValue(
        mixed $value
    ): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function decimalValue(
        mixed $value
    ): ?float {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }

    private function json(
        mixed $value
    ): ?string {
        $array =
            is_object($value)
            ? (array) $value
            : $value;

        $encoded = json_encode(
            $array,
            JSON_UNESCAPED_UNICODE |
            JSON_INVALID_UTF8_SUBSTITUTE
        );

        return $encoded === false
            ? null
            : $encoded;
    }
}