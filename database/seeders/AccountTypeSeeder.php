<?php

namespace Database\Seeders;

use App\Models\AccountType;
use Illuminate\Database\Seeder;

class AccountTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => '110', 'name' => 'Petty Cash & Bank', 'group_name' => 'Liquid Assets', 'sort_order' => 10],
            ['code' => '120', 'name' => 'Receivables / Customers', 'group_name' => 'Current Assets', 'sort_order' => 20],
            ['code' => '121', 'name' => 'Current Assets', 'group_name' => 'Current Assets', 'sort_order' => 21],
            ['code' => '122', 'name' => 'Investment', 'group_name' => 'Current Assets', 'sort_order' => 22],
            ['code' => '123', 'name' => 'Staff Salaries & Advances', 'group_name' => 'Current Assets', 'sort_order' => 23],
            ['code' => '124', 'name' => 'Advances & Deposits', 'group_name' => 'Current Assets', 'sort_order' => 24],
            ['code' => '130', 'name' => 'Fix Assets', 'group_name' => 'Fix Assets', 'sort_order' => 30],

            ['code' => '210', 'name' => 'Payables / Vendors', 'group_name' => 'Current Liabilities', 'sort_order' => 40],
            ['code' => '211', 'name' => 'Airlines', 'group_name' => 'Current Liabilities', 'sort_order' => 41],
            ['code' => '212', 'name' => 'Short term loans', 'group_name' => 'Current Liabilities', 'sort_order' => 42],

            ['code' => '220', 'name' => 'Long term loans', 'group_name' => 'Fix Liabilities', 'sort_order' => 50],

            ['code' => '230', 'name' => 'Capital', 'group_name' => 'Equity', 'sort_order' => 60],
            ['code' => '231', 'name' => 'Unappropriated Profit', 'group_name' => 'Equity', 'sort_order' => 61],

            ['code' => '310', 'name' => 'Cost of Revenue', 'group_name' => 'Cost of Revenue', 'sort_order' => 70],

            ['code' => '320', 'name' => 'Operating Expenses', 'group_name' => 'Administrative and General Expenses', 'sort_order' => 80],
            ['code' => '321', 'name' => 'Financial Expenses', 'group_name' => 'Administrative and General Expenses', 'sort_order' => 81],
            ['code' => '322', 'name' => 'Depreciation', 'group_name' => 'Administrative and General Expenses', 'sort_order' => 82],

            ['code' => '410', 'name' => 'Sales', 'group_name' => 'Revenue', 'sort_order' => 90],
            ['code' => '420', 'name' => 'Other Income', 'group_name' => 'Other Income', 'sort_order' => 100],
        ];

        foreach ($types as $type) {
            AccountType::updateOrCreate(
                ['code' => $type['code']],
                [
                    ...$type,
                    'is_active' => true,
                ],
            );
        }
    }
}