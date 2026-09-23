<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'template_type',
        'paper_size',
        'orientation',
        'design_json',
        'config_json',
        'is_default',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'design_json' => 'array',
        'config_json' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function quotations()
    {
        return $this->hasMany(
            Quotation::class,
            'template_id'
        );
    }
}