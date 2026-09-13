import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    ChevronRight,
    FileText,
    LockKeyhole,
    Pencil,
    Printer,
    Receipt,
    UserRound,
    WalletCards,
    FileDown,
    TicketCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Header = {
    id: number;
    invoice_number: string;
    invoice_date: string;
    ref_no: string;
    branch_id: number;
    department_id: number;
    client_account_id: number;
    client_code: string;
    client_name: string;
    payment_terms: string;
    employee: string;
    sales_tax_invoice_no: string;
    due_date: string;
    due_date_vendor: string;
    supervised: boolean;
    ticket_query_id: string;
    umrah_query_id: string;
    active: boolean;
    status: string;
    remarks: string;
};

type Line = {
    legacy_transaction_id?: number;
    transaction_key?: string;
    mode: string;
    type: string;
    passenger_name: string;
    passport_no: string;
    nationality: string;
    phone: string;
    address: string;
    dob: string;
    passenger_type: string;
    group_no: string;
    payable_account_code: string;
    payable_account_2: string;
    payable_account_3: string;
    vendor_name?: string;
    vendor_amount: number;
    vendor_amount_2: number;
    vendor_amount_3: number;
    payable_amount?: number;
    receivable_amount: number;
    profit_amount?: number;
    revenue_account_code: string;
    ticket_no: string;
    con_ticket_no: string;
    ticket_type: string;
    sector: string;
    departure_date: string;
    return_date: string;
    flight_no: string;
    pnr: string;
    route: string;
    gds: string;
    class: string;
    xo: string;
    visa_no: string;
    documents: string;
    hotel_id: number | null;
    vehicle_id: number | null;
    hotel_name: string;
    room_type: string;
    meal: string;
    room_no: string;
    room_quantity: number;
    quantity: number;
    nights: number | null;
    rate: number;
    internal_ref_no: string;
    ref_no?: string;
    confirm_no: string;
    sector_to: string;
    flight_information: string;
    package: string;
    starting_date: string;
    ending_date: string;
    online_date: string;
    other_service_charges: number;
    discount: number;
    insurance: number;
    psf: number;
    commission_receivable: number;
    commission_paid: number;
    commission_to_client: number;
    fare: number;
    sp_apt: number;
    fare_nc: number;
    currency_code: string;
    currency_quantity: number | null;
    currency_rate: number | null;
    agent_code: string;
    agent_amount: number;
    particulars_2: string;
    particulars_3: string;
    master_rows?: {
        id: number;
        account_code: string;
        debit: number;
        credit: number;
        sub_id: number | null;
        profit: number;
    }[];
};

type Summary = {
    receivable: number;
    payable: number;
    profit: number;
    line_count: number;
};

type Props = {
    invoice: Header;
    lines?: Line[] | null;
    summary?: Summary | null;
    readOnly: boolean;
    dataSource: string;
};

function money(value: number): string {
    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function text(value: unknown): string {
    return value === null || value === undefined || String(value) === '' ? '—' : String(value);
}

function linePayable(line: Line): number {
    if (line.payable_amount !== undefined) {
        return Number(line.payable_amount);
    }

    if (line.profit_amount !== undefined) {
        return Number(line.receivable_amount) - Number(line.profit_amount);
    }

    return Number(line.vendor_amount || 0)
        + Number(line.vendor_amount_2 || 0)
        + Number(line.vendor_amount_3 || 0);
}

function InfoItem({ label, value, className = '' }: { label: string; value: unknown; className?: string }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-sm font-medium">{text(value)}</div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="max-w-[68%] text-right text-sm font-medium whitespace-pre-wrap">{text(value)}</span>
        </div>
    );
}

