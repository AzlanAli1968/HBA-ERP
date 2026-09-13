import { Head, router } from '@inertiajs/react';
import { RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

type Row = {
    id: number;
    code: string;
    name: string;
    phone: string;
    opening: number;
    debit: number;
    credit: number;
    balance: number;
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
    if (Math.abs(value) < 0.00005) {
        return '—';
    }

    return Math.abs(value).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function WithPhone({
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

    function refresh() {
        setLoading(true);

        router.get(
            '/accounting/balances/customers/phone',
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
                            Accounting / Customer Balances
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
                                    Search customer
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
                                        placeholder="Account code, name or phone"
                                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </label>

                            <div className="text-sm text-muted-foreground">
                                As of{' '}
                                <span className="font-medium text-foreground">
                                    {new Date(
                                        asOf +
                                            'T00:00:00',
                                    ).toLocaleDateString(
                                        'en-GB',
                                    )}
                                </span>
                            </div>

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
                                customer accounts
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">
                                            Code
                                        </th>

                                        <th className="px-4 py-3">
                                            Account Name
                                        </th>

                                        <th className="px-4 py-3">
                                            Phone
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Opening
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Debit
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Credit
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b last:border-0 hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {row.code}
                                            </td>

                                            <td className="px-4 py-3 font-medium">
                                                {row.name}
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">
                                                {row.phone ||
                                                    '—'}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {Math.abs(
                                                    row.opening,
                                                ) <
                                                0.00005
                                                    ? '—'
                                                    : `${money(
                                                          row.opening,
                                                      )} ${
                                                          row.opening >
                                                          0
                                                              ? 'Dr'
                                                              : 'Cr'
                                                      }`}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {money(
                                                    row.debit,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {money(
                                                    row.credit,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                {row.side
                                                    ? `${money(
                                                          row.balance,
                                                      )} ${row.side}`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}

                                    {rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-16 text-center text-sm text-muted-foreground"
                                            >
                                                No customer accounts found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}