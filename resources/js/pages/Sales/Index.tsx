import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Eye, FilePlus2, Loader2, Printer, Search, Ticket, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Fragment, useState } from 'react';

type VendorDetail = {
    code: string;
    name: string;
};

type MasterLine = {
    id: number;
    account_code: string;
    debit: number;
    credit: number;
    sub_id: number | null;
    profit: number;
    role?: string;
};

type InvoiceRow = {
    id: number;
    invoice_number: string;
    invoice_date: string;
    ref_no: string;
    client_code: string;
    client_name: string;
    status: string;
    active: boolean;
    line_count: number;
    data_source: string;
    deletable?: boolean;
    receivable: number;
    payable: number;
    profit: number;
};

type Props = {
    invoices: InvoiceRow[];
    filters: { search: string };
};

type LoadedLines = Record<number, InvoiceLine[]>;
type LoadingLines = Record<number, boolean>;
type LineErrors = Record<number, string>;

type InvoiceLine = {
    legacy_transaction_id?: number;
    transaction_key?: string;
    mode: string;
    type?: string;

    passenger_name?: string;
    passenger_type?: string;
    passport_no?: string;
    nationality?: string;
    phone?: string;
    group_no?: string;

    ref_no?: string;
    ticket_no?: string;
    con_ticket_no?: string;
    ticket_type?: string;

    sector?: string;
    service_description?: string;
    route?: string;
    departure_date?: string;
    return_date?: string;
    flight_no?: string;
    pnr?: string;
    gds?: string;
    class?: string;
    xo?: string;

    visa_no?: string;
    documents?: string;
    package?: string;
    starting_date?: string;
    ending_date?: string;

    hotel_name?: string;
    room_type?: string;
    meal?: string;
    room_no?: string;
    room_quantity?: number;
    nights?: number | null;
    quantity?: number;
    rate?: number;
    roe?: number;
    rate_sar?: number;
    internal_ref_no?: string;
    confirm_no?: string;

    sector_to?: string;
    flight_information?: string;
    vehicle_id?: number | null;

    currency_code?: string;
    currency_quantity?: number | null;
    currency_rate?: number | null;

    payable_account_code?: string;
    payable_account_2?: string;
    payable_account_3?: string;
    customer_code?: string;
    customer_name?: string;
    vendor_name?: string;
    vendor_details?: VendorDetail[];
    vendor_amount?: number;
    vendor_amount_2?: number;
    vendor_amount_3?: number;

    receivable_amount?: number;
    payable_amount?: number;
    profit_amount?: number;

    fare?: number;
    fare_nc?: number;
    sp_apt?: number;
    commission_receivable?: number;
    commission_paid?: number;
    commission_to_client?: number;
    other_service_charges?: number;
    discount?: number;
    insurance?: number;
    psf?: number;
    agent_code?: string;
    agent_amount?: number;

    master_rows?: MasterLine[];
};

function money(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
}

function text(value: unknown): string {
    const output = String(value ?? '').trim();
    return output !== '' ? output : '—';
}

function hasValue(value: unknown): boolean {
    const output = String(value ?? '').trim();
    return output !== '' && !['—', '-', '0'].includes(output);
}

function ModeBadge({ mode }: { mode: string }) {
    return (
        <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium">
            {text(mode)}
        </span>
    );
}

function DetailValue({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: unknown;
    wide?: boolean;
}) {
    if (!hasValue(value)) {
        return null;
    }

    return (
        <div className={wide ? 'min-w-0 rounded-lg border bg-background px-3 py-2 md:col-span-2' : 'min-w-0 rounded-lg border bg-background px-3 py-2'}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 break-words text-xs font-medium">{text(value)}</div>
        </div>
    );
}

