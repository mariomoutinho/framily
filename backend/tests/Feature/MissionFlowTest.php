<?php

use App\Models\DifficultyPreset;
use App\Models\Household;
use App\Models\Mission;
use App\Models\MissionTemplate;
use App\Models\PointTransaction;
use App\Models\User;
use Database\Seeders\DifficultyPresetSeeder;
use Database\Seeders\MissionTemplateSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(DifficultyPresetSeeder::class);
    $this->seed(MissionTemplateSeeder::class);

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
});

it('lists 8 mission templates from seeder', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $this->getJson('/api/mission-templates')
        ->assertOk()
        ->assertJsonCount(8, 'data');
});

it('creates a mission from template', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $template = MissionTemplate::where('key', 'arrumar_cama_5_dias')->first();

    $response = $this->postJson("/api/households/{$this->household->id}/missions", [
        'template_id' => $template->id,
        'name' => 'Arrumar a cama 5 dias',
        'participant_user_ids' => [$this->child->id],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.target_value', 5)
        ->assertJsonPath('data.mission_type', 'streak');

    expect(Mission::count())->toBe(1);
});

it('child completes a mission with approval pending', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $easy = DifficultyPreset::where('key', 'easy')->whereNull('household_id')->first();
    $mission = $this->postJson("/api/households/{$this->household->id}/missions", [
        'name' => 'Missão custom',
        'mission_type' => 'single_task',
        'difficulty_preset_id' => $easy->id,
        'requires_approval' => true,
        'participant_user_ids' => [$this->child->id],
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $response = $this->postJson("/api/households/{$this->household->id}/missions/{$mission['id']}/complete");
    $response->assertCreated()
        ->assertJsonPath('status', 'pending')
        ->assertJsonPath('points_awarded', 10);

    expect(PointTransaction::where('source_type', 'mission')->where('status', 'pending')->count())->toBe(1);
});

it('progress increment increases current value', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $easy = DifficultyPreset::where('key', 'easy')->whereNull('household_id')->first();
    $mission = $this->postJson("/api/households/{$this->household->id}/missions", [
        'name' => 'Conta 3',
        'mission_type' => 'count',
        'difficulty_preset_id' => $easy->id,
        'target_value' => 3,
        'participant_user_ids' => [$this->owner->id],
    ])->json('data');

    $this->postJson("/api/households/{$this->household->id}/missions/{$mission['id']}/progress")
        ->assertOk()
        ->assertJsonPath('current_value', 1);

    $this->postJson("/api/households/{$this->household->id}/missions/{$mission['id']}/progress", ['amount' => 2])
        ->assertOk()
        ->assertJsonPath('current_value', 3)
        ->assertJsonPath('reached_target', true);
});

it('collective mission distributes points to all participants', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $easy = DifficultyPreset::where('key', 'easy')->whereNull('household_id')->first();

    $mission = $this->postJson("/api/households/{$this->household->id}/missions", [
        'name' => 'Coletiva',
        'mission_type' => 'collective',
        'difficulty_preset_id' => $easy->id,
        'is_collective' => true,
        'requires_approval' => false,
        'participant_user_ids' => [$this->owner->id, $this->child->id],
    ])->json('data');

    $this->postJson("/api/households/{$this->household->id}/missions/{$mission['id']}/complete")->assertCreated();

    expect(PointTransaction::where('user_id', $this->owner->id)->where('status', 'confirmed')->sum('points'))->toBe(10);
    expect(PointTransaction::where('user_id', $this->child->id)->where('status', 'confirmed')->sum('points'))->toBe(10);
});
