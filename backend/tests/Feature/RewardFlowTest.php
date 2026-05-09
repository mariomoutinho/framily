<?php

use App\Models\DifficultyPreset;
use App\Models\Household;
use App\Models\PointTransaction;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use Database\Seeders\AchievementSeeder;
use Database\Seeders\DifficultyPresetSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(DifficultyPresetSeeder::class);
    $this->seed(AchievementSeeder::class);

    $this->owner = User::factory()->owner()->create();
    $this->household = Household::create(['name' => 'Casa', 'owner_id' => $this->owner->id]);
    $this->household->members()->create([
        'user_id' => $this->owner->id,
        'role' => User::ROLE_OWNER,
        'joined_at' => now(),
    ]);

    $this->child = User::factory()->child()->create();
    $this->household->members()->create([
        'user_id' => $this->child->id,
        'role' => User::ROLE_CHILD,
        'joined_at' => now(),
    ]);

    // Garantir saldo de pontos para a criança via transação manual confirmada
    PointTransaction::create([
        'user_id' => $this->child->id,
        'household_id' => $this->household->id,
        'source_type' => 'manual',
        'source_id' => null,
        'points' => 100,
        'status' => PointTransaction::STATUS_CONFIRMED,
    ]);
});

it('adult creates a reward', function () {
    Sanctum::actingAs($this->owner, ['adult']);

    $response = $this->postJson("/api/households/{$this->household->id}/rewards", [
        'name' => '30 min de TV',
        'points_cost' => 50,
        'requires_approval' => true,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', '30 min de TV')
        ->assertJsonPath('data.points_cost', 50);

    expect(Reward::count())->toBe(1);
});

it('child requests redemption which creates pending redemption', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $reward = $this->postJson("/api/households/{$this->household->id}/rewards", [
        'name' => 'TV',
        'points_cost' => 50,
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $response = $this->postJson("/api/households/{$this->household->id}/rewards/{$reward['id']}/redeem");

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.points_spent', 50);

    // Pontos ainda não foram debitados (pending).
    expect(
        PointTransaction::where('user_id', $this->child->id)->sum('points')
    )->toBe(100);
});

it('adult approval debits points and unlocks first_redeem achievement', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $reward = $this->postJson("/api/households/{$this->household->id}/rewards", [
        'name' => 'TV',
        'points_cost' => 50,
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $redemption = $this->postJson(
        "/api/households/{$this->household->id}/rewards/{$reward['id']}/redeem"
    )->json('data');

    Sanctum::actingAs($this->owner, ['adult']);
    $this->postJson(
        "/api/households/{$this->household->id}/reward-redemptions/{$redemption['id']}/approve"
    )->assertOk();

    expect(RewardRedemption::find($redemption['id'])->status)->toBe('approved');
    expect(
        PointTransaction::where('user_id', $this->child->id)
            ->where('status', 'confirmed')
            ->sum('points')
    )->toBe(50); // 100 ganhos - 50 gastos

    // Conquista first_redeem desbloqueada.
    expect(
        $this->child->fresh()->achievements()->where('key', 'first_redeem')->exists()
    )->toBeTrue();
});

it('rejects redemption when child has insufficient points', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $reward = $this->postJson("/api/households/{$this->household->id}/rewards", [
        'name' => 'Caro',
        'points_cost' => 9999,
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $this->postJson("/api/households/{$this->household->id}/rewards/{$reward['id']}/redeem")
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'insufficient_points');
});

it('first task completion unlocks the first_task achievement', function () {
    $easy = DifficultyPreset::where('key', 'easy')->first();

    Sanctum::actingAs($this->owner, ['adult']);
    $task = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'X',
        'difficulty_preset_id' => $easy->id,
        'assignee_user_ids' => [$this->owner->id],
    ])->json('data');

    $this->postJson("/api/households/{$this->household->id}/tasks/{$task['id']}/complete")
        ->assertOk();

    expect(
        $this->owner->fresh()->achievements()->where('key', 'first_task')->exists()
    )->toBeTrue();
});

it('returns ranking ordered by confirmed points', function () {
    $other = User::factory()->owner()->create();
    $this->household->members()->create([
        'user_id' => $other->id,
        'role' => User::ROLE_ADULT,
        'joined_at' => now(),
    ]);

    PointTransaction::create([
        'user_id' => $other->id,
        'household_id' => $this->household->id,
        'source_type' => 'manual',
        'points' => 200,
        'status' => 'confirmed',
    ]);

    Sanctum::actingAs($this->owner, ['adult']);
    $response = $this->getJson("/api/households/{$this->household->id}/points?scope=all");

    $response->assertOk();
    $entries = $response->json('entries');
    expect($entries[0]['user_id'])->toBe($other->id);
    expect($entries[0]['points'])->toBe(200);
});
