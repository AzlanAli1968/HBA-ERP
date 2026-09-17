import { Head, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronRight,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useState } from 'react';


type BalanceRow = {
    id: number;
    code: string;
    name: string;
    opening: number;
    debit: number;
    credit: number;
    balance: number;
    side: 'Dr' | 'Cr' | null;
};

type Summary = {
    opening: number;
    debit: number;
    credit: number;
    balance: number;
};

type Props = {
    kind: 'customers' | 'payables';
    title: string;
    subtitle: string;
    asOf: string;
    search: string;
    showZero: boolean;
    rows: BalanceRow[];
    summary: Summary;
};

function money(value: number) {
    return Math.abs(value).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function displayOpening(value: number) {
    if (Math.abs(value) < 0.00005) {
        return '—';
    }

    return (
        `(${money(value)}) ` +
        (value > 0 ? 'Dr' : 'Cr')
    );
}

function displayBalance(
    value: number,
    side: 'Dr' | 'Cr' | null,
) {
    if (!side || Math.abs(value) < 0.00005) {
        return '—';
    }

    return `${money(value)} ${side}`;
}

export default function Index({
    kind,
    title,
    subtitle,
    asOf,
    search: initialSearch,
    showZero: initialShowZero,
    rows,
    summary,
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [showZero, setShowZero] = useState(
        initialShowZero,
    );
    const [loading, setLoading] = useState(false);


    function submit() {
        setLoading(true);

        router.get(
            kind === 'customers'
                ? '/accounting/balances/customers'
                : '/accounting/balances/payables',
            {
                search: search || undefined,
                as_of: asOf,
                show_zero: showZero ? 1 : 0,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            },
        );
    }

    return (
    <>
        <Head title={title} />

        <div className="min-h-full bg-muted/20">
                <div className="min-h-full bg-muted/20">
                    <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Accounting</span>
                                    <ChevronRight className="size-4" />
                                    <span>
                                        {kind ===
                                        'customers'
                                            ? 'Customer Balances'
                                            : 'Payable Balances'}
                                    </span>
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                    {title}
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            </div>

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
                                                    submit();
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
                                        onChange={() => {
                                            /*
                                             * asOf is server supplied and intentionally
                                             * immutable in this first current-position
                                             * report. Datewise reporting is next.
                                             */
                                        }}
                                        readOnly
                                        className="h-10 rounded-lg border bg-muted px-3 text-sm"
                                    />
                                </label>

                                <label className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={
                                            showZero
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            setShowZero(
                                                event
                                                    .target
                                                    .checked,
                                            );
                                        }}
                                        className="size-4"
                                    />
                                    Show zero balances
                                </label>

                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={loading}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`size-4 ${
                                            loading
                                                ? 'animate-spin'
                                                : ''
                                        }`}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="mb-4 grid gap-4 md:grid-cols-4">
                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-xs text-muted-foreground">
                                    Accounts
                                </div>
                                <div className="mt-1 text-2xl font-bold">
                                    {rows.length.toLocaleString(
                                        'en-PK',
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-xs text-muted-foreground">
                                    Opening
                                </div>
                                <div className="mt-1 text-lg font-semibold tabular-nums">
                                    {displayOpening(
                                        summary.opening,
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-xs text-muted-foreground">
                                    Current Debit
                                </div>
                                <div className="mt-1 text-lg font-semibold tabular-nums">
                                    {money(
                                        summary.debit,
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-xs text-muted-foreground">
                                    Current Credit
                                </div>
                                <div className="mt-1 text-lg font-semibold tabular-nums">
                                    {money(
                                        summary.credit,
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-background">
                            <div className="flex items-center justify-between border-b px-4 py-4">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        {title}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {
                                            rows.length
                                        }{' '}
                                        account
                                        {rows.length === 1
                                            ? ''
                                            : 's'}
                                    </p>
                                </div>

                                <span className="text-xs text-muted-foreground">
                                    Ledger balance
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">
                                                Code
                                            </th>
                                            <th className="px-4 py-3">
                                                Account Name
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
                                            <th className="w-[60px] px-4 py-3" />
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

                                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                    {displayOpening(
                                                        row.opening,
                                                    )}
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
                                                    {displayBalance(
                                                        row.balance,
                                                        row.side,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <a
                                                        href={`/accounts/${row.id}`}
                                                        title="Open account"
                                                        className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                                                    >
                                                        <ArrowUpRight className="size-4" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}

                                        {rows.length ===
                                            0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        7
                                                    }
                                                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                                                >
                                                    No accounts
                                                    match
                                                    the current
                                                    filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                    <tfoot>
                                        <tr className="border-t bg-muted/30 font-semibold">
                                            <td
                                                colSpan={2}
                                                className="px-4 py-3"
                                            >
                                                Total
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {displayOpening(
                                                    summary.opening,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {money(
                                                    summary.debit,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {money(
                                                    summary.credit,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {displayBalance(
                                                    summary.balance,
                                                    summary.balance >
                                                        0
                                                        ? 'Dr'
                                                        : summary.balance <
                                                            0
                                                          ? 'Cr'
                                                          : null,
                                                )}
                                            </td>

                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                    </div>
    </>
);
}
