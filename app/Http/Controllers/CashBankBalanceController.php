<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CashBankBalanceController extends Controller
{
    /**
     * Cached per-request resolver for current/legacy cash account identities.
     */
    private ?array $cashAccountDirectoryCache = null;

    public function index(Request $request): Response
    {
        [$asOfDate, $search] = $this->filters($request);

        $accounts = $this->cashBankAccounts($search);
        $baseOpening = $this->baseOpeningMap();
        $movements = $this->baseMovementMap($asOfDate);

        $rows = [];
        foreach ($accounts as $account) {
            $opening = $baseOpening[(int) $account->id] ?? [
                'debit' => 0.0,
                'credit' => 0.0,
            ];

            $movement = $movements[(int) $account->id] ?? [
                'debit' => 0.0,
                'credit' => 0.0,
            ];

            $openingNet = $opening['debit'] - $opening['credit'];
            $balance = $openingNet + $movement['debit'] - $movement['credit'];

            $rows[] = [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
                'opening_debit' => round($opening['debit'], 4),
                'opening_credit' => round($opening['credit'], 4),
                'debit' => round($movement['debit'], 4),
                'credit' => round($movement['credit'], 4),
                'balance' => round($balance, 4),
                'branch_id' => $account->branch_id !== null ? (int) $account->branch_id : null,
                'branch_name' => (string) ($account->branch_name ?? 'Head Office'),
                'group_name' => (string) ($account->group_name ?? 'Petty Cash & Bank'),
            ];
        }

        usort($rows, fn (array $a, array $b) => [$a['branch_name'], $a['code']] <=> [$b['branch_name'], $b['code']]);

        $groups = [];
        foreach ($rows as $row) {
            $key = ($row['branch_id'] ?? 'none') . '|' . $row['group_name'];

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'branch_id' => $row['branch_id'],
                    'branch_name' => $row['branch_name'],
                    'group_name' => $row['group_name'],
                    'rows' => [],
                    'totals' => $this->emptyTotals(),
                ];
            }

            $groups[$key]['rows'][] = [
                'id' => $row['id'],
                'code' => $row['code'],
                'name' => $row['name'],
                'opening_debit' => $row['opening_debit'],
                'opening_credit' => $row['opening_credit'],
                'debit' => $row['debit'],
                'credit' => $row['credit'],
                'balance' => $row['balance'],
            ];

            $groups[$key]['totals']['opening_debit'] += $row['opening_debit'];
            $groups[$key]['totals']['opening_credit'] += $row['opening_credit'];
            $groups[$key]['totals']['debit'] += $row['debit'];
            $groups[$key]['totals']['credit'] += $row['credit'];
            $groups[$key]['totals']['balance'] += $row['balance'];
        }

        $grandTotals = $this->emptyTotals();
        foreach ($groups as &$group) {
            foreach (array_keys($grandTotals) as $key) {
                $group['totals'][$key] = round($group['totals'][$key], 4);
                $grandTotals[$key] += $group['totals'][$key];
            }
        }
        unset($group);

        return Inertia::render('Accounting/CashBankBalances/Index', [
            'companyName' => 'HBA TRAVEL & TOURS',
            'companyTagline' => 'EXCELLENCE IN HOSPITALITY AND TRAVELS',
            'reportTitle' => 'Accounts Current Position',
            'asOfDate' => $asOfDate,
            'printedAt' => now()->format('d/m/Y h:i:s A'),
            'search' => $search,
            'groups' => array_values($groups),
            'grandTotals' => array_map(fn ($value) => round($value, 4), $grandTotals),
        ]);
    }

    public function foreignCurrencies(Request $request): Response
    {
        [$asOfDate, $search] = $this->filters($request);

        $accounts = $this->cashBankAccounts($search);
        $baseOpening = $this->baseOpeningMap();
        $baseMovement = $this->baseOnlyMovementMap($asOfDate);
        $opening = $this->foreignOpeningMap();
        $movement = $this->foreignMovementMap($asOfDate);

        $byCurrency = [];

        foreach ($accounts as $account) {
            $accountId = (int) $account->id;

            $baseOpen = $baseOpening[$accountId] ?? ['debit' => 0.0, 'credit' => 0.0];
            $baseMove = $baseMovement[$accountId] ?? ['debit' => 0.0, 'credit' => 0.0];
            $baseBalance =
                ((float) $baseOpen['debit'] - (float) $baseOpen['credit'])
                + ((float) $baseMove['debit'] - (float) $baseMove['credit']);

            if (abs($baseBalance) >= 0.00005) {
                $byCurrency[''][] = [
                    'id' => $accountId,
                    'code' => (string) $account->code,
                    'name' => (string) $account->name,
                    'currency' => '',
                    'amount' => round($baseBalance, 4),
                ];
            }

            $accountOpening = $opening[$accountId] ?? [];
            $accountMovement = $movement[$accountId] ?? [];

            $currencies = array_unique(array_merge(
                array_keys($accountOpening),
                array_keys($accountMovement),
            ));

            foreach ($currencies as $currency) {
                $currency = trim((string) $currency);
                $open = (float) ($accountOpening[$currency] ?? 0.0);
                $move = (float) ($accountMovement[$currency] ?? 0.0);
                $balance = $open + $move;

                if (abs($balance) < 0.00005 && abs($open) < 0.00005 && abs($move) < 0.00005) {
                    continue;
                }

                $byCurrency[$currency][] = [
                    'id' => $accountId,
                    'code' => (string) $account->code,
                    'name' => (string) $account->name,
                    'currency' => $currency,
                    'amount' => round($balance, 4),
                ];
            }
        }

        uksort($byCurrency, function (string $a, string $b): int {
            if ($a === '') return -1;
            if ($b === '') return 1;
            return strnatcasecmp($a, $b);
        });

        $groups = [];
        $grandTotal = 0.0;

        foreach ($byCurrency as $currency => $rows) {
            usort($rows, fn (array $a, array $b) => $a['code'] <=> $b['code']);
            $total = array_sum(array_column($rows, 'amount'));
            $grandTotal += $total;

            $groups[] = [
                'currency' => $currency,
                'rows' => $rows,
                'total' => round($total, 4),
            ];
        }

        return Inertia::render('Accounting/CashBankBalances/ForeignCurrencies', [
            'companyName' => 'HBA TRAVEL & TOURS',
            'companyTagline' => 'EXCELLENCE IN HOSPITALITY AND TRAVELS',
            'reportTitle' => 'Accounts Current Position',
            'asOfDate' => $asOfDate,
            'printedAt' => now()->format('d/m/Y h:i:s A'),
            'search' => $search,
            'groups' => $groups,
            'grandTotal' => round($grandTotal, 4),
        ]);
    }

    /**
     * Return the cash/bank accounts that the balance screen should expose.
     *
     * Current HBA accounts use the 110... chart-of-accounts family. Some
     * installations also retain the legacy account code on accounts, so that
     * alias is accepted when the column exists.
     */
    private function cashBankAccounts(string $search)
    {
        $hasLegacyCode = Schema::hasColumn(
            'accounts',
            'legacy_account_code'
        );

        $query = DB::table('accounts as a')
            ->leftJoin(
                'account_types as at',
                'at.id',
                '=',
                'a.account_type_id'
            )
            ->leftJoin(
                'branches as b',
                'b.id',
                '=',
                'a.branch_id'
            )
            ->where(function (Builder $q) use ($hasLegacyCode) {
                $q->where('a.code', 'like', '110%');

                if ($hasLegacyCode) {
                    $q->orWhere(
                        'a.legacy_account_code',
                        'like',
                        '110%'
                    );
                }
            })
            ->where(function (Builder $q) {
                $q->where('a.is_active', 1)
                    ->orWhereNull('a.is_active');
            })
            ->select([
                'a.id',
                'a.code',
                'a.name',
                'a.branch_id',
                'b.name as branch_name',
                'at.name as group_name',
            ])
            ->orderBy('a.code');

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->where(function (Builder $q) use (
                $like,
                $hasLegacyCode
            ) {
                $q->where('a.code', 'like', $like)
                    ->orWhere('a.name', 'like', $like)
                    ->orWhere('b.name', 'like', $like);

                if ($hasLegacyCode) {
                    $q->orWhere(
                        'a.legacy_account_code',
                        'like',
                        $like
                    );
                }
            });
        }

        return $query->get();
    }

    /**
     * Build a resolver for current cash/bank accounts.
     *
     * account_code is preferred over account_id because historical imports
     * can carry a legacy/current account-code identity while the numeric
     * account_id may have changed between systems.
     */
    private function cashAccountDirectory(): array
    {
        if ($this->cashAccountDirectoryCache !== null) {
            return $this->cashAccountDirectoryCache;
        }

        $hasLegacyCode = Schema::hasColumn(
            'accounts',
            'legacy_account_code'
        );

        $query = DB::table('accounts as a')
            ->where(function (Builder $q) {
                $q->where('a.is_active', 1)
                    ->orWhereNull('a.is_active');
            })
            ->where(function (Builder $q) use ($hasLegacyCode) {
                $q->where('a.code', 'like', '110%');

                if ($hasLegacyCode) {
                    $q->orWhere(
                        'a.legacy_account_code',
                        'like',
                        '110%'
                    );
                }
            })
            ->select([
                'a.id',
                'a.code',
            ]);

        if ($hasLegacyCode) {
            $query->addSelect('a.legacy_account_code');
        }

        $accounts = $query
            ->orderBy('a.code')
            ->get();

        $ids = [];
        $codeToId = [];
        $legacyCodePairs = [];

        /*
         * Always register current codes first. A real current account code
         * must win over an alias collision.
         */
        foreach ($accounts as $account) {
            $id = (int) $account->id;
            $code = strtoupper(
                trim((string) ($account->code ?? ''))
            );

            if ($id <= 0) {
                continue;
            }

            $ids[] = $id;

            if ($code !== '') {
                $codeToId[$code] = $id;
            }

            if ($hasLegacyCode) {
                $legacyCode = strtoupper(
                    trim(
                        (string) (
                            $account->legacy_account_code
                            ?? ''
                        )
                    )
                );

                if ($legacyCode !== '') {
                    $legacyCodePairs[] = [
                        'code' => $legacyCode,
                        'id' => $id,
                    ];
                }
            }
        }

        foreach ($legacyCodePairs as $pair) {
            if (! isset($codeToId[$pair['code']])) {
                $codeToId[$pair['code']] = $pair['id'];
            }
        }

        return $this->cashAccountDirectoryCache = [
            'ids' => array_values(
                array_unique($ids)
            ),
            'codes' => array_keys($codeToId),
            'code_to_id' => $codeToId,
        ];
    }

    /**
     * Resolve a voucher header's cash/bank account to the current account ID.
     * Current/legacy code is preferred; ID is the fallback.
     */
    private function resolveHeaderCashAccountId(
        ?string $cashCode,
        ?int $cashId,
        array $directory
    ): ?int {
        $normalizedCode = strtoupper(
            trim((string) ($cashCode ?? ''))
        );

        if (
            $normalizedCode !== ''
            && isset(
                $directory['code_to_id'][$normalizedCode]
            )
        ) {
            return (int) $directory['code_to_id'][$normalizedCode];
        }

        if (
            $cashId !== null
            && in_array(
                (int) $cashId,
                $directory['ids'],
                true
            )
        ) {
            return (int) $cashId;
        }

        return null;
    }

    /**
     * Add direct normalized cash lines into the base-currency movement map.
     *
     * Two identities are accepted:
     *   1. account_code / legacy account-code alias
     *   2. account_id when the code is absent or not recognized
     */
    private function mergeBaseCashLines(
        array &$map,
        string $asOfDate,
        array $directory,
        bool $baseOnly
    ): void {
        $ids = $directory['ids'];
        $codes = $directory['codes'];

        if (empty($ids)) {
            return;
        }

        $effectiveDate = 'DATE(COALESCE(l.posting_date, l.voucher_date, v.voucher_date))';

        if (! empty($codes)) {
            $rows = DB::table(
                'journal_entry_lines as l'
            )
                ->leftJoin(
                    'vouchers as v',
                    'v.id',
                    '=',
                    'l.voucher_id'
                )
                ->whereIn(
                    'l.account_code',
                    $codes
                )
                ->whereRaw(
                    $effectiveDate . ' <= ?',
                    [$asOfDate]
                )
                ->when(
                    $baseOnly,
                    function (Builder $q) {
                        $q->where(function (Builder $q2) {
                            $q2->whereNull('l.currency_code')
                                ->orWhere('l.currency_code', '');
                        });
                    }
                )
                ->select([
                    'l.account_code',
                ])
                ->selectRaw(
                    'COALESCE(SUM(l.debit),0) AS debit'
                )
                ->selectRaw(
                    'COALESCE(SUM(l.credit),0) AS credit'
                )
                ->groupBy(
                    'l.account_code'
                )
                ->get();

            foreach ($rows as $row) {
                $code = strtoupper(
                    trim((string) ($row->account_code ?? ''))
                );

                $accountId =
                    $directory['code_to_id'][$code]
                    ?? null;

                if ($accountId === null) {
                    continue;
                }

                $this->addMovement(
                    $map,
                    $accountId,
                    (float) ($row->debit ?? 0),
                    (float) ($row->credit ?? 0)
                );
            }
        }

        /*
         * Numeric ID fallback is only used when the stored account code is
         * absent or does not identify a known current/legacy cash account.
         * This prevents the same line being counted through code and ID.
         */
        $rows = DB::table(
            'journal_entry_lines as l'
        )
            ->leftJoin(
                'vouchers as v',
                'v.id',
                '=',
                'l.voucher_id'
            )
            ->whereIn(
                'l.account_id',
                $ids
            )
            ->whereRaw(
                $effectiveDate . ' <= ?',
                [$asOfDate]
            )
            ->where(function (Builder $q) use ($codes, $baseOnly) {
                $q->whereNull('l.account_code')
                    ->orWhere('l.account_code', '');

                if (! empty($codes)) {
                    $q->orWhereNotIn(
                        'l.account_code',
                        $codes
                    );
                }

                if ($baseOnly) {
                    $q->where(function (Builder $q2) {
                        $q2->whereNull('l.currency_code')
                            ->orWhere('l.currency_code', '');
                    });
                }
            })
            ->select([
                'l.account_id',
            ])
            ->selectRaw(
                'COALESCE(SUM(l.debit),0) AS debit'
            )
            ->selectRaw(
                'COALESCE(SUM(l.credit),0) AS credit'
            )
            ->groupBy(
                'l.account_id'
            )
            ->get();

        foreach ($rows as $row) {
            $accountId = (int) $row->account_id;

            if (
                ! in_array(
                    $accountId,
                    $ids,
                    true
                )
            ) {
                continue;
            }

            $this->addMovement(
                $map,
                $accountId,
                (float) ($row->debit ?? 0),
                (float) ($row->credit ?? 0)
            );
        }
    }

    /**
     * Native BR/BP writes a cash-side line. A few historical rows can lack
     * that line entirely, so rebuild only the missing cash side from the
     * counterparty detail lines. Existing cash lines are never duplicated.
     */
    private function mergeMissingVoucherBaseCash(
        array &$map,
        string $asOfDate,
        array $directory,
        bool $baseOnly
    ): void {
        $ids = $directory['ids'];
        $codes = $directory['codes'];

        if (empty($ids)) {
            return;
        }

        $candidateVouchers = DB::table('vouchers as v')
            ->whereIn('v.voucher_type', ['BR', 'BP'])
            ->where(function (Builder $q) use ($ids, $codes) {
                $q->whereIn(
                    'v.cash_bank_account_id',
                    $ids
                );

                if (! empty($codes)) {
                    $q->orWhereIn(
                        'v.cash_bank_account_code',
                        $codes
                    );
                }
            })
            ->whereNotNull('v.voucher_date')
            ->whereDate(
                'v.voucher_date',
                '<=',
                $asOfDate
            )
            ->select([
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
            ])
            ->orderBy('v.id')
            ->get();

        if ($candidateVouchers->isEmpty()) {
            return;
        }

        $voucherIds = $candidateVouchers
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        /*
         * Determine, per voucher and resolved account, whether a real cash line
         * was actually posted by the as-of date.
         */
        $cashPresence = [];

        $cashRows = DB::table(
            'journal_entry_lines as c'
        )
            ->leftJoin(
                'vouchers as cv',
                'cv.id',
                '=',
                'c.voucher_id'
            )
            ->whereIn(
                'c.voucher_id',
                $voucherIds
            )
            ->whereRaw(
                'DATE(COALESCE(c.posting_date, c.voucher_date, cv.voucher_date)) <= ?',
                [$asOfDate]
            )
            ->where(function (Builder $q) use ($ids, $codes) {
                $q->whereIn('c.account_id', $ids);

                if (! empty($codes)) {
                    $q->orWhereIn(
                        'c.account_code',
                        $codes
                    );
                }
            })
            ->select([
                'c.voucher_id',
                'c.account_id',
                'c.account_code',
            ])
            ->get();

        foreach ($cashRows as $row) {
            $resolvedId = null;

            $code = strtoupper(
                trim((string) ($row->account_code ?? ''))
            );

            if (
                $code !== ''
                && isset(
                    $directory['code_to_id'][$code]
                )
            ) {
                $resolvedId =
                    (int) $directory['code_to_id'][$code];
            } elseif (
                $row->account_id !== null
                && in_array(
                    (int) $row->account_id,
                    $ids,
                    true
                )
            ) {
                $resolvedId = (int) $row->account_id;
            }

            if ($resolvedId === null) {
                continue;
            }

            $cashPresence[
                (int) $row->voucher_id
            ][$resolvedId] = true;
        }

        $query = DB::table(
            'vouchers as v'
        )
            ->join(
                'journal_entry_lines as d',
                'd.voucher_id',
                '=',
                'v.id'
            )
            ->whereIn(
                'v.id',
                $voucherIds
            )
            ->where(function (Builder $q) use ($ids, $codes) {
                $q->where(function (Builder $q2) use ($ids) {
                    $q2->whereNull('d.account_id')
                        ->orWhereNotIn(
                            'd.account_id',
                            $ids
                        );
                });

                $q->where(function (Builder $q3) use ($codes) {
                    $q3->whereNull('d.account_code')
                        ->orWhere('d.account_code', '');

                    if (! empty($codes)) {
                        $q3->orWhereNotIn(
                            'd.account_code',
                            $codes
                        );
                    }
                });
            })
            ->when(
                $baseOnly,
                function (Builder $q) {
                    $q->where(function (Builder $q2) {
                        $q2->whereNull('d.currency_code')
                            ->orWhere('d.currency_code', '');
                    });
                }
            )
            ->select([
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
            ])
            ->selectRaw(
                "COALESCE(SUM(
                    CASE
                        WHEN v.voucher_type = 'BR'
                            THEN COALESCE(d.credit, 0)
                        ELSE COALESCE(d.debit, 0)
                    END
                ), 0) AS cash_base_amount"
            )
            ->groupBy(
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code'
            )
            ->get();

        foreach ($query as $row) {
            $accountId = $this->resolveHeaderCashAccountId(
                $row->cash_bank_account_code ?? null,
                $row->cash_bank_account_id !== null
                    ? (int) $row->cash_bank_account_id
                    : null,
                $directory
            );

            if ($accountId === null) {
                continue;
            }

            if (
                isset(
                    $cashPresence[(int) $row->id][$accountId]
                )
            ) {
                continue;
            }

            $amount = round(
                (float) ($row->cash_base_amount ?? 0),
                4
            );

            if ($amount <= 0.00005) {
                continue;
            }

            if ($row->voucher_type === 'BR') {
                $this->addMovement(
                    $map,
                    $accountId,
                    $amount,
                    0.0
                );
            } else {
                $this->addMovement(
                    $map,
                    $accountId,
                    0.0,
                    $amount
                );
            }
        }
    }

    /**
     * Read and normalize the actual foreign-currency cash lines.
     */
    private function mergeForeignCashLines(
        array &$map,
        string $asOfDate,
        array $directory
    ): array {
        $ids = $directory['ids'];
        $codes = $directory['codes'];

        $actualByVoucher = [];

        if (
            ! Schema::hasColumn(
                'journal_entry_lines',
                'currency_code'
            )
        ) {
            return $actualByVoucher;
        }

        $hasForeignDebit = Schema::hasColumn(
            'journal_entry_lines',
            'foreign_debit'
        );

        $hasForeignCredit = Schema::hasColumn(
            'journal_entry_lines',
            'foreign_credit'
        );

        if (
            ! $hasForeignDebit
            && ! $hasForeignCredit
        ) {
            return $actualByVoucher;
        }

        $debitExpr = $hasForeignDebit
            ? "CASE
                    WHEN COALESCE(l.foreign_debit, 0) <> 0
                        THEN COALESCE(l.foreign_debit, 0)
                    WHEN COALESCE(l.debit, 0) > 0
                        THEN COALESCE(l.currency_quantity, 0)
                    ELSE 0
               END"
            : "CASE
                    WHEN COALESCE(l.debit, 0) > 0
                        THEN COALESCE(l.currency_quantity, 0)
                    ELSE 0
               END";

        $creditExpr = $hasForeignCredit
            ? "CASE
                    WHEN COALESCE(l.foreign_credit, 0) <> 0
                        THEN COALESCE(l.foreign_credit, 0)
                    WHEN COALESCE(l.credit, 0) > 0
                        THEN COALESCE(l.currency_quantity, 0)
                    ELSE 0
               END"
            : "CASE
                    WHEN COALESCE(l.credit, 0) > 0
                        THEN COALESCE(l.currency_quantity, 0)
                    ELSE 0
               END";

        if (! empty($codes)) {
            $rows = DB::table(
                'journal_entry_lines as l'
            )
                ->leftJoin(
                    'vouchers as v',
                    'v.id',
                    '=',
                    'l.voucher_id'
                )
                ->whereNotNull('l.currency_code')
                ->where('l.currency_code', '<>', '')
                ->whereIn(
                    'l.account_code',
                    $codes
                )
                ->whereRaw(
                    'DATE(COALESCE(l.posting_date, l.voucher_date, v.voucher_date)) <= ?',
                    [$asOfDate]
                )
                ->select([
                    'l.voucher_id',
                    'l.account_code',
                    'l.currency_code',
                ])
                ->selectRaw(
                    "COALESCE(SUM({$debitExpr}),0) AS debit"
                )
                ->selectRaw(
                    "COALESCE(SUM({$creditExpr}),0) AS credit"
                )
                ->groupBy(
                    'l.voucher_id',
                    'l.account_code',
                    'l.currency_code'
                )
                ->get();

            foreach ($rows as $row) {
                $code = strtoupper(
                    trim((string) ($row->account_code ?? ''))
                );

                $accountId =
                    $directory['code_to_id'][$code]
                    ?? null;

                if ($accountId === null) {
                    continue;
                }

                $currency = strtoupper(
                    trim((string) ($row->currency_code ?? ''))
                );

                if ($currency === '') {
                    continue;
                }

                $debit = (float) ($row->debit ?? 0);
                $credit = (float) ($row->credit ?? 0);
                $signed = $debit - $credit;

                $map[$accountId][$currency] =
                    ($map[$accountId][$currency] ?? 0.0)
                    + $signed;

                if ($row->voucher_id !== null) {
                    $actualByVoucher[
                        (int) $row->voucher_id
                    ][$accountId][$currency] =
                        (
                            $actualByVoucher[
                                (int) $row->voucher_id
                            ][$accountId][$currency]
                            ?? 0.0
                        )
                        + $signed;
                }
            }
        }

        $rows = DB::table(
            'journal_entry_lines as l'
        )
            ->leftJoin(
                'vouchers as v',
                'v.id',
                '=',
                'l.voucher_id'
            )
            ->whereNotNull('l.currency_code')
            ->where('l.currency_code', '<>', '')
            ->whereIn(
                'l.account_id',
                $ids
            )
            ->where(function (Builder $q) use ($codes) {
                $q->whereNull('l.account_code')
                    ->orWhere('l.account_code', '');

                if (! empty($codes)) {
                    $q->orWhereNotIn(
                        'l.account_code',
                        $codes
                    );
                }
            })
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date, v.voucher_date)) <= ?',
                [$asOfDate]
            )
            ->select([
                'l.voucher_id',
                'l.account_id',
                'l.currency_code',
            ])
            ->selectRaw(
                "COALESCE(SUM({$debitExpr}),0) AS debit"
            )
            ->selectRaw(
                "COALESCE(SUM({$creditExpr}),0) AS credit"
            )
            ->groupBy(
                'l.voucher_id',
                'l.account_id',
                'l.currency_code'
            )
            ->get();

        foreach ($rows as $row) {
            $accountId = (int) $row->account_id;

            if (
                ! in_array(
                    $accountId,
                    $ids,
                    true
                )
            ) {
                continue;
            }

            $currency = strtoupper(
                trim((string) ($row->currency_code ?? ''))
            );

            if ($currency === '') {
                continue;
            }

            $signed =
                (float) ($row->debit ?? 0)
                -
                (float) ($row->credit ?? 0);

            $map[$accountId][$currency] =
                ($map[$accountId][$currency] ?? 0.0)
                + $signed;

            if ($row->voucher_id !== null) {
                $actualByVoucher[
                    (int) $row->voucher_id
                ][$accountId][$currency] =
                    (
                        $actualByVoucher[
                            (int) $row->voucher_id
                        ][$accountId][$currency]
                        ?? 0.0
                    )
                    + $signed;
            }
        }

        return $actualByVoucher;
    }

    /**
     * Reconstruct missing/old BR/BP foreign cash movements from their detail
     * quantities. The correction is only the difference between expected cash
     * FX and the cash-side FX already stored, so legacy rows are never doubled.
     */
    private function mergeMissingVoucherForeignCash(
        array &$map,
        string $asOfDate,
        array $directory,
        array $actualByVoucher
    ): void {
        $ids = $directory['ids'];
        $codes = $directory['codes'];

        if (
            empty($ids)
            || ! Schema::hasColumn(
                'journal_entry_lines',
                'currency_code'
            )
        ) {
            return;
        }

        $candidateVouchers = DB::table('vouchers as v')
            ->whereIn(
                'v.voucher_type',
                ['BR', 'BP']
            )
            ->where(function (Builder $q) use ($ids, $codes) {
                $q->whereIn(
                    'v.cash_bank_account_id',
                    $ids
                );

                if (! empty($codes)) {
                    $q->orWhereIn(
                        'v.cash_bank_account_code',
                        $codes
                    );
                }
            })
            ->whereNotNull('v.voucher_date')
            ->whereDate(
                'v.voucher_date',
                '<=',
                $asOfDate
            )
            ->select([
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
            ])
            ->get();

        if ($candidateVouchers->isEmpty()) {
            return;
        }

        $voucherIds = $candidateVouchers
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $quantityExpression = "
            CASE
                WHEN v.voucher_type = 'BR'
                    THEN
                        CASE
                            WHEN COALESCE(d.foreign_credit, 0) <> 0
                                THEN COALESCE(d.foreign_credit, 0)
                            WHEN COALESCE(d.credit, 0) > 0
                                THEN COALESCE(d.currency_quantity, 0)
                            ELSE 0
                        END
                ELSE
                        CASE
                            WHEN COALESCE(d.foreign_debit, 0) <> 0
                                THEN COALESCE(d.foreign_debit, 0)
                            WHEN COALESCE(d.debit, 0) > 0
                                THEN COALESCE(d.currency_quantity, 0)
                            ELSE 0
                        END
            END
        ";

        /*
         * Account-side foreign quantity by voucher/currency. These are the
         * counterparty detail lines, never the cash lines.
         */
        $detailRows = DB::table(
            'vouchers as v'
        )
            ->join(
                'journal_entry_lines as d',
                'd.voucher_id',
                '=',
                'v.id'
            )
            ->whereIn(
                'v.id',
                $voucherIds
            )
            ->whereNotNull('d.currency_code')
            ->where('d.currency_code', '<>', '')
            ->where(function (Builder $q) use ($ids, $codes) {
                $q->where(function (Builder $q2) use ($ids) {
                    $q2->whereNull('d.account_id')
                        ->orWhereNotIn(
                            'd.account_id',
                            $ids
                        );
                });

                $q->where(function (Builder $q3) use ($codes) {
                    $q3->whereNull('d.account_code')
                        ->orWhere('d.account_code', '');

                    if (! empty($codes)) {
                        $q3->orWhereNotIn(
                            'd.account_code',
                            $codes
                        );
                    }
                });
            })
            ->select([
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
                'd.currency_code',
            ])
            ->selectRaw(
                "COALESCE(SUM({$quantityExpression}),0) AS expected_quantity"
            )
            ->groupBy(
                'v.id',
                'v.voucher_type',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
                'd.currency_code'
            )
            ->get();

        foreach ($detailRows as $row) {
            $accountId = $this->resolveHeaderCashAccountId(
                $row->cash_bank_account_code ?? null,
                $row->cash_bank_account_id !== null
                    ? (int) $row->cash_bank_account_id
                    : null,
                $directory
            );

            if ($accountId === null) {
                continue;
            }

            $currency = strtoupper(
                trim((string) ($row->currency_code ?? ''))
            );

            if ($currency === '') {
                continue;
            }

            $expectedSigned =
                $row->voucher_type === 'BR'
                    ? (float) ($row->expected_quantity ?? 0)
                    : -(
                        (float) ($row->expected_quantity ?? 0)
                    );

            $actualSigned =
                (float) (
                    $actualByVoucher[
                        (int) $row->id
                    ][$accountId][$currency]
                    ?? 0.0
                );

            $correction = $expectedSigned - $actualSigned;

            if (abs($correction) <= 0.00005) {
                continue;
            }

            $map[$accountId][$currency] =
                ($map[$accountId][$currency] ?? 0.0)
                + $correction;
        }
    }

    private function addMovement(
        array &$map,
        int $accountId,
        float $debit,
        float $credit
    ): void {
        $map[$accountId]['debit'] =
            ($map[$accountId]['debit'] ?? 0.0)
            + $debit;

        $map[$accountId]['credit'] =
            ($map[$accountId]['credit'] ?? 0.0)
            + $credit;
    }

    private function baseMovementMap(string $asOfDate): array
    {
        $directory = $this->cashAccountDirectory();
        $map = [];

        if (empty($directory['ids'])) {
            return $map;
        }

        /*
         * 1. Read all normalized cash-side journal lines.
         * 2. Repair only BR/BP vouchers whose cash-side line is missing.
         */
        $this->mergeBaseCashLines(
            $map,
            $asOfDate,
            $directory,
            false
        );

        $this->mergeMissingVoucherBaseCash(
            $map,
            $asOfDate,
            $directory,
            false
        );

        return $map;
    }

    private function baseOnlyMovementMap(string $asOfDate): array
    {
        $directory = $this->cashAccountDirectory();
        $map = [];

        if (empty($directory['ids'])) {
            return $map;
        }

        $this->mergeBaseCashLines(
            $map,
            $asOfDate,
            $directory,
            true
        );

        $this->mergeMissingVoucherBaseCash(
            $map,
            $asOfDate,
            $directory,
            true
        );

        return $map;
    }

    private function foreignMovementMap(string $asOfDate): array
    {
        $directory = $this->cashAccountDirectory();
        $map = [];

        if (empty($directory['ids'])) {
            return $map;
        }

        $actualByVoucher = $this->mergeForeignCashLines(
            $map,
            $asOfDate,
            $directory
        );

        /*
         * BR/BP detail quantities provide a safe fallback for:
         * - old imports with no cash FX fields;
         * - native BR/BP saved before the FX cash-side fix;
         * - partial legacy cash FX rows.
         *
         * Only the missing difference is added.
         */
        $this->mergeMissingVoucherForeignCash(
            $map,
            $asOfDate,
            $directory,
            $actualByVoucher
        );

        return $map;
    }



    private function baseOpeningMap(): array
{
    $map = [];

    if (
        Schema::hasTable(
            'account_opening_balances'
        )
    ) {
        $columns =
            Schema::getColumnListing(
                'account_opening_balances'
            );

        $debitColumn =
            in_array(
                'opening_debit',
                $columns,
                true
            )
                ? 'opening_debit'
                : (
                    in_array(
                        'debit',
                        $columns,
                        true
                    )
                        ? 'debit'
                        : null
                );

        $creditColumn =
            in_array(
                'opening_credit',
                $columns,
                true
            )
                ? 'opening_credit'
                : (
                    in_array(
                        'credit',
                        $columns,
                        true
                    )
                        ? 'credit'
                        : null
                );

        /*
         * Normalized schema:
         * account_code + nullable currency_code.
         *
         * Base opening rows are the rows where
         * currency_code is NULL or empty.
         */
        if (
            in_array(
                'account_code',
                $columns,
                true
            ) &&
            $debitColumn &&
            $creditColumn
        ) {
            $query = DB::table(
                'account_opening_balances as o'
            )
                ->join(
                    'accounts as a',
                    'a.code',
                    '=',
                    'o.account_code'
                )
                ->select([
                    'a.id as account_id',
                ])
                ->selectRaw(
                    "COALESCE(SUM(o.`{$debitColumn}`), 0) AS debit"
                )
                ->selectRaw(
                    "COALESCE(SUM(o.`{$creditColumn}`), 0) AS credit"
                );

            if (
                in_array(
                    'currency_code',
                    $columns,
                    true
                )
            ) {
                $query->where(
                    function (
                        Builder $q
                    ) {
                        $q->whereNull(
                            'o.currency_code'
                        )
                        ->orWhere(
                            'o.currency_code',
                            ''
                        );
                    }
                );
            }

            $rows = $query
                ->groupBy(
                    'a.id'
                )
                ->get();

            foreach ($rows as $row) {
                $map[
                    (int) $row->account_id
                ] = [
                    'debit' =>
                        (float) $row->debit,

                    'credit' =>
                        (float) $row->credit,
                ];
            }

            if ($map !== []) {
                return $map;
            }
        }

        /*
         * Fallback for a schema using account_id directly.
         */
        if (
            in_array(
                'account_id',
                $columns,
                true
            ) &&
            $debitColumn &&
            $creditColumn
        ) {
            $query = DB::table(
                'account_opening_balances'
            )
                ->select([
                    'account_id',
                ])
                ->selectRaw(
                    "COALESCE(SUM(`{$debitColumn}`), 0) AS debit"
                )
                ->selectRaw(
                    "COALESCE(SUM(`{$creditColumn}`), 0) AS credit"
                );

            if (
                in_array(
                    'currency_code',
                    $columns,
                    true
                )
            ) {
                $query->where(
                    function (
                        Builder $q
                    ) {
                        $q->whereNull(
                            'currency_code'
                        )
                        ->orWhere(
                            'currency_code',
                            ''
                        );
                    }
                );
            }

            foreach (
                $query
                    ->groupBy(
                        'account_id'
                    )
                    ->get()
                as $row
            ) {
                $map[
                    (int) $row->account_id
                ] = [
                    'debit' =>
                        (float) $row->debit,

                    'credit' =>
                        (float) $row->credit,
                ];
            }

            if ($map !== []) {
                return $map;
            }
        }
    }

    /*
     * Final fallback for installations where opening
     * balances are stored directly on accounts.
     */
    $accountColumns =
        Schema::getColumnListing(
            'accounts'
        );

    if (
        in_array(
            'opening_debit',
            $accountColumns,
            true
        ) &&
        in_array(
            'opening_credit',
            $accountColumns,
            true
        )
    ) {
        foreach (
            DB::table('accounts')
                ->select([
                    'id',
                    'opening_debit',
                    'opening_credit',
                ])
                ->get()
            as $row
        ) {
            $map[
                (int) $row->id
            ] = [
                'debit' =>
                    (float) $row->opening_debit,

                'credit' =>
                    (float) $row->opening_credit,
            ];
        }
    }

    return $map;
}


    private function foreignOpeningMap(): array
{
    if (! Schema::hasTable('account_opening_balances')) {
        return [];
    }

    $columns = Schema::getColumnListing(
        'account_opening_balances'
    );

    $debitColumn =
        in_array(
            'opening_debit',
            $columns,
            true
        )
            ? 'opening_debit'
            : (
                in_array(
                    'debit',
                    $columns,
                    true
                )
                    ? 'debit'
                    : null
            );

    $creditColumn =
        in_array(
            'opening_credit',
            $columns,
            true
        )
            ? 'opening_credit'
            : (
                in_array(
                    'credit',
                    $columns,
                    true
                )
                    ? 'credit'
                    : null
            );

    if (
        ! $debitColumn ||
        ! $creditColumn
    ) {
        return [];
    }

    /*
     * ----------------------------------------------------------
     * CASE 1
     * ----------------------------------------------------------
     * The actual dev database may contain account_id.
     *
     * Use simple column names in GROUP BY.
     *
     * IMPORTANT:
     * Do NOT pass a raw expression such as
     * "a.`currency_code`" into groupBy().
     */
    if (
        in_array(
            'account_id',
            $columns,
            true
        ) &&
        in_array(
            'currency_code',
            $columns,
            true
        )
    ) {
        $rows = DB::table(
            'account_opening_balances as a'
        )
            ->whereNotNull(
                'a.currency_code'
            )
            ->where(
                'a.currency_code',
                '<>',
                ''
            )
            ->select([
                'a.account_id',
                'a.currency_code',
            ])
            ->selectRaw(
                "COALESCE(SUM(a.`{$debitColumn}`), 0) AS debit"
            )
            ->selectRaw(
                "COALESCE(SUM(a.`{$creditColumn}`), 0) AS credit"
            )
            ->groupBy(
                'a.account_id',
                'a.currency_code'
            )
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $accountId =
                (int) $row->account_id;

            $currency =
                strtoupper(
                    trim(
                        (string) (
                            $row->currency_code
                            ?? ''
                        )
                    )
                );

            if (
                $accountId <= 0 ||
                $currency === ''
            ) {
                continue;
            }

            $signedAmount =
                (float) (
                    $row->debit ?? 0
                )
                -
                (float) (
                    $row->credit ?? 0
                );

            $map[$accountId][$currency] =
                (
                    $map[$accountId][$currency]
                    ?? 0.0
                )
                + $signedAmount;
        }

        return $map;
    }

    /*
     * ----------------------------------------------------------
     * CASE 2
     * ----------------------------------------------------------
     * Normalized schema:
     *
     * account_opening_balances.account_code
     *                    ↓
     * accounts.code
     *                    ↓
     * accounts.id
     *
     * This is also compatible with the schema you supplied.
     */
    if (
        in_array(
            'account_code',
            $columns,
            true
        ) &&
        in_array(
            'currency_code',
            $columns,
            true
        )
    ) {
        $rows = DB::table(
            'account_opening_balances as o'
        )
            ->join(
                'accounts as a',
                'a.code',
                '=',
                'o.account_code'
            )
            ->whereNotNull(
                'o.currency_code'
            )
            ->where(
                'o.currency_code',
                '<>',
                ''
            )
            ->select([
                'a.id as account_id',
                'o.currency_code',
            ])
            ->selectRaw(
                "COALESCE(SUM(o.`{$debitColumn}`), 0) AS debit"
            )
            ->selectRaw(
                "COALESCE(SUM(o.`{$creditColumn}`), 0) AS credit"
            )
            ->groupBy(
                'a.id',
                'o.currency_code'
            )
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $accountId =
                (int) $row->account_id;

            $currency =
                strtoupper(
                    trim(
                        (string) (
                            $row->currency_code
                            ?? ''
                        )
                    )
                );

            if (
                $accountId <= 0 ||
                $currency === ''
            ) {
                continue;
            }

            $signedAmount =
                (float) (
                    $row->debit ?? 0
                )
                -
                (float) (
                    $row->credit ?? 0
                );

            $map[$accountId][$currency] =
                (
                    $map[$accountId][$currency]
                    ?? 0.0
                )
                + $signedAmount;
        }

        return $map;
    }

    /*
     * ----------------------------------------------------------
     * CASE 3
     * ----------------------------------------------------------
     * Older schema:
     *
     * currency_id + currencies.code
     */
    if (
        in_array(
            'account_id',
            $columns,
            true
        ) &&
        in_array(
            'currency_id',
            $columns,
            true
        ) &&
        Schema::hasTable('currencies')
    ) {
        $rows = DB::table(
            'account_opening_balances as o'
        )
            ->leftJoin(
                'currencies as c',
                'c.id',
                '=',
                'o.currency_id'
            )
            ->whereNotNull(
                'o.currency_id'
            )
            ->where(
                'o.currency_id',
                '<>',
                0
            )
            ->whereNotNull(
                'c.code'
            )
            ->where(
                'c.code',
                '<>',
                ''
            )
            ->select([
                'o.account_id',
                'c.code as currency_code',
            ])
            ->selectRaw(
                "COALESCE(SUM(o.`{$debitColumn}`), 0) AS debit"
            )
            ->selectRaw(
                "COALESCE(SUM(o.`{$creditColumn}`), 0) AS credit"
            )
            ->groupBy(
                'o.account_id',
                'c.code'
            )
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $accountId =
                (int) $row->account_id;

            $currency =
                strtoupper(
                    trim(
                        (string) (
                            $row->currency_code
                            ?? ''
                        )
                    )
                );

            if (
                $accountId <= 0 ||
                $currency === ''
            ) {
                continue;
            }

            $signedAmount =
                (float) (
                    $row->debit ?? 0
                )
                -
                (float) (
                    $row->credit ?? 0
                );

            $map[$accountId][$currency] =
                (
                    $map[$accountId][$currency]
                    ?? 0.0
                )
                + $signedAmount;
        }

        return $map;
    }

    return [];
}


    private function firstColumn(array $columns, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            if (in_array($candidate, $columns, true)) {
                return $candidate;
            }
        }

        return null;
    }


    private function emptyTotals(): array
    {
        return [
            'opening_debit' => 0.0,
            'opening_credit' => 0.0,
            'debit' => 0.0,
            'credit' => 0.0,
            'balance' => 0.0,
        ];
    }


    private function filters(Request $request): array
    {
        $validated = $request->validate([
            'as_of' => ['nullable', 'date'],
            'search' => ['nullable', 'string', 'max:150'],
        ]);

        return [
            (string) ($validated['as_of'] ?? now()->toDateString()),
            trim((string) ($validated['search'] ?? '')),
        ];
    }
}
