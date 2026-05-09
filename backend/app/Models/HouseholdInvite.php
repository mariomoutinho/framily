<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HouseholdInvite extends Model
{
    use HasFactory;

    protected $fillable = [
        'household_id',
        'code',
        'email',
        'role',
        'created_by_user_id',
        'expires_at',
        'used_at',
        'used_by_user_id',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public static function makeCode(): string
    {
        do {
            $code = strtoupper(Str::random(10));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function usedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by_user_id');
    }

    public function isUsable(): bool
    {
        if ($this->used_at) {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
