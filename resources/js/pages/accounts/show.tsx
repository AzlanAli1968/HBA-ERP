import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ChevronDown,
    Landmark,
    MapPin,
    Phone,
    Save,
    User,
    Wallet,
} from 'lucide-react';
import {
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';

type AccountType = {
    id: number;
    code: string;
    name: string;
};

type Account = {
    id: number;
    code: string;
    name: string;

    client_type: string | null;
    branch: string;
    city_category: string | null;
    care_of_employee: string | null;

    contact: string | null;
    designation: string | null;
    mobile: string | null;
    contact_2: string | null;
    designation_2: string | null;
    company: string | null;

    business_phone: string | null;
    home_phone: string | null;
    fax: string | null;
    email: string | null;
    address: string | null;
    country: string | null;
    website: string | null;

    credit_limit: string;
    credit_days: number;

    bank_name: string | null;
    bank_branch: string | null;
    bank_account_number: string | null;

    tax_type: string | null;
    tax_number: string | null;
    strn: string | null;

    opening_debit: string;
    opening_credit: string;
    opening_date: string | null;

    is_active: boolean;

    accountType?: AccountType | null;

    creator?: {
        id: number;
        name: string;
    } | null;
};

type Props = {
    account: Account;
    accountTypes: AccountType[];
};

type FormState = {
    client_type: string;
    name: string;
    account_type_id: string;

    city_category: string;
    care_of_employee: string;

    contact: string;
    designation: string;
    mobile: string;
    contact_2: string;
    designation_2: string;
    company: string;

    business_phone: string;
    home_phone: string;
    fax: string;
    email: string;
    address: string;
    country: string;
    website: string;

    credit_limit: string;
    credit_days: string;

    bank_name: string;
    bank_branch: string;
    bank_account_number: string;

    tax_type: string;
    tax_number: string;
    strn: string;
};

function nullable(
    value: string | null | undefined,
): string {
    return value ?? '';
}

function createForm(
    account: Account,
): FormState {
    return {
        client_type: nullable(
            account.client_type,
        ),

        name: account.name ?? '',

        account_type_id:
            account.accountType?.id
                ? String(
                      account.accountType.id,
                  )
                : '',

        city_category: nullable(
            account.city_category,
        ),

        care_of_employee: nullable(
            account.care_of_employee,
        ),

        contact: nullable(
            account.contact,
        ),

        designation: nullable(
            account.designation,
        ),

        mobile: nullable(
            account.mobile,
        ),

        contact_2: nullable(
            account.contact_2,
        ),

        designation_2: nullable(
            account.designation_2,
        ),

        company: nullable(
            account.company,
        ),

        business_phone: nullable(
            account.business_phone,
        ),

        home_phone: nullable(
            account.home_phone,
        ),

        fax: nullable(account.fax),

        email: nullable(
            account.email,
        ),

        address: nullable(
            account.address,
        ),

        country: nullable(
            account.country,
        ),

        website: nullable(
            account.website,
        ),

        credit_limit: String(
            account.credit_limit ?? '0',
        ),

        credit_days: String(
            account.credit_days ?? 0,
        ),

        bank_name: nullable(
            account.bank_name,
        ),

        bank_branch: nullable(
            account.bank_branch,
        ),

        bank_account_number: nullable(
            account.bank_account_number,
        ),

        tax_type: nullable(
            account.tax_type,
        ),

        tax_number: nullable(
            account.tax_number,
        ),

        strn: nullable(
            account.strn,
        ),
    };
}

function InputField({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (
        value: string,
    ) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
                {label}
            </span>

            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:bg-muted"
            />
        </label>
    );
}

function SelectField({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (
        value: string,
    ) => void;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
                {label}
            </span>

            <div className="relative">
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value,
                        )
                    }
                    className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pr-9 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                >
                    {children}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
        </label>
    );
}

function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: typeof User;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border bg-background shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                </div>

                <h2 className="font-semibold">
                    {title}
                </h2>
            </div>

            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

