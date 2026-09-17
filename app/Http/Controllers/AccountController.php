<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedType = $request->string('type')->toString();
        $search = trim($request->string('search')->toString());

        $accountsQuery = Account::query()
            ->with([
                'accountType:id,code,name',
                'creator:id,name',
            ])
            ->where('is_active', true)
            ->when(
                $selectedType !== '',
                fn ($query) => $query->whereHas(
                    'accountType',
                    fn ($typeQuery) => $typeQuery->where(
                        'code',
                        $selectedType
                    )
                )
            )
            ->when(
                $search !== '',
                fn ($query) => $query->where(function ($q) use ($search) {
                    $q->where(
                        'code',
                        'like',
                        "%{$search}%"
                    )
                        ->orWhere(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'branch',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'city_category',
                            'like',
                            "%{$search}%"
                        );
                })
            );

        $accounts = $accountsQuery
            ->orderBy('code')
            ->paginate(25)
            ->withQueryString();

        $totalsQuery = clone $accountsQuery;

        $totals = [
            'opening_debit' => (float) $totalsQuery->sum(
                'opening_debit'
            ),
            'opening_credit' => (float) $totalsQuery->sum(
                'opening_credit'
            ),
        ];

        $totals['difference'] =
            $totals['opening_debit']
            - $totals['opening_credit'];

        $accountTypes = AccountType::query()
            ->withCount([
                'accounts' => fn ($query) => $query->where(
                    'is_active',
                    true
                ),
            ])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('accounts/index', [
            'accountTypes' => $accountTypes,
            'accounts' => $accounts,
            'filters' => [
                'type' => $selectedType,
                'search' => $search,
            ],
            'totals' => $totals,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'account_type_id' => [
                'required',
                'integer',
                'exists:account_types,id',
            ],
            'name' => [
                'required',
                'string',
                'max:200',
            ],
        ]);

        $account = DB::transaction(function () use ($validated) {
            $accountType = AccountType::query()
                ->lockForUpdate()
                ->findOrFail(
                    $validated['account_type_id']
                );

            $prefix = $accountType->code;

            $lastAccount = Account::query()
                ->where(
                    'account_type_id',
                    $accountType->id
                )
                ->where(
                    'code',
                    'like',
                    $prefix . '%'
                )
                ->orderByDesc('code')
                ->lockForUpdate()
                ->first();

            $nextNumber = 1;

            if ($lastAccount) {
                $suffix = substr(
                    $lastAccount->code,
                    strlen($prefix)
                );

                if (ctype_digit($suffix)) {
                    $nextNumber =
                        ((int) $suffix) + 1;
                }
            }

            $code = $prefix . str_pad(
                (string) $nextNumber,
                4,
                '0',
                STR_PAD_LEFT
            );

            return Account::create([
                'account_type_id' =>
                    $accountType->id,
                'code' => $code,
                'name' =>
                    trim($validated['name']),
                'branch' => 'Head Office',
                'opening_debit' => 0,
                'opening_credit' => 0,
                'created_by' =>
                    auth()->id(),
                'opening_date' => now(),
                'is_active' => true,
            ]);
        });

        return to_route(
            'accounts.show',
            $account
        )->with(
            'success',
            'Account created successfully.'
        );
    }

    public function show(Account $account): Response
    {
        $account->load([
            'accountType:id,code,name',
            'creator:id,name',
        ]);

        return Inertia::render('accounts/show', [
            'account' => $account,
            'accountTypes' => AccountType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get([
                    'id',
                    'code',
                    'name',
                ]),
        ]);
    }

    public function opening(Account $account): Response
    {
        $account->load([
            'accountType:id,code,name',
            'creator:id,name',
            'openingBalances.currency:id,code,name,symbol',
        ]);

        $currencies = Currency::query()
            ->where('is_active', true)
            ->orderByDesc('is_base')
            ->orderBy('code')
            ->get([
                'id',
                'code',
                'name',
                'symbol',
                'is_base',
            ]);

        return Inertia::render('accounts/opening', [
            'account' => $account,
            'currencies' => $currencies,
        ]);
    }

    public function invoices(Account $account): Response
    {
        $account->load([
            'accountType:id,code,name',
            'creator:id,name',
        ]);

        /*
         * The actual Invoice module has not been built yet.
         *
         * We intentionally return an empty collection here instead
         * of creating fake invoice data or inventing an invoice
         * database structure.
         *
         * Once the Invoice module is built, this will be replaced
         * with the real account-linked invoice query.
         */
        $invoices = [];

        return Inertia::render('accounts/invoices', [
            'account' => $account,
            'invoices' => $invoices,
        ]);
    }

    public function updateOpening(
        Request $request,
        Account $account
    ): RedirectResponse {
        $validated = $request->validate([
            'opening_debit' => [
                'required',
                'numeric',
                'min:0',
            ],

            'opening_credit' => [
                'required',
                'numeric',
                'min:0',
            ],

            'foreign_openings' => [
                'nullable',
                'array',
            ],

            'foreign_openings.*.currency_id' => [
                'required',
                'integer',
                'exists:currencies,id',
            ],

            'foreign_openings.*.exchange_rate' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'foreign_openings.*.opening_debit' => [
                'required',
                'numeric',
                'min:0',
            ],

            'foreign_openings.*.opening_credit' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        DB::transaction(function () use (
            $validated,
            $account
        ) {
            $account->update([
                'opening_debit' =>
                    $validated['opening_debit'],
                'opening_credit' =>
                    $validated['opening_credit'],
            ]);

            $account->openingBalances()->delete();

            foreach (
                $validated['foreign_openings'] ?? []
                as $opening
            ) {
                if (
                    (float) $opening['opening_debit'] === 0.0
                    && (float) $opening['opening_credit'] === 0.0
                ) {
                    continue;
                }

                $account->openingBalances()->create([
                    'currency_id' =>
                        $opening['currency_id'],
                    'exchange_rate' =>
                        $opening['exchange_rate'],
                    'opening_debit' =>
                        $opening['opening_debit'],
                    'opening_credit' =>
                        $opening['opening_credit'],
                ]);
            }
        });

        return to_route(
            'accounts.opening',
            $account
        )->with(
            'success',
            'Opening balances updated successfully.'
        );
    }

    public function update(
        Request $request,
        Account $account
    ): RedirectResponse {
        $validated = $request->validate([
            'client_type' => [
                'nullable',
                'string',
                'max:50',
            ],

            'name' => [
                'required',
                'string',
                'max:200',
            ],

            'account_type_id' => [
                'required',
                'integer',
                'exists:account_types,id',
            ],

            'city_category' => [
                'nullable',
                'string',
                'max:150',
            ],

            'care_of_employee' => [
                'nullable',
                'string',
                'max:150',
            ],

            'contact' => [
                'nullable',
                'string',
                'max:150',
            ],

            'designation' => [
                'nullable',
                'string',
                'max:150',
            ],

            'mobile' => [
                'nullable',
                'string',
                'max:50',
            ],

            'contact_2' => [
                'nullable',
                'string',
                'max:150',
            ],

            'designation_2' => [
                'nullable',
                'string',
                'max:150',
            ],

            'company' => [
                'nullable',
                'string',
                'max:200',
            ],

            'business_phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'home_phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'fax' => [
                'nullable',
                'string',
                'max:50',
            ],

            'email' => [
                'nullable',
                'email',
                'max:190',
            ],

            'address' => [
                'nullable',
                'string',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'website' => [
                'nullable',
                'string',
                'max:255',
            ],

            'credit_limit' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'credit_days' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'bank_name' => [
                'nullable',
                'string',
                'max:150',
            ],

            'bank_branch' => [
                'nullable',
                'string',
                'max:150',
            ],

            'bank_account_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'tax_type' => [
                'nullable',
                'string',
                'max:30',
            ],

            'tax_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'strn' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $account->update([
            'client_type' =>
                $validated['client_type'] ?? null,

            'name' =>
                trim($validated['name']),

            'account_type_id' =>
                $validated['account_type_id'],

            'city_category' =>
                $validated['city_category'] ?? null,

            'care_of_employee' =>
                $validated['care_of_employee'] ?? null,

            'contact' =>
                $validated['contact'] ?? null,

            'designation' =>
                $validated['designation'] ?? null,

            'mobile' =>
                $validated['mobile'] ?? null,

            'contact_2' =>
                $validated['contact_2'] ?? null,

            'designation_2' =>
                $validated['designation_2'] ?? null,

            'company' =>
                $validated['company'] ?? null,

            'business_phone' =>
                $validated['business_phone'] ?? null,

            'home_phone' =>
                $validated['home_phone'] ?? null,

            'fax' =>
                $validated['fax'] ?? null,

            'email' =>
                $validated['email'] ?? null,

            'address' =>
                $validated['address'] ?? null,

            'country' =>
                $validated['country'] ?? null,

            'website' =>
                $validated['website'] ?? null,

            'credit_limit' =>
                $validated['credit_limit'] ?? 0,

            'credit_days' =>
                $validated['credit_days'] ?? 0,

            'bank_name' =>
                $validated['bank_name'] ?? null,

            'bank_branch' =>
                $validated['bank_branch'] ?? null,

            'bank_account_number' =>
                $validated['bank_account_number'] ?? null,

            'tax_type' =>
                $validated['tax_type'] ?? null,

            'tax_number' =>
                $validated['tax_number'] ?? null,

            'strn' =>
                $validated['strn'] ?? null,
        ]);

        return to_route(
            'accounts.show',
            $account
        )->with(
            'success',
            'Account updated successfully.'
        );
    }
}