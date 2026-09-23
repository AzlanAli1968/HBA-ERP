import React, {
    useMemo,
    useState,
} from 'react';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';

type TemplateType =
    | 'transport'
    | 'hotel'
    | 'visa';

type VisaPricingMode =
    | 'fixed'
    | 'nights_based';

type MasterOption = {
    id: number;
    name: string;
};

type VehicleSelection = {
    vehicle_id: number;
};

type VehicleRule = {
    id: string;
    min_passengers: number;
    max_passengers: number;
    vehicle_id: number | '';
};

type TransportSector = {
    id: string;
    name: string;
    pricing_type: 'normal' | 'sharing';
    from_location_id: number | '';
    to_location_id: number | '';
    notes: string;
    rates: Record<string, number>;
};

type TransportConfig = {
    version: number;
    type: 'transport';
    pricing_basis: 'per_vehicle';
    currency_code: string;
    vehicles: VehicleSelection[];
    vehicle_rules: VehicleRule[];
    sectors: TransportSector[];
};

type HotelSector = {
    id: string;
    name: string;
};

type HotelConfig = {
    version: number;
    type: 'hotel';
    sectors: HotelSector[];
};

type VisaRange = {
    id: string;
    min_days: number;
    max_days: number;
    rate: number;
};

type VisaConfig = {
    version: number;
    type: 'visa';
    visa_type_id: number | '';
    visa_name_snapshot: string;
    pricing_mode: VisaPricingMode;
    currency_code: string;
    fixed_rate: number;
    day_ranges: VisaRange[];
};

const inputClass =
    'h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20';

const commonHotelSectors = [
    'Makkah',
    'Madinah',
    'Jeddah',
    'Taif',
    'Al Ula',
    'Riyadh',
];

function makeId(
    prefix: string,
): string {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}

function emptyTransportConfig(): TransportConfig {
    return {
        version: 1,
        type: 'transport',
        pricing_basis: 'per_vehicle',
        currency_code: 'SAR',
        vehicles: [],
        vehicle_rules: [],
        sectors: [],
    };
}

function emptyHotelConfig(): HotelConfig {
    return {
        version: 1,
        type: 'hotel',
        sectors: [],
    };
}

function emptyVisaConfig(): VisaConfig {
    return {
        version: 1,
        type: 'visa',
        visa_type_id: '',
        visa_name_snapshot: '',
        pricing_mode: 'fixed',
        currency_code: 'SAR',
        fixed_rate: 0,
        day_ranges: [],
    };
}

function normalizeTransportConfig(
    raw: any,
): TransportConfig {
    if (
        !raw ||
        raw.type !== 'transport'
    ) {
        return emptyTransportConfig();
    }

    return {
        version: 1,

        type: 'transport',

        pricing_basis:
            'per_vehicle',

        currency_code:
            String(
                raw.currency_code ??
                    'SAR',
            ).toUpperCase(),

        vehicles:
            Array.isArray(
                raw.vehicles,
            )
                ? raw.vehicles
                      .map(
                          (
                              vehicle: any,
                          ): VehicleSelection => ({
                              vehicle_id:
                                  Number(
                                      vehicle?.vehicle_id ??
                                          0,
                                  ),
                          }),
                      )
                      .filter(
                          (
                              vehicle: VehicleSelection,
                          ): boolean =>
                              vehicle.vehicle_id >
                              0,
                      )
                : [],

        vehicle_rules:
            Array.isArray(
                raw.vehicle_rules,
            )
                ? raw.vehicle_rules.map(
                      (
                          rule: any,
                      ): VehicleRule => ({
                          id: makeId(
                              'rule',
                          ),

                          min_passengers:
                              Math.max(
                                  1,
                                  Number(
                                      rule?.min_passengers ??
                                          1,
                                  ),
                              ),

                          max_passengers:
                              Math.max(
                                  1,
                                  Number(
                                      rule?.max_passengers ??
                                          1,
                                  ),
                              ),

                          vehicle_id:
                              Number(
                                  rule?.vehicle_id ??
                                      0,
                              ) ||
                              '',
                      }),
                  )
                : [],

        sectors:
            Array.isArray(
                raw.sectors,
            )
                ? raw.sectors.map(
                      (
                          sector: any,
                      ): TransportSector => ({
                          id: makeId(
                              'sector',
                          ),

                          name:
                              String(
                                  sector?.name ??
                                      '',
                              ),

                          pricing_type:
                              sector?.pricing_type ===
                              'sharing' ||
                              sector?.type ===
                              'sharing'
                                  ? 'sharing'
                                  : 'normal',

                          from_location_id:
                              Number(
                                  sector?.from_location_id ??
                                      0,
                              ) ||
                              '',

                          to_location_id:
                              Number(
                                  sector?.to_location_id ??
                                      0,
                              ) ||
                              '',

                          notes:
                              String(
                                  sector?.notes ??
                                      '',
                              ),

                          rates:
                              Object.fromEntries(
                                  Object.entries(
                                      sector?.rates ??
                                          {},
                                  ).map(
                                      ([
                                          key,
                                          value,
                                      ]: [
                                          string,
                                          unknown,
                                      ]) => [
                                          key,
                                          Number(
                                              value ??
                                                  0,
                                          ),
                                      ],
                                  ),
                              ),
                      }),
                  )
                : [],
    };
}

function normalizeHotelConfig(
    raw: any,
): HotelConfig {
    if (
        !raw ||
        raw.type !== 'hotel'
    ) {
        return emptyHotelConfig();
    }

    return {
        version: 1,

        type: 'hotel',

        sectors:
            Array.isArray(
                raw.sectors,
            )
                ? raw.sectors
                      .map(
                          (
                              sector: any,
                          ): HotelSector => ({
                              id: makeId(
                                  'hotel-sector',
                              ),

                              name:
                                  typeof sector ===
                                  'string'
                                      ? sector
                                      : String(
                                            sector?.name ??
                                                '',
                                        ),
                          }),
                      )
                      .filter(
                          (
                              sector: HotelSector,
                          ): boolean =>
                              sector.name.trim() !==
                              '',
                      )
                : [],
    };
}

