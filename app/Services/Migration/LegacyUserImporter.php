<?php

namespace App\Services\Migration;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class LegacyUserImporter
{
    /**
     * Fields in the legacy Users table that are metadata,
     * not permission flags.
     */
    private array $ignoredFields = [
        'Username',
        'User Description',
        'Password',
        'CreateDate',
        'DisableDate',
        'Branch',
        'Department',
        'Designation',
        'Email',
        'MobileNo',
        'Active',
        'Level of Authority',
    ];

    public function import(): array
    {
        $legacyUsers = DB::connection('legacy')
            ->table('Users')
            ->orderBy('Username')
            ->get();

        $stats = [
            'source_users' => $legacyUsers->count(),
            'created' => 0,
            'updated' => 0,
            'snapshots' => 0,
            'accounts_linked' => 0,
            'errors' => [],
            'temporary_passwords' => [],
        ];

        $roleIds = $this->loadRoles();

        foreach ($legacyUsers as $legacyUser) {
            try {
                $result = DB::transaction(
                    fn () => $this->importUser(
                        $legacyUser,
                        $roleIds
                    )
                );

                if ($result['created']) {
                    $stats['created']++;
                } else {
                    $stats['updated']++;
                }

                $stats['snapshots']++;

                if (
                    $result['temporary_password'] !== null
                ) {
                    $stats['temporary_passwords'][] = [
                        'username' =>
                            $legacyUser->Username,
                        'password' =>
                            $result['temporary_password'],
                    ];
                }
            } catch (Throwable $e) {
                $stats['errors'][] = [
                    'username' =>
                        $legacyUser->Username,
                    'message' =>
                        $e->getMessage(),
                ];
            }
        }

        $stats['accounts_linked'] =
            $this->linkAccountCreators();

        return $stats;
    }

    private function loadRoles(): array
    {
        return DB::table('roles')
            ->whereIn(
                'slug',
                [
                    'super-admin',
                    'viewer',
                ]
            )
            ->pluck(
                'id',
                'slug'
            )
            ->all();
    }

    private function importUser(
        object $source,
        array $roleIds
    ): array {
        $username = trim(
            (string) $source->Username
        );

        if ($username === '') {
            throw new \RuntimeException(
                'Legacy username is empty.'
            );
        }

        $legacyName =
            $source->{'User Description'} !== null
                ? trim(
                    (string)
                    $source->{'User Description'}
                )
                : '';

        $name = $legacyName !== ''
            ? $legacyName
            : $username;

        $email = $this->resolveEmail(
            $source,
            $username
        );

        $user = DB::table('users')
            ->where(
                'legacy_username',
                $username
            )
            ->first();

        $temporaryPassword = null;
        $created = false;

        if (! $user) {
            $temporaryPassword =
                $this->generateTemporaryPassword();

            $userId = DB::table('users')
                ->insertGetId([
                    'name' => $name,
                    'email' => $email,

                    'password' =>
                        Hash::make(
                            $temporaryPassword
                        ),

                    'email_verified_at' =>
                        null,

                    'remember_token' =>
                        null,

                    'legacy_username' =>
                        $username,

                    'legacy_authority' =>
                        $this->nullableInt(
                            $source->{'Level of Authority'}
                        ),

                    'legacy_branch_id' =>
                        $this->nullableInt(
                            $source->Branch
                        ),

                    'legacy_department_id' =>
                        $this->nullableInt(
                            $source->Department
                        ),

                    'legacy_active' =>
                        $this->nullableBool(
                            $source->Active
                        ),

                    'legacy_created_at' =>
                        $source->CreateDate,

                    'legacy_disabled_at' =>
                        $source->DisableDate,

                    'must_change_password' =>
                        true,

                    'created_at' =>
                        $source->CreateDate
                        ?: now(),

                    'updated_at' =>
                        now(),
                ]);

            $created = true;
        } else {
            $userId = (int) $user->id;

            DB::table('users')
                ->where('id', $userId)
                ->update([
                    'name' => $name,

                    /*
                     * Keep the existing application email
                     * when the user has already been customized.
                     */
                    'legacy_authority' =>
                        $this->nullableInt(
                            $source->{'Level of Authority'}
                        ),

                    'legacy_branch_id' =>
                        $this->nullableInt(
                            $source->Branch
                        ),

                    'legacy_department_id' =>
                        $this->nullableInt(
                            $source->Department
                        ),

                    'legacy_active' =>
                        $this->nullableBool(
                            $source->Active
                        ),

                    'legacy_created_at' =>
                        $source->CreateDate,

                    'legacy_disabled_at' =>
                        $source->DisableDate,

                    'updated_at' =>
                        now(),
                ]);
        }

        $permissionFlags =
            $this->extractPermissionFlags(
                $source
            );

        DB::table('legacy_user_permissions')
            ->updateOrInsert(
                [
                    'user_id' => $userId,
                ],
                [
                    'legacy_username' =>
                        $username,

                    'permission_flags' =>
                        json_encode(
                            $permissionFlags,
                            JSON_THROW_ON_ERROR
                        ),

                    'legacy_authority' =>
                        $this->nullableInt(
                            $source->{'Level of Authority'}
                        ),

                    'legacy_branch_id' =>
                        $this->nullableInt(
                            $source->Branch
                        ),

                    'legacy_department_id' =>
                        $this->nullableInt(
                            $source->Department
                        ),

                    'legacy_active' =>
                        $this->nullableBool(
                            $source->Active
                        ),

                    'imported_at' =>
                        now(),

                    'updated_at' =>
                        now(),
                ]
            );

        $this->assignInitialRole(
            $userId,
            $permissionFlags,
            $roleIds
        );

        return [
            'created' =>
                $created,

            'temporary_password' =>
                $temporaryPassword,
        ];
    }

