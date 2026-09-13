import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Filter,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

type Branch = {
    id: number;
    name: string;
    legacy_id: number | null;
};

type User = {
    id: number;
    name: string;
    legacy_username: string | null;
};

type Voucher = {
    id: number;
    legacy_voucher_id: number | null;
    voucher_no: string | null;
    voucher_date: string | null;
    voucher_type: string | null;

    cash_bank_account_code: string | null;
    cash_bank_account_name: string | null;

    party_display: string | null;

    created_by: number | null;
    legacy_entered_by: string | null;
    entered_by_name: string | null;
    entered_by_username: string | null;

    entry_date: string | null;
    ref_no: string | null;

    supervised: boolean;
    supervised_by: string | null;

    branch_id: number | null;
    department_id: number | null;

    branch_name: string | null;
    department_name: string | null;

    legacy_branch_id: number | null;
    legacy_department_id: number | null;

    total_debit: string | number;
    total_credit: string | number;
    line_count: number;
    entry_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    mode: 'today' | 'all';

    title: string;

    subtitle: string;

    vouchers: {
        data: Voucher[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        links: PaginationLink[];
    };

    branches: Branch[];

    users: User[];

    filters: {
        search: string;
        branch: string;
        user: string;
        date_from: string;
        date_to: string;
    };

    summary: {
        total_vouchers: number;
        total_debit: number;
        total_credit: number;
        no_entry_vouchers: number;
        unbalanced_vouchers: number;
    };
};

function formatAmount(
    value: string | number | null | undefined,
): string {
    return Number(value || 0).toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    );
}

function formatDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return '—';
    }

    const datePart = value.substring(0, 10);

    const [
        year,
        month,
        day,
    ] = datePart.split('-');

    if (
        !year ||
        !month ||
        !day
    ) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

function getPartyParts(
    value: string | null,
) {
    if (!value) {
        return {
            code: '',
            name: '',
        };
    }

    const parts = value.split(' — ');

    return {
        code: parts[0] ?? '',
        name: parts.slice(1).join(' — '),
    };
}

function getAmount(
    voucher: Voucher,
): number {
    const debit = Number(
        voucher.total_debit || 0,
    );

    const credit = Number(
        voucher.total_credit || 0,
    );

    /*
     * BP should normally have equal debit/credit totals.
     * Debit is the vendor/expense side, which is the useful
     * amount to show on a payment list.
     */
    if (debit > 0) {
        return debit;
    }

    return credit;
}

function getStatus(
    voucher: Voucher,
): 'balanced' | 'unbalanced' | 'no-entry' {
    if (
        voucher.entry_count === 0
    ) {
        return 'no-entry';
    }

    const debit =
        Number(
            voucher.total_debit || 0,
        );

    const credit =
        Number(
            voucher.total_credit || 0,
        );

    if (
        Math.abs(
            debit - credit,
        ) > 0.00005
    ) {
        return 'unbalanced';
    }

    return 'balanced';
}

