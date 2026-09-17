import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Plus,
    Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type Account = {
    id: number;
    code: string;
    name: string;
    account_type_id?: number;
};

type Branch = {
    id: number;
    name: string;
    legacy_id: number | null;
};

type Department = {
    id: number;
    name: string;
    legacy_id: number | null;
};

type Currency = {
    code: string;
    name: string;
    rate?: number | string | null;
};

type InvoiceOption = {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    gross_amount: number;
    applied_amount: number;
    balance: number;
    status: 'Open' | 'Partial' | 'Paid';
    label: string;
    secondary: string;
    client_account_code?: string | null;
};

type VoucherPayload = {
    id: number | null;
    legacy_voucher_id: number | null;
    voucher_no: string;
    voucher_type: 'BR' | 'BP';
    voucher_date: string;
    ref_no: string;
    branch_id: number;
    department_id: number;
    cash_bank_account_id: number | null;
    combine_voucher: boolean;
    supervised: boolean;
};

type Line = {
    account_id: number | null;
    account_code: string;
    account_name: string;

    invoice_id: number | null;
    inv_no: string;
    invoice_label: string;
    invoice_balance: string;
    particulars: string;
    cheque_no: string;
    posting_date: string;

    currency_code: string;
    currency_quantity: string;
    currency_rate: string;
    legacy_master_id: number | null;

    amount: string;

    c: boolean;
    pa_ac: boolean;
};

type Props = {
    voucher: VoucherPayload;
    cashBankAccounts: Account[];
    accounts: Account[];
    branches: Branch[];
    departments: Department[];
    currencies?: Currency[];
    lines: Line[];
};

const FALLBACK_CURRENCIES: Currency[] = [
    {
        code: 'SAR',
        name: 'Saudi Riyal',
    },
    {
        code: 'USD',
        name: 'US Dollar',
    },
];


type SearchOption = {
    value: string;
    label: string;
    secondary?: string;
};

type SearchableSelectProps = {
    value: string;
    options: SearchOption[];
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
    inputAriaLabel?: string;
    emptyText?: string;
};

