import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    Printer,
    RefreshCw,
    Search,
} from 'lucide-react';
import {
    useMemo,
    useState,
} from 'react';

type Account = {
    id: number;
    code: string;
    name: string;
};

type SelectedAccount =
    Account | null;

type CurrencyOption = {
    code: string;
    name: string;
};

type LedgerRow = {
    id: number;
    date: string | null;
    type: string;
    voucher_id: string;
    ref: string | null;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    side: 'Dr' | 'Cr';
    invoice_id: number | null;
    voucher_internal_id: number | null;
    currency_code: string | null;
    currency_quantity: number | null;
    currency_rate: number | null;
    currency_breakdown?: string | null;
};

type Company = {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    mobile: string;
    email: string;
    website: string;
    govt_license: string;
    ntn: string;
    logo_data: string | null;
    qr_data: string | null;
};

type Props = {
    title: string;
    subtitle: string;

    accounts: Account[];

    selectedAccount: SelectedAccount;

    accountId: number | null;

    currencies: CurrencyOption[];

    selectedCurrency: string | null;

    selectedCurrencyName: string | null;

    isForeignCurrencyLedger: boolean;

    combineInvoices: boolean;

    dateFrom: string;
    dateTo: string;

    openingBalance: number;

    fiscalOpeningBalance: number;

    openingDebit: number;
    openingCredit: number;

    periodDebit: number;
    periodCredit: number;

    closingBalance: number;

    rows: LedgerRow[];

    company?: Company;
};

const DEFAULT_COMPANY: Company = {
    name: 'HBA TRAVEL & TOURS',
    tagline: 'EXCELLENCE IN HOSPITALITY AND TRAVELS',
    address:
        'Office No. 302, 3rd Floor, Lane 3, 16c Khayaban-e-Rahat, D.H.A Phase 6, Rahat Commercial Area Karachi, Pakistan',
    phone: '+92 332 6873756',
    mobile: '+92 300 3349314',
    email: 'info@hbatravels.org',
    website: 'www.hbatravels.org',
    govt_license: '5979',
    ntn: 'D944343',
    logo_data: null,
    qr_data: null,
};

function amount(
    value: number | string | null | undefined,
): string {
    const numeric =
        Number(
            value ?? 0,
        );

    return numeric.toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    );
}

