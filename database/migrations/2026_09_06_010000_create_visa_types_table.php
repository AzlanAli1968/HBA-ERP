<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('visa_types')) {
            Schema::create('visa_types', function (Blueprint $table): void {
                $table->id();
                $table->string('name', 255);
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();
                $table->unique('name');
            });
        }

        $names = [];

        $add = static function ($value) use (&$names): void {
            $name = trim((string) ($value ?? ''));
            if ($name === '') {
                return;
            }
            $names[strtolower($name)] = $name;
        };

        // Existing normalized/imported invoice data is the first local seed source.
        try {
            if (Schema::hasTable('invoice_transactions')
                && Schema::hasColumn('invoice_transactions', 'particulars_2')
            ) {
                $rows = DB::table('invoice_transactions')
                    ->select('particulars_2')
                    ->whereNotNull('particulars_2')
                    ->where('particulars_2', '<>', '')
                    ->whereRaw("UPPER(TRIM(COALESCE(mode, ''))) = ?", ['VISA'])
                    ->distinct()
                    ->pluck('particulars_2');

                foreach ($rows as $name) {
                    $add($name);
                }
            }
        } catch (\Throwable $e) {
            // Continue to legacy seed source.
        }

        // The migrated Accu archive contains the original Visa package list in
        // InvTickets.InvParticulars2. Failure here must not prevent the local
        // schema migration; the application has a transition fallback as well.
        try {
            if (Schema::connection('legacy')->hasTable('InvTickets')) {
                $columns = Schema::connection('legacy')->getColumnListing('InvTickets');
                $packageColumn = $this->firstExisting($columns, [
                    'InvParticulars2',
                    'Package',
                    'VisaType',
                    'Visa Type',
                    'InvPackage',
                ]);
                $modeColumn = $this->firstExisting($columns, [
                    'InvMode',
                    'Mode',
                ]);

                if ($packageColumn !== null) {
                    $query = DB::connection('legacy')
                        ->table('InvTickets')
                        ->select($packageColumn)
                        ->whereNotNull($packageColumn)
                        ->where($packageColumn, '<>', '')
                        ->distinct();

                    if ($modeColumn !== null) {
                        $query->whereRaw(
                            "UPPER(TRIM(COALESCE(`" . $modeColumn . "`, ''))) = ?",
                            ['VISA'],
                        );
                    }

                    foreach ($query->pluck($packageColumn) as $name) {
                        $add($name);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Keep migration safe if the legacy connection is unavailable.
        }

        // visa_cases is another normalized historical source when available.
        try {
            if (Schema::hasTable('visa_cases') && Schema::hasColumn('visa_cases', 'visa_type')) {
                foreach (DB::table('visa_cases')
                    ->whereNotNull('visa_type')
                    ->where('visa_type', '<>', '')
                    ->distinct()
                    ->pluck('visa_type') as $name
                ) {
                    $add($name);
                }
            }
        } catch (\Throwable $e) {
            // Optional source.
        }

        foreach ($names as $name) {
            DB::table('visa_types')->updateOrInsert(
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
        Schema::dropIfExists('visa_types');
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
};
