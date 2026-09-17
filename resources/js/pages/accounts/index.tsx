import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Building2,
    Check,
    CircleDollarSign,
    Landmark,
    Plus,
    Search,
    Settings2,
    X,
} from 'lucide-react';
import {
    useState,
    type ComponentType,
    type FormEvent,
} from 'react';

type AccountType = {
    id: number;
    code: string;
    name: string;
    group_name: string | null;
    accounts_count: number;
};

type Account = {
    id: number;
    code: string;
    name: string;
    branch: string;
    city_category: string | null;
    opening_debit: string;
    opening_credit: string;
    opening_date: string | null;
    creator: {
        id: number;
        name: string;
    } | null;
    account_type?: {
        id: number;
        code: string;
        name: string;
    } | null;
};

type PaginatedAccounts = {
    data: Account[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    accountTypes: AccountType[];
    accounts: PaginatedAccounts;
    filters: {
        type: string;
        search: string;
    };
    totals: {
        opening_debit: number;
        opening_credit: number;
        difference: number;
    };
};

const groupIcons: Record<
    string,
    ComponentType<{ className?: string }>
> = {
    'Liquid Assets': Landmark,
    'Current Assets': CircleDollarSign,
    'Fix Assets': Building2,
    'Current Liabilities': Building2,
    'Fix Liabilities': Building2,
    Equity: CircleDollarSign,
    'Cost of Revenue': CircleDollarSign,
    'Administrative and General Expenses': Settings2,
    Revenue: CircleDollarSign,
    'Other Income': CircleDollarSign,
};

function formatAmount(value: number | string): string {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return '0.00';
    }

    return amount.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function AccountsIndex({
    accountTypes,
    accounts,
    filters,
    totals,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const selectedAccountType = accountTypes.find(
        (type) => type.code === filters.type,
    );

    function applySearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            '/accounts',
            {
                type: filters.type || undefined,
                search: search.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function selectType(code: string) {
        setIsAdding(false);
        setNewAccountName('');

        router.get(
            '/accounts',
            {
                type: code || undefined,
                search: search.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setSearch('');
        setIsAdding(false);
        setNewAccountName('');

        router.get(
            '/accounts',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function startAdding() {
        if (!selectedAccountType) {
            return;
        }

        setNewAccountName('');
        setIsAdding(true);
    }

    function cancelAdding() {
        setNewAccountName('');
        setIsAdding(false);
    }

    function saveAccount() {
        const name = newAccountName.trim();

        if (!selectedAccountType || !name || isSaving) {
            return;
        }

        setIsSaving(true);

        router.post(
            '/accounts',
            {
                account_type_id: selectedAccountType.id,
                name,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewAccountName('');
                    setIsAdding(false);
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    }

    function handleNewAccountKeyDown(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveAccount();
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            cancelAdding();
        }
    }

    const groupedTypes = accountTypes.reduce<
        Record<string, AccountType[]>
    >((groups, type) => {
        const group = type.group_name ?? 'Other';

        if (!groups[group]) {
            groups[group] = [];
        }

        groups[group].push(type);

        return groups;
    }, {});

    const totalAccountCount = accountTypes.reduce(
        (sum, type) => sum + type.accounts_count,
        0,
    );

    return (
        <>
            <Head title="Accounts" />

            <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">
                    {/* Page heading */}
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Accounting</span>
                                <span>/</span>
                                <span className="font-medium text-foreground">
                                    Accounts
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                Accounts
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage the chart of accounts, opening
                                balances and account classifications.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-background px-5 py-3 shadow-sm">
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Accounts
                            </p>

                            <p className="mt-0.5 text-2xl font-bold tabular-nums">
                                {accounts.total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled
                                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium opacity-50"
                            >
                                <ArrowLeftRight className="size-4" />
                                Transfer Account
                            </button>

                            <button
                                type="button"
                                disabled
                                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium opacity-50"
                            >
                                <Building2 className="size-4" />
                                Shirka
                            </button>

                            <button
                                type="button"
                                disabled
                                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium opacity-50"
                            >
                                <CircleDollarSign className="size-4" />
                                Update Foreign Opening
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={startAdding}
                            disabled={!selectedAccountType || isAdding}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                                selectedAccountType
                                    ? 'Add a new account'
                                    : 'Select an account type first'
                            }
                        >
                            <Plus className="size-4" />
                            New Account
                        </button>
                    </div>

                    {/* Main area */}
                    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                        {/* Account type panel */}
                        <aside className="min-w-0 rounded-2xl border bg-background shadow-sm">
                            <div className="border-b px-4 py-4">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Account Type
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    Chart of Accounts
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    {totalAccountCount.toLocaleString()}{' '}
                                    active accounts
                                </p>
                            </div>

                            <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-2">
                                {/* All accounts */}
                                <button
                                    type="button"
                                    onClick={() => selectType('')}
                                    className={`mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                                        filters.type === ''
                                            ? 'bg-foreground text-background shadow-sm'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <span>All Accounts</span>

                                    <span className="text-xs tabular-nums opacity-70">
                                        {totalAccountCount.toLocaleString()}
                                    </span>
                                </button>

                                {Object.entries(groupedTypes).map(
                                    ([group, types]) => (
                                        <div
                                            key={group}
                                            className="mb-4 last:mb-0"
                                        >
                                            <div className="px-3 pb-1 pt-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    {group}
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                {types.map((type) => {
                                                    const Icon =
                                                        groupIcons[group] ??
                                                        CircleDollarSign;

                                                    const active =
                                                        filters.type ===
                                                        type.code;

                                                    return (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            onClick={() =>
                                                                selectType(
                                                                    type.code,
                                                                )
                                                            }
                                                            className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                                                                active
                                                                    ? 'bg-foreground text-background shadow-sm'
                                                                    : 'hover:bg-muted'
                                                            }`}
                                                        >
                                                            <Icon className="size-4 shrink-0 opacity-70" />

                                                            <span className="min-w-0 flex-1 truncate">
                                                                <span className="mr-2 font-mono text-[10px] opacity-60">
                                                                    {
                                                                        type.code
                                                                    }
                                                                </span>

                                                                {type.name}
                                                            </span>

                                                            <span className="shrink-0 text-xs tabular-nums opacity-60">
                                                                {type.accounts_count.toLocaleString()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </aside>

                        {/* Accounts table */}
                        <section className="min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm">
                            {/* Table toolbar */}
                            <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <h2 className="font-semibold">
                                        {selectedAccountType?.name ??
                                            'All Accounts'}
                                    </h2>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {accounts.total.toLocaleString()}{' '}
                                        account
                                        {accounts.total === 1
                                            ? ''
                                            : 's'}
                                    </p>
                                </div>

                                <form
                                    onSubmit={applySearch}
                                    className="flex w-full max-w-xl items-center gap-2"
                                >
                                    <div className="relative min-w-0 flex-1">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        <input
                                            type="search"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search code, name, branch or category..."
                                            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
                                    >
                                        Search
                                    </button>

                                    {(filters.type || filters.search) && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="h-10 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </form>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                            <th className="px-4 py-3 font-semibold">
                                                Code
                                            </th>

                                            <th className="px-4 py-3 font-semibold">
                                                Name
                                            </th>

                                            <th className="px-4 py-3 font-semibold">
                                                Branch
                                            </th>

                                            <th className="px-4 py-3 font-semibold">
                                                City / Category
                                            </th>

                                            <th className="px-4 py-3 text-right font-semibold">
                                                Opening Dr
                                            </th>

                                            <th className="px-4 py-3 text-right font-semibold">
                                                Opening Cr
                                            </th>

                                            <th className="px-4 py-3 font-semibold">
                                                Created By
                                            </th>

                                            <th className="px-4 py-3 font-semibold">
                                                Opening Date
                                            </th>

                                            <th className="px-4 py-3 text-right font-semibold">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {/* Inline new account row */}
                                        {isAdding &&
                                            selectedAccountType && (
                                                <tr className="border-b bg-muted/20">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                                                            Auto
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={
                                                                newAccountName
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                setNewAccountName(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={
                                                                handleNewAccountKeyDown
                                                            }
                                                            placeholder="Enter account name..."
                                                            className="h-9 w-full min-w-[220px] rounded-lg border bg-background px-3 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                                            disabled={isSaving}
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        Head Office
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        —
                                                    </td>

                                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                        0.00
                                                    </td>

                                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                        0.00
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        Current User
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        Today
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    saveAccount
                                                                }
                                                                disabled={
                                                                    !newAccountName.trim() ||
                                                                    isSaving
                                                                }
                                                                className="inline-flex size-9 items-center justify-center rounded-lg bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                                                title="Save account"
                                                            >
                                                                <Check className="size-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    cancelAdding
                                                                }
                                                                disabled={
                                                                    isSaving
                                                                }
                                                                className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted disabled:opacity-40"
                                                                title="Cancel"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                        {accounts.data.length === 0 &&
                                        !isAdding ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="px-6 py-20 text-center"
                                                >
                                                    <div className="mx-auto max-w-md">
                                                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
                                                            <Landmark className="size-6 text-muted-foreground" />
                                                        </div>

                                                        <h3 className="mt-4 font-semibold">
                                                            No accounts found
                                                        </h3>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {filters.search
                                                                ? 'Try changing your search.'
                                                                : selectedAccountType
                                                                  ? 'This account type has no accounts yet. Click New Account to create one.'
                                                                  : 'Select an account type to create an account.'}
                                                        </p>

                                                        {selectedAccountType &&
                                                            !filters.search && (
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        startAdding
                                                                    }
                                                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
                                                                >
                                                                    <Plus className="size-4" />
                                                                    New Account
                                                                </button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            accounts.data.map((account) => (
                                                <tr
                                                    key={account.id}
                                                    className="border-b last:border-0 transition hover:bg-muted/20"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs font-semibold">
                                                            {account.code}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">
                                                            {account.name}
                                                        </div>

                                                        {account.account_type && (
                                                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                {
                                                                    account
                                                                        .account_type
                                                                        .code
                                                                }{' '}
                                                                ·{' '}
                                                                {
                                                                    account
                                                                        .account_type
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {account.branch ||
                                                            '—'}
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {account.city_category ||
                                                            '—'}
                                                    </td>

                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {formatAmount(
                                                            account.opening_debit,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {formatAmount(
                                                            account.opening_credit,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {account.creator
                                                            ?.name || '—'}
                                                    </td>

                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDate(
                                                            account.opening_date,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={`/accounts/${account.id}`}
                                                            className="font-medium underline-offset-4 hover:underline"
                                                        >
                                                            Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>

                                    {/* Totals */}
                                    <tfoot>
                                        <tr className="border-t bg-muted/30 font-semibold">
                                            <td
                                                colSpan={4}
                                                className="px-4 py-3 text-right"
                                            >
                                                Total Opening
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatAmount(
                                                    totals.opening_debit,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatAmount(
                                                    totals.opening_credit,
                                                )}
                                            </td>

                                            <td
                                                colSpan={2}
                                                className="px-4 py-3 text-right"
                                            >
                                                Difference
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatAmount(
                                                    totals.difference,
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Pagination */}
                            {accounts.total > 0 && (
                                <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Showing{' '}
                                        <strong className="font-semibold text-foreground">
                                            {accounts.from ?? 0}
                                        </strong>{' '}
                                        to{' '}
                                        <strong className="font-semibold text-foreground">
                                            {accounts.to ?? 0}
                                        </strong>{' '}
                                        of{' '}
                                        <strong className="font-semibold text-foreground">
                                            {accounts.total.toLocaleString()}
                                        </strong>
                                    </span>

                                    <span>
                                        Page{' '}
                                        <strong className="font-semibold text-foreground">
                                            {accounts.current_page}
                                        </strong>{' '}
                                        of{' '}
                                        <strong className="font-semibold text-foreground">
                                            {accounts.last_page}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}