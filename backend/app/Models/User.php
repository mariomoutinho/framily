<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Framily User.
 *
 * Roles: owner | admin | adult | child.
 * Campos provider/provider_id já preparados para Socialite (Fase futura).
 *
 * @property string $role
 * @property string $locale
 * @property bool   $is_active
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_OWNER = 'owner';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_ADULT = 'adult';
    public const ROLE_CHILD = 'child';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'locale',
        'avatar_url',
        'is_active',
        'provider',
        'provider_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'provider_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isChild(): bool
    {
        return $this->role === self::ROLE_CHILD;
    }

    public function isAdult(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_ADULT], true);
    }

    /**
     * Lista de tokens Sanctum abilities para o usuário.
     */
    public function defaultTokenAbilities(): array
    {
        return match ($this->role) {
            self::ROLE_OWNER, self::ROLE_ADMIN => ['adult', 'admin'],
            self::ROLE_ADULT => ['adult'],
            self::ROLE_CHILD => ['child'],
            default => [],
        };
    }

    // Relações ----------------------------------------------------------------

    public function households(): BelongsToMany
    {
        return $this->belongsToMany(Household::class, 'household_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(HouseholdMember::class);
    }

    public function ownedHouseholds(): HasMany
    {
        return $this->hasMany(Household::class, 'owner_id');
    }

    public function childCredential(): HasOne
    {
        return $this->hasOne(ChildCredential::class);
    }

    /** Adultos responsáveis por este usuário-criança. */
    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'guardian_children',
            'child_user_id',
            'guardian_user_id',
        )->withPivot('household_id')->withTimestamps();
    }

    /** Crianças sob responsabilidade deste usuário-adulto. */
    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'guardian_children',
            'guardian_user_id',
            'child_user_id',
        )->withPivot('household_id')->withTimestamps();
    }

    public function isMemberOf(Household $household): bool
    {
        return $this->memberships()->where('household_id', $household->id)->exists();
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot(['household_id', 'unlocked_at', 'meta'])
            ->withTimestamps();
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }
}
