<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('secret123'),
            'role' => User::ROLE_ADULT,
            'locale' => 'pt_BR',
            'is_active' => true,
        ];
    }

    public function child(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_CHILD]);
    }

    public function owner(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_OWNER]);
    }
}
