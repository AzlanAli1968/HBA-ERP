import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    Check,
    FileImage,
    Globe,
    Mail,
    MapPin,
    Phone,
    Printer,
    Save,
} from 'lucide-react';
import type { ChangeEvent } from 'react';

type Settings = {
    id: number;

    company_name: string;
    tagline: string;
    address: string;
    city: string;
    phone: string;
    mobile: string;
    phone_2: string;
    fax: string;
    email: string;
    website: string;
    govt_license: string;
    ntn: string;
    iata_no: string;
    accounts_manager: string;

    base_currency_code: string;
    date_format: string;
    decimal_places: number;

    paper_size: string;
    print_orientation: string;

    show_company_header: boolean;
    show_address: boolean;
    show_phone: boolean;
    show_email: boolean;
    show_website: boolean;
    show_govt_license: boolean;
    show_ntn: boolean;
    show_qr: boolean;

    logo_url: string | null;
    qr_code_url: string | null;
};

type FormData = Omit<
    Settings,
    'id' | 'logo_url' | 'qr_code_url'
> & {
    logo: File | null;
    qr_code: File | null;
};

type Props = {
    settings: Settings;
};

function Field({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    name: string;
    value: string | number;
    onChange: (
        event: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {label}
            </span>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
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
    onChange: (
        event: ChangeEvent<HTMLInputElement>
    ) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/30">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="size-4 rounded border"
            />

            <span className="text-sm">
                {label}
            </span>
        </label>
    );
}

export default function CompanySettings({
    settings,
}: Props) {
    const form =
        useForm<FormData>({
            company_name:
                settings.company_name,

            tagline:
                settings.tagline,

            address:
                settings.address,

            city:
                settings.city,

            phone:
                settings.phone,

            mobile:
                settings.mobile,

            phone_2:
                settings.phone_2,

            fax:
                settings.fax,

            email:
                settings.email,

            website:
                settings.website,

            govt_license:
                settings.govt_license,

            ntn:
                settings.ntn,

            iata_no:
                settings.iata_no,

            accounts_manager:
                settings.accounts_manager,

            base_currency_code:
                settings.base_currency_code,

            date_format:
                settings.date_format,

            decimal_places:
                settings.decimal_places,

            paper_size:
                settings.paper_size,

            print_orientation:
                settings.print_orientation,

            show_company_header:
                settings.show_company_header,

            show_address:
                settings.show_address,

            show_phone:
                settings.show_phone,

            show_email:
                settings.show_email,

            show_website:
                settings.show_website,

            show_govt_license:
                settings.show_govt_license,

            show_ntn:
                settings.show_ntn,

            show_qr:
                settings.show_qr,

            logo: null,

            qr_code: null,
        });

    function submit(
        event: React.FormEvent<HTMLFormElement>,
    ): void {
        event.preventDefault();

        form.put(
            '/admin/settings',
            {
                forceFormData: true,
                preserveScroll: true,
            },
        );
    }

    function setFile(
        field:
            | 'logo'
            | 'qr_code',
        event: ChangeEvent<HTMLInputElement>,
    ): void {
        form.setData(
            field,
            event.target.files?.[0]
                ?? null,
        );
    }

    return (
        <>
            <Head title="Company Settings" />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">

                    {/* Header */}
                    <div className="mb-6">
                        <div className="text-sm text-muted-foreground">
                            Administration / Settings
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight">
                            Company Settings
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage company information and the
                            defaults used by reports, invoices and
                            printed documents.
                        </p>
                    </div>

                    {form.recentlySuccessful && (
                        <div className="mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
                            <Check className="size-4" />
                            Company settings saved successfully.
                        </div>
                    )}

                    {/* Errors */}
                    {Object.keys(form.errors).length > 0 && (
                        <div className="mb-5 rounded-xl border border-destructive/40 p-4">
                            <div className="font-semibold text-destructive">
                                Please correct the following:
                            </div>

                            <div className="mt-2 space-y-1 text-sm">
                                {Object.entries(
                                    form.errors,
                                ).map(
                                    ([key, message]) => (
                                        <div
                                            key={key}
                                            className="text-muted-foreground"
                                        >
                                            {message}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        className="space-y-5"
                    >

                        {/* ------------------------------------------------ */}
                        {/* Company Information                              */}
                        {/* ------------------------------------------------ */}
                        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">

                            <div className="border-b px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2">
                                        <Building2 className="size-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold">
                                            Company Information
                                        </h2>

                                        <p className="text-xs text-muted-foreground">
                                            Information shown on official
                                            documents and reports.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2">

                                <div className="md:col-span-2">
                                    <Field
                                        label="Company Name"
                                        name="company_name"
                                        value={
                                            form.data.company_name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'company_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="HBA TRAVEL & TOURS"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Field
                                        label="Tagline / Slogan"
                                        name="tagline"
                                        value={
                                            form.data.tagline
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'tagline',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="EXCELLENCE IN HOSPITALITY AND TRAVELS"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                            Address
                                        </span>

                                        <textarea
                                            name="address"
                                            value={
                                                form.data.address
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                form.setData(
                                                    'address',
                                                    event.target.value,
                                                )
                                            }
                                            rows={3}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </label>
                                </div>

                                <Field
                                    label="City"
                                    name="city"
                                    value={
                                        form.data.city
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'city',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Phone"
                                    name="phone"
                                    value={
                                        form.data.phone
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Mobile"
                                    name="mobile"
                                    value={
                                        form.data.mobile
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'mobile',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Second Phone"
                                    name="phone_2"
                                    value={
                                        form.data.phone_2
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'phone_2',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Fax"
                                    name="fax"
                                    value={
                                        form.data.fax
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'fax',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={
                                        form.data.email
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Website"
                                    name="website"
                                    value={
                                        form.data.website
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'website',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Government License No."
                                    name="govt_license"
                                    value={
                                        form.data.govt_license
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'govt_license',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="NTN"
                                    name="ntn"
                                    value={
                                        form.data.ntn
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'ntn',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="IATA No."
                                    name="iata_no"
                                    value={
                                        form.data.iata_no
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'iata_no',
                                            event.target.value,
                                        )
                                    }
                                />

                                <Field
                                    label="Accounts Manager"
                                    name="accounts_manager"
                                    value={
                                        form.data.accounts_manager
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'accounts_manager',
                                            event.target.value,
                                        )
                                    }
                                />

                            </div>
                        </section>

                        {/* ------------------------------------------------ */}
                        {/* Logo & QR                                         */}
                        {/* ------------------------------------------------ */}
                        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">

                            <div className="border-b px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2">
                                        <FileImage className="size-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold">
                                            Company Logo & QR
                                        </h2>

                                        <p className="text-xs text-muted-foreground">
                                            These will be used on PDFs,
                                            prints and future invoices.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 p-5 md:grid-cols-2">

                                {/* Logo */}
                                <div>
                                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                                        Company Logo
                                    </div>

                                    <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/20 p-4">
                                        {settings.logo_url ? (
                                            <img
                                                src={
                                                    settings.logo_url
                                                }
                                                alt="Company logo"
                                                className="max-h-32 max-w-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                No logo uploaded
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(
                                            event,
                                        ) =>
                                            setFile(
                                                'logo',
                                                event,
                                            )
                                        }
                                        className="mt-3 block w-full text-sm"
                                    />

                                    {form.data.logo && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            New file:{' '}
                                            {
                                                form.data.logo.name
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* QR */}
                                <div>
                                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                                        QR Code
                                    </div>

                                    <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/20 p-4">
                                        {settings.qr_code_url ? (
                                            <img
                                                src={
                                                    settings.qr_code_url
                                                }
                                                alt="Company QR"
                                                className="h-32 w-32 object-contain"
                                            />
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                No QR code uploaded
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(
                                            event,
                                        ) =>
                                            setFile(
                                                'qr_code',
                                                event,
                                            )
                                        }
                                        className="mt-3 block w-full text-sm"
                                    />

                                    {form.data.qr_code && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            New file:{' '}
                                            {
                                                form.data.qr_code.name
                                            }
                                        </p>
                                    )}
                                </div>

                            </div>
                        </section>

                        {/* ------------------------------------------------ */}
                        {/* Report & Accounting Defaults                     */}
                        {/* ------------------------------------------------ */}
                        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">

                            <div className="border-b px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2">
                                        <Printer className="size-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold">
                                            Report & Print Defaults
                                        </h2>

                                        <p className="text-xs text-muted-foreground">
                                            These settings will be used by
                                            Ledger, invoices and other reports.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">

                                <label>
                                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Base Currency
                                    </span>

                                    <select
                                        value={
                                            form.data.base_currency_code
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'base_currency_code',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        <option value="PKR">
                                            PKR — Pakistani Rupee
                                        </option>

                                        <option value="SAR">
                                            SAR — Saudi Riyal
                                        </option>

                                        <option value="USD">
                                            USD — US Dollar
                                        </option>

                                        <option value="AED">
                                            AED — UAE Dirham
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Date Format
                                    </span>

                                    <select
                                        value={
                                            form.data.date_format
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'date_format',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        <option value="dd-MMM-yyyy">
                                            01-Jul-2026
                                        </option>

                                        <option value="dd/MM/yyyy">
                                            01/07/2026
                                        </option>

                                        <option value="yyyy-MM-dd">
                                            2026-07-01
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Decimal Places
                                    </span>

                                    <select
                                        value={
                                            form.data.decimal_places
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'decimal_places',
                                                Number(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        <option value={0}>
                                            0
                                        </option>
                                        <option value={2}>
                                            2
                                        </option>
                                        <option value={3}>
                                            3
                                        </option>
                                        <option value={4}>
                                            4
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Paper Size
                                    </span>

                                    <select
                                        value={
                                            form.data.paper_size
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'paper_size',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        <option value="A4">
                                            A4
                                        </option>

                                        <option value="A5">
                                            A5
                                        </option>

                                        <option value="Letter">
                                            Letter
                                        </option>

                                        <option value="Legal">
                                            Legal
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Print Orientation
                                    </span>

                                    <select
                                        value={
                                            form.data.print_orientation
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'print_orientation',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                    >
                                        <option value="portrait">
                                            Portrait
                                        </option>

                                        <option value="landscape">
                                            Landscape
                                        </option>
                                    </select>
                                </label>

                            </div>

                            <div className="grid gap-3 border-t p-5 md:grid-cols-2 lg:grid-cols-4">

                                <Checkbox
                                    label="Show company header"
                                    checked={
                                        form.data.show_company_header
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_company_header',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show address"
                                    checked={
                                        form.data.show_address
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_address',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show phone"
                                    checked={
                                        form.data.show_phone
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_phone',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show email"
                                    checked={
                                        form.data.show_email
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_email',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show website"
                                    checked={
                                        form.data.show_website
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_website',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show Govt. License"
                                    checked={
                                        form.data.show_govt_license
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_govt_license',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show NTN"
                                    checked={
                                        form.data.show_ntn
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_ntn',
                                            event.target.checked,
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Show QR code"
                                    checked={
                                        form.data.show_qr
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'show_qr',
                                            event.target.checked,
                                        )
                                    }
                                />

                            </div>
                        </section>

                        {/* ------------------------------------------------ */}
                        {/* Save                                               */}
                        {/* ------------------------------------------------ */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={
                                    form.processing
                                }
                                className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="size-4" />

                                {form.processing
                                    ? 'Saving...'
                                    : 'Save Company Settings'}
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </>
    );
}