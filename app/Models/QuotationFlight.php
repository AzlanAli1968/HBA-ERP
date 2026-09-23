<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationFlight extends Model
{
    protected $fillable = [
        'quotation_id', 'airline_name', 'route', 'departure_date', 'return_date',
        'flight_details', 'currency_code', 'adult_fare', 'child_fare', 'infant_fare',
        'adult_total', 'child_total', 'infant_total',
    ];

    protected $casts = [
        'departure_date' => 'date',
        'return_date' => 'date',
        'adult_fare' => 'decimal:2',
        'child_fare' => 'decimal:2',
        'infant_fare' => 'decimal:2',
        'adult_total' => 'decimal:2',
        'child_total' => 'decimal:2',
        'infant_total' => 'decimal:2',
    ];

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }
}
