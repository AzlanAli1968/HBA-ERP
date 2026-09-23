<?php

namespace App\Services;

use InvalidArgumentException;

class QuotationPricingService
{
    /**
     * Package pricing:
     *
     * - Hotel, transport and visa rates are ALWAYS SAR.
     * - ROE converts SAR to PKR.
     * - Markup/profit is entered directly in PKR per person.
     * - Airfare is completely separate and is NEVER included here.
     */
    public function calculate(
        array $data
    ): array {
        $adults =
            max(
                1,
                (int) (
                    $data['adults']
                    ?? 0
                )
            );

        $children =
            max(
                0,
                (int) (
                    $data['children']
                    ?? 0
                )
            );

        $infants =
            max(
                0,
                (int) (
                    $data['infants']
                    ?? 0
                )
            );

        $roe =
            (float) (
                $data['roe_sar_to_pkr']
                ?? 0
            );

        if (
            $roe <= 0
        ) {
            throw new InvalidArgumentException(
                'A valid SAR to PKR ROE is required.'
            );
        }

        $markupPerPersonPKR =
            max(
                0.0,
                (float) (
                    $data[
                        'package_profit_per_person'
                    ]
                    ?? 0
                )
            );

        /*
         * ---------------------------------------------------------------
         * BASE PACKAGE COSTS IN SAR
         * ---------------------------------------------------------------
         */

        $adultBaseSAR = 0.0;
        $childBaseSAR = 0.0;
        $infantBaseSAR = 0.0;

        /*
         * Transport is intentionally accumulated in two buckets.
         *
         * NORMAL  = complete vehicle/sector amount in SAR.
         * SHARING = SAR per person and is added directly.
         */
        $normalTransportTotalSAR = 0.0;
        $sharingTransportTotalSAR = 0.0;

        foreach (
            (
                $data['items']
                ?? []
            ) as $item
        ) {
            $type =
                strtolower(
                    trim(
                        (string) (
                            $item[
                                'item_type'
                            ]
                            ?? 'other'
                        )
                    )
                );

            $rateSAR =
                max(
                    0.0,
                    (float) (
                        $item['rate']
                        ?? 0
                    )
                );

            $quantity =
                max(
                    1.0,
                    (float) (
                        $item[
                            'quantity'
                        ]
                        ?? 1
                    )
                );

            $nights =
                max(
                    0,
                    (int) (
                        $item[
                            'nights'
                        ]
                        ?? 0
                    )
                );

            switch (
                $type
            ) {
                case 'hotel':
                    /*
                     * Hotel:
                     *
                     * nightly SAR rate
                     * × nights
                     * ÷ adults
                     *
                     * Children and infants do not affect
                     * hotel pricing.
                     */
                    $adultBaseSAR +=
                        (
                            $rateSAR
                            *
                            $nights
                        )
                        /
                        $adults;
                    break;

                case 'transport':
                    /*
                     * Transport is split into NORMAL and SHARING totals.
                     */
                    $transportAmount =
                        $rateSAR
                        *
                        $quantity;

                    $metadata =
                        $item['metadata_json']
                        ?? [];

                    if (
                        is_string(
                            $metadata
                        )
                    ) {
                        $metadata =
                            json_decode(
                                $metadata,
                                true
                            )
                            ?: [];
                    }

                    $sectorSnapshot =
                        is_array(
                            $metadata
                        )
                        &&
                        is_array(
                            $metadata[
                                'transport_sector_template_snapshot'
                            ]
                            ?? null
                        )
                            ? $metadata[
                                'transport_sector_template_snapshot'
                            ]
                            : [];

                    $pricingType =
                        strtolower(
                            trim(
                                (string) (
                                    $sectorSnapshot[
                                        'pricing_type'
                                    ]
                                    ??
                                    $sectorSnapshot[
                                        'type'
                                    ]
                                    ??
                                    'normal'
                                )
                            )
                        );

                    if (
                        $pricingType ===
                        'sharing'
                    ) {
                        /*
                         * SHARING is already a per-person SAR rate.
                         * Do not divide it by adults.
                         */
                        $sharingTransportTotalSAR +=
                            $transportAmount;
                    } else {
                        /*
                         * NORMAL is a complete vehicle/sector amount.
                         * All NORMAL sectors are totaled first and divided
                         * by the adult count after the loop.
                         */
                        $normalTransportTotalSAR +=
                            $transportAmount;
                    }
                    break;

                case 'visa':
                    /*
                     * Visa:
                     *
                     * same SAR rate for every passenger.
                     */
                    $adultBaseSAR +=
                        $rateSAR;

                    $childBaseSAR +=
                        $rateSAR;

                    $infantBaseSAR +=
                        $rateSAR;

                    break;

                default:
                    $adultBaseSAR +=
                        max(
                            0.0,
                            (float) (
                                $item[
                                    'adult_amount'
                                ]
                                ?? 0
                            )
                        );

                    $childBaseSAR +=
                        max(
                            0.0,
                            (float) (
                                $item[
                                    'child_amount'
                                ]
                                ?? 0
                            )
                        );

                    $infantBaseSAR +=
                        max(
                            0.0,
                            (float) (
                                $item[
                                    'infant_amount'
                                ]
                                ?? 0
                            )
                        );

                    break;
            }
        }

        /*
         * ---------------------------------------------------------------
         * TRANSPORT PER-ADULT CONTRIBUTION
         * ---------------------------------------------------------------
         *
         * First divide the TOTAL of all NORMAL sectors by adults.
         * Then add the TOTAL of all SHARING sectors, whose rates are
         * already per-person SAR amounts.
         */
        $adultBaseSAR +=
            (
                $normalTransportTotalSAR
                /
                $adults
            )
            +
            $sharingTransportTotalSAR;

        /*
         * Only children/infants that actually exist receive a
         * child/infant package price.
         */
        if (
            $children <= 0
        ) {
            $childBaseSAR = 0.0;
        }

        if (
            $infants <= 0
        ) {
            $infantBaseSAR = 0.0;
        }

        /*
         * ---------------------------------------------------------------
         * CONVERT SAR → PKR
         * ---------------------------------------------------------------
         */

        $adultBasePKR =
            $adultBaseSAR
            *
            $roe;

        $childBasePKR =
            $childBaseSAR
            *
            $roe;

        $infantBasePKR =
            $infantBaseSAR
            *
            $roe;

        /*
         * ---------------------------------------------------------------
         * ADD PKR MARKUP / PROFIT
         * ---------------------------------------------------------------
         */

        $adultFinalPKR =
            $adultBasePKR
            +
            $markupPerPersonPKR;

        $childFinalPKR =
            $children > 0
                ? $childBasePKR
                    +
                    $markupPerPersonPKR
                : 0.0;

        $infantFinalPKR =
            $infants > 0
                ? $infantBasePKR
                    +
                    $markupPerPersonPKR
                : 0.0;

        /*
         * ---------------------------------------------------------------
         * AIRFARE — COMPLETELY SEPARATE
         * ---------------------------------------------------------------
         */

        $flight = null;

        if (
            !empty(
                $data[
                    'flight_enabled'
                ]
            )
        ) {
            $flightData =
                $data['flight']
                ?? [];

            $adultFare =
                max(
                    0.0,
                    (float) (
                        $flightData[
                            'adult_fare'
                        ]
                        ?? 0
                    )
                );

            $childFare =
                max(
                    0.0,
                    (float) (
                        $flightData[
                            'child_fare'
                        ]
                        ?? 0
                    )
                );

            $infantFare =
                max(
                    0.0,
                    (float) (
                        $flightData[
                            'infant_fare'
                        ]
                        ?? 0
                    )
                );

            $flight = [
                'currency_code' =>
                    strtoupper(
                        trim(
                            (string) (
                                $flightData[
                                    'currency_code'
                                ]
                                ?? 'PKR'
                            )
                        )
                    ),

                'adult_fare' =>
                    $adultFare,

                'child_fare' =>
                    $childFare,

                'infant_fare' =>
                    $infantFare,

                'adult_total' =>
                    round(
                        $adultFare
                        *
                        $adults,
                        2
                    ),

                'child_total' =>
                    round(
                        $childFare
                        *
                        $children,
                        2
                    ),

                'infant_total' =>
                    round(
                        $infantFare
                        *
                        $infants,
                        2
                    ),

                'total' =>
                    round(
                        (
                            $adultFare
                            *
                            $adults
                        )
                        +
                        (
                            $childFare
                            *
                            $children
                        )
                        +
                        (
                            $infantFare
                            *
                            $infants
                        ),
                        2
                    ),
            ];
        }

        return [
            /*
             * Frozen base values.
             */
            'adult_base_sar' =>
                round(
                    $adultBaseSAR,
                    2
                ),

            'child_base_sar' =>
                round(
                    $childBaseSAR,
                    2
                ),

            'infant_base_sar' =>
                round(
                    $infantBaseSAR,
                    2
                ),

            /*
             * Converted base values before markup.
             */
            'adult_base_pkr' =>
                round(
                    $adultBasePKR,
                    2
                ),

            'child_base_pkr' =>
                round(
                    $childBasePKR,
                    2
                ),

            'infant_base_pkr' =>
                round(
                    $infantBasePKR,
                    2
                ),

            /*
             * Final package prices.
             */
            'package_per_adult' =>
                round(
                    $adultFinalPKR,
                    2
                ),

            'package_per_child' =>
                round(
                    $childFinalPKR,
                    2
                ),

            'package_per_infant' =>
                round(
                    $infantFinalPKR,
                    2
                ),

            'package_total_all_passengers' =>
                round(
                    (
                        $adultFinalPKR
                        *
                        $adults
                    )
                    +
                    (
                        $childFinalPKR
                        *
                        $children
                    )
                    +
                    (
                        $infantFinalPKR
                        *
                        $infants
                    ),
                    2
                ),

            'roe_sar_to_pkr' =>
                round(
                    $roe,
                    6
                ),

            'profit_per_person_pkr' =>
                round(
                    $markupPerPersonPKR,
                    2
                ),

            'flight' =>
                $flight,
        ];
    }

    public function validatePassengerCounts(
        array $data
    ): void {
        $adults =
            (int) (
                $data['adults']
                ?? 0
            );

        $children =
            (int) (
                $data['children']
                ?? 0
            );

        $infants =
            (int) (
                $data['infants']
                ?? 0
            );

        if (
            $adults < 1
        ) {
            throw new InvalidArgumentException(
                'At least 1 adult is required.'
            );
        }

        if (
            $children < 0
            ||
            $infants < 0
        ) {
            throw new InvalidArgumentException(
                'Passenger counts cannot be negative.'
            );
        }
    }
}