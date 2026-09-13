<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminUsersController extends Controller
{
    public function index(Request $request): Response
    {
        $users = $this->listUsers($request->string('search')->trim()->toString());
        $roleData = $this->listRolesWithPermissions();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roleData['roles'],
            'filters' => [
                'search' => $request->string('search')->trim()->toString(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedUserData($request, null);
        $roleIds = $this->validatedRoleIds($request->input('role_ids', []));

        $userId = DB::transaction(function () use ($data, $roleIds): int {
            $usersColumns = Schema::getColumnListing('users');
            $insert = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ];

            $this->putIfColumn($insert, $usersColumns, 'is_active', 1);
            $this->putIfColumn($insert, $usersColumns, 'active', 1);
            $this->putIfColumn($insert, $usersColumns, 'email_verified_at', now());
            $this->putTimestamps($insert, $usersColumns);

            $id = (int) DB::table('users')->insertGetId($insert);
            $this->syncRoles($id, $roleIds);

            return $id;
        });

        return to_route('admin.users.index')->with('success', "User #{$userId} created successfully.");
    }

    public function update(Request $request, int $user): RedirectResponse
    {
        abort_unless(DB::table('users')->where('id', $user)->exists(), 404);

        $data = $this->validatedUserData($request, $user);
        $roleIds = $this->validatedRoleIds($request->input('role_ids', []));

        DB::transaction(function () use ($data, $user, $roleIds): void {
            $usersColumns = Schema::getColumnListing('users');
            $update = [
                'name' => $data['name'],
                'email' => $data['email'],
            ];

            if ($data['password'] !== null && $data['password'] !== '') {
                $update['password'] = Hash::make($data['password']);
            }

            $this->putTimestamps($update, $usersColumns, true);

            DB::table('users')->where('id', $user)->update($update);
            $this->syncRoles($user, $roleIds);
        });

        return to_route('admin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(int $user): RedirectResponse
    {
        if ((int) auth()->id() === $user) {
            return back()->withErrors(['user' => 'You cannot delete the account you are currently using.']);
        }

        abort_unless(DB::table('users')->where('id', $user)->exists(), 404);

        DB::transaction(function () use ($user): void {
            $this->syncRoles($user, []);
            DB::table('users')->where('id', $user)->delete();
        });

        return to_route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    private function validatedUserData(Request $request, ?int $userId): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [$userId === null ? 'required' : 'nullable', 'string', 'min:8', 'max:255'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer'],
        ]);
    }

    private function validatedRoleIds(array $roleIds): array
    {
        $roleColumns = Schema::getColumnListing('roles');
        $rolePk = $this->firstExisting($roleColumns, ['id', 'role_id']);
        abort_if($rolePk === null, 500, 'Roles table has no identifiable primary key.');

        $ids = collect($roleIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($ids === []) {
            return [];
        }

        return DB::table('roles')->whereIn($rolePk, $ids)->pluck($rolePk)->map(fn ($id) => (int) $id)->all();
    }

    private function listUsers(string $search = ''): array
    {
        $usersColumns = Schema::getColumnListing('users');
        $rolesColumns = Schema::getColumnListing('roles');
        $roleUserColumns = Schema::getColumnListing('role_user');

        $userPk = $this->firstExisting($usersColumns, ['id', 'user_id']);
        $rolePk = $this->firstExisting($rolesColumns, ['id', 'role_id']);
        $roleName = $this->firstExisting($rolesColumns, ['name', 'role_name', 'title']);
        $pivotUser = $this->firstExisting($roleUserColumns, ['user_id', 'user', 'userId']);
        $pivotRole = $this->firstExisting($roleUserColumns, ['role_id', 'role', 'roleId']);

        abort_if($userPk === null, 500, 'Users table has no identifiable primary key.');

        $query = DB::table('users')->select(array_values(array_filter([
            $userPk . ' as id',
            in_array('name', $usersColumns, true) ? 'name' : null,
            in_array('email', $usersColumns, true) ? 'email' : null,
            in_array('legacy_username', $usersColumns, true) ? 'legacy_username' : null,
            in_array('username', $usersColumns, true) ? 'username' : null,
            in_array('is_active', $usersColumns, true) ? 'is_active' : null,
            in_array('created_at', $usersColumns, true) ? 'created_at' : null,
        ])));

        if ($search !== '') {
            $query->where(function ($q) use ($search, $usersColumns): void {
                foreach (['name', 'email', 'legacy_username', 'username'] as $column) {
                    if (in_array($column, $usersColumns, true)) {
                        $q->orWhere($column, 'like', '%' . $search . '%');
                    }
                }
            });
        }

        $rows = $query->orderBy('id')->limit(500)->get();
        $userIds = $rows->pluck('id')->map(fn ($id) => (int) $id)->all();

        $roleMap = [];
        if ($userIds !== [] && $pivotUser !== null && $pivotRole !== null && $rolePk !== null && $roleName !== null) {
            $pivotRows = DB::table('role_user')
                ->whereIn($pivotUser, $userIds)
                ->get([$pivotUser, $pivotRole]);

            $roleIds = $pivotRows->pluck($pivotRole)->unique()->values()->all();
            $roleNames = $roleIds === []
                ? collect()
                : DB::table('roles')->whereIn($rolePk, $roleIds)->pluck($roleName, $rolePk);

            foreach ($pivotRows as $pivot) {
                $uid = (int) $pivot->{$pivotUser};
                $rid = (string) $pivot->{$pivotRole};
                if (!isset($roleMap[$uid])) {
                    $roleMap[$uid] = [];
                }
                if (isset($roleNames[$rid])) {
                    $roleMap[$uid][] = (string) $roleNames[$rid];
                }
            }
        }

        return $rows->map(function ($row) use ($roleMap): array {
            $id = (int) $row->id;
            return [
                'id' => $id,
                'name' => (string) ($row->name ?? ''),
                'email' => (string) ($row->email ?? ''),
                'username' => (string) ($row->legacy_username ?? $row->username ?? ''),
                'active' => property_exists($row, 'is_active') ? ((int) $row->is_active === 1) : true,
                'created_at' => (string) ($row->created_at ?? ''),
                'roles' => array_values(array_unique($roleMap[$id] ?? [])),
            ];
        })->all();
    }

    private function listRolesWithPermissions(): array
    {
        $rolesColumns = Schema::getColumnListing('roles');
        $permissionsColumns = Schema::getColumnListing('permissions');
        $pivotColumns = Schema::getColumnListing('permission_role');

        $rolePk = $this->firstExisting($rolesColumns, ['id', 'role_id']);
        $roleName = $this->firstExisting($rolesColumns, ['name', 'role_name', 'title']);
        $roleDescription = $this->firstExisting($rolesColumns, ['description', 'details']);
        $permissionPk = $this->firstExisting($permissionsColumns, ['id', 'permission_id']);
        $permissionName = $this->firstExisting($permissionsColumns, ['name', 'permission_name', 'title']);
        $pivotRole = $this->firstExisting($pivotColumns, ['role_id', 'role', 'roleId']);
        $pivotPermission = $this->firstExisting($pivotColumns, ['permission_id', 'permission', 'permissionId']);

        abort_if($rolePk === null || $roleName === null, 500, 'Roles table does not have the expected identity columns.');

        $roles = DB::table('roles')->select(array_values(array_filter([
            $rolePk . ' as id',
            $roleName . ' as name',
            $roleDescription ? $roleDescription . ' as description' : null,
        ])))->orderBy($roleName)->get();

        $permissions = $permissionPk === null || $permissionName === null
            ? collect()
            : DB::table('permissions')->select([
                $permissionPk . ' as id',
                $permissionName . ' as name',
            ])->orderBy($permissionName)->get();

        $permissionMap = [];
        if ($pivotRole !== null && $pivotPermission !== null && $roles->isNotEmpty()) {
            $pivotRows = DB::table('permission_role')
                ->whereIn($pivotRole, $roles->pluck('id')->all())
                ->get([$pivotRole, $pivotPermission]);

            foreach ($pivotRows as $pivot) {
                $rid = (string) $pivot->{$pivotRole};
                $permissionMap[$rid][] = (int) $pivot->{$pivotPermission};
            }
        }

        return [
            'roles' => $roles->map(fn ($role) => [
                'id' => (int) $role->id,
                'name' => (string) $role->name,
                'description' => (string) ($role->description ?? ''),
                'permission_ids' => array_values(array_unique(array_map('intval', $permissionMap[(string) $role->id] ?? []))),
            ])->all(),
            'permissions' => $permissions->map(fn ($permission) => [
                'id' => (int) $permission->id,
                'name' => (string) $permission->name,
            ])->all(),
        ];
    }

    private function syncRoles(int $userId, array $roleIds): void
    {
        $roleUserColumns = Schema::getColumnListing('role_user');
        $userColumn = $this->firstExisting($roleUserColumns, ['user_id', 'user', 'userId']);
        $roleColumn = $this->firstExisting($roleUserColumns, ['role_id', 'role', 'roleId']);

        abort_if($userColumn === null || $roleColumn === null, 500, 'role_user table does not have the expected columns.');

        DB::table('role_user')->where($userColumn, $userId)->delete();

        if ($roleIds === []) {
            return;
        }

        $timestamp = now();
        $hasCreated = in_array('created_at', $roleUserColumns, true);
        $hasUpdated = in_array('updated_at', $roleUserColumns, true);

        $rows = array_map(function (int $roleId) use ($userId, $userColumn, $roleColumn, $hasCreated, $hasUpdated, $timestamp): array {
            $row = [
                $userColumn => $userId,
                $roleColumn => $roleId,
            ];
            if ($hasCreated) {
                $row['created_at'] = $timestamp;
            }
            if ($hasUpdated) {
                $row['updated_at'] = $timestamp;
            }
            return $row;
        }, $roleIds);

        DB::table('role_user')->insert($rows);
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
