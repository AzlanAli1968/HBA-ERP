import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Edit3,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Detail = {
    id: number;
    sr: number;
    account_id: number | null;
    account_code: string;
    account_name: string;
    particulars: string;
    invoice_no: string | null;
    cheque_no: string | null;
    posting_date: string | null;
    currency_code: string | null;
    currency_quantity: number | null;
    currency_rate: number | null;
    foreign_credit: number | null;
    amount: number;
};

type ReceiptVoucher = {
    id: number;
    legacy_voucher_id: number | null;
    voucher_no: string;
    voucher_date: string;
    ref_no: string | null;
    cash_bank_account_code: string;
    cash_bank_account_name: string;
    entered_by: string;
    supervised: boolean;
    details: Detail[];
    total: number;
};

type Props = {
    mode: 'today' | 'all';
    title: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    vouchers: ReceiptVoucher[];
    summary: {
        voucher_count: number;
        line_count: number;
        total: number;
    };
};

function formatMoney(value: number): string {
    return Number(value).toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    );
}

function formatDate(value: string): string {
    if (!value) {
        return '—';
    }

    return new Date(
        `${value}T00:00:00`,
    ).toLocaleDateString(
        'en-GB',
    );
}

export default function ReceiptList({
    mode,
    title,
    search: initialSearch,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    vouchers,
    summary,
}: Props) {
    const [search, setSearch] =
        useState(initialSearch);

    const [dateFrom, setDateFrom] =
        useState(initialDateFrom);

    const [dateTo, setDateTo] =
        useState(initialDateTo);

    const [loading, setLoading] =
        useState(false);

    const [open, setOpen] =
        useState<Record<number, boolean>>(
            {},
        );

    const allOpen = useMemo(
        () =>
            vouchers.length > 0 &&
            vouchers.every(
                (voucher) =>
                    open[voucher.id] === true,
            ),
        [
            vouchers,
            open,
        ],
    );

    function refresh() {
        setLoading(true);

        router.get(
            mode === 'today'
                ? '/accounting/receipts/today'
                : '/accounting/receipts/all',
            mode === 'today'
                ? {
                      search:
                          search || undefined,
                  }
                : {
                      search:
                          search || undefined,
                      date_from:
                          dateFrom,
                      date_to:
                          dateTo,
                  },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () =>
                    setLoading(false),
            },
        );
    }

    function toggleVoucher(
        id: number,
    ) {
        setOpen(
            (current) => ({
                ...current,
                [id]:
                    !current[id],
            }),
        );
    }

    function toggleAll() {
        const next: Record<
            number,
            boolean
        > = {};

        vouchers.forEach(
            (voucher) => {
                next[voucher.id] =
                    !allOpen;
            },
        );

        setOpen(next);
    }

    function deleteReceipt(
        voucher: ReceiptVoucher,
    ) {
        if (
            voucher.legacy_voucher_id !==
            null
        ) {
            window.alert(
                'Historical imported receipts cannot be deleted.',
            );

            return;
        }

        const number =
            voucher.voucher_no ??
            String(voucher.id);

        if (
            !window.confirm(
                `Delete Bank Receipt #${number}?\n\nThis will remove the receipt and its accounting entry. The related invoice will NOT be deleted.`,
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

    return (
        <>
            <Head title={title} />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Accounting / Receipts
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {mode === 'today'
                                    ? 'All bank receipt vouchers entered today.'
                                    : 'All bank receipt vouchers within the selected date range.'}
                            </p>
                        </div>

                        <div className="text-right text-sm text-muted-foreground">
                            <div>
                                {formatDate(
                                    dateFrom,
                                )}{' '}
                                →{' '}
                                {formatDate(
                                    dateTo,
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs text-muted-foreground">
                                Receipt Vouchers
                            </div>

                            <div className="mt-1 text-2xl font-bold">
                                {summary.voucher_count.toLocaleString(
                                    'en-PK',
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs text-muted-foreground">
                                Receipt Lines
                            </div>

                            <div className="mt-1 text-2xl font-bold">
                                {summary.line_count.toLocaleString(
                                    'en-PK',
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-xs text-muted-foreground">
                                Total Receipts
                            </div>

                            <div className="mt-1 text-2xl font-bold">
                                {formatMoney(
                                    summary.total,
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 rounded-xl border bg-background p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <label className="flex-1">
                                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Search receipt
                                </span>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        value={search}
                                        onChange={(
                                            event,
                                        ) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        onKeyDown={(
                                            event,
                                        ) => {
                                            if (
                                                event.key ===
                                                'Enter'
                                            ) {
                                                refresh();
                                            }
                                        }}
                                        placeholder="Voucher no, bank, account or reference"
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
                                            onChange={(
                                                event,
                                            ) =>
                                                setDateFrom(
                                                    event
                                                        .target
                                                        .value,
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
                                            onChange={(
                                                event,
                                            ) =>
                                                setDateTo(
                                                    event
                                                        .target
                                                        .value,
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
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50"
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
                                    toggleAll
                                }
                                disabled={
                                    vouchers.length ===
                                    0
                                }
                                className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                            >
                                {allOpen
                                    ? 'Collapse All'
                                    : 'Expand All'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-background">
                        <div className="border-b px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Receipt Vouchers
                                    </h2>

                                    <p className="text-xs text-muted-foreground">
                                        {vouchers.length.toLocaleString(
                                            'en-PK',
                                        )}{' '}
                                        vouchers
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            {vouchers.map(
                                (
                                    voucher,
                                ) => {
                                    const isOpen =
                                        open[
                                            voucher.id
                                        ] ===
                                        true;

                                    return (
                                        <div
                                            key={
                                                voucher.id
                                            }
                                            className="border-b last:border-0"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleVoucher(
                                                        voucher.id,
                                                    )
                                                }
                                                className="flex flex-1 flex-col gap-3 px-4 py-4 text-left hover:bg-muted/20 lg:flex-row lg:items-center"
                                            >
                                                <div className="flex items-center gap-3 lg:w-[100px]">
                                                    {isOpen ? (
                                                        <ChevronDown className="size-4" />
                                                    ) : (
                                                        <ChevronRight className="size-4" />
                                                    )}

                                                    <div>
                                                        <div className="font-semibold">
                                                            #
                                                            {
                                                                voucher.voucher_no
                                                            }
                                                        </div>

                                                        {voucher.legacy_voucher_id !==
                                                            null && (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Legacy ID{' '}
                                                                {
                                                                    voucher.legacy_voucher_id
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="lg:w-[120px]">
                                                    <div className="font-medium">
                                                        {formatDate(
                                                            voucher.voucher_date,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium">
                                                        {
                                                            voucher.cash_bank_account_code
                                                        }
                                                    </div>

                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {
                                                            voucher.cash_bank_account_name
                                                        }
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs text-muted-foreground">
                                                        Entered By
                                                    </div>

                                                    <div className="font-medium">
                                                        {
                                                            voucher.entered_by
                                                        }
                                                    </div>
                                                </div>

                                                <div className="min-w-[150px] text-right">
                                                    <div className="text-xs text-muted-foreground">
                                                        Lines
                                                    </div>

                                                    <div className="font-medium">
                                                        {
                                                            voucher
                                                                .details
                                                                .length
                                                        }
                                                    </div>
                                                </div>

                                                <div className="min-w-[170px] text-right">
                                                    <div className="text-xs text-muted-foreground">
                                                        Voucher Total
                                                    </div>

                                                    <div className="text-base font-bold">
                                                        {formatMoney(
                                                            voucher.total,
                                                        )}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="flex shrink-0 items-center gap-2 px-4 py-4 lg:px-0 lg:pr-4">
                                                <Link
                                                    href={`/accounting/vouchers/${voucher.id}/edit`}
                                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                    title="Edit receipt"
                                                >
                                                    <Edit3 className="size-4" />
                                                    Edit
                                                </Link>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        voucher.legacy_voucher_id !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        deleteReceipt(
                                                            voucher,
                                                        )
                                                    }
                                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-30"
                                                    title={
                                                        voucher.legacy_voucher_id !==
                                                        null
                                                            ? 'Legacy receipt cannot be deleted'
                                                            : 'Delete receipt'
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </button>
                                            </div>

                                            {isOpen && (
                                                <div className="border-t bg-muted/10 px-4 py-4">
                                                    <div className="mb-3 grid gap-3 text-sm md:grid-cols-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Cash / Bank Account
                                                            </div>

                                                            <div className="font-medium">
                                                                {
                                                                    voucher.cash_bank_account_code
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    voucher.cash_bank_account_name
                                                                }
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Reference
                                                            </div>

                                                            <div className="font-medium">
                                                                {
                                                                    voucher.ref_no ||
                                                                    '—'
                                                                }
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Status
                                                            </div>

                                                            <div className="font-medium">
                                                                {voucher.supervised
                                                                    ? 'Supervised'
                                                                    : 'Not supervised'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                                        <table className="w-full min-w-[1050px] text-sm">
                                                            <thead>
                                                                <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                                                    <th className="px-3 py-2">
                                                                        Sr
                                                                    </th>

                                                                    <th className="px-3 py-2">
                                                                        Account Name
                                                                    </th>

                                                                    <th className="px-3 py-2">
                                                                        Particulars
                                                                    </th>

                                                                    <th className="px-3 py-2">
                                                                        Inv No
                                                                    </th>

                                                                    <th className="px-3 py-2">
                                                                        Cheque No
                                                                    </th>

                                                                    <th className="px-3 py-2">
                                                                        Currency
                                                                    </th>

                                                                    <th className="px-3 py-2 text-right">
                                                                        Qty
                                                                    </th>

                                                                    <th className="px-3 py-2 text-right">
                                                                        Rate
                                                                    </th>

                                                                    <th className="px-3 py-2 text-right">
                                                                        Amount
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
                                                                            className="border-b last:border-0"
                                                                        >
                                                                            <td className="px-3 py-2">
                                                                                {
                                                                                    detail.sr
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-2">
                                                                                <div className="font-medium">
                                                                                    {
                                                                                        detail.account_name
                                                                                    }
                                                                                </div>

                                                                                <div className="font-mono text-[11px] text-muted-foreground">
                                                                                    {
                                                                                        detail.account_code
                                                                                    }
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-3 py-2">
                                                                                {
                                                                                    detail.particulars ||
                                                                                    '—'
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-2">
                                                                                {
                                                                                    detail.invoice_no ||
                                                                                    '—'
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-2">
                                                                                {
                                                                                    detail.cheque_no ||
                                                                                    '—'
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-2 font-mono">
                                                                                {
                                                                                    detail.currency_code ||
                                                                                    '—'
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                                {detail.currency_quantity !==
                                                                                    null
                                                                                    ? detail.currency_quantity.toLocaleString(
                                                                                          'en-PK',
                                                                                          {
                                                                                              minimumFractionDigits: 3,
                                                                                              maximumFractionDigits: 3,
                                                                                          },
                                                                                      )
                                                                                    : '—'}
                                                                            </td>

                                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                                {detail.currency_rate !==
                                                                                    null
                                                                                    ? detail.currency_rate.toLocaleString(
                                                                                          'en-PK',
                                                                                          {
                                                                                              minimumFractionDigits: 3,
                                                                                              maximumFractionDigits: 3,
                                                                                          },
                                                                                      )
                                                                                    : '—'}
                                                                            </td>

                                                                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                                                                {formatMoney(
                                                                                    detail.amount,
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}

                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            8
                                                                        }
                                                                        className="px-3 py-3 text-right font-semibold"
                                                                    >
                                                                        Voucher Total
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right font-bold">
                                                                        {formatMoney(
                                                                            voucher.total,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                },
                            )}

                            {vouchers.length ===
                                0 && (
                                <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                                    No receipt vouchers found for the selected filters.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}