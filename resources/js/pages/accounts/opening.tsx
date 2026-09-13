import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CircleDollarSign,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import {
    useState,
    type FormEvent,
} from 'react';

type AccountType = {
    id: number;
    code: string;
    name: string;
};

type Currency = {
    id: number;
    code: string;
    name: string;
    symbol: string | null;
    is_base: boolean;
};

type OpeningBalance = {
    id: number;
    currency_id: number;
    exchange_rate: string;
    opening_debit: string;
    opening_credit: string;
    currency?: Currency | null;
};

type Account = {
    id: number;
    code: string;
    name: string;
    branch: string;

    opening_debit: string;
    opening_credit: string;

    accountType?: AccountType | null;

    creator?: {
        id: number;
        name: string;
    } | null;

    opening_balances?: OpeningBalance[];
};

type Props = {
    account: Account;
    currencies: Currency[];
};

type OpeningRow = {
    localId: string;
    currency_id: string;
    exchange_rate: string;
    opening_debit: string;
    opening_credit: string;
};

function createRow(
    balance?: OpeningBalance,
): OpeningRow {
    return {
        localId:
            balance?.id?.toString() ??
            `${Date.now()}-${Math.random()}`,

        currency_id: balance
            ? String(balance.currency_id)
            : '',

        exchange_rate: balance
            ? String(balance.exchange_rate)
            : '0.000000',

        opening_debit: balance
            ? String(balance.opening_debit)
            : '0.00',

        opening_credit: balance
            ? String(balance.opening_credit)
            : '0.00',
    };
}

function formatAmount(
    value: number | string,
): string {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return '0.00';
    }

    return amount.toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    );
}

