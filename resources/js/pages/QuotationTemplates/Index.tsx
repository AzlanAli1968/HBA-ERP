import React, {
    useMemo,
    useState,
} from 'react';
import {
    Head,
    Link,
} from '@inertiajs/react';

type Template = {
    id: number;
    name: string;
    description?: string | null;

    template_type:
        | 'transport'
        | 'hotel'
        | 'visa';

    currency_code: string;

    vehicle_count: number;
    rule_count: number;
    sector_count: number;

    visa_name?: string | null;

    pricing_mode?:
        | 'fixed'
        | 'nights_based'
        | null;

    fixed_rate: number;
    day_range_count: number;

    is_default: boolean;
    is_active: boolean;
};

type Filter =
    | 'transport'
    | 'hotel'
    | 'visa';

export default function Index({
    templates,
}: {
    templates: Template[];
}) {
    const [
        filter,
        setFilter,
    ] = useState<Filter>(
        'transport',
    );

    const filteredTemplates =
        useMemo(
            () =>
                templates.filter(
                    (
                        template: Template,
                    ): boolean =>
                        template.template_type ===
                        filter,
                ),
            [
                templates,
                filter,
            ],
        );

    return (
        <>
            <Head title="Template Maker" />

            <div className="min-h-full bg-background p-6 text-foreground">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm font-medium text-primary">
                                Quotation Template Maker
                            </div>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Pricing Templates
                            </h1>

                            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                Manage reusable Transport, Hotel and Visa pricing templates used by the Quote Maker.
                            </p>
                        </div>

                        <Link
                            href="/quotation-templates/create"
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                        >
                            + New Template
                        </Link>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <button
                            type="button"
                            onClick={() =>
                                setFilter(
                                    'transport',
                                )
                            }
                            className={`rounded-2xl border p-5 text-left transition ${
                                filter ===
                                'transport'
                                    ? 'border-primary bg-primary/10'
                                    : 'bg-card hover:bg-muted/30'
                            }`}
                        >
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Template Type
                            </div>

                            <div className="mt-1 text-lg font-semibold">
                                Transport
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                                Vehicle rules + complete sector rate matrix
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setFilter(
                                    'hotel',
                                )
                            }
                            className={`rounded-2xl border p-5 text-left transition ${
                                filter ===
                                'hotel'
                                    ? 'border-primary bg-primary/10'
                                    : 'bg-card hover:bg-muted/30'
                            }`}
                        >
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Template Type
                            </div>

                            <div className="mt-1 text-lg font-semibold">
                                Hotel
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                                Ordered hotel sectors for the quotation
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setFilter(
                                    'visa',
                                )
                            }
                            className={`rounded-2xl border p-5 text-left transition ${
                                filter ===
                                'visa'
                                    ? 'border-primary bg-primary/10'
                                    : 'bg-card hover:bg-muted/30'
                            }`}
                        >
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Template Type
                            </div>

                            <div className="mt-1 text-lg font-semibold">
                                Visa
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                                Fixed pricing or nights-based ranges
                            </div>
                        </button>
                    </div>

                    {filteredTemplates.length ===
                    0 ? (
                        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-card-foreground shadow-sm">
                            <div className="text-lg font-semibold">
                                No{' '}
                                {filter}{' '}
                                templates yet
                            </div>

                            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                                Create a reusable{' '}
                                {filter}{' '}
                                pricing template.
                            </p>

                            <Link
                                href="/quotation-templates/create"
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                            >
                                + Create{' '}
                                {
                                    filter
                                }{' '}
                                Template
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-[1000px] w-full text-left text-sm">
                                    <thead className="bg-muted/60 text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">
                                                Template
                                            </th>

                                            <th className="px-5 py-4 font-medium">
                                                Type
                                            </th>

                                            {filter ===
                                                'transport' && (
                                                <>
                                                    <th className="px-5 py-4 font-medium">
                                                        Vehicles
                                                    </th>

                                                    <th className="px-5 py-4 font-medium">
                                                        Pax Rules
                                                    </th>

                                                    <th className="px-5 py-4 font-medium">
                                                        Sectors
                                                    </th>
                                                </>
                                            )}

                                            {filter ===
                                                'hotel' && (
                                                <th className="px-5 py-4 font-medium">
                                                    Hotel Sectors
                                                </th>
                                            )}

                                            {filter ===
                                                'visa' && (
                                                <>
                                                    <th className="px-5 py-4 font-medium">
                                                        Visa
                                                    </th>

                                                    <th className="px-5 py-4 font-medium">
                                                        Pricing
                                                    </th>

                                                    <th className="px-5 py-4 font-medium">
                                                        Details
                                                    </th>
                                                </>
                                            )}

                                            <th className="px-5 py-4 font-medium">
                                                Status
                                            </th>

                                            <th className="px-5 py-4 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredTemplates.map(
                                            (
                                                template: Template,
                                            ) => (
                                                <tr
                                                    key={
                                                        template.id
                                                    }
                                                    className="border-t border-border transition hover:bg-muted/20"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold">
                                                            {
                                                                template.name
                                                            }

                                                            {template.is_default && (
                                                                <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>

                                                        {template.description && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {
                                                                    template.description
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                                                            {
                                                                template.template_type
                                                            }
                                                        </span>
                                                    </td>

                                                    {filter ===
                                                        'transport' && (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                {
                                                                    template.vehicle_count
                                                                }
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                {
                                                                    template.rule_count
                                                                }
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                {
                                                                    template.sector_count
                                                                }
                                                            </td>
                                                        </>
                                                    )}

                                                    {filter ===
                                                        'hotel' && (
                                                        <td className="px-5 py-4">
                                                            {
                                                                template.sector_count
                                                            }
                                                        </td>
                                                    )}

                                                    {filter ===
                                                        'visa' && (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                {
                                                                    template.visa_name
                                                                }
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                {template.pricing_mode ===
                                                                'nights_based'
                                                                    ? 'Nights Based'
                                                                    : 'Fixed'}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                {template.pricing_mode ===
                                                                'nights_based'
                                                                    ? `${template.day_range_count} range${
                                                                          template.day_range_count ===
                                                                          1
                                                                              ? ''
                                                                              : 's'
                                                                      }`
                                                                    : `${template.currency_code} ${template.fixed_rate} / person`}
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="px-5 py-4">
                                                        {template.is_active ? (
                                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Archived
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Link
                                                            href={`/quotation-templates/${template.id}/edit`}
                                                            className="font-medium text-primary hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}