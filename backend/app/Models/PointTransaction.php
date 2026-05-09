<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointTransaction extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';

    public const SOURCE_TASK = 'task';
    public const SOURCE_MISSION = 'mission';
    public const SOURCE_REWARD = 'reward';
    public const SOURCE_MANUAL = 'manual';

    protected $fillable = [
        'user_id',
        'household_id',
        'source_type',
        'source_id',
        'points',
        'status',
        'reason_key',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }
}
