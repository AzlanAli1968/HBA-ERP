import { Head, router } from '@inertiajs/react';
import { ChevronDown, FileSpreadsheet, FileText, Printer, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

type Company = {
    name?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    govt_license?: string;
    ntn?: string;
    logo_data?: string | null;
    qr_data?: string | null;
};

type Column = {
    key: string;
    label: string;
};

type ReportRow = Record<string, string | number | null>;

type ReportGroup = {
    title: string;
    rows: ReportRow[];
};

type Report = {
    report_name: string;
    report_title: string;
    date_from: string;
    date_to: string;
    columns: Column[];
    rows: ReportRow[];
    groups: ReportGroup[];
    totals: Record<string, number>;
};

type Props = {
    reportNames: string[];
    report_name: string;
    report_title: string;
    date_from: string;
    date_to: string;
    columns: Column[];
    rows: ReportRow[];
    groups: ReportGroup[];
    totals: Record<string, number>;
    company?: Company;
};

function formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatNumber(value: string | number | null | undefined): string {
    const number = Number(value ?? 0);
    return number.toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function isNumericKey(key: string): boolean {
    return ['receivable', 'payable', 'profit', 'fare', 'taxes', 'rooms'].includes(key);
}

function reportQuery(reportName: string, from: string, to: string): string {
    const params = new URLSearchParams();
    params.set('report_name', reportName);
    params.set('date_from', from);
    params.set('date_to', to);
    return params.toString();
}

function displayCell(column: Column, value: string | number | null): string {
    if (value === null || value === undefined || value === '') return '—';
    return isNumericKey(column.key) ? formatNumber(value) : String(value);
}

function ReportTable({
    columns,
    rows,
    totals,
}: {
    columns: Column[];
    rows: ReportRow[];
    totals: Record<string, number>;
}) {
    return (
        <div className="overflow-x-auto rounded-xl border bg-background">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-muted/40">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`whitespace-nowrap px-3 py-3 text-left text-xs font-semibold ${
                                    isNumericKey(column.key) ? 'text-right' : ''
                                }`}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-12 text-center text-muted-foreground"
                            >
                                No records found for the selected period.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, rowIndex) => (
                            <tr
                                key={`${String(row.voucher_id ?? '')}-${rowIndex}`}
                                className="border-b last:border-b-0"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-3 py-2 align-top ${
                                            isNumericKey(column.key)
                                                ? 'whitespace-nowrap text-right tabular-nums'
                                                : ''
                                        }`}
                                    >
                                        {displayCell(column, row[column.key] ?? null)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-primary/50 font-semibold">
                        {columns.map((column, index) => (
                            <td
                                key={column.key}
                                className={`px-3 py-3 ${
                                    isNumericKey(column.key)
                                        ? 'text-right tabular-nums'
                                        : ''
                                }`}
                            >
                                {index === 0
                                    ? 'Total'
                                    : isNumericKey(column.key)
                                      ? formatNumber(totals[column.key] ?? 0)
                                      : ''}
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function ActionButton({
    label,
    icon: Icon,
    href,
}: {
    label: string;
    icon: typeof Printer;
    href: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
            <Icon className="size-4" />
            {label}
        </a>
    );
}

export default function Sales({
    reportNames,
    report_name: initialReportName,
    report_title,
    date_from: initialFrom,
    date_to: initialTo,
    columns,
    rows,
    groups,
    totals,
    company,
}: Props) {
    const [reportName, setReportName] = useState(initialReportName);
    const [dateFrom, setDateFrom] = useState(initialFrom);
    const [dateTo, setDateTo] = useState(initialTo);
    const [loading, setLoading] = useState(false);

    const companyName = company?.name ?? 'HBA TRAVEL & TOURS';
    const period = useMemo(
        () => `${formatDate(dateFrom)} → ${formatDate(dateTo)}`,
        [dateFrom, dateTo],
    );

    const query = useMemo(
        () => reportQuery(reportName, dateFrom, dateTo),
        [reportName, dateFrom, dateTo],
    );

    function preview(): void {
        setLoading(true);
        router.get('/reports/sales', {
            report_name: reportName,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <>
            <Head title={`Sales Reports - ${report_title}`} />

            <div className="min-h-screen space-y-5 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Reports / Sales</div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Sale Reports
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {companyName} · {period}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <ActionButton
                                label="Print"
                                icon={Printer}
                                href={`/reports/sales/print?${query}`}
                            />
                            <ActionButton
                                label="PDF"
                                icon={FileText}
                                href={`/reports/sales/pdf?${query}`}
                            />
                            <ActionButton
                                label="Excel"
                                icon={FileSpreadsheet}
                                href={`/reports/sales/excel?${query}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-end">
                        <label className="space-y-2">
                            <span className="text-sm font-medium">Report</span>
                            <div className="relative">
                                <select
                                    value={reportName}
                                    onChange={(event) => setReportName(event.target.value)}
                                    className="h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {reportNames.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">From</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) => setDateFrom(event.target.value)}
                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">To</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={preview}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                            Preview
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-4">
                        <h2 className="text-xl font-semibold">{report_title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            From {formatDate(dateFrom)} To {formatDate(dateTo)}
                        </p>
                    </div>

                    <div className="space-y-5 p-5">
                        {groups.length > 0 ? (
                            groups.map((group) => (
                                <section key={group.title} className="space-y-2">
                                    <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold">
                                        {group.title}
                                    </div>
                                    <ReportTable
                                        columns={columns}
                                        rows={group.rows}
                                        totals={totals}
                                    />
                                </section>
                            ))
                        ) : (
                            <ReportTable columns={columns} rows={rows} totals={totals} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
