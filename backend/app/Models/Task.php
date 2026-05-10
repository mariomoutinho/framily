<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_OPEN = 'open';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'household_id',
        'title',
        'description',
        'difficulty_preset_id',
        'priority',
        'frequency',
        'frequency_days',
        'frequency_dates',
        'status',
        'due_at',
        'completed_at',
        'requires_approval',
        'created_by_user_id',
    ];

    protected $casts = [
        'frequency_days' => 'array',
        'frequency_dates' => 'array',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'requires_approval' => 'boolean',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function difficulty(): BelongsTo
    {
        return $this->belongsTo(DifficultyPreset::class, 'difficulty_preset_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignments')->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }

    public function lastCompletion(): HasOne
    {
        return $this->hasOne(TaskCompletion::class)->latestOfMany('completed_at');
    }

    public function pointsForCompletion(): int
    {
        $base = $this->difficulty?->base_points ?? 0;
        $multiplier = match ($this->priority) {
            'high' => 1.25,
            default => 1.0,
        };

        return (int) round($base * $multiplier);
    }
}
