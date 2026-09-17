<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptReportsController extends Controller
{
    public function today(Request $request): Response
    {
        return $this->renderReport(
            $request,
            true
        );
    }

    public function all(Request $request): Response
    {
        return $this->renderReport(
            $request,
            false
        );
    }

    private function renderReport(
        Request $request,
        bool $todayOnly
    ): Response {
        $data = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ]);

        $search = trim(
            (string) (
                $data['search']
                ?? ''
            )
        );

        $today = now()->toDateString();

        if ($todayOnly) {
            $dateFrom = $today;
            $dateTo = $today;
        } else {
            $dateFrom =
                $data['date_from']
                ?? now()
                    ->startOfMonth()
                    ->toDateString();

            $dateTo =
                $data['date_to']
                ?? $today;
        }

        /*
         * ---------------------------------------------------------
         * RECEIPT VOUCHERS
         * ---------------------------------------------------------
         *
         * BR = Bank Receipt
         *
         * Each voucher appears once.
         */
        $vouchersQuery = DB::table(
            'vouchers as v'
        )
            ->leftJoin(
                'accounts as ca',
                'ca.id',
                '=',
                'v.cash_bank_account_id'
            )
            ->leftJoin(
                'users as u',
                'u.id',
                '=',
                'v.created_by'
            )
            ->where(
                'v.voucher_type',
                'BR'
            )
            ->whereDate(
                'v.voucher_date',
                '>=',
                $dateFrom
            )
            ->whereDate(
                'v.voucher_date',
                '<=',
                $dateTo
            )
            ->select([
                'v.id',
                'v.legacy_voucher_id',
                'v.voucher_no',
                'v.voucher_date',
                'v.ref_no',
                'v.cash_bank_account_id',
                'v.cash_bank_account_code',
                'v.supervised',
                'v.created_by',
                'v.legacy_entered_by',
                'ca.name as cash_bank_account_name',
                'u.name as entered_by_name',
            ]);

        if ($search !== '') {
            $vouchersQuery->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'v.voucher_no',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'v.ref_no',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'v.cash_bank_account_code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'ca.name',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        $vouchers = $vouchersQuery
            ->orderByDesc(
                'v.voucher_date'
            )
            ->orderByDesc(
                'v.id'
            )
            ->get();

        if ($vouchers->isEmpty()) {
            return Inertia::render(
                'Accounting/Receipts/List',
                [
                    'mode' =>
                        $todayOnly
                            ? 'today'
                            : 'all',

                    'title' =>
                        $todayOnly
                            ? "Today's Receipts List"
                            : 'All Receipts List',

                    'search' => $search,

                    'dateFrom' =>
                        $dateFrom,

                    'dateTo' =>
                        $dateTo,

                    'vouchers' => [],

                    'summary' => [
                        'voucher_count' => 0,
                        'line_count' => 0,
                        'total' => 0,
                    ],
                ]
            );
        }

        $voucherIds = $vouchers
            ->pluck('id')
            ->map(
                fn ($id) => (int) $id
            )
            ->all();

        /*
         * ---------------------------------------------------------
         * DETAIL LINES
         * ---------------------------------------------------------
         *
         * For BR:
         *
         *   Cash/Bank = Debit
         *   Party     = Credit
         *
         * Therefore the report shows non-bank lines as receipt
         * details.
         *
         * We intentionally use account_id != cash_bank_account_id
         * instead of "account_code not like 110%" so the report
         * stays correct even if another 110 account is involved.
         */
        $lines = DB::table(
            'journal_entry_lines as l'
        )
            ->join(
                'vouchers as v',
                'v.id',
                '=',
                'l.voucher_id'
            )
            ->leftJoin(
                'accounts as a',
                'a.id',
                '=',
                'l.account_id'
            )
            ->whereIn(
                'l.voucher_id',
                $voucherIds
            )
            ->whereColumn(
                'l.account_id',
                '!=',
                'v.cash_bank_account_id'
            )
            ->select([
                'l.id',
                'l.voucher_id',
                'l.account_id',
                'l.account_code',
                'l.particulars',
                'l.legacy_invoice_no',
                'l.legacy_invoice_no_2',
                'l.cheque_no',
                'l.posting_date',
                'l.currency_code',
                'l.currency_quantity',
                'l.currency_rate',
                'l.foreign_credit',
                'l.credit',
                'a.name as account_name',
            ])
            ->orderBy(
                'l.id'
            )
            ->get();

        $linesByVoucher = $lines
            ->groupBy(
                fn ($line) =>
                    (int) $line->voucher_id
            );

        $result = [];
        $grandTotal = 0.0;
        $grandLineCount = 0;

        foreach ($vouchers as $voucher) {
            $voucherLines =
                $linesByVoucher->get(
                    (int) $voucher->id,
                    collect()
                );

            $details = [];
            $voucherTotal = 0.0;

            foreach (
                $voucherLines as $index => $line
            ) {
                $amount = abs(
                    (float) (
                        $line->credit ?? 0
                    )
                );

                /*
                 * For foreign currency lines the base credit is
                 * still the accounting amount and is what the
                 * receipt total should use.
                 */
                $voucherTotal += $amount;

                $invoiceNo = null;

                if (
                    $line->legacy_invoice_no !== null
                    && $line->legacy_invoice_no !== ''
                ) {
                    $invoiceNo =
                        (string) (
                            $line->legacy_invoice_no
                        );
                } elseif (
                    $line->legacy_invoice_no_2 !== null
                    && $line->legacy_invoice_no_2 !== ''
                ) {
                    $invoiceNo =
                        (string) (
                            $line->legacy_invoice_no_2
                        );
                }

                $details[] = [
                    'id' =>
                        (int) $line->id,

                    'sr' =>
                        $index + 1,

                    'account_id' =>
                        $line->account_id !== null
                            ? (int) $line->account_id
                            : null,

                    'account_code' =>
                        (string) (
                            $line->account_code
                            ?? ''
                        ),

                    'account_name' =>
                        (string) (
                            $line->account_name
                            ?? ''
                        ),

                    'particulars' =>
                        (string) (
                            $line->particulars
                            ?? ''
                        ),

                    'invoice_no' =>
                        $invoiceNo,

                    'cheque_no' =>
                        $line->cheque_no !== null
                            ? (string) $line->cheque_no
                            : null,

                    'posting_date' =>
                        $line->posting_date
                            ? substr(
                                (string) $line->posting_date,
                                0,
                                10
                            )
                            : null,

                    'currency_code' =>
                        $line->currency_code !== null
                            ? (string) $line->currency_code
                            : null,

                    'currency_quantity' =>
                        $line->currency_quantity !== null
                            ? (float) $line->currency_quantity
                            : null,

                    'currency_rate' =>
                        $line->currency_rate !== null
                            ? (float) $line->currency_rate
                            : null,

                    'foreign_credit' =>
                        $line->foreign_credit !== null
                            ? (float) $line->foreign_credit
                            : null,

                    'amount' =>
                        round(
                            $amount,
                            4
                        ),
                ];
            }

            /*
             * Keep the voucher even if its detail lines are empty.
             * That makes missing/legacy data visible instead of
             * silently hiding the voucher.
             */
            $result[] = [
                'id' =>
                    (int) $voucher->id,

                'legacy_voucher_id' =>
                    $voucher->legacy_voucher_id !== null
                        ? (int) $voucher->legacy_voucher_id
                        : null,

                'voucher_no' =>
                    (string) $voucher->voucher_no,

                'voucher_date' =>
                    substr(
                        (string) $voucher->voucher_date,
                        0,
                        10
                    ),

                'ref_no' =>
                    $voucher->ref_no !== null
                        ? (string) $voucher->ref_no
                        : null,

                'cash_bank_account_code' =>
                    (string) (
                        $voucher->cash_bank_account_code
                        ?? ''
                    ),

                'cash_bank_account_name' =>
                    (string) (
                        $voucher->cash_bank_account_name
                        ?? ''
                    ),

                'entered_by' =>
                    (string) (
                        $voucher->entered_by_name
                        ?? $voucher->legacy_entered_by
                        ?? ''
                    ),

                'supervised' =>
                    (bool) $voucher->supervised,

                'details' =>
                    $details,

                'total' =>
                    round(
                        $voucherTotal,
                        4
                    ),
            ];

            $grandTotal +=
                $voucherTotal;

            $grandLineCount +=
                count($details);
        }

        return Inertia::render(
            'Accounting/Receipts/List',
            [
                'mode' =>
                    $todayOnly
                        ? 'today'
                        : 'all',

                'title' =>
                    $todayOnly
                        ? "Today's Receipts List"
                        : 'All Receipts List',

                'search' =>
                    $search,

                'dateFrom' =>
                    $dateFrom,

                'dateTo' =>
                    $dateTo,

                'vouchers' =>
                    $result,

                'summary' => [
                    'voucher_count' =>
                        count($result),

                    'line_count' =>
                        $grandLineCount,

                    'total' =>
                        round(
                            $grandTotal,
                            4
                        ),
                ],
            ]
        );
    }
}