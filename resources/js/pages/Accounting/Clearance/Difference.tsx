import { Head, router } from '@inertiajs/react';
import { Check, ChevronDown, FileSpreadsheet, FileText, Printer, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Account = { id: number; code: string; name: string };
type Props = {
    title: string; date_from: string; date_to: string; account: Account | null; accounts: Account[];
    ledger_balance: number; clearance_balance: number; difference: number;
    ledger_balance_side: string; clearance_balance_side: string; difference_side: string;
    vouchers_without_invoice: Array<{ date: string | null; type: string; voucher_no: string; debit: number; credit: number }>;
    refunds_without_invoice: Array<{ date: string | null; type: string; refund_no: string; amount: number }>;
    pending_refunds: Array<{ date: string | null; type: string; refund_no: string; amount: number }>;
};

const money = (value: number) => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dateText = (value: string | null) => {
    if (!value) return '—';
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isValidDateValue = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

const amountWithSide = (value: number, side: string) => `${money(Math.abs(value))} ${side}`;

function AccountCombobox({ accounts, value, onChange }: { accounts: Account[]; value: number | ''; onChange: (value: number | '') => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const typeaheadRef = useRef('');
    const typeaheadTimeRef = useRef(0);

    const selected = useMemo(() => accounts.find((account) => account.id === value) ?? null, [accounts, value]);
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return accounts;
        return accounts.filter((account) => {
            const code = account.code.toLowerCase();
            const name = account.name.toLowerCase();
            return code.includes(query) || name.includes(query) || `${code} ${name}`.includes(query);
        });
    }, [accounts, search]);

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const currentIndex = filtered.findIndex((account) => account.id === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }, [open, filtered, value]);

    useEffect(() => {
        if (!open) return;
        optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [open, highlightedIndex]);

    const choose = (account: Account) => {
        onChange(account.id);
        setSearch('');
        setOpen(false);
    };

    const openPicker = () => {
        setOpen(true);
        setSearch('');
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const moveClosed = (direction: 1 | -1) => {
        if (!accounts.length) return;
        const current = accounts.findIndex((account) => account.id === value);
        const next = current < 0 ? (direction === 1 ? 0 : accounts.length - 1) : (current + direction + accounts.length) % accounts.length;
        onChange(accounts[next].id);
    };

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (open) return;
            moveClosed(1);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (open) return;
            moveClosed(-1);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
            return;
        }
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

        const key = event.key.toLowerCase();
        const now = Date.now();
        const elapsed = now - typeaheadTimeRef.current;
        const repeatedSameKey = elapsed < 700 && typeaheadRef.current === key;
        const proposed = elapsed < 700 && !repeatedSameKey ? `${typeaheadRef.current}${key}` : key;
        let matches = accounts.filter((account) => account.code.toLowerCase().startsWith(proposed) || account.name.toLowerCase().startsWith(proposed));
        const searchKey = matches.length ? proposed : key;
        if (!matches.length) {
            matches = accounts.filter((account) => account.code.toLowerCase().startsWith(key) || account.name.toLowerCase().startsWith(key));
        }
        if (!matches.length) return;

        event.preventDefault();
        const currentMatch = matches.findIndex((account) => account.id === value);
        const nextIndex = repeatedSameKey && currentMatch >= 0 ? (currentMatch + 1) % matches.length : 0;
        onChange(matches[nextIndex].id);
        typeaheadRef.current = searchKey;
        typeaheadTimeRef.current = now;
        setSearch('');
        setOpen(false);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((current) => filtered.length ? Math.min(current + 1, filtered.length - 1) : 0);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((current) => Math.max(current - 1, 0));
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
            <button type="button" onClick={openPicker} onKeyDown={handleTriggerKeyDown} className="flex h-11 w-full items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" aria-haspopup="listbox" aria-expanded={open}>
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>{selected ? `${selected.code} — ${selected.name}` : 'Search by account code or name.'}</span>
                <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </button>
            {open && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-background shadow-xl">
                    <div className="border-b p-2">
                        <div className="flex items-center gap-2 rounded-lg border px-3">
                            <Search className="size-4 shrink-0 text-muted-foreground" />
                            <input ref={searchRef} value={search} onChange={(event) => { setSearch(event.target.value); setHighlightedIndex(0); }} onKeyDown={handleSearchKeyDown} placeholder="Type account code or name..." className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" autoComplete="off" />
                        </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1" role="listbox">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground">No matching account found.</div>
                        ) : filtered.map((account, index) => (
                            <button key={account.id} ref={(node) => { optionRefs.current[index] = node; }} type="button" role="option" aria-selected={account.id === value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(account)} onMouseEnter={() => setHighlightedIndex(index)} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${index === highlightedIndex ? 'bg-muted' : ''} ${account.id === value ? 'font-medium' : ''}`}>
                                <span className="min-w-0 flex-1 truncate">{account.code} — {account.name}</span>
                                {account.id === value && <Check className="size-4 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Difference({ title, date_from, date_to, account, accounts, ledger_balance, clearance_balance, difference, ledger_balance_side, clearance_balance_side, difference_side, vouchers_without_invoice, refunds_without_invoice, pending_refunds }: Props) {
    const [accountId, setAccountId] = useState<number | ''>(account?.id ?? '');
    const [from, setFrom] = useState(date_from);
    const [to, setTo] = useState(date_to);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        setAccountId(account?.id ?? '');
        setFrom(date_from);
        setTo(date_to);
    }, [account?.id, date_from, date_to]);

    const loadedQuery = useMemo(() => {
        const p = new URLSearchParams();
        if (account?.id) p.set('account_id', String(account.id));
        p.set('date_from', date_from); p.set('date_to', date_to); return p.toString();
    }, [account?.id, date_from, date_to]);

    const isDirty = String(account?.id ?? '') !== String(accountId) || from !== date_from || to !== date_to;

    const load = () => {
        if (accountId === '') return;
        if (!isValidDateValue(from) || !isValidDateValue(to)) { setValidationError('Please enter valid dates.'); return; }
        if (to < from) { setValidationError('To date must be on or after From date.'); return; }
        setValidationError(''); setLoading(true);
        router.get('/accounting/clearance/difference', { account_id: accountId, date_from: from, date_to: to }, { preserveState: false, preserveScroll: true, replace: true, onFinish: () => setLoading(false) });
    };

    const section = (titleText: string, headers: string[], rows: string[][]) => (
        <div className="rounded-2xl border bg-background p-5 shadow-sm"><h2 className="mb-3 text-lg font-bold">{titleText}</h2><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-muted/50"><tr>{headers.map((header) => <th key={header} className="border-b px-4 py-2 text-left font-semibold">{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-4 py-2 ${cellIndex >= 3 ? 'text-right tabular-nums' : ''}`}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-4 py-5 text-center text-muted-foreground">No records found.</td></tr>}</tbody></table></div></div>
    );

    return <>
        <Head title={title} />
        <div className="min-h-full bg-muted/20 p-4 md:p-6"><div className="mx-auto w-full max-w-[1500px] space-y-5">
            <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="text-sm text-muted-foreground">Accounting / Clearance Reports</div><h1 className="mt-1 text-2xl font-bold">Difference in Ledger Balance and Invoice Clearance</h1></div>
            <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_180px_180px_auto] lg:items-end">
                <label><span className="mb-1.5 block text-sm font-medium">Code / Account</span><AccountCombobox accounts={accounts} value={accountId} onChange={setAccountId} /></label>
                <label><span className="mb-1.5 block text-sm font-medium">From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11 w-full rounded-lg border px-3 text-sm" /></label>
                <label><span className="mb-1.5 block text-sm font-medium">To</span><input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} className="h-11 w-full rounded-lg border px-3 text-sm" /></label>
                <button type="button" disabled={!accountId || loading} onClick={load} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50"><RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />Preview</button>
            </div>
            {validationError && <div className="mt-2 text-sm font-medium text-destructive">{validationError}</div>}
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-4"><div className="text-sm text-muted-foreground">{dateText(date_from)} → {dateText(date_to)}{isDirty && account && <span className="ml-2 font-medium text-amber-600">Filter changes not previewed</span>}</div><div className="flex gap-2"><a target="_blank" rel="noopener noreferrer" href={`/accounting/clearance/difference/print?${loadedQuery}`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><Printer className="size-4"/>Print</a><a target="_blank" rel="noopener noreferrer" href={`/accounting/clearance/difference/pdf?${loadedQuery}`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><FileText className="size-4"/>PDF</a><a href={`/accounting/clearance/difference/excel?${loadedQuery}`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><FileSpreadsheet className="size-4"/>Excel</a></div></div></div>
            {account && <>
                <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="border-b pb-4"><div className="text-xs italic text-muted-foreground">Statement of,</div><div className="text-lg font-bold">{account.code} {account.name}</div></div><div className="mt-5 space-y-2 text-sm"><div className="flex max-w-xl justify-between border-b py-2"><span className="font-semibold">Ledger Balance</span><span className="font-semibold tabular-nums">{amountWithSide(ledger_balance, ledger_balance_side)}</span></div><div className="flex max-w-xl justify-between border-b py-2"><span className="font-semibold">Clearance Balance</span><span className="font-semibold tabular-nums">{amountWithSide(clearance_balance, clearance_balance_side)}</span></div><div className="flex max-w-xl justify-between border-b-2 py-2"><span className="font-bold">Difference</span><span className="font-bold tabular-nums">{amountWithSide(difference, difference_side)}</span></div></div></div>
                {section('Vouchers without Invoice Number', ['Date','VT','Voucher No','Debit','Credit'], vouchers_without_invoice.map((row) => [dateText(row.date), row.type, row.voucher_no, money(row.debit), money(row.credit)]))}
                {section('Refunds without Invoice Number', ['Date','VT','Refund No','Amount'], refunds_without_invoice.map((row) => [dateText(row.date), row.type, row.refund_no, money(row.amount)]))}
                {section('Pending Refunds', ['Date','VT','Refund No','Amount'], pending_refunds.map((row) => [dateText(row.date), row.type, row.refund_no, money(row.amount)]))}
            </>}
        </div></div>
    </>;
}
