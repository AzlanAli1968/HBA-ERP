<?php

namespace App\Http\Controllers;

use App\Models\QuotationTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class QuotationTemplateController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return ['auth'];
    }

    public function index()
    {
        $templates = QuotationTemplate::query()
            ->whereIn('template_type', [
                'transport',
                'hotel',
                'visa',
            ])
            ->orderByDesc('is_default')
            ->orderBy('template_type')
            ->orderBy('name')
            ->get()
            ->map(
                function (
                    QuotationTemplate $template
                ): array {
                    $config = is_array(
                        $template->config_json
                    )
                        ? $template->config_json
                        : [];

                    $templateType =
                        $template->template_type;

                    return [
                        'id' =>
                            $template->id,

                        'name' =>
                            $template->name,

                        'description' =>
                            $template->description,

                        'template_type' =>
                            $templateType,

                        'currency_code' =>
                            (string) (
                                $config[
                                    'currency_code'
                                ] ?? 'SAR'
                            ),

                        'vehicle_count' =>
                            count(
                                $config[
                                    'vehicles'
                                ] ?? []
                            ),

                        'rule_count' =>
                            count(
                                $config[
                                    'vehicle_rules'
                                ] ?? []
                            ),

                        'sector_count' =>
                            count(
                                $config[
                                    'sectors'
                                ] ?? []
                            ),

                        'visa_name' =>
                            $templateType === 'visa'
                                ? (
                                    $config[
                                        'visa_name_snapshot'
                                    ] ?? ''
                                )
                                : null,

                        'pricing_mode' =>
                            $templateType === 'visa'
                                ? (
                                    $config[
                                        'pricing_mode'
                                    ] ?? 'fixed'
                                )
                                : null,

                        'fixed_rate' =>
                            $templateType === 'visa'
                                ? (float) (
                                    $config[
                                        'fixed_rate'
                                    ] ?? 0
                                )
                                : 0,

                        'day_range_count' =>
                            $templateType === 'visa'
                                ? count(
                                    $config[
                                        'day_ranges'
                                    ] ?? []
                                )
                                : 0,

                        'is_default' =>
                            (bool)
                            $template->is_default,

                        'is_active' =>
                            (bool)
                            $template->is_active,
                    ];
                }
            )
            ->values()
            ->all();

        return Inertia::render(
            'QuotationTemplates/Index',
            [
                'templates' =>
                    $templates,
            ]
        );
    }

    public function create()
    {
        return Inertia::render(
            'QuotationTemplates/Edit',
            [
                'template' =>
                    null,

                ...$this->masterOptions(),
            ]
        );
    }

    public function store(
        Request $request
    ) {
        /*
         * This same authenticated endpoint is also used for creating
         * a new visa type directly from the Visa Template screen.
         *
         * No additional route is required for this.
         */
        if (
            $request->input('_action')
            === 'create_visa_type'
        ) {
            return $this->createVisaType(
                $request
            );
        }

        $data =
            $this->validated(
                $request
            );

        $templateType =
            $data['template_type'];

        $config =
            match ($templateType) {
                'transport' =>
                    $this->normalizeTransportConfig(
                        (array)
                        $data['config_json']
                    ),

                'hotel' =>
                    $this->normalizeHotelConfig(
                        (array)
                        $data['config_json']
                    ),

                'visa' =>
                    $this->normalizeVisaConfig(
                        (array)
                        $data['config_json']
                    ),

                default =>
                    throw ValidationException::withMessages([
                        'template_type' =>
                            'Invalid template type.',
                    ]),
            };

        $template =
            QuotationTemplate::create([
                'name' =>
                    $data['name'],

                'description' =>
                    $data[
                        'description'
                    ] ?? null,

                'template_type' =>
                    $templateType,

                /*
                 * Legacy PDF columns retained for compatibility
                 * with the existing Quote Maker table.
                 */
                'paper_size' =>
                    'A4',

                'orientation' =>
                    'portrait',

                'design_json' =>
                    [],

                'config_json' =>
                    $config,

                'is_default' =>
                    (bool) (
                        $data[
                            'is_default'
                        ] ?? false
                    ),

                'is_active' =>
                    (bool) (
                        $data[
                            'is_active'
                        ] ?? true
                    ),

                'created_by' =>
                    $request
                        ->user()?->id,
            ]);

        if (
            $template->is_default
        ) {
            $this->clearOtherDefaults(
                $template->id,
                $template->template_type
            );
        }

        return redirect()
            ->route(
                'quotation-templates.edit',
                $template
            )
            ->with(
                'success',
                ucfirst(
                    $templateType
                ) .
                ' template created.'
            );
    }

    public function edit(
        QuotationTemplate $quotationTemplate
    ) {
        abort_unless(
            in_array(
                $quotationTemplate
                    ->template_type,
                [
                    'transport',
                    'hotel',
                    'visa',
                ],
                true
            ),
            404
        );

        return Inertia::render(
            'QuotationTemplates/Edit',
            [
                'template' =>
                    $quotationTemplate,

                ...$this->masterOptions(),
            ]
        );
    }

    public function update(
        Request $request,
        QuotationTemplate $quotationTemplate
    ) {
        abort_unless(
            in_array(
                $quotationTemplate
                    ->template_type,
                [
                    'transport',
                    'hotel',
                    'visa',
                ],
                true
            ),
            404
        );

        $data =
            $this->validated(
                $request
            );

        $templateType =
            $quotationTemplate
                ->template_type;

        /*
         * Template type is immutable after creation.
         */
        if (
            isset(
                $data[
                    'template_type'
                ]
            )
            &&
            $data[
                'template_type'
            ]
            !==
            $templateType
        ) {
            throw ValidationException::withMessages([
                'template_type' =>
                    'The template type cannot be changed after creation.',
            ]);
        }

        $config =
            match ($templateType) {
                'transport' =>
                    $this->normalizeTransportConfig(
                        (array)
                        $data['config_json']
                    ),

                'hotel' =>
                    $this->normalizeHotelConfig(
                        (array)
                        $data['config_json']
                    ),

                'visa' =>
                    $this->normalizeVisaConfig(
                        (array)
                        $data['config_json']
                    ),

                default =>
                    throw ValidationException::withMessages([
                        'template_type' =>
                            'Invalid template type.',
                    ]),
            };

        $quotationTemplate->update([
            'name' =>
                $data['name'],

            'description' =>
                $data[
                    'description'
                ] ?? null,

            'template_type' =>
                $templateType,

            'paper_size' =>
                'A4',

            'orientation' =>
                'portrait',

            'design_json' =>
                [],

            'config_json' =>
                $config,

            'is_default' =>
                (bool) (
                    $data[
                        'is_default'
                    ] ?? false
                ),

            'is_active' =>
                (bool) (
                    $data[
                        'is_active'
                    ] ?? true
                ),
        ]);

        if (
            $quotationTemplate
                ->is_default
        ) {
            $this->clearOtherDefaults(
                $quotationTemplate->id,
                $quotationTemplate
                    ->template_type
            );
        }

        return redirect()
            ->route(
                'quotation-templates.edit',
                $quotationTemplate
            )
            ->with(
                'success',
                ucfirst(
                    $templateType
                ) .
                ' template updated.'
            );
    }

    public function destroy(
        QuotationTemplate $quotationTemplate
    ) {
        abort_unless(
            in_array(
                $quotationTemplate
                    ->template_type,
                [
                    'transport',
                    'hotel',
                    'visa',
                ],
                true
            ),
            404
        );

        $quotationTemplate->update([
            'is_active' =>
                false,

            'is_default' =>
                false,
        ]);

        return redirect()
            ->route(
                'quotation-templates.index'
            )
            ->with(
                'success',
                'Template archived. Existing quotations are unaffected.'
            );
    }

    private function createVisaType(
        Request $request
    ): JsonResponse {
        $validated =
            $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:150',
                ],
            ]);

        $name =
            trim(
                (string)
                $validated['name']
            );

        $existing =
            DB::table(
                'visa_types'
            )
                ->whereRaw(
                    'LOWER(name) = ?',
                    [
                        strtolower(
                            $name
                        ),
                    ]
                )
                ->first([
                    'id',
                    'name',
                    'is_active',
                ]);

        if ($existing) {
            if (
                ! $existing->is_active
            ) {
                DB::table(
                    'visa_types'
                )
                    ->where(
                        'id',
                        $existing->id
                    )
                    ->update([
                        'is_active' =>
                            1,

                        'updated_at' =>
                            now(),
                    ]);
            }

            return response()->json([
                'ok' =>
                    true,

                'created' =>
                    false,

                'visa_type' => [
                    'id' =>
                        (int)
                        $existing->id,

                    'name' =>
                        $name,
                ],
            ]);
        }

        $id =
            DB::table(
                'visa_types'
            )->insertGetId([
                'name' =>
                    $name,

                'is_active' =>
                    true,

                'created_at' =>
                    now(),

                'updated_at' =>
                    now(),
            ]);

        return response()->json([
            'ok' =>
                true,

            'created' =>
                true,

            'visa_type' => [
                'id' =>
                    (int) $id,

                'name' =>
                    $name,
            ],
        ]);
    }

    private function validated(
        Request $request
    ): array {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'template_type' => [
                'required',
                'string',
                'in:transport,hotel,visa',
            ],

            'config_json' => [
                'required',
                'array',
            ],

            'is_default' => [
                'boolean',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);
    }

    private function normalizeHotelConfig(
        array $config
    ): array {
        $rawSectors =
            $config[
                'sectors'
            ] ?? [];

        $sectors =
            [];

        foreach (
            $rawSectors as $sector
        ) {
            $name =
                trim(
                    (string) (
                        is_array($sector)
                            ? (
                                $sector[
                                    'name'
                                ] ?? ''
                            )
                            : $sector
                    )
                );

            if (
                $name === ''
            ) {
                continue;
            }

            /*
             * Duplicates are deliberately permitted:
             *
             * Makkah
             * Madinah
             * Makkah
             */
            $sectors[] = [
                'name' =>
                    $name,
            ];
        }

        if (
            $sectors === []
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Add at least one hotel sector to the template.',
            ]);
        }

        return [
            'version' =>
                1,

            'type' =>
                'hotel',

            'sectors' =>
                array_values(
                    $sectors
                ),
        ];
    }

    private function normalizeVisaConfig(
        array $config
    ): array {
        $pricingMode =
            strtolower(
                trim(
                    (string) (
                        $config[
                            'pricing_mode'
                        ] ?? 'fixed'
                    )
                )
            );

        if (
            !in_array(
                $pricingMode,
                [
                    'fixed',
                    'nights_based',
                ],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Select either Fixed Pricing or Nights Based Pricing.',
            ]);
        }

        $visaTypeId =
            !empty(
                $config[
                    'visa_type_id'
                ]
            )
                ? (int)
                $config[
                    'visa_type_id'
                ]
                : null;

        if (
            $visaTypeId === null
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Select a visa type.',
            ]);
        }

        $visa =
            DB::table(
                'visa_types'
            )
                ->where(
                    'id',
                    $visaTypeId
                )
                ->where(
                    'is_active',
                    1
                )
                ->first([
                    'id',
                    'name',
                ]);

        if (
            !$visa
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'The selected visa type is not available.',
            ]);
        }

        $currencyCode =
            strtoupper(
                trim(
                    (string) (
                        $config[
                            'currency_code'
                        ] ?? 'SAR'
                    )
                )
            );

        if (
            $currencyCode === ''
        ) {
            $currencyCode =
                'SAR';
        }

        $fixedRate =
            round(
                max(
                    0,
                    (float) (
                        $config[
                            'fixed_rate'
                        ] ?? 0
                    )
                ),
                4
            );

        if (
            $pricingMode ===
            'fixed'
        ) {
            if (
                $fixedRate <= 0
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Enter a fixed visa rate greater than zero.',
                ]);
            }

            return [
                'version' =>
                    1,

                'type' =>
                    'visa',

                'visa_type_id' =>
                    (int)
                    $visa->id,

                'visa_name_snapshot' =>
                    trim(
                        (string)
                        $visa->name
                    ),

                'pricing_mode' =>
                    'fixed',

                'currency_code' =>
                    $currencyCode,

                'fixed_rate' =>
                    $fixedRate,

                'day_ranges' =>
                    [],
            ];
        }

        /*
         * ---------------------------------------------------------------
         * NIGHTS BASED RANGES
         *
         * Example:
         *
         * 5–10  = SAR 450
         * 11–15 = SAR 500
         * 16–20 = SAR 550
         *
         * Each range has a total visa price per person.
         * It is NOT a per-night multiplication.
         * ---------------------------------------------------------------
         */

        $rawRanges =
            $config[
                'day_ranges'
            ] ?? [];

        $ranges =
            [];

        foreach (
            $rawRanges as $range
        ) {
            if (
                !is_array(
                    $range
                )
            ) {
                continue;
            }

            $minDays =
                (int) (
                    $range[
                        'min_days'
                    ] ?? 0
                );

            $maxDays =
                (int) (
                    $range[
                        'max_days'
                    ] ?? 0
                );

            $rate =
                round(
                    max(
                        0,
                        (float) (
                            $range[
                                'rate'
                            ] ?? 0
                        )
                    ),
                    4
                );

            if (
                $minDays <= 0
                ||
                $maxDays < $minDays
                ||
                $rate <= 0
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Every nights-based visa range must have valid minimum/maximum nights and a rate greater than zero.',
                ]);
            }

            $ranges[] = [
                'min_days' =>
                    $minDays,

                'max_days' =>
                    $maxDays,

                'rate' =>
                    $rate,
            ];
        }

        if (
            $ranges === []
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Add at least one nights-based pricing range.',
            ]);
        }

        usort(
            $ranges,
            fn (
                array $a,
                array $b
            ): int =>
                $a[
                    'min_days'
                ]
                <=>
                $b[
                    'min_days'
                ]
        );

        for (
            $i = 1;
            $i < count($ranges);
            $i++
        ) {
            $previous =
                $ranges[
                    $i - 1
                ];

            $current =
                $ranges[$i];

            if (
                $current[
                    'min_days'
                ]
                <=
                $previous[
                    'max_days'
                ]
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Nights-based visa ranges overlap. Example: 5–10 and 11–15 are valid, but 5–10 and 10–15 overlap.',
                ]);
            }
        }

        return [
            'version' =>
                1,

            'type' =>
                'visa',

            'visa_type_id' =>
                (int)
                $visa->id,

            'visa_name_snapshot' =>
                trim(
                    (string)
                    $visa->name
                ),

            'pricing_mode' =>
                'nights_based',

            'currency_code' =>
                $currencyCode,

            'fixed_rate' =>
                0,

            'day_ranges' =>
                array_values(
                    $ranges
                ),
        ];
    }

    private function normalizeTransportConfig(
        array $config
    ): array {
        $currencyCode =
            strtoupper(
                trim(
                    (string) (
                        $config[
                            'currency_code'
                        ] ?? 'SAR'
                    )
                )
            );

        if (
            $currencyCode === ''
        ) {
            $currencyCode =
                'SAR';
        }

        $vehicleIds =
            collect(
                $config[
                    'vehicles'
                ] ?? []
            )
                ->filter(
                    fn ($vehicle) =>
                        is_array(
                            $vehicle
                        )
                )
                ->map(
                    fn (
                        array $vehicle
                    ) =>
                        (int) (
                            $vehicle[
                                'vehicle_id'
                            ] ?? 0
                        )
                )
                ->filter(
                    fn (int $id) =>
                        $id > 0
                )
                ->unique()
                ->values()
                ->all();

        if (
            $vehicleIds === []
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Add at least one vehicle type to the transport template.',
            ]);
        }

        $vehicleRows =
            DB::table(
                'vehicles'
            )
                ->whereIn(
                    'id',
                    $vehicleIds
                )
                ->where(
                    'is_active',
                    1
                )
                ->select(
                    'id',
                    'name'
                )
                ->orderBy(
                    'name'
                )
                ->get();

        if (
            $vehicleRows->count()
            !==
            count(
                $vehicleIds
            )
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'One or more selected vehicle types are unavailable in the vehicle master.',
            ]);
        }

        $vehicleMap =
            $vehicleRows
                ->mapWithKeys(
                    fn ($row) => [
                        (int)
                        $row->id => [
                            'vehicle_id' =>
                                (int)
                                $row->id,

                            'vehicle_name_snapshot' =>
                                trim(
                                    (string)
                                    $row->name
                                ),
                        ],
                    ]
                )
                ->all();

        $rules =
            collect(
                $config[
                    'vehicle_rules'
                ] ?? []
            )
                ->filter(
                    fn ($rule) =>
                        is_array(
                            $rule
                        )
                )
                ->map(
                    fn (
                        array $rule
                    ) => [
                        'min_passengers' =>
                            max(
                                1,
                                (int) (
                                    $rule[
                                        'min_passengers'
                                    ] ?? 1
                                )
                            ),

                        'max_passengers' =>
                            max(
                                1,
                                (int) (
                                    $rule[
                                        'max_passengers'
                                    ] ?? 1
                                )
                            ),

                        'vehicle_id' =>
                            (int) (
                                $rule[
                                    'vehicle_id'
                                ] ?? 0
                            ),
                    ]
                )
                ->values()
                ->all();

        foreach (
            $rules as $rule
        ) {
            if (
                $rule[
                    'max_passengers'
                ]
                <
                $rule[
                    'min_passengers'
                ]
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Passenger rule maximum must be greater than or equal to minimum.',
                ]);
            }

            if (
                !isset(
                    $vehicleMap[
                        $rule[
                            'vehicle_id'
                        ]
                    ]
                )
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Every passenger rule must use a vehicle selected in this template.',
                ]);
            }
        }

        usort(
            $rules,
            fn (
                array $a,
                array $b
            ) =>
                $a[
                    'min_passengers'
                ]
                <=>
                $b[
                    'min_passengers'
                ]
        );

        for (
            $i = 1;
            $i < count($rules);
            $i++
        ) {
            $previous =
                $rules[
                    $i - 1
                ];

            $current =
                $rules[$i];

            if (
                $current[
                    'min_passengers'
                ]
                <=
                $previous[
                    'max_passengers'
                ]
            ) {
                throw ValidationException::withMessages([
                    'config_json' =>
                        'Passenger-to-vehicle ranges overlap. Each passenger number must belong to only one rule.',
                ]);
            }
        }

        $sectorList =
            collect(
                $config[
                    'sectors'
                ] ?? []
            )
                ->filter(
                    fn ($sector) =>
                        is_array(
                            $sector
                        )
                )
                ->map(
                    function (
                        array $sector
                    ) use (
                        $vehicleMap
                    ): array {
                        $name =
                            trim(
                                (string) (
                                    $sector[
                                        'name'
                                    ] ?? ''
                                )
                            );

                        $pricingType =
                            strtolower(
                                trim(
                                    (string) (
                                        $sector[
                                            'pricing_type'
                                        ]
                                        ??
                                        $sector[
                                            'type'
                                        ]
                                        ??
                                        'normal'
                                    )
                                )
                            );

                        if (
                            !in_array(
                                $pricingType,
                                [
                                    'normal',
                                    'sharing',
                                ],
                                true
                            )
                        ) {
                            throw ValidationException::withMessages([
                                'config_json' =>
                                    'Each transport sector must use either Normal or Sharing pricing.',
                            ]);
                        }

                        $rates =
                            collect(
                                $sector[
                                    'rates'
                                ] ?? []
                            )
                                ->mapWithKeys(
                                    function (
                                        $rate,
                                        $vehicleId
                                    ): array {
                                        return [
                                            (string)
                                            (
                                                (int)
                                                $vehicleId
                                            ) =>
                                                round(
                                                    (float)
                                                    $rate,
                                                    4
                                                ),
                                        ];
                                    }
                                )
                                ->all();

                        $normalizedRates =
                            [];

                        foreach (
                            array_keys(
                                $vehicleMap
                            ) as $vehicleId
                        ) {
                            $normalizedRates[
                                (string)
                                $vehicleId
                            ] =
                                (float) (
                                    $rates[
                                        (string)
                                        $vehicleId
                                    ]
                                    ?? 0
                                );
                        }

                        return [
                            'name' =>
                                $name,

                            'pricing_type' =>
                                $pricingType,

                            'from_location_id' =>
                                !empty(
                                    $sector[
                                        'from_location_id'
                                    ]
                                )
                                    ? (int)
                                      $sector[
                                          'from_location_id'
                                      ]
                                    : null,

                            'to_location_id' =>
                                !empty(
                                    $sector[
                                        'to_location_id'
                                    ]
                                )
                                    ? (int)
                                      $sector[
                                          'to_location_id'
                                      ]
                                    : null,

                            'notes' =>
                                trim(
                                    (string) (
                                        $sector[
                                            'notes'
                                        ] ?? ''
                                    )
                                ),

                            'rates' =>
                                $normalizedRates,
                        ];
                    }
                )
                ->filter(
                    fn (
                        array $sector
                    ) =>
                        $sector[
                            'name'
                        ] !== ''
                )
                ->values()
                ->all();

        $duplicateSectors =
            collect(
                $sectorList
            )
                ->map(
                    fn (
                        array $sector
                    ) =>
                        strtoupper(
                            trim(
                                $sector[
                                    'name'
                                ]
                            )
                        )
                )
                ->duplicates()
                ->values()
                ->all();

        if (
            $duplicateSectors !== []
        ) {
            throw ValidationException::withMessages([
                'config_json' =>
                    'Duplicate transport sector names are not allowed in the same template.',
            ]);
        }

        return [
            'version' =>
                1,

            'type' =>
                'transport',

            'pricing_basis' =>
                'per_vehicle',

            'currency_code' =>
                $currencyCode,

            'vehicles' =>
                array_values(
                    $vehicleMap
                ),

            'vehicle_rules' =>
                $rules,

            'sectors' =>
                $sectorList,
        ];
    }

    private function masterOptions(): array
    {
        return [
            'vehicles' =>
                DB::table(
                    'vehicles'
                )
                    ->where(
                        'is_active',
                        1
                    )
                    ->select(
                        'id',
                        'name'
                    )
                    ->orderBy(
                        'name'
                    )
                    ->get()
                    ->map(
                        fn ($row) => [
                            'id' =>
                                (int)
                                $row->id,

                            'name' =>
                                trim(
                                    (string)
                                    $row->name
                                ),
                        ]
                    )
                    ->values()
                    ->all(),

            'transferLocations' =>
                DB::table(
                    'transfer_locations'
                )
                    ->where(
                        'is_active',
                        1
                    )
                    ->select(
                        'id',
                        'name'
                    )
                    ->orderBy(
                        'name'
                    )
                    ->get()
                    ->map(
                        fn ($row) => [
                            'id' =>
                                (int)
                                $row->id,

                            'name' =>
                                trim(
                                    (string)
                                    $row->name
                                ),
                        ]
                    )
                    ->values()
                    ->all(),

            'visaTypes' =>
                DB::table(
                    'visa_types'
                )
                    ->where(
                        'is_active',
                        1
                    )
                    ->select(
                        'id',
                        'name'
                    )
                    ->orderBy(
                        'name'
                    )
                    ->get()
                    ->map(
                        fn ($row) => [
                            'id' =>
                                (int)
                                $row->id,

                            'name' =>
                                trim(
                                    (string)
                                    $row->name
                                ),
                        ]
                    )
                    ->values()
                    ->all(),
        ];
    }

    private function clearOtherDefaults(
        int $exceptId,
        string $templateType
    ): void {
        QuotationTemplate::query()
            ->where(
                'template_type',
                $templateType
            )
            ->where(
                'id',
                '!=',
                $exceptId
            )
            ->update([
                'is_default' =>
                    false,
            ]);
    }
}