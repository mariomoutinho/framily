<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MissionProgress extends Model
{
    use HasFactory;

    protected $table = 'mission_progress';

    protected $fillable = ['mission_id', 'user_id', 'current_value', 'last_event_at'];

    protected $casts = [
        'last_event_at' => 'datetime',
    ];

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
