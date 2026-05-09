<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reward extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'household_id',
        'name',
        'description',
        'points_cost',
        'stock',
        'requires_approval',
        'image',
        'is_active',
        'created_by_user_id',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    public function isAvailable(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->stock !== null && $this->stock <= 0) {
            return false;
        }

        return true;
    }
}
