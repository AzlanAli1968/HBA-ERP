import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    CreditCard,
    Image as ImageIcon,
    Plus,
    Save,
    Trash2,
    Upload,
    X,
    MessageCircle,
    RefreshCw,
    LogOut,
    Wifi,
    WifiOff,
    QrCode,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';

type CompanySettings = {
    id: number;
    company_name: string;
    tagline: string;
    address: string;
    phone: string;
    mobile: string;
    email: string;
    website: string;
    govt_license: string;
    ntn: string;

    document_notes: string;
    document_footer: string;

    base_currency_code: string;
    decimal_places: number;
    paper_size: 'A4' | 'A5' | 'Letter';
    print_orientation: 'portrait' | 'landscape';

    show_company_header: boolean;
    show_address: boolean;
    show_phone: boolean;
    show_email: boolean;
    show_website: boolean;
    show_govt_license: boolean;
    show_ntn: boolean;
    show_qr: boolean;

    logo_url: string | null;
    qr_url: string | null;
};

type Bank = {
    id: number;
    label: string;
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
    branch_name: string;
    swift_code: string;
    currency_code: string;
    is_active: boolean;
    show_on_documents: boolean;
    sort_order: number;
    logo_url: string | null;
};

type BankFormData = {
    _method: 'POST' | 'PUT';
    label: string;
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
    branch_name: string;
    swift_code: string;
    currency_code: string;
    is_active: boolean;
    show_on_documents: boolean;
    sort_order: number;
    logo: File | null;
    remove_logo: boolean;
};

type Props = {
    settings: CompanySettings;
    banks: Bank[];
};

type WhatsAppGroup = {
    jid: string;
    name: string;
    participants: number;
};

type WhatsAppStatus = {
    ok: boolean;
    service?: string;
    state:
        | 'disconnected'
        | 'connecting'
        | 'qr'
        | 'connected'
        | 'reconnecting'
        | 'logged_out'
        | 'error'
        | string;
    connected: boolean;
    message: string;
    qr?: string | null;
    selectedGroup?: {
        jid: string;
        name: string;
    } | null;
    groupCount?: number;
};

type WhatsAppApiResult = {
    ok: boolean;
    message?: string;
    groups?: WhatsAppGroup[];
    selectedGroup?: {
        jid: string;
        name: string;
    };
};

function FieldLabel({
    children,
    htmlFor,
}: {
    children: React.ReactNode;
    htmlFor: string;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="mb-1.5 block text-sm font-medium text-foreground"
        >
            {children}
        </label>
    );
}

function InputError({
    message,
}: {
    message?: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-xs text-destructive">
            {message}
        </p>
    );
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3">
            <span className="text-sm font-medium">
                {label}
            </span>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={[
                    'relative h-6 w-11 rounded-full transition',
                    checked
                        ? 'bg-foreground'
                        : 'bg-muted',
                ].join(' ')}
            >
                <span
                    className={[
                        'absolute top-1 size-4 rounded-full bg-white transition',
                        checked
                            ? 'left-6'
                            : 'left-1',
                    ].join(' ')}
                />
            </button>
        </label>
    );
}


function Checkbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background px-4 py-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="size-4 rounded border"
            />
            <span className="text-sm font-medium">{label}</span>
        </label>
    );
}

