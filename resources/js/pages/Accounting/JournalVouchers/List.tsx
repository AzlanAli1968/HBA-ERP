import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

type Detail = {
    id: number;
    sr: number;
    account_id: number | null;
    account_code: string;
    account_name: string;
    inv_no: string | null;
    particulars: string;
    cheque_no: string;
    posting_date: string | null;
    currency_code: string;
    currency_quantity: number | null;
    currency_rate: number | null;
    debit: number;
    credit: number;
    foreign_debit: number | null;
    foreign_credit: number | null;
    c: boolean;
};

type Voucher = {
    id: number;
    legacy_voucher_id: number | null;
    voucher_no: string;
    voucher_date: string;
    ref_no: string | null;
    combine_voucher: boolean;
    supervised: boolean;
    branch_name: string;
    department_name: string;
    entered_by: string;
    details: Detail[];
    debit_total: number;
    credit_total: number;
    balanced: boolean;
};

type Summary = {
    voucher_count: number;
    line_count: number;
    total_debit: number;
    total_credit: number;
    balanced: boolean;
};

type Props = {
    mode: 'today' | 'all';
    title: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    vouchers: Voucher[];
    summary: Summary;
};

function money(value: number): string {
    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function date(value: string): string {
    if (!value) {
        return '';
    }

    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString('en-GB');
}

function qty(value: number | null): string {
    if (value === null || value === undefined) {
        return '—';
    }

    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

export default function JournalVoucherList({
    mode,
    title,
    search: initialSearch,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    vouchers,
    summary,
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [loading, setLoading] = useState(false);
    const [openRows, setOpenRows] = useState<Record<number, boolean>>({});

    function refresh(): void {
        setLoading(true);

        const url =
            mode === 'today'
                ? '/accounting/journal-vouchers/today'
                : '/accounting/journal-vouchers/all';

        const params =
            mode === 'today'
                ? {
                      search: search.trim() || undefined,
                  }
                : {
                      search: search.trim() || undefined,
                      date_from: dateFrom || undefined,
                      date_to: dateTo || undefined,
                  };

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    }

    function toggleRow(id: number): void {
        setOpenRows((current) => ({
            ...current,
            [id]: !current[id],
        }));
    }

    function expandAll(): void {
        const next: Record<number, boolean> = {};

        vouchers.forEach((voucher) => {
            next[voucher.id] = true;
        });

        setOpenRows(next);
    }

    function deleteJournalVoucher(
    voucher: {
        id: number;
        voucher_no: string;
        legacy_voucher_id: number | null;
    },
) {
    if (
        voucher.legacy_voucher_id !== null
    ) {
        window.alert(
            'Historical imported Journal Vouchers cannot be deleted.',
        );

        return;
    }

    if (
        !window.confirm(
            `Delete Journal Voucher #${voucher.voucher_no}?\n\nThis will permanently remove this JV and its journal entry.`,
        )
    ) {
        return;
    }

    router.delete(
        `/accounting/journal-vouchers/${voucher.id}`,
        {
            preserveScroll: true,
        },
    );
}

    function collapseAll(): void {
        setOpenRows({});
    }

    const allExpanded =
        vouchers.length > 0 &&
        vouchers.every((voucher) => openRows[voucher.id] === true);

    return (
        <>
            <Head title={title} />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1900px] p-4 md:p-6">
                    {/* Header */}
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Accounting / Journal Vouchers
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {mode === 'today'
                                    ? 'Journal vouchers entered today.'
                                    : 'All journal vouchers for the selected period.'}
                            </p>
                        </div>

                        <Link
                            href="/accounting/journal-vouchers/create"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
                        >
                            <Plus className="size-4" />
                            New Journal Voucher
                        </Link>
                    </div>

                    {/* Summary */}
                    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Journal Vouchers
                            </div>

                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                {summary.voucher_count.toLocaleString('en-PK')}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Journal Lines
                            </div>

                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                {summary.line_count.toLocaleString('en-PK')}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Total Debit
                            </div>

                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                {money(summary.total_debit)}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Total Credit
                            </div>

                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                {money(summary.total_credit)}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 rounded-xl border bg-background p-4">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                            <label className="min-w-0 flex-1">
                                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Search
                                </span>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                refresh();
                                            }
                                        }}
                                        placeholder="JV number, reference, branch or department"
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </label>

                            {mode === 'all' && (
                                <>
                                    <label>
                                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                            From
                                        </span>

                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(event) =>
                                                setDateFrom(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 rounded-lg border bg-background px-3 text-sm"
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                            To
                                        </span>

                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(event) =>
                                                setDateTo(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 rounded-lg border bg-background px-3 text-sm"
                                        />
                                    </label>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={refresh}
                                disabled={loading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={
                                        loading
                                            ? 'size-4 animate-spin'
                                            : 'size-4'
                                    }
                                />
                                Refresh
                            </button>

                            <button
                                type="button"
                                onClick={
                                    allExpanded
                                        ? collapseAll
                                        : expandAll
                                }
                                disabled={vouchers.length === 0}
                                className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {allExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                        </div>
                    </div>

                    {/* Voucher Register */}
                    <div className="overflow-hidden rounded-xl border bg-background">
                        <div className="border-b px-4 py-4">
                            <h2 className="text-sm font-semibold">
                                Journal Voucher Register
                            </h2>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {vouchers.length.toLocaleString('en-PK')}{' '}
                                vouchers
                            </p>
                        </div>

                        {vouchers.length === 0 ? (
                            <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                                No Journal Vouchers found.
                            </div>
                        ) : (
                            <div>
                                {vouchers.map((voucher) => {
                                    const isOpen =
                                        openRows[voucher.id] === true;

                                    return (
                                        <div
                                            key={voucher.id}
                                            className="border-b last:border-b-0"
                                        >
                                            {/* Voucher header */}
                                            <div className="flex flex-col gap-3 p-4 hover:bg-muted/10 xl:flex-row xl:items-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRow(
                                                            voucher.id,
                                                        )
                                                    }
                                                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                                >
                                                    <span className="mt-0.5 shrink-0">
                                                        {isOpen ? (
                                                            <ChevronDown className="size-4" />
                                                        ) : (
                                                            <ChevronRight className="size-4" />
                                                        )}
                                                    </span>

                                                    <div className="min-w-[110px]">
                                                        <div className="font-semibold">
                                                            JV #
                                                            {voucher.voucher_no}
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
                                                    </div>

                                                    <div className="min-w-[110px]">
                                                        <div className="text-xs text-muted-foreground">
                                                            Date
                                                        </div>

                                                        <div className="font-medium">
                                                            {date(
                                                                voucher.voucher_date,
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs text-muted-foreground">
                                                            Branch
                                                        </div>

                                                        <div className="truncate font-medium">
                                                            {
                                                                voucher.branch_name
                                                            }
                                                        </div>

                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {
                                                                voucher.department_name
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[130px]">
                                                        <div className="text-xs text-muted-foreground">
                                                            Entered By
                                                        </div>

                                                        <div className="truncate font-medium">
                                                            {
                                                                voucher.entered_by
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[75px] text-right">
                                                        <div className="text-xs text-muted-foreground">
                                                            Lines
                                                        </div>

                                                        <div className="font-semibold tabular-nums">
                                                            {
                                                                voucher
                                                                    .details
                                                                    .length
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[145px] text-right">
                                                        <div className="text-xs text-muted-foreground">
                                                            Debit
                                                        </div>

                                                        <div className="font-semibold tabular-nums">
                                                            {money(
                                                                voucher.debit_total,
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[145px] text-right">
                                                        <div className="text-xs text-muted-foreground">
                                                            Credit
                                                        </div>

                                                        <div className="font-semibold tabular-nums">
                                                            {money(
                                                                voucher.credit_total,
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[100px] text-right">
                                                        <span
                                                            className={
                                                                voucher.balanced
                                                                    ? 'inline-flex rounded-full border px-2 py-1 text-xs font-medium'
                                                                    : 'inline-flex rounded-full border border-destructive/40 px-2 py-1 text-xs font-medium text-destructive'
                                                            }
                                                        >
                                                            {voucher.balanced
                                                                ? 'Balanced'
                                                                : 'Unbalanced'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <Link
                                                    href={`/accounting/journal-vouchers/${voucher.id}/edit`}
                                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </Link>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        voucher.legacy_voucher_id !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        deleteJournalVoucher(
                                                            voucher,
                                                        )
                                                    }
                                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-30"
                                                    title={
                                                        voucher.legacy_voucher_id !==
                                                        null
                                                            ? 'Legacy voucher cannot be deleted'
                                                            : 'Delete Journal Voucher'
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </button>
                                            </div>

                                            {/* Voucher details */}
                                            {isOpen && (
                                                <div className="border-t bg-muted/10 p-4">
                                                    <div className="mb-4 flex flex-wrap gap-3">
                                                        <div className="rounded-lg border bg-background px-3 py-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                Reference No
                                                            </div>

                                                            <div className="mt-0.5 font-medium">
                                                                {voucher.ref_no ||
                                                                    '—'}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-lg border bg-background px-3 py-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                Combine Voucher
                                                            </div>

                                                            <div className="mt-0.5 font-medium">
                                                                {voucher.combine_voucher
                                                                    ? 'True'
                                                                    : 'False'}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-lg border bg-background px-3 py-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                Supervised
                                                            </div>

                                                            <div className="mt-0.5 font-medium">
                                                                {voucher.supervised
                                                                    ? 'Yes'
                                                                    : 'No'}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-lg border bg-background px-3 py-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                Balance
                                                            </div>

                                                            <div className="mt-0.5 font-medium">
                                                                {voucher.balanced
                                                                    ? 'Balanced'
                                                                    : 'Unbalanced'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                                    <table className="w-full min-w-[1350px] text-sm">
    <thead>
        <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3">
                #
            </th>

            <th className="px-3 py-3">
                Account
            </th>

            <th className="px-3 py-3">
                Inv No
            </th>

            <th className="px-3 py-3">
                Particulars
            </th>

            <th className="px-3 py-3">
                Cheque No
            </th>

            <th className="px-3 py-3">
                Posting Date
            </th>

            <th className="px-3 py-3">
                Currency
            </th>

            <th className="px-3 py-3 text-right">
                Qty
            </th>

            <th className="px-3 py-3 text-right">
                Rate
            </th>

            <th className="px-3 py-3 text-right">
                Debit
            </th>

            <th className="px-3 py-3 text-right">
                Credit
            </th>

            <th className="px-3 py-3 text-center">
                C
            </th>
        </tr>
    </thead>

    <tbody>
        {voucher.details.map(
            (
                detail,
            ) => (
                <tr
                    key={
                        detail.id
                    }
                    className="border-b last:border-b-0"
                >
                    {/* # */}
                    <td className="px-3 py-3">
                        {
                            detail.sr
                        }
                    </td>

                    {/* Account */}
                    <td className="px-3 py-3">
                        <div className="font-medium">
                            {
                                detail.account_name
                            }
                        </div>

                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {
                                detail.account_code
                            }
                        </div>
                    </td>

                    {/* Invoice */}
                    <td className="px-3 py-3">
                        {detail.inv_no ||
                            '—'}
                    </td>

                    {/* Particulars */}
                    <td className="max-w-[350px] px-3 py-3">
                        <div className="truncate">
                            {
                                detail.particulars ||
                                '—'
                            }
                        </div>
                    </td>

                    {/* Cheque */}
                    <td className="px-3 py-3">
                        {
                            detail.cheque_no ||
                            '—'
                        }
                    </td>

                    {/* Posting Date */}
                    <td className="px-3 py-3">
                        {detail.posting_date
                            ? date(
                                  detail.posting_date,
                              )
                            : '—'}
                    </td>

                    {/* Currency */}
                    <td className="px-3 py-3">
                        {
                            detail.currency_code ||
                            'Base'
                        }
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3 text-right tabular-nums">
                        {qty(
                            detail.currency_quantity,
                        )}
                    </td>

                    {/* Rate */}
                    <td className="px-3 py-3 text-right tabular-nums">
                        {qty(
                            detail.currency_rate,
                        )}
                    </td>

                    {/* Debit */}
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {detail.debit >
                        0
                            ? money(
                                  detail.debit,
                              )
                            : '—'}
                    </td>

                    {/* Credit */}
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {detail.credit >
                        0
                            ? money(
                                  detail.credit,
                              )
                            : '—'}
                    </td>

                    {/* C */}
                    <td className="px-3 py-3 text-center">
                        {detail.c
                            ? '✓'
                            : ''}
                    </td>
                </tr>
            ),
        )}

        <tr className="bg-muted/20 font-semibold">
            <td
                colSpan={9}
                className="px-3 py-3 text-right"
            >
                Voucher Total
            </td>

            <td className="px-3 py-3 text-right tabular-nums">
                {money(
                    voucher.debit_total,
                )}
            </td>

            <td className="px-3 py-3 text-right tabular-nums">
                {money(
                    voucher.credit_total,
                )}
            </td>

            <td />
        </tr>
    </tbody>
</table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}