function FinancialSummary({
    line,
    customerName,
    customerCode,
}: {
    line: InvoiceLine;
    customerName?: string;
    customerCode?: string;
}) {
    const payable = Number(line.payable_amount ?? (
        Number(line.vendor_amount ?? 0)
        + Number(line.vendor_amount_2 ?? 0)
        + Number(line.vendor_amount_3 ?? 0)
    ));
    const receivable = Number(line.receivable_amount ?? 0);
    const profit = Number(line.profit_amount ?? (
        receivable - payable - Number(line.agent_amount ?? 0)
    ));
    const vendors = Array.isArray(line.vendor_details) ? line.vendor_details : [];
    const displayCustomerName = String(customerName ?? line.customer_name ?? customerCode ?? line.customer_code ?? '').trim();
    const displayCustomerCode = String(customerCode ?? line.customer_code ?? '').trim();

    return (
        <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border bg-background px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Customer / Receivable</div>
                {displayCustomerName !== '' && (
                    <div className="mt-1 break-words text-xs font-medium">{displayCustomerName}</div>
                )}
                {displayCustomerCode !== '' && displayCustomerCode !== displayCustomerName && (
                    <div className="text-[10px] text-muted-foreground">{displayCustomerCode}</div>
                )}
                <div className="mt-1 text-sm font-semibold">{money(receivable)}</div>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Payable To
                </div>
                <div className="mt-1 break-words text-xs font-medium">
                    {vendors.length > 0
                        ? vendors.map((vendor) => vendor.name || vendor.code).join(', ')
                        : text(line.vendor_name || line.payable_account_code)}
                </div>
                <div className="mt-1 text-sm font-semibold">{money(payable)}</div>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Profit</div>
                <div className="mt-1 text-sm font-semibold">{money(profit)}</div>
            </div>
        </div>
    );
}

