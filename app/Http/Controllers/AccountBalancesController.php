<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AccountBalancesController extends Controller
{
    public function customers(Request $request): Response
    {
        return $this->index($request, 'customers');
    }

    public function payables(Request $request): Response
    {
        return $this->index($request, 'payables');
    }

    private function index(Request $request, string $kind): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'as_of' => ['nullable', 'date'],
            'show_zero' => ['nullable', 'boolean'],
        ]);

        $asOf = $validated['as_of'] ?? now()->toDateString();
        $search = trim((string) ($validated['search'] ?? ''));
        $showZero = (bool) ($validated['show_zero'] ?? false);

        /*
         * HBA's legacy reports use:
         *   12xxxxx = Receivables / Customers
         *   21xxxxx = Payables / Vendors
         *
         * The report is ledger-based: every BR/BP/JV/Inv line contributes
         * to the account balance. A customer normally has a debit balance
         * when HBA is owed money; a vendor normally has a credit balance.
         */
        $prefix = $kind === 'customers' ? '12%' : '21%';

        $accountQuery = DB::table('accounts as a')
            ->where('a.is_active', 1)
            ->where('a.code', 'like', $prefix)
            ->select([
                'a.id',
                'a.code',
                'a.name',
            ]);

        if ($search !== '') {
            $accountQuery->where(function ($q) use ($search) {
                $q->where('a.code', 'like', "%{$search}%")
                    ->orWhere('a.name', 'like', "%{$search}%");
            });
        }

        $accounts = $accountQuery
            ->orderBy('a.code')
            ->get();

        $lineBase = DB::table('journal_entry_lines as l')
            ->whereDate('l.posting_date', '<=', $asOf);

        $rows = [];

        foreach ($accounts as $account) {
            $openingDebit = 0.0;
            $openingCredit = 0.0;

            /*
             * Prefer the dedicated opening-balance table when it exists.
             * Column names are discovered dynamically so this controller
             * remains safe if the project's opening-balance schema differs.
             */
            if (Schema::hasTable('account_opening_balances')) {
                $columns = Schema::getColumnListing('account_opening_balances');

                if (in_array('account_id', $columns, true)) {
                    $openingQuery = DB::table('account_opening_balances')
                        ->where('account_id', $account->id);

                    if (in_array('debit', $columns, true)) {
                        $openingDebit = (float) $openingQuery->sum('debit');
                    }

                    if (in_array('credit', $columns, true)) {
                        $openingCredit = (float) $openingQuery->sum('credit');
                    }

                    if (
                        ! in_array('debit', $columns, true)
                        && ! in_array('credit', $columns, true)
                    ) {
                        $openingValueColumn = collect([
                            'balance',
                            'amount',
                            'opening_balance',
                        ])->first(
                            fn ($column) => in_array($column, $columns, true)
                        );

                        if ($openingValueColumn !== null) {
                            $openingValue = (float) $openingQuery
                                ->sum($openingValueColumn);

                            if ($kind === 'customers') {
                                $openingDebit = max($openingValue, 0);
                                $openingCredit = max(-$openingValue, 0);
                            } else {
                                $openingCredit = max($openingValue, 0);
                                $openingDebit = max(-$openingValue, 0);
                            }
                        }
                    }
                }
            }

            $activity = (clone $lineBase)
                ->where('l.account_id', $account->id)
                ->selectRaw('
                    COALESCE(SUM(l.debit), 0) AS debit,
                    COALESCE(SUM(l.credit), 0) AS credit
                ')
                ->first();

            $debit = (float) ($activity->debit ?? 0);
            $credit = (float) ($activity->credit ?? 0);

            $totalDebit = $openingDebit + $debit;
            $totalCredit = $openingCredit + $credit;
            $balanceSigned = $totalDebit - $totalCredit;

            if (! $showZero && abs($balanceSigned) < 0.00005) {
                // Keep zero rows out by default, like an operational balance report.
                continue;
            }

            $rows[] = [
                'id' => (int) $account->id,
                'code' => (string) $account->code,
                'name' => (string) $account->name,
                'opening' => round(
                    $openingDebit - $openingCredit,
                    4
                ),
                'debit' => round($debit, 4),
                'credit' => round($credit, 4),
                'balance' => round($balanceSigned, 4),
                'side' => abs($balanceSigned) < 0.00005
                    ? null
                    : ($balanceSigned > 0 ? 'Dr' : 'Cr'),
            ];
        }

        usort(
            $rows,
            fn (array $a, array $b) =>
                strcmp($a['code'], $b['code'])
        );

        $summary = [
            'opening' => round(
                collect($rows)->sum('opening'),
                4
            ),
            'debit' => round(
                collect($rows)->sum('debit'),
                4
            ),
            'credit' => round(
                collect($rows)->sum('credit'),
                4
            ),
            'balance' => round(
                collect($rows)->sum('balance'),
                4
            ),
        ];

        return Inertia::render('Accounting/Balances/Index', [
            'kind' => $kind,
            'title' => $kind === 'customers'
                ? 'Customer Balances'
                : 'Payable Balances',
            'subtitle' => $kind === 'customers'
                ? 'Current receivable position of customer accounts.'
                : 'Current payable position of vendor accounts.',
            'asOf' => $asOf,
            'search' => $search,
            'showZero' => $showZero,
            'rows' => $rows,
            'summary' => $summary,
        ]);
    }
}
