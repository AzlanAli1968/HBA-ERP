import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    ChevronRight,
    CircleCheck,
    FileText,
    Filter,
    Landmark,
    Plus,
    Pencil,
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
    vouchers: {
        data: Voucher[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        links: PaginationLink[];
    };

    voucherTypes: string[];

    branches: Branch[];

    users: User[];

    filters: {
        search: string;
        type: string;
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
    value: number | string,
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
    value: string | null,
): string {
    if (!value) {
        return '—';
    }

    const datePart = value.substring(0, 10);

    const [year, month, day] =
        datePart.split('-');

    if (
        !year ||
        !month ||
        !day
    ) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

function getStatus(
    voucher: Voucher,
): 'balanced' | 'no-entry' | 'unbalanced' {
    if (voucher.entry_count === 0) {
        return 'no-entry';
    }

    const difference =
        Math.abs(
            Number(voucher.total_debit || 0) -
            Number(voucher.total_credit || 0),
        );

    if (difference > 0.00005) {
        return 'unbalanced';
    }

    return 'balanced';
}

export default function VouchersIndex({
    vouchers,
    voucherTypes,
    branches,
    users,
    filters,
    summary,
}: Props) {
    const [search, setSearch] =
        useState(filters.search);

    function applyFilters(
        event?: FormEvent,
    ) {
        event?.preventDefault();

        router.get(
            '/accounting/vouchers',
            {
                search:
                    search.trim() ||
                    undefined,

                type:
                    filters.type ||
                    undefined,

                branch:
                    filters.branch ||
                    undefined,

                user:
                    filters.user ||
                    undefined,

                date_from:
                    filters.date_from ||
                    undefined,

                date_to:
                    filters.date_to ||
                    undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function updateFilter(
        key:
            | 'type'
            | 'branch'
            | 'user'
            | 'date_from'
            | 'date_to',
        value: string,
    ) {
        router.get(
            '/accounting/vouchers',
            {
                search:
                    search.trim() ||
                    undefined,

                type:
                    key === 'type'
                        ? value || undefined
                        : filters.type ||
                          undefined,

                branch:
                    key === 'branch'
                        ? value || undefined
                        : filters.branch ||
                          undefined,

                user:
                    key === 'user'
                        ? value || undefined
                        : filters.user ||
                          undefined,

                date_from:
                    key === 'date_from'
                        ? value || undefined
                        : filters.date_from ||
                          undefined,

                date_to:
                    key === 'date_to'
                        ? value || undefined
                        : filters.date_to ||
                          undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setSearch('');

        router.get(
            '/accounting/vouchers',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function deleteVoucher(
    voucher: Voucher,
) {
    if (
        voucher.legacy_voucher_id !== null
    ) {
        window.alert(
            'Historical imported vouchers cannot be deleted.',
        );

        return;
    }

    const type =
        voucher.voucher_type === 'BR'
            ? 'Bank Receipt'
            : voucher.voucher_type === 'BP'
              ? 'Bank Payment'
              : 'Voucher';

    const number =
        voucher.voucher_no ??
        String(voucher.id);

    const confirmed =
        window.confirm(
            `Delete ${type} #${number}?\n\nThis will remove the voucher and its accounting journal entry. The related invoice itself will NOT be deleted.`,
        );

    if (!confirmed) {
        return;
    }

    router.delete(
        `/accounting/vouchers/${voucher.id}`,
        {
            preserveScroll: true,
        },
    );
}

    const hasFilters =
        search.trim() !== '' ||
        filters.type !== '' ||
        filters.branch !== '' ||
        filters.user !== '' ||
        filters.date_from !== '' ||
        filters.date_to !== '';

    return (
    <>
        <Head title="Vouchers" />

        <div className="min-h-full bg-muted/20">
                    <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">

                        {/* Page heading */}
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Accounting</span>
                                    <ChevronRight className="size-4" />
                                    <span>Vouchers</span>
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                    Vouchers
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    View historical vouchers and their
                                    journal activity.
                                </p>
                            </div>

                            <div className="text-right text-sm">
                                <p className="text-muted-foreground">
                                    Total Vouchers
                                </p>

                                <p className="text-xl font-semibold">
                                    {summary.total_vouchers.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Summary cards */}
                        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border bg-background p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Vouchers
                                        </p>

                                        <p className="mt-1 text-xl font-semibold tabular-nums">
                                            {summary.total_vouchers.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-2">
                                        <Receipt className="size-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Total Debit
                                        </p>

                                        <p className="mt-1 text-lg font-semibold tabular-nums">
                                            {formatAmount(
                                                summary.total_debit,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-2">
                                        <Landmark className="size-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Total Credit
                                        </p>

                                        <p className="mt-1 text-lg font-semibold tabular-nums">
                                            {formatAmount(
                                                summary.total_credit,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-2">
                                        <FileText className="size-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Needs Attention
                                        </p>

                                        <p className="mt-1 text-xl font-semibold tabular-nums">
                                            {(
                                                summary.no_entry_vouchers +
                                                summary.unbalanced_vouchers
                                            ).toLocaleString()}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {summary.no_entry_vouchers.toLocaleString()}{' '}
                                            no ledger ·{' '}
                                            {summary.unbalanced_vouchers.toLocaleString()}{' '}
                                            unbalanced
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-2">
                                        <AlertCircle className="size-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action bar */}
                        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3 shadow-sm">
                            <Link
                                href="/accounting/vouchers/create"
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90"
                            >
                                <Plus className="size-4" />
                                New Voucher
                            </Link>

                            <button
                                type="button"
                                onClick={() =>
                                    router.reload()
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                            >
                                <RefreshCw className="size-4" />
                                Refresh
                            </button>

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                >
                                    <X className="size-4" />
                                    Clear Filters
                                </button>
                            )}
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
                                className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_160px_190px_190px_150px_150px_auto]"
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
                                        placeholder="Search voucher, reference, account, user..."
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Type */}
                                <select
                                    value={filters.type}
                                    onChange={(event) =>
                                        updateFilter(
                                            'type',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">
                                        All Types
                                    </option>

                                    {voucherTypes.map((type) => (
                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </option>
                                    ))}
                                </select>

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

                                    {branches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
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

                                    {users.map((user) => (
                                        <option
                                            key={user.id}
                                            value={String(user.id)}
                                        >
                                            {user.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Date From */}
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        type="date"
                                        value={filters.date_from}
                                        onChange={(event) =>
                                            updateFilter(
                                                'date_from',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Date To */}
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        type="date"
                                        value={filters.date_to}
                                        onChange={(event) =>
                                            updateFilter(
                                                'date_to',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        {/* Voucher list */}
                        <section className="min-w-0 rounded-2xl border bg-background shadow-sm">
                            <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Voucher Register
                                    </h2>

                                    <p className="text-xs text-muted-foreground">
                                        {vouchers.total.toLocaleString()}{' '}
                                        vouchers
                                    </p>
                                </div>

                                {vouchers.total > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Showing{' '}
                                        {vouchers.from}
                                        –
                                        {vouchers.to}
                                        {' '}of{' '}
                                        {vouchers.total}
                                    </p>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1450px] text-sm">
    <thead>
        <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-semibold">
                Voucher #
            </th>

            <th className="px-4 py-3 font-semibold">
                Date
            </th>

            <th className="px-4 py-3 font-semibold">
                Type
            </th>

            <th className="px-4 py-3 font-semibold">
                Cash / Bank
            </th>

            <th className="px-4 py-3 font-semibold">
                Client / Party
            </th>

            <th className="px-4 py-3 font-semibold">
                Entered By
            </th>

            <th className="px-4 py-3 font-semibold">
                Branch
            </th>

            <th className="px-4 py-3 font-semibold">
                Reference
            </th>

            <th className="px-4 py-3 text-right font-semibold">
                Debit
            </th>

            <th className="px-4 py-3 text-right font-semibold">
                Credit
            </th>

            <th className="px-4 py-3 text-center font-semibold">
                Lines
            </th>

            <th className="px-4 py-3 text-center font-semibold">
                Status
            </th>

            <th className="px-4 py-3 text-center font-semibold">
                Actions
            </th>
        </tr>
    </thead>

    <tbody>
        {vouchers.data.length === 0 ? (
            <tr>
                <td
                    colSpan={13}
                    className="px-6 py-16 text-center"
                >
                    <div className="mx-auto max-w-sm">
                        <Receipt className="mx-auto size-10 text-muted-foreground/50" />

                        <p className="mt-3 font-medium">
                            No vouchers found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Try changing the
                            search or filters.
                        </p>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                            >
                                <X className="size-4" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        ) : (
            vouchers.data.map((voucher) => {
                const status =
                    getStatus(voucher);

                const type =
                    (
                        voucher.voucher_type ??
                        ''
                    ).toUpperCase();

                const supported =
                    type === 'BR' ||
                    type === 'BP' ||
                    type === 'JV';

                const legacy =
                    voucher.legacy_voucher_id !==
                    null;

                const canDelete =
                    supported &&
                    !legacy;

                const editHref =
                    type === 'JV'
                        ? `/accounting/journal-vouchers/${voucher.id}/edit`
                        : `/accounting/vouchers/${voucher.id}/edit`;

                const deleteHref =
                    type === 'JV'
                        ? `/accounting/journal-vouchers/${voucher.id}`
                        : `/accounting/vouchers/${voucher.id}`;

                const typeLabel =
                    type === 'BR'
                        ? 'Bank Receipt'
                        : type === 'BP'
                          ? 'Bank Payment'
                          : type === 'JV'
                            ? 'Journal Voucher'
                            : 'Voucher';

                return (
                    <tr
                        key={voucher.id}
                        className="border-b transition hover:bg-muted/20"
                    >
                        {/* Voucher # */}
                        <td className="px-4 py-3">
                            <div className="font-mono text-xs font-semibold">
                                #
                                {voucher.voucher_no ??
                                    voucher.legacy_voucher_id ??
                                    voucher.id}
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

                        {/* Type */}
                        <td className="px-4 py-3">
                            <span className="inline-flex rounded-md border px-2 py-1 font-mono text-xs font-semibold">
                                {voucher.voucher_type ??
                                    '—'}
                            </span>

                            <div className="mt-1 text-[10px] text-muted-foreground">
                                {typeLabel}
                            </div>
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

                                    <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">
                                        {voucher.cash_bank_account_name ??
                                            '—'}
                                    </div>
                                </>
                            ) : (
                                '—'
                            )}
                        </td>

                        {/* Client / Party */}
                        <td className="px-4 py-3">
                            {voucher.party_display ? (
                                <div className="max-w-[240px]">
                                    <div className="font-mono text-xs font-semibold">
                                        {
                                            voucher.party_display
                                                .split(
                                                    ' — ',
                                                )[0]
                                        }
                                    </div>

                                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                        {voucher.party_display
                                            .split(
                                                ' — ',
                                            )
                                            .slice(1)
                                            .join(
                                                ' — ',
                                            )}
                                    </div>
                                </div>
                            ) : (
                                '—'
                            )}
                        </td>

                        {/* Entered By */}
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

                        {/* Reference */}
                        <td className="px-4 py-3">
                            <div className="max-w-[180px] truncate">
                                {voucher.ref_no ??
                                    '—'}
                            </div>

                            {voucher.supervised && (
                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                    Supervised
                                </div>
                            )}
                        </td>

                        {/* Debit */}
                        <td className="px-4 py-3 text-right tabular-nums">
                            {formatAmount(
                                voucher.total_debit,
                            )}
                        </td>

                        {/* Credit */}
                        <td className="px-4 py-3 text-right tabular-nums">
                            {formatAmount(
                                voucher.total_credit,
                            )}
                        </td>

                        {/* Lines */}
                        <td className="px-4 py-3 text-center tabular-nums">
                            {voucher.line_count}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                            {status ===
                                'balanced' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                                    <CircleCheck className="size-3.5" />
                                    Balanced
                                </span>
                            )}

                            {status ===
                                'no-entry' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    <AlertCircle className="size-3.5" />
                                    No Entry
                                </span>
                            )}

                            {status ===
                                'unbalanced' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                                    <AlertCircle className="size-3.5" />
                                    Unbalanced
                                </span>
                            )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                            {supported ? (
                                <div className="flex items-center justify-center gap-1">
                                    {/* Edit */}
                                    <Link
                                        href={
                                            editHref
                                        }
                                        className="inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        title={`Edit ${typeLabel}`}
                                    >
                                        <Pencil className="size-4" />
                                    </Link>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        disabled={
                                            !canDelete
                                        }
                                        onClick={() => {
                                            if (
                                                !canDelete
                                            ) {
                                                window.alert(
                                                    `Historical imported ${typeLabel}s cannot be deleted.`,
                                                );

                                                return;
                                            }

                                            const number =
                                                voucher.voucher_no ??
                                                String(
                                                    voucher.id,
                                                );

                                            const confirmed =
                                                window.confirm(
                                                    `Delete ${typeLabel} #${number}?\n\nThis will delete the voucher and its accounting journal entry.\n\nThe related invoice will NOT be deleted.`,
                                                );

                                            if (
                                                !confirmed
                                            ) {
                                                return;
                                            }

                                            router.delete(
                                                deleteHref,
                                                {
                                                    preserveScroll:
                                                        true,
                                                },
                                            );
                                        }}
                                        className="inline-flex size-8 items-center justify-center rounded-md border text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-30"
                                        title={
                                            canDelete
                                                ? `Delete ${typeLabel}`
                                                : 'Legacy voucher cannot be deleted'
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                '—'
                            )}
                        </td>
                    </tr>
                );
            })
        )}
    </tbody>

    <tfoot>
        <tr className="bg-muted/30 font-semibold">
            <td
                colSpan={8}
                className="px-4 py-3 text-right"
            >
                Filtered Total
            </td>

            <td className="px-4 py-3 text-right tabular-nums">
                {formatAmount(
                    summary.total_debit,
                )}
            </td>

            <td className="px-4 py-3 text-right tabular-nums">
                {formatAmount(
                    summary.total_credit,
                )}
            </td>

            <td
                colSpan={3}
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
                                        {vouchers.current_page}{' '}
                                        of{' '}
                                        {vouchers.last_page}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1">
                                        {vouchers.links.map(
                                            (link, index) => {
                                                if (!link.url) {
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
                                                        href={link.url}
                                                        preserveState
className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs transition ${
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