<?php

use App\Models\Household;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('creates a household and registers the creator as owner-member', function () {
    $user = User::factory()->owner()->create();

    Sanctum::actingAs($user, ['adult']);

    $response = $this->postJson('/api/households', ['name' => 'Casa Silva']);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Casa Silva')
        ->assertJsonPath('data.owner_id', $user->id);

    expect(Household::count())->toBe(1);

    $household = Household::first();
    expect($household->members()->where('user_id', $user->id)->where('role', 'owner')->exists())->toBeTrue();
});

it('lists only households the user belongs to', function () {
    $user = User::factory()->owner()->create();
    $other = User::factory()->owner()->create();

    Sanctum::actingAs($user, ['adult']);
    $this->postJson('/api/households', ['name' => 'Casa A'])->assertCreated();

    Sanctum::actingAs($other, ['adult']);
    $this->postJson('/api/households', ['name' => 'Casa B'])->assertCreated();

    Sanctum::actingAs($user, ['adult']);
    $response = $this->getJson('/api/households');
    $response->assertOk()->assertJsonCount(1, 'data');
});

it('blocks child tokens from adult routes', function () {
    $child = User::factory()->child()->create();

    Sanctum::actingAs($child, ['child']);

    $this->getJson('/api/households')->assertStatus(403)
        ->assertJsonPath('error.code', 'child_forbidden');
});

it('rejects creating household when not authenticated', function () {
    $this->postJson('/api/households', ['name' => 'X'])->assertStatus(401);
});
