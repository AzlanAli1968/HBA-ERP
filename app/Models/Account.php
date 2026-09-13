<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_type_id',
        'code',
        'name',
        'client_type',
        'branch',
        'city_category',
        'care_of_employee',


        'state_province',
        'postal_code',
        'notes',
        'tax_title',
        'is_cash_account',
        'category',
        'expense_account',
        'legacy_branch_id',
        'legacy_department_id',
        'legacy_created_by',


        'contact',
        'designation',
        'mobile',
        'contact_2',
        'designation_2',
        'company',

        'business_phone',
        'home_phone',
        'fax',
        'email',
        'address',
        'country',
        'website',

        'credit_limit',
        'credit_days',

        'bank_name',
        'bank_branch',
        'bank_account_number',

        'tax_type',
        'tax_number',
        'strn',

        'opening_debit',
        'opening_credit',
        'created_by',
        'opening_date',
        'details',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'opening_debit' => 'decimal:2',
            'opening_credit' => 'decimal:2',
            'credit_limit' => 'decimal:2',
            'credit_days' => 'integer',
            'opening_date' => 'datetime',
            'is_active' => 'boolean',
            'is_cash_account' => 'boolean',
            'legacy_branch_id' => 'integer',
            'legacy_department_id' => 'integer',
        ];
    }

    public function accountType(): BelongsTo
    {
        return $this->belongsTo(AccountType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function openingBalances(): HasMany
    {
        return $this->hasMany(AccountOpeningBalance::class);
    }

    public function getOpeningBalanceAttribute(): float
    {
        return (float) $this->opening_debit
            - (float) $this->opening_credit;
    }
}