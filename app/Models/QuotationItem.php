<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id', 'item_type', 'section', 'sort_order', 'title', 'description',
        'hotel_id', 'city', 'check_in', 'check_out', 'nights', 'room_type', 'meal',
        'room_quantity', 'from_location_id', 'to_location_id', 'from_location_name',
        'to_location_name', 'vehicle_id', 'quantity', 'rate', 'rate_currency_code',
        'adult_amount', 'child_amount', 'infant_amount', 'metadata_json',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'quantity' => 'decimal:2',
        'rate' => 'decimal:2',
        'adult_amount' => 'decimal:2',
        'child_amount' => 'decimal:2',
        'infant_amount' => 'decimal:2',
        'metadata_json' => 'array',
    ];

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }
}
