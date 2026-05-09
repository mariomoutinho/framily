<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DifficultyPreset extends Model
{
    use HasFactory;

    public const KEY_EASY = 'easy';
    public const KEY_MEDIUM = 'medium';
    public const KEY_HARD = 'hard';
    public const KEY_CHALLENGE = 'challenge';

    protected $fillable = [
        'key',
        'name_key',
        'base_points',
        'color',
        'household_id',
        'sort_order',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function isGlobal(): bool
    {
        return $this->household_id === null;
    }
}
