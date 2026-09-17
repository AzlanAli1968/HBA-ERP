import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import {
    createPortal,
} from 'react-dom';
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
    account_type_id?: number | null;
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
};

type Voucher = {
    id: number | null;
    legacy_voucher_id: number | null;
    voucher_no: string;
    voucher_type: 'JV';
    voucher_date: string;
    ref_no: string;
    branch_id: number | null;
    department_id: number | null;
    combine_voucher: boolean;
    supervised: boolean;
};

type InvoiceOption = {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    gross_amount: number;
    applied_amount: number;
    balance: number;
    status:
        | 'Open'
        | 'Partial'
        | 'Paid';
    label: string;
    secondary: string;
};

type CurrencySide =
    | 'debit'
    | 'credit';

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
    currency_side: CurrencySide;

    debit: string;
    credit: string;

    c: boolean;
    legacy_master_id: number | null;
};

type Props = {
    voucher: Voucher;
    accounts: Account[];
    branches: Branch[];
    departments: Department[];
    currencies?: Currency[];
    lines: Line[];
};

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
    inputAriaLabel?: string;
    emptyText?: string;
};

function SearchableSelect({
    value,
    options,
    onChange,
    placeholder,
    disabled = false,
    inputAriaLabel,
    emptyText = 'No matching results.',
}: SearchableSelectProps) {
    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        highlighted,
        setHighlighted,
    ] = useState(0);

    const [
        menuRect,
        setMenuRect,
    ] = useState<DOMRect | null>(null);

    const wrapperRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    const triggerRef =
        useRef<HTMLButtonElement | null>(
            null,
        );

    const menuRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    const selected =
        options.find(
            (option) =>
                option.value === value,
        );

    const filtered =
        useMemo(() => {
            const term =
                search
                    .trim()
                    .toLowerCase();

            if (!term) {
                return options;
            }

            return options.filter(
                (option) =>
                    `${option.value} ${option.label} ${option.secondary ?? ''}`
                        .toLowerCase()
                        .includes(term),
            );
        }, [
            options,
            search,
        ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (
            event: MouseEvent,
        ) => {
            const target =
                event.target as Node;

            const insideTrigger =
                wrapperRef.current?.contains(
                    target,
                );

            const insideMenu =
                menuRef.current?.contains(
                    target,
                );

            if (
                !insideTrigger &&
                !insideMenu
            ) {
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
        if (
            highlighted >=
            filtered.length
        ) {
            setHighlighted(
                Math.max(
                    filtered.length - 1,
                    0,
                ),
            );
        }
    }, [
        filtered.length,
        highlighted,
    ]);

    function updateMenuPosition() {
        const trigger =
            triggerRef.current;

        if (!trigger) {
            return;
        }

        setMenuRect(
            trigger.getBoundingClientRect(),
        );
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        updateMenuPosition();

        const update =
            () =>
                updateMenuPosition();

        window.addEventListener(
            'resize',
            update,
        );

        window.addEventListener(
            'scroll',
            update,
            true,
        );

        return () => {
            window.removeEventListener(
                'resize',
                update,
            );

            window.removeEventListener(
                'scroll',
                update,
                true,
            );
        };
    }, [open]);

    function openDropdown(
        initialSearch = '',
    ) {
        if (disabled) {
            return;
        }

        setSearch(
            initialSearch,
        );

        setHighlighted(0);

        setOpen(true);

        requestAnimationFrame(
            () => {
                updateMenuPosition();
            },
        );
    }

    function choose(
        option: SearchOption,
    ) {
        onChange(
            option.value,
        );

        setSearch('');

        setOpen(false);
    }

    function handleTriggerKeyDown(
        event: React.KeyboardEvent<HTMLButtonElement>,
    ) {
        if (disabled) {
            return;
        }

        if (
            event.key ===
            'ArrowDown'
        ) {
            event.preventDefault();

            if (!open) {
                openDropdown();
                return;
            }

            setHighlighted(
                (current) =>
                    Math.min(
                        current + 1,
                        Math.max(
                            filtered.length - 1,
                            0,
                        ),
                    ),
            );

            return;
        }

        if (
            event.key ===
            'ArrowUp'
        ) {
            event.preventDefault();

            if (!open) {
                openDropdown();
                return;
            }

            setHighlighted(
                (current) =>
                    Math.max(
                        current - 1,
                        0,
                    ),
            );

            return;
        }

        if (
            event.key ===
                'Enter' ||
            event.key ===
                ' '
        ) {
            event.preventDefault();

            if (!open) {
                openDropdown();
                return;
            }

            const option =
                filtered[
                    highlighted
                ];

            if (option) {
                choose(option);
            }

            return;
        }

        if (
            event.key ===
            'Escape'
        ) {
            if (open) {
                event.preventDefault();

                setOpen(false);
                setSearch('');
            }

            return;
        }

        /*
         * Typing any letter while the selector
         * is focused immediately starts a search.
         */
        if (
            event.key.length ===
                1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
        ) {
            event.preventDefault();

            openDropdown(
                event.key,
            );
        }
    }

    function handleSearchKeyDown(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        if (
            event.key ===
            'ArrowDown'
        ) {
            event.preventDefault();

            setHighlighted(
                (current) =>
                    Math.min(
                        current + 1,
                        Math.max(
                            filtered.length - 1,
                            0,
                        ),
                    ),
            );

            return;
        }

        if (
            event.key ===
            'ArrowUp'
        ) {
            event.preventDefault();

            setHighlighted(
                (current) =>
                    Math.max(
                        current - 1,
                        0,
                    ),
            );

            return;
        }

        if (
            event.key ===
            'Enter'
        ) {
            event.preventDefault();

            const option =
                filtered[
                    highlighted
                ];

            if (option) {
                choose(option);
            }

            return;
        }

        if (
            event.key ===
            'Escape'
        ) {
            event.preventDefault();

            setOpen(false);
            setSearch('');
        }
    }

    const menuWidth =
        Math.max(
            menuRect?.width ?? 0,
            320,
        );

    const menuHeight =
        360;

    const openAbove =
        menuRect
            ? (
                  window.innerHeight -
                      menuRect.bottom <
                      menuHeight &&
                  menuRect.top >
                      menuHeight
              )
            : false;

    const menuTop =
        menuRect
            ? (
                  openAbove
                      ? Math.max(
                            8,
                            menuRect.top -
                                menuHeight -
                                4,
                        )
                      : Math.min(
                            window.innerHeight -
                                menuHeight -
                                8,
                            menuRect.bottom +
                                4,
                        )
              )
            : 0;

    const menuLeft =
        menuRect
            ? Math.max(
                  8,
                  Math.min(
                      menuRect.left,
                      window.innerWidth -
                          menuWidth -
                          8,
                  ),
              )
            : 0;

    return (
        <div
            ref={
                wrapperRef
            }
            className="relative w-full"
        >
            <button
                ref={
                    triggerRef
                }
                type="button"
                disabled={
                    disabled
                }
                onClick={() => {
                    if (open) {
                        setOpen(false);
                        setSearch('');
                    } else {
                        openDropdown();
                    }
                }}
                onKeyDown={
                    handleTriggerKeyDown
                }
                className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50"
                aria-haspopup="listbox"
                aria-expanded={
                    open
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
                        ? `${selected.label}${selected.secondary ? ` — ${selected.secondary}` : ''}`
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
                        ref={
                            menuRef
                        }
                        className="fixed z-[99999] overflow-hidden rounded-xl border bg-background shadow-2xl"
                        style={{
                            left:
                                menuLeft,
                            top:
                                menuTop,
                            width:
                                menuWidth,
                            maxWidth:
                                'calc(100vw - 16px)',
                        }}
                    >
                        <div className="border-b bg-background p-2">
                            <input
                                autoFocus
                                value={
                                    search
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    );

                                    setHighlighted(
                                        0,
                                    );
                                }}
                                onKeyDown={
                                    handleSearchKeyDown
                                }
                                placeholder={`Search ${placeholder.toLowerCase()}...`}
                                aria-label={
                                    inputAriaLabel ??
                                    `Search ${placeholder}`
                                }
                                className="h-10 w-full rounded-lg border bg-muted/20 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div
                            className="max-h-[280px] overflow-y-auto p-1"
                            role="listbox"
                        >
                            {filtered.length ===
                            0 ? (
                                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                    {
                                        emptyText
                                    }
                                </div>
                            ) : (
                                filtered.map(
                                    (
                                        option,
                                        index,
                                    ) => (
                                        <button
                                            type="button"
                                            key={
                                                option.value
                                            }
                                            onMouseDown={(
                                                event,
                                            ) =>
                                                event.preventDefault()
                                            }
                                            onClick={() =>
                                                choose(
                                                    option,
                                                )
                                            }
                                            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
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
                                                {
                                                    option.label
                                                }
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

const emptyLine = (
    date = '',
): Line => ({
    account_id: null,
    account_code: '',
    account_name: '',

    invoice_id: null,
    inv_no: '',
    invoice_label: '',
    invoice_balance: '',

    particulars: '',
    cheque_no: '',
    posting_date: date,

    currency_code: '',
    currency_quantity: '',
    currency_rate: '',
    currency_side: 'debit',

    debit: '',
    credit: '',

    c: false,
    legacy_master_id: null,
});

function formatAmount(
    value: number,
): string {
    return value.toLocaleString(
        'en-PK',
        {
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        },
    );
}

function today() {
    return new Date()
        .toISOString()
        .slice(
            0,
            10,
        );
}

export default function JournalVoucherForm({
    voucher,
    accounts,
    branches,
    departments,
    currencies = [],
    lines: initialLines,
}: Props) {
    const editing =
        voucher.id !== null;

    const currencyOptions =
        currencies.length > 0
            ? currencies
            : [
                  {
                      code: 'SAR',
                      name: 'Saudi Riyal',
                  },
                  {
                      code: 'USD',
                      name: 'US Dollar',
                  },
              ];

    const normalizedLines:
        Line[] =
        initialLines.length > 0
            ? initialLines.map(
                  (line) => ({
                      ...emptyLine(
                          voucher.voucher_date ||
                              today(),
                      ),
                      ...line,

                      invoice_id:
                          line.invoice_id ??
                          null,

                      inv_no:
                          line.inv_no ??
                          '',

                      invoice_label:
                          line.invoice_label ??
                          line.inv_no ??
                          '',

                      invoice_balance:
                          line.invoice_balance ??
                          '',

                      currency_code:
                          line.currency_code ??
                          '',

                      currency_quantity:
                          line.currency_quantity ??
                          '',

                      currency_rate:
                          line.currency_rate ??
                          '',

                      currency_side:
                          line.currency_side ===
                          'credit'
                              ? 'credit'
                              : 'debit',

                      debit:
                          line.debit ??
                          '',

                      credit:
                          line.credit ??
                          '',

                      posting_date:
                          line.posting_date ??
                          voucher.voucher_date ??
                          today(),
                  }),
              )
            : [
                  emptyLine(
                      voucher.voucher_date ||
                          today(),
                  ),
                  emptyLine(
                      voucher.voucher_date ||
                          today(),
                  ),
              ];

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
    } = useForm<{
        voucher_no: string;
        voucher_date: string;
        ref_no: string;
        branch_id: string;
        department_id: string;
        combine_voucher: boolean;
        supervised: boolean;
        lines: Line[];
    }>({
        voucher_no:
            voucher.voucher_no,

        voucher_date:
            voucher.voucher_date ||
            today(),

        ref_no:
            voucher.ref_no ||
            '',

        branch_id:
            voucher.branch_id !==
            null
                ? String(
                      voucher.branch_id,
                  )
                : '',

        department_id:
            voucher.department_id !==
            null
                ? String(
                      voucher.department_id,
                  )
                : '',

        combine_voucher:
            voucher.combine_voucher,

        supervised:
            voucher.supervised,

        lines:
            normalizedLines,
    });

    const [
        invoiceOptionsByAccount,
        setInvoiceOptionsByAccount,
    ] =
        useState<
            Record<
                string,
                InvoiceOption[]
            >
        >({});

    const [
        loadingInvoicesForAccount,
        setLoadingInvoicesForAccount,
    ] =
        useState<
            Record<
                string,
                boolean
            >
        >({});

    const loadedInvoiceAccounts =
        useRef<
            Set<string>
        >(
            new Set(),
        );

    const [
        currencySides,
        setCurrencySides,
    ] =
        useState<
            Record<
                number,
                CurrencySide
            >
        >(() => {
            const result:
                Record<
                    number,
                    CurrencySide
                > = {};

            normalizedLines.forEach(
                (
                    line,
                    index,
                ) => {
                    result[index] =
                        line.currency_side ===
                        'credit'
                            ? 'credit'
                            : 'debit';
                },
            );

            return result;
        });

    const totalDebit =
        useMemo(
            () =>
                data.lines.reduce(
                    (
                        total,
                        line,
                    ) =>
                        total +
                        Math.max(
                            Number(
                                line.debit,
                            ) ||
                                0,
                            0,
                        ),
                    0,
                ),
            [data.lines],
        );

    const totalCredit =
        useMemo(
            () =>
                data.lines.reduce(
                    (
                        total,
                        line,
                    ) =>
                        total +
                        Math.max(
                            Number(
                                line.credit,
                            ) ||
                                0,
                            0,
                        ),
                    0,
                ),
            [data.lines],
        );

    const difference =
        totalDebit -
        totalCredit;

    const balanced =
        Math.abs(
            difference,
        ) < 0.005;

    /*
     * -------------------------------------------------------------
     * INVOICES
     * -------------------------------------------------------------
     */

    async function loadInvoicesForAccount(
        accountId: number,
        includeInvoiceId:
            | number
            | null = null,
        force = false,
    ) {
        const key =
            String(accountId);

        if (
            !force &&
            loadedInvoiceAccounts.current.has(
                key,
            )
        ) {
            return;
        }

        setLoadingInvoicesForAccount(
            (current) => ({
                ...current,
                [key]: true,
            }),
        );

        try {
            const params =
                new URLSearchParams();

            params.set(
                'account_id',
                String(
                    accountId,
                ),
            );

            if (
                editing &&
                voucher.id !==
                    null
            ) {
                params.set(
                    'exclude_voucher_id',
                    String(
                        voucher.id,
                    ),
                );
            }

            if (
                includeInvoiceId !==
                null
            ) {
                params.set(
                    'include_invoice_id',
                    String(
                        includeInvoiceId,
                    ),
                );
            }

            const response =
                await fetch(
                    `/accounting/journal-vouchers/invoices?${params.toString()}`,
                    {
                        headers: {
                            Accept:
                                'application/json',

                            'X-Requested-With':
                                'XMLHttpRequest',
                        },
                    },
                );

            if (
                !response.ok
            ) {
                throw new Error(
                    `Invoice request failed: ${response.status}`,
                );
            }

            const payload =
                (await response.json()) as {
                    invoices?: InvoiceOption[];
                };

            setInvoiceOptionsByAccount(
                (
                    current,
                ) => ({
                    ...current,

                    [key]:
                        payload.invoices ??
                        [],
                }),
            );

            loadedInvoiceAccounts.current.add(
                key,
            );
        } catch (
            error
        ) {
            console.error(
                error,
            );

            setInvoiceOptionsByAccount(
                (
                    current,
                ) => ({
                    ...current,
                    [key]: [],
                }),
            );
        } finally {
            setLoadingInvoicesForAccount(
                (
                    current,
                ) => ({
                    ...current,

                    [key]: false,
                }),
            );
        }
    }

    useEffect(
        () => {
            const accountIds =
                Array.from(
                    new Set(
                        data.lines
                            .map(
                                (
                                    line,
                                ) =>
                                    line.account_id,
                            )
                            .filter(
                                (
                                    id,
                                ): id is number =>
                                    id !==
                                    null,
                            ),
                    ),
                );

            accountIds.forEach(
                (
                    accountId,
                ) => {
                    const selected =
                        data.lines.find(
                            (
                                line,
                            ) =>
                                line.account_id ===
                                    accountId &&
                                line.invoice_id !==
                                    null,
                        );

                    void loadInvoicesForAccount(
                        accountId,
                        selected?.invoice_id ??
                            null,
                    );
                },
            );
        },
        [],
    );

    function invoiceOptionsForLine(
        line: Line,
    ): InvoiceOption[] {
        if (
            line.account_id ===
            null
        ) {
            return [];
        }

        const loaded =
            invoiceOptionsByAccount[
                String(
                    line.account_id,
                )
            ] ?? [];

        /*
         * When editing a voucher, make absolutely sure that
         * the currently selected invoice remains visible.
         */
        if (
            line.invoice_id !==
                null &&
            !loaded.some(
                (
                    invoice,
                ) =>
                    invoice.id ===
                    line.invoice_id,
            )
        ) {
            const currentInvoice: InvoiceOption =
                {
                    id:
                        line.invoice_id,

                    invoice_number:
                        line.invoice_label ||
                        (
                            line.inv_no
                                ? `INV #${line.inv_no}`
                                : `INV #${line.invoice_id}`
                        ),

                    invoice_date:
                        '',

                    due_date:
                        '',

                    gross_amount:
                        0,

                    applied_amount:
                        0,

                    balance:
                        Number(
                            line.invoice_balance,
                        ) ||
                        0,

                    status:
                        'Open',

                    label:
                        line.invoice_label ||
                        (
                            line.inv_no
                                ? `INV #${line.inv_no}`
                                : `INV #${line.invoice_id}`
                        ),

                    secondary:
                        line.invoice_balance
                            ? `Balance ${formatAmount(
                                  Number(
                                      line.invoice_balance,
                                  ),
                              )}`
                            : '',
                };

            return [
                currentInvoice,
                ...loaded,
            ];
        }

        return loaded;
    }

    /*
     * -------------------------------------------------------------
     * FOREIGN CURRENCY
     * -------------------------------------------------------------
     */

    function calculateForeignAmount(
        line: Line,
        side: CurrencySide,
    ): Line {
        if (
            !line.currency_code
        ) {
            return {
                ...line,
                currency_side:
                    side,
            };
        }

        const quantity =
            Number(
                line.currency_quantity,
            ) || 0;

        const rate =
            Number(
                line.currency_rate,
            ) || 0;

        if (
            quantity <= 0 ||
            rate <= 0
        ) {
            return {
                ...line,
                currency_side:
                    side,
            };
        }

        const calculated =
            (
                quantity *
                rate
            ).toFixed(2);

        if (
            side ===
            'credit'
        ) {
            return {
                ...line,
                currency_side:
                    'credit',
                debit: '',
                credit:
                    calculated,
            };
        }

        return {
            ...line,
            currency_side:
                'debit',
            debit:
                calculated,
            credit: '',
        };
    }

    /*
     * -------------------------------------------------------------
     * LINE UPDATE
     * -------------------------------------------------------------
     */

    function updateLine(
        index: number,
        key: keyof Line,
        value:
            | string
            | number
            | boolean
            | null,
    ) {
        const next =
            [
                ...data.lines,
            ];

        let line: Line =
            {
                ...next[index],
                [key]:
                    value,
            } as Line;

        if (
            key ===
            'account_id'
        ) {
            const account =
                accounts.find(
                    (
                        item,
                    ) =>
                        item.id ===
                        Number(
                            value,
                        ),
                );

            line = {
                ...line,

                account_code:
                    account?.code ??
                    '',

                account_name:
                    account?.name ??
                    '',

                invoice_id:
                    null,

                inv_no:
                    '',

                invoice_label:
                    '',

                invoice_balance:
                    '',
            };

            if (
                value
            ) {
                void loadInvoicesForAccount(
                    Number(
                        value,
                    ),
                    null,
                    true,
                );
            }
        }

        if (
            key ===
            'invoice_id'
        ) {
            const invoiceId =
                value
                    ? Number(
                          value,
                      )
                    : null;

            const accountId =
                line.account_id !==
                null
                    ? Number(
                          line.account_id,
                      )
                    : null;

            line.invoice_id =
                invoiceId;

            if (
                invoiceId ===
                    null ||
                accountId ===
                    null
            ) {
                line.inv_no =
                    '';

                line.invoice_label =
                    '';

                line.invoice_balance =
                    '';
            } else {
                const invoice =
                    (
                        invoiceOptionsByAccount[
                            String(
                                accountId,
                            )
                        ] ?? []
                    ).find(
                        (
                            item,
                        ) =>
                            item.id ===
                            invoiceId,
                    );

                if (
                    invoice
                ) {
                    line.inv_no =
                        invoice.invoice_number;

                    line.invoice_label =
                        invoice.label;

                    line.invoice_balance =
                        invoice.balance.toFixed(
                            2,
                        );
                }
            }
        }

        if (
            key ===
            'currency_code'
        ) {
            const code =
                String(
                    value ??
                        '',
                );

            if (
                code ===
                ''
            ) {
                line = {
                    ...line,

                    currency_code:
                        '',

                    currency_quantity:
                        '',

                    currency_rate:
                        '',
                };
            } else {
                line =
                    calculateForeignAmount(
                        {
                            ...line,
                            currency_code:
                                code,
                        },
                        currencySides[
                            index
                        ] ??
                            line.currency_side ??
                            'debit',
                    );
            }
        }

        if (
            key ===
                'currency_quantity' ||
            key ===
                'currency_rate'
        ) {
            line =
                calculateForeignAmount(
                    line,
                    currencySides[
                        index
                    ] ??
                        line.currency_side ??
                        'debit',
                );
        }

        next[index] =
            line;

        setData(
            'lines',
            next,
        );
    }

    function setDebit(
        index: number,
        value: string,
    ) {
        setCurrencySides(
            (
                current,
            ) => ({
                ...current,
                [index]:
                    'debit',
            }),
        );

        const next =
            [
                ...data.lines,
            ];

        let line: Line =
            {
                ...next[index],

                debit:
                    value,

                credit:
                    Number(
                        value,
                    ) > 0
                        ? ''
                        : next[index]
                              .credit,

                currency_side:
                    'debit',
            };

        if (
            line.currency_code &&
            Number(
                line.currency_quantity,
            ) > 0 &&
            Number(
                line.currency_rate,
            ) > 0
        ) {
            line =
                calculateForeignAmount(
                    line,
                    'debit',
                );
        }

        next[index] =
            line;

        setData(
            'lines',
            next,
        );
    }

    function setCredit(
        index: number,
        value: string,
    ) {
        setCurrencySides(
            (
                current,
            ) => ({
                ...current,
                [index]:
                    'credit',
            }),
        );

        const next =
            [
                ...data.lines,
            ];

        let line: Line =
            {
                ...next[index],

                credit:
                    value,

                debit:
                    Number(
                        value,
                    ) > 0
                        ? ''
                        : next[index]
                              .debit,

                currency_side:
                    'credit',
            };

        if (
            line.currency_code &&
            Number(
                line.currency_quantity,
            ) > 0 &&
            Number(
                line.currency_rate,
            ) > 0
        ) {
            line =
                calculateForeignAmount(
                    line,
                    'credit',
                );
        }

        next[index] =
            line;

        setData(
            'lines',
            next,
        );
    }

    function selectCurrencySide(
        index: number,
        side: CurrencySide,
    ) {
        setCurrencySides(
            (
                current,
            ) => ({
                ...current,
                [index]:
                    side,
            }),
        );

        const next =
            [
                ...data.lines,
            ];

        next[index] =
            calculateForeignAmount(
                {
                    ...next[index],
                    currency_side:
                        side,
                },
                side,
            );

        setData(
            'lines',
            next,
        );
    }

    function addLine() {
        setData(
            'lines',
            [
                ...data.lines,
                emptyLine(
                    data.voucher_date,
                ),
            ],
        );
    }

    function removeLine(
        index: number,
    ) {
        if (
            data.lines.length <=
            2
        ) {
            return;
        }

        setData(
            'lines',
            data.lines.filter(
                (
                    _,
                    lineIndex,
                ) =>
                    lineIndex !==
                    index,
            ),
        );
    }

    /*
     * -------------------------------------------------------------
     * SUBMIT
     * -------------------------------------------------------------
     */

    function submit() {
        if (
            data.lines.some(
                (
                    line,
                ) =>
                    !line.account_id,
            )
        ) {
            window.scrollTo(
                {
                    top: 0,
                    behavior:
                        'smooth',
                },
            );

            return;
        }

        if (
            data.lines.some(
                (
                    line,
                ) =>
                    line.currency_code &&
                    (
                        Number(
                            line.currency_quantity,
                        ) <= 0 ||
                        Number(
                            line.currency_rate,
                        ) <= 0
                    ),
            )
        ) {
            window.scrollTo(
                {
                    top: 0,
                    behavior:
                        'smooth',
                },
            );

            return;
        }

        if (
            !balanced
        ) {
            window.scrollTo(
                {
                    top:
                        document
                            .body
                            .scrollHeight,
                    behavior:
                        'smooth',
                },
            );

            return;
        }

        const options =
            {
                onError:
                    () =>
                        window.scrollTo(
                            {
                                top: 0,
                                behavior:
                                    'smooth',
                            },
                        ),
            };

        if (
            editing
        ) {
            put(
                `/accounting/journal-vouchers/${voucher.id}`,
                options,
            );
        } else {
            post(
                '/accounting/journal-vouchers',
                options,
            );
        }
    }

    return (
        <>
            <Head
                title={
                    editing
                        ? 'Edit Journal Voucher'
                        : 'New Journal Voucher'
                }
            />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1950px] p-4 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Accounting / Journal Vouchers
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                {editing
                                    ? 'Edit Journal Voucher'
                                    : 'New Journal Voucher'}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Balanced double-entry journal voucher.
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
                            href="/accounting/journal-vouchers/all"
                            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Journal Vouchers
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-background">
                        {/* HEADER */}
                        <div className="border-b p-4 md:p-5">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        JV No
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
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'voucher_date',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    />
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Ref No
                                    </span>

                                    <input
                                        value={
                                            data.ref_no
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'ref_no',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Optional"
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    />
                                </label>

                                <div className="flex items-end gap-3">
                                    <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={
                                                data.combine_voucher
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setData(
                                                    'combine_voucher',
                                                    event
                                                        .target
                                                        .checked,
                                                )
                                            }
                                        />

                                        <span className="font-medium">
                                            Combine
                                        </span>
                                    </label>

                                    <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
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
                                                    event
                                                        .target
                                                        .checked,
                                                )
                                            }
                                        />

                                        <span className="font-medium">
                                            Supervise
                                        </span>
                                    </label>
                                </div>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Branch
                                    </span>

                                    <select
                                        value={
                                            data.branch_id
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'branch_id',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        {branches.map(
                                            (
                                                branch,
                                            ) => (
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
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'department_id',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
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

                                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                                    <div className="text-xs text-muted-foreground">
                                        Voucher Type
                                    </div>

                                    <div className="mt-1 font-semibold">
                                        JV — Journal Voucher
                                    </div>
                                </div>

                                <div
                                    className={`rounded-lg border px-3 py-2 ${
                                        balanced
                                            ? 'bg-muted/20'
                                            : 'border-destructive/40 bg-destructive/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {balanced ? (
                                            <CheckCircle2 className="size-4" />
                                        ) : (
                                            <XCircle className="size-4 text-destructive" />
                                        )}

                                        Balance
                                    </div>

                                    <div className="mt-1 font-semibold">
                                        {balanced
                                            ? 'Balanced'
                                            : 'Not Balanced'}
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Difference:{' '}
                                        {formatAmount(
                                            Math.abs(
                                                difference,
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DETAILS */}
                        <div className="p-4 md:p-5">
                            <div className="mb-4 flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Journal Details
                                    </h2>

                                    <p className="text-sm text-muted-foreground">
                                        Select an invoice when this journal line relates to a specific invoice.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        addLine
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                                >
                                    <Plus className="size-4" />
                                    Add Line
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full min-w-[2050px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <th className="w-10 px-2 py-3">
                                                #
                                            </th>

                                            <th className="w-[310px] px-2 py-3">
                                                Account
                                            </th>

                                            <th className="w-[190px] px-2 py-3">
                                                Inv No
                                            </th>

                                            <th className="min-w-[300px] px-2 py-3">
                                                Particulars
                                            </th>

                                            <th className="w-[150px] px-2 py-3">
                                                Cheque No
                                            </th>

                                            <th className="w-[145px] px-2 py-3">
                                                Posting Date
                                            </th>

                                            <th className="w-[120px] px-2 py-3">
                                                Currency
                                            </th>

                                            <th className="w-[120px] px-2 py-3">
                                                Qty
                                            </th>

                                            <th className="w-[120px] px-2 py-3">
                                                ROE / Rate
                                            </th>

                                            <th className="w-[150px] px-2 py-3 text-right">
                                                Debit
                                            </th>

                                            <th className="w-[150px] px-2 py-3 text-right">
                                                Credit
                                            </th>

                                            <th className="w-[110px] px-2 py-3 text-center">
                                                FX Side
                                            </th>

                                            <th className="w-14 px-2 py-3 text-center">
                                                C
                                            </th>

                                            <th className="w-12 px-2 py-3" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {data.lines.map(
                                            (
                                                line,
                                                index,
                                            ) => {
                                                const side =
                                                    currencySides[
                                                        index
                                                    ] ??
                                                    line.currency_side ??
                                                    'debit';

                                                const isForeign =
                                                    Boolean(
                                                        line.currency_code,
                                                    );

                                                const invoiceOptions =
                                                    invoiceOptionsForLine(
                                                        line,
                                                    );

                                                const loadingInvoices =
                                                    loadingInvoicesForAccount[
                                                        String(
                                                            line.account_id ??
                                                                '',
                                                        )
                                                    ] ??
                                                    false;

                                                return (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                        className="border-b align-top last:border-0"
                                                    >
                                                        <td className="px-2 py-2 text-center text-xs text-muted-foreground">
                                                            {index +
                                                                1}
                                                        </td>

                                                        {/* ACCOUNT */}
                                                        <td className="px-2 py-2">
                                                            <SearchableSelect
                                                                value={
                                                                    line.account_id !==
                                                                    null
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
                                                                placeholder="Select account"
                                                                inputAriaLabel="Search account"
                                                                options={accounts.map(
                                                                    (
                                                                        account,
                                                                    ) => ({
                                                                        value: String(
                                                                            account.id,
                                                                        ),
                                                                        label:
                                                                            account.code,

                                                                        secondary:
                                                                            account.name,
                                                                    }),
                                                                )}
                                                                emptyText="No matching accounts found."
                                                            />
                                                        </td>

                                                        {/* INVOICE */}
                                                        <td className="px-2 py-2">
                                                            <SearchableSelect
                                                                value={
                                                                    line.invoice_id !==
                                                                    null
                                                                        ? String(
                                                                              line.invoice_id,
                                                                          )
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    updateLine(
                                                                        index,
                                                                        'invoice_id',
                                                                        value
                                                                            ? Number(
                                                                                  value,
                                                                              )
                                                                            : null,
                                                                    )
                                                                }
                                                                placeholder={
                                                                    line.account_id
                                                                        ? 'Select invoice'
                                                                        : 'Select account first'
                                                                }
                                                                inputAriaLabel="Search invoice"
                                                                disabled={
                                                                    !line.account_id
                                                                }
                                                                emptyText={
                                                                    line.account_id
                                                                        ? 'No open invoices for this account.'
                                                                        : 'Select an account first.'
                                                                }
                                                                options={invoiceOptions.map(
                                                                    (
                                                                        invoice,
                                                                    ) => ({
                                                                        value: String(
                                                                            invoice.id,
                                                                        ),

                                                                        label:
                                                                            invoice.invoice_number,

                                                                        secondary:
                                                                            invoice.secondary,
                                                                    }),
                                                                )}
                                                            />

                                                            {loadingInvoices && (
                                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                                    Loading invoices…
                                                                </div>
                                                            )}

                                                            {line.invoice_id !==
                                                                null &&
                                                                line.invoice_balance !==
                                                                    '' && (
                                                                    <div className="mt-1 text-[10px] text-muted-foreground">
                                                                        Outstanding:{' '}
                                                                        <span className="font-medium">
                                                                            {formatAmount(
                                                                                Number(
                                                                                    line.invoice_balance,
                                                                                ),
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                            {!line.account_id && (
                                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                                    Select the account to load its invoices.
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

                                                        {/* PARTICULARS */}
                                                        <td className="px-2 py-2">
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
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                                            />

                                                            {line.invoice_id !==
                                                                null && (
                                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                                    Linked to{' '}
                                                                    {
                                                                        line.invoice_label
                                                                    }
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* CHEQUE */}
                                                        <td className="px-2 py-2">
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
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                                            />
                                                        </td>

                                                        {/* POSTING DATE */}
                                                        <td className="px-2 py-2">
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
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                                            />
                                                        </td>

                                                        {/* CURRENCY */}
                                                        <td className="px-2 py-2">
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
                                                                className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
                                                            >
                                                                <option value="">
                                                                    Base
                                                                </option>

                                                                {currencyOptions.map(
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
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </td>

                                                        {/* QTY */}
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                value={
                                                                    line.currency_quantity
                                                                }
                                                                disabled={
                                                                    !isForeign
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
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right text-sm tabular-nums disabled:bg-muted/50"
                                                            />
                                                        </td>

                                                        {/* RATE */}
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.000001"
                                                                value={
                                                                    line.currency_rate
                                                                }
                                                                disabled={
                                                                    !isForeign
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
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right text-sm tabular-nums disabled:bg-muted/50"
                                                            />
                                                        </td>

                                                        {/* DEBIT */}
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    line.debit
                                                                }
                                                                onFocus={() =>
                                                                    selectCurrencySide(
                                                                        index,
                                                                        'debit',
                                                                    )
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setDebit(
                                                                        index,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                readOnly={
                                                                    isForeign &&
                                                                    Number(
                                                                        line.currency_quantity,
                                                                    ) >
                                                                        0 &&
                                                                    Number(
                                                                        line.currency_rate,
                                                                    ) >
                                                                        0
                                                                }
                                                                placeholder="0.00"
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right text-sm tabular-nums read-only:bg-muted/40"
                                                            />
                                                        </td>

                                                        {/* CREDIT */}
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    line.credit
                                                                }
                                                                onFocus={() =>
                                                                    selectCurrencySide(
                                                                        index,
                                                                        'credit',
                                                                    )
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setCredit(
                                                                        index,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                readOnly={
                                                                    isForeign &&
                                                                    Number(
                                                                        line.currency_quantity,
                                                                    ) >
                                                                        0 &&
                                                                    Number(
                                                                        line.currency_rate,
                                                                    ) >
                                                                        0
                                                                }
                                                                placeholder="0.00"
                                                                className="h-10 w-full rounded-lg border bg-background px-3 text-right text-sm tabular-nums read-only:bg-muted/40"
                                                            />
                                                        </td>

                                                        {/* FX SIDE */}
                                                        <td className="px-2 py-2">
                                                            {isForeign ? (
                                                                <div className="flex h-10 overflow-hidden rounded-lg border">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            selectCurrencySide(
                                                                                index,
                                                                                'debit',
                                                                            )
                                                                        }
                                                                        className={
                                                                            side ===
                                                                            'debit'
                                                                                ? 'flex-1 bg-foreground px-2 text-xs font-semibold text-background'
                                                                                : 'flex-1 px-2 text-xs hover:bg-muted'
                                                                        }
                                                                    >
                                                                        Dr
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            selectCurrencySide(
                                                                                index,
                                                                                'credit',
                                                                            )
                                                                        }
                                                                        className={
                                                                            side ===
                                                                            'credit'
                                                                                ? 'flex-1 bg-foreground px-2 text-xs font-semibold text-background'
                                                                                : 'flex-1 px-2 text-xs hover:bg-muted'
                                                                        }
                                                                    >
                                                                        Cr
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-10 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                                                                    Base
                                                                </div>
                                                            )}

                                                            {isForeign &&
                                                                Number(
                                                                    line.currency_quantity,
                                                                ) >
                                                                    0 &&
                                                                Number(
                                                                    line.currency_rate,
                                                                ) >
                                                                    0 && (
                                                                    <div className="mt-1 text-center text-[10px] text-muted-foreground">
                                                                        {formatAmount(
                                                                            Number(
                                                                                line.currency_quantity,
                                                                            ),
                                                                        )}{' '}
                                                                        ×{' '}
                                                                        {formatAmount(
                                                                            Number(
                                                                                line.currency_rate,
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </td>

                                                        {/* C */}
                                                        <td className="px-2 py-2 text-center">
                                                            <label className="flex h-10 items-center justify-center">
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
                                                                />
                                                            </label>
                                                        </td>

                                                        {/* DELETE */}
                                                        <td className="px-2 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeLine(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={
                                                                    data.lines
                                                                        .length <=
                                                                    2
                                                                }
                                                                className="flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                                                                title="Remove line"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>

                                    <tfoot>
                                        <tr className="border-t bg-muted/20">
                                            <td
                                                colSpan={
                                                    9
                                                }
                                                className="px-3 py-4 text-right font-semibold"
                                            >
                                                Totals
                                            </td>

                                            <td className="px-2 py-4 text-right font-bold tabular-nums">
                                                {formatAmount(
                                                    totalDebit,
                                                )}
                                            </td>

                                            <td className="px-2 py-4 text-right font-bold tabular-nums">
                                                {formatAmount(
                                                    totalCredit,
                                                )}
                                            </td>

                                            <td
                                                colSpan={
                                                    4
                                                }
                                            />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl border p-4">
                                    <div className="text-xs text-muted-foreground">
                                        Total Debit
                                    </div>

                                    <div className="mt-1 text-2xl font-bold tabular-nums">
                                        {formatAmount(
                                            totalDebit,
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <div className="text-xs text-muted-foreground">
                                        Total Credit
                                    </div>

                                    <div className="mt-1 text-2xl font-bold tabular-nums">
                                        {formatAmount(
                                            totalCredit,
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={`rounded-xl border p-4 ${
                                        balanced
                                            ? 'bg-muted/10'
                                            : 'border-destructive/40 bg-destructive/5'
                                    }`}
                                >
                                    <div className="text-xs text-muted-foreground">
                                        Difference
                                    </div>

                                    <div className="mt-1 text-2xl font-bold tabular-nums">
                                        {formatAmount(
                                            Math.abs(
                                                difference,
                                            ),
                                        )}
                                    </div>

                                    <div className="mt-1 text-sm">
                                        {balanced
                                            ? 'Debit = Credit'
                                            : 'Debit and Credit must be equal'}
                                    </div>
                                </div>
                            </div>

                            {errors.lines && (
                                <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {
                                        errors.lines
                                    }
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-5">
                                <Link
                                    href="/accounting/journal-vouchers/all"
                                    className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="button"
                                    onClick={
                                        submit
                                    }
                                    disabled={
                                        processing ||
                                        !balanced
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : editing
                                          ? 'Update Journal Voucher'
                                          : 'Save Journal Voucher'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}