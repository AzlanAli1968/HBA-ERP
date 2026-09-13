import { Head, router } from '@inertiajs/react';
import { ChevronDown, FileSpreadsheet, FileText, Printer, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Account = {
    id: number;
    code: string;
    name: string;
};

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

type Props = {
    reportNames: string[];
    report_name: string;
    report_title: string;
    date_from: string;
    date_to: string;
    filter_type: 'all' | 'client' | 'vendor';
    filter_value: string;
    filter_label: string;
    clients: Account[];
    vendors: Account[];
    columns: Column[];
    rows: ReportRow[];
    groups: Array<{ title: string; rows: ReportRow[] }>;
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
    return Number(value ?? 0).toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function numericKey(key: string): boolean {
    return ['receivable', 'payable', 'profit', 'rooms'].includes(key);
}

function AccountCombobox({
    accounts,
    value,
    onChange,
    placeholder,
}: {
    accounts: Account[];
    value: string;
    onChange: (code: string) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = useMemo(
        () => accounts.find((account) => account.code === value) ?? null,
        [accounts, value],
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return accounts;
        return accounts.filter((account) =>
            `${account.code} ${account.name}`.toLowerCase().includes(query),
        );
    }, [accounts, search]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        if (open) {
            setHighlight(0);
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlight((current) => Math.min(current + 1, filtered.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlight((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const account = filtered[highlight];
            if (account) {
                onChange(account.code);
                setSearch('');
                setOpen(false);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
        }
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-background px-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
            >
                <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
                    {selected ? `${selected.code} — ${selected.name}` : placeholder}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-full min-w-[320px] overflow-hidden rounded-xl border bg-popover shadow-xl">
                    <div className="border-b p-2">
                        <div className="flex items-center gap-2 rounded-lg border px-3">
                            <Search className="size-4 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setHighlight(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Search account code or name..."
                                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No matching accounts.
                            </div>
                        ) : (
                            filtered.map((account, index) => (
                                <button
                                    type="button"
                                    key={account.id}
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => {
                                        onChange(account.code);
                                        setSearch('');
                                        setOpen(false);
                                    }}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                        index === highlight
                                            ? 'bg-muted'
                                            : 'hover:bg-muted/70'
                                    }`}
                                >
                                    <div className="font-medium">{account.code}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {account.name}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
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
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
            <Icon className="size-4" />
            {label}
        </a>
    );
}

function Table({
    columns,
    rows,
    totals,
}: {
    columns: Column[];
    rows: ReportRow[];
    totals: Record<string, number>;
}) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-muted/40">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-3 py-3 text-left text-xs font-semibold ${numericKey(column.key) ? 'text-right' : ''}`}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                                No records found for the selected filters.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => (
                            <tr key={`${String(row.voucher_id ?? '')}-${index}`} className="border-b last:border-0">
                                {columns.map((column) => {
                                    const value = row[column.key] ?? '';
                                    return (
                                        <td
                                            key={column.key}
                                            className={`px-3 py-2 align-top ${numericKey(column.key) ? 'whitespace-nowrap text-right tabular-nums' : ''}`}
                                        >
                                            {value === '' || value === null
                                                ? '—'
                                                : numericKey(column.key)
                                                  ? formatNumber(value)
                                                  : String(value)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-primary/50 font-semibold">
                        {columns.map((column, index) => (
                            <td
                                key={column.key}
                                className={`px-3 py-3 ${numericKey(column.key) ? 'text-right tabular-nums' : ''}`}
                            >
                                {index === 0
                                    ? 'Total'
                                    : numericKey(column.key)
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

export default function Other({
    reportNames,
    report_name: initialReportName,
    report_title,
    date_from: initialFrom,
    date_to: initialTo,
    filter_type: initialFilterType,
    filter_value: initialFilterValue,
    filter_label,
    clients,
    vendors,
    columns,
    rows,
    groups,
    totals,
    company,
}: Props) {
    const [reportName, setReportName] = useState(initialReportName);
    const [dateFrom, setDateFrom] = useState(initialFrom);
    const [dateTo, setDateTo] = useState(initialTo);
    const [filterType, setFilterType] = useState<'all' | 'client' | 'vendor'>(initialFilterType);
    const [filterValue, setFilterValue] = useState(initialFilterValue);
    const [loading, setLoading] = useState(false);

    const options = filterType === 'client' ? clients : vendors;
    const query = useMemo(() => {
        const params = new URLSearchParams();
        params.set('report_name', reportName);
        params.set('date_from', dateFrom);
        params.set('date_to', dateTo);
        params.set('filter_type', filterType);
        if (filterType !== 'all' && filterValue) params.set('filter_value', filterValue);
        return params.toString();
    }, [reportName, dateFrom, dateTo, filterType, filterValue]);

    function changeFilterType(value: 'all' | 'client' | 'vendor'): void {
        setFilterType(value);
        setFilterValue('');
    }

    function preview(): void {
        setLoading(true);
        router.get('/reports/other', {
            report_name: reportName,
            date_from: dateFrom,
            date_to: dateTo,
            filter_type: filterType,
            filter_value: filterType === 'all' ? undefined : filterValue || undefined,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <>
            <Head title={`Other Reports - ${report_title}`} />
            <div className="min-h-screen space-y-5 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Reports / Other</div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Other Reports</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {company?.name ?? 'HBA TRAVEL & TOURS'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton label="Print" icon={Printer} href={`/reports/other/print?${query}`} />
                            <ActionButton label="PDF" icon={FileText} href={`/reports/other/pdf?${query}`} />
                            <ActionButton label="Excel" icon={FileSpreadsheet} href={`/reports/other/excel?${query}`} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px_minmax(0,1fr)_auto] xl:items-end">
                        <label className="space-y-2">
                            <span className="text-sm font-medium">Report</span>
                            <select
                                value={reportName}
                                onChange={(event) => setReportName(event.target.value)}
                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                {reportNames.map((name) => (
                                    <option key={name}>{name}</option>
                                ))}
                            </select>
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

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Filter</span>
                            <select
                                value={filterType}
                                onChange={(event) => changeFilterType(event.target.value as 'all' | 'client' | 'vendor')}
                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All</option>
                                <option value="client">Client wise</option>
                                <option value="vendor">Vendor wise</option>
                            </select>
                        </label>

                        <div>
                            {filterType === 'all' ? (
                                <div className="h-11 rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground flex items-center">
                                    All accounts
                                </div>
                            ) : (
                                <AccountCombobox
                                    accounts={options}
                                    value={filterValue}
                                    onChange={setFilterValue}
                                    placeholder={filterType === 'client' ? 'Select client...' : 'Select vendor...'}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={preview}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                            Preview
                        </button>
                    </div>

                    <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                        {formatDate(dateFrom)} → {formatDate(dateTo)}
                        {filterType !== 'all' ? ` · ${filter_label}` : ''}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-4">
                        <h2 className="text-xl font-semibold">{report_title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            From {formatDate(dateFrom)} To {formatDate(dateTo)}
                            {filterType !== 'all' ? ` · ${filter_label}` : ''}
                        </p>
                    </div>
                    <div className="p-5">
                        <Table columns={columns} rows={rows} totals={totals} />
                    </div>
                </div>
            </div>
        </>
    );
}
