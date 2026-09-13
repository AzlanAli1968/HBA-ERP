import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronRight,
    RefreshCw,
    Search,
} from 'lucide-react';
import { Fragment, type FormEvent, useState } from 'react';

type ForeignRow = {
    id: number;
    code: string;
    name: string;
    currency: string;
    amount: number;
};

type CurrencyGroup = {
    currency: string;
    rows: ForeignRow[];
    total: number;
};

type Props = {
    companyName: string;
    companyTagline: string;
    reportTitle: string;
    asOfDate: string;
    printedAt: string;
    search: string;
    groups: CurrencyGroup[];
    grandTotal: number;
};

function money(value: number): string {
    const n = Number(value || 0);
    if (Math.abs(n) < 0.00005) return 'Nil';
    return Math.abs(n).toLocaleString('en-PK', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

function signed(value: number): string {
    const n = Number(value || 0);
    if (Math.abs(n) < 0.00005) return 'Nil';

    const text = Math.abs(n).toLocaleString('en-PK', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });

    return n > 0 ? `${text} Dr` : `${text} Cr`;
}

function formatDate(value: string): string {
    if (!value) return '—';
    const [year, month, day] = value.substring(0, 10).split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
}

export default function CashBankBalancesForeignCurrencies({
    companyName,
    companyTagline,
    reportTitle,
    asOfDate,
    printedAt,
    search: initialSearch,
    groups,
    grandTotal,
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [date, setDate] = useState(asOfDate);
    const [loading, setLoading] = useState(false);

    function refresh(event?: FormEvent) {
        event?.preventDefault();
        setLoading(true);

        router.get(
            '/accounting/cash-bank-balances/foreign-currencies',
            {
                search: search.trim() || undefined,
                as_of: date || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    }

    return (
        <>
            <Head title="Cash/Bank Balances - Foreign Currencies" />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6">
                    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Accounting</span>
                                <ChevronRight className="size-4" />
                                <span>Cash/Bank Balances</span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {reportTitle}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/accounting/cash-bank-balances"
                                className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                            >
                                Base Currency
                            </Link>

                            <button
                                type="button"
                                onClick={() => refresh()}
                                disabled={loading}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="mb-5 rounded-xl border bg-background p-3 shadow-sm">
                        <form
                            onSubmit={refresh}
                            className="grid gap-3 lg:grid-cols-[minmax(300px,1fr)_180px_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search account code or account name..."
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <button
                                type="submit"
                                className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                            >
                                Apply
                            </button>
                        </form>
                    </div>

                    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
                        <div className="border-b px-5 py-4">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="text-xl font-bold tracking-tight">
                                    {companyName}
                                </div>
                                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {companyTagline}
                                </div>
                                <div className="mt-5 text-xl font-bold">
                                    {reportTitle}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    As of {formatDate(asOfDate)}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-t text-xs font-semibold">
                                        <th className="w-[180px] border-r px-3 py-2 text-left">
                                            Account Code
                                        </th>
                                        <th className="border-r px-3 py-2 text-left">
                                            Account Name
                                        </th>
                                        <th className="w-[100px] border-r px-3 py-2 text-center">
                                            Cur
                                        </th>
                                        <th className="w-[220px] px-3 py-2 text-right">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {groups.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-16 text-center text-sm text-muted-foreground"
                                            >
                                                No foreign-currency balances found.
                                            </td>
                                        </tr>
                                    )}

                                    {groups.map((group) => (
                                        <Fragment key={group.currency || 'BASE'}>
                                            {group.currency && (
                                                <tr className="border-t bg-muted/20">
                                                    <td
                                                        colSpan={4}
                                                        className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                                                    >
                                                        {group.currency}
                                                    </td>
                                                </tr>
                                            )}

                                            {group.rows.map((row) => (
                                                <tr
                                                    key={`${row.id}-${row.currency}`}
                                                    className="border-b border-dotted hover:bg-muted/20"
                                                >
                                                    <td className="px-3 py-1.5 font-mono text-xs">
                                                        {row.code}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-xs">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center font-mono text-xs">
                                                        {row.currency || '—'}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                                                        {signed(row.amount)}
                                                    </td>
                                                </tr>
                                            ))}

                                            <tr className="border-b bg-muted/20 font-semibold">
                                                <td
                                                    colSpan={3}
                                                    className="px-3 py-2 text-right"
                                                >
                                                    {group.currency ? `Total ${group.currency}:` : 'Total:'}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {signed(group.total)}
                                                </td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                </tbody>

                                <tfoot>
                                    <tr className="border-t-2 bg-muted/30 font-bold">
                                        <td
                                            colSpan={3}
                                            className="px-3 py-2 text-right"
                                        >
                                            Total Petty Cash &amp; Bank:
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {signed(grandTotal)}
                                        </td>
                                    </tr>
                                    <tr className="bg-muted/20 font-bold">
                                        <td
                                            colSpan={3}
                                            className="px-3 py-2 text-right"
                                        >
                                            Grand Total:
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {signed(grandTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2 border-t px-5 py-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                            <span>Printing Date: {printedAt}</span>
                            <span>View only</span>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
