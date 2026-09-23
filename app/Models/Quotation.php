<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    protected $fillable = [
        'quote_no', 'quotation_date', 'valid_until', 'client_account_id',
        'title', 'package_name', 'route', 'travel_start_date', 'travel_end_date',
        'adults', 'children', 'infants', 'children_enabled', 'infants_enabled',
        'flight_enabled', 'currency_code', 'package_per_adult', 'package_per_child',
        'package_per_infant', 'template_snapshot', 'render_snapshot', 'status',
        'notes', 'terms_conditions', 'template_id', 'branch_id', 'department_id',
        'created_by',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until' => 'date',
        'travel_start_date' => 'date',
        'travel_end_date' => 'date',
        'children_enabled' => 'boolean',
        'infants_enabled' => 'boolean',
        'flight_enabled' => 'boolean',
        'package_per_adult' => 'decimal:2',
        'package_per_child' => 'decimal:2',
        'package_per_infant' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sort_order');
    }

    public function flight()
    {
        return $this->hasOne(QuotationFlight::class);
    }

    public function template()
    {
        return $this->belongsTo(QuotationTemplate::class, 'template_id');
    }

    public function client()
    {
        return $this->belongsTo(Account::class, 'client_account_id');
    }
}
