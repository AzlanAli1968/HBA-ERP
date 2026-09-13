<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminRolesController extends Controller
{
    public function index(): Response
    {
        [$roles, $permissions] = $this->loadRolesAndPermissions();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer'],
        ]);

        $roleId = DB::transaction(function () use ($data): int {
            $roleColumns = Schema::getColumnListing('roles');
            $roleName = $this->firstExisting($roleColumns, ['name', 'role_name', 'title']);
            abort_if($roleName === null, 500, 'Roles table has no name column.');

            $insert = [$roleName => $data['name']];
            $this->putIfColumn($insert, $roleColumns, 'description', $data['description'] ?? null);
            $this->putIfColumn($insert, $roleColumns, 'guard_name', 'web');
            $this->putIfColumn($insert, $roleColumns, 'slug', str($data['name'])->slug('-')->toString());
            $this->putTimestamps($insert, $roleColumns);

            $id = (int) DB::table('roles')->insertGetId($insert);
            $this->syncPermissions($id, $this->validPermissionIds($data['permission_ids'] ?? []));

            return $id;
        });

        return to_route('admin.roles.index')->with('success', "Role #{$roleId} created successfully.");
    }

    public function update(Request $request, int $role): RedirectResponse
    {
        $roleColumns = Schema::getColumnListing('roles');
        $rolePk = $this->firstExisting($roleColumns, ['id', 'role_id']);
        abort_if($rolePk === null || !DB::table('roles')->where($rolePk, $role)->exists(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer'],
        ]);

        DB::transaction(function () use ($data, $role, $roleColumns, $rolePk): void {
            $roleName = $this->firstExisting($roleColumns, ['name', 'role_name', 'title']);
            $update = [$roleName => $data['name']];
            $this->putIfColumn($update, $roleColumns, 'description', $data['description'] ?? null);
            $this->putIfColumn($update, $roleColumns, 'slug', str($data['name'])->slug('-')->toString());
            $this->putTimestamps($update, $roleColumns, true);

            DB::table('roles')->where($rolePk, $role)->update($update);
            $this->syncPermissions($role, $this->validPermissionIds($data['permission_ids'] ?? []));
        });

        return to_route('admin.roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(int $role): RedirectResponse
    {
        $roleColumns = Schema::getColumnListing('roles');
        $rolePk = $this->firstExisting($roleColumns, ['id', 'role_id']);
        abort_if($rolePk === null || !DB::table('roles')->where($rolePk, $role)->exists(), 404);

        DB::transaction(function () use ($role): void {
            $this->syncPermissions($role, []);

            $roleUserColumns = Schema::getColumnListing('role_user');
            $roleUserRole = $this->firstExisting($roleUserColumns, ['role_id', 'role', 'roleId']);
            if ($roleUserRole !== null) {
                DB::table('role_user')->where($roleUserRole, $role)->delete();
            }

            $roleColumns = Schema::getColumnListing('roles');
            $rolePk = $this->firstExisting($roleColumns, ['id', 'role_id']);
            DB::table('roles')->where($rolePk, $role)->delete();
        });

        return to_route('admin.roles.index')->with('success', 'Role deleted successfully.');
    }

    private function loadRolesAndPermissions(): array
    {
        $roleColumns = Schema::getColumnListing('roles');
        $permissionColumns = Schema::getColumnListing('permissions');
        $pivotColumns = Schema::getColumnListing('permission_role');

        $rolePk = $this->firstExisting($roleColumns, ['id', 'role_id']);
        $roleName = $this->firstExisting($roleColumns, ['name', 'role_name', 'title']);
        $roleDescription = $this->firstExisting($roleColumns, ['description', 'details']);
        $permissionPk = $this->firstExisting($permissionColumns, ['id', 'permission_id']);
        $permissionName = $this->firstExisting($permissionColumns, ['name', 'permission_name', 'title']);
        $pivotRole = $this->firstExisting($pivotColumns, ['role_id', 'role', 'roleId']);
        $pivotPermission = $this->firstExisting($pivotColumns, ['permission_id', 'permission', 'permissionId']);

        abort_if($rolePk === null || $roleName === null, 500, 'Roles table does not have the expected identity columns.');
        abort_if($permissionPk === null || $permissionName === null, 500, 'Permissions table does not have the expected identity columns.');

        $roles = DB::table('roles')
            ->select(array_values(array_filter([
                $rolePk . ' as id',
                $roleName . ' as name',
                $roleDescription ? $roleDescription . ' as description' : null,
            ])))
            ->orderBy($roleName)
            ->get();

        $permissions = DB::table('permissions')
            ->select([
                $permissionPk . ' as id',
                $permissionName . ' as name',
            ])
            ->orderBy($permissionName)
            ->get();

        $permissionMap = [];
        if ($pivotRole !== null && $pivotPermission !== null && $roles->isNotEmpty()) {
            $pivotRows = DB::table('permission_role')
                ->whereIn($pivotRole, $roles->pluck('id')->all())
                ->get([$pivotRole, $pivotPermission]);

            foreach ($pivotRows as $pivot) {
                $permissionMap[(string) $pivot->{$pivotRole}][] = (int) $pivot->{$pivotPermission};
            }
        }

        return [
            $roles->map(fn ($role) => [
                'id' => (int) $role->id,
                'name' => (string) $role->name,
                'description' => (string) ($role->description ?? ''),
                'permission_ids' => array_values(array_unique(array_map('intval', $permissionMap[(string) $role->id] ?? []))),
            ])->all(),
            $permissions->map(fn ($permission) => [
                'id' => (int) $permission->id,
                'name' => (string) $permission->name,
            ])->all(),
        ];
    }

    private function validPermissionIds(array $permissionIds): array
    {
        $permissionColumns = Schema::getColumnListing('permissions');
        $permissionPk = $this->firstExisting($permissionColumns, ['id', 'permission_id']);
        abort_if($permissionPk === null, 500, 'Permissions table has no identifiable primary key.');

        $ids = collect($permissionIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($ids === []) {
            return [];
        }

        return DB::table('permissions')->whereIn($permissionPk, $ids)->pluck($permissionPk)->map(fn ($id) => (int) $id)->all();
    }

    private function syncPermissions(int $roleId, array $permissionIds): void
    {
        $pivotColumns = Schema::getColumnListing('permission_role');
        $pivotRole = $this->firstExisting($pivotColumns, ['role_id', 'role', 'roleId']);
        $pivotPermission = $this->firstExisting($pivotColumns, ['permission_id', 'permission', 'permissionId']);
        abort_if($pivotRole === null || $pivotPermission === null, 500, 'permission_role table does not have the expected columns.');

        DB::table('permission_role')->where($pivotRole, $roleId)->delete();
        if ($permissionIds === []) {
            return;
        }

        $timestamp = now();
        $hasCreated = in_array('created_at', $pivotColumns, true);
        $hasUpdated = in_array('updated_at', $pivotColumns, true);

        $rows = array_map(function (int $permissionId) use ($roleId, $pivotRole, $pivotPermission, $hasCreated, $hasUpdated, $timestamp): array {
            $row = [
                $pivotRole => $roleId,
                $pivotPermission => $permissionId,
            ];
            if ($hasCreated) {
                $row['created_at'] = $timestamp;
            }
            if ($hasUpdated) {
                $row['updated_at'] = $timestamp;
            }
            return $row;
        }, $permissionIds);

        DB::table('permission_role')->insert($rows);
    }

    private function firstExisting(array $columns, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            if (in_array($candidate, $columns, true)) {
                return $candidate;
            }
        }

        return null;
    }

    private function putIfColumn(array &$target, array $columns, string $column, mixed $value): void
    {
        if (in_array($column, $columns, true)) {
            $target[$column] = $value;
        }
    }

    private function putTimestamps(array &$target, array $columns, bool $updatedOnly = false): void
    {
        $now = now();
        if (!$updatedOnly && in_array('created_at', $columns, true)) {
            $target['created_at'] = $now;
        }
        if (in_array('updated_at', $columns, true)) {
            $target['updated_at'] = $now;
        }
    }
}
