<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyAccountingImporter;
use Illuminate\Console\Command;

class LegacyImportAccounting extends Command
{
    protected $signature =
        'legacy:import-accounting';

    protected $description =
        'Import legacy Accu-Travel vouchers, Master accounting lines and Transuction history';

    public function handle(
        LegacyAccountingImporter $importer
    ): int {
        $this->newLine();

        $this->components->info(
            'HBA ERP — Legacy Accounting Import'
        );

        $this->newLine();

        $this->line(
            'Source: hba_erp_legacy'
        );

        $this->line(
            'Target: hba_erp_dev'
        );

        $this->newLine();

        $this->components->info(
            'Importing voucher headers, Master accounting lines and Transuction history...'
        );

        $stats = $importer->import();

        $this->newLine();

        $this->line(
            'Voucher source:          ' .
            $stats['source_vouchers']
        );

        $this->line(
            'Vouchers created:        ' .
            $stats['vouchers_created']
        );

        $this->line(
            'Vouchers updated:        ' .
            $stats['vouchers_updated']
        );

        $this->line(
            'Voucher errors:          ' .
            $stats['voucher_errors']
        );

        $this->newLine();

        $this->line(
            'Master source:           ' .
            $stats['source_master_lines']
        );

        $this->line(
            'Master lines imported:   ' .
            $stats['master_lines_imported']
        );

        $this->line(
            'Opening lines skipped:   ' .
            $stats['master_lines_skipped_opening']
        );

        $this->line(
            'Master line errors:      ' .
            $stats['master_line_errors']
        );

        $this->line(
            'Journal entries created: ' .
            $stats['journal_entries_created']
        );

        $this->line(
            'Journal entries updated: ' .
            $stats['journal_entries_updated']
        );

        $this->line(
            'Balanced entries:        ' .
            $stats['balanced_entries']
        );

        $this->line(
            'Unbalanced entries:      ' .
            $stats['unbalanced_entries']
        );

        $this->newLine();

        $this->line(
            'Transuction source:      ' .
            $stats['source_transactions']
        );

        $this->line(
            'Transactions created:    ' .
            $stats['transactions_created']
        );

        $this->line(
            'Transactions updated:    ' .
            $stats['transactions_updated']
        );

        $this->line(
            'Transaction errors:      ' .
            $stats['transaction_errors']
        );

        if (! empty($stats['errors'])) {
            $this->newLine();

            $this->components->error(
                'Accounting import completed with errors.'
            );

            foreach (
                array_slice(
                    $stats['errors'],
                    0,
                    30
                ) as $error
            ) {
                $this->error(
                    strtoupper(
                        (string) $error['type']
                    ) .
                    ' [' .
                    ($error['id'] ?? '?') .
                    ']: ' .
                    $error['message']
                );
            }

            if (
                count($stats['errors']) > 30
            ) {
                $this->warn(
                    'Only the first 30 errors are shown.'
                );
            }

            return self::FAILURE;
        }

        $this->newLine();

        $this->components->success(
            'Legacy accounting import completed successfully.'
        );

        return self::SUCCESS;
    }
}