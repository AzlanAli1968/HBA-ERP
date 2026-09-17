<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountOpeningBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'legacy_id',
        'currency_id',
        'currency_code',
        'exchange_rate',
        'opening_debit',
        'opening_credit',
        'opening_currency',
    ];

    protected function casts(): array
    {
        return [
            'legacy_id' => 'integer',
            'currency_id' => 'integer',
            'exchange_rate' => 'decimal:6',
            'opening_debit' => 'decimal:2',
            'opening_credit' => 'decimal:2',
            'opening_currency' => 'decimal:4',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(
            Account::class
        );
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(
            Currency::class
        );
    }
}