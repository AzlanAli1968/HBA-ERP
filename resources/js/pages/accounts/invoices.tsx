import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    Plus,
    RefreshCw,
} from 'lucide-react';

type AccountType = {
    id: number;
    code: string;
    name: string;
};

type Account = {
    id: number;
    code: string;
    name: string;
    branch: string;

    accountType?: AccountType | null;

    creator?: {
        id: number;
        name: string;
    } | null;
};

type Invoice = {
    id: number;
    invoice_id: string;
    invoice_date: string | null;
    balance: string;
    passenger_name: string | null;
};

type Props = {
    account: Account;
    invoices: Invoice[];
};

function formatAmount(
    value: number | string,
): string {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return '0.00';
    }

    return amount.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        },
    );
}

export default function AccountInvoices({
    account,
    invoices,
}: Props) {
    return (
        <>
            <Head
                title={`${account.name} - Invoices`}
            />

            <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20">
                <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6">
                    {/* Header */}
                    <div className="mb-5">
                        <Link
                            href={`/accounts/${account.id}`}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Account
                        </Link>

                        <div className="mt-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                                    {account.code}
                                </span>

                                <span className="text-sm text-muted-foreground">
                                    Account Details
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {account.name}
                            </h1>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span>
                                    {
                                        account
                                            .accountType
                                            ?.code
                                    }{' '}
                                    ·{' '}
                                    {
                                        account
                                            .accountType
                                            ?.name
                                    }
                                </span>

                                <span>•</span>

                                <span>
                                    {account.branch}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-5 overflow-x-auto rounded-xl border bg-background shadow-sm">
                        <div className="flex min-w-max">
                            <Link
                                href={`/accounts/${account.id}`}
                                className="px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                General
                            </Link>

                            <Link
                                href={`/accounts/${account.id}/opening`}
                                className="px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                Opening
                            </Link>

                            <div className="border-b-2 border-foreground px-5 py-3 text-sm font-semibold">
                                Invoices
                            </div>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Notes
                            </div>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Payable
                            </div>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Receivable
                            </div>
                        </div>
                    </div>

                    {/* Invoice card */}
                    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Invoices
                                </h2>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Invoices linked to this
                                    account
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium opacity-50"
                                    title="Invoice creation will be built with the main Invoice module."
                                >
                                    <Plus className="size-4" />
                                    Add Invoice
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium opacity-50"
                                    title="Requery will be connected when the Invoice module is active."
                                >
                                    <RefreshCw className="size-4" />
                                    Requery
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                        <th className="px-5 py-3 font-semibold">
                                            Invoice ID
                                        </th>

                                        <th className="px-5 py-3 font-semibold">
                                            Invoice Date
                                        </th>

                                        <th className="px-5 py-3 text-right font-semibold">
                                            Balance
                                        </th>

                                        <th className="px-5 py-3 font-semibold">
                                            Passenger Name
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {invoices.length ===
                                    0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    4
                                                }
                                                className="px-6 py-20 text-center"
                                            >
                                                <div className="mx-auto max-w-md">
                                                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
                                                        <FileText className="size-6 text-muted-foreground" />
                                                    </div>

                                                    <h3 className="mt-4 font-semibold">
                                                        No invoices
                                                    </h3>

                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        There are no
                                                        invoices linked
                                                        to this account
                                                        yet.
                                                    </p>

                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                        New invoices will
                                                        appear here
                                                        automatically
                                                        once the Invoice
                                                        module is built.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map(
                                            (
                                                invoice,
                                            ) => (
                                                <tr
                                                    key={
                                                        invoice.id
                                                    }
                                                    className="border-b last:border-0 hover:bg-muted/20"
                                                >
                                                    <td className="px-5 py-4 font-mono text-xs font-semibold">
                                                        {
                                                            invoice.invoice_id
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-muted-foreground">
                                                        {formatDate(
                                                            invoice.invoice_date,
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right tabular-nums">
                                                        {formatAmount(
                                                            invoice.balance,
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {
                                                            invoice.passenger_name ??
                                                                '—'
                                                        }
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="border-t bg-muted/20 px-5 py-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Total invoices
                                </span>

                                <span className="font-semibold text-foreground">
                                    {invoices.length}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}