export default function PaymentList({
    mode,
    title,
    subtitle,
    vouchers,
    branches,
    users,
    filters,
    summary,
}: Props) {
    const [
        search,
        setSearch,
    ] = useState(
        filters.search,
    );

    function buildParams(
        overrides: Record<string, string | undefined> = {},
    ) {
        return {
            search:
                overrides.search !== undefined
                    ? overrides.search || undefined
                    : search.trim() || undefined,

            branch:
                overrides.branch !== undefined
                    ? overrides.branch || undefined
                    : filters.branch || undefined,

            user:
                overrides.user !== undefined
                    ? overrides.user || undefined
                    : filters.user || undefined,

            date_from:
                overrides.date_from !== undefined
                    ? overrides.date_from || undefined
                    : filters.date_from || undefined,

            date_to:
                overrides.date_to !== undefined
                    ? overrides.date_to || undefined
                    : filters.date_to || undefined,
        };
    }

    function applyFilters(
        event?: FormEvent,
    ) {
        event?.preventDefault();

        const url =
            mode === 'today'
                ? '/accounting/payments/today'
                : '/accounting/payments/all';

        router.get(
            url,
            buildParams(),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function updateFilter(
        key:
            | 'branch'
            | 'user'
            | 'date_from'
            | 'date_to',
        value: string,
    ) {
        const url =
            mode === 'today'
                ? '/accounting/payments/today'
                : '/accounting/payments/all';

        router.get(
            url,
            buildParams({
                [key]: value,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function deletePayment(
    voucher: Voucher,
) {
    if (
        voucher.legacy_voucher_id !== null
    ) {
        window.alert(
            'Historical imported payments cannot be deleted.',
        );

        return;
    }

    const number =
        voucher.voucher_no ??
        String(voucher.id);

    if (
        !window.confirm(
            `Delete Bank Payment #${number}?\n\nThis will remove the payment and its accounting entry. The related invoice will NOT be deleted.`,
        )
    ) {
        return;
    }

    router.delete(
        `/accounting/vouchers/${voucher.id}`,
        {
            preserveScroll: true,
        },
    );
}

    function clearFilters() {
        setSearch('');

        const url =
            mode === 'today'
                ? '/accounting/payments/today'
                : '/accounting/payments/all';

        router.get(
            url,
            mode === 'today'
                ? {}
                : {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const hasFilters =
        search.trim() !== '' ||
        filters.branch !== '' ||
        filters.user !== '' ||
        (
            mode === 'all' &&
            (
                filters.date_from !== '' ||
                filters.date_to !== ''
            )
        );

    return (
        <>
            <Head title={title} />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">

                    {/* Header */}
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Accounting</span>
                                <ChevronRight className="size-4" />
                                <span>Payments</span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/accounting/vouchers/create?type=BP"
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
                            >
                                <Plus className="size-4" />
                                New Payment
                            </Link>

                            <button
                                type="button"
                                onClick={() =>
                                    router.reload()
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                            >
                                <RefreshCw className="size-4" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                        <div className="rounded-xl border bg-background p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Payments
                            </div>

                            <div className="mt-1 text-2xl font-semibold tabular-nums">
                                {summary.total_vouchers.toLocaleString()}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Total Paid
                            </div>

                            <div className="mt-1 text-2xl font-semibold tabular-nums">
                                {formatAmount(
                                    summary.total_debit,
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Payment Lines
                            </div>

                            <div className="mt-1 text-2xl font-semibold tabular-nums">
                                {vouchers.data.reduce(
                                    (
                                        total,
                                        voucher,
                                    ) =>
                                        total +
                                        Number(
                                            voucher.line_count || 0,
                                        ),
                                    0,
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Status
                            </div>

                            <div className="mt-1 text-lg font-semibold">
                                {summary.unbalanced_vouchers > 0
                                    ? 'Needs Attention'
                                    : 'Balanced'}
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                                {summary.unbalanced_vouchers} unbalanced
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 rounded-2xl border bg-background p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Filter className="size-4 text-muted-foreground" />

                            <p className="text-sm font-semibold">
                                Filters
                            </p>
                        </div>

                        <form
                            onSubmit={applyFilters}
                            className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_190px_190px_150px_150px_auto]"
                        >
                            {/* Search */}
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Search payment, party, reference..."
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Branch */}
                            <select
                                value={filters.branch}
                                onChange={(event) =>
                                    updateFilter(
                                        'branch',
                                        event.target.value,
                                    )
                                }
                                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">
                                    All Branches
                                </option>

                                {branches.map(
                                    (branch) => (
                                        <option
                                            key={branch.id}
                                            value={String(
                                                branch.id,
                                            )}
                                        >
                                            {branch.name}
                                        </option>
                                    ),
                                )}
                            </select>

                            {/* User */}
                            <select
                                value={filters.user}
                                onChange={(event) =>
                                    updateFilter(
                                        'user',
                                        event.target.value,
                                    )
                                }
                                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">
                                    All Users
                                </option>

                                {users.map(
                                    (user) => (
                                        <option
                                            key={user.id}
                                            value={String(
                                                user.id,
                                            )}
                                        >
                                            {user.name}
                                        </option>
                                    ),
                                )}
                            </select>

                            {/* Date From */}
                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="date"
                                    value={
                                        filters.date_from
                                    }
                                    disabled={
                                        mode === 'today'
                                    }
                                    onChange={(event) =>
                                        updateFilter(
                                            'date_from',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                />
                            </div>

                            {/* Date To */}
                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="date"
                                    value={
                                        filters.date_to
                                    }
                                    disabled={
                                        mode === 'today'
                                    }
                                    onChange={(event) =>
                                        updateFilter(
                                            'date_to',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                            >
                                Search
                            </button>
                        </form>

                        {mode === 'today' && (
                            <div className="mt-3 text-xs text-muted-foreground">
                                Showing payments dated{' '}
                                <span className="font-medium text-foreground">
                                    {formatDate(
                                        filters.date_from,
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <section className="min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm">

                        <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Payment Register
                                </h2>

                                <p className="text-xs text-muted-foreground">
                                    {vouchers.total.toLocaleString()}{' '}
                                    payment vouchers
                                </p>
                            </div>

                            {vouchers.total > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Showing{' '}
                                    {vouchers.from}
                                    {' – '}
                                    {vouchers.to}
                                    {' of '}
                                    {vouchers.total}
                                </p>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1250px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">

                                        <th className="px-4 py-3">
                                            Payment #
                                        </th>

                                        <th className="px-4 py-3">
                                            Date
                                        </th>

                                        <th className="px-4 py-3">
                                            Cash / Bank
                                        </th>

                                        <th className="px-4 py-3">
                                            Vendor / Party
                                        </th>

                                        <th className="px-4 py-3">
                                            Particular / Reference
                                        </th>

                                        <th className="px-4 py-3">
                                            Entered By
                                        </th>

                                        <th className="px-4 py-3">
                                            Branch
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Lines
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Amount
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {vouchers.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={11}
                                                className="px-6 py-16 text-center"
                                            >
                                                <Receipt className="mx-auto size-10 text-muted-foreground/40" />

                                                <p className="mt-3 font-medium">
                                                    No payments found
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Try changing the search or filters.
                                                </p>

                                                {hasFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            clearFilters
                                                        }
                                                        className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                                                    >
                                                        <X className="size-4" />
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        vouchers.data.map(
                                            (voucher) => {
                                                const party =
                                                    getPartyParts(
                                                        voucher.party_display,
                                                    );

                                                const status =
                                                    getStatus(
                                                        voucher,
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            voucher.id
                                                        }
                                                        className="border-b transition hover:bg-muted/20"
                                                    >
                                                        {/* Payment # */}
                                                        <td className="px-4 py-3">
                                                            <div className="font-mono text-xs font-semibold">
                                                                #
                                                                {
                                                                    voucher.voucher_no ??
                                                                    voucher.legacy_voucher_id ??
                                                                    voucher.id
                                                                }
                                                            </div>

                                                            {voucher.legacy_voucher_id !==
                                                                null && (
                                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                    Legacy ID{' '}
                                                                    {
                                                                        voucher.legacy_voucher_id
                                                                    }
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Date */}
                                                        <td className="whitespace-nowrap px-4 py-3">
                                                            <div className="font-medium">
                                                                {formatDate(
                                                                    voucher.voucher_date,
                                                                )}
                                                            </div>

                                                            {voucher.entry_date && (
                                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                    Entered{' '}
                                                                    {formatDate(
                                                                        voucher.entry_date,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Cash / Bank */}
                                                        <td className="px-4 py-3">
                                                            {voucher.cash_bank_account_code ? (
                                                                <>
                                                                    <div className="font-mono text-xs font-semibold">
                                                                        {
                                                                            voucher.cash_bank_account_code
                                                                        }
                                                                    </div>

                                                                    <div className="mt-0.5 max-w-[190px] truncate text-[11px] text-muted-foreground">
                                                                        {
                                                                            voucher.cash_bank_account_name ??
                                                                            '—'
                                                                        }
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>

                                                        {/* Party */}
                                                        <td className="px-4 py-3">
                                                            {party.code ? (
                                                                <div className="max-w-[230px]">
                                                                    <div className="font-mono text-xs font-semibold">
                                                                        {
                                                                            party.code
                                                                        }
                                                                    </div>

                                                                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                                        {
                                                                            party.name
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>

                                                        {/* Reference */}
                                                        <td className="px-4 py-3">
                                                            <div className="max-w-[250px] truncate">
                                                                {
                                                                    voucher.ref_no ??
                                                                    '—'
                                                                }
                                                            </div>
                                                        </td>

                                                        {/* Entered by */}
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">
                                                                {voucher.entered_by_name ??
                                                                    voucher.legacy_entered_by ??
                                                                    '—'}
                                                            </div>

                                                            {voucher.entered_by_username &&
                                                                voucher.entered_by_username !==
                                                                    voucher.entered_by_name && (
                                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                        {
                                                                            voucher.entered_by_username
                                                                        }
                                                                    </div>
                                                                )}
                                                        </td>

                                                        {/* Branch */}
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {voucher.branch_name ??
                                                                (voucher.legacy_branch_id
                                                                    ? `Legacy #${voucher.legacy_branch_id}`
                                                                    : '—')}
                                                        </td>

                                                        {/* Lines */}
                                                        <td className="px-4 py-3 text-center tabular-nums">
                                                            {
                                                                voucher.line_count
                                                            }
                                                        </td>

                                                        {/* Amount */}
                                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                            {formatAmount(
                                                                getAmount(
                                                                    voucher,
                                                                ),
                                                            )}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-4 py-3 text-center">
                                                            {status ===
                                                                'balanced' && (
                                                                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                                                                    Balanced
                                                                </span>
                                                            )}

                                                            {status ===
                                                                'unbalanced' && (
                                                                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                                                                    Unbalanced
                                                                </span>
                                                            )}

                                                            {status ===
                                                                'no-entry' && (
                                                                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                    No Entry
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Link
                                                                    href={`/accounting/vouchers/${voucher.id}/edit`}
                                                                    className="inline-flex size-8 items-center justify-center rounded-md border hover:bg-muted"
                                                                    title="Edit payment"
                                                                >
                                                                    <Edit3 className="size-4" />
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        voucher.legacy_voucher_id !==
                                                                        null
                                                                    }
                                                                    onClick={() =>
                                                                        deletePayment(
                                                                            voucher,
                                                                        )
                                                                    }
                                                                    className="inline-flex size-8 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-30"
                                                                    title={
                                                                        voucher.legacy_voucher_id !==
                                                                        null
                                                                            ? 'Legacy payment cannot be deleted'
                                                                            : 'Delete payment'
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )
                                    )}
                                </tbody>

                                <tfoot>
                                    <tr className="bg-muted/30 font-semibold">
                                        <td
                                            colSpan={8}
                                            className="px-4 py-3 text-right"
                                        >
                                            Total
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatAmount(
                                                summary.total_debit,
                                            )}
                                        </td>

                                        <td
                                            colSpan={2}
                                            className="px-4 py-3"
                                        />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Pagination */}
                        {vouchers.total > 0 && (
                            <div className="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between">

                                <div className="text-xs text-muted-foreground">
                                    Page{' '}
                                    {vouchers.current_page}
                                    {' of '}
                                    {vouchers.last_page}
                                </div>

                                <div className="flex flex-wrap items-center gap-1">
                                    {vouchers.links.map(
                                        (
                                            link,
                                            index,
                                        ) => {
                                            if (
                                                !link.url
                                            ) {
                                                return (
                                                    <span
                                                        key={`${link.label}-${index}`}
                                                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs text-muted-foreground/50"
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                link.label,
                                                        }}
                                                    />
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={`${link.label}-${index}`}
                                                    href={
                                                        link.url
                                                    }
                                                    preserveState
                                                    preserveScroll
                                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs ${
                                                        link.active
                                                            ? 'bg-foreground text-background'
                                                            : 'hover:bg-muted'
                                                    }`}
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            link.label,
                                                    }}
                                                />
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}