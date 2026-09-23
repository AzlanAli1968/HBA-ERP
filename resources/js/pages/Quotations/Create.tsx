import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

type SimpleOption = {
    id: number;
    name: string;
    city?: string | null;
    code?: string | null;
};

type PricingTemplate = {
    id: number;
    name: string;
    description?: string | null;
    template_type: 'transport' | 'hotel' | 'visa';
    is_default: boolean;
    is_active: boolean;
    config_json: unknown;
};

type HotelSectorInput = {
    sector_name: string;
    hotel_name: string;
    hotel_id: number | '';
    city: string;
    room_type: string;
    meal: string;
    nights: number;
    rate: number;
};

type FlightInput = {
    airline_name: string;
    route: string;
    departure_date: string;
    return_date: string;
    flight_details: string;
    currency_code: string;
    adult_fare: number;
    child_fare: number;
    infant_fare: number;
};

type FormData = {
    quotation_date: string;
    valid_until: string;
    client_account_id: number | '';
    title: string;
    package_name: string;
    route: string;
    travel_start_date: string;
    travel_end_date: string;
    main_guest_name: string;
    adults: number;
    children: number;
    infants: number;
    children_enabled: boolean;
    infants_enabled: boolean;
    transport_template_id: number | '';
    visa_template_id: number | '';
    hotel_template_id: number | '';
    roe_sar_to_pkr: number;
    package_profit_per_person: number;
    hotel_sectors: HotelSectorInput[];
    flight_enabled: boolean;
    flight: FlightInput;
};

function asConfig(
    template: PricingTemplate | null | undefined,
): Record<string, any> {
    if (!template) {
        return {};
    }

    const value = template.config_json;

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);

            return parsed &&
                typeof parsed === 'object'
                ? parsed
                : {};
        } catch {
            return {};
        }
    }

    return value &&
        typeof value === 'object'
        ? (value as Record<string, any>)
        : {};
}

function hotelRowsFor(
    template: PricingTemplate | null,
): HotelSectorInput[] {
    return (asConfig(template).sectors ?? [])
        .filter(
            (sector: any) =>
                sector &&
                String(
                    sector.name ?? ''
                ).trim() !== '',
        )
        .map(
            (sector: any) => ({
                sector_name:
                    String(
                        sector.name
                    ).trim(),

                hotel_name: '',
                hotel_id: '',
                city: '',
                room_type: '',
                meal: '',
                nights: 1,
                rate: 0,
            }),
        );
}

function inclusiveDays(
    start: string,
    end: string,
): number {
    if (
        !start ||
        !end
    ) {
        return 0;
    }

    const startMs = Date.parse(
        `${start}T00:00:00Z`,
    );

    const endMs = Date.parse(
        `${end}T00:00:00Z`,
    );

    if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs < startMs
    ) {
        return 0;
    }

    return Math.floor(
        (
            endMs -
            startMs
        ) /
            86400000,
    ) + 1;
}

function dateAfterDays(
    date: string,
    days: number,
): string {
    if (!date) {
        return '';
    }

    const ms = Date.parse(
        `${date}T00:00:00Z`,
    );

    if (!Number.isFinite(ms)) {
        return '';
    }

    return new Date(
        ms +
            Math.max(
                0,
                Number(days) || 0,
            ) *
                86400000,
    )
        .toISOString()
        .slice(0, 10);
}

function visaRate(
    template: PricingTemplate | null,
    durationDays: number,
): number {
    const config =
        asConfig(template);

    if (
        config.pricing_mode ===
        'nights_based'
    ) {
        const range =
            (
                config.day_ranges ??
                []
            ).find(
                (item: any) => {
                    const min =
                        Number(
                            item?.min_days ??
                                0,
                        );

                    const max =
                        Number(
                            item?.max_days ??
                                0,
                        );

                    return (
                        durationDays >= min &&
                        durationDays <= max
                    );
                },
            );

        return Number(
            range?.rate ?? 0,
        );
    }

    return Number(
        config.fixed_rate ?? 0,
    );
}