function AccountingBreakdown({ line }: { line: InvoiceLine }) {
    const masters = Array.isArray(line.master_rows) ? line.master_rows : [];
    const [open, setOpen] = useState(false);

    if (masters.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 overflow-hidden rounded-lg border">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between bg-muted/30 px-3 py-2 text-left text-xs font-semibold hover:bg-muted/50"
            >
                <span>Accounting breakdown · {masters.length} line{masters.length === 1 ? '' : 's'}</span>
                <span className="text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
            </button>

            {open && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-xs">
                        <thead className="border-b bg-background text-left">
                            <tr>
                                <th className="px-3 py-2 font-medium">Role</th>
                                <th className="px-3 py-2 font-medium">Account</th>
                                <th className="px-3 py-2 text-right font-medium">Debit</th>
                                <th className="px-3 py-2 text-right font-medium">Credit</th>
                                <th className="px-3 py-2 text-right font-medium">Profit</th>
                                <th className="px-3 py-2 font-medium">SubID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {masters.map((master) => (
                                <tr key={master.id} className="border-b last:border-b-0">
                                    <td className="px-3 py-2">{text(master.role)}</td>
                                    <td className="px-3 py-2 font-medium">{text(master.account_code)}</td>
                                    <td className="px-3 py-2 text-right">{money(master.debit)}</td>
                                    <td className="px-3 py-2 text-right">{money(master.credit)}</td>
                                    <td className="px-3 py-2 text-right">{money(master.profit)}</td>
                                    <td className="px-3 py-2">{text(master.sub_id)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function TicketDetails({ line }: { line: InvoiceLine }) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailValue label="Passenger" value={line.passenger_name} />
            <DetailValue label="Ticket No" value={line.ticket_no} />
            <DetailValue label="Sector" value={line.sector} />
            <DetailValue label="Route" value={line.route} />
            <DetailValue label="Flight No" value={line.flight_no} />
            <DetailValue label="PNR" value={line.pnr} />
            <DetailValue label="GDS" value={line.gds} />
            <DetailValue label="Class" value={line.class} />
            <DetailValue label="Departure" value={line.departure_date} />
            <DetailValue label="Return" value={line.return_date} />
            <DetailValue label="Ticket Type" value={line.ticket_type || line.type} />
            <DetailValue label="Passport" value={line.passport_no} />
            <DetailValue label="Passenger Type" value={line.passenger_type} />
            <DetailValue label="Currency" value={line.currency_code} />
            <DetailValue label="Fare" value={money(line.fare)} />
            <DetailValue label="Service / Other" value={line.other_service_charges} />
        </div>
    );
}

function VisaDetails({ line }: { line: InvoiceLine }) {
    const packageName = line.package || line.service_description || line.sector;

    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailValue label="Passenger" value={line.passenger_name} />
            <DetailValue label="Package / Visa Type" value={packageName} wide />
            <DetailValue label="Passport" value={line.passport_no} />
            <DetailValue label="Visa No" value={line.visa_no} />
            <DetailValue label="Starting Date" value={line.starting_date || line.departure_date} />
            <DetailValue label="Expiry / Return" value={line.ending_date || line.return_date} />
            <DetailValue label="Documents" value={line.documents} />
            <DetailValue label="Passenger Type" value={line.passenger_type} />
            <DetailValue label="Currency" value={line.currency_code} />
            <DetailValue label={`ROE`} value={money(line.roe || line.currency_rate)} />
            <DetailValue label={`Rate (${line.currency_code || 'SAR'})`} value={money(line.rate_sar)} />
        </div>
    );
}

function HotelDetails({ line }: { line: InvoiceLine }) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailValue label="Passenger" value={line.passenger_name} />
            <DetailValue label="Hotel" value={line.hotel_name} wide />
            <DetailValue label="City / Sector" value={line.sector} />
            <DetailValue label="Confirmation" value={line.confirm_no || line.internal_ref_no} />
            <DetailValue label="Check In" value={line.starting_date || line.departure_date} />
            <DetailValue label="Check Out" value={line.ending_date || line.return_date} />
            <DetailValue label="Room Type" value={line.room_type} />
            <DetailValue label="Meal" value={line.meal} />
            <DetailValue label="Rooms" value={line.room_quantity || line.quantity} />
            <DetailValue label="Nights" value={line.nights} />
            <DetailValue label="Currency" value={line.currency_code} />
            <DetailValue label="ROE" value={money(line.roe || line.currency_rate)} />
            <DetailValue label={`Rate / Night (${line.currency_code || 'SAR'})`} value={money(line.rate_sar)} />
            <DetailValue label="Room No" value={line.room_no} />
        </div>
    );
}

function TransferDetails({ line }: { line: InvoiceLine }) {
    const from = line.sector || line.route;
    const to = line.sector_to;

    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailValue label="Passenger" value={line.passenger_name} />
            <DetailValue label="From" value={from} />
            <DetailValue label="To" value={to} />
            <DetailValue label="Transfer Date" value={line.starting_date || line.departure_date} />
            <DetailValue label="Vehicle / Service" value={line.flight_information || line.type} wide />
            <DetailValue label="Quantity" value={line.quantity} />
            <DetailValue label="Confirmation" value={line.confirm_no} />
            <DetailValue label="Currency" value={line.currency_code} />
            <DetailValue label="ROE" value={money(line.roe || line.currency_rate)} />
            <DetailValue label={`Rate (${line.currency_code || 'SAR'})`} value={money(line.rate_sar)} />
        </div>
    );
}

function OtherDetails({ line }: { line: InvoiceLine }) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailValue label="Passenger" value={line.passenger_name} />
            <DetailValue label="Description" value={line.service_description || line.sector} wide />
            <DetailValue label="Reference" value={line.ref_no || line.internal_ref_no} />
            <DetailValue label="Date" value={line.starting_date || line.departure_date} />
            <DetailValue label="End Date" value={line.ending_date || line.return_date} />
            <DetailValue label="Documents / Notes" value={line.documents} wide />
            <DetailValue label="Quantity" value={line.quantity} />
            <DetailValue label="Currency" value={line.currency_code} />
        </div>
    );
}

function ModeDetails({ line }: { line: InvoiceLine }) {
    switch (line.mode) {
        case 'Ticket':
            return <TicketDetails line={line} />;
        case 'Visa':
            return <VisaDetails line={line} />;
        case 'Hotel':
            return <HotelDetails line={line} />;
        case 'Transfer':
            return <TransferDetails line={line} />;
        default:
            return <OtherDetails line={line} />;
    }
}