export default function Show({ invoice, lines: rawLines, summary, readOnly, dataSource }: Props) {
    const lines = Array.isArray(rawLines) ? rawLines : [];
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedLine = lines[selectedIndex] ?? lines[0] ?? null;

    const calculatedSummary = useMemo(() => {
        if (summary) return summary;
        const receivable = lines.reduce((sum, line) => sum + Number(line.receivable_amount || 0), 0);
        const payable = lines.reduce((sum, line) => sum + linePayable(line), 0);
        return { receivable, payable, profit: receivable - payable, line_count: lines.length };
    }, [lines, summary]);

    return (
        <>
            <Head title={`Invoice #${invoice.invoice_number}`} />

            <div className="min-h-screen space-y-4 bg-muted/20 p-4 md:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Sales & Refund / Invoices</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">Invoice #{invoice.invoice_number}</h1>
                                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                                    {text(invoice.status)}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {dataSource} · {calculatedSummary.line_count} transaction {calculatedSummary.line_count === 1 ? 'line' : 'lines'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={`/invoices/${invoice.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                        >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                        </a>
                        <a
                            href={`/invoices/${invoice.id}/pdf`}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                        >
                            <FileDown className="h-4 w-4" />
                            Invoice PDF
                        </a>
                        <a
                            href={`/invoices/${invoice.id}/voucher/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                        >
                            <TicketCheck className="h-4 w-4" />
                            Service Voucher
                        </a>
                        <a
                            href={`/invoices/${invoice.id}/voucher/pdf`}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                        >
                            <FileDown className="h-4 w-4" />
                            Voucher PDF
                        </a>
                        {readOnly ? (
                            <div className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium text-muted-foreground">
                                <LockKeyhole className="h-4 w-4" />
                                Historical record · Read only
                            </div>
                        ) : (
                            <Link
                                href={`/invoices/${invoice.id}/edit`}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit Invoice
                            </Link>
                        )}
                        <Link
                            href="/invoices"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Invoices
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="grid gap-4 border-b p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <InfoItem label="Invoice ID" value={invoice.invoice_number ? `#${invoice.invoice_number}` : invoice.id} />
                        <InfoItem label="Invoice Date" value={invoice.invoice_date} />
                        <InfoItem label="Client Code" value={invoice.client_code} />
                        <InfoItem label="Client" value={invoice.client_name} className="xl:col-span-2" />
                        <InfoItem label="Reference" value={invoice.ref_no} />
                        <InfoItem label="Due Date" value={invoice.due_date} />
                        <InfoItem label="Due Vendor" value={invoice.due_date_vendor} />
                    </div>

                    <div className="grid gap-4 border-b p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoItem label="Payment Terms" value={invoice.payment_terms} />
                        <InfoItem label="Employee" value={invoice.employee} />
                        <InfoItem label="Branch ID" value={invoice.branch_id} />
                        <InfoItem label="Department ID" value={invoice.department_id} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Receipt className="h-4 w-4" />
                                Receivable
                            </div>
                            <div className="mt-2 text-2xl font-semibold">{money(calculatedSummary.receivable)}</div>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <WalletCards className="h-4 w-4" />
                                Payable
                            </div>
                            <div className="mt-2 text-2xl font-semibold">{money(calculatedSummary.payable)}</div>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                Profit
                            </div>
                            <div className="mt-2 text-2xl font-semibold">{money(calculatedSummary.profit)}</div>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                Transaction Lines
                            </div>
                            <div className="mt-2 text-2xl font-semibold">{calculatedSummary.line_count}</div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Transaction Lines</h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Every Accu transaction is shown separately. Click a line to inspect all details.
                                </p>
                            </div>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                {lines.length} lines
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-sm">
                                <thead className="border-b bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-3 py-2.5 font-medium">Inv</th>
                                        <th className="px-3 py-2.5 font-medium">Mode</th>
                                        <th className="px-3 py-2.5 font-medium">Reference No</th>
                                        <th className="px-3 py-2.5 font-medium">Passenger</th>
                                        <th className="px-3 py-2.5 font-medium">Sector</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Receivable</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Payable</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Profit</th>
                                        <th className="px-3 py-2.5 font-medium">Ticket</th>
                                        <th className="px-3 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, index) => {
                                        const payable = linePayable(line);
                                        const profit = Number(line.profit_amount ?? (Number(line.receivable_amount) - payable));
                                        const active = index === selectedIndex;

                                        return (
                                            <tr
                                                key={`${line.transaction_key ?? line.legacy_transaction_id ?? index}`}
                                                onClick={() => setSelectedIndex(index)}
                                                className={`cursor-pointer border-b transition last:border-b-0 ${active ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                            >
                                                <td className="px-3 py-3 font-semibold">{text(line.legacy_transaction_id ?? index + 1)}</td>
                                                <td className="px-3 py-3">{text(line.mode)}</td>
                                                <td className="px-3 py-3">{text(line.ref_no || line.confirm_no)}</td>
                                                <td className="px-3 py-3 font-medium">{text(line.passenger_name)}</td>
                                                <td className="max-w-[250px] truncate px-3 py-3">{text(line.sector)}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{money(line.receivable_amount)}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{money(payable)}</td>
                                                <td className="px-3 py-3 text-right font-medium tabular-nums">{money(profit)}</td>
                                                <td className="px-3 py-3">{text(line.ticket_no)}</td>
                                                <td className="px-3 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></td>
                                            </tr>
                                        );
                                    })}
                                    {lines.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                                                No transaction lines were found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <UserRound className="h-4 w-4" />
                                <h2 className="text-sm font-semibold">
                                    {selectedLine ? `Transaction #${text(selectedLine.legacy_transaction_id ?? selectedIndex + 1)}` : 'Transaction Detail'}
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Full line-level detail from the authoritative transaction source.
                            </p>
                        </div>

                        {selectedLine ? (
                            <div className="max-h-[720px] overflow-y-auto p-4">
                                <div className="mb-4 grid grid-cols-3 gap-2">
                                    <div className="rounded-lg border bg-muted/20 p-3 text-center">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Receivable</div>
                                        <div className="mt-1 text-sm font-semibold">{money(selectedLine.receivable_amount)}</div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3 text-center">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Payable</div>
                                        <div className="mt-1 text-sm font-semibold">{money(linePayable(selectedLine))}</div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3 text-center">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Profit</div>
                                        <div className="mt-1 text-sm font-semibold">{money(Number(selectedLine.profit_amount ?? (selectedLine.receivable_amount - linePayable(selectedLine))))}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-background px-4">
                                    <DetailRow label="Transaction ID" value={selectedLine.legacy_transaction_id} />
                                    <DetailRow label="Mode" value={selectedLine.mode} />
                                    <DetailRow label="Type" value={selectedLine.type} />
                                    <DetailRow label="Reference No" value={selectedLine.ref_no || selectedLine.confirm_no} />
                                    <DetailRow label="Passenger" value={selectedLine.passenger_name} />
                                    <DetailRow label="Passenger Type" value={selectedLine.passenger_type} />
                                    <DetailRow label="Passport No" value={selectedLine.passport_no} />
                                    <DetailRow label="Nationality" value={selectedLine.nationality} />
                                    <DetailRow label="Phone" value={selectedLine.phone} />
                                    <DetailRow label="DOB" value={selectedLine.dob} />
                                    <DetailRow label="Group No" value={selectedLine.group_no} />
                                    <DetailRow label="Sector" value={selectedLine.sector} />
                                    <DetailRow label="Route" value={selectedLine.route} />
                                    <DetailRow label="Departure Date" value={selectedLine.departure_date} />
                                    <DetailRow label="Return Date" value={selectedLine.return_date} />
                                    <DetailRow label="Flight No" value={selectedLine.flight_no} />
                                    <DetailRow label="PNR" value={selectedLine.pnr} />
                                    <DetailRow label="GDS" value={selectedLine.gds} />
                                    <DetailRow label="Ticket No" value={selectedLine.ticket_no} />
                                    <DetailRow label="Con Ticket No" value={selectedLine.con_ticket_no} />
                                    <DetailRow label="Ticket Type" value={selectedLine.ticket_type} />
                                    <DetailRow label="Vendor" value={selectedLine.vendor_name || selectedLine.payable_account_code} />
                                    <DetailRow label="Vendor Amount" value={money(selectedLine.vendor_amount)} />
                                    <DetailRow label="Vendor Amount 2" value={money(selectedLine.vendor_amount_2)} />
                                    <DetailRow label="Vendor Amount 3" value={money(selectedLine.vendor_amount_3)} />
                                    <DetailRow label="Total Payable" value={money(linePayable(selectedLine))} />
                                    <DetailRow label="Payable Account 1" value={selectedLine.payable_account_code} />
                                    <DetailRow label="Payable Account 2" value={selectedLine.payable_account_2} />
                                    <DetailRow label="Payable Account 3" value={selectedLine.payable_account_3} />
                                    <DetailRow label="Revenue Account" value={selectedLine.revenue_account_code} />
                                    <DetailRow label="Hotel" value={selectedLine.hotel_name} />
                                    <DetailRow label="Room Type" value={selectedLine.room_type} />
                                    <DetailRow label="Meal" value={selectedLine.meal} />
                                    <DetailRow label="Room No" value={selectedLine.room_no} />
                                    <DetailRow label="Room Quantity" value={selectedLine.room_quantity} />
                                    <DetailRow label="Quantity" value={selectedLine.quantity} />
                                    <DetailRow label="Nights" value={selectedLine.nights} />
                                    <DetailRow label="Rate" value={money(selectedLine.rate)} />
                                    <DetailRow label="Currency" value={selectedLine.currency_code} />
                                    <DetailRow label="Currency Qty" value={selectedLine.currency_quantity} />
                                    <DetailRow label="Currency Rate" value={selectedLine.currency_rate} />
                                    <DetailRow label="Internal Ref" value={selectedLine.internal_ref_no} />
                                    <DetailRow label="Flight Information" value={selectedLine.flight_information} />
                                    <DetailRow label="Visa / Document" value={selectedLine.visa_no || selectedLine.documents} />
                                    <DetailRow label="Package" value={selectedLine.package} />
                                    <DetailRow label="Remarks / Address" value={selectedLine.address} />
                                </div>

                                {Array.isArray(selectedLine.master_rows) && selectedLine.master_rows.length > 0 && (
                                    <div className="mt-4 rounded-xl border bg-background p-3">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                                            <WalletCards className="h-4 w-4" />
                                            Legacy Master Accounting Rows
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[460px] text-xs">
                                                <thead className="border-b text-left text-muted-foreground">
                                                    <tr>
                                                        <th className="px-2 py-2">ID</th>
                                                        <th className="px-2 py-2">Account</th>
                                                        <th className="px-2 py-2 text-right">Debit</th>
                                                        <th className="px-2 py-2 text-right">Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedLine.master_rows.map((row) => (
                                                        <tr key={row.id} className="border-b last:border-b-0">
                                                            <td className="px-2 py-2">{row.id}</td>
                                                            <td className="px-2 py-2">{row.account_code}</td>
                                                            <td className="px-2 py-2 text-right tabular-nums">{money(row.debit)}</td>
                                                            <td className="px-2 py-2 text-right tabular-nums">{money(row.credit)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                Select a transaction line to inspect it.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