export default function Create({
    accounts,
    hotels,
    templates,
    defaultTemplateIds,
}: {
    accounts: SimpleOption[];
    hotels: SimpleOption[];
    templates: PricingTemplate[];
    defaultTemplateIds: {
        transport?: number | null;
        visa?: number | null;
        hotel?: number | null;
    };
}) {
    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const defaultHotelTemplate =
        templates.find(
            (template) =>
                template.id ===
                defaultTemplateIds.hotel,
        ) ?? null;

    const form =
        useForm<FormData>({
            quotation_date:
                today,

            valid_until: '',

            client_account_id:
                '',

            title:
                'Umrah Quotation',

            package_name:
                '',

            route:
                '',

            travel_start_date:
                '',

            travel_end_date:
                '',

            main_guest_name:
                '',

            adults:
                1,

            children:
                0,

            infants:
                0,

            children_enabled:
                false,

            infants_enabled:
                false,

            transport_template_id:
                defaultTemplateIds.transport ??
                '',

            visa_template_id:
                defaultTemplateIds.visa ??
                '',

            hotel_template_id:
                defaultTemplateIds.hotel ??
                '',

            roe_sar_to_pkr:
                0,

            package_profit_per_person:
                0,

            hotel_sectors:
                hotelRowsFor(
                    defaultHotelTemplate,
                ),

            flight_enabled:
                false,

            flight: {
                airline_name: '',
                route: '',
                departure_date: '',
                return_date: '',
                flight_details: '',
                currency_code: 'PKR',
                adult_fare: 0,
                child_fare: 0,
                infant_fare: 0,
            },
        });

    const [airlineOpen, setAirlineOpen] =
        useState(false);

    const transportTemplate =
        useMemo(
            () =>
                templates.find(
                    (template) =>
                        template.id ===
                        Number(
                            form.data
                                .transport_template_id,
                        ),
                ) ?? null,
            [
                templates,
                form.data.transport_template_id,
            ],
        );

    const visaTemplate =
        useMemo(
            () =>
                templates.find(
                    (template) =>
                        template.id ===
                        Number(
                            form.data
                                .visa_template_id,
                        ),
                ) ?? null,
            [
                templates,
                form.data.visa_template_id,
            ],
        );

    const hotelTemplate =
        useMemo(
            () =>
                templates.find(
                    (template) =>
                        template.id ===
                        Number(
                            form.data
                                .hotel_template_id,
                        ),
                ) ?? null,
            [
                templates,
                form.data.hotel_template_id,
            ],
        );

    const totalPersons =
        Number(
            form.data.adults || 0,
        ) +
        Number(
            form.data.children || 0,
        ) +
        Number(
            form.data.infants || 0,
        );

    const durationDays =
        inclusiveDays(
            form.data.travel_start_date,
            form.data.travel_end_date,
        );

    const hotelStayDates =
        useMemo(() => {
            let accumulatedNights = 0;

            return form.data.hotel_sectors.map(
                (sector) => {
                    const checkIn =
                        dateAfterDays(
                            form.data
                                .travel_start_date,
                            accumulatedNights,
                        );

                    const checkOut =
                        dateAfterDays(
                            checkIn,
                            sector.nights,
                        );

                    accumulatedNights +=
                        Math.max(
                            0,
                            Number(
                                sector.nights,
                            ) || 0,
                        );

                    return {
                        checkIn,
                        checkOut,
                    };
                },
            );
        }, [
            form.data.travel_start_date,
            form.data.hotel_sectors,
        ]);

    const selectedTransport =
        useMemo(() => {
            const config =
                asConfig(
                    transportTemplate,
                );

            const rules =
                Array.isArray(
                    config.vehicle_rules,
                )
                    ? config.vehicle_rules
                    : [];

            /*
             * Transport vehicle/rate is adult-based.
             * Children and infants must never change the
             * selected private transport vehicle or its pricing.
             */
            const adultCount =
                Math.max(
                    1,
                    Number(
                        form.data.adults ||
                            0,
                    ),
                );

            const rule =
                rules.find(
                    (item: any) =>
                        adultCount >=
                            Number(
                                item?.min_passengers ??
                                    0,
                            ) &&
                        adultCount <=
                            Number(
                                item?.max_passengers ??
                                    0,
                            ),
                ) ?? null;

            const vehicleId =
                Number(
                    rule?.vehicle_id ??
                        0,
                );

            const vehicle =
                (
                    config.vehicles ??
                    []
                ).find(
                    (item: any) =>
                        Number(
                            item?.vehicle_id ??
                                0,
                        ) === vehicleId,
                );

            return {
                rule,

                vehicleName:
                    vehicle
                        ?.vehicle_name_snapshot ??
                    'No vehicle rule',

                sectors:
                    Array.isArray(
                        config.sectors,
                    )
                        ? config.sectors
                        : [],
            };
        }, [
            transportTemplate,
            form.data.adults,
        ]);

    const packagePreview =
        useMemo(() => {
            const adults =
                Math.max(
                    1,
                    Number(
                        form.data.adults ||
                            0,
                    ),
                );

            const children =
                Math.max(
                    0,
                    Number(
                        form.data.children ||
                            0,
                    ),
                );

            const infants =
                Math.max(
                    0,
                    Number(
                        form.data.infants ||
                            0,
                    ),
                );

            const roe =
                Math.max(
                    0,
                    Number(
                        form.data
                            .roe_sar_to_pkr ||
                            0,
                    ),
                );

            const markup =
                Math.max(
                    0,
                    Number(
                        form.data
                            .package_profit_per_person ||
                            0,
                    ),
                );

            const hotelCostSAR =
                form.data.hotel_sectors.reduce(
                    (
                        sum,
                        sector,
                    ) =>
                        sum +
                        (
                            Number(
                                sector.rate ||
                                    0,
                            ) *
                            Number(
                                sector.nights ||
                                    0,
                            )
                        ) /
                            adults,
                    0,
                );

            const vehicleId =
                Number(
                    selectedTransport
                        .rule
                        ?.vehicle_id ??
                        0,
                );

            const transportTotals =
                selectedTransport.sectors.reduce(
                    (
                        totals: {
                            normal: number;
                            sharing: number;
                        },
                        sector: any,
                    ) => {
                        const rate =
                            Number(
                                sector
                                    ?.rates?.[
                                    String(
                                        vehicleId,
                                    )
                                ] ?? 0,
                            );

                        const pricingType =
                            String(
                                sector
                                    ?.pricing_type
                                    ??
                                    sector?.type
                                    ??
                                    'normal',
                            )
                                .trim()
                                .toLowerCase();

                        if (
                            pricingType ===
                            'sharing'
                        ) {
                            totals.sharing +=
                                rate;
                        } else {
                            totals.normal +=
                                rate;
                        }

                        return totals;
                    },
                    {
                        normal: 0,
                        sharing: 0,
                    },
                );

            const transportCostSAR =
                (
                    transportTotals.normal /
                    adults
                ) +
                transportTotals.sharing;

            const visaSAR =
                visaRate(
                    visaTemplate,
                    durationDays,
                );

            const adultBaseSAR =
                hotelCostSAR +
                transportCostSAR +
                visaSAR;

            const childBaseSAR =
                children > 0
                    ? visaSAR
                    : 0;

            const infantBaseSAR =
                infants > 0
                    ? visaSAR
                    : 0;

            const adultBasePKR =
                adultBaseSAR *
                roe;

            const childBasePKR =
                childBaseSAR *
                roe;

            const infantBasePKR =
                infantBaseSAR *
                roe;

            return {
                adult:
                    adultBasePKR +
                    markup,

                child:
                    children > 0
                        ? childBasePKR +
                          markup
                        : 0,

                infant:
                    infants > 0
                        ? infantBasePKR +
                          markup
                        : 0,

                adultBaseSAR,
                childBaseSAR,
                infantBaseSAR,

                adultBasePKR,
                childBasePKR,
                infantBasePKR,

                hotelCostSAR,
                transportCostSAR,
                visaSAR,

                roe,
                markup,
            };
        }, [
            form.data.adults,
            form.data.children,
            form.data.infants,
            form.data.roe_sar_to_pkr,
            form.data.hotel_sectors,
            form.data.package_profit_per_person,
            selectedTransport,
            visaTemplate,
            durationDays,
        ]);

    function setHotelTemplate(
        value: string,
    ): void {
        const id =
            value
                ? Number(value)
                : '';

        const nextTemplate =
            templates.find(
                (template) =>
                    template.id ===
                    Number(id),
            ) ?? null;

        form.setData(
            'hotel_template_id',
            id,
        );

        form.setData(
            'hotel_sectors',
            hotelRowsFor(
                nextTemplate,
            ),
        );
    }

    function updateHotelSector(
        index: number,
        key: keyof HotelSectorInput,
        value: string | number,
    ): void {
        const next =
            [
                ...form.data
                    .hotel_sectors,
            ];

        next[index] = {
            ...next[index],
            [key]: value,
        } as HotelSectorInput;

        if (
            key === 'hotel_name'
        ) {
            const match =
                hotels.find(
                    (hotel) =>
                        hotel.name
                            .trim()
                            .toLowerCase() ===
                        String(
                            value,
                        )
                            .trim()
                            .toLowerCase(),
                );

            next[index] = {
                ...next[index],

                hotel_id:
                    match?.id ?? '',

                city:
                    match?.city ??
                    next[index].city,
            };
        }

        form.setData(
            'hotel_sectors',
            next,
        );
    }

    function submit(
        event: React.FormEvent<HTMLFormElement>,
    ): void {
        event.preventDefault();

        form.post(
            '/quotations',
        );
    }

    const inputClass =
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60';

    const cardClass =
        'rounded-xl border bg-card p-5 shadow-sm';

    return (
        <>
            <Head title="New Quotation" />

            <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
                <div className="mx-auto max-w-7xl">

                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                HBA Travel & Tours
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                New Umrah Quotation
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Build the package from your saved pricing templates, then add optional airfare.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/quotations"
                                className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Back to Quotations
                            </Link>

                            <Link
                                href="/quotation-templates"
                                className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Pricing Templates
                            </Link>
                        </div>
                    </div>

                    {Object.keys(form.errors).length > 0 && (
                        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                            <div className="font-semibold">
                                Please check the quotation details.
                            </div>

                            <div className="mt-2 space-y-1">
                                {Object.values(form.errors)
                                    .slice(0, 8)
                                    .map(
                                        (
                                            message,
                                            index,
                                        ) => (
                                            <div
                                                key={`${message}-${index}`}
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
                        className="space-y-6"
                    >

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 1
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    Select Transport & Visa Templates
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    All transport and visa template rates are treated as SAR.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">

                                <Field label="Transport Template *">
                                    <select
                                        className={inputClass}
                                        value={
                                            form.data.transport_template_id
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'transport_template_id',
                                                event.target.value
                                                    ? Number(
                                                        event.target.value,
                                                    )
                                                    : '',
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select transport template
                                        </option>

                                        {templates
                                            .filter(
                                                (template) =>
                                                    template.template_type ===
                                                    'transport',
                                            )
                                            .map(
                                                (template) => (
                                                    <option
                                                        key={template.id}
                                                        value={template.id}
                                                    >
                                                        {template.name}
                                                    </option>
                                                ),
                                            )}
                                    </select>
                                </Field>

                                <Field label="Visa Template *">
                                    <select
                                        className={inputClass}
                                        value={
                                            form.data.visa_template_id
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'visa_template_id',
                                                event.target.value
                                                    ? Number(
                                                        event.target.value,
                                                    )
                                                    : '',
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select visa template
                                        </option>

                                        {templates
                                            .filter(
                                                (template) =>
                                                    template.template_type ===
                                                    'visa',
                                            )
                                            .map(
                                                (template) => (
                                                    <option
                                                        key={template.id}
                                                        value={template.id}
                                                    >
                                                        {template.name}
                                                    </option>
                                                ),
                                            )}
                                    </select>
                                </Field>

                            </div>
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 2
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    Travel Dates
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">

                                <Field label="Travel Start Date *">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={
                                            form.data.travel_start_date
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'travel_start_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>

                                <Field label="Travel End Date *">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={
                                            form.data.travel_end_date
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'travel_end_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>

                                <Field label="Duration">
                                    <div className="flex min-h-10 items-center rounded-lg border bg-muted px-3 py-2 text-sm font-semibold">
                                        {durationDays > 0
                                            ? `${durationDays} days`
                                            : 'Enter travel dates'}
                                    </div>
                                </Field>

                            </div>
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 3
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    Guest & Passenger Details
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Adults are required. Children and infants are optional.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">

                                <Field label="Main Guest Name *">
                                    <input
                                        className={inputClass}
                                        value={
                                            form.data.main_guest_name
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'main_guest_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter main guest name"
                                    />
                                </Field>

                                <Field label="Adults *">
                                    <input
                                        type="number"
                                        min={1}
                                        className={inputClass}
                                        value={
                                            form.data.adults
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'adults',
                                                Math.max(
                                                    1,
                                                    Number(
                                                        event.target.value,
                                                    ) || 1,
                                                ),
                                            )
                                        }
                                    />
                                </Field>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                form.data.children_enabled
                                            }
                                            onChange={(event) => {
                                                form.setData(
                                                    'children_enabled',
                                                    event.target.checked,
                                                );

                                                form.setData(
                                                    'children',
                                                    event.target.checked
                                                        ? Math.max(
                                                            1,
                                                            Number(
                                                                form.data.children,
                                                            ) || 1,
                                                        )
                                                        : 0,
                                                );
                                            }}
                                        />

                                        Include Children
                                    </label>

                                    <input
                                        type="number"
                                        min={0}
                                        disabled={
                                            !form.data.children_enabled
                                        }
                                        className={inputClass}
                                        value={
                                            form.data.children
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'children',
                                                Math.max(
                                                    0,
                                                    Number(
                                                        event.target.value,
                                                    ) || 0,
                                                ),
                                            )
                                        }
                                        placeholder="Number of children"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                form.data.infants_enabled
                                            }
                                            onChange={(event) => {
                                                form.setData(
                                                    'infants_enabled',
                                                    event.target.checked,
                                                );

                                                form.setData(
                                                    'infants',
                                                    event.target.checked
                                                        ? Math.max(
                                                            1,
                                                            Number(
                                                                form.data.infants,
                                                            ) || 1,
                                                        )
                                                        : 0,
                                                );
                                            }}
                                        />

                                        Include Infants
                                    </label>

                                    <input
                                        type="number"
                                        min={0}
                                        disabled={
                                            !form.data.infants_enabled
                                        }
                                        className={inputClass}
                                        value={
                                            form.data.infants
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'infants',
                                                Math.max(
                                                    0,
                                                    Number(
                                                        event.target.value,
                                                    ) || 0,
                                                ),
                                            )
                                        }
                                        placeholder="Number of infants"
                                    />
                                </div>

                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">

                                <Field label="Total Persons">
                                    <div className="flex min-h-10 items-center rounded-lg border bg-muted px-3 py-2 text-sm font-semibold">
                                        {totalPersons}
                                    </div>
                                </Field>

                                <Field label="Client Account (optional)">
                                    <select
                                        className={inputClass}
                                        value={
                                            form.data.client_account_id
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'client_account_id',
                                                event.target.value
                                                    ? Number(
                                                        event.target.value,
                                                    )
                                                    : '',
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select client account
                                        </option>

                                        {accounts.map(
                                            (account) => (
                                                <option
                                                    key={account.id}
                                                    value={account.id}
                                                >
                                                    {account.name}
                                                    {account.code
                                                        ? ` (${account.code})`
                                                        : ''}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </Field>

                            </div>
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Step 4
                                    </div>

                                    <h2 className="mt-1 font-semibold">
                                        Hotel Sector Template
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Select the sector sequence. One hotel card will appear for each sector.
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-muted px-3 py-2 text-sm">
                                    <div className="font-semibold">
                                        {
                                            hotelTemplate?.name ??
                                            'No template selected'
                                        }
                                    </div>

                                    <div className="text-muted-foreground">
                                        {form.data.hotel_sectors.length}{' '}
                                        sector
                                        {form.data.hotel_sectors.length === 1
                                            ? ''
                                            : 's'}
                                    </div>
                                </div>
                            </div>

                            <Field label="Hotel Sector Template *">
                                <select
                                    className={inputClass}
                                    value={
                                        form.data.hotel_template_id
                                    }
                                    onChange={(event) =>
                                        setHotelTemplate(
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        Select hotel sector template
                                    </option>

                                    {templates
                                        .filter(
                                            (template) =>
                                                template.template_type ===
                                                'hotel',
                                        )
                                        .map(
                                            (template) => (
                                                <option
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    {template.name}
                                                </option>
                                            ),
                                        )}
                                </select>
                            </Field>
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 5
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    Hotel Details by Sector
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Hotel pricing is entered in <strong>SAR per night</strong>.
                                </p>
                            </div>

                            {form.data.hotel_sectors.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    Select a hotel sector template above to generate the cards.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {form.data.hotel_sectors.map(
                                        (
                                            sector,
                                            index,
                                        ) => {
                                            const dates =
                                                hotelStayDates[
                                                    index
                                                ] ?? {
                                                    checkIn: '',
                                                    checkOut: '',
                                                };

                                            const adultContributionSAR =
                                                (
                                                    Number(
                                                        sector.rate ||
                                                            0,
                                                    ) *
                                                    Number(
                                                        sector.nights ||
                                                            0,
                                                    )
                                                ) /
                                                Math.max(
                                                    1,
                                                    Number(
                                                        form
                                                            .data
                                                            .adults ||
                                                            1,
                                                    ),
                                                );

                                            return (
                                                <div
                                                    key={`${sector.sector_name}-${index}`}
                                                    className="rounded-xl border p-4"
                                                >
                                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Sector{' '}
                                                                {index + 1}
                                                            </div>

                                                            <div className="text-lg font-semibold">
                                                                {
                                                                    sector.sector_name
                                                                }
                                                            </div>
                                                        </div>

                                                        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                                            {dates.checkIn &&
                                                            dates.checkOut
                                                                ? `${dates.checkIn} → ${dates.checkOut}`
                                                                : 'Enter travel start date'}
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-4">

                                                        <Field label="Hotel Name *">
                                                            <input
                                                                list="quotation-hotels"
                                                                className={inputClass}
                                                                value={
                                                                    sector.hotel_name
                                                                }
                                                                onChange={(event) =>
                                                                    updateHotelSector(
                                                                        index,
                                                                        'hotel_name',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Enter / select hotel"
                                                            />
                                                        </Field>

                                                        <Field label="Room Type *">
                                                            <input
                                                                className={inputClass}
                                                                value={
                                                                    sector.room_type
                                                                }
                                                                onChange={(event) =>
                                                                    updateHotelSector(
                                                                        index,
                                                                        'room_type',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="e.g. QUAD"
                                                            />
                                                        </Field>

                                                        <Field label="Meal Plan *">
                                                            <input
                                                                className={inputClass}
                                                                value={
                                                                    sector.meal
                                                                }
                                                                onChange={(event) =>
                                                                    updateHotelSector(
                                                                        index,
                                                                        'meal',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="e.g. RO"
                                                            />
                                                        </Field>

                                                        <Field label="Nights *">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                className={inputClass}
                                                                value={
                                                                    sector.nights
                                                                }
                                                                onChange={(event) =>
                                                                    updateHotelSector(
                                                                        index,
                                                                        'nights',
                                                                        Math.max(
                                                                            1,
                                                                            Number(
                                                                                event.target.value,
                                                                            ) ||
                                                                                1,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </Field>

                                                    </div>

                                                    <div className="mt-4 grid gap-4 md:grid-cols-4">

                                                        <Field label="Per Night Rate (SAR) *">
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-xs font-semibold text-muted-foreground">
                                                                    SAR
                                                                </span>

                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    step="0.01"
                                                                    className={`${inputClass} pl-12`}
                                                                    value={
                                                                        sector.rate
                                                                    }
                                                                    onChange={(event) =>
                                                                        updateHotelSector(
                                                                            index,
                                                                            'rate',
                                                                            Math.max(
                                                                                0,
                                                                                Number(
                                                                                    event.target.value,
                                                                                ) ||
                                                                                    0,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </Field>

                                                        <Field label="City">
                                                            <input
                                                                className={inputClass}
                                                                value={
                                                                    sector.city
                                                                }
                                                                onChange={(event) =>
                                                                    updateHotelSector(
                                                                        index,
                                                                        'city',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Optional"
                                                            />
                                                        </Field>

                                                        <Field label="Check-in">
                                                            <div className="flex min-h-10 items-center rounded-lg border bg-muted px-3 py-2 text-sm">
                                                                {
                                                                    dates.checkIn ||
                                                                    '—'
                                                                }
                                                            </div>
                                                        </Field>

                                                        <Field label="Check-out">
                                                            <div className="flex min-h-10 items-center rounded-lg border bg-muted px-3 py-2 text-sm">
                                                                {
                                                                    dates.checkOut ||
                                                                    '—'
                                                                }
                                                            </div>
                                                        </Field>

                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-3 py-3 text-sm">
                                                        <span className="text-muted-foreground">
                                                            Adult contribution from this hotel sector
                                                        </span>

                                                        <strong>
                                                            SAR{' '}
                                                            {adultContributionSAR.toFixed(
                                                                2,
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}

                            <datalist id="quotation-hotels">
                                {hotels.map(
                                    (hotel) => (
                                        <option
                                            key={hotel.id}
                                            value={hotel.name}
                                        >
                                            {hotel.city ?? ''}
                                        </option>
                                    ),
                                )}
                            </datalist>
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 6
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    ROE & Package Profit
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    All package costs are SAR. Enter the SAR-to-PKR ROE, then add your profit in PKR per person.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">

                                <Field label="SAR → PKR ROE *">
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-xs font-semibold text-muted-foreground">
                                            1 SAR =
                                        </span>

                                        <input
                                            type="number"
                                            min={0}
                                            step="0.000001"
                                            className={`${inputClass} pl-16 pr-14`}
                                            value={
                                                form.data.roe_sar_to_pkr
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'roe_sar_to_pkr',
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ) || 0,
                                                    ),
                                                )
                                            }
                                            placeholder="e.g. 76.500000"
                                        />

                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-muted-foreground">
                                            PKR
                                        </span>
                                    </div>
                                </Field>

                                <Field label="Profit / Markup Per Person (PKR) *">
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-xs font-semibold text-muted-foreground">
                                            PKR
                                        </span>

                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            className={`${inputClass} pl-12`}
                                            value={
                                                form.data
                                                    .package_profit_per_person
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'package_profit_per_person',
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ) || 0,
                                                    ),
                                                )
                                            }
                                            placeholder="e.g. 15000"
                                        />
                                    </div>
                                </Field>

                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">

                                <SummaryLine
                                    label="Hotel contribution / adult"
                                    value={`SAR ${packagePreview.hotelCostSAR.toFixed(2)}`}
                                />

                                <SummaryLine
                                    label="Transport contribution / adult"
                                    value={`SAR ${packagePreview.transportCostSAR.toFixed(2)}`}
                                />

                                <SummaryLine
                                    label="Visa / person"
                                    value={`SAR ${packagePreview.visaSAR.toFixed(2)}`}
                                />

                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">

                                <SummaryLine
                                    label="Adult base before markup"
                                    value={`SAR ${packagePreview.adultBaseSAR.toFixed(2)} → PKR ${packagePreview.adultBasePKR.toFixed(2)}`}
                                />

                                {
                                    form.data.children > 0 && (
                                        <SummaryLine
                                            label="Child base before markup"
                                            value={`SAR ${packagePreview.childBaseSAR.toFixed(2)} → PKR ${packagePreview.childBasePKR.toFixed(2)}`}
                                        />
                                    )
                                }

                                {
                                    form.data.infants > 0 && (
                                        <SummaryLine
                                            label="Infant base before markup"
                                            value={`SAR ${packagePreview.infantBaseSAR.toFixed(2)} → PKR ${packagePreview.infantBasePKR.toFixed(2)}`}
                                        />
                                    )
                                }

                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">

                                <PriceCard
                                    label="Package Per Adult"
                                    value={
                                        packagePreview.adult
                                    }
                                    currency="PKR"
                                />

                                {
                                    form.data.children >
                                        0 && (
                                        <PriceCard
                                            label="Package Per Child"
                                            value={
                                                packagePreview.child
                                            }
                                            currency="PKR"
                                        />
                                    )
                                }

                                {
                                    form.data.infants >
                                        0 && (
                                        <PriceCard
                                            label="Package Per Infant"
                                            value={
                                                packagePreview.infant
                                            }
                                            currency="PKR"
                                        />
                                    )
                                }

                            </div>
                        </section>

                        <section className={cardClass}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between text-left"
                                onClick={() => {
                                    const nextOpen =
                                        !airlineOpen;

                                    setAirlineOpen(
                                        nextOpen,
                                    );

                                    form.setData(
                                        'flight_enabled',
                                        nextOpen,
                                    );

                                    if (
                                        nextOpen &&
                                        !form.data.flight.departure_date
                                    ) {
                                        form.setData(
                                            'flight',
                                            {
                                                ...form.data.flight,

                                                departure_date:
                                                    form.data.travel_start_date,

                                                return_date:
                                                    form.data.travel_end_date,
                                            },
                                        );
                                    }
                                }}
                            >
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Step 7
                                    </div>

                                    <h2 className="mt-1 font-semibold">
                                        Optional Airline / Airfare
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Airfare is separate from the package and may use its own currency.
                                    </p>
                                </div>

                                <span className="rounded-lg border bg-muted px-3 py-2 text-sm font-medium">
                                    {airlineOpen
                                        ? 'Close Airline'
                                        : 'Open Airline'}
                                </span>
                            </button>

                            {airlineOpen && (
                                <div className="mt-5 border-t pt-5">

                                    <div className="grid gap-4 md:grid-cols-3">

                                        <Field label="Airline Name *">
                                            <input
                                                className={inputClass}
                                                value={
                                                    form.data.flight.airline_name
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            airline_name:
                                                                event.target.value,
                                                        },
                                                    )
                                                }
                                                placeholder="e.g. Emirates"
                                            />
                                        </Field>

                                        <Field label="Sector / Route *">
                                            <input
                                                className={inputClass}
                                                value={
                                                    form.data.flight.route
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            route:
                                                                event.target.value,
                                                        },
                                                    )
                                                }
                                                placeholder="e.g. KHI-JED-KHI"
                                            />
                                        </Field>

                                        <Field label="Airfare Currency">
                                            <input
                                                className={inputClass}
                                                value={
                                                    form.data.flight.currency_code
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            currency_code:
                                                                event.target.value.toUpperCase(),
                                                        },
                                                    )
                                                }
                                                placeholder="PKR / USD / SAR"
                                            />
                                        </Field>

                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-3">

                                        <Field label="Adult Fare *">
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                className={inputClass}
                                                value={
                                                    form.data.flight.adult_fare
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            adult_fare:
                                                                Math.max(
                                                                    0,
                                                                    Number(
                                                                        event.target.value,
                                                                    ) || 0,
                                                                ),
                                                        },
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Child Fare * when children are included">
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                disabled={
                                                    form.data.children < 1
                                                }
                                                className={inputClass}
                                                value={
                                                    form.data.flight.child_fare
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            child_fare:
                                                                Math.max(
                                                                    0,
                                                                    Number(
                                                                        event.target.value,
                                                                    ) || 0,
                                                                ),
                                                        },
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Infant Fare * when infants are included">
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                disabled={
                                                    form.data.infants < 1
                                                }
                                                className={inputClass}
                                                value={
                                                    form.data.flight.infant_fare
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            infant_fare:
                                                                Math.max(
                                                                    0,
                                                                    Number(
                                                                        event.target.value,
                                                                    ) || 0,
                                                                ),
                                                        },
                                                    )
                                                }
                                            />
                                        </Field>

                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">

                                        <Field label="Departure Date">
                                            <input
                                                type="date"
                                                className={inputClass}
                                                value={
                                                    form.data.flight.departure_date
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            departure_date:
                                                                event.target.value,
                                                        },
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Return Date">
                                            <input
                                                type="date"
                                                className={inputClass}
                                                value={
                                                    form.data.flight.return_date
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            return_date:
                                                                event.target.value,
                                                        },
                                                    )
                                                }
                                            />
                                        </Field>

                                    </div>

                                    <div className="mt-4">
                                        <Field label="Flight Details">
                                            <textarea
                                                className={`${inputClass} min-h-24`}
                                                value={
                                                    form.data.flight.flight_details
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'flight',
                                                        {
                                                            ...form.data.flight,
                                                            flight_details:
                                                                event.target.value,
                                                        },
                                                    )
                                                }
                                                placeholder="Flight numbers, timings, sectors, etc."
                                            />
                                        </Field>
                                    </div>

                                    <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm font-semibold text-destructive">
                                        Airfare is subject to market change.
                                    </div>

                                </div>
                            )}
                        </section>

                        <section className={cardClass}>
                            <div className="mb-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Step 8
                                </div>

                                <h2 className="mt-1 font-semibold">
                                    Quotation Details
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                                <Field label="Package Name">
                                    <input
                                        className={inputClass}
                                        value={
                                            form.data.package_name
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'package_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. 5 Star Umrah Package"
                                    />
                                </Field>

                                <Field label="Route / Journey">
                                    <input
                                        className={inputClass}
                                        value={
                                            form.data.route
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'route',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. KHI-JED-MED-KHI"
                                    />
                                </Field>

                                <Field label="Quotation Date">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={
                                            form.data.quotation_date
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'quotation_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>

                                <Field label="Valid Until">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={
                                            form.data.valid_until
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'valid_until',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>

                            </div>

                            <div className="mt-4">
                                <Field label="Quotation Title">
                                    <input
                                        className={inputClass}
                                        value={
                                            form.data.title
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </section>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href="/quotations"
                                className="rounded-lg border bg-card px-5 py-3 text-center text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    form.processing
                                }
                                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Creating Quotation…'
                                    : 'Create Quotation'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted-foreground">
                {label}
            </span>

            {children}
        </label>
    );
}

function PriceCard({
    label,
    value,
    currency,
}: {
    label: string;
    value: number;
    currency: string;
}) {
    return (
        <div className="rounded-xl border bg-muted/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>

            <div className="mt-2 text-xl font-semibold">
                {currency}{' '}
                {value.toFixed(2)}
            </div>
        </div>
    );
}

function SummaryLine({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">
                {label}
            </div>

            <div className="mt-1 font-semibold">
                {value}
            </div>
        </div>
    );
}