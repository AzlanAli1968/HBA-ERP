<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            AccountTypeSeeder::class,
            CurrencySeeder::class,
        ]);

        $admin = User::updateOrCreate(
            ['email' => 'admin@hba-erp.test'],
            [
                'name' => 'HBA Administrator',
            ]
        );

        $superAdmin = Role::where(
            'slug',
            'super-admin'
        )->firstOrFail();

        $admin->roles()->syncWithoutDetaching([
            $superAdmin->id,
        ]);
    }
}