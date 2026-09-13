<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('vehicles')) {
            Schema::create('vehicles', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('legacy_vehicle_id')->nullable()->index();
                $table->string('name', 255);
                $table->string('registration_no', 255)->nullable();
                $table->string('vendor_account_code', 100)->nullable()->index();
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();
                $table->unique('name');
            });
        }

        if (! Schema::hasTable('transfer_locations')) {
            Schema::create('transfer_locations', function (Blueprint $table): void {
                $table->id();
                $table->string('name', 255);
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();
                $table->unique('name');
            });
        }

        $firstExisting = static function (array $columns, array $candidates): ?string {
            foreach ($candidates as $candidate) {
                if (in_array($candidate, $columns, true)) {
                    return $candidate;
                }
            }
            return null;
        };

        $meaningful = static function ($value): ?string {
            $text = trim((string) ($value ?? ''));
            if ($text === '' || in_array(strtoupper($text), ['-', '0', 'N/A', 'NA', 'NULL'], true)) {
                return null;
            }
            return $text;
        };

        $vehicles = [];
        $vendorByLegacyVehicleId = [];
        $transactionVehicleIds = [];

        try {
            $legacy = DB::connection('legacy');
            $schema = $legacy->getSchemaBuilder();

            if ($schema->hasTable('InvTickets')) {
                $columns = $schema->getColumnListing('InvTickets');
                $txnColumn = $firstExisting($columns, ['InvTransuction ID', 'InvTransaction ID']);
                $vehicleColumn = $firstExisting($columns, ['InvVehicle', 'VehicleID', 'Vehicle Id']);
                $vendorColumn = $firstExisting($columns, ['InvPayable', 'Payable', 'VendorCode']);

                $select = [];
                if ($txnColumn !== null) $select[] = $txnColumn . ' as txn_id';
                if ($vehicleColumn !== null) $select[] = $vehicleColumn . ' as legacy_vehicle_id';
                if ($vendorColumn !== null) $select[] = $vendorColumn . ' as vendor_code';

                if ($select !== []) {
                    foreach ($legacy->table('InvTickets')->select($select)->limit(100000)->get() as $row) {
                        $txnId = isset($row->txn_id) ? (int) $row->txn_id : 0;
                        $legacyId = isset($row->legacy_vehicle_id) && $row->legacy_vehicle_id !== null && $row->legacy_vehicle_id !== ''
                            ? (int) $row->legacy_vehicle_id
                            : 0;
                        if ($txnId > 0 && $legacyId > 0) {
                            $transactionVehicleIds[$txnId] = $legacyId;
                        }
                        if ($legacyId > 0 && ! isset($vendorByLegacyVehicleId[$legacyId])) {
                            $vendorCode = trim((string) ($row->vendor_code ?? ''));
                            $vendorByLegacyVehicleId[$legacyId] = $vendorCode;
                        }
                    }
                }
            }

            if ($schema->hasTable('Master')) {
                $columns = $schema->getColumnListing('Master');
                $modeColumn = $firstExisting($columns, ['Mode']);
                $subIdColumn = $firstExisting($columns, ['SubID']);
                $descriptionColumn = $firstExisting($columns, ['Sector/Description', 'Sector Description', 'Sector']);

                if ($descriptionColumn !== null) {
                    $query = $legacy->table('Master')->select([$descriptionColumn . ' as description']);
                    if ($subIdColumn !== null) $query->addSelect($subIdColumn . ' as sub_id');
                    if ($modeColumn !== null) {
                        $query->whereRaw("UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?", ['TRANSFER']);
                    }

                    foreach ($query->whereNotNull($descriptionColumn)->limit(100000)->get() as $row) {
                        $description = trim((string) ($row->description ?? ''));
                        if ($description === '') continue;

                        $parts = preg_split('/\s*-\s*/', $description);
                        if (! is_array($parts) || count($parts) < 5) continue;

                        // Accu format: date-from-to-quantity-vehicle type.
                        $vehicleName = trim(implode('-', array_slice($parts, 4)));
                        $vehicleName = $meaningful($vehicleName);
                        if ($vehicleName === null || is_numeric($vehicleName)) continue;

                        $subId = isset($row->sub_id) ? (int) $row->sub_id : 0;
                        $legacyVehicleId = $transactionVehicleIds[$subId] ?? 0;
                        $key = strtolower($vehicleName);

                        if (! isset($vehicles[$key])) {
                            $vehicles[$key] = [
                                'legacy_vehicle_id' => $legacyVehicleId > 0 ? $legacyVehicleId : null,
                                'name' => $vehicleName,
                                'registration_no' => null,
                                'vendor_account_code' => $legacyVehicleId > 0
                                    ? ($vendorByLegacyVehicleId[$legacyVehicleId] ?? null)
                                    : null,
                                'is_active' => 1,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        } elseif ($vehicles[$key]['legacy_vehicle_id'] === null && $legacyVehicleId > 0) {
                            $vehicles[$key]['legacy_vehicle_id'] = $legacyVehicleId;
                            $vehicles[$key]['vendor_account_code'] = $vendorByLegacyVehicleId[$legacyVehicleId] ?? null;
                            $vehicles[$key]['updated_at'] = now();
                        }
                    }
                }
            }

            if ($schema->hasTable('InvTickets')) {
                // When a legacy vehicle appears in transactions but its vehicle type
                // is not recoverable from Master, keep it as a visible placeholder.
                foreach ($transactionVehicleIds as $legacyId) {
                    if ($legacyId <= 0) continue;
                    $exists = collect($vehicles)->contains(
                        static fn (array $row): bool => (int) ($row['legacy_vehicle_id'] ?? 0) === $legacyId,
                    );
                    if (! $exists) {
                        $name = 'Vehicle ' . $legacyId;
                        $key = strtolower($name);
                        $vehicles[$key] = [
                            'legacy_vehicle_id' => $legacyId,
                            'name' => $name,
                            'registration_no' => null,
                            'vendor_account_code' => $vendorByLegacyVehicleId[$legacyId] ?? null,
                            'is_active' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }
        } catch (Throwable $e) {
            // Keep the schema migration safe if the legacy connection is unavailable.
        }

        foreach ($vehicles as $row) {
            DB::table('vehicles')->updateOrInsert(
                ['name' => $row['name']],
                [
                    'legacy_vehicle_id' => $row['legacy_vehicle_id'],
                    'registration_no' => $row['registration_no'],
                    'vendor_account_code' => $row['vendor_account_code'],
                    'is_active' => 1,
                    'updated_at' => now(),
                    'created_at' => $row['created_at'],
                ],
            );
        }

        $locations = [];
        try {
            $legacy = DB::connection('legacy');
            $schema = $legacy->getSchemaBuilder();
            if ($schema->hasTable('InvTickets')) {
                $columns = $schema->getColumnListing('InvTickets');
                $fromColumn = $firstExisting($columns, ['InvSector', 'Sector']);
                $toColumn = $firstExisting($columns, ['invSectorTo', 'InvSectorTo', 'SectorTo']);
                $modeColumn = $firstExisting($columns, ['InvMode', 'Mode']);
                $select = [];
                if ($fromColumn !== null) $select[] = $fromColumn . ' as sector_from';
                if ($toColumn !== null) $select[] = $toColumn . ' as sector_to';

                if ($select !== []) {
                    $query = $legacy->table('InvTickets')->select($select);
                    if ($modeColumn !== null) {
                        $query->where(function ($q) use ($modeColumn): void {
                            $q->whereRaw("UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?", ['TRANSFER'])
                                ->orWhereNull($modeColumn)
                                ->orWhereRaw("TRIM(COALESCE(`" . $modeColumn . "`, '')) = ?", ['']);
                        });
                    }

                    foreach ($query->limit(100000)->get() as $row) {
                        foreach ([$row->sector_from ?? null, $row->sector_to ?? null] as $value) {
                            $name = $meaningful($value);
                            if ($name !== null) {
                                $locations[strtolower($name)] = $name;
                            }
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            // Legacy source is optional at migration runtime.
        }

        foreach ($locations as $name) {
            DB::table('transfer_locations')->updateOrInsert(
                ['name' => $name],
                [
                    'is_active' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_locations');
        Schema::dropIfExists('vehicles');
    }
};
