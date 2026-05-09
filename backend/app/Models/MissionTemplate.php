<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MissionTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name_key',
        'description_key',
        'mission_type',
        'difficulty_preset_id',
        'default_target',
        'default_frequency',
        'is_collective',
        'child_friendly',
        'sort_order',
    ];

    protected $casts = [
        'is_collective' => 'boolean',
        'child_friendly' => 'boolean',
    ];

    public function difficulty(): BelongsTo
    {
        return $this->belongsTo(DifficultyPreset::class, 'difficulty_preset_id');
    }
}