function normalizeVisaConfig(
    raw: any,
): VisaConfig {
    if (
        !raw ||
        raw.type !== 'visa'
    ) {
        return emptyVisaConfig();
    }

    return {
        version: 1,

        type: 'visa',

        visa_type_id:
            Number(
                raw.visa_type_id ??
                    0,
            ) || '',

        visa_name_snapshot:
            String(
                raw.visa_name_snapshot ??
                    '',
            ),

        pricing_mode:
            raw.pricing_mode ===
            'nights_based'
                ? 'nights_based'
                : 'fixed',

        currency_code:
            String(
                raw.currency_code ??
                    'SAR',
            ).toUpperCase(),

        fixed_rate:
            Number(
                raw.fixed_rate ??
                    0,
            ),

        day_ranges:
            Array.isArray(
                raw.day_ranges,
            )
                ? raw.day_ranges.map(
                      (
                          range: any,
                      ): VisaRange => ({
                          id: makeId(
                              'visa-range',
                          ),

                          min_days:
                              Math.max(
                                  1,
                                  Number(
                                      range?.min_days ??
                                          1,
                                  ),
                              ),

                          max_days:
                              Math.max(
                                  1,
                                  Number(
                                      range?.max_days ??
                                          1,
                                  ),
                              ),

                          rate:
                              Number(
                                  range?.rate ??
                                      0,
                              ),
                      }),
                  )
                : [],
    };
}

