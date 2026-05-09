<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name_key',
        'description_key',
        'icon',
        'criteria',
        'is_active',
        'child_only',
        'sort_order',
    ];

    protected $casts = [
        'criteria' => 'array',
        'is_active' => 'boolean',
        'child_only' => 'boolean',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot(['household_id', 'unlocked_at', 'meta'])
            ->withTimestamps();
    }
}
