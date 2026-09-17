<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'Dashboard'],

            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'Users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'module' => 'Users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'module' => 'Users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'module' => 'Users'],

            ['name' => 'View Roles', 'slug' => 'roles.view', 'module' => 'Users'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'module' => 'Users'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'module' => 'Users'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'module' => 'Users'],

            ['name' => 'View Accounts', 'slug' => 'accounts.view', 'module' => 'Accounting'],
            ['name' => 'Create Accounts', 'slug' => 'accounts.create', 'module' => 'Accounting'],
            ['name' => 'Edit Accounts', 'slug' => 'accounts.edit', 'module' => 'Accounting'],
            ['name' => 'Delete Accounts', 'slug' => 'accounts.delete', 'module' => 'Accounting'],

            ['name' => 'View Invoices', 'slug' => 'invoices.view', 'module' => 'Sales'],
            ['name' => 'Create Invoices', 'slug' => 'invoices.create', 'module' => 'Sales'],
            ['name' => 'Edit Invoices', 'slug' => 'invoices.edit', 'module' => 'Sales'],
            ['name' => 'Delete Invoices', 'slug' => 'invoices.delete', 'module' => 'Sales'],

            ['name' => 'View Receipts', 'slug' => 'receipts.view', 'module' => 'Accounting'],
            ['name' => 'Create Receipts', 'slug' => 'receipts.create', 'module' => 'Accounting'],

            ['name' => 'View Payments', 'slug' => 'payments.view', 'module' => 'Accounting'],
            ['name' => 'Create Payments', 'slug' => 'payments.create', 'module' => 'Accounting'],

            ['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'Reports'],
            ['name' => 'Export Reports', 'slug' => 'reports.export', 'module' => 'Reports'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        $superAdmin = Role::updateOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full access to the HBA ERP.',
                'is_active' => true,
            ]
        );

        $superAdmin->permissions()->sync(
            Permission::pluck('id')->all()
        );

        Role::updateOrCreate(
            ['slug' => 'accounts'],
            [
                'name' => 'Accounts',
                'description' => 'Accounting and financial operations.',
                'is_active' => true,
            ]
        );

        Role::updateOrCreate(
            ['slug' => 'sales'],
            [
                'name' => 'Sales',
                'description' => 'Sales and customer operations.',
                'is_active' => true,
            ]
        );

        Role::updateOrCreate(
            ['slug' => 'ticketing'],
            [
                'name' => 'Ticketing',
                'description' => 'Ticketing operations.',
                'is_active' => true,
            ]
        );

        Role::updateOrCreate(
            ['slug' => 'hotel'],
            [
                'name' => 'Hotel',
                'description' => 'Hotel and booking operations.',
                'is_active' => true,
            ]
        );

        Role::updateOrCreate(
            ['slug' => 'visa'],
            [
                'name' => 'Visa',
                'description' => 'Visa operations.',
                'is_active' => true,
            ]
        );

        Role::updateOrCreate(
            ['slug' => 'viewer'],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access.',
                'is_active' => true,
            ]
        );
    }
}