function ExpandedLine({
    line,
    index,
    customerName,
    customerCode,
}: {
    line: InvoiceLine;
    index: number;
    customerName?: string;
    customerCode?: string;
}) {
    const mode = line.mode || 'Other';

    return (
        <div className="rounded-xl border bg-background p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                            {index + 1}
                        </span>
                        <span className="text-sm font-semibold">
                            Transaction {text(line.legacy_transaction_id ?? line.transaction_key)}
                        </span>
                        <ModeBadge mode={mode} />
                        {hasValue(line.type) && line.type !== 'Normal' && (
                            <span className="text-xs text-muted-foreground">{line.type}</span>
                        )}
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <div>Customer / Receivable: {text(customerName || line.customer_name || customerCode || line.customer_code)}</div>
                        <div>Vendor / Payable: {text(line.vendor_name || line.payable_account_code)}</div>
                    </div>
                </div>

                <FinancialSummary
                    line={line}
                    customerName={customerName}
                    customerCode={customerCode}
                />
            </div>

            <ModeDetails line={line} />

            <AccountingBreakdown line={line} />
        </div>
    );
}

export default function Index({ invoices, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [loadedLines, setLoadedLines] = useState<LoadedLines>({});
    const [loadingLines, setLoadingLines] = useState<LoadingLines>({});
    const [lineErrors, setLineErrors] = useState<LineErrors>({});

    function submitSearch(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setExpanded({});
        router.get('/invoices', { search }, {
            preserveScroll: true,
            replace: true,
        });
    }

    async function loadInvoiceLines(invoice: InvoiceRow): Promise<void> {
        const invoiceId = invoice.id;

        setLoadingLines((current) => ({ ...current, [invoiceId]: true }));
        setLineErrors((current) => ({ ...current, [invoiceId]: '' }));

        try {
            const response = await fetch(`/invoices/${invoiceId}/lines`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Unable to load transaction lines (${response.status}).`);
            }

            const payload = await response.json() as { lines?: InvoiceLine[] };
            const lines = Array.isArray(payload.lines) ? payload.lines : [];
            setLoadedLines((current) => ({ ...current, [invoiceId]: lines }));
        } catch (error) {
            setLineErrors((current) => ({
                ...current,
                [invoiceId]: error instanceof Error ? error.message : 'Unable to load transaction lines.',
            }));
        } finally {
            setLoadingLines((current) => ({ ...current, [invoiceId]: false }));
        }
    }

    async function toggleInvoice(invoice: InvoiceRow): Promise<void> {
        const invoiceId = invoice.id;
        const currentlyExpanded = Boolean(expanded[invoiceId]);

        if (currentlyExpanded) {
            setExpanded((current) => ({ ...current, [invoiceId]: false }));
            return;
        }

        setExpanded((current) => ({ ...current, [invoiceId]: true }));

        if (Object.prototype.hasOwnProperty.call(loadedLines, invoiceId)) {
            return;
        }

        await loadInvoiceLines(invoice);
    }

    function deleteInvoice(invoice: InvoiceRow): void {
        const canDelete = invoice.deletable ?? invoice.data_source !== 'accu';

        if (!canDelete) {
            window.alert('Historical Accu-Travel invoices are read-only and cannot be deleted.');
            return;
        }

        const invoiceNumber = invoice.invoice_number || String(invoice.id);
        const confirmed = window.confirm(
            `Delete invoice #${invoiceNumber}?\n\nThis will permanently remove the invoice, its transaction lines and its linked accounting journal entries.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/invoices/${invoice.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Sales & Refund - Invoices" />

            <div className="min-h-screen space-y-5 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Sales & Refund</div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Invoices</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create, edit, expand and review every sales transaction line without leaving the invoice list.
                            </p>
                        </div>

                        <Link
                            href="/invoices/create"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                        >
                            <FilePlus2 className="h-4 w-4" />
                            New Invoice
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
                        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search invoice, client code, client name or reference..."
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <button
                                type="submit"
                                className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                            >
                                Search
                            </button>
                        </form>

                        <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                            {invoices.length} invoices
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1180px] text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="w-10 px-2 py-3 font-medium">&nbsp;</th>
                                    <th className="px-4 py-3 font-medium">Invoice</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Client</th>
                                    <th className="px-4 py-3 font-medium">Reference</th>
                                    <th className="px-4 py-3 text-right font-medium">Receivable</th>
                                    <th className="px-4 py-3 text-right font-medium">Payable</th>
                                    <th className="px-4 py-3 text-right font-medium">Profit</th>
                                    <th className="px-4 py-3 text-center font-medium">Lines</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-16 text-center text-muted-foreground">
                                            No invoices found.
                                        </td>
                                    </tr>
                                ) : invoices.map((invoice) => {
                                    const isExpanded = Boolean(expanded[invoice.id]);
                                    const lines = loadedLines[invoice.id] ?? [];
                                    const error = lineErrors[invoice.id];
                                    const loading = Boolean(loadingLines[invoice.id]);

                                    return (
                                        <Fragment key={invoice.id}>
                                            <tr className="border-b hover:bg-muted/20">
                                                <td className="px-2 py-3 text-center align-top">
                                                    <button
                                                        type="button"
                                                        onClick={() => { void toggleInvoice(invoice); }}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} invoice ${invoice.invoice_number}`}
                                                        title={isExpanded ? 'Hide transaction lines' : 'Show transaction lines'}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted"
                                                    >
                                                        {loading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-semibold">#{invoice.invoice_number}</div>
                                                    <div className="text-xs text-muted-foreground">ID {invoice.id}</div>
                                                </td>
                                                <td className="px-4 py-3 align-top">{invoice.invoice_date || '—'}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-medium">{invoice.client_name || invoice.client_code}</div>
                                                    <div className="text-xs text-muted-foreground">{invoice.client_code}</div>
                                                </td>
                                                <td className="px-4 py-3 align-top">{invoice.ref_no || '—'}</td>
                                                <td className="px-4 py-3 text-right align-top">{money(invoice.receivable)}</td>
                                                <td className="px-4 py-3 text-right align-top">{money(invoice.payable)}</td>
                                                <td className="px-4 py-3 text-right font-medium align-top">{money(invoice.profit)}</td>
                                                <td className="px-4 py-3 text-center align-top">
                                                    <button
                                                        type="button"
                                                        onClick={() => { void toggleInvoice(invoice); }}
                                                        className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                                    >
                                                        {invoice.line_count}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className="rounded-full border px-2 py-1 text-xs">
                                                        {invoice.status || (invoice.active ? 'Active' : 'Inactive')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right align-top">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <a
                                                            href={`/invoices/${invoice.id}/print`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                                                        >
                                                            <Printer className="h-3.5 w-3.5" />
                                                            Print
                                                        </a>
                                                        <a
                                                            href={`/invoices/${invoice.id}/voucher/print`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                                                        >
                                                            <Ticket className="h-3.5 w-3.5" />
                                                            Voucher
                                                        </a>
                                                        <Link
                                                            href={`/invoices/${invoice.id}`}
                                                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Open
                                                        </Link>
                                                        {(invoice.deletable ?? invoice.data_source !== 'accu') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteInvoice(invoice)}
                                                                title={`Delete invoice #${invoice.invoice_number}`}
                                                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr key={`lines-${invoice.id}`} className="border-b bg-muted/10">
                                                    <td colSpan={11} className="p-4">
                                                        {loading && (
                                                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Loading transaction lines…
                                                            </div>
                                                        )}

                                                        {!loading && error && (
                                                            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                                                                <span>{error}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { void loadInvoiceLines(invoice); }}
                                                                    className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"
                                                                >
                                                                    Retry
                                                                </button>
                                                            </div>
                                                        )}

                                                        {!loading && !error && lines.length === 0 && (
                                                            <div className="rounded-xl border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                                                                No transaction lines found for this invoice.
                                                            </div>
                                                        )}

                                                        {!loading && !error && lines.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                                                    <div className="text-sm font-semibold">
                                                                        Invoice #{invoice.invoice_number} — {lines.length} transaction {lines.length === 1 ? 'line' : 'lines'}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Click Open for the full invoice view; all transaction details are shown here inline.
                                                                    </div>
                                                                </div>
                                                                {lines.map((line, index) => (
                                                                    <ExpandedLine
                                                                        key={`${invoice.id}-${line.legacy_transaction_id ?? index}`}
                                                                        line={line}
                                                                        index={index}
                                                                        customerName={invoice.client_name}
                                                                        customerCode={invoice.client_code}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