export default function AccountOpening({
    account,
    currencies,
}: Props) {
    const [openingDebit, setOpeningDebit] =
        useState(
            String(
                account.opening_debit ??
                    '0.00',
            ),
        );

    const [openingCredit, setOpeningCredit] =
        useState(
            String(
                account.opening_credit ??
                    '0.00',
            ),
        );

    const [rows, setRows] =
        useState<OpeningRow[]>(
            (
                account.opening_balances ??
                []
            ).map((balance) =>
                createRow(balance),
            ),
        );

    const [isSaving, setIsSaving] =
        useState(false);

    function addRow() {
        setRows((current) => [
            ...current,
            createRow(),
        ]);
    }

    function removeRow(
        localId: string,
    ) {
        setRows((current) =>
            current.filter(
                (row) =>
                    row.localId !==
                    localId,
            ),
        );
    }

    function updateRow(
        localId: string,
        field:
            | 'currency_id'
            | 'exchange_rate'
            | 'opening_debit'
            | 'opening_credit',
        value: string,
    ) {
        setRows((current) =>
            current.map((row) =>
                row.localId ===
                localId
                    ? {
                          ...row,
                          [field]:
                              value,
                      }
                    : row,
            ),
        );
    }

    function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        setIsSaving(true);

        router.put(
            `/accounts/${account.id}/opening`,
            {
                opening_debit:
                    openingDebit || '0',
                opening_credit:
                    openingCredit || '0',

                foreign_openings:
                    rows.map(
                        (row) => ({
                            currency_id:
                                Number(
                                    row.currency_id,
                                ),

                            exchange_rate:
                                row.exchange_rate ||
                                '0',

                            opening_debit:
                                row.opening_debit ||
                                '0',

                            opening_credit:
                                row.opening_credit ||
                                '0',
                        }),
                    ),
            },
            {
                preserveScroll: true,

                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    }

    function resetForm() {
        setOpeningDebit(
            String(
                account.opening_debit ??
                    '0.00',
            ),
        );

        setOpeningCredit(
            String(
                account.opening_credit ??
                    '0.00',
            ),
        );

        setRows(
            (
                account.opening_balances ??
                []
            ).map((balance) =>
                createRow(balance),
            ),
        );
    }

    const debitTotal =
        rows.reduce(
            (sum, row) =>
                sum +
                Number(
                    row.opening_debit ||
                        0,
                ),
            0,
        );

    const creditTotal =
        rows.reduce(
            (sum, row) =>
                sum +
                Number(
                    row.opening_credit ||
                        0,
                ),
            0,
        );

    return (
        <>
            <Head
                title={`${account.name} - Opening`}
            />

            <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20">
                <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6">
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

                                <span>
                                    •
                                </span>

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

                            <div className="border-b-2 border-foreground px-5 py-3 text-sm font-semibold">
                                Opening
                            </div>

                            <Link
                                href={`/accounts/${account.id}/invoices`}
                                className="px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                Invoices
                            </Link>

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

                    <form onSubmit={submit}>
                        {/* Base opening */}
                        <section className="rounded-2xl border bg-background shadow-sm">
                            <div className="flex items-center gap-2 border-b px-5 py-4">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                                    <CircleDollarSign className="size-4 text-muted-foreground" />
                                </div>

                                <div>
                                    <h2 className="font-semibold">
                                        Opening Balances
                                    </h2>

                                    <p className="text-xs text-muted-foreground">
                                        Base currency opening
                                        balance
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium">
                                        Opening Dr
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            openingDebit
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setOpeningDebit(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-11 w-full rounded-lg border bg-background px-3 text-right tabular-nums outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium">
                                        Opening Cr
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            openingCredit
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setOpeningCredit(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-11 w-full rounded-lg border bg-background px-3 text-right tabular-nums outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                    />
                                </label>
                            </div>
                        </section>

                        {/* Foreign opening */}
                        <section className="mt-5 overflow-hidden rounded-2xl border bg-background shadow-sm">
                            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Foreign Currency Opening
                                    </h2>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Multiple currencies and
                                        exchange rates can be
                                        recorded for the same
                                        account.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        addRow
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
                                >
                                    <Plus className="size-4" />
                                    Add Currency
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                            <th className="w-[230px] px-4 py-3 font-semibold">
                                                Currency
                                            </th>

                                            <th className="w-[180px] px-4 py-3 font-semibold">
                                                CurRate
                                            </th>

                                            <th className="w-[200px] px-4 py-3 text-right font-semibold">
                                                Opening Dr
                                            </th>

                                            <th className="w-[200px] px-4 py-3 text-right font-semibold">
                                                Opening Cr
                                            </th>

                                            <th className="w-[70px] px-4 py-3" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {rows.length ===
                                        0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-16 text-center"
                                                >
                                                    <div className="mx-auto max-w-md">
                                                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
                                                            <CircleDollarSign className="size-6 text-muted-foreground" />
                                                        </div>

                                                        <h3 className="mt-4 font-semibold">
                                                            No foreign balances
                                                        </h3>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Add a currency to
                                                            record a foreign
                                                            opening balance.
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                addRow
                                                            }
                                                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
                                                        >
                                                            <Plus className="size-4" />
                                                            Add Currency
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map(
                                                (
                                                    row,
                                                ) => (
                                                    <tr
                                                        key={
                                                            row.localId
                                                        }
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={
                                                                    row.currency_id
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateRow(
                                                                        row.localId,
                                                                        'currency_id',
                                                                        event.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                                            >
                                                                <option value="">
                                                                    Select currency
                                                                </option>

                                                                {currencies.map(
                                                                    (
                                                                        currency,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                currency.id
                                                                            }
                                                                            value={String(
                                                                                currency.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                currency.code
                                                                            }{' '}
                                                                            ·{' '}
                                                                            {
                                                                                currency.name
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0.000001"
                                                                step="0.000001"
                                                                value={
                                                                    row.exchange_rate
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateRow(
                                                                        row.localId,
                                                                        'exchange_rate',
                                                                        event.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right font-mono text-sm tabular-nums outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    row.opening_debit
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateRow(
                                                                        row.localId,
                                                                        'opening_debit',
                                                                        event.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right tabular-nums outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    row.opening_credit
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateRow(
                                                                        row.localId,
                                                                        'opening_credit',
                                                                        event.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right tabular-nums outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeRow(
                                                                        row.localId,
                                                                    )
                                                                }
                                                                className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                                title="Remove row"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        )}
                                    </tbody>

                                    {rows.length >
                                        0 && (
                                        <tfoot>
                                            <tr className="border-t bg-muted/30 font-semibold">
                                                <td
                                                    colSpan={
                                                        2
                                                    }
                                                    className="px-4 py-3 text-right"
                                                >
                                                    Foreign Total
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatAmount(
                                                        debitTotal,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatAmount(
                                                        creditTotal,
                                                    )}
                                                </td>

                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </section>

                        {/* Save */}
                        <div className="sticky bottom-0 z-20 mt-6 border-t bg-background/95 py-4 backdrop-blur">
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Opening balances are
                                    recorded against this
                                    account.
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={
                                            resetForm
                                        }
                                        disabled={
                                            isSaving
                                        }
                                        className="inline-flex h-10 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                                    >
                                        Reset
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            isSaving
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="size-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                Save Opening
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}