export default function Edit({
    template,
    vehicles,
    transferLocations,
    visaTypes: initialVisaTypes,
}: {
    template: any | null;
    vehicles: MasterOption[];
    transferLocations: MasterOption[];
    visaTypes: MasterOption[];
}) {
    const initialType: TemplateType =
        template?.template_type ===
        'hotel'
            ? 'hotel'
            : template?.template_type ===
                'visa'
              ? 'visa'
              : 'transport';

    const [
        templateType,
        setTemplateType,
    ] = useState<TemplateType>(
        initialType,
    );

    const [
        transport,
        setTransport,
    ] = useState<TransportConfig>(
        normalizeTransportConfig(
            template?.config_json,
        ),
    );

    const [
        hotel,
        setHotel,
    ] = useState<HotelConfig>(
        normalizeHotelConfig(
            template?.config_json,
        ),
    );

    const [
        visa,
        setVisa,
    ] = useState<VisaConfig>(
        normalizeVisaConfig(
            template?.config_json,
        ),
    );

    const [
        visaTypes,
        setVisaTypes,
    ] = useState<MasterOption[]>(
        initialVisaTypes,
    );

    const [
        showNewVisaType,
        setShowNewVisaType,
    ] = useState(false);

    const [
        newVisaTypeName,
        setNewVisaTypeName,
    ] = useState('');

    const [
        addingVisaType,
        setAddingVisaType,
    ] = useState(false);

    const [
        visaTypeError,
        setVisaTypeError,
    ] = useState('');

    const [
        customSector,
        setCustomSector,
    ] = useState('');

    const form = useForm<any>({
        name:
            template?.name ??
            '',

        description:
            template?.description ??
            '',

        template_type:
            initialType,

        config_json:
            initialType ===
            'hotel'
                ? hotel
                : initialType ===
                    'visa'
                  ? visa
                  : transport,

        is_default:
            !!template?.is_default,

        is_active:
            template?.is_active ??
            true,
    });

    const selectedVehicleIds =
        useMemo(
            (): number[] =>
                transport.vehicles.map(
                    (
                        vehicle: VehicleSelection,
                    ): number =>
                        vehicle.vehicle_id,
                ),
            [transport.vehicles],
        );

    const selectedVehicles =
        useMemo(
            (): MasterOption[] =>
                selectedVehicleIds
                    .map(
                        (
                            id: number,
                        ): MasterOption | undefined =>
                            vehicles.find(
                                (
                                    vehicle: MasterOption,
                                ): boolean =>
                                    vehicle.id ===
                                    id,
                            ),
                    )
                    .filter(
                        (
                            vehicle:
                                | MasterOption
                                | undefined,
                        ): vehicle is MasterOption =>
                            Boolean(
                                vehicle,
                            ),
                    ),
            [
                selectedVehicleIds,
                vehicles,
            ],
        );

    const availableVehicles =
        useMemo(
            (): MasterOption[] =>
                vehicles.filter(
                    (
                        vehicle: MasterOption,
                    ): boolean =>
                        !selectedVehicleIds.includes(
                            vehicle.id,
                        ),
                ),
            [
                selectedVehicleIds,
                vehicles,
            ],
        );

    const updateTransport = (
        next: TransportConfig,
    ) => {
        setTransport(next);

        form.setData(
            'config_json',
            next,
        );
    };

    const updateHotel = (
        next: HotelConfig,
    ) => {
        setHotel(next);

        form.setData(
            'config_json',
            next,
        );
    };

    const updateVisa = (
        next: VisaConfig,
    ) => {
        setVisa(next);

        form.setData(
            'config_json',
            next,
        );
    };

    /*
     * ===============================================================
     * TRANSPORT
     * ===============================================================
     */

    const addVehicle = (
        vehicleId: number,
    ) => {
        if (
            selectedVehicleIds.includes(
                vehicleId,
            )
        ) {
            return;
        }

        updateTransport({
            ...transport,

            vehicles: [
                ...transport.vehicles,

                {
                    vehicle_id:
                        vehicleId,
                },
            ],

            sectors:
                transport.sectors.map(
                    (
                        sector: TransportSector,
                    ): TransportSector => ({
                        ...sector,

                        rates: {
                            ...sector.rates,

                            [String(
                                vehicleId,
                            )]: 0,
                        },
                    }),
                ),
        });
    };

    const removeVehicle = (
        vehicleId: number,
    ) => {
        const sectors =
            transport.sectors.map(
                (
                    sector: TransportSector,
                ): TransportSector => {
                    const rates = {
                        ...sector.rates,
                    };

                    delete rates[
                        String(
                            vehicleId,
                        )
                    ];

                    return {
                        ...sector,
                        rates,
                    };
                },
            );

        updateTransport({
            ...transport,

            vehicles:
                transport.vehicles.filter(
                    (
                        vehicle: VehicleSelection,
                    ): boolean =>
                        vehicle.vehicle_id !==
                        vehicleId,
                ),

            vehicle_rules:
                transport.vehicle_rules.filter(
                    (
                        rule: VehicleRule,
                    ): boolean =>
                        rule.vehicle_id !==
                        vehicleId,
                ),

            sectors,
        });
    };

    const addTransportRule = () => {
        if (
            selectedVehicles.length ===
            0
        ) {
            return;
        }

        const lastRule =
            transport.vehicle_rules[
                transport.vehicle_rules.length -
                    1
            ];

        const min =
            lastRule
                ? lastRule.max_passengers +
                  1
                : 1;

        updateTransport({
            ...transport,

            vehicle_rules: [
                ...transport.vehicle_rules,

                {
                    id: makeId(
                        'rule',
                    ),

                    min_passengers:
                        min,

                    max_passengers:
                        min + 2,

                    vehicle_id:
                        selectedVehicles[0]
                            ?.id ??
                        '',
                },
            ],
        });
    };

    const updateTransportRule = (
        id: string,
        field:
            | 'min_passengers'
            | 'max_passengers'
            | 'vehicle_id',
        value: number | '',
    ) => {
        updateTransport({
            ...transport,

            vehicle_rules:
                transport.vehicle_rules.map(
                    (
                        rule: VehicleRule,
                    ): VehicleRule =>
                        rule.id === id
                            ? {
                                  ...rule,

                                  [field]:
                                      value,
                              }
                            : rule,
                ),
        });
    };

    const removeTransportRule = (
        id: string,
    ) => {
        updateTransport({
            ...transport,

            vehicle_rules:
                transport.vehicle_rules.filter(
                    (
                        rule: VehicleRule,
                    ): boolean =>
                        rule.id !==
                        id,
                ),
        });
    };

    const addTransportSector = () => {
        const rates =
            Object.fromEntries(
                selectedVehicleIds.map(
                    (
                        id: number,
                    ): [
                        string,
                        number,
                    ] => [
                        String(id),
                        0,
                    ],
                ),
            );

        updateTransport({
            ...transport,

            sectors: [
                ...transport.sectors,

                {
                    id: makeId(
                        'sector',
                    ),

                    name: '',

                    pricing_type: 'normal',

                    from_location_id:
                        '',

                    to_location_id:
                        '',

                    notes: '',

                    rates,
                },
            ],
        });
    };

    const duplicateTransportSector = (
        sectorId: string,
    ) => {
        const sector =
            transport.sectors.find(
                (
                    item: TransportSector,
                ): boolean =>
                    item.id ===
                    sectorId,
            );

        if (!sector) {
            return;
        }

        updateTransport({
            ...transport,

            sectors: [
                ...transport.sectors,

                {
                    ...sector,

                    id: makeId(
                        'sector',
                    ),

                    name:
                        sector.name
                            ? `${sector.name} (Copy)`
                            : '',

                    rates: {
                        ...sector.rates,
                    },
                },
            ],
        });
    };

    const removeTransportSector = (
        sectorId: string,
    ) => {
        updateTransport({
            ...transport,

            sectors:
                transport.sectors.filter(
                    (
                        sector: TransportSector,
                    ): boolean =>
                        sector.id !==
                        sectorId,
                ),
        });
    };

    const updateTransportSector = (
        sectorId: string,
        field:
            | 'name'
            | 'pricing_type'
            | 'from_location_id'
            | 'to_location_id'
            | 'notes',
        value: string | number,
    ) => {
        updateTransport({
            ...transport,

            sectors:
                transport.sectors.map(
                    (
                        sector: TransportSector,
                    ): TransportSector => {
                        if (
                            sector.id !==
                            sectorId
                        ) {
                            return sector;
                        }

                        const nextSector: TransportSector = {
                            ...sector,
                            [field]: value,
                        } as TransportSector;

                        /*
                         * Restore the automatic sector-name behaviour:
                         * selecting From + To immediately builds the
                         * Sector value from the master location names.
                         */
                        if (
                            field ===
                                'from_location_id'
                            ||
                            field ===
                                'to_location_id'
                        ) {
                            const fromId =
                                Number(
                                    nextSector.from_location_id,
                                ) || 0;

                            const toId =
                                Number(
                                    nextSector.to_location_id,
                                ) || 0;

                            const fromName =
                                transferLocations.find(
                                    (
                                        location: MasterOption,
                                    ): boolean =>
                                        location.id ===
                                        fromId,
                                )?.name ?? '';

                            const toName =
                                transferLocations.find(
                                    (
                                        location: MasterOption,
                                    ): boolean =>
                                        location.id ===
                                        toId,
                                )?.name ?? '';

                            if (
                                fromName !== ''
                                &&
                                toName !== ''
                            ) {
                                nextSector.name =
                                    `${fromName} - ${toName}`;
                            }
                        }

                        return nextSector;
                    },
                ),
        });
    };

    const updateTransportRate = (
        sectorId: string,
        vehicleId: number,
        value: number,
    ) => {
        updateTransport({
            ...transport,

            sectors:
                transport.sectors.map(
                    (
                        sector: TransportSector,
                    ): TransportSector =>
                        sector.id ===
                        sectorId
                            ? {
                                  ...sector,

                                  rates: {
                                      ...sector.rates,

                                      [String(
                                          vehicleId,
                                      )]:
                                          value,
                                  },
                              }
                            : sector,
                ),
        });
    };

    /*
     * ===============================================================
     * HOTEL
     * ===============================================================
     */

    const addHotelSector = (
        name: string,
    ) => {
        const sectorName =
            name.trim();

        if (
            sectorName ===
            ''
        ) {
            return;
        }

        updateHotel({
            ...hotel,

            sectors: [
                ...hotel.sectors,

                {
                    id: makeId(
                        'hotel-sector',
                    ),

                    name:
                        sectorName,
                },
            ],
        });
    };

    const updateHotelSector = (
        sectorId: string,
        name: string,
    ) => {
        updateHotel({
            ...hotel,

            sectors:
                hotel.sectors.map(
                    (
                        sector: HotelSector,
                    ): HotelSector =>
                        sector.id ===
                        sectorId
                            ? {
                                  ...sector,
                                  name,
                              }
                            : sector,
                ),
        });
    };

    const removeHotelSector = (
        sectorId: string,
    ) => {
        updateHotel({
            ...hotel,

            sectors:
                hotel.sectors.filter(
                    (
                        sector: HotelSector,
                    ): boolean =>
                        sector.id !==
                        sectorId,
                ),
        });
    };

    const moveHotelSector = (
        index: number,
        direction: number,
    ) => {
        const target =
            index + direction;

        if (
            target < 0 ||
            target >=
                hotel.sectors.length
        ) {
            return;
        }

        const next = [
            ...hotel.sectors,
        ];

        [
            next[index],
            next[target],
        ] = [
            next[target],
            next[index],
        ];

        updateHotel({
            ...hotel,
            sectors: next,
        });
    };

    /*
     * ===============================================================
     * VISA
     * ===============================================================
     */

    const updateVisaField = <
        K extends keyof VisaConfig,
    >(
        field: K,
        value: VisaConfig[K],
    ) => {
        updateVisa({
            ...visa,

            [field]:
                value,
        });
    };

    const updateVisaRange = (
        id: string,
        field:
            | 'min_days'
            | 'max_days'
            | 'rate',
        value: number,
    ) => {
        updateVisa({
            ...visa,

            day_ranges:
                visa.day_ranges.map(
                    (
                        range: VisaRange,
                    ): VisaRange =>
                        range.id === id
                            ? {
                                  ...range,

                                  [field]:
                                      value,
                              }
                            : range,
                ),
        });
    };

    const addVisaRange = () => {
        const last =
            visa.day_ranges[
                visa.day_ranges.length -
                    1
            ];

        const min =
            last
                ? last.max_days + 1
                : 1;

        updateVisa({
            ...visa,

            pricing_mode:
                'nights_based',

            day_ranges: [
                ...visa.day_ranges,

                {
                    id: makeId(
                        'visa-range',
                    ),

                    min_days:
                        min,

                    max_days:
                        min + 5,

                    rate: 0,
                },
            ],
        });
    };

    const removeVisaRange = (
        id: string,
    ) => {
        updateVisa({
            ...visa,

            day_ranges:
                visa.day_ranges.filter(
                    (
                        range: VisaRange,
                    ): boolean =>
                        range.id !==
                        id,
                ),
        });
    };

    const addVisaType = async () => {
        const name =
            newVisaTypeName.trim();

        if (
            name ===
            ''
        ) {
            setVisaTypeError(
                'Enter the visa type name.',
            );

            return;
        }

        setAddingVisaType(
            true,
        );

        setVisaTypeError(
            '',
        );

        try {
            const csrfToken =
                document
                    .querySelector(
                        'meta[name="csrf-token"]',
                    )
                    ?.getAttribute(
                        'content',
                    );

            const response =
                await fetch(
                    '/quotation-templates',
                    {
                        method:
                            'POST',

                        credentials:
                            'same-origin',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Accept:
                                'application/json',

                            ...(csrfToken
                                ? {
                                      'X-CSRF-TOKEN':
                                          csrfToken,
                                  }
                                : {}),
                        },

                        body: JSON.stringify({
                            _action:
                                'create_visa_type',

                            name,
                        }),
                    },
                );

            const payload =
                await response.json();

            if (
                !response.ok ||
                !payload?.visa_type
            ) {
                throw new Error(
                    payload?.message ??
                        'Unable to create visa type.',
                );
            }

            const newType: MasterOption =
                {
                    id: Number(
                        payload
                            .visa_type
                            .id,
                    ),

                    name: String(
                        payload
                            .visa_type
                            .name,
                    ),
                };

            setVisaTypes(
                (
                    current: MasterOption[],
                ): MasterOption[] => {
                    const exists =
                        current.some(
                            (
                                item: MasterOption,
                            ): boolean =>
                                item.id ===
                                newType.id,
                        );

                    if (
                        exists
                    ) {
                        return current;
                    }

                    return [
                        ...current,
                        newType,
                    ].sort(
                        (
                            a: MasterOption,
                            b: MasterOption,
                        ): number =>
                            a.name.localeCompare(
                                b.name,
                            ),
                    );
                },
            );

            updateVisa({
                ...visa,

                visa_type_id:
                    newType.id,

                visa_name_snapshot:
                    newType.name,
            });

            setNewVisaTypeName(
                '',
            );

            setShowNewVisaType(
                false,
            );
        } catch (
            error
        ) {
            setVisaTypeError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create visa type.',
            );
        } finally {
            setAddingVisaType(
                false,
            );
        }
    };

    /*
     * ===============================================================
     * SUBMIT
     * ===============================================================
     */

    const submit = (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        const config =
            templateType ===
            'hotel'
                ? hotel
                : templateType ===
                    'visa'
                  ? visa
                  : transport;

        form.transform(
            (
                data: any,
            ) => ({
                ...data,

                template_type:
                    templateType,

                config_json:
                    config,
            }),
        );

        if (template) {
            form.put(
                `/quotation-templates/${template.id}`,
            );
        } else {
            form.post(
                '/quotation-templates',
            );
        }
    };

    const errors =
        Object.entries(
            form.errors ?? {},
        );

    return (
        <>
            <Head
                title={
                    template
                        ? 'Edit Template'
                        : 'Create Template'
                }
            />

            <div className="min-h-full bg-background p-6 text-foreground">
                <div className="mx-auto max-w-[1550px]">
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-sm font-medium text-primary">
                                Quotation Template Maker
                            </div>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                {template
                                    ? 'Edit Template'
                                    : 'Create Template'}
                            </h1>

                            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
                                Reusable pricing templates for Transport, Hotel and Visa.
                            </p>
                        </div>

                        <Link
                            href="/quotation-templates"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            ← Back to Templates
                        </Link>
                    </div>

                    {errors.length >
                        0 && (
                        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                            <div className="font-semibold">
                                Unable to save template.
                            </div>

                            <div className="mt-2 space-y-1">
                                {errors.map(
                                    ([
                                        field,
                                        message,
                                    ]) => (
                                        <div
                                            key={
                                                field
                                            }
                                        >
                                            <span className="font-medium">
                                                {
                                                    field
                                                }
                                                :
                                            </span>{' '}
                                            {Array.isArray(
                                                message,
                                            )
                                                ? message.join(
                                                      ', ',
                                                  )
                                                : String(
                                                      message,
                                                  )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={
                            submit
                        }
                        className="space-y-6"
                    >
                        {/* TEMPLATE TYPE */}

                        <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold">
                                    Template Type
                                </h2>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Choose what this reusable pricing template controls.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <button
                                    type="button"
                                    disabled={
                                        !!template
                                    }
                                    onClick={() =>
                                        setTemplateType(
                                            'transport',
                                        )
                                    }
                                    className={`rounded-2xl border p-5 text-left transition ${
                                        templateType ===
                                        'transport'
                                            ? 'border-primary bg-primary/10'
                                            : 'hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="text-lg font-semibold">
                                        Transport
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Complete sector matrix and passenger-to-vehicle rules.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !!template
                                    }
                                    onClick={() =>
                                        setTemplateType(
                                            'hotel',
                                        )
                                    }
                                    className={`rounded-2xl border p-5 text-left transition ${
                                        templateType ===
                                        'hotel'
                                            ? 'border-primary bg-primary/10'
                                            : 'hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="text-lg font-semibold">
                                        Hotel
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Ordered hotel sectors such as Makkah → Madinah → Makkah.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setTemplateType(
                                            'visa',
                                        )
                                    }
                                    className={`rounded-2xl border p-5 text-left transition ${
                                        templateType ===
                                        'visa'
                                            ? 'border-primary bg-primary/10'
                                            : 'hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="text-lg font-semibold">
                                        Visa
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Fixed pricing or nights-based pricing ranges.
                                    </p>
                                </button>
                            </div>
                        </section>

                        {/* GENERAL INFORMATION */}

                        <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label>
                                    <span className="mb-1 block text-sm font-medium">
                                        Template Name
                                    </span>

                                    <input
                                        className={inputClass}
                                        value={
                                            form.data
                                                .name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'name',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder={
                                            templateType ===
                                            'visa'
                                                ? 'UMRAH VISA MAIN'
                                                : templateType ===
                                                    'hotel'
                                                  ? 'UMRAH HOTEL MAIN'
                                                  : 'UMRAH MAIN'
                                        }
                                    />
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-medium">
                                        Description
                                    </span>

                                    <input
                                        className={inputClass}
                                        value={
                                            form.data
                                                .description
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'description',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Optional description"
                                    />
                                </label>
                            </div>
                        </section>

                        {/* VISA */}

                        {templateType ===
                            'visa' && (
                            <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold">
                                        Visa Pricing
                                    </h2>

                                    <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                                        Fixed pricing uses one price per visa/person. Nights-based pricing uses total stay-duration ranges.
                                    </p>
                                </div>

                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)]">
                                    <div>
                                        <span className="mb-1 block text-sm font-medium">
                                            Visa Type
                                        </span>

                                        <div className="flex gap-2">
                                            <select
                                                className={`${inputClass} flex-1`}
                                                value={
                                                    visa.visa_type_id
                                                }
                                                onChange={(
                                                    event,
                                                ) => {
                                                    const id =
                                                        Number(
                                                            event
                                                                .target
                                                                .value,
                                                        ) ||
                                                        '';

                                                    const selected =
                                                        visaTypes.find(
                                                            (
                                                                item: MasterOption,
                                                            ): boolean =>
                                                                item.id ===
                                                                id,
                                                        );

                                                    updateVisa({
                                                        ...visa,

                                                        visa_type_id:
                                                            id,

                                                        visa_name_snapshot:
                                                            selected
                                                                ?.name ??
                                                            '',
                                                    });
                                                }}
                                            >
                                                <option value="">
                                                    Select visa type
                                                </option>

                                                {visaTypes.map(
                                                    (
                                                        visaType: MasterOption,
                                                    ) => (
                                                        <option
                                                            key={
                                                                visaType.id
                                                            }
                                                            value={
                                                                visaType.id
                                                            }
                                                        >
                                                            {
                                                                visaType.name
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNewVisaType(
                                                        (
                                                            current: boolean,
                                                        ) =>
                                                            !current,
                                                    );

                                                    setVisaTypeError(
                                                        '',
                                                    );
                                                }}
                                                className="shrink-0 rounded-lg border px-4 text-sm font-medium hover:bg-accent"
                                            >
                                                + New Visa Type
                                            </button>
                                        </div>

                                        {showNewVisaType && (
                                            <div className="mt-3 rounded-xl border bg-muted/20 p-4">
                                                <div className="mb-2 text-sm font-medium">
                                                    Add New Visa Type
                                                </div>

                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <input
                                                        className={inputClass}
                                                        value={
                                                            newVisaTypeName
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setNewVisaTypeName(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        onKeyDown={(
                                                            event,
                                                        ) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                event.preventDefault();

                                                                void addVisaType();
                                                            }
                                                        }}
                                                        placeholder="e.g. Saudi Tourist Visa"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void addVisaType()
                                                        }
                                                        disabled={
                                                            addingVisaType
                                                        }
                                                        className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                                    >
                                                        {addingVisaType
                                                            ? 'Adding…'
                                                            : 'Add'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowNewVisaType(
                                                                false,
                                                            );

                                                            setNewVisaTypeName(
                                                                '',
                                                            );

                                                            setVisaTypeError(
                                                                '',
                                                            );
                                                        }}
                                                        className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                {visaTypeError && (
                                                    <div className="mt-2 text-xs text-destructive">
                                                        {
                                                            visaTypeError
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <label>
                                        <span className="mb-1 block text-sm font-medium">
                                            Currency
                                        </span>

                                        <input
                                            className={inputClass}
                                            value={
                                                visa.currency_code
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateVisaField(
                                                    'currency_code',
                                                    event
                                                        .target
                                                        .value
                                                        .toUpperCase(),
                                                )
                                            }
                                            maxLength={
                                                10
                                            }
                                            placeholder="SAR"
                                        />
                                    </label>
                                </div>

                                <div className="mt-6">
                                    <span className="mb-2 block text-sm font-medium">
                                        Pricing Type
                                    </span>

                                    <div className="grid max-w-xl grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateVisa({
                                                    ...visa,

                                                    pricing_mode:
                                                        'fixed',
                                                })
                                            }
                                            className={`rounded-xl border p-4 text-left transition ${
                                                visa.pricing_mode ===
                                                'fixed'
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="font-semibold">
                                                Fixed Pricing
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                One fixed rate per person.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateVisa({
                                                    ...visa,

                                                    pricing_mode:
                                                        'nights_based',
                                                })
                                            }
                                            className={`rounded-xl border p-4 text-left transition ${
                                                visa.pricing_mode ===
                                                'nights_based'
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="font-semibold">
                                                Nights Based
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Price selected from total-stay ranges.
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {visa.pricing_mode ===
                                'fixed' ? (
                                    <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
                                        <label className="block max-w-sm">
                                            <span className="mb-1 block text-sm font-medium">
                                                Fixed Rate Per Person
                                            </span>

                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                className={inputClass}
                                                value={
                                                    visa.fixed_rate
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateVisaField(
                                                        'fixed_rate',
                                                        Number(
                                                            event
                                                                .target
                                                                .value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Example: SAR 450 per adult, child or infant.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="font-semibold">
                                                    Nights-Based Pricing Ranges
                                                </h3>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Each range has one total visa price per person.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    addVisaRange
                                                }
                                                className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                                            >
                                                + Add Range
                                            </button>
                                        </div>

                                        {visa.day_ranges.length ===
                                        0 ? (
                                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                                Example: 5–10 nights = SAR 450, 11–15 nights = SAR 500.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {visa.day_ranges.map(
                                                    (
                                                        range: VisaRange,
                                                        index: number,
                                                    ) => (
                                                        <div
                                                            key={
                                                                range.id
                                                            }
                                                            className="grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-[70px_1fr_1fr_1fr_auto]"
                                                        >
                                                            <div className="flex items-center text-sm font-semibold text-muted-foreground">
                                                                #
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </div>

                                                            <label>
                                                                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                                                    From Nights
                                                                </span>

                                                                <input
                                                                    type="number"
                                                                    min={
                                                                        1
                                                                    }
                                                                    className={inputClass}
                                                                    value={
                                                                        range.min_days
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateVisaRange(
                                                                            range.id,
                                                                            'min_days',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </label>

                                                            <label>
                                                                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                                                    To Nights
                                                                </span>

                                                                <input
                                                                    type="number"
                                                                    min={
                                                                        1
                                                                    }
                                                                    className={inputClass}
                                                                    value={
                                                                        range.max_days
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateVisaRange(
                                                                            range.id,
                                                                            'max_days',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </label>

                                                            <label>
                                                                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                                                    Rate Per Person
                                                                </span>

                                                                <input
                                                                    type="number"
                                                                    min={
                                                                        0
                                                                    }
                                                                    step="0.01"
                                                                    className={inputClass}
                                                                    value={
                                                                        range.rate
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateVisaRange(
                                                                            range.id,
                                                                            'rate',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </label>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeVisaRange(
                                                                        range.id,
                                                                    )
                                                                }
                                                                className="h-10 self-end rounded-lg border border-destructive/30 px-3 text-sm text-destructive hover:bg-destructive/10"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {visa.day_ranges.length >
                                            0 && (
                                            <div className="mt-5 rounded-xl border bg-background p-4">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    Pricing Preview
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {visa.day_ranges.map(
                                                        (
                                                            range: VisaRange,
                                                        ) => (
                                                            <span
                                                                key={
                                                                    range.id
                                                                }
                                                                className="rounded-lg border px-3 py-2 text-sm"
                                                            >
                                                                {
                                                                    range.min_days
                                                                }
                                                                –
                                                                {
                                                                    range.max_days
                                                                }{' '}
                                                                Nights
                                                                {' = '}
                                                                {
                                                                    visa.currency_code
                                                                }{' '}
                                                                {
                                                                    range.rate
                                                                }
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                                    <div className="font-semibold">
                                        Visa passenger rule
                                    </div>

                                    <p className="mt-1 text-muted-foreground">
                                        Adults + Children + Infants = Total Visa Quantity.
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        The selected visa rate applies per person.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* HOTEL */}

                        {templateType ===
                            'hotel' && (
                            <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Hotel Sector Sequence
                                        </h2>

                                        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                                            This template stores only the order of hotel sectors. Hotel name, room type, nights and rates will be entered on the quotation.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <select
                                            className={`${inputClass} min-w-56`}
                                            value=""
                                            onChange={(
                                                event,
                                            ) => {
                                                const value =
                                                    event
                                                        .target
                                                        .value;

                                                if (
                                                    value
                                                ) {
                                                    addHotelSector(
                                                        value,
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">
                                                + Add Sector
                                            </option>

                                            {commonHotelSectors.map(
                                                (
                                                    sector: string,
                                                ) => (
                                                    <option
                                                        key={
                                                            sector
                                                        }
                                                        value={
                                                            sector
                                                        }
                                                    >
                                                        {
                                                            sector
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <input
                                            className={`${inputClass} min-w-56`}
                                            value={
                                                customSector
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setCustomSector(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="Custom sector"
                                            onKeyDown={(
                                                event,
                                            ) => {
                                                if (
                                                    event.key ===
                                                    'Enter'
                                                ) {
                                                    event.preventDefault();

                                                    addHotelSector(
                                                        customSector,
                                                    );

                                                    setCustomSector(
                                                        '',
                                                    );
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                addHotelSector(
                                                    customSector,
                                                );

                                                setCustomSector(
                                                    '',
                                                );
                                            }}
                                            className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent"
                                        >
                                            Add Custom
                                        </button>
                                    </div>
                                </div>

                                {hotel.sectors.length ===
                                0 ? (
                                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                                        No hotel sectors added yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {hotel.sectors.map(
                                            (
                                                sector: HotelSector,
                                                index: number,
                                            ) => (
                                                <div
                                                    key={
                                                        sector.id
                                                    }
                                                    className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center"
                                                >
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </div>

                                                    <div className="flex-1">
                                                        <label>
                                                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                                                Hotel Sector
                                                            </span>

                                                            <input
                                                                className={inputClass}
                                                                value={
                                                                    sector.name
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateHotelSector(
                                                                        sector.id,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveHotelSector(
                                                                    index,
                                                                    -1,
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                0
                                                            }
                                                            className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
                                                        >
                                                            ↑
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveHotelSector(
                                                                    index,
                                                                    1,
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                hotel
                                                                    .sectors
                                                                    .length -
                                                                    1
                                                            }
                                                            className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
                                                        >
                                                            ↓
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeHotelSector(
                                                                    sector.id,
                                                                )
                                                            }
                                                            className="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}

                                {hotel.sectors.length >
                                    0 && (
                                    <div className="mt-5 rounded-xl border bg-muted/20 p-4">
                                        <div className="text-xs font-medium text-muted-foreground">
                                            Sequence Preview
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {hotel.sectors.map(
                                                (
                                                    sector: HotelSector,
                                                    index: number,
                                                ) => (
                                                    <React.Fragment
                                                        key={
                                                            sector.id
                                                        }
                                                    >
                                                        <span className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium">
                                                            {
                                                                sector.name
                                                            }
                                                        </span>

                                                        {index <
                                                            hotel
                                                                .sectors
                                                                .length -
                                                                1 && (
                                                            <span className="text-muted-foreground">
                                                                →
                                                            </span>
                                                        )}
                                                    </React.Fragment>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* TRANSPORT */}

                        {templateType ===
                            'transport' && (
                            <>
                                <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Vehicle Types
                                            </h2>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Select all vehicle categories included in this template.
                                            </p>
                                        </div>

                                        <select
                                            className={`${inputClass} max-w-sm`}
                                            value=""
                                            onChange={(
                                                event,
                                            ) => {
                                                const id =
                                                    Number(
                                                        event
                                                            .target
                                                            .value,
                                                    );

                                                if (
                                                    id
                                                ) {
                                                    addVehicle(
                                                        id,
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">
                                                + Add vehicle type
                                            </option>

                                            {availableVehicles.map(
                                                (
                                                    vehicle: MasterOption,
                                                ) => (
                                                    <option
                                                        key={
                                                            vehicle.id
                                                        }
                                                        value={
                                                            vehicle.id
                                                        }
                                                    >
                                                        {
                                                            vehicle.name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    {selectedVehicles.length ===
                                    0 ? (
                                        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                            No vehicle types selected yet.
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            {selectedVehicles.map(
                                                (
                                                    vehicle: MasterOption,
                                                ) => (
                                                    <div
                                                        key={
                                                            vehicle.id
                                                        }
                                                        className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3"
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {
                                                                    vehicle.name
                                                                }
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                Vehicle type
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeVehicle(
                                                                    vehicle.id,
                                                                )
                                                            }
                                                            className="text-sm text-muted-foreground hover:text-destructive"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                                    <div className="mb-5 flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Passenger → Vehicle Rules
                                            </h2>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Example: 1–3 Sedan, 4–7 Staria, 8–10 Hiace.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                addTransportRule
                                            }
                                            disabled={
                                                selectedVehicles.length ===
                                                0
                                            }
                                            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            + Add Rule
                                        </button>
                                    </div>

                                    {transport.vehicle_rules.length ===
                                    0 ? (
                                        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                            No passenger rules added yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {transport.vehicle_rules.map(
                                                (
                                                    rule: VehicleRule,
                                                    index: number,
                                                ) => (
                                                    <div
                                                        key={
                                                            rule.id
                                                        }
                                                        className="grid gap-3 rounded-xl border p-4 md:grid-cols-[70px_150px_150px_minmax(240px,1fr)_auto]"
                                                    >
                                                        <div className="flex items-center text-sm font-semibold text-muted-foreground">
                                                            #
                                                            {
                                                                index +
                                                                1
                                                            }
                                                        </div>

                                                        <label>
                                                            <span className="mb-1 block text-xs text-muted-foreground">
                                                                Minimum Pax
                                                            </span>

                                                            <input
                                                                type="number"
                                                                min={
                                                                    1
                                                                }
                                                                className={inputClass}
                                                                value={
                                                                    rule.min_passengers
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateTransportRule(
                                                                        rule.id,
                                                                        'min_passengers',
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </label>

                                                        <label>
                                                            <span className="mb-1 block text-xs text-muted-foreground">
                                                                Maximum Pax
                                                            </span>

                                                            <input
                                                                type="number"
                                                                min={
                                                                    1
                                                                }
                                                                className={inputClass}
                                                                value={
                                                                    rule.max_passengers
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateTransportRule(
                                                                        rule.id,
                                                                        'max_passengers',
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </label>

                                                        <label>
                                                            <span className="mb-1 block text-xs text-muted-foreground">
                                                                Vehicle
                                                            </span>

                                                            <select
                                                                className={inputClass}
                                                                value={
                                                                    rule.vehicle_id
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateTransportRule(
                                                                        rule.id,
                                                                        'vehicle_id',
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <option value="">
                                                                    Select vehicle
                                                                </option>

                                                                {selectedVehicles.map(
                                                                    (
                                                                        vehicle: MasterOption,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                vehicle.id
                                                                            }
                                                                            value={
                                                                                vehicle.id
                                                                            }
                                                                        >
                                                                            {
                                                                                vehicle.name
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </label>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTransportRule(
                                                                    rule.id,
                                                                )
                                                            }
                                                            className="h-10 self-end rounded-lg border border-destructive/30 px-3 text-sm text-destructive hover:bg-destructive/10"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
                                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Complete Transport Sector Rate Matrix
                                            </h2>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                All transport sectors belong to this one template.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                addTransportSector
                                            }
                                            disabled={
                                                selectedVehicles.length ===
                                                0
                                            }
                                            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            + Add Transport Sector
                                        </button>
                                    </div>

                                    {transport.sectors.length ===
                                    0 ? (
                                        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                            No transport sectors added yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border">
                                            <table className="min-w-[1250px] w-full text-sm">
                                                <thead className="bg-muted/60 text-muted-foreground">
                                                    <tr>
                                                        <th className="w-14 px-3 py-3">
                                                            #
                                                        </th>

                                                        <th className="min-w-64 px-3 py-3 text-left">
                                                            Sector
                                                        </th>

                                                        <th className="min-w-36 px-3 py-3 text-left">
                                                            Pricing
                                                        </th>

                                                        <th className="min-w-44 px-3 py-3 text-left">
                                                            From
                                                        </th>

                                                        <th className="min-w-44 px-3 py-3 text-left">
                                                            To
                                                        </th>

                                                        {selectedVehicles.map(
                                                            (
                                                                vehicle: MasterOption,
                                                            ) => (
                                                                <th
                                                                    key={
                                                                        vehicle.id
                                                                    }
                                                                    className="min-w-32 px-3 py-3 text-left"
                                                                >
                                                                    {
                                                                        vehicle.name
                                                                    }

                                                                    <div className="text-[10px] font-normal">
                                                                        Rate
                                                                    </div>
                                                                </th>
                                                            ),
                                                        )}

                                                        <th className="min-w-44 px-3 py-3 text-left">
                                                            Notes
                                                        </th>

                                                        <th className="px-3 py-3">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {transport.sectors.map(
                                                        (
                                                            sector: TransportSector,
                                                            index: number,
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    sector.id
                                                                }
                                                                className="border-t border-border align-top"
                                                            >
                                                                <td className="px-3 py-4 text-center text-xs text-muted-foreground">
                                                                    {index +
                                                                        1}
                                                                </td>

                                                                <td className="p-2">
                                                                    <input
                                                                        className={inputClass}
                                                                        value={
                                                                            sector.name
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateTransportSector(
                                                                                sector.id,
                                                                                'name',
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="Jeddah Airport → Makkah Hotel"
                                                                    />
                                                                </td>

                                                                <td className="p-2">
                                                                    <select
                                                                        className={inputClass}
                                                                        value={
                                                                            sector.pricing_type
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateTransportSector(
                                                                                sector.id,
                                                                                'pricing_type',
                                                                                event
                                                                                    .target
                                                                                    .value as
                                                                                    'normal' |
                                                                                    'sharing',
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="normal">
                                                                            Normal
                                                                        </option>

                                                                        <option value="sharing">
                                                                            Sharing
                                                                        </option>
                                                                    </select>

                                                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                                                        Sharing = per person
                                                                    </p>
                                                                </td>

                                                                <td className="p-2">
                                                                    <select
                                                                        className={inputClass}
                                                                        value={
                                                                            sector.from_location_id
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateTransportSector(
                                                                                sector.id,
                                                                                'from_location_id',
                                                                                Number(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                        </option>

                                                                        {transferLocations.map(
                                                                            (
                                                                                location: MasterOption,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        location.id
                                                                                    }
                                                                                    value={
                                                                                        location.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        location.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                </td>

                                                                <td className="p-2">
                                                                    <select
                                                                        className={inputClass}
                                                                        value={
                                                                            sector.to_location_id
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateTransportSector(
                                                                                sector.id,
                                                                                'to_location_id',
                                                                                Number(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                        </option>

                                                                        {transferLocations.map(
                                                                            (
                                                                                location: MasterOption,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        location.id
                                                                                    }
                                                                                    value={
                                                                                        location.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        location.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                </td>

                                                                {selectedVehicles.map(
                                                                    (
                                                                        vehicle: MasterOption,
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                vehicle.id
                                                                            }
                                                                            className="p-2"
                                                                        >
                                                                            <input
                                                                                type="number"
                                                                                min={
                                                                                    0
                                                                                }
                                                                                step="0.01"
                                                                                className={inputClass}
                                                                                value={
                                                                                    sector
                                                                                        .rates[
                                                                                        String(
                                                                                            vehicle.id,
                                                                                        )
                                                                                    ] ??
                                                                                    0
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    updateTransportRate(
                                                                                        sector.id,
                                                                                        vehicle.id,
                                                                                        Number(
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                            />
                                                                        </td>
                                                                    ),
                                                                )}

                                                                <td className="p-2">
                                                                    <textarea
                                                                        className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                                        value={
                                                                            sector.notes
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateTransportSector(
                                                                                sector.id,
                                                                                'notes',
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td className="p-2">
                                                                    <div className="flex flex-col gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                duplicateTransportSector(
                                                                                    sector.id,
                                                                                )
                                                                            }
                                                                            className="rounded-lg border px-3 py-2 text-xs hover:bg-accent"
                                                                        >
                                                                            Duplicate
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeTransportSector(
                                                                                    sector.id,
                                                                                )
                                                                            }
                                                                            className="rounded-lg border border-destructive/30 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {/* SAVE */}

                        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-6 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.data
                                                .is_active
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'is_active',
                                                event
                                                    .target
                                                    .checked,
                                            )
                                        }
                                    />

                                    Active
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.data
                                                .is_default
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'is_default',
                                                event
                                                    .target
                                                    .checked,
                                            )
                                        }
                                    />

                                    Default{' '}
                                    {
                                        templateType
                                    }{' '}
                                    template
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    form.processing
                                }
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : `Save ${
                                          templateType ===
                                          'transport'
                                              ? 'Transport'
                                              : templateType ===
                                                  'hotel'
                                                ? 'Hotel'
                                                : 'Visa'
                                      } Template`}
                            </button>
                        </section>
                    </form>
                </div>
            </div>
        </>
    );
}