    private function extractPermissionFlags(
        object $source
    ): array {
        $flags = [];

        foreach (
            get_object_vars($source)
            as $field => $value
        ) {
            if (
                in_array(
                    $field,
                    $this->ignoredFields,
                    true
                )
            ) {
                continue;
            }

            /*
             * Legacy permissions are stored primarily as
             * tinyint/boolean values.
             *
             * We preserve only the enabled flags here.
             */
            if (
                $value === 1
                || $value === '1'
                || $value === true
            ) {
                $flags[$field] = 1;
            }
        }

        return $flags;
    }

    private function assignInitialRole(
        int $userId,
        array $permissionFlags,
        array $roleIds
    ): void {
        /*
         * We only grant Super Admin when the source explicitly
         * contains the legacy Admin flag.
         *
         * Everyone else starts as Viewer until the new ERP's
         * detailed permission mapping is implemented.
         */
        $roleSlug =
            isset($permissionFlags['Admin'])
                ? 'super-admin'
                : 'viewer';

        $roleId =
            $roleIds[$roleSlug]
            ?? null;

        if (! $roleId) {
            throw new \RuntimeException(
                "Required role '{$roleSlug}' does not exist."
            );
        }

        /*
         * Don't destroy manually-added roles on later imports.
         * Only assign the initial role when no role currently
         * exists for this user.
         */
        $hasRole = DB::table('role_user')
            ->where(
                'user_id',
                $userId
            )
            ->exists();

        if (! $hasRole) {
            DB::table('role_user')
                ->insert([
                    'role_id' => $roleId,
                    'user_id' => $userId,
                ]);
        }
    }

    private function resolveEmail(
        object $source,
        string $username
    ): string {
        $sourceEmail =
            $source->Email !== null
                ? trim(
                    (string) $source->Email
                )
                : '';

        if (
            $sourceEmail !== ''
            && filter_var(
                $sourceEmail,
                FILTER_VALIDATE_EMAIL
            )
        ) {
            $alreadyUsed = DB::table('users')
                ->where(
                    'email',
                    $sourceEmail
                )
                ->where(
                    'legacy_username',
                    '!=',
                    $username
                )
                ->exists();

            if (! $alreadyUsed) {
                return $sourceEmail;
            }
        }

        /*
         * The legacy database has users with no email.
         * Laravel requires a unique email in our current schema,
         * so generate a deterministic internal address.
         */
        $slug = Str::slug(
            strtolower($username)
        );

        if ($slug === '') {
            $slug =
                'legacy-' .
                substr(
                    sha1($username),
                    0,
                    10
                );
        }

        $email =
            $slug .
            '@legacy.hba-erp.local';

        /*
         * Extremely defensive collision handling.
         */
        $counter = 2;

        while (
            DB::table('users')
                ->where('email', $email)
                ->where(
                    'legacy_username',
                    '!=',
                    $username
                )
                ->exists()
        ) {
            $email =
                $slug .
                '-' .
                $counter .
                '@legacy.hba-erp.local';

            $counter++;
        }

        return $email;
    }

    private function linkAccountCreators(): int
    {
        $users = DB::table('users')
            ->whereNotNull(
                'legacy_username'
            )
            ->get([
                'id',
                'legacy_username',
            ]);

        $map = [];

        foreach ($users as $user) {
            $map[
                strtoupper(
                    trim(
                        (string)
                        $user->legacy_username
                    )
                )
            ] = $user->id;
        }

        $linked = 0;

        foreach (
            DB::table('accounts')
                ->whereNotNull(
                    'legacy_created_by'
                )
                ->get([
                    'id',
                    'legacy_created_by',
                ]) as $account
        ) {
            $creator =
                strtoupper(
                    trim(
                        (string)
                        $account->legacy_created_by
                    )
                );

            if (
                $creator === ''
                || ! isset($map[$creator])
            ) {
                continue;
            }

            DB::table('accounts')
                ->where(
                    'id',
                    $account->id
                )
                ->update([
                    'created_by' =>
                        $map[$creator],

                    'updated_at' =>
                        now(),
                ]);

            $linked++;
        }

        return $linked;
    }

    private function generateTemporaryPassword(): string
    {
        return
            'Hba!' .
            Str::random(5) .
            random_int(10, 99);
    }

    private function nullableInt(
        mixed $value
    ): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function nullableBool(
        mixed $value
    ): ?bool {
        if ($value === null || $value === '') {
            return null;
        }

        return (bool) $value;
    }
}