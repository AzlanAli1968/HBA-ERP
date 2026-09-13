<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\DB;

class LedgerReportService
{
    public function report(
        int $accountId,
        string $dateFrom,
        string $dateTo
    ): array {
        $account = DB::table('accounts')
            ->where('id', $accountId)
            ->first();

        if (! $account) {
            abort(404, 'Account not found.');
        }

        /*
         * Opening balance from the account opening-balance table.
         *
         * Only base-currency opening balances belong in this
         * normal ledger report.
         */
        $opening = DB::table(
            'account_opening_balances'
        )
            ->where(
                'account_id',
                $accountId
            )
            ->where(
                function ($query) {
                    $query
                        ->whereNull(
                            'currency_code'
                        )
                        ->orWhere(
                            'currency_code',
                            ''
                        )
                        ->orWhere(
                            'currency_code',
                            0
                        );
                }
            )
            ->selectRaw(
                'COALESCE(SUM(opening_debit),0) AS debit'
            )
            ->selectRaw(
                'COALESCE(SUM(opening_credit),0) AS credit'
            )
            ->first();

        $openingDebit =
            (float) (
                $opening->debit
                ?? 0
            );

        $openingCredit =
            (float) (
                $opening->credit
                ?? 0
            );

        /*
         * All ledger lines before the selected period.
         *
         * posting_date is preferred, voucher_date is the fallback.
         */
        $before = DB::table(
            'journal_entry_lines as l'
        )
            ->where(
                'l.account_id',
                $accountId
            )
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) < ?',
                [
                    $dateFrom,
                ]
            )
            ->selectRaw(
                'COALESCE(SUM(l.debit),0) AS debit'
            )
            ->selectRaw(
                'COALESCE(SUM(l.credit),0) AS credit'
            )
            ->first();

        $beforeDebit =
            (float) (
                $before->debit
                ?? 0
            );

        $beforeCredit =
            (float) (
                $before->credit
                ?? 0
            );

        $balanceBeforePeriod =
            (
                $openingDebit
                +
                $beforeDebit
            )
            -
            (
                $openingCredit
                +
                $beforeCredit
            );

        /*
         * Transactions within the selected period.
         */
        $lines = DB::table(
            'journal_entry_lines as l'
        )
            ->leftJoin(
                'vouchers as v',
                'v.id',
                '=',
                'l.voucher_id'
            )
            ->where(
                'l.account_id',
                $accountId
            )
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) >= ?',
                [
                    $dateFrom,
                ]
            )
            ->whereRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) <= ?',
                [
                    $dateTo,
                ]
            )
            ->select([
                'l.id',
                'l.account_id',
                'l.account_code',
                'l.particulars',
                'l.debit',
                'l.credit',
                'l.legacy_invoice_no',
                'l.legacy_invoice_no_2',
                'l.posting_date',
                'l.voucher_date',
                'l.currency_code',
                'l.currency_quantity',
                'l.currency_rate',
                'l.voucher_type',
                'l.voucher_id',
                'l.mode_description',
                'l.sector_description',
                'l.ticket_no',
                'l.passenger',

                'v.voucher_no as joined_voucher_no',
                'v.ref_no as joined_ref_no',
                'v.voucher_date as joined_voucher_date',
            ])
            ->orderByRaw(
                'DATE(COALESCE(l.posting_date, l.voucher_date)) ASC'
            )
            ->orderBy(
                'l.id'
            )
            ->get();

        $running =
            $balanceBeforePeriod;

        $periodDebit = 0.0;
        $periodCredit = 0.0;

        $rows = [];

        foreach (
            $lines as $line
        ) {
            $debit =
                (float) (
                    $line->debit
                    ?? 0
                );

            $credit =
                (float) (
                    $line->credit
                    ?? 0
                );

            $periodDebit +=
                $debit;

            $periodCredit +=
                $credit;

            $running +=
                $debit
                -
                $credit;

            $date =
                $line->posting_date
                ??
                $line->voucher_date
                ??
                $line->joined_voucher_date;

            $voucherType =
                strtoupper(
                    trim(
                        (string) (
                            $line->voucher_type
                            ?? ''
                        )
                    )
                );

            /*
             * Keep the old report terminology.
             */
            $displayType =
                match ($voucherType) {
                    'BR' => 'BR',
                    'BP' => 'BP',
                    'JV' => 'JV',

                    'INV',
                    'INVOICE' => 'Inv',

                    'DN',
                    'DEBIT NOTE' => 'DN',

                    'CN',
                    'CREDIT NOTE' => 'CN',

                    default =>
                        $voucherType !== ''
                            ? $voucherType
                            : '—',
                };

            $voucherNo =
                $line->joined_voucher_no
                ??
                $line->voucher_id;

            $voucherNo =
                $voucherNo !== null
                    ? (string) $voucherNo
                    : '—';

            $reference = null;

            if (
                $line->legacy_invoice_no !== null
                &&
                trim(
                    (string) $line->legacy_invoice_no
                ) !== ''
            ) {
                $reference =
                    trim(
                        (string) $line->legacy_invoice_no
                    );
            } elseif (
                $line->legacy_invoice_no_2 !== null
                &&
                trim(
                    (string) $line->legacy_invoice_no_2
                ) !== ''
            ) {
                $reference =
                    trim(
                        (string) $line->legacy_invoice_no_2
                    );
            } elseif (
                $line->joined_ref_no !== null
                &&
                trim(
                    (string) $line->joined_ref_no
                ) !== ''
            ) {
                $reference =
                    trim(
                        (string) $line->joined_ref_no
                    );
            }

            $description =
                trim(
                    (string) (
                        $line->particulars
                        ?? ''
                    )
                );

            if (
                $description === ''
            ) {
                $description =
                    trim(
                        (string) (
                            $line->mode_description
                            ?? ''
                        )
                    );
            }

            if (
                $description === ''
            ) {
                $description =
                    trim(
                        (string) (
                            $line->sector_description
                            ?? ''
                        )
                    );
            }

            if (
                $description === ''
                &&
                $line->passenger !== null
            ) {
                $description =
                    trim(
                        (string) $line->passenger
                    );
            }

            if (
                $description === ''
            ) {
                $description = '—';
            }

            /*
             * Show the foreign-currency calculation under the
             * description, just as the old ledger does.
             */
            $currencyNote = null;

            if (
                $line->currency_code !== null
                &&
                trim(
                    (string) $line->currency_code
                ) !== ''
                &&
                $line->currency_quantity !== null
                &&
                $line->currency_rate !== null
            ) {
                $currency =
                    strtoupper(
                        trim(
                            (string) $line->currency_code
                        )
                    );

                $quantity =
                    (float) $line->currency_quantity;

                $rate =
                    (float) $line->currency_rate;

                if (
                    $quantity > 0
                    &&
                    $rate > 0
                ) {
                    $currencyNote =
                        $currency .
                        ' × ' .
                        $this->number(
                            $rate,
                            4
                        );
                }
            }

            $rows[] = [
                'id' =>
                    (int) $line->id,

                'date' =>
                    $date !== null
                        ? substr(
                            (string) $date,
                            0,
                            10
                        )
                        : null,

                'type' =>
                    $displayType,

                'voucher_id' =>
                    $voucherNo,

                'reference' =>
                    $reference,

                'description' =>
                    $description,

                'currency_note' =>
                    $currencyNote,

                'debit' =>
                    round(
                        $debit,
                        4
                    ),

                'credit' =>
                    round(
                        $credit,
                        4
                    ),

                'balance' =>
                    round(
                        $running,
                        4
                    ),

                'side' =>
                    $running >= 0
                        ? 'Dr'
                        : 'Cr',
            ];
        }

        $closingBalance =
            $balanceBeforePeriod
            +
            $periodDebit
            -
            $periodCredit;

        return [
            'account' => [
                'id' =>
                    (int) $account->id,

                'code' =>
                    (string) (
                        $account->code
                        ?? ''
                    ),

                'name' =>
                    (string) (
                        $account->name
                        ?? ''
                    ),
            ],

            'date_from' =>
                $dateFrom,

            'date_to' =>
                $dateTo,

            'opening' => [
                'debit' =>
                    round(
                        $openingDebit
                        +
                        $beforeDebit,
                        4
                    ),

                'credit' =>
                    round(
                        $openingCredit
                        +
                        $beforeCredit,
                        4
                    ),

                'balance' =>
                    round(
                        $balanceBeforePeriod,
                        4
                    ),

                'side' =>
                    $balanceBeforePeriod >= 0
                        ? 'Dr'
                        : 'Cr',
            ],

            'period' => [
                'debit' =>
                    round(
                        $periodDebit,
                        4
                    ),

                'credit' =>
                    round(
                        $periodCredit,
                        4
                    ),
            ],

            'closing' => [
                'balance' =>
                    round(
                        $closingBalance,
                        4
                    ),

                'side' =>
                    $closingBalance >= 0
                        ? 'Dr'
                        : 'Cr',
            ],

            'rows' =>
                $rows,
        ];
    }

    private function number(
        float $value,
        int $decimals = 2
    ): string {
        return number_format(
            $value,
            $decimals,
            '.',
            ','
        );
    }
}