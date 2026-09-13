<?php

namespace App\Services\Migration;

use Illuminate\Support\Facades\DB;

class LegacyOrganizationImporter
{
    public function import(): array
    {
        $branches = $this->importBranches();
        $departments = $this->importDepartments();

        $accountsLinked = $this->linkAccounts();
        $usersLinked = $this->linkUsers();

        return [
            'branches_source' => $branches['source'],
            'branches_created' => $branches['created'],
            'branches_updated' => $branches['updated'],

            'departments_source' => $departments['source'],
            'departments_created' => $departments['created'],
            'departments_updated' => $departments['updated'],

            'accounts_linked' => $accountsLinked,
            'users_linked' => $usersLinked,
        ];
    }

    private function importBranches(): array
    {
        $sourceRows = DB::connection('legacy')
            ->table('tblBranches')
            ->orderBy('BranchId')
            ->get();

        $created = 0;
        $updated = 0;

        foreach ($sourceRows as $source) {
            $legacyId = (int) $source->BranchId;

            $existing = DB::table('branches')
                ->where('legacy_id', $legacyId)
                ->first();

            $data = [
                'name' => $this->string($source->BranchName)
                    ?? "Branch {$legacyId}",

                'company_name' => $this->string(
                    $source->CompanyName
                ),

                'address' => $this->string(
                    $source->Address
                ),

                'city' => $this->string(
                    $source->City
                ),

                'phone' => $this->string(
                    $source->Phone
                ),

                'mobile' => $this->string(
                    $source->Mobile
                ),

                'email' => $this->string(
                    $source->Email
                ),

                'website' => $this->string(
                    $source->Website
                ),

                'license_no' => $this->string(
                    $source->LicNo
                ),

                'fax' => $this->string(
                    $source->Fax
                ),

                'phone_2' => $this->string(
                    $source->Phone2
                ),

                'accounts_manager' => $this->string(
                    $source->AccountsManager
                ),

                'logo' => $source->Logo,

                'ntn' => $this->string(
                    $source->NTN
                ),

                'ntn_label' => $this->string(
                    $source->NTNLabel
                ),

                'is_active' => true,
                'updated_at' => now(),
            ];

            if ($existing) {
                DB::table('branches')
                    ->where('id', $existing->id)
                    ->update($data);

                $updated++;
            } else {
                DB::table('branches')->insert([
                    'legacy_id' => $legacyId,
                    ...$data,
                    'created_at' => now(),
                ]);

                $created++;
            }
        }

        return [
            'source' => $sourceRows->count(),
            'created' => $created,
            'updated' => $updated,
        ];
    }

    private function importDepartments(): array
    {
        $sourceRows = DB::connection('legacy')
            ->table('tblDepartments')
            ->orderBy('DepartmentID')
            ->get();

        $created = 0;
        $updated = 0;

        foreach ($sourceRows as $source) {
            $legacyId = (int) $source->DepartmentID;

            $name = $this->string(
                $source->DepartmentName
            ) ?? "Department {$legacyId}";

            $existing = DB::table('departments')
                ->where('legacy_id', $legacyId)
                ->first();

            $data = [
                'name' => $name,
                'is_active' => true,
                'updated_at' => now(),
            ];

            if ($existing) {
                DB::table('departments')
                    ->where('id', $existing->id)
                    ->update($data);

                $updated++;
            } else {
                DB::table('departments')->insert([
                    'legacy_id' => $legacyId,
                    ...$data,
                    'created_at' => now(),
                ]);

                $created++;
            }
        }

        return [
            'source' => $sourceRows->count(),
            'created' => $created,
            'updated' => $updated,
        ];
    }

    private function linkAccounts(): int
    {
        $branchMap = DB::table('branches')
            ->pluck('id', 'legacy_id')
            ->all();

        $departmentMap = DB::table('departments')
            ->pluck('id', 'legacy_id')
            ->all();

        $accounts = DB::table('accounts')
            ->where(function ($query) {
                $query
                    ->whereNotNull('legacy_branch_id')
                    ->orWhereNotNull('legacy_department_id');
            })
            ->get([
                'id',
                'legacy_branch_id',
                'legacy_department_id',
            ]);

        $linked = 0;

        foreach ($accounts as $account) {
            $branchId = null;

            if (
                $account->legacy_branch_id !== null
                && isset(
                    $branchMap[(int) $account->legacy_branch_id]
                )
            ) {
                $branchId =
                    $branchMap[
                        (int) $account->legacy_branch_id
                    ];
            }

            $departmentId = null;

            if (
                $account->legacy_department_id !== null
                && isset(
                    $departmentMap[
                        (int) $account->legacy_department_id
                    ]
                )
            ) {
                $departmentId =
                    $departmentMap[
                        (int) $account->legacy_department_id
                    ];
            }

            DB::table('accounts')
                ->where('id', $account->id)
                ->update([
                    'branch_id' => $branchId,
                    'department_id' => $departmentId,
                    'updated_at' => now(),
                ]);

            $linked++;
        }

        return $linked;
    }

    private function linkUsers(): int
    {
        $branchMap = DB::table('branches')
            ->pluck('id', 'legacy_id')
            ->all();

        $departmentMap = DB::table('departments')
            ->pluck('id', 'legacy_id')
            ->all();

        $users = DB::table('users')
            ->where(function ($query) {
                $query
                    ->whereNotNull('legacy_branch_id')
                    ->orWhereNotNull('legacy_department_id');
            })
            ->get([
                'id',
                'legacy_branch_id',
                'legacy_department_id',
            ]);

        $linked = 0;

        foreach ($users as $user) {
            $branchId = null;

            if (
                $user->legacy_branch_id !== null
                && isset(
                    $branchMap[(int) $user->legacy_branch_id]
                )
            ) {
                $branchId =
                    $branchMap[
                        (int) $user->legacy_branch_id
                    ];
            }

            $departmentId = null;

            if (
                $user->legacy_department_id !== null
                && isset(
                    $departmentMap[
                        (int) $user->legacy_department_id
                    ]
                )
            ) {
                $departmentId =
                    $departmentMap[
                        (int) $user->legacy_department_id
                    ];
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'branch_id' => $branchId,
                    'department_id' => $departmentId,
                    'updated_at' => now(),
                ]);

            $linked++;
        }

        return $linked;
    }

    private function string(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}