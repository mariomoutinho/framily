<?php

use App\Models\ChildCredential;
use App\Models\Household;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('creates a child member with nickname/PIN and allows kids/login-pin', function () {
    $owner = User::factory()->owner()->create();
    Sanctum::actingAs($owner, ['adult']);

    // Cria casa
    $household = $this->postJson('/api/households', ['name' => 'Casa Pais'])
        ->assertCreated()->json('data');

    // Cria criança com apelido + PIN
    $this->postJson("/api/households/{$household['id']}/members/children", [
        'name' => 'Lulu',
        'nickname' => 'lulu',
        'pin' => '1234',
        'guardian_user_id' => $owner->id,
    ])->assertCreated();

    // Login PIN da criança
    $h = Household::find($household['id']);
    $response = $this->postJson('/api/kids/auth/login-pin', [
        'household_code' => $h->invite_code,
        'nickname' => 'lulu',
        'pin' => '1234',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.role', User::ROLE_CHILD)
        ->assertJsonPath('abilities', ['child']);
});

it('rejects invalid PIN', function () {
    $owner = User::factory()->owner()->create();
    $household = Household::create(['name' => 'X', 'owner_id' => $owner->id]);
    $child = User::factory()->child()->create();
    $cred = new ChildCredential([
        'user_id' => $child->id,
        'household_id' => $household->id,
        'nickname' => 'mimi',
        'is_active' => true,
    ]);
    $cred->setPin('5678');
    $cred->save();

    $this->postJson('/api/kids/auth/login-pin', [
        'household_code' => $household->invite_code,
        'nickname' => 'mimi',
        'pin' => '0000',
    ])->assertStatus(422);
});

it('rejects PIN login when credential is disabled', function () {
    $owner = User::factory()->owner()->create();
    $household = Household::create(['name' => 'X', 'owner_id' => $owner->id]);
    $child = User::factory()->child()->create();
    $cred = new ChildCredential([
        'user_id' => $child->id,
        'household_id' => $household->id,
        'nickname' => 'mimi',
        'is_active' => false,
    ]);
    $cred->setPin('1234');
    $cred->save();

    $this->postJson('/api/kids/auth/login-pin', [
        'household_code' => $household->invite_code,
        'nickname' => 'mimi',
        'pin' => '1234',
    ])->assertStatus(422);
});