export default function AccountShow({
    account,
    accountTypes,
}: Props) {
    const [form, setForm] =
        useState<FormState>(
            createForm(account),
        );

    const [isSaving, setIsSaving] =
        useState(false);

    function updateField<
        K extends keyof FormState,
    >(
        field: K,
        value: FormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        setIsSaving(true);

        router.put(
            `/accounts/${account.id}`,
            form,
            {
                preserveScroll: true,

                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    }

    function cancelChanges() {
        setForm(
            createForm(account),
        );
    }

    return (
        <>
            <Head
                title={`${account.name} - Account`}
            />

            <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20">
                <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6">
                    {/* Header */}
                    <div className="mb-5">
                        <Link
                            href="/accounts"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Accounts
                        </Link>

                        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                                        {account.code}
                                    </span>

                                    <span className="text-sm text-muted-foreground">
                                        Account Details
                                    </span>
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                    {account.name}
                                </h1>

                                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span>
                                        {
                                            account
                                                .accountType
                                                ?.code
                                        }{' '}
                                        ·{' '}
                                        {
                                            account
                                                .accountType
                                                ?.name
                                        }
                                    </span>

                                    <span>
                                        •
                                    </span>

                                    <span>
                                        {account.branch}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="rounded-full border px-3 py-1.5 text-xs font-medium">
                                    {account.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </span>

                                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                                    Created by{' '}
                                    {account
                                        .creator
                                        ?.name ??
                                        'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-5 overflow-x-auto rounded-xl border bg-background shadow-sm">
                        <div className="flex min-w-max">
                            <div className="border-b-2 border-foreground px-5 py-3 text-sm font-semibold">
                                General
                            </div>

                            <Link
                                href={`/accounts/${account.id}/opening`}
                                className="px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                Opening
                            </Link>

                            <Link
                                href={`/accounts/${account.id}/invoices`}
                                className="px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                Invoices
                            </Link>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Notes
                            </div>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Payable
                            </div>

                            <div className="px-5 py-3 text-sm text-muted-foreground">
                                Receivable
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                    >
                        <div className="grid gap-5 xl:grid-cols-2">
                            {/* General Details */}
                            <Section
                                title="General Details"
                                icon={User}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectField
                                        label="Client Type"
                                        value={
                                            form.client_type
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'client_type',
                                                value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select client type
                                        </option>

                                        <option value="Company">
                                            Company
                                        </option>

                                        <option value="Personal">
                                            Personal
                                        </option>
                                    </SelectField>

                                    <InputField
                                        label="Account Code"
                                        value={
                                            account.code
                                        }
                                        onChange={() => {}}
                                        disabled
                                    />

                                    <InputField
                                        label="Account Name"
                                        value={
                                            form.name
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'name',
                                                value,
                                            )
                                        }
                                    />

                                    <SelectField
                                        label="Account Type"
                                        value={
                                            form.account_type_id
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'account_type_id',
                                                value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select account type
                                        </option>

                                        {accountTypes.map(
                                            (
                                                type,
                                            ) => (
                                                <option
                                                    key={
                                                        type.id
                                                    }
                                                    value={String(
                                                        type.id,
                                                    )}
                                                >
                                                    {
                                                        type.code
                                                    }{' '}
                                                    ·{' '}
                                                    {
                                                        type.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </SelectField>

                                    <InputField
                                        label="City / Category"
                                        value={
                                            form.city_category
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'city_category',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Care of Emp"
                                        value={
                                            form.care_of_employee
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'care_of_employee',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </Section>

                            {/* Address */}
                            <Section
                                title="Address & Telephone"
                                icon={MapPin}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Business"
                                        value={
                                            form.business_phone
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'business_phone',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Home"
                                        value={
                                            form.home_phone
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'home_phone',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Fax"
                                        value={
                                            form.fax
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'fax',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="E-mail"
                                        type="email"
                                        value={
                                            form.email
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'email',
                                                value,
                                            )
                                        }
                                    />

                                    <label className="block sm:col-span-2">
                                        <span className="mb-1.5 block text-sm font-medium">
                                            Address
                                        </span>

                                        <textarea
                                            value={
                                                form.address
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    'address',
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            rows={3}
                                            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                                        />
                                    </label>

                                    <InputField
                                        label="Country"
                                        value={
                                            form.country
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'country',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Website"
                                        value={
                                            form.website
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'website',
                                                value,
                                            )
                                        }
                                        placeholder="https://"
                                    />
                                </div>
                            </Section>

                            {/* Contact */}
                            <Section
                                title="Contact Details"
                                icon={Phone}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Contact"
                                        value={
                                            form.contact
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'contact',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Designation"
                                        value={
                                            form.designation
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'designation',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Mobile"
                                        value={
                                            form.mobile
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'mobile',
                                                value,
                                            )
                                        }
                                    />

                                    <div />

                                    <InputField
                                        label="Contact 2"
                                        value={
                                            form.contact_2
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'contact_2',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Designation"
                                        value={
                                            form.designation_2
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'designation_2',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Company"
                                        value={
                                            form.company
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'company',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </Section>

                            {/* Credit */}
                            <Section
                                title="Credit Limit"
                                icon={Wallet}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Credit Limit"
                                        type="number"
                                        value={
                                            form.credit_limit
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'credit_limit',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Credit Days"
                                        type="number"
                                        value={
                                            form.credit_days
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'credit_days',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </Section>

                            {/* Bank */}
                            <Section
                                title="Bank Account"
                                icon={Landmark}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Bank Name"
                                        value={
                                            form.bank_name
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'bank_name',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Branch"
                                        value={
                                            form.bank_branch
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'bank_branch',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="Account #"
                                        value={
                                            form.bank_account_number
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'bank_account_number',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </Section>

                            {/* Tax */}
                            <Section
                                title="Tax No"
                                icon={Building2}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectField
                                        label="Tax Type"
                                        value={
                                            form.tax_type
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'tax_type',
                                                value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select type
                                        </option>

                                        <option value="NTN">
                                            NTN
                                        </option>

                                        <option value="STRN">
                                            STRN
                                        </option>
                                    </SelectField>

                                    <InputField
                                        label="Tax Number"
                                        value={
                                            form.tax_number
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'tax_number',
                                                value,
                                            )
                                        }
                                    />

                                    <InputField
                                        label="STRN"
                                        value={
                                            form.strn
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                'strn',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </Section>
                        </div>

                        {/* Save */}
                        <div className="sticky bottom-0 z-20 mt-6 border-t bg-background/95 py-4 backdrop-blur">
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        cancelChanges
                                    }
                                    disabled={
                                        isSaving
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isSaving
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="size-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}