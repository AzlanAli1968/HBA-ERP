import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Check,
    ChevronDown,
    ChevronRight,
    FileSpreadsheet,
    FileText,
    Printer,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Account = { id: number; code: string; name: string };
type SimpleOption = { id: number; name: string };
type ReportRow = {
    code: string;
    name: string;
    amount?: number;
    debit?: number;
    credit?: number;
    period_amount?: number;
    balance?: number;
};
type ReportGroup = {
    title: string;
    total: number | null;
    total_label: string;
    rows: ReportRow[];
};
type ReportSection = {
    title: string;
    groups: ReportGroup[];
    rows?: ReportRow[];
    total?: number;
};
type Report = {
    report_type: string;
    report_name: string;
    report_title: string;
    date_from: string;
    date_to: string;
    branch_id: number | null;
    department_id: number | null;
    account_id: number | null;
    filter_label: string;
    sections?: ReportSection[];
    rows?: ReportRow[];
    totals?: {
        debit: number;
        credit: number;
        period_amount: number;
        balance: number;
    } | null;
    net_profit_loss?: number;
};

type Props = {
    reportTypes: string[];
    reportNames: Record<string, string[]>;
    accounts: Account[];
    branches: SimpleOption[];
    departments: SimpleOption[];
    company: Record<string, unknown>;
} & Report;

const money = (value: number | undefined | null) =>
    Number(value ?? 0).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const dateText = (value: string) => {
    if (!value) return '—';
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          });
};

