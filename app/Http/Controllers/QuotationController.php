<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\QuotationTemplate;
use App\Services\QuotationPricingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class QuotationController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return ['auth'];
    }

    public function index()
    {
        return Inertia::render('Quotations/Index', [
            'quotations' => Quotation::query()
                ->orderByDesc('id')
                ->paginate(25)
                ->through(function (Quotation $q): array {
                    $renderSnapshot = json_decode(
                        (string) $q->render_snapshot,
                        true
                    ) ?: [];

                    return [
                        'id' => $q->id,
                        'quote_no' => $q->quote_no,
                        'quotation_date' => optional(
                            $q->quotation_date
                        )->format('Y-m-d'),

                        'title' => $q->title,
                        'package_name' => $q->package_name,

                        'main_guest_name' => $renderSnapshot[
                            'main_guest_name'
                        ] ?? null,

                        'adults' => (int) $q->adults,
                        'children' => (int) $q->children,
                        'infants' => (int) $q->infants,

                        'flight_enabled' => (bool) $q->flight_enabled,

                        'package_per_adult' =>
                            $q->package_per_adult,

                        'package_per_child' =>
                            $q->package_per_child,

                        'package_per_infant' =>
                            $q->package_per_infant,

                        'status' => $q->status,
                    ];
                }),
        ]);
    }

    public function create()
    {
        $templates = QuotationTemplate::query()
            ->whereIn(
                'template_type',
                [
                    'transport',
                    'hotel',
                    'visa',
                ]
            )
            ->where(
                'is_active',
                true
            )
            ->orderByDesc('is_default')
            ->orderBy('template_type')
            ->orderBy('name')
            ->get()
            ->map(
                fn (
                    QuotationTemplate $template
                ): array => $this->templateForQuote(
                    $template
                )
            )
            ->values()
            ->all();

        $defaults = [];

        foreach (
            $templates as $template
        ) {
            if (
                !empty(
                    $template['is_default']
                )
                &&
                !isset(
                    $defaults[
                        $template['template_type']
                    ]
                )
            ) {
                $defaults[
                    $template['template_type']
                ] = $template['id'];
            }
        }

        return Inertia::render(
            'Quotations/Create',
            [
                'accounts' => DB::table(
                    'accounts'
                )
                    ->where(
                        'is_active',
                        true
                    )
                    ->select(
                        'id',
                        'name',
                        'code'
                    )
                    ->orderBy('name')
                    ->get(),

                'hotels' => DB::table(
                    'hotels'
                )
                    ->where(
                        'is_active',
                        true
                    )
                    ->select(
                        'id',
                        'name',
                        'city'
                    )
                    ->orderBy('name')
                    ->get(),

                'templates' =>
                    $templates,

                'defaultTemplateIds' => [
                    'transport' =>
                        $defaults['transport']
                        ?? null,

                    'visa' =>
                        $defaults['visa']
                        ?? null,

                    'hotel' =>
                        $defaults['hotel']
                        ?? null,
                ],
            ]
        );
    }

    public function store(
        Request $request,
        QuotationPricingService $pricing
    ) {
        $data = $request->validate([
            'quotation_date' => [
                'required',
                'date',
            ],

            'valid_until' => [
                'nullable',
                'date',
                'after_or_equal:quotation_date',
            ],

            'client_account_id' => [
                'nullable',
                'integer',
            ],

            'title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'package_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'route' => [
                'nullable',
                'string',
                'max:255',
            ],

            'travel_start_date' => [
                'required',
                'date',
            ],

            'travel_end_date' => [
                'required',
                'date',
                'after_or_equal:travel_start_date',
            ],

            'main_guest_name' => [
                'required',
                'string',
                'max:255',
            ],

            'adults' => [
                'required',
                'integer',
                'min:1',
            ],

            'children' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'infants' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'children_enabled' => [
                'boolean',
            ],

            'infants_enabled' => [
                'boolean',
            ],

            'roe_sar_to_pkr' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'package_profit_per_person' => [
                'required',
                'numeric',
                'min:0',
            ],

            'transport_template_id' => [
                'required',
                'integer',
            ],

            'visa_template_id' => [
                'required',
                'integer',
            ],

            'hotel_template_id' => [
                'required',
                'integer',
            ],

            'hotel_sectors' => [
                'required',
                'array',
                'min:1',
            ],

            'hotel_sectors.*.sector_name' => [
                'required',
                'string',
                'max:150',
            ],

            'hotel_sectors.*.hotel_name' => [
                'required',
                'string',
                'max:255',
            ],

            'hotel_sectors.*.hotel_id' => [
                'nullable',
                'integer',
            ],

            'hotel_sectors.*.city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'hotel_sectors.*.room_type' => [
                'required',
                'string',
                'max:150',
            ],

            'hotel_sectors.*.meal' => [
                'required',
                'string',
                'max:100',
            ],

            'hotel_sectors.*.nights' => [
                'required',
                'integer',
                'min:1',
            ],

            'hotel_sectors.*.rate' => [
                'required',
                'numeric',
                'min:0',
            ],

            'flight_enabled' => [
                'boolean',
            ],

            'flight' => [
                'nullable',
                'array',
            ],

            'flight.airline_name' => [
                'required_if:flight_enabled,true',
                'nullable',
                'string',
                'max:150',
            ],

            'flight.route' => [
                'required_if:flight_enabled,true',
                'nullable',
                'string',
                'max:255',
            ],

            'flight.departure_date' => [
                'nullable',
                'date',
            ],

            'flight.return_date' => [
                'nullable',
                'date',
                'after_or_equal:flight.departure_date',
            ],

            'flight.flight_details' => [
                'nullable',
                'string',
            ],

            /*
             * Airfare may have its own currency.
             */
            'flight.currency_code' => [
                'required_if:flight_enabled,true',
                'nullable',
                'string',
                'max:10',
            ],

            'flight.adult_fare' => [
                'required_if:flight_enabled,true',
                'nullable',
                'numeric',
                'min:0',
            ],

            'flight.child_fare' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf(
                    fn (): bool =>
                        (int) $request->input(
                            'children',
                            0
                        ) > 0
                ),
            ],

            'flight.infant_fare' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf(
                    fn (): bool =>
                        (int) $request->input(
                            'infants',
                            0
                        ) > 0
                ),
            ],
        ]);

        $data['title'] =
            trim(
                (string) (
                    $data['title']
                    ?? 'Umrah Quotation'
                )
            )
            ?: 'Umrah Quotation';

        $data['children'] =
            ($data['children_enabled'] ?? false)
                ? (int) (
                    $data['children']
                    ?? 0
                )
                : 0;

        $data['infants'] =
            ($data['infants_enabled'] ?? false)
                ? (int) (
                    $data['infants']
                    ?? 0
                )
                : 0;

        $data['children_enabled'] =
            $data['children'] > 0;

        $data['infants_enabled'] =
            $data['infants'] > 0;

        $data['flight_enabled'] =
            (bool) (
                $data['flight_enabled']
                ?? false
            );

        $data['hotel_sectors'] =
            array_values(
                $data['hotel_sectors']
            );

        $data['package_profit_per_person'] =
            (float) (
                $data[
                    'package_profit_per_person'
                ]
            );

        $data['roe_sar_to_pkr'] =
            (float) (
                $data[
                    'roe_sar_to_pkr'
                ]
            );

        /*
         * Quote/package currency is fixed:
         * final package prices are PKR.
         */
        $data['currency_code'] = 'PKR';

        $pricing->validatePassengerCounts(
            $data
        );

        $transportTemplate =
            $this->requireTemplate(
                (int)
                $data['transport_template_id'],
                'transport'
            );

        $visaTemplate =
            $this->requireTemplate(
                (int)
                $data['visa_template_id'],
                'visa'
            );

        $hotelTemplate =
            $this->requireTemplate(
                (int)
                $data['hotel_template_id'],
                'hotel'
            );

        $transportConfig =
            $this->templateConfig(
                $transportTemplate
            );

        $visaConfig =
            $this->templateConfig(
                $visaTemplate
            );

        $hotelConfig =
            $this->templateConfig(
                $hotelTemplate
            );

        /*
         * Rates stored in pricing templates are interpreted
         * as SAR throughout Quote Maker.
         */
        if (
            isset(
                $transportConfig[
                    'currency_code'
                ]
            )
            &&
            strtoupper(
                trim(
                    (string)
                    $transportConfig[
                        'currency_code'
                    ]
                )
            ) !== 'SAR'
        ) {
            throw ValidationException::withMessages([
                'transport_template_id' =>
                    'Transport template pricing must be in SAR.',
            ]);
        }

        if (
            isset(
                $visaConfig[
                    'currency_code'
                ]
            )
            &&
            strtoupper(
                trim(
                    (string)
                    $visaConfig[
                        'currency_code'
                    ]
                )
            ) !== 'SAR'
        ) {
            throw ValidationException::withMessages([
                'visa_template_id' =>
                    'Visa template pricing must be in SAR.',
            ]);
        }

        $expectedHotelSectors =
            array_values(
                array_map(
                    static fn (
                        array $sector
                    ): string =>
                        trim(
                            (string) (
                                $sector['name']
                                ?? ''
                            )
                        ),
                    array_values(
                        array_filter(
                            $hotelConfig[
                                'sectors'
                            ] ?? [],
                            static fn (
                                $sector
                            ): bool =>
                                is_array(
                                    $sector
                                )
                        )
                    )
                )
            );

        $submittedHotelSectors =
            array_values(
                array_map(
                    static fn (
                        array $sector
                    ): string =>
                        trim(
                            (string) (
                                $sector[
                                    'sector_name'
                                ] ?? ''
                            )
                        ),
                    $data['hotel_sectors']
                )
            );

        if (
            $expectedHotelSectors
            !==
            $submittedHotelSectors
        ) {
            throw ValidationException::withMessages([
                'hotel_sectors' =>
                    'Hotel sector entries do not match the selected hotel sector template.',
            ]);
        }

        $totalPersons =
            (int) $data['adults']
            +
            (int) $data['children']
            +
            (int) $data['infants'];

        $transportItems =
            $this->buildTransportItems(
                $transportTemplate,
                $transportConfig,
                (int) $data['adults']
            );

        $visaItem =
            $this->buildVisaItem(
                $visaTemplate,
                $visaConfig,
                $data
            );

        $hotelItems =
            $this->buildHotelItems(
                $hotelTemplate,
                $hotelConfig,
                $data['hotel_sectors'],
                $data
            );

        $items =
            array_merge(
                $hotelItems,
                $transportItems,
                [
                    $visaItem,
                ]
            );

        $dataForPricing =
            $data;

        $dataForPricing['items'] =
            $items;

        $calculated =
            $pricing->calculate(
                $dataForPricing
            );

        /*
         * Freeze all selected templates and all calculation inputs.
         */
        $selectedTemplateSnapshot = [
            'version' => 2,

            'templates' => [
                'transport' =>
                    $this->templateForQuote(
                        $transportTemplate
                    ),

                'visa' =>
                    $this->templateForQuote(
                        $visaTemplate
                    ),

                'hotel' =>
                    $this->templateForQuote(
                        $hotelTemplate
                    ),
            ],
        ];

        $renderSnapshot = [
            'version' => 2,

            'main_guest_name' =>
                trim(
                    $data['main_guest_name']
                ),

            'total_persons' =>
                $totalPersons,

            'travel_start_date' =>
                $data['travel_start_date'],

            'travel_end_date' =>
                $data['travel_end_date'],

            'quotation_date' =>
                $data['quotation_date'],

            'valid_until' =>
                $data['valid_until']
                ?? null,

            /*
             * Frozen financial inputs.
             */
            'package_currency' =>
                'PKR',

            'base_package_currency' =>
                'SAR',

            'roe_sar_to_pkr' =>
                round(
                    $data[
                        'roe_sar_to_pkr'
                    ],
                    6
                ),

            'package_profit_per_person_pkr' =>
                round(
                    $data[
                        'package_profit_per_person'
                    ],
                    2
                ),

            'duration_days' =>
                Carbon::parse(
                    $data['travel_start_date']
                )->diffInDays(
                    Carbon::parse(
                        $data['travel_end_date']
                    )
                ) + 1,

            'selected_template_ids' => [
                'transport' =>
                    $transportTemplate->id,

                'visa' =>
                    $visaTemplate->id,

                'hotel' =>
                    $hotelTemplate->id,
            ],

            'selected_template_names' => [
                'transport' =>
                    $transportTemplate->name,

                'visa' =>
                    $visaTemplate->name,

                'hotel' =>
                    $hotelTemplate->name,
            ],

            'calculation' =>
                $calculated,
        ];

        $quoteNo =
            $this->nextQuoteNo();

        $quotation =
            DB::transaction(
                function () use (
                    $data,
                    $items,
                    $calculated,
                    $selectedTemplateSnapshot,
                    $renderSnapshot,
                    $quoteNo,
                    $request,
                    $hotelTemplate
                ): Quotation {
                    $quote =
                        Quotation::create([
                            'quote_no' =>
                                $quoteNo,

                            'quotation_date' =>
                                $data['quotation_date'],

                            'valid_until' =>
                                $data['valid_until']
                                ?? null,

                            'client_account_id' =>
                                $data[
                                    'client_account_id'
                                ]
                                ?? null,

                            'title' =>
                                $data['title'],

                            'package_name' =>
                                $data['package_name']
                                ?? null,

                            'route' =>
                                $data['route']
                                ?? null,

                            'travel_start_date' =>
                                $data[
                                    'travel_start_date'
                                ],

                            'travel_end_date' =>
                                $data[
                                    'travel_end_date'
                                ],

                            'adults' =>
                                $data['adults'],

                            'children' =>
                                $data['children'],

                            'infants' =>
                                $data['infants'],

                            'children_enabled' =>
                                $data[
                                    'children_enabled'
                                ],

                            'infants_enabled' =>
                                $data[
                                    'infants_enabled'
                                ],

                            'flight_enabled' =>
                                $data[
                                    'flight_enabled'
                                ],

                            /*
                             * Final package currency is PKR.
                             */
                            'currency_code' =>
                                'PKR',

                            'package_per_adult' =>
                                $calculated[
                                    'package_per_adult'
                                ],

                            'package_per_child' =>
                                $calculated[
                                    'package_per_child'
                                ],

                            'package_per_infant' =>
                                $calculated[
                                    'package_per_infant'
                                ],

                            'template_snapshot' =>
                                json_encode(
                                    $selectedTemplateSnapshot,
                                    JSON_UNESCAPED_UNICODE
                                    |
                                    JSON_UNESCAPED_SLASHES
                                ),

                            'render_snapshot' =>
                                json_encode(
                                    $renderSnapshot,
                                    JSON_UNESCAPED_UNICODE
                                    |
                                    JSON_UNESCAPED_SLASHES
                                ),

                            'status' =>
                                'draft',

                            'notes' =>
                                null,

                            'terms_conditions' =>
                                null,

                            'template_id' =>
                                $hotelTemplate->id,

                            'branch_id' =>
                                $request->user()?->branch_id,

                            'department_id' =>
                                $request->user()?->department_id,

                            'created_by' =>
                                $request->user()?->id,
                        ]);

                    foreach (
                        $items as $index => $item
                    ) {
                        $quote
                            ->items()
                            ->create([
                                'item_type' =>
                                    $item[
                                        'item_type'
                                    ],

                                'section' =>
                                    $item['section']
                                    ??
                                    ucfirst(
                                        $item[
                                            'item_type'
                                        ]
                                    ),

                                'sort_order' =>
                                    $index,

                                'title' =>
                                    $item['title'],

                                'description' =>
                                    $item[
                                        'description'
                                    ]
                                    ?? null,

                                'hotel_id' =>
                                    $item['hotel_id']
                                    ?? null,

                                'city' =>
                                    $item['city']
                                    ?? null,

                                'check_in' =>
                                    $item[
                                        'check_in'
                                    ]
                                    ?? null,

                                'check_out' =>
                                    $item[
                                        'check_out'
                                    ]
                                    ?? null,

                                'nights' =>
                                    $item['nights']
                                    ?? null,

                                'room_type' =>
                                    $item[
                                        'room_type'
                                    ]
                                    ?? null,

                                'meal' =>
                                    $item['meal']
                                    ?? null,

                                'room_quantity' =>
                                    $item[
                                        'room_quantity'
                                    ]
                                    ?? null,

                                'from_location_id' =>
                                    $item[
                                        'from_location_id'
                                    ]
                                    ?? null,

                                'to_location_id' =>
                                    $item[
                                        'to_location_id'
                                    ]
                                    ?? null,

                                'from_location_name' =>
                                    $item[
                                        'from_location_name'
                                    ]
                                    ?? null,

                                'to_location_name' =>
                                    $item[
                                        'to_location_name'
                                    ]
                                    ?? null,

                                'vehicle_id' =>
                                    $item[
                                        'vehicle_id'
                                    ]
                                    ?? null,

                                'quantity' =>
                                    $item[
                                        'quantity'
                                    ]
                                    ?? 1,

                                /*
                                 * Package rates are ALWAYS SAR.
                                 */
                                'rate' =>
                                    $item['rate']
                                    ?? 0,

                                'rate_currency_code' =>
                                    'SAR',

                                'adult_amount' =>
                                    $item[
                                        'adult_amount'
                                    ]
                                    ?? 0,

                                'child_amount' =>
                                    $item[
                                        'child_amount'
                                    ]
                                    ?? 0,

                                'infant_amount' =>
                                    $item[
                                        'infant_amount'
                                    ]
                                    ?? 0,

                                'metadata_json' =>
                                    $item[
                                        'metadata_json'
                                    ]
                                    ?? null,
                            ]);
                    }

                    if (
                        $data[
                            'flight_enabled'
                        ]
                    ) {
                        $f =
                            $data['flight']
                            ?? [];

                        $quote
                            ->flight()
                            ->create([
                                'airline_name' =>
                                    trim(
                                        (string) (
                                            $f[
                                                'airline_name'
                                            ]
                                            ?? ''
                                        )
                                    ),

                                'route' =>
                                    trim(
                                        (string) (
                                            $f[
                                                'route'
                                            ]
                                            ?? ''
                                        )
                                    )
                                    ?: null,

                                'departure_date' =>
                                    $f[
                                        'departure_date'
                                    ]
                                    ??
                                    $data[
                                        'travel_start_date'
                                    ],

                                'return_date' =>
                                    $f[
                                        'return_date'
                                    ]
                                    ??
                                    $data[
                                        'travel_end_date'
                                    ],

                                'flight_details' =>
                                    $f[
                                        'flight_details'
                                    ]
                                    ?? null,

                                'currency_code' =>
                                    strtoupper(
                                        trim(
                                            (string) (
                                                $f[
                                                    'currency_code'
                                                ]
                                                ??
                                                'PKR'
                                            )
                                        )
                                    ),

                                'adult_fare' =>
                                    (float) (
                                        $f[
                                            'adult_fare'
                                        ]
                                        ?? 0
                                    ),

                                'child_fare' =>
                                    (float) (
                                        $f[
                                            'child_fare'
                                        ]
                                        ?? 0
                                    ),

                                'infant_fare' =>
                                    (float) (
                                        $f[
                                            'infant_fare'
                                        ]
                                        ?? 0
                                    ),

                                'adult_total' =>
                                    $calculated[
                                        'flight'
                                    ][
                                        'adult_total'
                                    ]
                                    ?? 0,

                                'child_total' =>
                                    $calculated[
                                        'flight'
                                    ][
                                        'child_total'
                                    ]
                                    ?? 0,

                                'infant_total' =>
                                    $calculated[
                                        'flight'
                                    ][
                                        'infant_total'
                                    ]
                                    ?? 0,
                            ]);
                    }

                    return $quote;
                }
            );

        return redirect()
            ->route(
                'quotations.show',
                $quotation
            )
            ->with(
                'success',
                'Quotation created.'
            );
    }

    public function show(
        Quotation $quotation
    ) {
        $quotation->load([
            'items',
            'flight',
            'client',
        ]);

        $renderSnapshot =
            json_decode(
                (string)
                $quotation->render_snapshot,
                true
            ) ?: [];

        $templateSnapshot =
            json_decode(
                (string)
                $quotation->template_snapshot,
                true
            ) ?: [];

        return Inertia::render(
            'Quotations/Show',
            [
                'quotation' =>
                    $quotation,

                'quoteMeta' => [
                    'main_guest_name' =>
                        $renderSnapshot[
                            'main_guest_name'
                        ]
                        ?? null,

                    'total_persons' =>
                        $renderSnapshot[
                            'total_persons'
                        ]
                        ??
                        (
                            (int)
                            $quotation->adults
                            +
                            (int)
                            $quotation->children
                            +
                            (int)
                            $quotation->infants
                        ),

                    'package_profit_per_person' =>
                        $renderSnapshot[
                            'package_profit_per_person_pkr'
                        ]
                        ?? 0,

                    'roe_sar_to_pkr' =>
                        $renderSnapshot[
                            'roe_sar_to_pkr'
                        ]
                        ?? null,

                    'selected_template_names' =>
                        $renderSnapshot[
                            'selected_template_names'
                        ]
                        ?? [],

                    'duration_days' =>
                        $renderSnapshot[
                            'duration_days'
                        ]
                        ?? null,

                    'calculation' =>
                        $renderSnapshot[
                            'calculation'
                        ]
                        ?? [],

                    'template_snapshot' =>
                        $templateSnapshot,
                ],
            ]
        );
    }

    public function pdf(
        Quotation $quotation
    ) {
        $quotation->load([
            'items',
            'flight',
            'client',
        ]);

        $templateSnapshot =
            json_decode(
                (string)
                $quotation->template_snapshot,
                true
            ) ?: [];

        $renderSnapshot =
            json_decode(
                (string)
                $quotation->render_snapshot,
                true
            ) ?: [];

        $pdf =
            Pdf::loadView(
                'quotations.pdf',
                [
                    'quotation' =>
                        $quotation,

                    'quoteMeta' =>
                        $renderSnapshot,

                    'templateSnapshot' =>
                        $templateSnapshot,
                ]
            )
            ->setPaper(
                'a4',
                'portrait'
            );

        return $pdf->stream(
            $quotation->quote_no
            . '.pdf'
        );
    }

    private function requireTemplate(
        int $id,
        string $type
    ): QuotationTemplate {
        $template =
            QuotationTemplate::query()
                ->where(
                    'id',
                    $id
                )
                ->where(
                    'template_type',
                    $type
                )
                ->where(
                    'is_active',
                    true
                )
                ->first();

        if (
            !$template
        ) {
            throw ValidationException::withMessages([
                "{$type}_template_id" =>
                    ucfirst($type)
                    .
                    ' template is unavailable or inactive.',
            ]);
        }

        return $template;
    }

    private function templateForQuote(
        QuotationTemplate $template
    ): array {
        return [
            'id' =>
                (int)
                $template->id,

            'name' =>
                $template->name,

            'description' =>
                $template->description,

            'template_type' =>
                $template->template_type,

            'is_default' =>
                (bool)
                $template->is_default,

            'is_active' =>
                (bool)
                $template->is_active,

            'config_json' =>
                $this->templateConfig(
                    $template
                ),
        ];
    }

    private function templateConfig(
        QuotationTemplate $template
    ): array {
        $config =
            $template->config_json;

        if (
            is_string(
                $config
            )
        ) {
            $config =
                json_decode(
                    $config,
                    true
                ) ?: [];
        }

        return is_array(
            $config
        )
            ? $config
            : [];
    }

    private function buildTransportItems(
        QuotationTemplate $template,
        array $config,
        int $adultsForRule
    ): array {
        $rules =
            array_values(
                array_filter(
                    $config[
                        'vehicle_rules'
                    ] ?? [],
                    static fn (
                        $rule
                    ): bool =>
                        is_array(
                            $rule
                        )
                )
            );

        $selectedRule =
            null;

        foreach (
            $rules as $rule
        ) {
            $min =
                (int) (
                    $rule[
                        'min_passengers'
                    ]
                    ?? 0
                );

            $max =
                (int) (
                    $rule[
                        'max_passengers'
                    ]
                    ?? 0
                );

            if (
                $adultsForRule >= $min
                &&
                $adultsForRule <= $max
            ) {
                $selectedRule =
                    $rule;
                break;
            }
        }

        if (
            !$selectedRule
        ) {
            throw ValidationException::withMessages([
                'transport_template_id' =>
                    "No transport vehicle rule covers {$adultsForRule} adults in the selected template.",
            ]);
        }

        $vehicleId =
            (int) (
                $selectedRule[
                    'vehicle_id'
                ]
                ?? 0
            );

        $selectedVehicle =
            collect(
                $config['vehicles']
                ?? []
            )
                ->firstWhere(
                    'vehicle_id',
                    $vehicleId
                );

        $vehicleName =
            is_array(
                $selectedVehicle
            )
                ? trim(
                    (string) (
                        $selectedVehicle[
                            'vehicle_name_snapshot'
                        ]
                        ?? ''
                    )
                )
                : '';

        $vehicleName =
            $vehicleName !== ''
                ? $vehicleName
                : 'Selected Vehicle';

        $locationIds =
            collect(
                $config['sectors']
                ?? []
            )
                ->filter(
                    fn (
                        $sector
                    ): bool =>
                        is_array(
                            $sector
                        )
                )
                ->flatMap(
                    fn (
                        array $sector
                    ) => [
                        !empty(
                            $sector[
                                'from_location_id'
                            ]
                        )
                            ? (int) (
                                $sector[
                                    'from_location_id'
                                ]
                            )
                            : null,

                        !empty(
                            $sector[
                                'to_location_id'
                            ]
                        )
                            ? (int) (
                                $sector[
                                    'to_location_id'
                                ]
                            )
                            : null,
                    ]
                )
                ->filter()
                ->unique()
                ->values()
                ->all();

        $locationNames =
            $locationIds === []
                ? []
                : DB::table(
                    'transfer_locations'
                )
                    ->whereIn(
                        'id',
                        $locationIds
                    )
                    ->pluck(
                        'name',
                        'id'
                    )
                    ->all();

        $items = [];

        foreach (
            array_values(
                $config['sectors']
                ?? []
            ) as $sector
        ) {
            if (
                !is_array(
                    $sector
                )
            ) {
                continue;
            }

            $sectorName =
                trim(
                    (string) (
                        $sector['name']
                        ?? ''
                    )
                );

            if (
                $sectorName === ''
            ) {
                continue;
            }

            $rates =
                is_array(
                    $sector['rates']
                    ?? null
                )
                    ? $sector['rates']
                    : [];

            $rateKey =
                (string)
                $vehicleId;

            if (
                !array_key_exists(
                    $rateKey,
                    $rates
                )
            ) {
                throw ValidationException::withMessages([
                    'transport_template_id' =>
                        "Transport rate for {$sectorName} is missing for the selected vehicle.",
                ]);
            }

            $fromId =
                !empty(
                    $sector[
                        'from_location_id'
                    ]
                )
                    ? (int) (
                        $sector[
                            'from_location_id'
                        ]
                    )
                    : null;

            $toId =
                !empty(
                    $sector[
                        'to_location_id'
                    ]
                )
                    ? (int) (
                        $sector[
                            'to_location_id'
                        ]
                    )
                    : null;

            $fromName =
                $fromId
                    ? (
                        $locationNames[
                            $fromId
                        ]
                        ?? null
                    )
                    : null;

            $toName =
                $toId
                    ? (
                        $locationNames[
                            $toId
                        ]
                        ?? null
                    )
                    : null;

            $items[] = [
                'item_type' =>
                    'transport',

                'section' =>
                    'Transport',

                'title' =>
                    $sectorName,

                'description' =>
                    trim(
                        (string) (
                            $sector['notes']
                            ?? ''
                        )
                    )
                    ?: null,

                'from_location_id' =>
                    $fromId,

                'to_location_id' =>
                    $toId,

                'from_location_name' =>
                    $fromName,

                'to_location_name' =>
                    $toName,

                'vehicle_id' =>
                    $vehicleId,

                'quantity' =>
                    1,

                /*
                 * Transport template rate = SAR.
                 */
                'rate' =>
                    (float)
                    $rates[
                        $rateKey
                    ],

                'rate_currency_code' =>
                    'SAR',

                'adult_amount' =>
                    0,

                'child_amount' =>
                    0,

                'infant_amount' =>
                    0,

                'metadata_json' => [
                    'source_template_id' =>
                        (int)
                        $template->id,

                    'source_template_name_snapshot' =>
                        $template->name,

                    'transport_sector_template_snapshot' =>
                        $sector,

                    'vehicle_rule_snapshot' =>
                        $selectedRule,

                    'vehicle_name_snapshot' =>
                        $vehicleName,

                    'adults_for_rule' =>
                        $adultsForRule,

                    'currency_snapshot' =>
                        'SAR',
                ],
            ];
        }

        if (
            $items === []
        ) {
            throw ValidationException::withMessages([
                'transport_template_id' =>
                    'The selected transport template has no sectors.',
            ]);
        }

        return $items;
    }

    private function buildVisaItem(
        QuotationTemplate $template,
        array $config,
        array $data
    ): array {
        $durationDays =
            Carbon::parse(
                $data[
                    'travel_start_date'
                ]
            )->diffInDays(
                Carbon::parse(
                    $data[
                        'travel_end_date'
                    ]
                )
            ) + 1;

        $pricingMode =
            (string) (
                $config[
                    'pricing_mode'
                ]
                ?? 'fixed'
            );

        $rateSAR = 0.0;
        $matchedRange = null;

        if (
            $pricingMode ===
            'nights_based'
        ) {
            foreach (
                array_values(
                    $config[
                        'day_ranges'
                    ]
                    ?? []
                ) as $range
            ) {
                if (
                    !is_array(
                        $range
                    )
                ) {
                    continue;
                }

                $min =
                    (int) (
                        $range[
                            'min_days'
                        ]
                        ?? 0
                    );

                $max =
                    (int) (
                        $range[
                            'max_days'
                        ]
                        ?? 0
                    );

                if (
                    $durationDays >= $min
                    &&
                    $durationDays <= $max
                ) {
                    $rateSAR =
                        (float) (
                            $range[
                                'rate'
                            ]
                            ?? 0
                        );

                    $matchedRange =
                        $range;

                    break;
                }
            }

            if (
                !$matchedRange
            ) {
                throw ValidationException::withMessages([
                    'visa_template_id' =>
                        "No visa price range covers {$durationDays} days in the selected visa template.",
                ]);
            }
        } else {
            $rateSAR =
                (float) (
                    $config[
                        'fixed_rate'
                    ]
                    ?? 0
                );
        }

        if (
            $rateSAR < 0
        ) {
            throw ValidationException::withMessages([
                'visa_template_id' =>
                    'The selected visa template contains an invalid price.',
            ]);
        }

        $visaName =
            trim(
                (string) (
                    $config[
                        'visa_name_snapshot'
                    ]
                    ?? $template->name
                )
            );

        $quantity =
            (int) $data['adults']
            +
            (int) $data['children']
            +
            (int) $data['infants'];

        return [
            'item_type' =>
                'visa',

            'section' =>
                'Visa',

            'title' =>
                $visaName,

            'description' =>
                null,

            'quantity' =>
                $quantity,

            /*
             * Visa rate = SAR per person.
             */
            'rate' =>
                $rateSAR,

            'rate_currency_code' =>
                'SAR',

            'adult_amount' =>
                $rateSAR,

            'child_amount' =>
                $rateSAR,

            'infant_amount' =>
                $rateSAR,

            'metadata_json' => [
                'source_template_id' =>
                    (int)
                    $template->id,

                'source_template_name_snapshot' =>
                    $template->name,

                'visa_name_snapshot' =>
                    $visaName,

                'pricing_mode_snapshot' =>
                    $pricingMode,

                'duration_days' =>
                    $durationDays,

                'matched_day_range_snapshot' =>
                    $matchedRange,

                'visa_type_id_snapshot' =>
                    isset(
                        $config[
                            'visa_type_id'
                        ]
                    )
                        ? (int) (
                            $config[
                                'visa_type_id'
                            ]
                        )
                        : null,

                'currency_snapshot' =>
                    'SAR',
            ],
        ];
    }

    private function buildHotelItems(
        QuotationTemplate $template,
        array $config,
        array $hotelSectors,
        array $data
    ): array {
        $items = [];

        $cursor =
            Carbon::parse(
                $data[
                    'travel_start_date'
                ]
            )->startOfDay();

        foreach (
            $hotelSectors as $index => $sector
        ) {
            $nights =
                (int)
                $sector['nights'];

            $checkIn =
                $cursor->copy();

            $checkOut =
                $cursor
                    ->copy()
                    ->addDays(
                        $nights
                    );

            $cursor =
                $checkOut->copy();

            $hotelId =
                !empty(
                    $sector['hotel_id']
                )
                    ? (int) (
                        $sector[
                            'hotel_id'
                        ]
                    )
                    : null;

            $hotelName =
                trim(
                    (string)
                    $sector['hotel_name']
                );

            $city =
                trim(
                    (string) (
                        $sector['city']
                        ?? ''
                    )
                )
                ?: null;

            if (
                $hotelId
            ) {
                $hotel =
                    DB::table(
                        'hotels'
                    )
                        ->where(
                            'id',
                            $hotelId
                        )
                        ->where(
                            'is_active',
                            true
                        )
                        ->select(
                            'id',
                            'name',
                            'city'
                        )
                        ->first();

                if (
                    !$hotel
                ) {
                    throw ValidationException::withMessages([
                        "hotel_sectors.{$index}.hotel_id" =>
                            'Selected hotel is unavailable.',
                    ]);
                }

                if (
                    strcasecmp(
                        trim(
                            (string)
                            $hotel->name
                        ),
                        $hotelName
                    ) !== 0
                ) {
                    throw ValidationException::withMessages([
                        "hotel_sectors.{$index}.hotel_name" =>
                            'Hotel name does not match the selected hotel.',
                    ]);
                }

                $city =
                    $city
                    ?:
                    (
                        $hotel->city
                        ?? null
                    );
            }

            $items[] = [
                'item_type' =>
                    'hotel',

                'section' =>
                    trim(
                        (string)
                        $sector[
                            'sector_name'
                        ]
                    ),

                'title' =>
                    $hotelName,

                'description' =>
                    null,

                'hotel_id' =>
                    $hotelId,

                'city' =>
                    $city,

                'check_in' =>
                    $checkIn->format(
                        'Y-m-d'
                    ),

                'check_out' =>
                    $checkOut->format(
                        'Y-m-d'
                    ),

                'nights' =>
                    $nights,

                'room_type' =>
                    trim(
                        (string)
                        $sector[
                            'room_type'
                        ]
                    ),

                'meal' =>
                    trim(
                        (string)
                        $sector['meal']
                    ),

                'room_quantity' =>
                    1,

                'quantity' =>
                    1,

                /*
                 * Hotel rate entered in Quote Maker = SAR/night.
                 */
                'rate' =>
                    (float)
                    $sector['rate'],

                'rate_currency_code' =>
                    'SAR',

                'adult_amount' =>
                    0,

                'child_amount' =>
                    0,

                'infant_amount' =>
                    0,

                'metadata_json' => [
                    'source_template_id' =>
                        (int)
                        $template->id,

                    'source_template_name_snapshot' =>
                        $template->name,

                    'hotel_sector_template_snapshot' => [
                        'index' =>
                            $index,

                        'name' =>
                            $sector[
                                'sector_name'
                            ],
                    ],

                    'hotel_name_snapshot' =>
                        $hotelName,

                    'city_snapshot' =>
                        $city,

                    'room_type_snapshot' =>
                        trim(
                            (string)
                            $sector[
                                'room_type'
                            ]
                        ),

                    'meal_snapshot' =>
                        trim(
                            (string)
                            $sector['meal']
                        ),

                    'nightly_rate_snapshot' =>
                        (float)
                        $sector['rate'],

                    'currency_snapshot' =>
                        'SAR',
                ],
            ];
        }

        return $items;
    }

    private function nextQuoteNo(): string
    {
        $prefix =
            'QT-'
            .
            now()->format(
                'Ym'
            )
            .
            '-';

        $last =
            Quotation::query()
                ->where(
                    'quote_no',
                    'like',
                    $prefix . '%'
                )
                ->orderByDesc('id')
                ->value(
                    'quote_no'
                );

        $number =
            $last
                ? (
                    (int)
                    substr(
                        $last,
                        -5
                    )
                ) + 1
                : 1;

        return $prefix
            .
            str_pad(
                (string)
                $number,
                5,
                '0',
                STR_PAD_LEFT
            );
    }
}