function PreviewHeader({
    settings,
    logoPreview,
    qrPreview,
    banks,
}: {
    settings: CompanySettings;
    logoPreview: string | null;
    qrPreview: string | null;
    banks: Bank[];
}) {
    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">
                            Live Document Preview
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Changes appear here immediately. Saved changes are then used by
                            invoices, vouchers, print and PDF documents.
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Live
                    </span>
                </div>
            </div>

            <div className="p-6">
                {settings.show_company_header ? (
                    <div className="border-b border-black pb-4">
                        <div className="grid grid-cols-[110px_1fr_90px] items-start gap-4">
                            <div className="flex min-h-16 items-start justify-start">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Company logo"
                                        className="max-h-16 max-w-28 object-contain"
                                    />
                                ) : (
                                    <div className="text-2xl font-bold tracking-tight">
                                        HBA
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <div className="text-xl font-bold leading-tight">
                                    {settings.company_name ||
                                        'HBA TRAVEL & TOURS'}
                                </div>

                                {settings.tagline && (
                                    <div className="mt-1 text-xs">
                                        {settings.tagline}
                                    </div>
                                )}

                                <div className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-muted-foreground">
                                    {settings.show_address &&
                                        settings.address && (
                                            <div>
                                                {settings.address}
                                            </div>
                                        )}

                                    {settings.show_phone &&
                                        (settings.phone ||
                                            settings.mobile) && (
                                            <div>
                                                {settings.phone &&
                                                    `Phone: ${settings.phone}`}
                                                {settings.phone &&
                                                    settings.mobile &&
                                                    ', '}
                                                {settings.mobile &&
                                                    `Mobile: ${settings.mobile}`}
                                            </div>
                                        )}

                                    {settings.show_email &&
                                        settings.email && (
                                            <span>
                                                E-Mail: {settings.email}
                                            </span>
                                        )}

                                    {settings.show_email &&
                                        settings.email &&
                                        settings.show_website &&
                                        settings.website && (
                                            <span>{', '}</span>
                                        )}

                                    {settings.show_website &&
                                        settings.website && (
                                            <span>
                                                Website: {settings.website}
                                            </span>
                                        )}

                                    {(settings.show_email &&
                                        settings.email) ||
                                    (settings.show_website &&
                                        settings.website) ? (
                                        <br />
                                    ) : null}

                                    {settings.show_govt_license &&
                                        settings.govt_license && (
                                            <span>
                                                Govt Lic No:{' '}
                                                {settings.govt_license}
                                            </span>
                                        )}

                                    {settings.show_govt_license &&
                                        settings.govt_license &&
                                        settings.show_ntn &&
                                        settings.ntn && (
                                            <span>{', '}</span>
                                        )}

                                    {settings.show_ntn &&
                                        settings.ntn && (
                                            <span>
                                                NTN: {settings.ntn}
                                            </span>
                                        )}
                                </div>
                            </div>

                            <div className="flex min-h-16 items-start justify-end">
                                {settings.show_qr && qrPreview ? (
                                    <img
                                        src={qrPreview}
                                        alt="QR"
                                        className="size-16 object-contain"
                                    />
                                ) : (
                                    <div className="flex size-16 items-center justify-center rounded-lg border border-dashed text-[10px] text-muted-foreground">
                                        QR
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Company header is disabled.
                    </div>
                )}

                <div className="mt-5 border-t pt-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Document Notes Preview
                    </div>
                    <div className="mt-2 whitespace-pre-line text-[10px] leading-5 text-foreground">
                        {settings.document_notes?.trim()
                            ? settings.document_notes
                            : 'No document notes configured.'}
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Document Footer Preview
                        </div>
                        <div className="mt-2 rounded-lg border bg-muted/20 px-3 py-2.5 text-center text-[10px] leading-5">
                            {settings.document_footer?.trim()
                                ? settings.document_footer
                                : 'No document footer configured.'}
                        </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Bank Details Preview
                        </div>
                        <div className="mt-2 space-y-2">
                            {banks.filter((bank) =>
                                bank.is_active && bank.show_on_documents,
                            ).length === 0 ? (
                                <div className="rounded-lg border border-dashed p-3 text-[10px] text-muted-foreground">
                                    No active bank accounts selected for documents.
                                </div>
                            ) : (
                                banks
                                    .filter((bank) =>
                                        bank.is_active && bank.show_on_documents,
                                    )
                                    .map((bank) => (
                                        <div
                                            key={bank.id}
                                            className="flex items-center gap-3 rounded-lg border p-3"
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                {bank.logo_url ? (
                                                    <img
                                                        src={bank.logo_url}
                                                        alt={bank.bank_name}
                                                        className="max-h-8 max-w-8 object-contain"
                                                    />
                                                ) : (
                                                    <CreditCard className="size-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-[10px] font-semibold">
                                                    {bank.bank_name}
                                                </div>
                                                {bank.account_title && (
                                                    <div className="truncate text-[9px] text-muted-foreground">
                                                        {bank.account_title}
                                                    </div>
                                                )}
                                                <div className="truncate text-[9px] text-muted-foreground">
                                                    {bank.iban || bank.account_number || 'Account details not configured'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BankEditor({
    bank,
}: {
    bank: Bank | null;
}) {
    const form = useForm<BankFormData>({
        _method: bank ? 'PUT' : 'POST',
        label: bank?.label ?? '',
        bank_name: bank?.bank_name ?? '',
        account_title: bank?.account_title ?? '',
        account_number: bank?.account_number ?? '',
        iban: bank?.iban ?? '',
        branch_name: bank?.branch_name ?? '',
        swift_code: bank?.swift_code ?? '',
        currency_code: bank?.currency_code ?? '',
        is_active: bank?.is_active ?? true,
        show_on_documents: bank?.show_on_documents ?? true,
        sort_order: bank?.sort_order ?? 0,
        logo: null,
        remove_logo: false,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(
        bank?.logo_url ?? null,
    );

    useEffect(() => {
        if (!form.data.logo) {
            setLogoPreview(bank?.logo_url ?? null);
            return;
        }

        const url = URL.createObjectURL(form.data.logo);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.logo, bank?.logo_url]);

    function save(): void {
        const url = bank
            ? `/admin/settings/banks/${bank.id}`
            : '/admin/settings/banks';

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function chooseLogo(event: ChangeEvent<HTMLInputElement>): void {
        form.setData('logo', event.target.files?.[0] ?? null);
        form.setData('remove_logo', false);
    }

    function removeLogo(): void {
        form.setData('logo', null);
        form.setData('remove_logo', true);
        setLogoPreview(null);
    }

    function removeBank(): void {
        if (!bank) return;

        if (!window.confirm(`Remove ${bank.bank_name} from company bank details?`)) {
            return;
        }

        router.delete(`/admin/settings/banks/${bank.id}`, {
            preserveScroll: true,
        });
    }

    const fieldClass =
        'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-ring/20';

    return (
        <div className="rounded-2xl border bg-muted/10 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">
                        {bank ? bank.bank_name : 'New Bank Account'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {bank
                            ? 'Update this account and its document display settings.'
                            : 'Add another company bank account.'}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={save}
                        disabled={form.processing}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-50"
                    >
                        <Save className="size-3.5" />
                        {form.processing
                            ? 'Saving...'
                            : bank
                              ? 'Save Bank'
                              : 'Add Bank'}
                    </button>

                    {bank && (
                        <button
                            type="button"
                            onClick={removeBank}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium text-destructive hover:bg-destructive/5"
                        >
                            <Trash2 className="size-3.5" />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {Object.keys(form.errors).length > 0 && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {Object.values(form.errors).join(' ')}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <FieldLabel htmlFor={`bank-label-${bank?.id ?? 'new'}`}>
                        Account Label
                    </FieldLabel>
                    <input
                        id={`bank-label-${bank?.id ?? 'new'}`}
                        value={form.data.label}
                        onChange={(e) => form.setData('label', e.target.value)}
                        placeholder="e.g. PKR Account"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`bank-name-${bank?.id ?? 'new'}`}>
                        Bank Name *
                    </FieldLabel>
                    <input
                        id={`bank-name-${bank?.id ?? 'new'}`}
                        value={form.data.bank_name}
                        onChange={(e) => form.setData('bank_name', e.target.value)}
                        placeholder="Bank name"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`account-title-${bank?.id ?? 'new'}`}>
                        Account Title
                    </FieldLabel>
                    <input
                        id={`account-title-${bank?.id ?? 'new'}`}
                        value={form.data.account_title}
                        onChange={(e) => form.setData('account_title', e.target.value)}
                        placeholder="Account holder / company name"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`account-number-${bank?.id ?? 'new'}`}>
                        Account Number
                    </FieldLabel>
                    <input
                        id={`account-number-${bank?.id ?? 'new'}`}
                        value={form.data.account_number}
                        onChange={(e) => form.setData('account_number', e.target.value)}
                        placeholder="Account number"
                        className={fieldClass}
                    />
                </label>

                <label className="block md:col-span-2">
                    <FieldLabel htmlFor={`iban-${bank?.id ?? 'new'}`}>
                        IBAN
                    </FieldLabel>
                    <input
                        id={`iban-${bank?.id ?? 'new'}`}
                        value={form.data.iban}
                        onChange={(e) => form.setData('iban', e.target.value)}
                        placeholder="IBAN"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`branch-${bank?.id ?? 'new'}`}>
                        Branch
                    </FieldLabel>
                    <input
                        id={`branch-${bank?.id ?? 'new'}`}
                        value={form.data.branch_name}
                        onChange={(e) => form.setData('branch_name', e.target.value)}
                        placeholder="Branch / location"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`swift-${bank?.id ?? 'new'}`}>
                        SWIFT / BIC
                    </FieldLabel>
                    <input
                        id={`swift-${bank?.id ?? 'new'}`}
                        value={form.data.swift_code}
                        onChange={(e) => form.setData('swift_code', e.target.value)}
                        placeholder="SWIFT / BIC"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`currency-${bank?.id ?? 'new'}`}>
                        Currency
                    </FieldLabel>
                    <input
                        id={`currency-${bank?.id ?? 'new'}`}
                        value={form.data.currency_code}
                        onChange={(e) => form.setData('currency_code', e.target.value)}
                        placeholder="PKR / SAR / USD"
                        className={fieldClass}
                    />
                </label>

                <label className="block">
                    <FieldLabel htmlFor={`sort-${bank?.id ?? 'new'}`}>
                        Display Order
                    </FieldLabel>
                    <input
                        id={`sort-${bank?.id ?? 'new'}`}
                        type="number"
                        min={0}
                        value={form.data.sort_order}
                        onChange={(e) =>
                            form.setData('sort_order', Number(e.target.value))
                        }
                        className={fieldClass}
                    />
                </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                <div>
                    <FieldLabel htmlFor={`bank-logo-${bank?.id ?? 'new'}`}>
                        Bank Logo
                    </FieldLabel>
                    <div className="flex h-28 items-center justify-center rounded-xl border bg-background p-3">
                        {logoPreview ? (
                            <img
                                src={logoPreview}
                                alt={`${form.data.bank_name || 'Bank'} logo`}
                                className="max-h-20 max-w-32 object-contain"
                            />
                        ) : (
                            <CreditCard className="size-8 text-muted-foreground" />
                        )}
                    </div>
                    <label className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted">
                        <Upload className="size-3.5" />
                        Choose Logo
                        <input
                            id={`bank-logo-${bank?.id ?? 'new'}`}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={chooseLogo}
                            className="hidden"
                        />
                    </label>
                    {logoPreview && (
                        <button
                            type="button"
                            onClick={removeLogo}
                            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                        >
                            <X className="size-3.5" />
                            Remove Logo
                        </button>
                    )}
                </div>

                <div className="grid content-start gap-3 sm:grid-cols-2">
                    <Checkbox
                        label="Active"
                        checked={form.data.is_active}
                        onChange={(event) =>
                            form.setData('is_active', event.target.checked)
                        }
                    />
                    <Checkbox
                        label="Show on invoices & vouchers"
                        checked={form.data.show_on_documents}
                        onChange={(event) =>
                            form.setData(
                                'show_on_documents',
                                event.target.checked,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}

const WHATSAPP_BOT_URL = () =>
    `http://${window.location.hostname}:3210`;

function WhatsAppBotPanel() {
    const [status, setStatus] = useState<WhatsAppStatus | null>(null);
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [selectedGroupJid, setSelectedGroupJid] = useState('');
    const [loading, setLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function requestJson<T extends { ok: boolean; message?: string }>(
        path: string,
        options?: RequestInit,
    ): Promise<T> {
        const response = await fetch(`${WHATSAPP_BOT_URL()}${path}`, {
            ...options,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(options?.headers ?? {}),
            },
            cache: 'no-store',
        });

        let payload: T | null = null;
        try {
            payload = (await response.json()) as T;
        } catch {
            payload = null;
        }

        if (!response.ok || !payload?.ok) {
            throw new Error(
                payload?.message ||
                    `WhatsApp service returned HTTP ${response.status}.`,
            );
        }

        return payload;
    }

    async function loadStatus(showFailure = false): Promise<void> {
        try {
            const response = await fetch(`${WHATSAPP_BOT_URL()}/status`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const payload = (await response.json()) as WhatsAppStatus;

            setStatus(payload);
            setError('');
        } catch (requestError) {
            if (showFailure) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : 'Unable to connect to the WhatsApp service.',
                );
            }
            setStatus(null);
        }
    }

    async function loadGroups(): Promise<void> {
        setGroupsLoading(true);
        setError('');
        try {
            const payload = await requestJson<WhatsAppApiResult>('/groups');
            setGroups(payload.groups ?? []);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to load WhatsApp groups.',
            );
        } finally {
            setGroupsLoading(false);
        }
    }

    async function startBot(): Promise<void> {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const response = await requestJson<WhatsAppStatus>('/start', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setStatus(response);
            setSelectedGroupJid(response.selectedGroup?.jid ?? '');
            setNotice(response.message || 'WhatsApp service started.');
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to start the WhatsApp service.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function refreshGroups(): Promise<void> {
        setGroupsLoading(true);
        setError('');
        setNotice('');
        try {
            const payload = await requestJson<WhatsAppApiResult>('/refresh-groups', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setGroups(payload.groups ?? []);
            setNotice(`Found ${(payload.groups ?? []).length} joined group(s).`);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to refresh WhatsApp groups.',
            );
        } finally {
            setGroupsLoading(false);
        }
    }

    async function saveSelectedGroup(): Promise<void> {
        if (!selectedGroupJid) {
            setError('Select a WhatsApp group first.');
            return;
        }

        setLoading(true);
        setError('');
        setNotice('');
        try {
            const payload = await requestJson<WhatsAppApiResult>('/select-group', {
                method: 'POST',
                body: JSON.stringify({ jid: selectedGroupJid }),
            });
            const group = payload.selectedGroup;
            if (group) {
                setStatus((current) =>
                    current
                        ? {
                              ...current,
                              selectedGroup: group,
                              message: `Listening only to: ${group.name}`,
                          }
                        : current,
                );
                setNotice(`Bot will read messages only from: ${group.name}`);
            }
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to save the selected group.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function logout(): Promise<void> {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const payload = await requestJson<WhatsAppApiResult>('/logout', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setGroups([]);
            setSelectedGroupJid('');
            setStatus(null);
            setNotice(payload.message || 'WhatsApp logged out.');
            await loadStatus();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to log out of WhatsApp.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function clearSession(): Promise<void> {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const payload = await requestJson<WhatsAppApiResult>('/clear-session', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setGroups([]);
            setSelectedGroupJid('');
            setStatus(null);
            setNotice(payload.message || 'WhatsApp session cache cleared.');
            window.setTimeout(() => {
                void loadStatus(true);
            }, 700);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to clear the WhatsApp session.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        const initialLoad = async () => {
            try {
                const response = await fetch(`${WHATSAPP_BOT_URL()}/status`, {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store',
                });
                if (cancelled) return;
                const payload = (await response.json()) as WhatsAppStatus;
                setStatus(payload);
                setSelectedGroupJid(payload.selectedGroup?.jid ?? '');
                setError('');
            } catch {
                if (!cancelled) {
                    setStatus(null);
                }
            }
        };

        void initialLoad();

        const interval = window.setInterval(() => {
            if (cancelled) return;
            void loadStatus();
        }, 2500);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (status?.connected) {
            void loadGroups();
        }
    }, [status?.connected]);

    const connected = status?.connected === true;
    const qrVisible = status?.state === 'qr' && Boolean(status.qr);

    return (
        <section className="rounded-2xl border bg-background shadow-sm">
            <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                        <MessageCircle className="size-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold">WhatsApp Bot</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Link the WhatsApp account, scan a new QR when needed,
                            and lock the bot to one selected group.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1 text-xs font-medium">
                        {connected ? (
                            <Wifi className="size-3.5" />
                        ) : (
                            <WifiOff className="size-3.5" />
                        )}
                        {connected ? 'Connected' : status?.state ?? 'Service offline'}
                    </span>
                    <button
                        type="button"
                        onClick={() => void startBot()}
                        disabled={loading}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-50"
                    >
                        <RefreshCw className="size-3.5" />
                        {loading ? 'Working...' : 'Start / Refresh'}
                    </button>
                </div>
            </div>

            <div className="space-y-5 p-5">
                {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                        {notice}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                    <div className="rounded-2xl border p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <QrCode className="size-4" />
                            WhatsApp Login
                        </div>

                        <div className="flex min-h-64 items-center justify-center rounded-xl bg-muted/20 p-4">
                            {qrVisible ? (
                                <img
                                    src={status?.qr ?? ''}
                                    alt="Scan WhatsApp QR code"
                                    className="size-60 max-w-full rounded-lg bg-white p-2 object-contain"
                                />
                            ) : connected ? (
                                <div className="text-center">
                                    <Wifi className="mx-auto size-10" />
                                    <p className="mt-3 text-sm font-semibold">
                                        WhatsApp Connected
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        The linked account is ready for group selection.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <QrCode className="mx-auto size-10 text-muted-foreground" />
                                    <p className="mt-3 text-sm font-semibold">
                                        Waiting for QR code
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Start the bot service, then scan the QR shown here.
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            {status?.message ||
                                'The WhatsApp bot service must be running on port 3210.'}
                        </p>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                            <button
                                type="button"
                                onClick={() => void logout()}
                                disabled={loading || !status}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                            >
                                <LogOut className="size-3.5" />
                                Log Out
                            </button>
                            <button
                                type="button"
                                onClick={() => void clearSession()}
                                disabled={loading}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Trash2 className="size-3.5" />
                                Clear Session / New QR
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold">Joined WhatsApp Groups</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    The bot will process messages only from the group saved below.
                                    Messages from all other groups are ignored.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void refreshGroups()}
                                disabled={groupsLoading || !connected}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                            >
                                <RefreshCw className="size-3.5" />
                                Refresh Groups
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <select
                                value={selectedGroupJid}
                                onChange={(event) => setSelectedGroupJid(event.target.value)}
                                disabled={!connected || groupsLoading}
                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                            >
                                <option value="">
                                    {connected
                                        ? groupsLoading
                                            ? 'Loading groups...'
                                            : groups.length
                                              ? 'Select a WhatsApp group...'
                                              : 'No groups found'
                                        : 'Connect WhatsApp first'}
                                </option>
                                {groups.map((group) => (
                                    <option key={group.jid} value={group.jid}>
                                        {group.name} ({group.participants} members)
                                    </option>
                                ))}
                            </select>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => void saveSelectedGroup()}
                                    disabled={loading || !connected || !selectedGroupJid}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <Save className="size-4" />
                                    Save Selected Group
                                </button>

                                {status?.selectedGroup && (
                                    <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">Current group: </span>
                                        <span className="font-semibold">
                                            {status.selectedGroup.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                                <div className="font-semibold text-foreground">How this works</div>
                                <p className="mt-1.5 leading-5">
                                    Join the required group using the linked WhatsApp account,
                                    refresh the list, select one group and save it. Only that
                                    group's JID is accepted by the bot message handler.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function CompanySettingsIndex({
    settings,
    banks,
}: Props) {
    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.logo_url,
    );
    const [qrPreview, setQrPreview] = useState<string | null>(
        settings.qr_url,
    );
    const [showNewBank, setShowNewBank] = useState(false);

    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm({
            _method: 'PUT',
            company_name: settings.company_name,
            tagline: settings.tagline,
            address: settings.address,
            phone: settings.phone,
            mobile: settings.mobile,
            email: settings.email,
            website: settings.website,
            govt_license: settings.govt_license,
            ntn: settings.ntn,

            document_notes: settings.document_notes ?? '',
            document_footer: settings.document_footer ?? '',

            base_currency_code: settings.base_currency_code,
            decimal_places: settings.decimal_places,
            paper_size: settings.paper_size,
            print_orientation: settings.print_orientation,

            show_company_header: settings.show_company_header,
            show_address: settings.show_address,
            show_phone: settings.show_phone,
            show_email: settings.show_email,
            show_website: settings.show_website,
            show_govt_license: settings.show_govt_license,
            show_ntn: settings.show_ntn,
            show_qr: settings.show_qr,

            logo: null as File | null,
            qr: null as File | null,
            remove_logo: false,
            remove_qr: false,
        });

    useEffect(() => {
        if (!data.logo) {
            setLogoPreview(settings.logo_url);
            return;
        }

        const objectUrl = URL.createObjectURL(data.logo);
        setLogoPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.logo, settings.logo_url]);

    useEffect(() => {
        if (!data.qr) {
            setQrPreview(settings.qr_url);
            return;
        }

        const objectUrl = URL.createObjectURL(data.qr);
        setQrPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.qr, settings.qr_url]);

    const reportVisibilityCount = useMemo(
        () =>
            [
                data.show_company_header,
                data.show_address,
                data.show_phone,
                data.show_email,
                data.show_website,
                data.show_govt_license,
                data.show_ntn,
                data.show_qr,
            ].filter(Boolean).length,
        [
            data.show_company_header,
            data.show_address,
            data.show_phone,
            data.show_email,
            data.show_website,
            data.show_govt_license,
            data.show_ntn,
            data.show_qr,
        ],
    );

    function handleLogoChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0] ?? null;
        setData('logo', file);
        setData('remove_logo', false);
    }

    function handleQrChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0] ?? null;
        setData('qr', file);
        setData('remove_qr', false);
    }

    function removeLogo() {
        setData('logo', null);
        setData('remove_logo', true);
        setLogoPreview(null);
    }

    function removeQr() {
        setData('qr', null);
        setData('remove_qr', true);
        setQrPreview(null);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        post('/admin/settings', {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    const inputClass =
        'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-ring/20';

    const textareaClass =
        'min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-ring/20';

    return (
        <>
            <Head title="Company Settings" />

            <div className="min-h-screen bg-muted/10">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Company Profile & Settings
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Manage the company information that appears
                                    across your reports and printable documents.
                                </p>
                            </div>

                            <div className="rounded-xl border bg-background px-3 py-2 text-xs text-muted-foreground">
                                {reportVisibilityCount} report options enabled
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <form
                            onSubmit={submit}
                            className="space-y-6"
                        >
                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Company Identity
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        These values are used throughout the ERP.
                                    </p>
                                </div>

                                <div className="grid gap-4 p-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <FieldLabel htmlFor="company_name">
                                            Company Name
                                        </FieldLabel>
                                        <input
                                            id="company_name"
                                            value={data.company_name}
                                            onChange={(e) =>
                                                setData(
                                                    'company_name',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.company_name} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <FieldLabel htmlFor="tagline">
                                            Tagline
                                        </FieldLabel>
                                        <input
                                            id="tagline"
                                            value={data.tagline}
                                            onChange={(e) =>
                                                setData(
                                                    'tagline',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.tagline} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="base_currency_code">
                                            Base Currency
                                        </FieldLabel>
                                        <input
                                            id="base_currency_code"
                                            value={data.base_currency_code}
                                            onChange={(e) =>
                                                setData(
                                                    'base_currency_code',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className={inputClass}
                                            maxLength={20}
                                        />
                                        <InputError
                                            message={errors.base_currency_code}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="decimal_places">
                                            Decimal Places
                                        </FieldLabel>
                                        <input
                                            id="decimal_places"
                                            type="number"
                                            min={0}
                                            max={4}
                                            value={data.decimal_places}
                                            onChange={(e) =>
                                                setData(
                                                    'decimal_places',
                                                    Number(e.target.value),
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError
                                            message={errors.decimal_places}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Contact & Registration
                                    </h2>
                                </div>

                                <div className="grid gap-4 p-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <FieldLabel htmlFor="address">
                                            Office Address
                                        </FieldLabel>
                                        <textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(e) =>
                                                setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className={textareaClass}
                                        />
                                        <InputError message={errors.address} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="phone">
                                            Phone
                                        </FieldLabel>
                                        <input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="mobile">
                                            Mobile / WhatsApp
                                        </FieldLabel>
                                        <input
                                            id="mobile"
                                            value={data.mobile}
                                            onChange={(e) =>
                                                setData(
                                                    'mobile',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.mobile} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="website">
                                            Website
                                        </FieldLabel>
                                        <input
                                            id="website"
                                            value={data.website}
                                            onChange={(e) =>
                                                setData(
                                                    'website',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.website} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="govt_license">
                                            Government License
                                        </FieldLabel>
                                        <input
                                            id="govt_license"
                                            value={data.govt_license}
                                            onChange={(e) =>
                                                setData(
                                                    'govt_license',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError
                                            message={errors.govt_license}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="ntn">
                                            NTN
                                        </FieldLabel>
                                        <input
                                            id="ntn"
                                            value={data.ntn}
                                            onChange={(e) =>
                                                setData(
                                                    'ntn',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        <InputError message={errors.ntn} />
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Report Branding
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Upload the real HBA logo used on printable
                                        documents.
                                    </p>
                                </div>

                                <div className="grid gap-6 p-5 md:grid-cols-2">
                                    <div>
                                        <div className="mb-2 text-sm font-medium">
                                            Company Logo
                                        </div>

                                        <div className="rounded-2xl border border-dashed p-4">
                                            <div className="flex min-h-36 items-center justify-center rounded-xl bg-muted/20 p-4">
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="Company logo preview"
                                                        className="max-h-28 max-w-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="mx-auto size-8 text-muted-foreground" />
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            No logo selected
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background">
                                                    <Upload className="size-4" />
                                                    Choose Logo
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        className="hidden"
                                                        onChange={handleLogoChange}
                                                    />
                                                </label>

                                                {logoPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={removeLogo}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                                                    >
                                                        <X className="size-4" />
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <p className="mt-2 text-xs text-muted-foreground">
                                                PNG, JPG or WEBP. Maximum 4 MB.
                                            </p>

                                            <InputError message={errors.logo} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 text-sm font-medium">
                                            Report QR Code
                                        </div>

                                        <div className="rounded-2xl border border-dashed p-4">
                                            <div className="flex min-h-36 items-center justify-center rounded-xl bg-muted/20 p-4">
                                                {qrPreview ? (
                                                    <img
                                                        src={qrPreview}
                                                        alt="QR preview"
                                                        className="size-32 object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="mx-auto flex size-16 items-center justify-center rounded-lg border text-sm font-semibold text-muted-foreground">
                                                            QR
                                                        </div>
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Optional
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted">
                                                    <Upload className="size-4" />
                                                    Choose QR
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        className="hidden"
                                                        onChange={handleQrChange}
                                                    />
                                                </label>

                                                {qrPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={removeQr}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                                                    >
                                                        <X className="size-4" />
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <InputError message={errors.qr} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Document Notes & Footer
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        These saved texts can be used on invoice and service-voucher print/PDF layouts.
                                    </p>
                                </div>

                                <div className="grid gap-4 p-5 md:grid-cols-2">
                                    <div>
                                        <FieldLabel htmlFor="document_notes">
                                            Document Notes
                                        </FieldLabel>
                                        <textarea
                                            id="document_notes"
                                            value={data.document_notes}
                                            onChange={(e) =>
                                                setData(
                                                    'document_notes',
                                                    e.target.value,
                                                )
                                            }
                                            rows={8}
                                            maxLength={5000}
                                            placeholder="Example: booking terms, cancellation notes, reconfirmation instructions"
                                            className={textareaClass}
                                        />
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            General notes or terms for printed documents.
                                        </p>
                                        <InputError message={errors.document_notes} />
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="document_footer">
                                            Document Footer
                                        </FieldLabel>
                                        <textarea
                                            id="document_footer"
                                            value={data.document_footer}
                                            onChange={(e) =>
                                                setData(
                                                    'document_footer',
                                                    e.target.value,
                                                )
                                            }
                                            rows={8}
                                            maxLength={5000}
                                            placeholder="Example: Thank you for choosing HBA Travel & Tours | www.hbatravels.org"
                                            className={textareaClass}
                                        />
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            Text for the bottom/footer area of printed documents.
                                        </p>
                                        <InputError message={errors.document_footer} />
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-muted p-2">
                                            <CreditCard className="size-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold">
                                                Bank Details
                                            </h2>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Add multiple company bank accounts. Each account can have its own logo and document visibility.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowNewBank((current) => !current)}
                                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted"
                                    >
                                        <Plus className="size-3.5" />
                                        {showNewBank ? 'Close' : 'Add Bank'}
                                    </button>
                                </div>

                                <div className="space-y-4 p-5">
                                    {showNewBank && <BankEditor bank={null} />}

                                    {banks.length === 0 ? (
                                        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            No bank accounts added yet. Click <strong>Add Bank</strong> to create the first one.
                                        </div>
                                    ) : (
                                        banks.map((bank) => (
                                            <BankEditor key={bank.id} bank={bank} />
                                        ))
                                    )}
                                </div>
                            </section>

                            <WhatsAppBotPanel />

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Report Visibility
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Control which company details are shown
                                        in report headers.
                                    </p>
                                </div>

                                <div className="grid gap-3 p-5 sm:grid-cols-2">
                                    <Toggle
                                        checked={data.show_company_header}
                                        onChange={(value) =>
                                            setData(
                                                'show_company_header',
                                                value,
                                            )
                                        }
                                        label="Company Header"
                                    />
                                    <Toggle
                                        checked={data.show_address}
                                        onChange={(value) =>
                                            setData('show_address', value)
                                        }
                                        label="Address"
                                    />
                                    <Toggle
                                        checked={data.show_phone}
                                        onChange={(value) =>
                                            setData('show_phone', value)
                                        }
                                        label="Phone / Mobile"
                                    />
                                    <Toggle
                                        checked={data.show_email}
                                        onChange={(value) =>
                                            setData('show_email', value)
                                        }
                                        label="Email"
                                    />
                                    <Toggle
                                        checked={data.show_website}
                                        onChange={(value) =>
                                            setData('show_website', value)
                                        }
                                        label="Website"
                                    />
                                    <Toggle
                                        checked={data.show_govt_license}
                                        onChange={(value) =>
                                            setData(
                                                'show_govt_license',
                                                value,
                                            )
                                        }
                                        label="Government License"
                                    />
                                    <Toggle
                                        checked={data.show_ntn}
                                        onChange={(value) =>
                                            setData('show_ntn', value)
                                        }
                                        label="NTN"
                                    />
                                    <Toggle
                                        checked={data.show_qr}
                                        onChange={(value) =>
                                            setData('show_qr', value)
                                        }
                                        label="QR Code"
                                    />
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <h2 className="font-semibold">
                                        Print Defaults
                                    </h2>
                                </div>

                                <div className="grid gap-4 p-5 sm:grid-cols-2">
                                    <div>
                                        <FieldLabel htmlFor="paper_size">
                                            Paper Size
                                        </FieldLabel>
                                        <select
                                            id="paper_size"
                                            value={data.paper_size}
                                            onChange={(e) =>
                                                setData(
                                                    'paper_size',
                                                    e.target.value as CompanySettings['paper_size'],
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="A4">A4</option>
                                            <option value="A5">A5</option>
                                            <option value="Letter">
                                                Letter
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <FieldLabel htmlFor="print_orientation">
                                            Print Orientation
                                        </FieldLabel>
                                        <select
                                            id="print_orientation"
                                            value={data.print_orientation}
                                            onChange={(e) =>
                                                setData(
                                                    'print_orientation',
                                                    e.target.value as CompanySettings['print_orientation'],
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="portrait">
                                                Portrait
                                            </option>
                                            <option value="landscape">
                                                Landscape
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col-reverse gap-3 rounded-2xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Saved settings are used on new report loads.
                                </div>

                                <div className="flex items-center gap-3">
                                    {recentlySuccessful && (
                                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                            <CheckCircle2 className="size-4" />
                                            Saved
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <Save className="size-4" />
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="xl:sticky xl:top-6 xl:self-start">
                            <PreviewHeader
                                settings={{ ...settings, ...data }}
                                logoPreview={logoPreview}
                                qrPreview={qrPreview}
                                banks={banks}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
