import { Head, router } from '@inertiajs/react';
import { RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

type Row = {
    id: number;
    code: string;
    name: string;
    currency: string;
    amount: number;
    side: 'Dr' | 'Cr' | null;
};

type Props = {
    title: string;
    subtitle: string;
    asOf: string;
    search: string;
    rows: Row[];
};

function money(value: number): string {
    return Math.abs(value).toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        },
    );
}

export default function ForeignCurrencies({
    title,
    subtitle,
    asOf,
    search: initialSearch,
    rows,
}: Props) {
    const [search, setSearch] =
        useState(initialSearch);

    const [loading, setLoading] =
        useState(false);

    const isPayable =
        title
            .toLowerCase()
            .startsWith('payable');

    const totalsByCurrency = rows.reduce<
        Record<string, { currency: string; amount: number }>
    >((acc, row) => {
        const currency = (row.currency || '').trim();
        const key = currency || 'BASE';

        if (!acc[key]) {
            acc[key] = {
                currency,
                amount: 0,
            };
        }

        const amount = Math.abs(Number(row.amount || 0));
        acc[key].amount += row.side === 'Cr' ? -amount : amount;

        return acc;
    }, {});

    const payableTotals = Object.values(totalsByCurrency).sort((a, b) =>
        a.currency.localeCompare(b.currency),
    );

    function totalText(value: number): string {
        const n = Number(value || 0);

        if (Math.abs(n) < 0.00005) {
            return 'Nil';
        }

        const text = Math.abs(n).toLocaleString('en-PK', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        });

        return n > 0 ? `${text} Dr` : `${text} Cr`;
    }

    function refresh() {
        setLoading(true);

        router.get(
            isPayable
                ? '/accounting/balances/payables/foreign'
                : '/accounting/balances/customers/foreign',
            {
                search:
                    search || undefined,
                as_of: asOf,
            },
            {
                preserveState: true,
                onFinish: () =>
                    setLoading(false),
            },
        );
    }

    return (
        <>
            <Head title={title} />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">
                    <div className="mb-5">
                        <div className="text-sm text-muted-foreground">
                            Accounting / Balances
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight">
                            {title}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mb-4 rounded-xl border bg-background p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <label className="flex-1">
                                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Search account
                                </span>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value,
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key ===
                                                'Enter'
                                            ) {
                                                refresh();
                                            }
                                        }}
                                        placeholder="Account code or name"
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </label>

                            <label>
                                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    As of
                                </span>

                                <input
                                    type="date"
                                    value={asOf}
                                    readOnly
                                    className="h-10 rounded-lg border bg-muted px-3 text-sm"
                                />
                            </label>

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
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-background">
                        <div className="border-b px-4 py-4">
                            <h2 className="text-sm font-semibold">
                                Accounts Current Position
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                {rows.length.toLocaleString(
                                    'en-PK',
                                )}{' '}
                                account / currency rows
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[750px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">
                                            Account Code
                                        </th>

                                        <th className="px-4 py-3">
                                            Account Name
                                        </th>

                                        <th className="px-4 py-3">
                                            Cur
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Amount
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Side
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            key={`${row.id}-${row.currency}-${index}`}
                                            className="border-b last:border-0 hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {row.code}
                                            </td>

                                            <td className="px-4 py-3 font-medium">
                                                {row.name}
                                            </td>

                                            <td className="px-4 py-3 font-mono">
                                                {row.currency ||
                                                    '—'}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {money(
                                                    row.amount,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold">
                                                {row.side ||
                                                    '—'}
                                            </td>
                                        </tr>
                                    ))}

                                    {rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-16 text-center text-sm text-muted-foreground"
                                            >
                                                No foreign-currency balances found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {isPayable && payableTotals.length > 0 && (
                                    <tfoot>
                                        {payableTotals.map((total) => (
                                            <tr
                                                key={`total-${total.currency || 'BASE'}`}
                                                className="border-t bg-muted/20 font-bold"
                                            >
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-3 text-right"
                                                >
                                                    Total Payable Balance
                                                    {total.currency
                                                        ? ` - ${total.currency}`
                                                        : ' - Base Currency'}
                                                    :{' '}
                                                    <span className="tabular-nums">
                                                        {totalText(total.amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}