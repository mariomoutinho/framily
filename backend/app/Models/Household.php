<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Household extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'slug', 'invite_code', 'owner_id', 'settings'];

    protected $casts = ['settings' => 'array'];

    protected static function booted(): void
    {
        static::creating(function (Household $h): void {
            if (empty($h->slug)) {
                $h->slug = self::makeUniqueSlug($h->name);
            }
            if (empty($h->invite_code)) {
                $h->invite_code = self::makeInviteCode();
            }
        });
    }

    public static function makeUniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'home';
        $slug = $base;
        $i = 2;
        while (self::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public static function makeInviteCode(int $length = 8): string
    {
        do {
            $code = strtoupper(Str::random($length));
        } while (self::where('invite_code', $code)->exists());

        return $code;
    }

    // Relações ----------------------------------------------------------------

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(HouseholdMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'household_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function invites(): HasMany
    {
        return $this->hasMany(HouseholdInvite::class);
    }

    public function childCredentials(): HasMany
    {
        return $this->hasMany(ChildCredential::class);
    }

    public function guardianLinks(): HasMany
    {
        return $this->hasMany(GuardianChild::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class);
    }

    public function difficultyPresets(): HasMany
    {
        return $this->hasMany(DifficultyPreset::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class);
    }

    public function rewardRedemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function shoppingLists(): HasMany
    {
        return $this->hasMany(ShoppingList::class);
    }
}