function SearchableSelect({
    value,
    options,
    onChange,
    placeholder,
    disabled = false,
    className = '',
    inputAriaLabel,
    emptyText = 'No matching options found.',
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selected = options.find(
        (option) => option.value === value,
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return options;
        }

        return options.filter((option) =>
            `${option.value} ${option.label} ${option.secondary ?? ''}`
                .toLowerCase()
                .includes(term),
        );
    }, [options, search]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;

            const clickedTrigger =
                wrapperRef.current?.contains(target);

            const clickedMenu =
                menuRef.current?.contains(target);

            if (!clickedTrigger && !clickedMenu) {
                setOpen(false);
                setSearch('');
            }
        };

        document.addEventListener(
            'mousedown',
            handlePointerDown,
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                handlePointerDown,
            );
    }, [open]);

    useEffect(() => {
        if (highlighted >= filtered.length) {
            setHighlighted(
                Math.max(filtered.length - 1, 0),
            );
        }
    }, [filtered.length, highlighted]);

    function updateMenuPosition() {
        const trigger = triggerRef.current;

        if (!trigger) {
            return;
        }

        setMenuRect(trigger.getBoundingClientRect());
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        updateMenuPosition();

        const handleViewportChange = () => {
            updateMenuPosition();
        };

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener(
            'scroll',
            handleViewportChange,
            true,
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleViewportChange,
            );
            window.removeEventListener(
                'scroll',
                handleViewportChange,
                true,
            );
        };
    }, [open]);

    function openWithSearch(initialSearch = '') {
        if (disabled) {
            return;
        }

        setSearch(initialSearch);
        setHighlighted(0);
        setOpen(true);
    }

    function choose(option: SearchOption) {
        onChange(option.value);
        setSearch('');
        setOpen(false);
    }

    function handleTriggerKeyDown(
        event: React.KeyboardEvent<HTMLButtonElement>,
    ) {
        if (disabled) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();

            if (!open) {
                openWithSearch();
                return;
            }

            setHighlighted((current) =>
                Math.min(
                    current + 1,
                    Math.max(filtered.length - 1, 0),
                ),
            );

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();

            if (!open) {
                openWithSearch();
                return;
            }

            setHighlighted((current) =>
                Math.max(current - 1, 0),
            );

            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            if (!open) {
                openWithSearch();
                return;
            }

            const option = filtered[highlighted];

            if (option) {
                choose(option);
            }

            return;
        }

        if (event.key === 'Escape') {
            if (open) {
                event.preventDefault();
                setOpen(false);
                setSearch('');
            }

            return;
        }

        if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
        ) {
            event.preventDefault();
            openWithSearch(event.key);
        }
    }

    function handleSearchKeyDown(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();

            setHighlighted((current) =>
                Math.min(
                    current + 1,
                    Math.max(filtered.length - 1, 0),
                ),
            );

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();

            setHighlighted((current) =>
                Math.max(current - 1, 0),
            );

            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            const option = filtered[highlighted];

            if (option) {
                choose(option);
            }

            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            setSearch('');
        }
    }

    return (
        <div
            ref={wrapperRef}
            className={`relative w-full ${className}`}
        >
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (open) {
                        setOpen(false);
                        setSearch('');
                    } else {
                        openWithSearch();
                    }
                }}
                onKeyDown={handleTriggerKeyDown}
                className="flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-2 text-left text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                aria-haspopup="listbox"
                aria-expanded={open}
                title={
                    selected
                        ? `${selected.value} — ${selected.label}`
                        : placeholder
                }
            >
                <span
                    className={
                        selected
                            ? 'truncate'
                            : 'truncate text-muted-foreground'
                    }
                >
                    {selected
                        ? `${selected.value} — ${selected.label}`
                        : placeholder}
                </span>

                <span className="shrink-0 text-xs text-muted-foreground">
                    ▾
                </span>
            </button>

            {open &&
                menuRect &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[9999] overflow-hidden rounded-lg border bg-background shadow-2xl"
                        style={{
                            left: Math.max(
                                8,
                                Math.min(
                                    menuRect.left,
                                    window.innerWidth - Math.max(
                                        menuRect.width,
                                        320,
                                    ) - 8,
                                ),
                            ),
                            top: Math.min(
                                menuRect.bottom + 4,
                                window.innerHeight - 340,
                            ),
                            width: Math.max(
                                menuRect.width,
                                320,
                            ),
                            maxWidth: 'calc(100vw - 16px)',
                        }}
                    >
                        <div className="border-b bg-background p-2">
                            <input
                                autoFocus
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setHighlighted(0);
                                }}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={`Search ${placeholder.toLowerCase()}...`}
                                aria-label={
                                    inputAriaLabel ??
                                    `Search ${placeholder}`
                                }
                                className="h-9 w-full rounded-md border bg-muted/20 px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div
                            className="max-h-64 overflow-y-auto p-1"
                            role="listbox"
                        >
                            {filtered.length === 0 ? (
                                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    {emptyText}
                                </div>
                            ) : (
                                filtered.map(
                                    (option, index) => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onClick={() =>
                                                choose(option)
                                            }
                                            className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                                                index ===
                                                highlighted
                                                    ? 'bg-muted'
                                                    : 'hover:bg-muted/70'
                                            }`}
                                            role="option"
                                            aria-selected={
                                                option.value ===
                                                value
                                            }
                                        >
                                            <div className="font-medium">
                                                {option.value} —{' '}
                                                {option.label}
                                            </div>

                                            {option.secondary && (
                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                    {
                                                        option.secondary
                                                    }
                                                </div>
                                            )}
                                        </button>
                                    ),
                                )
                            )}
                        </div>

                        <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
                            Type to search • ↑ ↓ navigate • Enter select
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

function emptyLine(): Line {
    return {
        account_id: null,
        account_code: '',
        account_name: '',

        invoice_id: null,
        inv_no: '',
        invoice_label: '',
        invoice_balance: '',
        particulars: '',
        cheque_no: '',
        posting_date: '',
        currency_code: '',
        currency_quantity: '',
        currency_rate: '',
        legacy_master_id: null,

        amount: '',

        c: false,
        pa_ac: false,
    };
}

function formatNumber(value: number) {
    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function VoucherForm({
    voucher,
    cashBankAccounts,
    accounts,
    branches,
    departments,
    currencies = [],
    lines: initialLines,
}: Props) {
    const editing = voucher.id !== null;

    const availableCurrencies = useMemo(
        () =>
            currencies.length > 0
                ? currencies
                : FALLBACK_CURRENCIES,
        [currencies],
    );

    const [invoiceOptionsByAccount, setInvoiceOptionsByAccount] =
        useState<Record<string, InvoiceOption[]>>({});
    const [loadingInvoicesForAccount, setLoadingInvoicesForAccount] =
        useState<Record<string, boolean>>({});
    const loadedInvoiceAccounts = useRef<Set<string>>(new Set());

    const { data, setData, post, put, processing, errors } =
        useForm({
            voucher_no: voucher.voucher_no,
            voucher_type: voucher.voucher_type,
            voucher_date: voucher.voucher_date || today(),
            ref_no: voucher.ref_no || '',
            branch_id: String(voucher.branch_id || ''),
            department_id: String(
                voucher.department_id || '',
            ),
            cash_bank_account_id:
                voucher.cash_bank_account_id
                    ? String(voucher.cash_bank_account_id)
                    : '',
            combine_voucher: voucher.combine_voucher,
            supervised: voucher.supervised,
            lines:
                initialLines.length > 0
                    ? initialLines.map((line) => ({
                          ...emptyLine(),
                          ...line,
                          invoice_id:
                              line.invoice_id ?? null,
                          inv_no:
                              line.inv_no ?? '',
                          invoice_label:
                              line.invoice_label ?? line.inv_no ?? '',
                          invoice_balance:
                              line.invoice_balance ?? '',
                          particulars:
                              line.particulars ?? '',
                          cheque_no:
                              line.cheque_no ?? '',
                          posting_date:
                              line.posting_date ?? '',
                          currency_code:
                              line.currency_code ?? '',
                          currency_quantity:
                              line.currency_quantity ?? '',
                          currency_rate:
                              line.currency_rate ?? '',
                          legacy_master_id:
                              line.legacy_master_id ??
                              null,
                          amount:
                              line.amount ?? '',
                          c: Boolean(line.c),
                          pa_ac: Boolean(line.pa_ac),
                      }))
                    : [emptyLine()],
        });

    const total = useMemo(
        () =>
            data.lines.reduce(
                (sum, line) =>
                    sum +
                    Math.max(
                        Number(line.amount) || 0,
                        0,
                    ),
                0,
            ),
        [data.lines],
    );

    const detailSide =
        data.voucher_type === 'BR'
            ? 'Credit'
            : 'Debit';

    const cashSide =
        data.voucher_type === 'BR'
            ? 'Debit'
            : 'Credit';

    function submit() {
        const options = {
            onError: () =>
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                }),
        };

        if (editing) {
            put(
                `/accounting/vouchers/${voucher.id}`,
                options,
            );
        } else {
            post(
                '/accounting/vouchers',
                options,
            );
        }
    }

    async function loadInvoicesForAccount(
        accountId: number,
        includeInvoiceId?: number | null,
        force = false,
    ) {
        const key = String(accountId);

        if (!force && loadedInvoiceAccounts.current.has(key)) {
            return;
        }

        loadedInvoiceAccounts.current.add(key);
        setLoadingInvoicesForAccount((current) => ({
            ...current,
            [key]: true,
        }));

        try {
            const params = new URLSearchParams({
                account_id: String(accountId),
                voucher_type: data.voucher_type,
            });

            if (editing && voucher.id !== null) {
                params.set('exclude_voucher_id', String(voucher.id));
            }

            if (includeInvoiceId) {
                params.set('include_invoice_id', String(includeInvoiceId));
            }

            const response = await fetch(
                `/accounting/vouchers/invoices?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Invoice request failed: ${response.status}`);
            }

            const payload = (await response.json()) as {
                invoices?: InvoiceOption[];
            };

            setInvoiceOptionsByAccount((current) => ({
                ...current,
                [key]: payload.invoices ?? [],
            }));
        } catch (error) {
            console.error(error);
            setInvoiceOptionsByAccount((current) => ({
                ...current,
                [key]: [],
            }));
        } finally {
            setLoadingInvoicesForAccount((current) => ({
                ...current,
                [key]: false,
            }));
        }
    }

    useEffect(() => {
        const accountIds = Array.from(
            new Set(
                data.lines
                    .map((line) => line.account_id)
                    .filter(
                        (accountId): accountId is number =>
                            accountId !== null,
                    ),
            ),
        );

        accountIds.forEach((accountId) => {
            const selected = data.lines.find(
                (line) =>
                    line.account_id === accountId &&
                    line.invoice_id !== null,
            );

            void loadInvoicesForAccount(
                accountId,
                selected?.invoice_id ?? null,
            );
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.lines.length]);

    function invoiceOptionsForLine(line: Line): InvoiceOption[] {
        if (!line.account_id) {
            return [];
        }

        const loaded =
            invoiceOptionsByAccount[String(line.account_id)] ?? [];

        if (
            line.invoice_id !== null &&
            !loaded.some((invoice) => invoice.id === line.invoice_id)
        ) {
            return [
                {
                    id: line.invoice_id,
                    invoice_number:
                        line.invoice_label ||
                        line.inv_no ||
                        `#${line.invoice_id}`,
                    invoice_date: '',
                    due_date: '',
                    gross_amount: 0,
                    applied_amount: 0,
                    balance: Number(line.invoice_balance) || 0,
                    status: 'Open',
                    label:
                        line.invoice_label ||
                        line.inv_no ||
                        `#${line.invoice_id}`,
                    secondary: line.invoice_balance
                        ? `Balance ${formatNumber(Number(line.invoice_balance))}`
                        : '',
                },
                ...loaded,
            ];
        }

        return loaded;
    }

    function updateLine(
        index: number,
        key: keyof Line,
        value:
            | string
            | number
            | boolean
            | null,
    ) {
        const next = [...data.lines];

        next[index] = {
            ...next[index],
            [key]: value,
        };

        if (key === 'account_id') {
            const account = accounts.find(
                (item) => item.id === Number(value),
            );

            next[index].account_code =
                account?.code ?? '';
            next[index].account_name =
                account?.name ?? '';
            next[index].invoice_id = null;
            next[index].inv_no = '';
            next[index].invoice_label = '';
            next[index].invoice_balance = '';

            if (value) {
                void loadInvoicesForAccount(
                    Number(value),
                    null,
                    true,
                );
            }
        }

        if (key === 'invoice_id') {
            const invoiceId = value
                ? Number(value)
                : null;
            const accountId = next[index].account_id
                ? Number(next[index].account_id)
                : null;

            next[index].invoice_id = invoiceId;

            if (invoiceId === null || accountId === null) {
                next[index].inv_no = '';
                next[index].invoice_label = '';
                next[index].invoice_balance = '';
            } else {
                const invoice = (
                    invoiceOptionsByAccount[String(accountId)] ?? []
                ).find(
                    (item) => item.id === invoiceId,
                );

                if (invoice) {
                    next[index].inv_no = invoice.invoice_number;
                    next[index].invoice_label = invoice.label;
                    next[index].invoice_balance =
                        invoice.balance.toFixed(2);

                    if (
                        Number(next[index].amount) <= 0 &&
                        invoice.balance > 0
                    ) {
                        next[index].amount =
                            invoice.balance.toFixed(2);
                    }
                }
            }
        }

        if (key === 'currency_code') {
            const currency = availableCurrencies.find(
                (item) => item.code === value,
            );

            if (
                currency?.rate !== null &&
                currency?.rate !== undefined &&
                currency?.rate !== ''
            ) {
                next[index].currency_rate = String(
                    currency.rate,
                );
            }

            if (!value) {
                next[index].currency_quantity = '';
                next[index].currency_rate = '';
            }
        }

        if (
            key === 'currency_quantity' ||
            key === 'currency_rate'
        ) {
            const quantity =
                Number(
                    next[index].currency_quantity,
                ) || 0;

            const rate =
                Number(
                    next[index].currency_rate,
                ) || 0;

            if (quantity > 0 && rate > 0) {
                next[index].amount =
                    (
                        quantity * rate
                    ).toFixed(2);
            }
        }

        setData('lines', next);
    }

    function addLine() {
        setData('lines', [
            ...data.lines,
            {
                ...emptyLine(),
                posting_date: data.voucher_date,
            },
        ]);
    }

    function removeLine(index: number) {
        if (data.lines.length === 1) {
            setData('lines', [
                {
                    ...emptyLine(),
                    posting_date:
                        data.voucher_date,
                },
            ]);
            return;
        }

        setData(
            'lines',
            data.lines.filter(
                (_, lineIndex) =>
                    lineIndex !== index,
            ),
        );
    }

    function applyVoucherDateToEmptyPostingDates() {
        const next = data.lines.map((line) =>
            line.posting_date
                ? line
                : {
                      ...line,
                      posting_date:
                          data.voucher_date,
                  },
        );

        setData('lines', next);
    }

    const selectedCashBank =
        cashBankAccounts.find(
            (account) =>
                account.id ===
                Number(
                    data.cash_bank_account_id,
                ),
        );

    return (
        <>
            <Head
                title={`${editing ? 'Edit' : 'New'} ${
                    data.voucher_type === 'BR'
                        ? 'Bank Receipt'
                        : 'Bank Payment'
                }`}
            />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Accounting</span>
                                <span>/</span>
                                <span>
                                    Receipts &amp; Payments
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {editing ? 'Edit' : 'New'}{' '}
                                {data.voucher_type === 'BR'
                                    ? 'Bank Receipt'
                                    : 'Bank Payment'}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {data.voucher_type ===
                                'BR'
                                    ? 'Record money received into cash or bank.'
                                    : 'Record money paid from cash or bank.'}
                            </p>

                            {editing &&
                                voucher.legacy_voucher_id !==
                                    null && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Legacy ID{' '}
                                        {
                                            voucher.legacy_voucher_id
                                        }
                                    </p>
                                )}
                        </div>

                        <Link
                            href="/accounting/vouchers"
                            className="inline-flex h-9 items-center gap-2 self-start rounded-lg border px-3 text-sm font-medium hover:bg-muted lg:self-auto"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Vouchers
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                        <div className="border-b p-4 md:p-5">
                            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Voucher Type
                                    </span>

                                    <select
                                        value={
                                            data.voucher_type
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'voucher_type',
                                                event.target
                                                    .value as
                                                    | 'BR'
                                                    | 'BP',
                                            )
                                        }
                                        disabled={editing}
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="BR">
                                            BR — Bank Receipt
                                        </option>
                                        <option value="BP">
                                            BP — Bank Payment
                                        </option>
                                    </select>
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {data.voucher_type ===
                                        'BR'
                                            ? 'Receipt No'
                                            : 'Payment No'}
                                    </span>

                                    <input
                                        value={
                                            data.voucher_no
                                        }
                                        readOnly
                                        className="h-10 w-full rounded-lg border bg-muted px-3 font-mono text-sm"
                                    />
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Voucher Date
                                    </span>

                                    <input
                                        type="date"
                                        value={
                                            data.voucher_date
                                        }
                                        onChange={(event) => {
                                            setData(
                                                'voucher_date',
                                                event.target
                                                    .value,
                                            );
                                            applyVoucherDateToEmptyPostingDates();
                                        }}
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />

                                    {errors.voucher_date && (
                                        <p className="text-xs text-destructive">
                                            {
                                                errors.voucher_date
                                            }
                                        </p>
                                    )}
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Reference No
                                    </span>

                                    <input
                                        value={
                                            data.ref_no
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'ref_no',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Optional"
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </label>

                                <label className="space-y-1.5 xl:col-span-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {data.voucher_type ===
                                        'BR'
                                            ? 'Cash / Bank (Dr)'
                                            : 'Cash / Bank (Cr)'}
                                    </span>

                                    <SearchableSelect
                                        value={
                                            data.cash_bank_account_id
                                        }
                                        onChange={(value) =>
                                            setData(
                                                'cash_bank_account_id',
                                                value,
                                            )
                                        }
                                        placeholder="Select cash / bank account"
                                        inputAriaLabel="Search cash or bank account"
                                        options={cashBankAccounts.map(
                                            (account) => ({
                                                value: String(
                                                    account.id,
                                                ),
                                                label: account.name,
                                                secondary:
                                                    account.code,
                                            }),
                                        )}
                                    />

                                    {errors.cash_bank_account_id && (
                                        <p className="text-xs text-destructive">
                                            {
                                                errors.cash_bank_account_id
                                            }
                                        </p>
                                    )}
                                </label>

                                <label className="flex items-end gap-3 pb-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={data.combine_voucher}
                                        onChange={(event) =>
                                            setData(
                                                'combine_voucher',
                                                event.target.checked,
                                            )
                                        }
                                        className="size-4"
                                    />
                                    <span>
                                        <span className="block font-medium">
                                            Combine
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            Multi-line voucher
                                        </span>
                                    </span>
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Branch
                                    </span>

                                    <select
                                        value={
                                            data.branch_id
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'branch_id',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {branches.map(
                                            (branch) => (
                                                <option
                                                    key={
                                                        branch.id
                                                    }
                                                    value={
                                                        branch.id
                                                    }
                                                >
                                                    {
                                                        branch.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Department
                                    </span>

                                    <select
                                        value={
                                            data.department_id
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'department_id',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {departments.map(
                                            (
                                                department,
                                            ) => (
                                                <option
                                                    key={
                                                        department.id
                                                    }
                                                    value={
                                                        department.id
                                                    }
                                                >
                                                    {
                                                        department.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>

                                <div className="flex items-end gap-5 pb-2 text-sm">
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                data.supervised
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setData(
                                                    'supervised',
                                                    event.target
                                                        .checked,
                                                )
                                            }
                                            className="size-4"
                                        />
                                        Supervise
                                    </label>

                                    <span className="text-xs text-muted-foreground">
                                        {cashSide}{' '}
                                        cash/bank •{' '}
                                        {detailSide}{' '}
                                        detail
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-5">
                            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-semibold">
                                        {data.voucher_type ===
                                        'BR'
                                            ? 'Receipt Details'
                                            : 'Payment Details'}
                                    </h2>

                                    <p className="text-xs text-muted-foreground">
                                        {data.voucher_type ===
                                        'BR'
                                            ? 'Cash / bank is debited and the party account is credited.'
                                            : 'The party account is debited and cash / bank is credited.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {data.combine_voucher && (
                                        <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                            Combined
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={addLine}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                    >
                                        <Plus className="size-4" />
                                        Add Line
                                    </button>
                                </div>
                            </div>

                            {errors.lines && (
                                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    {errors.lines}
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full min-w-[1750px] text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            <th className="w-[90px] px-3 py-3">
                                                Code
                                            </th>

                                            <th className="w-[290px] px-3 py-3">
                                                Account Name
                                            </th>

                                            <th className="w-[130px] px-3 py-3">
                                                Inv No
                                            </th>

                                            <th className="w-[310px] px-3 py-3">
                                                Particulars
                                            </th>

                                            <th className="w-[150px] px-3 py-3">
                                                Cheque No
                                            </th>

                                            <th className="w-[120px] px-3 py-3">
                                                Posting Date
                                            </th>

                                            <th className="w-[120px] px-3 py-3">
                                                Currency
                                            </th>

                                            <th className="w-[110px] px-3 py-3 text-right">
                                                Qty
                                            </th>

                                            <th className="w-[110px] px-3 py-3 text-right">
                                                ROE / Rate
                                            </th>

                                            <th className="w-[150px] px-3 py-3 text-right">
                                                Amount
                                            </th>

                                            <th className="sticky right-[75px] z-20 w-[55px] bg-muted/30 px-2 py-3 text-center">
                                                C
                                            </th>

                                            <th className="sticky right-0 z-20 w-[75px] bg-muted/30 px-2 py-3 text-center">
                                                P.A/C
                                            </th>

                                            <th className="w-[48px] px-2 py-3" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {data.lines.map(
                                            (
                                                line,
                                                index,
                                            ) => (
                                                <tr
                                                    key={
                                                        index
                                                    }
                                                    className="border-b align-top last:border-0"
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="rounded-md bg-muted/30 px-2 py-2 font-mono text-xs">
                                                            {line.account_code ||
                                                                '—'}
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <SearchableSelect
                                                            value={
                                                                line.account_id
                                                                    ? String(
                                                                          line.account_id,
                                                                      )
                                                                    : ''
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'account_id',
                                                                    value
                                                                        ? Number(
                                                                              value,
                                                                          )
                                                                        : null,
                                                                )
                                                            }
                                                            placeholder="Select account / party"
                                                            inputAriaLabel="Search account or party"
                                                            options={accounts.map(
                                                                (
                                                                    account,
                                                                ) => ({
                                                                    value: String(
                                                                        account.id,
                                                                    ),
                                                                    label: account.name,
                                                                    secondary:
                                                                        account.code,
                                                                }),
                                                            )}
                                                        />

                                                        {errors[
                                                            `lines.${index}.account_id`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    errors[
                                                                        `lines.${index}.account_id`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <SearchableSelect
                                                            value={
                                                                line.invoice_id !== null
                                                                    ? String(line.invoice_id)
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                updateLine(
                                                                    index,
                                                                    'invoice_id',
                                                                    value ? Number(value) : null,
                                                                )
                                                            }
                                                            placeholder={
                                                                line.account_id
                                                                    ? 'Select invoice'
                                                                    : 'Select account first'
                                                            }
                                                            inputAriaLabel="Search invoice"
                                                            emptyText={
                                                                line.account_id
                                                                    ? 'No open invoices for this account.'
                                                                    : 'Select an account first.'
                                                            }
                                                            options={invoiceOptionsForLine(line).map(
                                                                (invoice) => ({
                                                                    value: String(invoice.id),
                                                                    label: invoice.label,
                                                                    secondary: invoice.secondary,
                                                                }),
                                                            )}
                                                            disabled={!line.account_id}
                                                        />

                                                        {line.invoice_id !== null &&
                                                            line.invoice_balance !== '' && (
                                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                                    Balance:{' '}
                                                                    {formatNumber(
                                                                        Number(line.invoice_balance),
                                                                    )}
                                                                </div>
                                                            )}

                                                        {loadingInvoicesForAccount[
                                                            String(line.account_id ?? '')
                                                        ] && (
                                                            <div className="mt-1 text-[10px] text-muted-foreground">
                                                                Loading invoices…
                                                            </div>
                                                        )}

                                                        {errors[
                                                            `lines.${index}.invoice_id`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    errors[
                                                                        `lines.${index}.invoice_id`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            value={
                                                                line.particulars
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'particulars',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Particulars"
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                        />

                                                        <p className="mt-1 text-[10px] text-muted-foreground">
                                                            Account /
                                                            party
                                                            description
                                                        </p>
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            value={
                                                                line.cheque_no
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'cheque_no',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Cheque No"
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="date"
                                                            value={
                                                                line.posting_date ||
                                                                data.voucher_date
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'posting_date',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={
                                                                line.currency_code
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'currency_code',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                        >
                                                            <option value="">
                                                                Base
                                                            </option>

                                                            {availableCurrencies.map(
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
                                                                        }{' '}
                                                                        —{' '}
                                                                        {
                                                                            currency.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>

                                                        {errors[
                                                            `lines.${index}.currency_code`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    errors[
                                                                        `lines.${index}.currency_code`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.0001"
                                                            value={
                                                                line.currency_quantity
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'currency_quantity',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Qty"
                                                            disabled={
                                                                !line.currency_code
                                                            }
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-right text-sm tabular-nums outline-none disabled:bg-muted focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.000001"
                                                            value={
                                                                line.currency_rate
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'currency_rate',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="ROE"
                                                            disabled={
                                                                !line.currency_code
                                                            }
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-right text-sm tabular-nums outline-none disabled:bg-muted focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                line.amount
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateLine(
                                                                    index,
                                                                    'amount',
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            readOnly={
                                                                Boolean(
                                                                    line.currency_code,
                                                                )
                                                            }
                                                            placeholder="0.00"
                                                            className="h-9 w-full rounded-md border bg-background px-2 text-right text-sm font-medium tabular-nums outline-none read-only:bg-muted focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>

                                                    <td className="sticky right-[75px] z-10 bg-background px-2 py-2 text-center">
                                                        <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    line.c
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateLine(
                                                                        index,
                                                                        'c',
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                    )
                                                                }
                                                                className="size-4"
                                                            />
                                                        </label>
                                                    </td>

                                                    <td className="sticky right-0 z-10 bg-background px-2 py-2 text-center">
                                                        <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    line.pa_ac
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateLine(
                                                                        index,
                                                                        'pa_ac',
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                    )
                                                                }
                                                                className="size-4"
                                                            />
                                                        </label>
                                                    </td>

                                                    <td className="px-2 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeLine(
                                                                    index,
                                                                )
                                                            }
                                                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            title="Remove line"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>

                                    <tfoot>
                                        <tr className="bg-muted/30 font-semibold">
                                            <td
                                                colSpan={9}
                                                className="px-3 py-3 text-right"
                                            >
                                                Total{' '}
                                                {detailSide}
                                            </td>

                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatNumber(
                                                    total,
                                                )}
                                            </td>

                                            <td
                                                colSpan={3}
                                            />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <div className="text-xs text-muted-foreground">
                                        {cashSide}
                                    </div>

                                    <div className="mt-1 text-lg font-semibold tabular-nums">
                                        {formatNumber(
                                            total,
                                        )}
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {selectedCashBank
                                            ? `${selectedCashBank.code} — ${selectedCashBank.name}`
                                            : 'Select a cash/bank account'}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <div className="text-xs text-muted-foreground">
                                        {detailSide}
                                    </div>

                                    <div className="mt-1 text-lg font-semibold tabular-nums">
                                        {formatNumber(
                                            total,
                                        )}
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {data.lines.length}{' '}
                                        detail line
                                        {data.lines.length ===
                                        1
                                            ? ''
                                            : 's'}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="size-4" />
                                        Balance
                                    </div>

                                    <div className="mt-1 text-lg font-semibold">
                                        Balanced
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Debit = Credit
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    {data.voucher_type ===
                                    'BR'
                                        ? 'Receipt: cash/bank debit, detail accounts credit.'
                                        : 'Payment: detail accounts debit, cash/bank credit.'}
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <Link
                                        href="/accounting/vouchers"
                                        className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                                    >
                                        Cancel
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={
                                            processing ||
                                            total <= 0 ||
                                            !data.cash_bank_account_id ||
                                            data.lines.some(
                                                (
                                                    line,
                                                ) =>
                                                    !line.account_id ||
                                                    Number(
                                                        line.amount,
                                                    ) <= 0,
                                            )
                                        }
                                        className="inline-flex h-10 items-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : editing
                                              ? 'Update Voucher'
                                              : 'Save Voucher'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
