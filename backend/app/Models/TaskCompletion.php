<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class TaskCompletion extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'task_id',
        'completed_by_user_id',
        'completed_at',
        'status',
        'approved_by_user_id',
        'approved_at',
        'points_awarded',
        'note',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * PointTransactions ligadas a esta conclusão (source_type='task', source_id=this->id).
     */
    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class, 'source_id')
            ->where('source_type', 'task');
    }
}
