<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AccountBalanceReportsController extends Controller
{
    public function customersDatewise(Request $request): Response
    {
        $data = $this->validateDateRange($request);

        $accounts = $this->accountsByPrefix(
            '12%',
            $data['search']
        );

        $rows = $this->buildDatewiseRows(
            $accounts,
            $data['date_from'],
            $data['date_to']
        );

        return Inertia::render(
            'Accounting/Balances/Datewise',
            [
                'title' => 'Customer Balances - Datewise',
                'subtitle' =>
                    'Accounts current position for the selected date range.',
                'dateFrom' => $data['date_from'],
                'dateTo' => $data['date_to'],
                'search' => $data['search'],
                'rows' => $rows,
            ]
        );
    }

    public function customersWithPhone(Request $request): Response
{
    $data = $this->validateAsOf($request);

    /*
     * IMPORTANT:
     *
     * The current normalized accounts table in the running
     * development database does NOT contain phone/mobile columns.
     *
     * The original Accu-Travel Account table does contain:
     *   - Business Phone
     *   - Mobile Phone
     *
     * Therefore we load account identity/balance information
     * from the normalized accounts table and contact information
     * from the legacy Account table.
     */

    $accounts = DB::table('accounts as a')
        ->where('a.is_active', 1)
        ->where('a.code', 'like', '12%')
        ->select([
            'a.id',
            'a.code',
            'a.name',
            'a.opening_debit',
            'a.opening_credit',
        ])
        ->orderBy('a.code')
        ->get();

    /*
     * Load legacy phone information.
     *
     * We deliberately keep this inside a try/catch so that
     * the report still works if the legacy connection is
     * temporarily unavailable.
     */
    $legacyContacts = collect();

    try {
        $legacyContacts = DB::connection('legacy')
            ->table('Account')
            ->select([
                'Account Code',
                'Business Phone',
                'Mobile Phone',
            ])
            ->whereIn(
                'Account Code',
                $accounts
                    ->pluck('code')
                    ->map(
                        fn ($code) => (string) $code
                    )
                    ->all()
            )
            ->get()
            ->keyBy(
                fn ($row) =>
                    (string) $row->{'Account Code'}
            );
    } catch (\Throwable $e) {
        /*
         * Do not fail the whole balance report merely because
         * legacy contact information cannot be loaded.
         *
         * Phone will simply display as "—".
         */
        $legacyContacts = collect();
    }

    /*
     * Attach phone/mobile information to the normalized
     * account objects in memory.
     */
    $accounts->each(
        function ($account) use ($legacyContacts) {
            $contact = $legacyContacts->get(
                (string) $account->code
            );

            if ($contact) {
                $businessPhone = trim(
                    (string) (
                        $contact->{'Business Phone'}
                        ?? ''
                    )
                );

                $mobilePhone = trim(
                    (string) (
                        $contact->{'Mobile Phone'}
                        ?? ''
                    )
                );

                /*
                 * Prefer mobile, then business phone.
                 */
                $account->phone =
                    $mobilePhone !== ''
                        ? $mobilePhone
                        : $businessPhone;

                $account->mobile =
                    $mobilePhone;
            } else {
                $account->phone = '';
                $account->mobile = '';
            }
        }
    );

    /*
     * Search in:
     *   - account code
     *   - account name
     *   - mobile
     *   - business phone
     *
     * We do this after loading the legacy contacts because
     * phone/mobile do not exist in the normalized table.
     */
    if ($data['search'] !== '') {
        $term = mb_strtolower(
            $data['search']
        );

        $accounts = $accounts
            ->filter(function ($account) use ($term) {
                $code = mb_strtolower(
                    (string) $account->code
                );

                $name = mb_strtolower(
                    (string) $account->name
                );

                $phone = mb_strtolower(
                    (string) (
                        $account->phone
                        ?? ''
                    )
                );

                $mobile = mb_strtolower(
                    (string) (
                        $account->mobile
                        ?? ''
                    )
                );

                return str_contains(
                    $code,
                    $term
                )
                    || str_contains(
                        $name,
                        $term
                    )
                    || str_contains(
                        $phone,
                        $term
                    )
                    || str_contains(
                        $mobile,
                        $term
                    );
            })
            ->values();
    }

    /*
     * Calculate the balance using the same ledger-based
     * calculation as Customer Balances.
     */
    $rows = $this->buildCurrentRows(
        $accounts,
        $data['as_of']
    );

    /*
     * buildCurrentRows() already carries the account object
     * fields through. Make absolutely sure the phone value
     * is present in the response.
     */
    $rows = collect($rows)
        ->map(function (array $row) use ($accounts) {
            $account = $accounts->firstWhere(
                'id',
                $row['id']
            );

            $row['phone'] = $account
                ? (string) (
                    $account->phone
                    ?? $account->mobile
                    ?? ''
                )
                : '';

            return $row;
        })
        ->values()
        ->all();

    return Inertia::render(
        'Accounting/Balances/WithPhone',
        [
            'title' =>
                'Customer Balances with Phone No',

            'subtitle' =>
                'Current customer balances with contact information.',

            'asOf' =>
                $data['as_of'],

            'search' =>
                $data['search'],

            'rows' =>
                $rows,
        ]
    );
}

    public function customersForeign(Request $request): Response
    {
        $data = $this->validateAsOf($request);

        return Inertia::render(
            'Accounting/Balances/ForeignCurrencies',
            [
                'title' => 'Customer Balances - Foreign Currencies',
                'subtitle' =>
                    'Customer balances by base and foreign currency.',
                'asOf' => $data['as_of'],
                'search' => $data['search'],
                'rows' => $this->buildForeignRows(
                    '12%',
                    $data['search'],
                    $data['as_of']
                ),
            ]
        );
    }

    public function payablesForeign(Request $request): Response
    {
        $data = $this->validateAsOf($request);

        return Inertia::render(
            'Accounting/Balances/ForeignCurrencies',
            [
                'title' => 'Payable Balances - Foreign Currencies',
                'subtitle' =>
                    'Vendor balances by base and foreign currency.',
                'asOf' => $data['as_of'],
                'search' => $data['search'],
                'rows' => $this->buildForeignRows(
                    '21%',
                    $data['search'],
                    $data['as_of']
                ),
            ]
        );
    }

    /**
     * Datewise report:
     *
     * ONE ROW PER ACCOUNT.
     *
     * Opening:
     *   account opening balance
     *   + ledger activity before date_from
     *
     * Period debit/credit:
     *   ledger activity between date_from and date_to
     *
     * Balance:
     *   opening + debit - credit
     *
     * This is intentionally aggregated by account.
     */
    private function buildDatewiseRows(
        $accounts,
        string $dateFrom,
        string $dateTo
    ): array {
        if ($accounts->isEmpty()) {
            return [];
        }

        $accountIds = $accounts
            ->pluck('id')
            ->all();

        /*
         * Activity before the selected period.
         */
        $before = DB::table('journal_entry_lines as l')
            ->whereIn('l.account_id', $accountIds)
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) < ?',
                [$dateFrom]
            )
            ->selectRaw(
                '
                l.account_id,
                COALESCE(SUM(l.debit), 0) AS debit,
                COALESCE(SUM(l.credit), 0) AS credit
                '
            )
            ->groupBy('l.account_id')
            ->get()
            ->keyBy('account_id');

        /*
         * Activity inside the selected period.
         */
        $period = DB::table('journal_entry_lines as l')
            ->whereIn('l.account_id', $accountIds)
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) >= ?',
                [$dateFrom]
            )
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) <= ?',
                [$dateTo]
            )
            ->selectRaw(
                '
                l.account_id,
                COALESCE(SUM(l.debit), 0) AS debit,
                COALESCE(SUM(l.credit), 0) AS credit
                '
            )
            ->groupBy('l.account_id')
            ->get()
            ->keyBy('account_id');

        return $accounts
            ->map(function ($account) use (
                $before,
                $period
            ) {
                $beforeRow = $before->get(
                    $account->id
                );

                $periodRow = $period->get(
                    $account->id
                );

                /*
                 * Opening balances are already represented
                 * on the normalized account record.
                 *
                 * Do NOT also add account_opening_balances here,
                 * otherwise we risk double-counting the opening.
                 */
                $openingDebit = (float) (
                    $account->opening_debit ?? 0
                );

                $openingCredit = (float) (
                    $account->opening_credit ?? 0
                );

                $priorDebit = (float) (
                    $beforeRow->debit ?? 0
                );

                $priorCredit = (float) (
                    $beforeRow->credit ?? 0
                );

                $periodDebit = (float) (
                    $periodRow->debit ?? 0
                );

                $periodCredit = (float) (
                    $periodRow->credit ?? 0
                );

                $opening =
                    ($openingDebit + $priorDebit)
                    - ($openingCredit + $priorCredit);

                $balance =
                    $opening
                    + $periodDebit
                    - $periodCredit;

                return [
                    'id' => (int) $account->id,
                    'code' => (string) $account->code,
                    'name' => (string) $account->name,

                    'opening' => round(
                        $opening,
                        4
                    ),

                    'debit' => round(
                        $periodDebit,
                        4
                    ),

                    'credit' => round(
                        $periodCredit,
                        4
                    ),

                    'balance' => round(
                        abs($balance),
                        4
                    ),

                    'side' => $this->balanceSide(
                        $balance
                    ),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Current account position:
     * opening + all activity through as_of.
     */
    private function buildCurrentRows(
        $accounts,
        string $asOf
    ): array {
        if ($accounts->isEmpty()) {
            return [];
        }

        $accountIds = $accounts
            ->pluck('id')
            ->all();

        $activity = DB::table(
            'journal_entry_lines as l'
        )
            ->whereIn(
                'l.account_id',
                $accountIds
            )
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) <= ?',
                [$asOf]
            )
            ->selectRaw(
                '
                l.account_id,
                COALESCE(SUM(l.debit), 0) AS debit,
                COALESCE(SUM(l.credit), 0) AS credit
                '
            )
            ->groupBy('l.account_id')
            ->get()
            ->keyBy('account_id');

        return $accounts
            ->map(function ($account) use ($activity) {
                $row = $activity->get(
                    $account->id
                );

                $debit =
                    (float) (
                        $account->opening_debit
                        ?? 0
                    )
                    + (float) (
                        $row->debit ?? 0
                    );

                $credit =
                    (float) (
                        $account->opening_credit
                        ?? 0
                    )
                    + (float) (
                        $row->credit ?? 0
                    );

                $balance = $debit - $credit;

                return [
                    'id' => (int) $account->id,
                    'code' => (string) $account->code,
                    'name' => (string) $account->name,

                    'phone' => (string) (
                        ($account->phone ?? '')
                        !== ''
                            ? $account->phone
                            : (
                                $account->mobile
                                ?? ''
                            )
                    ),

                    'opening' => round(
                        (
                            (float) (
                                $account->opening_debit
                                ?? 0
                            )
                        )
                        -
                        (
                            (float) (
                                $account->opening_credit
                                ?? 0
                            )
                        ),
                        4
                    ),

                    'debit' => round(
                        $debit,
                        4
                    ),

                    'credit' => round(
                        $credit,
                        4
                    ),

                    'balance' => round(
                        abs($balance),
                        4
                    ),

                    'side' => $this->balanceSide(
                        $balance
                    ),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Foreign currency report.
     *
     * IMPORTANT:
     * This produces one row per:
     *
     * account + base currency
     * account + SAR
     * account + USD
     * etc.
     *
     * It does NOT return one row per journal line.
     *
     * The legacy report includes the blank/base currency rows,
     * so those are intentionally included here.
     */
    private function buildForeignRows(
    string $accountPrefix,
    string $search,
    string $asOf
): array {
    $accounts = $this->accountsByPrefix(
        $accountPrefix,
        $search
    );

    if ($accounts->isEmpty()) {
        return [];
    }

    $accountIds = $accounts
        ->pluck('id')
        ->all();

    /*
     * IMPORTANT:
     *
     * Foreign Currency reports must ONLY contain
     * actual foreign-currency rows.
     *
     * Do not create a synthetic/base row for every
     * account. That was the reason accounts such as
     * HAFIZ MUDASSIR / MUSAFIRAANA TICKETS /
     * AF TRAVEL TICKET were appearing.
     */
    $groups = [];

    /*
     * Foreign opening balances.
     */
    if (
        Schema::hasTable(
            'account_opening_balances'
        )
        && Schema::hasColumn(
            'account_opening_balances',
            'account_code'
        )
        && Schema::hasColumn(
            'account_opening_balances',
            'currency_code'
        )
    ) {
        $openingRows = DB::table(
            'account_opening_balances'
        )
            ->whereIn(
                'account_code',
                $accounts->pluck('code')->all()
            )
            ->whereNotNull(
                'currency_code'
            )
            ->where(
                'currency_code',
                '<>',
                ''
            )
            ->select([
                'account_code',
                'currency_code',
                'currency_quantity',
                'opening_debit',
                'opening_credit',
            ])
            ->get();

        foreach ($openingRows as $opening) {
            $account = $accounts->firstWhere(
                'code',
                (string) $opening->account_code
            );

            if (! $account) {
                continue;
            }

            $currency = strtoupper(
                trim(
                    (string) $opening->currency_code
                )
            );

            if ($currency === '') {
                continue;
            }

            $key =
                $account->id
                . '|'
                . $currency;

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'account_id' =>
                        (int) $account->id,

                    'account_code' =>
                        (string) $account->code,

                    'currency' =>
                        $currency,

                    'debit' => 0.0,

                    'credit' => 0.0,

                    'seen' => false,
                ];
            }

            $quantity = abs(
                (float) (
                    $opening->currency_quantity
                    ?? 0
                )
            );

            $openingDebit = (float) (
                $opening->opening_debit
                ?? 0
            );

            $openingCredit = (float) (
                $opening->opening_credit
                ?? 0
            );

            /*
             * When quantity exists, use the quantity as
             * the foreign-currency balance.
             */
            if ($quantity > 0.00005) {
                if (
                    $openingDebit
                    > $openingCredit
                ) {
                    $groups[$key]['debit']
                        += $quantity;
                } elseif (
                    $openingCredit
                    > $openingDebit
                ) {
                    $groups[$key]['credit']
                        += $quantity;
                }
            } else {
                /*
                 * Fallback for records where quantity was
                 * not populated.
                 */
                $groups[$key]['debit']
                    += max(
                        $openingDebit,
                        0
                    );

                $groups[$key]['credit']
                    += max(
                        $openingCredit,
                        0
                    );
            }

            $groups[$key]['seen'] = true;
        }
    }

    /*
     * Foreign-currency journal activity.
     */
    $lines = DB::table(
        'journal_entry_lines as l'
    )
        ->whereIn(
            'l.account_id',
            $accountIds
        )
        ->whereRaw(
            'DATE(COALESCE(l.posting_date, l.voucher_date)) <= ?',
            [$asOf]
        )
        ->whereNotNull(
            'l.currency_code'
        )
        ->where(
            'l.currency_code',
            '<>',
            ''
        )
        ->select([
            'l.account_id',
            'l.account_code',
            'l.currency_code',
            'l.currency_quantity',
            'l.foreign_debit',
            'l.foreign_credit',
            'l.debit',
            'l.credit',
        ])
        ->get();

    foreach ($lines as $line) {
        $currency = strtoupper(
            trim(
                (string) (
                    $line->currency_code
                    ?? ''
                )
            )
        );

        /*
         * No currency = not a foreign-currency row.
         */
        if ($currency === '') {
            continue;
        }

        $key =
            $line->account_id
            . '|'
            . $currency;

        if (! isset($groups[$key])) {
            $groups[$key] = [
                'account_id' =>
                    (int) $line->account_id,

                'account_code' =>
                    (string) $line->account_code,

                'currency' =>
                    $currency,

                'debit' => 0.0,

                'credit' => 0.0,

                'seen' => false,
            ];
        }

        $groups[$key]['seen'] = true;

        /*
         * Prefer explicit foreign debit/credit.
         */
        $foreignDebit =
            $line->foreign_debit;

        $foreignCredit =
            $line->foreign_credit;

        /*
         * Fallback to currency quantity for older
         * records where foreign debit/credit are null.
         */
        if (
            $foreignDebit === null
            && $foreignCredit === null
        ) {
            $quantity = abs(
                (float) (
                    $line->currency_quantity
                    ?? 0
                )
            );

            if (
                $quantity > 0.00005
            ) {
                if (
                    (float) (
                        $line->debit
                        ?? 0
                    ) > 0.00005
                ) {
                    $foreignDebit =
                        $quantity;
                } elseif (
                    (float) (
                        $line->credit
                        ?? 0
                    ) > 0.00005
                ) {
                    $foreignCredit =
                        $quantity;
                }
            }
        }

        $groups[$key]['debit']
            += (float) (
                $foreignDebit ?? 0
            );

        $groups[$key]['credit']
            += (float) (
                $foreignCredit ?? 0
            );
    }

    $rows = [];

    foreach ($groups as $group) {
        if (! $group['seen']) {
            continue;
        }

        $net =
            (float) $group['debit']
            - (float) $group['credit'];

        $account = $accounts->firstWhere(
            'id',
            $group['account_id']
        );

        if (! $account) {
            continue;
        }

        $rows[] = [
            'id' =>
                (int) $group['account_id'],

            'code' =>
                (string) $group['account_code'],

            'name' =>
                (string) $account->name,

            'currency' =>
                (string) $group['currency'],

            'amount' =>
                round(
                    abs($net),
                    4
                ),

            'side' =>
                $this->balanceSide(
                    $net
                ),
        ];
    }

    usort(
        $rows,
        function (array $a, array $b) {
            $code = strcmp(
                $a['code'],
                $b['code']
            );

            if ($code !== 0) {
                return $code;
            }

            return strcmp(
                $a['currency'],
                $b['currency']
            );
        }
    );

    return $rows;
}

    private function accountsByPrefix(
        string $prefix,
        string $search
    ) {
        $query = DB::table('accounts as a')
            ->where('a.is_active', 1)
            ->where(
                'a.code',
                'like',
                $prefix
            )
            ->select([
                'a.id',
                'a.code',
                'a.name',
                'a.opening_debit',
                'a.opening_credit',
            ]);

        if ($search !== '') {
            $term = $search;

            $query->where(function ($q) use ($term) {
                $q->where(
                    'a.code',
                    'like',
                    "%{$term}%"
                )
                    ->orWhere(
                        'a.name',
                        'like',
                        "%{$term}%"
                    );
            });
        }

        return $query
            ->orderBy('a.code')
            ->get();
    }

    private function balanceSide(
        float $value
    ): ?string {
        if (
            abs($value) < 0.00005
        ) {
            return null;
        }

        return $value > 0
            ? 'Dr'
            : 'Cr';
    }

    private function validateAsOf(
        Request $request
    ): array {
        $data = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'as_of' => [
                'nullable',
                'date',
            ],
        ]);

        return [
            'search' =>
                trim(
                    (string) (
                        $data['search']
                        ?? ''
                    )
                ),

            'as_of' =>
                $data['as_of']
                ?? now()->toDateString(),
        ];
    }

    private function validateDateRange(
        Request $request
    ): array {
        $data = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'date_from' => [
                'nullable',
                'date',
            ],
            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ]);

        return [
            'search' =>
                trim(
                    (string) (
                        $data['search']
                        ?? ''
                    )
                ),

            'date_from' =>
                $data['date_from']
                ?? now()
                    ->startOfMonth()
                    ->toDateString(),

            'date_to' =>
                $data['date_to']
                ?? now()->toDateString(),
        ];
    }
}