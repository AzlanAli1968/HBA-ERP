import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calculator,
    CalendarDays,
    Car,
    ChevronDown,
    CirclePlus,
    Copy,
    FileText,
    Hotel,
    MapPin,
    Percent,
    Plane,
    Plus,
    Save,
    Search,
    Trash2,
    UserRound,
    WalletCards,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Account = { id: number; code: string; name: string };
type SimpleOption = {
    id: number;
    name: string;
    [key: string]: unknown;
};

type Header = {
    id?: number;
    invoice_number?: string;
    invoice_date: string;
    ref_no: string;
    branch_id: number;
    department_id: number;
    client_account_id: number;
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
    mode: string;
    type: string;
    airline_code: string;
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
    vendor_amount: number;
    vendor_amount_2: number;
    vendor_amount_3: number;
    vendor_rate_per_night: number;
    receivable_amount: number;
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
    nights: number;
    rate: number;
    internal_ref_no: string;
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
    psf_amount: number;
    commission_receivable: number;
    commission_paid: number;
    commission_to_client: number;
    fare: number;
    sp_apt: number;
    sf_ftt: number;
    aq_pk_yr: number;
    fed_rg_cvt: number;
    ced: number;
    jo: number;
    wh_airlines: number;
    wh_client: number;
    yq: number;
    xut: number;
    other_tax: number;
    xz: number;
    yd: number;
    fare_including: number;
    taxes_including: number;
    pst_percentage: number;
    pst: number;
    pst_paid: number;
    fare_nc: number;
    currency_code: string;
    currency_quantity: number | null;
    currency_rate: number | null;
    agent_code: string;
    agent_amount: number;
    particulars_2: string;
    particulars_3: string;
};

type Master = {
    customers: Account[];
    vendors: Account[];
    income_accounts: Account[];
    branches: { id: number; name: string }[];
    departments: { id: number; name: string }[];
    employees: { id: number; name: string }[];
    currencies: { code: string; name: string; symbol: string; decimals: number }[];
    visa_types: string[];
    hotels: SimpleOption[];
    vehicles: SimpleOption[];
    transfer_locations: SimpleOption[];
    passengers: SimpleOption[];
    airlines: SimpleOption[];
};

type Props = {
    formMode: 'create' | 'edit';
    invoice: Header | null;
    lines: Line[];
    master: Master;
    modes: string[];
    statuses: string[];
};

