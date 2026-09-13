<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyBank extends Model
{
    protected $table = 'company_banks';

    protected $fillable = [
        'company_setting_id',
        'label',
        'bank_name',
        'account_title',
        'account_number',
        'iban',
        'branch_name',
        'swift_code',
        'currency_code',
        'logo_path',
        'is_active',
        'show_on_documents',
        'sort_order',
    ];

    protected $casts = [
        'company_setting_id' => 'integer',
        'is_active' => 'boolean',
        'show_on_documents' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function companySetting(): BelongsTo
    {
        return $this->belongsTo(CompanySetting::class);
    }
}
