<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyAccountImporter;
use Illuminate\Console\Command;

class LegacyImportAccounts extends Command
{
    protected $signature = 'legacy:import-accounts';

    protected $description =
        'Import legacy Accu-Travel accounts and opening balances into HBA ERP';

    public function handle(
        LegacyAccountImporter $importer
    ): int {
        $this->newLine();

        $this->components->info(
            'HBA ERP — Legacy Account Import'
        );

        $this->newLine();

        $this->components->info(
            'Source: hba_erp_legacy'
        );

        $this->components->info(
            'Target: hba_erp_dev'
        );

        $this->newLine();

        $this->components->info(
            'Synchronizing account types and currencies...'
        );

        $stats = $importer->import();

        $this->newLine();

        $this->line(
            'Source accounts:    ' .
            $stats['source_accounts']
        );

        $this->line(
            'Created:            ' .
            $stats['created']
        );

        $this->line(
            'Updated:            ' .
            $stats['updated']
        );

        $this->line(
            'Account errors:     ' .
            $stats['account_errors']
        );

        $this->newLine();

        $this->line(
            'Source openings:    ' .
            $stats['source_openings']
        );

        $this->line(
            'Opening imported:   ' .
            $stats['opening_imported']
        );

        $this->line(
            'Opening errors:     ' .
            $stats['opening_errors']
        );

        $this->newLine();

        $this->line(
            'Account types:      ' .
            $stats['account_types']
        );

        $this->line(
            'Currencies:         ' .
            $stats['currencies']
        );

        if (! empty($stats['errors'])) {
            $this->newLine();

            $this->components->error(
                'Import completed with errors.'
            );

            foreach (
                array_slice(
                    $stats['errors'],
                    0,
                    20
                ) as $error
            ) {
                $this->error(
                    strtoupper($error['type']) .
                    ' [' .
                    ($error['source'] ?? '?') .
                    ']: ' .
                    $error['message']
                );
            }

            if (
                count($stats['errors']) > 20
            ) {
                $this->warn(
                    'Only the first 20 errors are shown.'
                );
            }

            return self::FAILURE;
        }

        $this->newLine();

        $this->components->success(
            'Account import completed successfully.'
        );

        return self::SUCCESS;
    }
}