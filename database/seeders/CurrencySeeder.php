<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            [
                'code' => 'PKR',
                'name' => 'Pakistani Rupee',
                'symbol' => 'Rs',
                'is_base' => true,
            ],
            [
                'code' => 'SAR',
                'name' => 'Saudi Riyal',
                'symbol' => '﷼',
                'is_base' => false,
            ],
            [
                'code' => 'USD',
                'name' => 'United States Dollar',
                'symbol' => '$',
                'is_base' => false,
            ],
            [
                'code' => 'AED',
                'name' => 'UAE Dirham',
                'symbol' => 'د.إ',
                'is_base' => false,
            ],
            [
                'code' => 'EUR',
                'name' => 'Euro',
                'symbol' => '€',
                'is_base' => false,
            ],
            [
                'code' => 'GBP',
                'name' => 'British Pound',
                'symbol' => '£',
                'is_base' => false,
            ],
        ];

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(
                ['code' => $currency['code']],
                [
                    'name' => $currency['name'],
                    'symbol' => $currency['symbol'],
                    'is_base' => $currency['is_base'],
                    'is_active' => true,
                ],
            );
        }
    }
}