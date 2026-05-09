<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mission extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_SINGLE = 'single_task';
    public const TYPE_RECURRING = 'recurring_task';
    public const TYPE_STREAK = 'streak';
    public const TYPE_COUNT = 'count';
    public const TYPE_COLLECTIVE = 'collective';
    public const TYPE_CUSTOM = 'custom';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'household_id',
        'template_id',
        'name',
        'description',
        'mission_type',
        'difficulty_preset_id',
        'points_override',
        'frequency',
        'start_at',
        'end_at',
        'target_value',
        'requires_approval',
        'is_collective',
        'status',
        'reward_id',
        'created_by_user_id',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'requires_approval' => 'boolean',
        'is_collective' => 'boolean',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MissionTemplate::class, 'template_id');
    }

    public function difficulty(): BelongsTo
    {
        return $this->belongsTo(DifficultyPreset::class, 'difficulty_preset_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'mission_participants')->withTimestamps();
    }

    public function progress(): HasMany
    {
        return $this->hasMany(MissionProgress::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(MissionCompletion::class);
    }

    public function pointsForCompletion(): int
    {
        if ($this->points_override) {
            return (int) $this->points_override;
        }

        return $this->difficulty?->base_points ?? 0;
    }
}
