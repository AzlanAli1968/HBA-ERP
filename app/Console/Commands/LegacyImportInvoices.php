<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyInvoiceImporter;
use Illuminate\Console\Command;

class LegacyImportInvoices extends Command
{
    protected $signature =
        'legacy:import-invoices';

    protected $description =
        'Import Accu-Travel invoices, invoice transactions and transaction child records';

    public function handle(
        LegacyInvoiceImporter $importer
    ): int {
        $this->newLine();

        $this->components->info(
            'HBA ERP — Legacy Invoice Import'
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
            'Importing invoice headers...'
        );

        $stats = $importer->import();

        $this->newLine();

        $this->line(
            'Invoice source:        ' .
            $stats['source_invoices']
        );

        $this->line(
            'Invoice created:       ' .
            $stats['invoices_created']
        );

        $this->line(
            'Invoice updated:       ' .
            $stats['invoices_updated']
        );

        $this->line(
            'Invoice errors:        ' .
            $stats['invoice_errors']
        );

        $this->newLine();

        $this->line(
            'Transaction source:    ' .
            $stats['source_transactions']
        );

        $this->line(
            'Transaction created:   ' .
            $stats['transactions_created']
        );

        $this->line(
            'Transaction updated:   ' .
            $stats['transactions_updated']
        );

        $this->line(
            'Transaction errors:    ' .
            $stats['transaction_errors']
        );

        $this->line(
            'Orphan transactions:   ' .
            $stats['orphan_transactions']
        );

        $this->newLine();

        $this->line(
            'Passenger source:      ' .
            $stats['source_passengers']
        );

        $this->line(
            'Passenger created:     ' .
            $stats['passengers_created']
        );

        $this->line(
            'Passenger updated:     ' .
            $stats['passengers_updated']
        );

        $this->line(
            'Passenger errors:      ' .
            $stats['passenger_errors']
        );

        $this->newLine();

        $this->line(
            'Fare breakup source:   ' .
            $stats['source_fare_breakups']
        );

        $this->line(
            'Fare breakup created:  ' .
            $stats['fare_breakups_created']
        );

        $this->line(
            'Fare breakup updated:  ' .
            $stats['fare_breakups_updated']
        );

        $this->line(
            'Fare breakup errors:   ' .
            $stats['fare_breakup_errors']
        );

        $this->newLine();

        $this->line(
            'Hotel rate source:     ' .
            $stats['source_hotel_rates']
        );

        $this->line(
            'Hotel rate created:    ' .
            $stats['hotel_rates_created']
        );

        $this->line(
            'Hotel rate updated:    ' .
            $stats['hotel_rates_updated']
        );

        $this->line(
            'Hotel rate errors:     ' .
            $stats['hotel_rate_errors']
        );

        if (! empty($stats['errors'])) {
            $this->newLine();

            $this->components->error(
                'Invoice import completed with errors.'
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
                        $error['type']
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
            'Legacy invoice import completed successfully.'
        );

        return self::SUCCESS;
    }
}