import React from 'react';
import { Head, Link } from '@inertiajs/react';

type QuoteMeta = {
    main_guest_name?: string | null;
    total_persons?: number;
    package_profit_per_person?: number | string;
    selected_template_names?: {
        transport?: string;
        visa?: string;
        hotel?: string;
    };
    duration_days?: number | null;
};

function money(
    value: number | string | null | undefined,
): string {
    return Number(
        value ?? 0,
    ).toFixed(2);
}

export default function Show({
    quotation,
    quoteMeta,
}: {
    quotation: any;
    quoteMeta?: QuoteMeta;
}) {
    const hotelItems =
        (
            quotation.items ??
            []
        ).filter(
            (item: any) =>
                item.item_type ===
                'hotel',
        );

    const transportItems =
        (
            quotation.items ??
            []
        ).filter(
            (item: any) =>
                item.item_type ===
                'transport',
        );

    const visaItems =
        (
            quotation.items ??
            []
        ).filter(
            (item: any) =>
                item.item_type ===
                'visa',
        );

    return (
        <>
            <Head
                title={
                    quotation.quote_no
                }
            />

            <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
                <div className="mx-auto max-w-6xl space-y-5">

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                HBA Travel & Tours
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                {
                                    quotation.quote_no
                                }
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {
                                    quotation.title
                                }
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/quotations"
                                className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Back
                            </Link>

                            <a
                                href={`/quotations/${quotation.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Print / PDF
                            </a>
                        </div>
                    </div>

                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="grid gap-4 md:grid-cols-4">

                            <Summary
                                label="Main Guest"
                                value={
                                    quoteMeta
                                        ?.main_guest_name ||
                                    '—'
                                }
                            />

                            <Summary
                                label="Passengers"
                                value={
                                    `A ${quotation.adults} / C ${quotation.children} / I ${quotation.infants} · ${quoteMeta?.total_persons ?? Number(quotation.adults) + Number(quotation.children) + Number(quotation.infants)} total`
                                }
                            />

                            <Summary
                                label="Travel Dates"
                                value={
                                    `${quotation.travel_start_date ?? '—'} → ${quotation.travel_end_date ?? '—'}`
                                }
                            />

                            <Summary
                                label="Duration"
                                value={
                                    quoteMeta
                                        ?.duration_days
                                        ? `${quoteMeta.duration_days} days`
                                        : '—'
                                }
                            />

                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="font-semibold">
                                Selected Pricing Templates
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                These are the template snapshots saved with this quotation.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <TemplateCard
                                label="Transport"
                                value={
                                    quoteMeta
                                        ?.selected_template_names
                                        ?.transport
                                }
                            />

                            <TemplateCard
                                label="Visa"
                                value={
                                    quoteMeta
                                        ?.selected_template_names
                                        ?.visa
                                }
                            />

                            <TemplateCard
                                label="Hotel Sectors"
                                value={
                                    quoteMeta
                                        ?.selected_template_names
                                        ?.hotel
                                }
                            />
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold">
                            Package Details
                        </h2>

                        {
                            hotelItems.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Hotels
                                    </h3>

                                    <div className="space-y-3">
                                        {
                                            hotelItems.map(
                                                (
                                                    item: any,
                                                ) => (
                                                    <ItemCard
                                                        key={
                                                            item.id
                                                        }
                                                        title={
                                                            item.section ||
                                                            item.title
                                                        }
                                                        lines={[
                                                            `Hotel: ${item.title}${item.city ? ` — ${item.city}` : ''}`,

                                                            `Room: ${item.room_type || '—'} · Meal: ${item.meal || '—'}`,

                                                            `Stay: ${item.nights || 0} nights · ${item.check_in || '—'} → ${item.check_out || '—'}`,

                                                            `Per night: ${item.rate_currency_code || quotation.currency_code} ${money(item.rate)}`,
                                                        ]}
                                                    />
                                                ),
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        }

                        {
                            transportItems.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Transport
                                    </h3>

                                    <div className="space-y-3">
                                        {
                                            transportItems.map(
                                                (
                                                    item: any,
                                                ) => (
                                                    <ItemCard
                                                        key={
                                                            item.id
                                                        }
                                                        title={
                                                            item.title
                                                        }
                                                        lines={[
                                                            `Route: ${item.from_location_name || '—'} → ${item.to_location_name || '—'}`,

                                                            `Vehicle: ${item.metadata_json?.vehicle_name_snapshot || '—'}`,

                                                            `Vehicle rate: ${item.rate_currency_code || 'SAR'} ${money(item.rate)}`,
                                                        ]}
                                                    />
                                                ),
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        }

                        {
                            visaItems.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Visa
                                    </h3>

                                    <div className="space-y-3">
                                        {
                                            visaItems.map(
                                                (
                                                    item: any,
                                                ) => (
                                                    <ItemCard
                                                        key={
                                                            item.id
                                                        }
                                                        title={
                                                            item.title
                                                        }
                                                        lines={[
                                                            `Quantity: ${item.quantity}`,

                                                            `Rate per person: ${item.rate_currency_code || 'SAR'} ${money(item.rate)}`,

                                                            `Duration: ${item.metadata_json?.duration_days ?? '—'} days`,

                                                            `Pricing: ${item.metadata_json?.pricing_mode_snapshot === 'nights_based' ? 'Range based' : 'Fixed'}`,
                                                        ]}
                                                    />
                                                ),
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </section>

                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold">
                            Package Pricing
                        </h2>

                        <div className="grid gap-4 md:grid-cols-3">

                            <Price
                                label="Package Per Adult"
                                currency={
                                    quotation.currency_code
                                }
                                value={
                                    quotation.package_per_adult
                                }
                            />

                            {
                                quotation.children >
                                    0 && (
                                    <Price
                                        label="Package Per Child"
                                        currency={
                                            quotation.currency_code
                                        }
                                        value={
                                            quotation.package_per_child
                                        }
                                    />
                                )
                            }

                            {
                                quotation.infants >
                                    0 && (
                                    <Price
                                        label="Package Per Infant"
                                        currency={
                                            quotation.currency_code
                                        }
                                        value={
                                            quotation.package_per_infant
                                        }
                                    />
                                )
                            }

                        </div>

                        <div className="mt-4 rounded-lg border bg-muted/30 px-3 py-3 text-sm">
                            Profit per person:{' '}
                            <strong>
                                {
                                    quotation.currency_code
                                }{' '}
                                {
                                    money(
                                        quoteMeta?.package_profit_per_person,
                                    )
                                }
                            </strong>
                        </div>
                    </section>

                    {
                        quotation.flight_enabled &&
                        quotation.flight && (
                            <section className="rounded-xl border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 font-semibold">
                                    Airfare — Separate from Package
                                </h2>

                                <div className="grid gap-4 md:grid-cols-3">

                                    <Summary
                                        label="Airline"
                                        value={
                                            quotation
                                                .flight
                                                .airline_name ||
                                            '—'
                                        }
                                    />

                                    <Summary
                                        label="Sector / Route"
                                        value={
                                            quotation
                                                .flight
                                                .route ||
                                            '—'
                                        }
                                    />

                                    <Summary
                                        label="Currency"
                                        value={
                                            quotation
                                                .flight
                                                .currency_code ||
                                            '—'
                                        }
                                    />

                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-3">

                                    <Price
                                        label="Adult Fare"
                                        currency={
                                            quotation
                                                .flight
                                                .currency_code
                                        }
                                        value={
                                            quotation
                                                .flight
                                                .adult_fare
                                        }
                                    />

                                    {
                                        quotation.children >
                                            0 && (
                                            <Price
                                                label="Child Fare"
                                                currency={
                                                    quotation
                                                        .flight
                                                        .currency_code
                                                }
                                                value={
                                                    quotation
                                                        .flight
                                                        .child_fare
                                                }
                                            />
                                        )
                                    }

                                    {
                                        quotation.infants >
                                            0 && (
                                            <Price
                                                label="Infant Fare"
                                                currency={
                                                    quotation
                                                        .flight
                                                        .currency_code
                                                }
                                                value={
                                                    quotation
                                                        .flight
                                                        .infant_fare
                                                }
                                            />
                                        )
                                    }

                                </div>

                                {
                                    quotation.flight
                                        .flight_details && (
                                        <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                                            {
                                                quotation
                                                    .flight
                                                    .flight_details
                                            }
                                        </div>
                                    )
                                }

                                <p className="mt-4 text-sm font-semibold text-red-600">
                                    Airfare is subject to market change.
                                </p>
                            </section>
                        )
                    }

                </div>
            </div>
        </>
    );
}

function Summary({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>

            <div className="mt-1 text-sm font-medium">
                {value}
            </div>
        </div>
    );
}

function TemplateCard({
    label,
    value,
}: {
    label: string;
    value?: string;
}) {
    return (
        <Summary
            label={label}
            value={
                value || '—'
            }
        />
    );
}

function ItemCard({
    title,
    lines,
}: {
    title: string;
    lines: string[];
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="font-semibold">
                {title}
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {
                    lines.map(
                        (
                            line,
                        ) => (
                            <div
                                key={
                                    line
                                }
                            >
                                {
                                    line
                                }
                            </div>
                        ),
                    )
                }
            </div>
        </div>
    );
}

function Price({
    label,
    currency,
    value,
}: {
    label: string;
    currency: string;
    value:
        | number
        | string
        | null
        | undefined;
}) {
    return (
        <div className="rounded-xl border bg-muted/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>

            <div className="mt-2 text-xl font-semibold">
                {currency}{' '}
                {money(value)}
            </div>
        </div>
    );
}