<?php

use App\Models\User;

it('registers a new adult and returns a token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Maria',
        'email' => 'maria@test.local',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'maria@test.local')
        ->assertJsonStructure(['user', 'token', 'abilities']);

    expect(User::where('email', 'maria@test.local')->first()->role)->toBe(User::ROLE_OWNER);
});

it('logs in an adult with valid credentials', function () {
    User::factory()->create([
        'email' => 'joao@test.local',
        'password' => bcrypt('secret1234'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'joao@test.local',
        'password' => 'secret1234',
    ]);

    $response->assertOk()->assertJsonPath('user.email', 'joao@test.local');
});

it('rejects login with wrong password', function () {
    User::factory()->create([
        'email' => 'joao@test.local',
        'password' => bcrypt('secret1234'),
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'joao@test.local',
        'password' => 'WRONG',
    ])->assertStatus(422);
});

it('blocks child accounts from the adult login endpoint', function () {
    User::factory()->child()->create([
        'email' => 'kid@test.local',
        'password' => bcrypt('secret1234'),
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'kid@test.local',
        'password' => 'secret1234',
    ])->assertStatus(403)
        ->assertJsonPath('error.code', 'use_kids_login');
});

it('returns the authenticated user via /api/auth/me', function () {
    $user = User::factory()->owner()->create();

    $this->actingAs($user)
        ->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id);
});
