<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyUserImporter;
use Illuminate\Console\Command;

class LegacyImportUsers extends Command
{
    protected $signature =
        'legacy:import-users';

    protected $description =
        'Import legacy Accu-Travel users and preserve their permission profiles';

    public function handle(
        LegacyUserImporter $importer
    ): int {
        $this->newLine();

        $this->components->info(
            'HBA ERP — Legacy User Import'
        );

        $this->newLine();

        $this->components->info(
            'Source: hba_erp_legacy.Users'
        );

        $this->components->info(
            'Target: hba_erp_dev.users'
        );

        $this->newLine();

        $stats = $importer->import();

        $this->line(
            'Source users:       ' .
            $stats['source_users']
        );

        $this->line(
            'Created:             ' .
            $stats['created']
        );

        $this->line(
            'Updated:             ' .
            $stats['updated']
        );

        $this->line(
            'Permission snapshots:' .
            ' ' .
            $stats['snapshots']
        );

        $this->line(
            'Account creators linked:' .
            ' ' .
            $stats['accounts_linked']
        );

        if (
            ! empty(
                $stats['temporary_passwords']
            )
        ) {
            $this->newLine();

            $this->components->warn(
                'Temporary passwords generated for new legacy users:'
            );

            foreach (
                $stats['temporary_passwords']
                as $credentials
            ) {
                $this->line(
                    '  ' .
                    $credentials['username'] .
                    ' → ' .
                    $credentials['password']
                );
            }

            $this->newLine();

            $this->components->warn(
                'These users are marked must_change_password = true.'
            );
        }

        if (! empty($stats['errors'])) {
            $this->newLine();

            $this->components->error(
                'Import completed with errors.'
            );

            foreach (
                $stats['errors']
                as $error
            ) {
                $this->error(
                    $error['username'] .
                    ': ' .
                    $error['message']
                );
            }

            return self::FAILURE;
        }

        $this->newLine();

        $this->components->success(
            'Legacy user import completed successfully.'
        );

        return self::SUCCESS;
    }
}