function AccountCombobox({
    accounts,
    value,
    onChange,
}: {
    accounts: Account[];
    value: number | '';
    onChange: (value: number | '') => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = useMemo(
        () => accounts.find((account) => account.id === value) ?? null,
        [accounts, value],
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return accounts.slice(0, 200);
        return accounts
            .filter((account) =>
                `${account.code} ${account.name}`
                    .toLowerCase()
                    .includes(query),
            )
            .slice(0, 200);
    }, [accounts, search]);

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const choose = (account: Account) => {
        onChange(account.id);
        setSearch('');
        setOpen(false);
    };

    const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
        if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            const current = accounts.findIndex((item) => item.id === value);
            const next = current < 0 ? 0 : (current + 1) % accounts.length;
            if (accounts[next]) onChange(accounts[next].id);
        }
        if (event.key === 'ArrowUp' && !open) {
            event.preventDefault();
            const current = accounts.findIndex((item) => item.id === value);
            const next = current < 0 ? accounts.length - 1 : (current - 1 + accounts.length) % accounts.length;
            if (accounts[next]) onChange(accounts[next].id);
        }
    };

    const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((index) =>
                filtered.length ? Math.min(index + 1, filtered.length - 1) : 0,
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const account = filtered[highlightedIndex];
            if (account) choose(account);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            setSearch('');
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    requestAnimationFrame(() => inputRef.current?.focus());
                }}
                onKeyDown={onTriggerKeyDown}
                className="flex h-11 w-full items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={open}
            >
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                    {selected
                        ? `${selected.code} — ${selected.name}`
                        : 'Search by account code or name.'}
                </span>
                <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-background shadow-xl">
                    <div className="border-b p-2">
                        <input
                            ref={inputRef}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setHighlightedIndex(0);
                            }}
                            onKeyDown={onSearchKeyDown}
                            placeholder="Type account code or name..."
                            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            autoComplete="off"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground">
                                No matching account found.
                            </div>
                        ) : (
                            filtered.map((account, index) => (
                                <button
                                    type="button"
                                    key={account.id}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    onClick={() => choose(account)}
                                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted ${index === highlightedIndex ? 'bg-muted' : ''}`}
                                >
                                    <span className="truncate">
                                        {account.code} — {account.name}
                                    </span>
                                    {account.id === value && (
                                        <Check className="ml-auto size-4 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FinancialReportsPage(props: Props) {
    const [type, setType] = useState(props.report_type);
    const [name, setName] = useState(props.report_name);
    const [from, setFrom] = useState(props.date_from);
    const [to, setTo] = useState(props.date_to);
    const [branchId, setBranchId] = useState<number | ''>(props.branch_id ?? '');
    const [departmentId, setDepartmentId] = useState<number | ''>(props.department_id ?? '');
    const [loading, setLoading] = useState(false);
    const [openTypes, setOpenTypes] = useState(true);

    const namesForType = props.reportNames[type] ?? [];
    const needsBranch = name.toLowerCase().includes('branch');
    const needsDepartment = name.toLowerCase().includes('department');

    useEffect(() => {
        setType(props.report_type);
        setName(props.report_name);
        setFrom(props.date_from);
        setTo(props.date_to);
        setBranchId(props.branch_id ?? '');
        setDepartmentId(props.department_id ?? '');
    }, [props.report_type, props.report_name, props.date_from, props.date_to, props.branch_id, props.department_id]);

    const selectType = (nextType: string) => {
        setType(nextType);
        const first = props.reportNames[nextType]?.[0] ?? '';
        setName(first);
        if (!first.toLowerCase().includes('branch')) setBranchId('');
        if (!first.toLowerCase().includes('department')) setDepartmentId('');
    };

    const preview = () => {
        setLoading(true);
        router.get(
            '/reports/financial',
            {
                report_type: type,
                report_name: name,
                date_from: from,
                date_to: to,
                branch_id: branchId || undefined,
                department_id: departmentId || undefined,
            },
            {
                preserveState: false,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    const query = useMemo(() => {
        const params = new URLSearchParams();
        params.set('report_type', type);
        params.set('report_name', name);
        params.set('date_from', from);
        params.set('date_to', to);
        if (branchId !== '') params.set('branch_id', String(branchId));
        if (departmentId !== '') params.set('department_id', String(departmentId));
        return params.toString();
    }, [type, name, from, to, branchId, departmentId]);

    const renderAmount = (value: number | undefined) => {
        const number = Number(value ?? 0);
        return number < 0 ? `(${money(Math.abs(number))})` : money(number);
    };

    return (
        <>
            <Head title="Financial Reports" />
            <div className="min-h-full bg-muted/20 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-5">
                    <div className="rounded-2xl border bg-background p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Accounting / Financial Reports</div>
                                <h1 className="mt-1 text-2xl font-bold">Financial Reports</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Select a report, set the period, and preview the report in the same workflow as the legacy system.
                                </p>
                            </div>
                            <div className="hidden rounded-lg border px-3 py-2 text-sm md:block">
                                <div className="font-semibold">{props.filter_label}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-background shadow-sm">
                        <div className="grid min-h-[430px] lg:grid-cols-[230px_minmax(0,1fr)_250px]">
                            <aside className="border-b p-3 lg:border-r lg:border-b-0">
                                <button
                                    type="button"
                                    onClick={() => setOpenTypes((value) => !value)}
                                    className="mb-2 flex w-full items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm font-bold uppercase tracking-wide"
                                >
                                    <span>Report Type</span>
                                    {openTypes ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                </button>

                                {openTypes && (
                                    <div className="space-y-1">
                                        {props.reportTypes.map((item) => (
                                            <button
                                                type="button"
                                                key={item}
                                                onClick={() => selectType(item)}
                                                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm ${item === type ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                            >
                                                <BarChart3 className="size-4 shrink-0" />
                                                <span className="truncate">{item}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </aside>

                            <section className="border-b p-3 lg:border-r lg:border-b-0">
                                <div className="mb-2 rounded-lg bg-muted/60 px-3 py-2 text-sm font-bold uppercase tracking-wide">
                                    Report Name
                                </div>
                                <div className="space-y-1">
                                    {namesForType.map((item) => (
                                        <button
                                            type="button"
                                            key={item}
                                            onClick={() => setName(item)}
                                            className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${item === name ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <aside className="p-4">
                                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm font-bold uppercase tracking-wide">
                                    Filters
                                </div>

                                <div className="mt-4 space-y-3">
                                    <label className="block">
                                        <span className="mb-1 block text-sm font-medium">From</span>
                                        <input
                                            type="date"
                                            value={from}
                                            onChange={(event) => setFrom(event.target.value)}
                                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 block text-sm font-medium">To</span>
                                        <input
                                            type="date"
                                            min={from || undefined}
                                            value={to}
                                            onChange={(event) => setTo(event.target.value)}
                                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                        />
                                    </label>

                                    {needsBranch && (
                                        <label className="block">
                                            <span className="mb-1 block text-sm font-medium">Branch</span>
                                            <select
                                                value={branchId}
                                                onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : '')}
                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                            >
                                                <option value="">All Branches</option>
                                                {props.branches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                    )}

                                    {needsDepartment && (
                                        <label className="block">
                                            <span className="mb-1 block text-sm font-medium">Department</span>
                                            <select
                                                value={departmentId}
                                                onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : '')}
                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                            >
                                                <option value="">All Departments</option>
                                                {props.departments.map((department) => (
                                                    <option key={department.id} value={department.id}>{department.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                    )}

                                    <button
                                        type="button"
                                        disabled={loading || !from || !to || to < from}
                                        onClick={preview}
                                        className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50"
                                    >
                                        <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
                                        Preview
                                    </button>

                                    <div className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">Filter</div>
                                        <div className="mt-1 text-muted-foreground">
                                            {needsBranch || needsDepartment ? props.filter_label : 'No'}
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
                            <div className="text-sm text-muted-foreground">
                                {dateText(props.date_from)} → {dateText(props.date_to)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`/reports/financial/print?${query}`}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                >
                                    <Printer className="size-4" /> Print
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`/reports/financial/pdf?${query}`}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                >
                                    <FileText className="size-4" /> PDF
                                </a>
                                <a
                                    href={`/reports/financial/excel?${query}`}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                >
                                    <FileSpreadsheet className="size-4" /> Excel
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-background p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4">
                            <div>
                                <div className="text-xs italic text-muted-foreground">{type}</div>
                                <h2 className="text-xl font-bold">{props.report_title}</h2>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    From {dateText(props.date_from)} To {dateText(props.date_to)}
                                </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                Printing Date: {new Date().toLocaleString('en-GB')}
                            </div>
                        </div>

                        {type === 'Profit & Loss' && (
                            <div className="overflow-x-auto">
                                {props.sections?.map((section) => (
                                    <div key={section.title} className="mb-5">
                                        <div className="mb-2 text-sm font-bold uppercase text-foreground">
                                            {section.title}
                                        </div>
                                        {section.groups.map((group) => (
                                            <div key={`${section.title}:${group.title}`} className="mb-4">
                                                <div className="mb-1 text-sm font-medium text-muted-foreground">
                                                    {group.title}
                                                </div>
                                                <table className="w-full text-sm">
                                                    <tbody>
                                                        {group.rows.map((row) => (
                                                            <tr key={`${row.code}:${row.name}`} className="border-b border-dotted">
                                                                <td className="w-32 px-3 py-2 font-medium">{row.code}</td>
                                                                <td className="px-3 py-2">{row.name}</td>
                                                                <td className="w-44 px-3 py-2 text-right tabular-nums">{renderAmount(row.amount)}</td>
                                                            </tr>
                                                        ))}
                                                        {group.total !== null && (
                                                            <tr className="font-semibold">
                                                                <td colSpan={2} className="px-3 py-2 text-right">{group.total_label}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums">{renderAmount(group.total)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="mt-4 border-t-2 pt-3 text-right text-base font-bold">
                                    {Number(props.net_profit_loss ?? 0) < 0
                                        ? `(${money(Math.abs(Number(props.net_profit_loss ?? 0)))})`
                                        : money(Number(props.net_profit_loss ?? 0))}
                                </div>
                            </div>
                        )}

                        {type !== 'Profit & Loss' && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px] text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-3 py-2 text-left">Account Code</th>
                                            <th className="px-3 py-2 text-left">Account Name</th>
                                            <th className="px-3 py-2 text-right">Debit</th>
                                            <th className="px-3 py-2 text-right">Credit</th>
                                            <th className="px-3 py-2 text-right">Period Amount</th>
                                            <th className="px-3 py-2 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {props.sections?.flatMap((section) => section.rows ?? []).concat(props.rows ?? []).map((row) => (
                                            <tr key={`${row.code}:${row.name}`} className="border-b border-dotted">
                                                <td className="px-3 py-2">{row.code}</td>
                                                <td className="px-3 py-2">{row.name}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{money(row.debit)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{money(row.credit)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{renderAmount(row.period_amount)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{renderAmount(row.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