function numberValue(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function money(value: number): string {
    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function hotelUnits(line: Partial<Line>): number {
    const nights = Math.max(numberValue(line.nights), 0);
    const rooms = Math.max(numberValue(line.room_quantity), 1);
    return nights * rooms;
}

function hotelSellingTotal(line: Partial<Line>): number {
    return numberValue(line.rate) * hotelUnits(line);
}

function hotelVendorTotal(line: Partial<Line>): number {
    return (
        numberValue(line.vendor_rate_per_night) * hotelUnits(line) +
        numberValue(line.vendor_amount_2) +
        numberValue(line.vendor_amount_3)
    );
}

function transferSellingTotal(line: Partial<Line>): number {
    const quantity = Math.max(numberValue(line.quantity), 1);
    const rate = numberValue(line.rate);
    if (rate > 0) {
        return rate * quantity;
    }
    return Math.max(
        numberValue(line.receivable_amount) - numberValue(line.agent_amount),
        0,
    );
}

function ticketBaseSale(line: Partial<Line>): number {
    return Math.max(
        numberValue(line.receivable_amount) - numberValue(line.agent_amount),
        0,
    );
}

function otherBaseSale(line: Partial<Line>): number {
    const quantity = Math.max(numberValue(line.quantity), 1);
    const rate = Math.max(numberValue(line.rate), 0);

    if (rate > 0) {
        return rate * quantity;
    }

    return Math.max(
        numberValue(line.receivable_amount) - numberValue(line.agent_amount),
        0,
    );
}

function ticketTaxTotal(line: Partial<Line>): number {
    return (
        numberValue(line.sp_apt) +
        numberValue(line.sf_ftt) +
        numberValue(line.aq_pk_yr) +
        numberValue(line.fed_rg_cvt) +
        numberValue(line.ced) +
        numberValue(line.jo) +
        numberValue(line.wh_airlines) +
        numberValue(line.wh_client) +
        numberValue(line.yq) +
        numberValue(line.xut) +
        numberValue(line.xz) +
        numberValue(line.yd) +
        numberValue(line.other_tax)
    );
}

function lineReceivable(line: Partial<Line>): number {
    const agent = Math.max(numberValue(line.agent_amount), 0);

    if (line.mode === 'Hotel') {
        return hotelSellingTotal(line) + agent;
    }

    if (line.mode === 'Transfer') {
        const quantity = Math.max(numberValue(line.quantity), 1);
        const rate = Math.max(numberValue(line.rate), 0);
        const baseSale =
            rate > 0
                ? rate * quantity
                : Math.max(
                      numberValue(line.receivable_amount) - numberValue(line.agent_amount),
                      0,
                  );

        return baseSale + agent;
    }

    if (line.mode === 'Ticket') {
        return ticketBaseSale(line) + agent;
    }

    if (line.mode === 'Other') {
        return otherBaseSale(line) + agent;
    }

    if (line.mode === 'Visa') {
        const quantity = Math.max(numberValue(line.quantity), 1);
        const rate = Math.max(numberValue(line.rate), 0);
        const baseSale =
            rate > 0
                ? rate * quantity
                : Math.max(
                      numberValue(line.receivable_amount) - numberValue(line.agent_amount),
                      0,
                  );

        return baseSale + agent;
    }

    return numberValue(line.receivable_amount);
}

function linePayable(line: Partial<Line>): number {
    const vendorTotal =
        line.mode === 'Hotel'
            ? hotelVendorTotal(line)
            : numberValue(line.vendor_amount) +
              numberValue(line.vendor_amount_2) +
              numberValue(line.vendor_amount_3);

    return vendorTotal + Math.max(numberValue(line.agent_amount), 0);
}

function lineProfit(line: Partial<Line>): number {
    if (line.mode === 'Hotel') {
        return hotelSellingTotal(line) - hotelVendorTotal(line);
    }
    if (line.mode === 'Transfer') {
        return transferSellingTotal(line) - linePayable(line);
    }
    if (line.mode === 'Ticket') {
        // Ticket agent amount is an extra customer-side charge and a
        // separate commission posting, so it is excluded from service profit.
        return ticketBaseSale(line) - linePayable(line);
    }
    if (line.mode === 'Other') {
        // Other services use the same optional customer-side agent commission
        // model as Ticket: base sale + agent = gross receivable.
        return otherBaseSale(line) - linePayable(line);
    }
    return lineReceivable(line) - linePayable(line);
}

function blankHeader(master: Master, invoice: Header | null): Header {
    if (invoice) return invoice;

    return {
        invoice_date: new Date().toISOString().slice(0, 10),
        ref_no: '',
        branch_id: master.branches[0]?.id ?? 0,
        department_id: master.departments[0]?.id ?? 0,
        client_account_id: master.customers[0]?.id ?? 0,
        payment_terms: '',
        employee: '',
        sales_tax_invoice_no: '',
        due_date: new Date().toISOString().slice(0, 10),
        due_date_vendor: new Date().toISOString().slice(0, 10),
        supervised: false,
        ticket_query_id: '',
        umrah_query_id: '',
        active: true,
        status: 'Definite / Non Refundable',
        remarks: '',
    };
}

const labelClass = 'text-xs font-medium text-muted-foreground';
const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring';
const selectClass = inputClass;

function Field({
    label,
    children,
    className = '',
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={`block space-y-1.5 ${className}`}>
            <span className={labelClass}>{label}</span>
            {children}
        </label>
    );
}

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-background">
            <div className="flex items-center gap-2 border-b px-4 py-3">
                {icon}
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}


type SearchOption = {
    value: string;
    label: string;
    subtitle?: string;
    keywords?: string;
};

type ModalKind = 'hotel' | 'visa' | 'vehicle' | 'transfer-location' | null;

function SearchableSelect({
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder = 'Search...',
}: {
    value: string;
    onChange: (value: string) => void;
    options: SearchOption[];
    placeholder: string;
    searchPlaceholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const selected = options.find((option) => option.value === value);
    const query = search.trim().toLowerCase();
    const filtered = (query
        ? options.filter((option) =>
              `${option.label} ${option.subtitle ?? ''} ${option.keywords ?? ''}`
                  .toLowerCase()
                  .includes(query),
          )
        : options
    ).slice(0, 100);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((current) => !current);
                    setSearch('');
                }}
                className={`${selectClass} flex items-center justify-between gap-2 text-left`}
            >
                <span className="min-w-0 truncate">
                    {selected ? (
                        <>
                            <span>{selected.label}</span>
                            {selected.subtitle && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {selected.subtitle}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-xl">
                    <div className="border-b p-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={searchPlaceholder}
                                className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                No matching records.
                            </div>
                        ) : (
                            filtered.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full rounded-lg px-3 py-2 text-left hover:bg-muted ${
                                        option.value === value
                                            ? 'bg-primary/10'
                                            : ''
                                    }`}
                                >
                                    <div className="text-sm font-medium">
                                        {option.label}
                                    </div>
                                    {option.subtitle && (
                                        <div className="text-xs text-muted-foreground">
                                            {option.subtitle}
                                        </div>
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

function Modal({
    open,
    title,
    children,
    onClose,
}: {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h3 className="font-semibold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function accountOption(account: Account): SearchOption {
    return {
        value: String(account.id),
        label: `${account.code} — ${account.name}`,
        keywords: `${account.code} ${account.name}`,
    };
}

function vendorOption(account: Account): SearchOption {
    return {
        value: account.code,
        label: `${account.code} — ${account.name}`,
        keywords: `${account.code} ${account.name}`,
    };
}

async function postJson(
    url: string,
    payload: Record<string, unknown>,
): Promise<Record<string, any>> {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(cookie
                ? { 'X-XSRF-TOKEN': decodeURIComponent(cookie) }
                : {}),
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as Record<
        string,
        any
    >;

    if (!response.ok) {
        throw new Error(
            String(data.message ?? 'Unable to save the record.'),
        );
    }

    return data;
}

export default function Form({ formMode, invoice, lines: initialLines, master, modes, statuses }: Props) {
    const [header, setHeader] = useState<Header>(() => blankHeader(master, invoice));
    const [lines, setLines] = useState<Line[]>(initialLines);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [busy, setBusy] = useState(false);

    const [addedHotels, setAddedHotels] = useState<SimpleOption[]>([]);
    const [addedVisaTypes, setAddedVisaTypes] = useState<string[]>([]);
    const [addedVehicles, setAddedVehicles] = useState<SimpleOption[]>([]);
    const [addedTransferLocations, setAddedTransferLocations] = useState<SimpleOption[]>([]);
    const [transferLocationTarget, setTransferLocationTarget] = useState<'from' | 'to'>('from');
    const [modal, setModal] = useState<ModalKind>(null);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState('');
    const [hotelDraft, setHotelDraft] = useState({
        name: '',
        city: '',
        vendor_account_code: '',
    });
    const [vehicleDraft, setVehicleDraft] = useState({
        name: '',
        registration_no: '',
        vendor_account_code: '',
    });
    const [visaTypeDraft, setVisaTypeDraft] = useState({
        name: '',
    });
    const [transferLocationDraft, setTransferLocationDraft] = useState({
        name: '',
    });

    const selectedLine = lines[selectedIndex] ?? lines[0];

    const hotels = useMemo(
        () => [...master.hotels, ...addedHotels],
        [master.hotels, addedHotels],
    );

    const vehicles = useMemo(
        () => [...master.vehicles, ...addedVehicles],
        [master.vehicles, addedVehicles],
    );

    const transferLocations = useMemo(
        () => [...(master.transfer_locations ?? []), ...addedTransferLocations],
        [master.transfer_locations, addedTransferLocations],
    );

    const customerOptions = useMemo(
        () => master.customers.map(accountOption),
        [master.customers],
    );

    const agentOptions = useMemo(
        () => master.customers.map(vendorOption),
        [master.customers],
    );

    const vendorOptions = useMemo(
    () => master.vendors.map(vendorOption),
    [master.vendors],
);

const payableOptions = useMemo(
    () => [
        ...master.customers.map((customer) => ({
            value: customer.code,
            label: `${customer.code} — ${customer.name}`,
            subtitle: 'Client / Customer',
            keywords: `${customer.code} ${customer.name} client customer`,
        })),
        ...master.vendors.map((vendor) => ({
            value: vendor.code,
            label: `${vendor.code} — ${vendor.name}`,
            subtitle: 'Vendor',
            keywords: `${vendor.code} ${vendor.name} vendor supplier`,
        })),
    ],
    [master.customers, master.vendors],
);

    const incomeOptions = useMemo(
        () => master.income_accounts.map(vendorOption),
        [master.income_accounts],
    );

    const passengerOptions = useMemo(
        () =>
            master.passengers.map((passenger) => ({
                value: String(passenger.id),
                label: String(passenger.name ?? ''),
                subtitle: passenger.passport_no
                    ? `Passport ${String(passenger.passport_no)}`
                    : undefined,
                keywords: `${String(passenger.name ?? '')} ${String(
                    passenger.passport_no ?? '',
                )} ${String(passenger.phone ?? '')}`,
            })),
        [master.passengers],
    );

    const hotelOptions = useMemo(
        () =>
            hotels.map((hotel) => {
                const city = String(
                    hotel.city ??
                        hotel.city_name ??
                        hotel.sector ??
                        hotel.location ??
                        '',
                ).trim();

                return {
                    value: String(hotel.id),
                    label: String(hotel.name ?? ''),
                    subtitle: city || undefined,
                    keywords: `${String(hotel.name ?? '')} ${city}`,
                };
            }),
        [hotels],
    );

    const visaTypeNames = useMemo(
        () =>
            Array.from(
                new Set([
                    ...(Array.isArray(master.visa_types) ? master.visa_types : []),
                    ...addedVisaTypes,
                ]),
            ),
        [master.visa_types, addedVisaTypes],
    );

    const visaOptions = useMemo(
        () =>
            visaTypeNames.map((visaType) => ({
                value: String(visaType),
                label: String(visaType),
                keywords: String(visaType),
            })),
        [visaTypeNames],
    );

    const vehicleOptions = useMemo(
        () =>
            vehicles.map((vehicle) => {
                const registration = String(
                    vehicle.registration_no ??
                        vehicle.reg_no ??
                        vehicle.vehicle_no ??
                        vehicle.plate_no ??
                        '',
                ).trim();

                return {
                    value: String(vehicle.id),
                    label: String(vehicle.name ?? ''),
                    subtitle: registration || undefined,
                    keywords: `${String(vehicle.name ?? '')} ${registration}`,
                };
            }),
        [vehicles],
    );

    const airlineOptions = useMemo(
        () =>
            (Array.isArray(master.airlines) ? master.airlines : []).map(
                (airline) => {
                    const code = String(
                        airline.airline_code ??
                            airline.code ??
                            airline.iata_code ??
                            '',
                    ).trim();
                    const name = String(
                        airline.name ??
                            airline.airline_name ??
                            airline.title ??
                            code,
                    ).trim();

                    return {
                        value: code || String(airline.id),
                        label: name || code || String(airline.id),
                        subtitle: code || undefined,
                        keywords: `${name} ${code}`,
                    };
                },
            ),
        [master.airlines],
    );

    const transferLocationOptions = useMemo(
        () =>
            transferLocations.map((location) => ({
                value: String(location.name ?? ''),
                label: String(location.name ?? ''),
                keywords: String(location.name ?? ''),
            })),
        [transferLocations],
    );

    const selectedProfit = useMemo(() => {
        const receivable = lineReceivable(selectedLine ?? {});
        const payable = linePayable(selectedLine ?? {});
        const profit = lineProfit(selectedLine ?? {});
        const roe = numberValue(selectedLine?.currency_rate);
        const sale = selectedLine?.mode === 'Hotel'
            ? hotelSellingTotal(selectedLine)
            : selectedLine?.mode === 'Transfer'
                ? transferSellingTotal(selectedLine)
                : selectedLine?.mode === 'Ticket'
                    ? ticketBaseSale(selectedLine)
                    : selectedLine?.mode === 'Other'
                        ? otherBaseSale(selectedLine)
                        : selectedLine?.mode === 'Visa'
                            ? Math.max(
                                  numberValue(selectedLine?.rate) > 0
                                      ? numberValue(selectedLine?.rate) *
                                            Math.max(numberValue(selectedLine?.quantity), 1)
                                      : numberValue(selectedLine?.receivable_amount) -
                                            numberValue(selectedLine?.agent_amount),
                                  0,
                              )
                            : numberValue(selectedLine?.receivable_amount);

        const agent = ['Hotel', 'Visa', 'Transfer', 'Ticket', 'Other'].includes(
            selectedLine?.mode ?? '',
        )
            ? numberValue(selectedLine?.agent_amount)
            : 0;
        const currency = String(selectedLine?.currency_code ?? '').toUpperCase();

        return {
            receivable,
            payable,
            profit,
            roe,
            currency,
            baseSale: sale,
            agent,
            foreignProfit: roe > 0 ? profit / roe : 0,
            foreignReceivable: roe > 0 ? receivable / roe : 0,
            foreignPayable: roe > 0 ? payable / roe : 0,
            foreignSale: roe > 0 ? sale / roe : 0,
        };
    }, [selectedLine]);

    const totals = useMemo(() => {
        const receivable = lines.reduce(
            (sum, line) => sum + lineReceivable(line),
            0,
        );
        const payable = lines.reduce(
            (sum, line) => sum + linePayable(line),
            0,
        );
        const profit = lines.reduce(
            (sum, line) => sum + lineProfit(line),
            0,
        );
        return {
            receivable,
            payable,
            profit,
        };
    }, [lines]);

    function updateHeader(key: keyof Header, value: string | number | boolean): void {
        setHeader((current) => ({ ...current, [key]: value }));
    }

    function updateLine(
    index: number,
    key: keyof Line,
    value: string | number | null,
): void {
    setLines((current) =>
        current.map((line, currentIndex) => {
            if (currentIndex !== index) return line;

            const next = { ...line, [key]: value } as Line;

            /*
             * IMPORTANT:
             * When agent_amount is changed, the existing receivable may
             * already contain the OLD commission. Therefore calculate the
             * base sale from the OLD line before applying the new commission.
             */
            const existingBaseSale = Math.max(
                numberValue(line.receivable_amount) -
                    numberValue(line.agent_amount),
                0,
            );

            const agentAmount = Math.max(
                numberValue(next.agent_amount),
                0,
            );

            if (next.mode === 'Hotel') {
                if (key === 'starting_date' || key === 'nights') {
                    const nights = Math.max(numberValue(next.nights), 0);

                    if (next.starting_date) {
                        next.ending_date = addDays(
                            next.starting_date,
                            nights,
                        );
                    }
                }

                if (key === 'ending_date') {
                    next.nights = diffDays(
                        next.starting_date,
                        next.ending_date,
                    );
                }

                const units = hotelUnits(next);
                const sellingTotal = hotelSellingTotal(next);

                const vendorPrimary =
                    numberValue(next.vendor_rate_per_night) * units;

                next.vendor_amount = vendorPrimary;

                next.receivable_amount =
                    sellingTotal + agentAmount;

                next.currency_quantity = units;
            }

            if (next.mode === 'Visa') {
                const quantity = Math.max(
                    numberValue(next.quantity),
                    1,
                );

                const rate = Math.max(
                    numberValue(next.rate),
                    0,
                );

                const baseSale =
                    rate > 0
                        ? rate * quantity
                        : existingBaseSale;

                if (
                    key === 'rate' ||
                    key === 'quantity' ||
                    key === 'agent_amount'
                ) {
                    next.receivable_amount =
                        baseSale + agentAmount;
                }

                next.currency_quantity = quantity;
            }

            if (next.mode === 'Transfer') {
                const quantity = Math.max(
                    numberValue(next.quantity),
                    1,
                );

                const rate = Math.max(
                    numberValue(next.rate),
                    0,
                );

                const baseSale =
                    rate > 0
                        ? rate * quantity
                        : existingBaseSale;

                if (
                    key === 'rate' ||
                    key === 'quantity' ||
                    key === 'agent_amount'
                ) {
                    next.receivable_amount =
                        baseSale + agentAmount;
                }

                next.currency_quantity = quantity;
            }

            if (next.mode === 'Ticket') {
                const quantity = Math.max(
                    numberValue(next.quantity),
                    1,
                );

                const rate = Math.max(
                    numberValue(next.rate),
                    0,
                );

                const baseSale =
                    rate > 0
                        ? rate * quantity
                        : existingBaseSale;

                if (
                    key === 'rate' ||
                    key === 'quantity' ||
                    key === 'agent_amount'
                ) {
                    next.receivable_amount =
                        baseSale + agentAmount;
                }

                next.currency_quantity = quantity;
            }

            if (next.mode === 'Other') {
                const quantity = Math.max(
                    numberValue(next.quantity),
                    1,
                );

                const rate = Math.max(
                    numberValue(next.rate),
                    0,
                );

                const baseSale =
                    rate > 0
                        ? rate * quantity
                        : existingBaseSale;

                if (
                    key === 'rate' ||
                    key === 'quantity' ||
                    key === 'agent_amount'
                ) {
                    next.receivable_amount =
                        baseSale + agentAmount;
                }

                next.currency_quantity = quantity;
            }

            return next;
        }),
    );
    }

    function addDays(value: string, days: number): string {
        if (!value || days < 0) return '';

        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return '';

        date.setDate(date.getDate() + Math.round(days));

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-');
    }

    function diffDays(from: string, to: string): number {
        if (!from || !to) return 0;

        const start = new Date(`${from}T00:00:00`);
        const end = new Date(`${to}T00:00:00`);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return 0;
        }

        return Math.max(
            0,
            Math.round(
                (end.getTime() - start.getTime()) / 86_400_000,
            ),
        );
    }

    function addLine(copyCurrent = false): void {
        const base = selectedLine ?? initialLines[0];
        const line = copyCurrent && base
            ? { ...base }
            : { ...initialLines[0] };

        if (copyCurrent && line.passenger_name) {
            line.passenger_name = `${line.passenger_name}`;
        }

        setLines((current) => [...current, line]);
        setSelectedIndex(lines.length);
    }

    function removeLine(index: number): void {
        if (lines.length === 1) return;
        setLines((current) => current.filter((_, currentIndex) => currentIndex !== index));
        setSelectedIndex((current) => Math.min(current, lines.length - 2));
    }

    function patchLine(
        index: number,
        changes: Partial<Line>,
    ): void {
        setLines((current) =>
            current.map((line, currentIndex) =>
                currentIndex === index
                    ? ({ ...line, ...changes } as Line)
                    : line,
            ),
        );
    }

    function selectPassenger(passengerId: string): void {
        const passenger = master.passengers.find(
            (item) => String(item.id) === passengerId,
        );
        if (!passenger) return;

        patchLine(selectedIndex, {
            passenger_name: String(passenger.name ?? ''),
            passport_no: String(passenger.passport_no ?? ''),
            nationality: String(passenger.nationality ?? ''),
            phone: String(passenger.phone ?? ''),
        });
    }

    function selectAgent(code: string): void {
        patchLine(selectedIndex, {
            agent_code: code,
        });
    }

    function selectVisaType(value: string): void {
        patchLine(selectedIndex, {
            package: value,
            sector: selectedLine?.sector || value,
        });
    }

    function selectHotel(hotelId: string): void {
        const hotel = hotels.find(
            (item) => String(item.id) === hotelId,
        );
        if (!hotel) return;

        const city = String(
            hotel.city ??
                hotel.city_name ??
                hotel.sector ??
                hotel.location ??
                '',
        ).trim();

        const vendorCode = String(
            hotel.vendor_account_code ??
                hotel.vendor_code ??
                hotel.payable_account_code ??
                '',
        ).trim();

        patchLine(selectedIndex, {
            hotel_id: Number(hotel.id),
            hotel_name: String(hotel.name ?? ''),
            sector: city || selectedLine?.sector || '',
            payable_account_code:
                vendorCode || selectedLine?.payable_account_code || '',
        });
    }

    function selectVehicle(vehicleId: string): void {
        const vehicle = vehicles.find(
            (item) => String(item.id) === vehicleId,
        );
        if (!vehicle) return;

        const registration = String(
            vehicle.registration_no ??
                vehicle.reg_no ??
                vehicle.vehicle_no ??
                vehicle.plate_no ??
                '',
        ).trim();

        const vendorCode = String(
            vehicle.vendor_account_code ??
                vehicle.vendor_code ??
                vehicle.payable_account_code ??
                '',
        ).trim();

        patchLine(selectedIndex, {
            vehicle_id: Number(vehicle.id),
            flight_information:
                registration || selectedLine?.flight_information || '',
            payable_account_code:
                vendorCode || selectedLine?.payable_account_code || '',
        });
    }

    async function saveVisaType(): Promise<void> {
        setModalError('');

        const name = visaTypeDraft.name.trim();
        if (!name) {
            setModalError('Visa type / package name is required.');
            return;
        }

        setModalBusy(true);

        try {
            const data = await postJson(
                '/invoices/options/visa-types',
                { name },
            );

            const visaType = data.visa_type as { id?: number; name?: string };
            const savedName = String(visaType?.name ?? name).trim();

            setAddedVisaTypes((current) =>
                current.some(
                    (item) => item.toLowerCase() === savedName.toLowerCase(),
                )
                    ? current
                    : [...current, savedName],
            );

            patchLine(selectedIndex, {
                package: savedName,
                sector: selectedLine?.sector || savedName,
            });

            setModal(null);
            setVisaTypeDraft({ name: '' });
        } catch (error) {
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save visa type.',
            );
        } finally {
            setModalBusy(false);
        }
    }

    async function saveHotel(): Promise<void> {
        setModalError('');

        if (!hotelDraft.name.trim()) {
            setModalError('Hotel name is required.');
            return;
        }

        setModalBusy(true);

        try {
            const data = await postJson(
                '/invoices/options/hotels',
                {
                    name: hotelDraft.name.trim(),
                    city: hotelDraft.city.trim(),
                    vendor_account_code:
                        hotelDraft.vendor_account_code || null,
                },
            );

            const hotel = data.hotel as SimpleOption;
            setAddedHotels((current) => [...current, hotel]);
            // Select the freshly-created hotel immediately; React state updates
            // are asynchronous, so selectHotel() would not see it yet.
            const city = String(
                hotel.city ??
                    hotel.city_name ??
                    hotel.sector ??
                    hotel.location ??
                    '',
            ).trim();
            const vendorCode = String(
                hotel.vendor_account_code ??
                    hotel.vendor_code ??
                    hotel.payable_account_code ??
                    '',
            ).trim();
            patchLine(selectedIndex, {
                hotel_id: Number(hotel.id),
                hotel_name: String(hotel.name ?? ''),
                sector: city || selectedLine?.sector || '',
                payable_account_code:
                    vendorCode || selectedLine?.payable_account_code || '',
            });
            setModal(null);
            setHotelDraft({
                name: '',
                city: '',
                vendor_account_code: '',
            });
        } catch (error) {
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create hotel.',
            );
        } finally {
            setModalBusy(false);
        }
    }

    async function saveVehicle(): Promise<void> {
        setModalError('');

        if (!vehicleDraft.name.trim()) {
            setModalError('Vehicle type is required.');
            return;
        }

        setModalBusy(true);

        try {
            const data = await postJson(
                '/invoices/options/vehicles',
                {
                    name: vehicleDraft.name.trim(),
                    registration_no:
                        vehicleDraft.registration_no.trim(),
                    vendor_account_code:
                        vehicleDraft.vendor_account_code || null,
                },
            );

            const vehicle = data.vehicle as SimpleOption;
            setAddedVehicles((current) => [...current, vehicle]);
            const registration = String(
                vehicle.registration_no ??
                    vehicle.reg_no ??
                    vehicle.vehicle_no ??
                    vehicle.plate_no ??
                    '',
            ).trim();
            const vendorCode = String(
                vehicle.vendor_account_code ??
                    vehicle.vendor_code ??
                    vehicle.payable_account_code ??
                    '',
            ).trim();
            patchLine(selectedIndex, {
                vehicle_id: Number(vehicle.id),
                flight_information: registration || selectedLine?.flight_information || '',
                payable_account_code:
                    vendorCode || selectedLine?.payable_account_code || '',
            });
            setModal(null);
            setVehicleDraft({
                name: '',
                registration_no: '',
                vendor_account_code: '',
            });
        } catch (error) {
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create vehicle.',
            );
        } finally {
            setModalBusy(false);
        }
    }

    async function saveTransferLocation(): Promise<void> {
        setModalError('');

        if (!transferLocationDraft.name.trim()) {
            setModalError('Transfer location is required.');
            return;
        }

        setModalBusy(true);

        try {
            const data = await postJson(
                '/invoices/options/transfer-locations',
                { name: transferLocationDraft.name.trim() },
            );

            const location = data.location as SimpleOption;
            setAddedTransferLocations((current) => [...current, location]);

            patchLine(selectedIndex, {
                ...(transferLocationTarget === 'from'
                    ? { sector: String(location.name ?? '') }
                    : { sector_to: String(location.name ?? '') }),
            });

            setModal(null);
            setTransferLocationDraft({ name: '' });
        } catch (error) {
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create transfer location.',
            );
        } finally {
            setModalBusy(false);
        }
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setBusy(true);

        const payload = {
            ...header,
            lines,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        };

        if (formMode === 'create') {
            router.post('/invoices', payload, options);
        } else {
            router.put(`/invoices/${header.id}`, payload, options);
        }
    }

    return (
        <>
            <Modal
                open={modal === 'visa'}
                title="Add Visa Type / Package"
                onClose={() => {
                    if (!modalBusy) {
                        setModal(null);
                        setModalError('');
                    }
                }}
            >
                <div className="space-y-4 p-5">
                    <Field label="Visa Type / Package *">
                        <input
                            value={visaTypeDraft.name}
                            onChange={(event) =>
                                setVisaTypeDraft({ name: event.target.value })
                            }
                            className={inputClass}
                            placeholder="e.g. NON MASAR UMRAH VISA"
                            autoFocus
                        />
                    </Field>

                    {modalError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {modalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => setModal(null)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => void saveVisaType()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            {modalBusy ? 'Saving...' : 'Save Visa Type'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal === 'hotel'}
                title="Add New Hotel"
                onClose={() => {
                    if (!modalBusy) {
                        setModal(null);
                        setModalError('');
                    }
                }}
            >
                <div className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Hotel Name *">
                            <input
                                value={hotelDraft.name}
                                onChange={(event) =>
                                    setHotelDraft((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="City / Sector">
                            <input
                                value={hotelDraft.city}
                                onChange={(event) =>
                                    setHotelDraft((current) => ({
                                        ...current,
                                        city: event.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label="Default Vendor / Payable">
                        <SearchableSelect
                            value={hotelDraft.vendor_account_code}
                            onChange={(value) =>
                                setHotelDraft((current) => ({
                                    ...current,
                                    vendor_account_code: value,
                                }))
                            }
                            options={payableOptions}
                            placeholder="Select vendor"
                            searchPlaceholder="Search vendor code or name..."
                        />
                    </Field>

                    {modalError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {modalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => setModal(null)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => void saveHotel()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            {modalBusy ? 'Saving...' : 'Save Hotel'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal === 'vehicle'}
                title="Add New Vehicle"
                onClose={() => {
                    if (!modalBusy) {
                        setModal(null);
                        setModalError('');
                    }
                }}
            >
                <div className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Vehicle Type / Name *">
                            <input
                                value={vehicleDraft.name}
                                onChange={(event) =>
                                    setVehicleDraft((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Registration / Service">
                            <input
                                value={vehicleDraft.registration_no}
                                onChange={(event) =>
                                    setVehicleDraft((current) => ({
                                        ...current,
                                        registration_no: event.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label="Default Vendor / Payable">
                        <SearchableSelect
                            value={vehicleDraft.vendor_account_code}
                            onChange={(value) =>
                                setVehicleDraft((current) => ({
                                    ...current,
                                    vendor_account_code: value,
                                }))
                            }
                            options={vendorOptions}
                            placeholder="Select vendor"
                            searchPlaceholder="Search vendor code or name..."
                        />
                    </Field>

                    {modalError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {modalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => setModal(null)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => void saveVehicle()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            {modalBusy ? 'Saving...' : 'Save Vehicle'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal === 'transfer-location'}
                title="Add Transfer Location"
                onClose={() => {
                    if (!modalBusy) {
                        setModal(null);
                        setModalError('');
                    }
                }}
            >
                <div className="space-y-4 p-5">
                    <Field label={`${transferLocationTarget === 'from' ? 'From' : 'To'} Location *`}>
                        <input
                            value={transferLocationDraft.name}
                            onChange={(event) =>
                                setTransferLocationDraft({ name: event.target.value })
                            }
                            className={inputClass}
                            placeholder="e.g. MED APT"
                        />
                    </Field>

                    {modalError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {modalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => setModal(null)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={modalBusy}
                            onClick={() => void saveTransferLocation()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            {modalBusy ? 'Saving...' : 'Save Location'}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="min-h-screen space-y-4 bg-muted/20 p-4 md:p-6">
                <Head title={formMode === 'create' ? 'New Sales Invoice' : `Invoice #${header.invoice_number}`} />


                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm text-muted-foreground">Sales & Refund / Invoices</div>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            {formMode === 'create' ? 'New Invoice' : `Invoice #${header.invoice_number}`}
                        </h1>
                    </div>
                    <Link
                        href="/invoices"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Invoices
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <Section title="Invoice Header" icon={<FileText className="h-4 w-4" />}>
                        <div className="grid gap-4 xl:grid-cols-4">
                            <Field label="Invoice ID">
                                <input value={header.invoice_number ?? 'N/A'} readOnly className={`${inputClass} bg-muted`} />
                            </Field>
                            <Field label="Invoice Date *">
                                <input type="date" required value={header.invoice_date} onChange={(e) => updateHeader('invoice_date', e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="S.Tax Invoice No">
                                <input value={header.sales_tax_invoice_no} onChange={(e) => updateHeader('sales_tax_invoice_no', e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Ref #">
                                <input value={header.ref_no} onChange={(e) => updateHeader('ref_no', e.target.value)} className={inputClass} />
                            </Field>

                            <Field label="Branch Code *">
                                <select required value={header.branch_id} onChange={(e) => updateHeader('branch_id', Number(e.target.value))} className={selectClass}>
                                    <option value={0}>Select Branch</option>
                                    {master.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Client Code / Customer *">
                                <SearchableSelect
                                    value={String(header.client_account_id || '')}
                                    onChange={(value) =>
                                        updateHeader(
                                            'client_account_id',
                                            Number(value),
                                        )
                                    }
                                    options={customerOptions}
                                    placeholder="Search client..."
                                    searchPlaceholder="Search client code or name..."
                                />
                            </Field>
                            <Field label="Due Date">
                                <input type="date" value={header.due_date} onChange={(e) => updateHeader('due_date', e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Due Vendor">
                                <input type="date" value={header.due_date_vendor} onChange={(e) => updateHeader('due_date_vendor', e.target.value)} className={inputClass} />
                            </Field>

                            <Field label="Department">
                                <select value={header.department_id} onChange={(e) => updateHeader('department_id', Number(e.target.value))} className={selectClass}>
                                    <option value={0}>Select Department</option>
                                    {master.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Payment Terms">
                                <input value={header.payment_terms} onChange={(e) => updateHeader('payment_terms', e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Employee">
                                <select value={header.employee} onChange={(e) => updateHeader('employee', e.target.value)} className={selectClass}>
                                    <option value="">Select Employee</option>
                                    {master.employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Status">
                                <select value={header.status} onChange={(e) => updateHeader('status', e.target.value)} className={selectClass}>
                                    {statuses.map((status) => <option key={status}>{status}</option>)}
                                </select>
                            </Field>

                            <Field label="Umrah Query ID">
                                <input inputMode="numeric" value={header.umrah_query_id} onChange={(e) => updateHeader('umrah_query_id', e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Ticket Query ID">
                                <input inputMode="numeric" value={header.ticket_query_id} onChange={(e) => updateHeader('ticket_query_id', e.target.value)} className={inputClass} />
                            </Field>
                            <label className="flex items-center gap-3 pt-6 text-sm">
                                <input type="checkbox" checked={header.supervised} onChange={(e) => updateHeader('supervised', e.target.checked)} className="h-4 w-4" />
                                Supervise
                            </label>
                            <label className="flex items-center gap-3 pt-6 text-sm">
                                <input type="checkbox" checked={header.active} onChange={(e) => updateHeader('active', e.target.checked)} className="h-4 w-4" />
                                Active
                            </label>

                            <Field label="Remarks" className="xl:col-span-4">
                                <textarea value={header.remarks} onChange={(e) => updateHeader('remarks', e.target.value)} className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                            </Field>
                        </div>
                    </Section>

                    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_260px]">
                        <Section title="Invoice Details">
                            <div className="space-y-2">
                                {lines.map((line, index) => {
                                    const lineReceivableValue = lineReceivable(line);
                                    const linePayableValue = linePayable(line);
                                    const lineProfitValue = lineProfit(line);

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setSelectedIndex(index)}
                                            className={`w-full rounded-lg border p-3 text-left ${selectedIndex === index ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">{index + 1}. {line.mode}</span>
                                                <span className="text-xs text-muted-foreground">{line.passenger_name || 'Passenger'}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground truncate">{line.sector || line.hotel_name || line.package || 'No description'}</div>
                                            <div className="mt-2 flex justify-between text-xs">
                                                <span>R {money(lineReceivableValue)}</span>
                                                <span>P {money(linePayableValue)}</span>
                                                <span>{money(lineProfitValue)}</span>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button type="button" onClick={() => addLine(false)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-muted">
                                        <CirclePlus className="h-4 w-4" /> Add Line
                                    </button>
                                    <button type="button" onClick={() => addLine(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-muted">
                                        <Copy className="h-4 w-4" /> Copy
                                    </button>
                                </div>
                            </div>
                        </Section>

                        <div className="space-y-4">
                            <Section title="Detail Header" icon={<UserRound className="h-4 w-4" />}>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Field label="Mode *">
                                        <select value={selectedLine.mode} onChange={(e) => updateLine(selectedIndex, 'mode', e.target.value)} className={selectClass}>
                                            {modes.map((mode) => <option key={mode}>{mode}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Type *">
                                        <select value={selectedLine.type} onChange={(e) => updateLine(selectedIndex, 'type', e.target.value)} className={selectClass}>
                                            <option>Normal</option>
                                            <option>Credit</option>
                                        </select>
                                    </Field>
                                    <Field label="Passenger Type">
                                        <select value={selectedLine.passenger_type} onChange={(e) => updateLine(selectedIndex, 'passenger_type', e.target.value)} className={selectClass}>
                                            <option>Adult</option>
                                            <option>Child</option>
                                            <option>Infant</option>
                                        </select>
                                    </Field>
                                    <Field label="Group No">
                                        <input value={selectedLine.group_no} onChange={(e) => updateLine(selectedIndex, 'group_no', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="Passenger / Search Existing">
                                        <SearchableSelect
                                            value={
                                                master.passengers.find(
                                                    (item) =>
                                                        String(
                                                            item.name ?? '',
                                                        ) ===
                                                        selectedLine.passenger_name,
                                                )?.id
                                                    ? String(
                                                          master.passengers.find(
                                                              (item) =>
                                                                  String(
                                                                      item.name ??
                                                                          '',
                                                                  ) ===
                                                                  selectedLine.passenger_name,
                                                          )?.id,
                                                      )
                                                    : ''
                                            }
                                            onChange={selectPassenger}
                                            options={passengerOptions}
                                            placeholder="Search passenger..."
                                            searchPlaceholder="Name, passport or phone..."
                                        />
                                    </Field>
                                    <Field label="Passenger Name" className="md:col-span-2">
                                        <input value={selectedLine.passenger_name} onChange={(e) => updateLine(selectedIndex, 'passenger_name', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="Passport">
                                        <input value={selectedLine.passport_no} onChange={(e) => updateLine(selectedIndex, 'passport_no', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="Nationality">
                                        <input value={selectedLine.nationality} onChange={(e) => updateLine(selectedIndex, 'nationality', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="Phone">
                                        <input value={selectedLine.phone} onChange={(e) => updateLine(selectedIndex, 'phone', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="Date of Birth">
                                        <input type="date" value={selectedLine.dob} onChange={(e) => updateLine(selectedIndex, 'dob', e.target.value)} className={inputClass} />
                                    </Field>
                                </div>
                            </Section>

                            {selectedLine.mode === 'Ticket' && (
                                <Section title="Ticket Details" icon={<Plane className="h-4 w-4" />}>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="Airline">
                                            <SearchableSelect
                                                value={selectedLine.airline_code}
                                                onChange={(value) => updateLine(selectedIndex, 'airline_code', value)}
                                                options={airlineOptions}
                                                placeholder="Search airline..."
                                                searchPlaceholder="Airline code or name..."
                                            />
                                        </Field>
                                        <Field label="Ticket No">
                                            <input value={selectedLine.ticket_no} onChange={(e) => updateLine(selectedIndex, 'ticket_no', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Con Ticket No">
                                            <input value={selectedLine.con_ticket_no} onChange={(e) => updateLine(selectedIndex, 'con_ticket_no', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Ticket Type">
                                            <input value={selectedLine.ticket_type} onChange={(e) => updateLine(selectedIndex, 'ticket_type', e.target.value)} className={inputClass} />
                                        </Field>

                                        <Field label="Sector / Description" className="md:col-span-2">
                                            <input value={selectedLine.sector} onChange={(e) => updateLine(selectedIndex, 'sector', e.target.value)} className={inputClass} placeholder="e.g. KHI-DXB-KHI" />
                                        </Field>
                                        <Field label="Route" className="md:col-span-2">
                                            <input value={selectedLine.route} onChange={(e) => updateLine(selectedIndex, 'route', e.target.value)} className={inputClass} placeholder="Return / one-way" />
                                        </Field>

                                        <Field label="Departure Date">
                                            <input type="date" value={selectedLine.departure_date} onChange={(e) => updateLine(selectedIndex, 'departure_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Return Date">
                                            <input type="date" value={selectedLine.return_date} onChange={(e) => updateLine(selectedIndex, 'return_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="GDS">
                                            <input value={selectedLine.gds} onChange={(e) => updateLine(selectedIndex, 'gds', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="PNR">
                                            <input value={selectedLine.pnr} onChange={(e) => updateLine(selectedIndex, 'pnr', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Flight No">
                                            <input value={selectedLine.flight_no} onChange={(e) => updateLine(selectedIndex, 'flight_no', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Class">
                                            <input value={selectedLine.class} onChange={(e) => updateLine(selectedIndex, 'class', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="XO">
                                            <input value={selectedLine.xo} onChange={(e) => updateLine(selectedIndex, 'xo', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Quantity">
                                            <input type="number" min="1" step="1" value={selectedLine.quantity} onChange={(e) => updateLine(selectedIndex, 'quantity', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Customer Sale / Rate">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.rate} onChange={(e) => updateLine(selectedIndex, 'rate', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Fare / Ticket Cost">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.fare} onChange={(e) => updateLine(selectedIndex, 'fare', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Fare NC">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.fare_nc} onChange={(e) => updateLine(selectedIndex, 'fare_nc', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Ticket Taxes / Surcharges
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <Field label="SP / APT"><input type="number" min="0" step="0.0001" value={selectedLine.sp_apt} onChange={(e) => updateLine(selectedIndex, 'sp_apt', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="SF / FTT"><input type="number" min="0" step="0.0001" value={selectedLine.sf_ftt} onChange={(e) => updateLine(selectedIndex, 'sf_ftt', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="AQ / PK / YR"><input type="number" min="0" step="0.0001" value={selectedLine.aq_pk_yr} onChange={(e) => updateLine(selectedIndex, 'aq_pk_yr', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="FED / RG / CVT"><input type="number" min="0" step="0.0001" value={selectedLine.fed_rg_cvt} onChange={(e) => updateLine(selectedIndex, 'fed_rg_cvt', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="CED"><input type="number" min="0" step="0.0001" value={selectedLine.ced} onChange={(e) => updateLine(selectedIndex, 'ced', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="JO"><input type="number" min="0" step="0.0001" value={selectedLine.jo} onChange={(e) => updateLine(selectedIndex, 'jo', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="WH Airlines"><input type="number" min="0" step="0.0001" value={selectedLine.wh_airlines} onChange={(e) => updateLine(selectedIndex, 'wh_airlines', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="WH Client"><input type="number" min="0" step="0.0001" value={selectedLine.wh_client} onChange={(e) => updateLine(selectedIndex, 'wh_client', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="YQ"><input type="number" min="0" step="0.0001" value={selectedLine.yq} onChange={(e) => updateLine(selectedIndex, 'yq', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="XUT"><input type="number" min="0" step="0.0001" value={selectedLine.xut} onChange={(e) => updateLine(selectedIndex, 'xut', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="XZ"><input type="number" min="0" step="0.0001" value={selectedLine.xz} onChange={(e) => updateLine(selectedIndex, 'xz', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="YD"><input type="number" min="0" step="0.0001" value={selectedLine.yd} onChange={(e) => updateLine(selectedIndex, 'yd', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="Other Tax"><input type="number" min="0" step="0.0001" value={selectedLine.other_tax} onChange={(e) => updateLine(selectedIndex, 'other_tax', numberValue(e.target.value))} className={inputClass} /></Field>
                                            <Field label="Total Taxes">
                                                <input value={money(ticketTaxTotal(selectedLine))} readOnly className={`${inputClass} bg-muted font-semibold`} />
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Customer Receivable</div>
                                            <div className="mt-1 text-lg font-semibold">{money(lineReceivable(selectedLine))}</div>
                                            <div className="text-xs text-muted-foreground">Gross customer charge</div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Base Sale</div>
                                            <div className="mt-1 text-lg font-semibold">{money(ticketBaseSale(selectedLine))}</div>
                                            <div className="text-xs text-muted-foreground">Receivable less agent commission</div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Ticket Profit</div>
                                            <div className={`mt-1 text-lg font-semibold ${lineProfit(selectedLine) < 0 ? 'text-destructive' : ''}`}>{money(lineProfit(selectedLine))}</div>
                                            <div className="text-xs text-muted-foreground">Base sale less ticket cost</div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {selectedLine.mode === 'Visa' && (
                                <Section title="Visa Details" icon={<WalletCards className="h-4 w-4" />}>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="Visa Type / Package">
                                            <div className="flex gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <SearchableSelect
                                                        value={selectedLine.package}
                                                        onChange={selectVisaType}
                                                        options={visaOptions}
                                                        placeholder="Select visa type..."
                                                        searchPlaceholder="Search visa type..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalError('');
                                                        setVisaTypeDraft({ name: '' });
                                                        setModal('visa');
                                                    }}
                                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
                                                    title="Add new visa type / package"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="Visa No">
                                            <input value={selectedLine.visa_no} onChange={(e) => updateLine(selectedIndex, 'visa_no', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Documents">
                                            <input value={selectedLine.documents} onChange={(e) => updateLine(selectedIndex, 'documents', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Online Date">
                                            <input type="date" value={selectedLine.online_date} onChange={(e) => updateLine(selectedIndex, 'online_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Starting Date">
                                            <input type="date" value={selectedLine.starting_date} onChange={(e) => updateLine(selectedIndex, 'starting_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Expiry / Ending Date">
                                            <input type="date" value={selectedLine.ending_date} onChange={(e) => updateLine(selectedIndex, 'ending_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Quantity">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={selectedLine.quantity}
                                                onChange={(event) =>
                                                    updateLine(
                                                        selectedIndex,
                                                        'quantity',
                                                        numberValue(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field label="Rate / Transfer">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={selectedLine.rate}
                                                onChange={(event) =>
                                                    updateLine(
                                                        selectedIndex,
                                                        'rate',
                                                        numberValue(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field label="Rate">
                                            <input type="number" step="0.0001" value={selectedLine.rate} onChange={(e) => updateLine(selectedIndex, 'rate', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                    </div>
                                </Section>
                            )}

                            {selectedLine.mode === 'Hotel' && (
                                <Section title="Hotel Details" icon={<Hotel className="h-4 w-4" />}>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="Hotel *" className="md:col-span-2">
                                            <div className="flex gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <SearchableSelect
                                                        value={selectedLine.hotel_id ? String(selectedLine.hotel_id) : ''}
                                                        onChange={selectHotel}
                                                        options={hotelOptions}
                                                        placeholder="Search hotel..."
                                                        searchPlaceholder="Hotel name or city..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalError('');
                                                        setModal('hotel');
                                                    }}
                                                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                    title="Add new hotel"
                                                >
                                                    <Plus className="size-4" />
                                                    Add
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="Room Type">
                                            <input value={selectedLine.room_type} onChange={(e) => updateLine(selectedIndex, 'room_type', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Sector / City">
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                                                <input value={selectedLine.sector} onChange={(e) => updateLine(selectedIndex, 'sector', e.target.value)} className={`${inputClass} pl-9`} />
                                            </div>
                                        </Field>
                                        <Field label="Meal">
                                            <input value={selectedLine.meal} onChange={(e) => updateLine(selectedIndex, 'meal', e.target.value)} className={inputClass} />
                                        </Field>

                                        <Field label="Check In">
                                            <input type="date" value={selectedLine.starting_date} onChange={(e) => updateLine(selectedIndex, 'starting_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Nights">
                                            <input type="number" min="0" step="1" value={selectedLine.nights} onChange={(e) => updateLine(selectedIndex, 'nights', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Check Out">
                                            <input type="date" value={selectedLine.ending_date} onChange={(e) => updateLine(selectedIndex, 'ending_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Room Qty">
                                            <input type="number" min="1" step="1" value={selectedLine.room_quantity} onChange={(e) => updateLine(selectedIndex, 'room_quantity', numberValue(e.target.value))} className={inputClass} />
                                        </Field>

                                        <Field label="Guests / Beds">
                                            <input type="number" min="1" step="1" value={selectedLine.quantity} onChange={(e) => updateLine(selectedIndex, 'quantity', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Rate / Night (Sale)">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.rate} onChange={(e) => updateLine(selectedIndex, 'rate', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Room No">
                                            <input value={selectedLine.room_no} onChange={(e) => updateLine(selectedIndex, 'room_no', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Confirm No">
                                            <input value={selectedLine.confirm_no} onChange={(e) => updateLine(selectedIndex, 'confirm_no', e.target.value)} className={inputClass} />
                                        </Field>

                                        <Field label="Internal Ref" className="md:col-span-2">
                                            <input value={selectedLine.internal_ref_no} onChange={(e) => updateLine(selectedIndex, 'internal_ref_no', e.target.value)} className={inputClass} />
                                        </Field>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Sale Total</div>
                                            <div className="mt-1 text-lg font-semibold">{money(hotelSellingTotal(selectedLine))}</div>
                                            <div className="text-xs text-muted-foreground">{money(numberValue(selectedLine.rate))} × {numberValue(selectedLine.nights)} nights × {numberValue(selectedLine.room_quantity) || 1} rooms</div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Rooms / Nights</div>
                                            <div className="mt-1 text-lg font-semibold">{hotelUnits(selectedLine)} units</div>
                                            <div className="text-xs text-muted-foreground">Guest/Beds {numberValue(selectedLine.quantity) || 1}</div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Net Profit</div>
                                            <div className={`mt-1 text-lg font-semibold ${lineProfit(selectedLine) < 0 ? 'text-destructive' : ''}`}>{money(lineProfit(selectedLine))}</div>
                                            <div className="text-xs text-muted-foreground">Sale less hotel cost</div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {selectedLine.mode === 'Transfer' && (
                                <Section title="Transfer Details">
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="From">
                                            <div className="flex gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <SearchableSelect
                                                        value={selectedLine.sector}
                                                        onChange={(value) => updateLine(selectedIndex, 'sector', value)}
                                                        options={transferLocationOptions}
                                                        placeholder="Search from location..."
                                                        searchPlaceholder="Sector / location..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalError('');
                                                        setTransferLocationTarget('from');
                                                        setModal('transfer-location');
                                                    }}
                                                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                    title="Add From Location"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="To">
                                            <div className="flex gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <SearchableSelect
                                                        value={selectedLine.sector_to}
                                                        onChange={(value) => updateLine(selectedIndex, 'sector_to', value)}
                                                        options={transferLocationOptions}
                                                        placeholder="Search to location..."
                                                        searchPlaceholder="Sector / location..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalError('');
                                                        setTransferLocationTarget('to');
                                                        setModal('transfer-location');
                                                    }}
                                                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                    title="Add To Location"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="Vehicle">
                                            <div className="flex gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <SearchableSelect
                                                        value={
                                                            selectedLine.vehicle_id
                                                                ? String(
                                                                      selectedLine.vehicle_id,
                                                                  )
                                                                : ''
                                                        }
                                                        onChange={selectVehicle}
                                                        options={vehicleOptions}
                                                        placeholder="Search vehicle..."
                                                        searchPlaceholder="Type, registration or service..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalError('');
                                                        setModal('vehicle');
                                                    }}
                                                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                                                >
                                                    <Plus className="size-4" />
                                                    Add
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="From Date">
                                            <input type="date" value={selectedLine.starting_date} onChange={(e) => updateLine(selectedIndex, 'starting_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Flight Info" className="md:col-span-2">
                                            <input value={selectedLine.flight_information} onChange={(e) => updateLine(selectedIndex, 'flight_information', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Quantity">
                                            <input type="number" min="1" step="1" value={selectedLine.quantity} onChange={(e) => updateLine(selectedIndex, 'quantity', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Customer Rate / Transfer">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={selectedLine.rate}
                                                onChange={(e) =>
                                                    updateLine(
                                                        selectedIndex,
                                                        'rate',
                                                        numberValue(e.target.value),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </Field>
                                    </div>
                                </Section>
                            )}

                            {selectedLine.mode === 'Other' && (
                                <Section title="Other Service Details">
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="Package / Particulars" className="md:col-span-2">
                                            <input value={selectedLine.package} onChange={(e) => updateLine(selectedIndex, 'package', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Customer Sale / Rate">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={selectedLine.rate}
                                                onChange={(e) => updateLine(selectedIndex, 'rate', numberValue(e.target.value))}
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field label="Quantity">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={selectedLine.quantity}
                                                onChange={(e) => updateLine(selectedIndex, 'quantity', numberValue(e.target.value))}
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field label="Starting Date">
                                            <input type="date" value={selectedLine.starting_date} onChange={(e) => updateLine(selectedIndex, 'starting_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Ending Date">
                                            <input type="date" value={selectedLine.ending_date} onChange={(e) => updateLine(selectedIndex, 'ending_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Documents">
                                            <input value={selectedLine.documents} onChange={(e) => updateLine(selectedIndex, 'documents', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Online Date">
                                            <input type="date" value={selectedLine.online_date} onChange={(e) => updateLine(selectedIndex, 'online_date', e.target.value)} className={inputClass} />
                                        </Field>
                                        <Field label="Other Service">
                                            <input type="number" step="0.0001" value={selectedLine.other_service_charges} onChange={(e) => updateLine(selectedIndex, 'other_service_charges', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Discount">
                                            <input type="number" step="0.0001" value={selectedLine.discount} onChange={(e) => updateLine(selectedIndex, 'discount', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                    </div>
                                </Section>
                            )}

                            <Section title="Payable / Vendor / Client" icon={<WalletCards className="h-4 w-4" />}>
                                {selectedLine.mode === 'Hotel' ? (
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <Field label="Hotel Vendor / Payable *" className="md:col-span-2">
                                            <SearchableSelect
                                                value={selectedLine.payable_account_code}
                                                onChange={(value) => updateLine(selectedIndex, 'payable_account_code', value)}
                                                options={vendorOptions}
                                                placeholder="Search vendor..."
                                                searchPlaceholder="Vendor code or name..."
                                            />
                                        </Field>
                                        <Field label="Rate / Night (Buy)">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={selectedLine.vendor_rate_per_night}
                                                onChange={(e) => updateLine(selectedIndex, 'vendor_rate_per_night', numberValue(e.target.value))}
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field label="Payable Total">
                                            <input
                                                value={money(hotelVendorTotal(selectedLine))}
                                                readOnly
                                                className={`${inputClass} bg-muted font-semibold`}
                                            />
                                        </Field>
                                        <Field label="Vendor 2 Account">
                                            <SearchableSelect
                                                value={selectedLine.payable_account_2}
                                                onChange={(value) => updateLine(selectedIndex, 'payable_account_2', value)}
                                                options={vendorOptions}
                                                placeholder="Optional vendor 2"
                                                searchPlaceholder="Search vendor..."
                                            />
                                        </Field>
                                        <Field label="Vendor 2 Amount">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.vendor_amount_2} onChange={(e) => updateLine(selectedIndex, 'vendor_amount_2', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Vendor 3 Account">
                                            <SearchableSelect
                                                value={selectedLine.payable_account_3}
                                                onChange={(value) => updateLine(selectedIndex, 'payable_account_3', value)}
                                                options={vendorOptions}
                                                placeholder="Optional vendor 3"
                                                searchPlaceholder="Search vendor..."
                                            />
                                        </Field>
                                        <Field label="Vendor 3 Amount">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.vendor_amount_3} onChange={(e) => updateLine(selectedIndex, 'vendor_amount_3', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field label="Payable Account *">
                                            <SearchableSelect
                                                value={selectedLine.payable_account_code}
                                                onChange={(value) => updateLine(selectedIndex, 'payable_account_code', value)}
                                                options={vendorOptions}
                                                placeholder="Search vendor..."
                                                searchPlaceholder="Vendor code or name..."
                                            />
                                        </Field>
                                        <Field label="Vendor Amount">
                                            <input type="number" min="0" step="0.0001" value={selectedLine.vendor_amount} onChange={(e) => updateLine(selectedIndex, 'vendor_amount', numberValue(e.target.value))} className={inputClass} />
                                        </Field>
                                        <Field label="Vendor Amount 2">
                                            <div className="flex gap-2">
                                                <SearchableSelect value={selectedLine.payable_account_2} onChange={(value) => updateLine(selectedIndex, 'payable_account_2', value)} options={vendorOptions} placeholder="Vendor 2" searchPlaceholder="Search vendor..." />
                                                <input type="number" min="0" step="0.0001" value={selectedLine.vendor_amount_2} onChange={(e) => updateLine(selectedIndex, 'vendor_amount_2', numberValue(e.target.value))} className={`${inputClass} w-32`} />
                                            </div>
                                        </Field>
                                        <Field label="Vendor Amount 3">
                                            <div className="flex gap-2">
                                                <SearchableSelect value={selectedLine.payable_account_3} onChange={(value) => updateLine(selectedIndex, 'payable_account_3', value)} options={vendorOptions} placeholder="Vendor 3" searchPlaceholder="Search vendor..." />
                                                <input type="number" min="0" step="0.0001" value={selectedLine.vendor_amount_3} onChange={(e) => updateLine(selectedIndex, 'vendor_amount_3', numberValue(e.target.value))} className={`${inputClass} w-32`} />
                                            </div>
                                        </Field>
                                    </div>
                                )}
                            </Section>

                            <Section title="Receivable / Customer">
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Field label={['Ticket', 'Other'].includes(selectedLine.mode) ? 'Gross Receivable *' : 'Receivable *'}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={['Hotel', 'Transfer', 'Other'].includes(selectedLine.mode) ? lineReceivable(selectedLine) : selectedLine.receivable_amount}
                                            readOnly={['Hotel', 'Transfer', 'Other'].includes(selectedLine.mode)}
                                            onChange={(e) => updateLine(selectedIndex, 'receivable_amount', numberValue(e.target.value))}
                                            className={`${inputClass} font-semibold ${['Hotel', 'Transfer', 'Other'].includes(selectedLine.mode) ? 'bg-muted' : ''}`}
                                        />
                                    </Field>

                                    <Field label="Agent Amount">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.agent_amount}
                                            onChange={(e) => updateLine(selectedIndex, 'agent_amount', numberValue(e.target.value))}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Agent / Commission Account" className="md:col-span-2">
                                        <SearchableSelect
                                            value={selectedLine.agent_code}
                                            onChange={selectAgent}
                                            options={agentOptions}
                                            placeholder="Search agent / client account..."
                                            searchPlaceholder="Account code or name..."
                                        />
                                    </Field>

                                    <Field label="Income / Service Account">
                                        <SearchableSelect
                                            value={selectedLine.revenue_account_code}
                                            onChange={(value) => updateLine(selectedIndex, 'revenue_account_code', value)}
                                            options={incomeOptions}
                                            placeholder="Search income account..."
                                            searchPlaceholder="Account code or name..."
                                        />
                                    </Field>

                                    <Field label="Other Service Charges">
                                        <input type="number" min="0" step="0.0001" value={selectedLine.other_service_charges} onChange={(e) => updateLine(selectedIndex, 'other_service_charges', numberValue(e.target.value))} className={inputClass} />
                                    </Field>

                                    <Field label="PSF">
                                        <input type="number" min="0" step="0.0001" value={selectedLine.psf_amount} onChange={(e) => updateLine(selectedIndex, 'psf_amount', numberValue(e.target.value))} className={inputClass} />
                                    </Field>

                                    <Field label="Discount">
                                        <input type="number" min="0" step="0.0001" value={selectedLine.discount} onChange={(e) => updateLine(selectedIndex, 'discount', numberValue(e.target.value))} className={inputClass} />
                                    </Field>
                                </div>

                                {selectedLine.mode === 'Ticket' && (
                                    <div className="mt-4 rounded-lg border border-dashed p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="font-medium">Ticket customer-side total</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Base sale {money(ticketBaseSale(selectedLine))} + agent commission {money(numberValue(selectedLine.agent_amount))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Receivable</div>
                                                <div className="text-lg font-semibold">{money(lineReceivable(selectedLine))}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedLine.mode === 'Other' && (
                                    <div className="mt-4 rounded-lg border border-dashed p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="font-medium">Other service customer-side total</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Base sale {money(otherBaseSale(selectedLine))} + agent commission {money(numberValue(selectedLine.agent_amount))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Receivable</div>
                                                <div className="text-lg font-semibold">{money(lineReceivable(selectedLine))}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedLine.mode === 'Hotel' && (
                                    <div className="mt-4 rounded-lg border border-dashed p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="font-medium">Customer-side total</div>
                                                <div className="text-xs text-muted-foreground">Sale total {money(hotelSellingTotal(selectedLine))} + agent commission {money(numberValue(selectedLine.agent_amount))}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Receivable</div>
                                                <div className="text-lg font-semibold">{money(lineReceivable(selectedLine))}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="Commission & Charges"
                                icon={<Percent className="size-4" />}
                            >
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Field label="Com. Receivable">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.commission_receivable}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'commission_receivable',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Com. Paid">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.commission_paid}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'commission_paid',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Com. to Client">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.commission_to_client}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'commission_to_client',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Other Service Charges">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.other_service_charges}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'other_service_charges',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Insurance">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.insurance}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'insurance',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Discount">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={selectedLine.discount}
                                            onChange={(event) =>
                                                updateLine(
                                                    selectedIndex,
                                                    'discount',
                                                    numberValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </Section>

                            {lines.length > 1 && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => removeLine(selectedIndex)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" /> Remove Selected Line
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <WalletCards className="size-4" />
                                    Foreign Currency
                                </div>
                                <div className="mt-4 grid gap-3">
                                    <Field label="Currency">
                                        <select value={selectedLine.currency_code} onChange={(e) => updateLine(selectedIndex, 'currency_code', e.target.value)} className={selectClass}>
                                            <option value="">Base Currency / None</option>
                                            {master.currencies.map((currency) => (
                                                <option key={currency.code} value={currency.code}>
                                                    {currency.code} — {currency.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="ROE / Currency Rate">
                                        <input type="number" min="0" step="0.000001" value={selectedLine.currency_rate ?? ''} onChange={(e) => updateLine(selectedIndex, 'currency_rate', e.target.value === '' ? null : numberValue(e.target.value))} className={inputClass} />
                                    </Field>
                                </div>
                                {selectedLine.currency_code && numberValue(selectedLine.currency_rate) > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border p-2">
                                            <div className="text-muted-foreground">Receivable</div>
                                            <div className="mt-1 font-semibold">{selectedProfit.currency} {money(selectedProfit.foreignReceivable)}</div>
                                        </div>
                                        <div className="rounded-lg border p-2">
                                            <div className="text-muted-foreground">Payable</div>
                                            <div className="mt-1 font-semibold">{selectedProfit.currency} {money(selectedProfit.foreignPayable)}</div>
                                        </div>
                                        <div className="col-span-2 rounded-lg border p-2">
                                            <div className="text-muted-foreground">Profit</div>
                                            <div className={`mt-1 text-sm font-semibold ${selectedProfit.foreignProfit < 0 ? 'text-destructive' : ''}`}>{selectedProfit.currency} {money(selectedProfit.foreignProfit)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Calculator className="size-4" />
                                    Live Profit Calculator
                                </div>

                                <div className="mt-4 grid gap-3">
                                    <div className="rounded-lg border p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
{selectedLine?.mode === 'Ticket' ? 'Ticket Sale − Ticket Cost' : 'Hotel Sale − Hotel Cost'}
                                        </div>
                                        <div className="mt-1 text-xl font-semibold">
                                            {money(selectedProfit.profit)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Base currency profit
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Foreign Profit
                                        </div>
                                        <div className="mt-1 text-lg font-semibold">
                                            {selectedProfit.currency && selectedProfit.roe > 0
                                                ? `${selectedProfit.currency} ${money(selectedProfit.foreignProfit)}`
                                                : '—'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ROE {selectedProfit.roe > 0 ? selectedProfit.roe : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <div className="text-sm font-semibold">Invoice Totals</div>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Payable</span>
                                        <span className="font-semibold">{money(totals.payable)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-muted-foreground">Receivable</span>
                                        <span className="font-semibold">{money(totals.receivable)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                                        <span className="text-sm font-medium">Profit</span>
                                        <span className={`text-xl font-semibold ${totals.profit < 0 ? 'text-destructive' : ''}`}>
                                            {money(totals.profit)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <div className="text-sm font-semibold">Selected Transaction</div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Mode</span>
                                        <span>{selectedLine.mode}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Passenger</span>
                                        <span className="max-w-[165px] text-right">{selectedLine.passenger_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Vendor</span>
                                        <span className="max-w-[165px] text-right">{selectedLine.payable_account_code || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Receivable</span>
                                        <span>{money(selectedProfit.receivable)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Payable</span>
                                        <span>{money(selectedProfit.payable)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end gap-3 border-t pt-4 sm:flex-row">
                        <Link
                            href="/invoices"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <button
                            type="submit"
                            disabled={busy}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />
                            {busy ? 'Saving...' : formMode === 'create' ? 'Save Invoice' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