function wholeAmount(
    value: number | string | null | undefined,
): string {
    const numeric =
        Number(
            value ?? 0,
        );

    return numeric.toLocaleString(
        'en-PK',
        {
            minimumFractionDigits: 0,
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

    const date =
        new Date(
            `${value}T00:00:00`,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        'en-GB',
    );
}

function formatCurrencyFactor(
    value: number,
): string {
    if (Math.abs(value - Math.round(value)) < 0.005) {
        return Math.round(value).toLocaleString('en-PK');
    }

    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function serviceModeFromDescription(
    description: string,
): 'hotel' | 'visa' | 'transfer' | null {
    const text = description.toUpperCase();

    if (/\bVISA\b/.test(text)) {
        return 'visa';
    }

    if (/\bTRANSFER\b/.test(text) || /\bVEHICLE\b/.test(text) || /\bTRANSPORT\b/.test(text) || /\bCAR RENT\b/.test(text)) {
        return 'transfer';
    }

    if (/\bHOTEL\b/.test(text)) {
        return 'hotel';
    }

    return null;
}

function hotelNightsFromDescription(
    description: string,
): number {
    const match = description.match(
        /(\d{2}\/\d{2}\/\d{2})\D+(\d{2}\/\d{2}\/\d{2})/,
    );

    if (!match) {
        return 0;
    }

    const parse = (value: string): number => {
        const [day, month, year] = value.split('/').map(Number);
        return Date.UTC(2000 + year, month - 1, day);
    };

    const from = parse(match[1]);
    const to = parse(match[2]);

    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
        return 0;
    }

    return Math.round((to - from) / 86400000);
}

function deriveCurrencyBreakdown(
    row: LedgerRow,
): string | null {
    if (row.currency_breakdown) {
        return row.currency_breakdown;
    }

    const currency = (row.currency_code ?? '').trim().toUpperCase();
    const roe = Number(row.currency_rate ?? 0);
    const baseAmount = Math.abs(Number(row.debit ?? 0) > 0 ? Number(row.debit ?? 0) : Number(row.credit ?? 0));

    if (!currency || roe <= 0 || baseAmount <= 0) {
        return null;
    }

    const mode = serviceModeFromDescription(row.description ?? '');

    // Ticket bookings are already in PKR/base currency. Only service rows
    // (Hotel/Visa/Transfer) get the foreign-currency formula.
    if (!mode) {
        return null;
    }

    let quantity = Number(row.currency_quantity ?? 0);

    if (mode === 'hotel') {
        quantity = hotelNightsFromDescription(row.description ?? '');
    } else if (quantity <= 0) {
        quantity = 1;
    }

    if (quantity <= 0) {
        return null;
    }

    const unitRate = baseAmount / roe / quantity;

    if (unitRate <= 0) {
        return null;
    }

    return `${currency} ${formatCurrencyFactor(unitRate)} × ${formatCurrencyFactor(quantity)} × ${formatCurrencyFactor(roe)}`;
}

function periodLabel(
    from: string,
    to: string,
): string {
    const fromDate =
        new Date(
            `${from}T00:00:00`,
        );

    const toDate =
        new Date(
            `${to}T00:00:00`,
        );

    if (
        Number.isNaN(
            fromDate.getTime(),
        )
        ||
        Number.isNaN(
            toDate.getTime(),
        )
    ) {
        return `${from} → ${to}`;
    }

    return (
        `${fromDate.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            },
        )} → ${toDate.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            },
        )}`
    );
}

function sideOf(
    value: number,
): 'Dr' | 'Cr' {
    return value < 0
        ? 'Cr'
        : 'Dr';
}

export default function LedgerIndex({
    title,
    subtitle,
    accounts,
    selectedAccount,
    accountId,
    currencies = [],
    selectedCurrency: initialSelectedCurrency,
    combineInvoices,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    openingBalance,
    periodDebit,
    periodCredit,
    closingBalance,
    rows,
    company: companyProp,
}: Props) {
    /*
     * Always have a safe company object during SSR.
     */
    const company: Company =
        companyProp ?? DEFAULT_COMPANY;

    const [
        dateFrom,
        setDateFrom,
    ] = useState(
        initialDateFrom,
    );

    const [
        dateTo,
        setDateTo,
    ] = useState(
        initialDateTo,
    );

    const [
        selectedId,
        setSelectedId,
    ] = useState<number | null>(
        accountId,
    );

    const [
        selectedLabel,
        setSelectedLabel,
    ] = useState(
        selectedAccount
            ? `${selectedAccount.code} — ${selectedAccount.name}`
            : '',
    );

    const [
        accountSearch,
        setAccountSearch,
    ] = useState('');

    const [
        accountMenuOpen,
        setAccountMenuOpen,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        selectedCurrency,
        setSelectedCurrency,
    ] = useState(
        initialSelectedCurrency ?? '',
    );

    /*
     * Export parameters MUST be created inside the component
     * because selectedId/dateFrom/dateTo are component state.
     */
    const exportQuery =
        useMemo(() => {
            const params =
                new URLSearchParams();

            if (
                selectedId !== null
            ) {
                params.set(
                    'account_id',
                    String(
                        selectedId,
                    ),
                );
            }

            if (
                dateFrom
            ) {
                params.set(
                    'date_from',
                    dateFrom,
                );
            }

            if (
                dateTo
            ) {
                params.set(
                    'date_to',
                    dateTo,
                );
            }

            if (
                selectedCurrency
            ) {
                params.set(
                    'currency_code',
                    selectedCurrency,
                );
            }

            if (combineInvoices) {
                params.set(
                    'combine_invoices',
                    '1',
                );
            }

            return params.toString();
        }, [
            selectedId,
            dateFrom,
            dateTo,
            selectedCurrency,
            combineInvoices,
        ]);

    /*
     * PDF / Excel endpoints.
     *
     * These are backend export routes.
     */
    const pdfUrl =
        selectedId !== null
            ? `/accounting/ledger/pdf?${exportQuery}`
            : '#';

    const excelUrl =
        selectedId !== null
            ? `/accounting/ledger/excel?${exportQuery}`
            : '#';

    const filteredAccounts =
        useMemo(() => {
            const query =
                accountSearch
                    .trim()
                    .toLowerCase();

            if (
                query === ''
            ) {
                return accounts.slice(
                    0,
                    150,
                );
            }

            return accounts
                .filter(
                    (
                        account,
                    ) =>
                        `${account.code} ${account.name}`
                            .toLowerCase()
                            .includes(
                                query,
                            ),
                )
                .slice(
                    0,
                    150,
                );
        }, [
            accounts,
            accountSearch,
        ]);

    function selectAccount(
        account: Account,
    ): void {
        setSelectedId(
            account.id,
        );

        setSelectedLabel(
            `${account.code} — ${account.name}`,
        );

        setAccountSearch(
            '',
        );

        setAccountMenuOpen(
            false,
        );
    }

    function preview(): void {
        setLoading(
            true,
        );

        router.get(
            '/accounting/ledger',
            {
                account_id:
                    selectedId
                        ?? undefined,

                date_from:
                    dateFrom
                        || undefined,

                date_to:
                    dateTo
                        || undefined,

                currency_code:
                    selectedCurrency
                        || undefined,

                combine_invoices:
                    combineInvoices
                        ? 1
                        : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,

                onFinish:
                    () =>
                        setLoading(
                            false,
                        ),
            },
        );
    }

    function changeInvoiceView(
        combined: boolean,
    ): void {
        if (selectedId === null) {
            return;
        }

        setLoading(true);

        router.get(
            '/accounting/ledger',
            {
                account_id:
                    selectedId,

                date_from:
                    dateFrom
                        || undefined,

                date_to:
                    dateTo
                        || undefined,

                currency_code:
                    selectedCurrency
                        || undefined,

                combine_invoices:
                    combined
                        ? 1
                        : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,

                onFinish:
                    () =>
                        setLoading(false),
            },
        );
    }

    /*
     * Use the dedicated server-side print endpoint so browser Print and
     * generated PDF use the same Blade report layout.
     */
    function printReport(): void {
        if (selectedId === null) {
            return;
        }

        const params = new URLSearchParams();
        params.set('account_id', String(selectedId));

        if (dateFrom) {
            params.set('date_from', dateFrom);
        }

        if (dateTo) {
            params.set('date_to', dateTo);
        }

        if (selectedCurrency) {
            params.set(
                'currency_code',
                selectedCurrency,
            );
        }

        if (combineInvoices) {
            params.set(
                'combine_invoices',
                '1',
            );
        }

        window.open(
            `/accounting/ledger/print?${params.toString()}`,
            '_blank',
            'noopener,noreferrer',
        );
    }

    return (
        <>
            <Head
                title={
                    selectedAccount
                        ? `${selectedAccount.name} Ledger`
                        : 'Ledger'
                }
            />

            <style>
                {`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 13mm;
                        }

                        html,
                        body {
                            background: white !important;
                        }

                        body * {
                            visibility: hidden !important;
                        }

                        .ledger-print-area,
                        .ledger-print-area * {
                            visibility: visible !important;
                        }

                        .ledger-print-area {
                            position: absolute !important;
                            inset: 0 !important;
                            width: 100% !important;
                            background: white !important;
                            color: black !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            border: 0 !important;
                        }

                        .print-hidden {
                            display: none !important;
                        }

                        .print-only {
                            display: block !important;
                        }

                        .ledger-table {
                            font-size: 9pt !important;
                        }

                        .ledger-table th,
                        .ledger-table td {
                            border-bottom: 1px solid #d1d5db !important;
                            padding: 6px 5px !important;
                            color: black !important;
                        }

                        .ledger-table thead {
                            display: table-header-group;
                        }

                        .ledger-table tr {
                            break-inside: avoid;
                        }

                        a {
                            color: black !important;
                            text-decoration: none !important;
                        }
                    }

                    .print-only {
                        display: none;
                    }
                `}
            </style>

            <div className="ledger-print-area min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 print:p-0">

                    {/* ----------------------------------------------------- */}
                    {/* Print-only company header                             */}
                    {/* ----------------------------------------------------- */}
                    <div className="print-only mb-5 border-b border-black pb-3">
                        <div className="flex items-start justify-between gap-4">

                            {company.logo_data ? (
                                <img
                                    src={
                                        company.logo_data
                                    }
                                    alt="HBA"
                                    className="h-20 w-auto max-w-[44mm] object-contain"
                                />
                            ) : (
                                <div className="flex h-20 w-28 items-center justify-center text-3xl font-bold">
                                    HBA
                                </div>
                            )}

                            <div className="flex-1 text-center">
                                <div className="text-3xl font-bold">
                                    {company.name}
                                </div>

                                <div className="text-sm">
                                    {company.tagline}
                                </div>

                                <div className="mt-2 text-[11px] leading-4">
                                    {company.address}
                                </div>

                                <div className="text-[11px]">
                                    Phone: {company.phone}, Mobile:{' '}
                                    {company.mobile}
                                </div>

                                <div className="text-[11px]">
                                    E-Mail: {company.email}, Website:{' '}
                                    {company.website}
                                </div>

                                <div className="text-[10px]">
                                    Govt Lic No: {company.govt_license}, NTN:{' '}
                                    {company.ntn}
                                </div>
                            </div>

                            {company.qr_data ? (
                                <img
                                    src={
                                        company.qr_data
                                    }
                                    alt="QR"
                                    className="h-20 w-20 object-contain"
                                />
                            ) : (
                                <div className="h-20 w-20" />
                            )}

                        </div>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* Page heading                                           */}
                    {/* ----------------------------------------------------- */}
                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between print:mb-3">

                        <div>
                            <div className="text-sm text-muted-foreground print:hidden">
                                Accounting / Ledger
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight print:mt-0 print:text-xl">
                                {title}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground print:hidden">
                                {subtitle}
                            </p>

                            {selectedAccount && (
                                <div className="mt-2 hidden print:block">
                                    <div className="text-xs italic">
                                        Statement of,
                                    </div>

                                    <div className="text-base font-bold">
                                        {selectedAccount.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedAccount && (
                            <div className="rounded-xl border bg-background px-4 py-3 text-right shadow-sm print:hidden">

                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Selected Account
                                </div>

                                <div className="mt-1 font-mono text-sm font-semibold">
                                    {selectedAccount.code}
                                </div>

                                <div className="text-sm font-medium">
                                    {selectedAccount.name}
                                </div>

                            </div>
                        )}
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* Filters and exports                                    */}
                    {/* ----------------------------------------------------- */}
                    <div className="print-hidden mb-5 rounded-2xl border bg-background shadow-sm">

                        <div className="border-b p-4 md:p-5">

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_190px_190px_210px_auto] lg:items-end">

                                {/* Account */}
                                <div className="space-y-1.5">

                                    <label className="text-xs font-medium text-muted-foreground">
                                        Code / Account
                                    </label>

                                    <div className="relative">

                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        <input
                                            value={
                                                accountMenuOpen
                                                    ? accountSearch
                                                    : selectedLabel
                                            }
                                            onFocus={() => {
                                                setAccountMenuOpen(
                                                    true,
                                                );

                                                setAccountSearch(
                                                    '',
                                                );
                                            }}
                                            onChange={(
                                                event,
                                            ) => {
                                                setSelectedId(
                                                    null,
                                                );

                                                setSelectedLabel(
                                                    '',
                                                );

                                                setAccountSearch(
                                                    event.target.value,
                                                );

                                                setAccountMenuOpen(
                                                    true,
                                                );
                                            }}
                                            placeholder="Search account code or name"
                                            className="h-11 w-full rounded-lg border bg-background pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        />

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        {accountMenuOpen && (
                                            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1 shadow-2xl">

                                                {filteredAccounts.length ===
                                                0 ? (
                                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                        No matching accounts
                                                        found.
                                                    </div>
                                                ) : (
                                                    filteredAccounts.map(
                                                        (
                                                            account,
                                                        ) => (
                                                            <button
                                                                key={
                                                                    account.id
                                                                }
                                                                type="button"
                                                                onMouseDown={(
                                                                    event,
                                                                ) =>
                                                                    event.preventDefault()
                                                                }
                                                                onClick={() =>
                                                                    selectAccount(
                                                                        account,
                                                                    )
                                                                }
                                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
                                                            >
                                                                <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                                                                    {
                                                                        account.code
                                                                    }
                                                                </span>

                                                                <span className="min-w-0 flex-1 truncate font-medium">
                                                                    {
                                                                        account.name
                                                                    }
                                                                </span>
                                                            </button>
                                                        ),
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    <p className="text-[11px] text-muted-foreground">
                                        Search by account code or name.
                                    </p>

                                </div>

                                {/* From */}
                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        From
                                    </span>

                                    <div className="relative">
                                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        <input
                                            type="date"
                                            value={
                                                dateFrom
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDateFrom(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </label>

                                {/* To */}
                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        To
                                    </span>

                                    <div className="relative">
                                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        <input
                                            type="date"
                                            value={
                                                dateTo
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDateTo(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </label>

                                {/* Currency */}
                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Currency
                                    </span>

                                    <select
                                        value={
                                            selectedCurrency
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setSelectedCurrency(
                                                event.target.value,
                                            )
                                        }
                                        className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">
                                            Base Currency
                                        </option>

                                        {currencies.map(
                                            (
                                                currency,
                                            ) => (
                                                <option
                                                    key={
                                                        currency.code
                                                    }
                                                    value={
                                                        currency.code
                                                    }
                                                >
                                                    {
                                                        currency.code
                                                    }
                                                    {currency.name
                                                        ? ` — ${currency.name}`
                                                        : ''}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <p className="text-[11px] text-muted-foreground">
                                        Select SAR/USD/etc. for the
                                        foreign-currency ledger.
                                    </p>
                                </label>

                                {/* Preview */}
                                <button
                                    type="button"
                                    onClick={
                                        preview
                                    }
                                    disabled={
                                        loading
                                        ||
                                        selectedId ===
                                            null
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={
                                            `size-4 ${
                                                loading
                                                    ? 'animate-spin'
                                                    : ''
                                            }`
                                        }
                                    />

                                    Preview
                                </button>

                            </div>

                        </div>

                        {/* Export buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">

                            <div className="flex flex-wrap items-center gap-3">

                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        View
                                    </span>

                                    <div className="flex items-center rounded-lg border bg-muted/20 p-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeInvoiceView(false)
                                            }
                                            disabled={
                                                loading
                                                ||
                                                selectedId === null
                                                ||
                                                !combineInvoices
                                            }
                                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                                                !combineInvoices
                                                    ? 'bg-background shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Detailed
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeInvoiceView(true)
                                            }
                                            disabled={
                                                loading
                                                ||
                                                selectedId === null
                                                ||
                                                combineInvoices
                                            }
                                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                                                combineInvoices
                                                    ? 'bg-foreground text-background shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Combined Invoice
                                        </button>
                                    </div>
                                </div>

                                {selectedAccount
                                    ? (
                                        <span className="text-sm text-muted-foreground">
                                            {periodLabel(
                                                initialDateFrom,
                                                initialDateTo,
                                            )}
                                        </span>
                                    )
                                    : (
                                        <span className="text-sm text-muted-foreground">
                                            Select an account to preview its ledger.
                                        </span>
                                    )}

                                {combineInvoices && (
                                    <span className="rounded-full border bg-muted/30 px-2 py-1 text-xs font-medium text-foreground">
                                        Master invoices combined
                                    </span>
                                )}

                                {selectedCurrency && (
                                    <span className="rounded-full border bg-muted/30 px-2 py-1 text-xs font-medium text-foreground">
                                        Currency:{' '}
                                        {
                                            currencies.find(
                                                (currency) =>
                                                    currency.code.toUpperCase() ===
                                                    selectedCurrency.toUpperCase(),
                                            )?.name
                                                || selectedCurrency
                                        }
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">

                                {/* Browser Print */}
                                <button
                                    type="button"
                                    onClick={
                                        printReport
                                    }
                                    disabled={
                                        selectedId ===
                                        null
                                    }
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <Printer className="size-4" />
                                    Print
                                </button>

                                {/* PDF */}
                                <a
                                    href={
                                        pdfUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-disabled={
                                        selectedId ===
                                        null
                                    }
                                    onClick={(
                                        event,
                                    ) => {
                                        if (
                                            selectedId ===
                                            null
                                        ) {
                                            event.preventDefault();
                                        }
                                    }}
                                    className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted ${
                                        selectedId ===
                                        null
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }`}
                                >
                                    <FileText className="size-4" />
                                    PDF
                                </a>

                                {/* Excel */}
                                <a
                                    href={
                                        excelUrl
                                    }
                                    onClick={(
                                        event,
                                    ) => {
                                        if (
                                            selectedId ===
                                            null
                                        ) {
                                            event.preventDefault();
                                        }
                                    }}
                                    aria-disabled={
                                        selectedId ===
                                        null
                                    }
                                    className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted ${
                                        selectedId ===
                                        null
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }`}
                                >
                                    <FileSpreadsheet className="size-4" />
                                    Excel
                                </a>

                            </div>

                        </div>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* Report                                                 */}
                    {/* ----------------------------------------------------- */}
                    <div className="rounded-2xl border bg-background shadow-sm print:border-0 print:shadow-none">

                        {selectedAccount ? (
                            <>

                                {/* Print report information */}
                                <div className="print-only border-b border-black px-4 pb-3">
                                    <div className="flex items-start justify-between gap-5">

                                        <div>
                                            <div className="text-xs italic">
                                                Statement of,
                                            </div>

                                            <div className="text-lg font-bold">
                                                {selectedAccount.name}
                                            </div>
                                        </div>

                                        <div className="text-right text-xs leading-5">
                                            <div>
                                                <strong>
                                                    From:
                                                </strong>{' '}
                                                {formatDate(
                                                    initialDateFrom,
                                                )}{' '}
                                                <strong>
                                                    To:
                                                </strong>{' '}
                                                {formatDate(
                                                    initialDateTo,
                                                )}
                                            </div>

                                            <div>
                                                Printing Date:{' '}
                                                {new Date().toLocaleString(
                                                    'en-GB',
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Summary cards */}
                                <div className="print-hidden grid gap-3 border-b p-4 md:grid-cols-4">

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="text-xs text-muted-foreground">
                                            Period
                                        </div>

                                        <div className="mt-1 text-sm font-semibold">
                                            {periodLabel(
                                                initialDateFrom,
                                                initialDateTo,
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="text-xs text-muted-foreground">
                                            Balance B/F
                                        </div>

                                        <div className="mt-1 text-lg font-semibold tabular-nums">
                                            {wholeAmount(
                                                Math.abs(
                                                    openingBalance,
                                                ),
                                            )}{' '}

                                            <span className="text-xs text-muted-foreground">
                                                {sideOf(
                                                    openingBalance,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="text-xs text-muted-foreground">
                                            Period Movement
                                        </div>

                                        <div className="mt-1 text-sm font-semibold tabular-nums">
                                            Dr{' '}
                                            {wholeAmount(
                                                periodDebit,
                                            )}{' '}
                                            · Cr{' '}
                                            {wholeAmount(
                                                periodCredit,
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="text-xs text-muted-foreground">
                                            Closing Balance
                                        </div>

                                        <div className="mt-1 text-lg font-semibold tabular-nums">
                                            {wholeAmount(
                                                Math.abs(
                                                    closingBalance,
                                                ),
                                            )}{' '}

                                            <span className="text-xs text-muted-foreground">
                                                {sideOf(
                                                    closingBalance,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                {/* Ledger */}
                                <div className="hidden overflow-x-auto md:block">
    <table className="ledger-table w-full text-sm">

                                        <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                                            <tr>

                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Date
                                                </th>

                                                <th className="px-4 py-3 text-left font-semibold">
                                                    VT
                                                </th>

                                                <th className="px-4 py-3 text-left font-semibold">
                                                    V. ID
                                                </th>

                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Ref
                                                </th>

                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Description
                                                </th>

                                                <th className="px-4 py-3 text-right font-semibold">
                                                    Debit
                                                </th>

                                                <th className="px-4 py-3 text-right font-semibold">
                                                    Credit
                                                </th>

                                                <th className="px-4 py-3 text-right font-semibold">
                                                    Balance
                                                </th>

                                            </tr>
                                        </thead>

                                        <tbody>

                                            {/* B/F */}
                                            <tr className="border-b bg-muted/10 font-medium">

                                                <td className="px-4 py-3">
                                                    —
                                                </td>

                                                <td className="px-4 py-3 font-semibold">
                                                    B/F
                                                </td>

                                                <td className="px-4 py-3">
                                                    —
                                                </td>

                                                <td className="px-4 py-3">
                                                    —
                                                </td>

                                                <td className="px-4 py-3">
                                                    Balance B/F
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {openingBalance >
                                                    0
                                                        ? wholeAmount(
                                                            openingBalance,
                                                        )
                                                        : '—'}
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {openingBalance <
                                                    0
                                                        ? wholeAmount(
                                                            Math.abs(
                                                                openingBalance,
                                                            ),
                                                        )
                                                        : '—'}
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                    {wholeAmount(
                                                        Math.abs(
                                                            openingBalance,
                                                        ),
                                                    )}{' '}
                                                    {sideOf(
                                                        openingBalance,
                                                    )}
                                                </td>

                                            </tr>

                                            {rows.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={
                                                            8
                                                        }
                                                        className="px-4 py-16 text-center text-sm text-muted-foreground"
                                                    >
                                                        No transactions found for this account and period.
                                                    </td>
                                                </tr>
                                            ) : (
                                                rows.map(
                                                    (
                                                        row,
                                                    ) => (
                                                        <tr
                                                            key={
                                                                row.id
                                                            }
                                                            className="border-b transition hover:bg-muted/20"
                                                        >

                                                            <td className="whitespace-nowrap px-4 py-3 font-medium">
                                                                {formatDate(
                                                                    row.date,
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 font-semibold">
                                                                {
                                                                    row.type
                                                                }
                                                            </td>

                                                            <td className="px-4 py-3">

                                                                <div className="flex min-w-0 flex-col gap-1">
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        {row.invoice_id !== null && (
                                                                            <Link
                                                                                href={`/invoices/${row.invoice_id}`}
                                                                                className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary hover:bg-muted print:text-black"
                                                                                title="Open invoice"
                                                                            >
                                                                                INV #{row.ref ?? row.invoice_id}
                                                                            </Link>
                                                                        )}

                                                                        {row.voucher_internal_id !== null
                                                                            && ['BR', 'BP', 'JV'].includes(
                                                                                row.type.toUpperCase(),
                                                                            ) && (
                                                                                <a
                                                                                    href={
                                                                                        row.type.toUpperCase() === 'JV'
                                                                                            ? `/accounting/journal-vouchers/${row.voucher_internal_id}/edit`
                                                                                            : `/accounting/vouchers/${row.voucher_internal_id}/edit`
                                                                                    }
                                                                                    className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary hover:bg-muted print:text-black"
                                                                                    title="Open voucher"
                                                                                >
                                                                                    {row.type.toUpperCase()} #{row.voucher_id}
                                                                                </a>
                                                                            )}

                                                                        {row.invoice_id === null
                                                                            && row.voucher_internal_id === null && (
                                                                                <span className="font-mono text-xs font-semibold">
                                                                                    {row.voucher_id}
                                                                                </span>
                                                                            )}
                                                                    </div>

                                                                    {row.ref
                                                                        && row.invoice_id !== null
                                                                        && row.type.toUpperCase() !== 'INV' && (
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                Ref {row.ref}
                                                                            </span>
                                                                        )}
                                                                </div>

                                                            </td>

                                                            <td className="px-4 py-3 font-mono text-xs">
                                                                {
                                                                    row.ref
                                                                    ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            <td className="max-w-[560px] px-4 py-3">

                                                                <div
                                                                    className="whitespace-pre-line font-medium"
                                                                    title={
                                                                        row.description
                                                                    }
                                                                >
                                                                    {
                                                                        row.description
                                                                    }
                                                                </div>

                                                                {row.type.toUpperCase() === 'INV' &&
                                                                    deriveCurrencyBreakdown(row) && (
                                                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                                                        {deriveCurrencyBreakdown(row)}
                                                                    </div>
                                                                )}

                                                            </td>

                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                {row.debit >
                                                                0
                                                                    ? wholeAmount(
                                                                        row.debit,
                                                                    )
                                                                    : '—'}
                                                            </td>

                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                {row.credit >
                                                                0
                                                                    ? wholeAmount(
                                                                        row.credit,
                                                                    )
                                                                    : '—'}
                                                            </td>

                                                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                                {wholeAmount(
                                                                    Math.abs(
                                                                        row.balance,
                                                                    ),
                                                                )}{' '}
                                                                {
                                                                    row.side
                                                                }
                                                            </td>

                                                        </tr>
                                                    ),
                                                )
                                            )}

                                        </tbody>

                                        <tfoot>

                                            <tr className="border-t-2 bg-muted/20 font-semibold">

                                                <td
                                                    colSpan={
                                                        5
                                                    }
                                                    className="px-4 py-4 text-right"
                                                >
                                                    Period Totals
                                                </td>

                                                <td className="px-4 py-4 text-right tabular-nums">
                                                    {wholeAmount(
                                                        periodDebit,
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right tabular-nums">
                                                    {wholeAmount(
                                                        periodCredit,
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right tabular-nums">
                                                    {wholeAmount(
                                                        Math.abs(
                                                            closingBalance,
                                                        ),
                                                    )}{' '}
                                                    {sideOf(
                                                        closingBalance,
                                                    )}
                                                </td>

                                            </tr>

                                        </tfoot>

                                    </table>

		 <div className="space-y-2 md:hidden">
    {rows.length === 0 ? (
        <div className="rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground">
            No transactions found for this account and period.
        </div>
    ) : (
        rows.map((row) => (
            <div
                key={row.id}
                className="rounded-xl border bg-background p-3 shadow-sm"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium">
                                {formatDate(row.date)}
                            </span>

                            <span className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                                {row.type}
                            </span>
                        </div>

                        <div className="mt-1 truncate text-sm font-semibold">
                            {row.description || '—'}
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold tabular-nums">
                            {row.debit > 0
                                ? `${wholeAmount(row.debit)} Dr`
                                : `${wholeAmount(row.credit)} Cr`}
                        </div>

                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                            Balance {wholeAmount(Math.abs(row.balance))} {row.side}
                        </div>
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {row.invoice_id !== null && (
                        <Link
                            href={`/invoices/${row.invoice_id}`}
                            className="inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-semibold text-primary"
                        >
                            Invoice #{row.ref ?? row.invoice_id}
                        </Link>
                    )}

                    {row.voucher_internal_id !== null
                        && ['BR', 'BP', 'JV'].includes(row.type.toUpperCase()) && (
                            <a
                                href={
                                    row.type.toUpperCase() === 'JV'
                                        ? `/accounting/journal-vouchers/${row.voucher_internal_id}/edit`
                                        : `/accounting/vouchers/${row.voucher_internal_id}/edit`
                                }
                                className="inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-semibold text-primary"
                            >
                                {row.type.toUpperCase()} #{row.voucher_id}
                            </a>
                        )}
                </div>

                {row.ref && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                        Ref: {row.ref}
                    </div>
                )}
            </div>
        ))
    )}
</div>

                                </div>

                                {/* Print footer */}
                                <div className="print-only mt-5 flex items-end justify-between border-t border-black pt-2 text-[9px]">

                                    <div>
                                        {company.website}
                                    </div>

                                    <div>
                                        Page{' '}
                                        <span className="page-number" />
                                    </div>

                                </div>

                            </>
                        ) : (
                            <div className="flex min-h-[450px] flex-col items-center justify-center p-10 text-center">

                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <Search className="size-6 text-muted-foreground" />
                                </div>

                                <h2 className="mt-4 text-lg font-semibold">
                                    Select an account
                                </h2>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    Search and select a customer, vendor,
                                    cash/bank, expense, income or other account
                                    to preview its ledger.
                                </p>

                            </div>
                        )}

                    </div>

                </div>
            </div>
        </>
    );
}
