<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyOrganizationImporter;
use Illuminate\Console\Command;

class LegacyImportOrganization extends Command
{
    protected $signature = 'legacy:import-organization';

    protected $description =
        'Import legacy branches and departments and link them to accounts and users';

    public function handle(
        LegacyOrganizationImporter $importer
    ): int {
        $this->newLine();

        $this->components->info(
            'HBA ERP — Legacy Organization Import'
        );

        $this->newLine();

        $stats = $importer->import();

        $this->line(
            'Branches source:      ' .
            $stats['branches_source']
        );

        $this->line(
            'Branches created:     ' .
            $stats['branches_created']
        );

        $this->line(
            'Branches updated:     ' .
            $stats['branches_updated']
        );

        $this->newLine();

        $this->line(
            'Departments source:   ' .
            $stats['departments_source']
        );

        $this->line(
            'Departments created:  ' .
            $stats['departments_created']
        );

        $this->line(
            'Departments updated:  ' .
            $stats['departments_updated']
        );

        $this->newLine();

        $this->line(
            'Accounts linked:      ' .
            $stats['accounts_linked']
        );

        $this->line(
            'Users linked:         ' .
            $stats['users_linked']
        );

        $this->newLine();

        $this->components->success(
            'Legacy organization import completed successfully.'
        );

        return self::SUCCESS;
    }
}