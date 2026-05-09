<?php

use App\Models\DifficultyPreset;
use App\Models\Household;
use App\Models\PointTransaction;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use Database\Seeders\DifficultyPresetSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(DifficultyPresetSeeder::class);

    $this->owner = User::factory()->owner()->create();
    $this->household = Household::create([
        'name' => 'Casa Teste',
        'owner_id' => $this->owner->id,
    ]);
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

    $this->easy = DifficultyPreset::where('key', 'easy')->whereNull('household_id')->first();
});

it('adult creates a task and assigns to a child', function () {
    Sanctum::actingAs($this->owner, ['adult']);

    $response = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'Arrumar a cama',
        'difficulty_preset_id' => $this->easy->id,
        'priority' => 'normal',
        'frequency' => 'once',
        'requires_approval' => true,
        'assignee_user_ids' => [$this->child->id],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Arrumar a cama')
        ->assertJsonPath('data.points_for_completion', 10);

    expect(Task::count())->toBe(1);
});

it('child completes a task and gets pending points', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $created = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'Arrumar a cama',
        'difficulty_preset_id' => $this->easy->id,
        'requires_approval' => true,
        'assignee_user_ids' => [$this->child->id],
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $response = $this->postJson("/api/households/{$this->household->id}/tasks/{$created['id']}/complete");
    $response->assertOk()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.points_awarded', 10);

    expect(PointTransaction::where('user_id', $this->child->id)->where('status', 'pending')->count())->toBe(1);
    expect(PointTransaction::where('user_id', $this->child->id)->where('status', 'confirmed')->count())->toBe(0);
});

it('adult approves the child completion which confirms points', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $task = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'Lavar louça',
        'difficulty_preset_id' => $this->easy->id,
        'requires_approval' => true,
        'assignee_user_ids' => [$this->child->id],
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $completion = $this->postJson("/api/households/{$this->household->id}/tasks/{$task['id']}/complete")->json('data');

    Sanctum::actingAs($this->owner, ['adult']);
    $this->postJson("/api/households/{$this->household->id}/task-completions/{$completion['id']}/approve")
        ->assertOk();

    expect(TaskCompletion::find($completion['id'])->status)->toBe('approved');
    expect(PointTransaction::where('user_id', $this->child->id)->where('status', 'confirmed')->sum('points'))->toBe(10);
});

it('reject moves the pending point transaction to cancelled', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $task = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'Tarefa X',
        'difficulty_preset_id' => $this->easy->id,
        'requires_approval' => true,
        'assignee_user_ids' => [$this->child->id],
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $completion = $this->postJson("/api/households/{$this->household->id}/tasks/{$task['id']}/complete")->json('data');

    Sanctum::actingAs($this->owner, ['adult']);
    $this->postJson("/api/households/{$this->household->id}/task-completions/{$completion['id']}/reject")
        ->assertOk();

    expect(PointTransaction::where('source_id', $completion['id'])->first()->status)->toBe('cancelled');
});

it('adult completing own task confirms points immediately', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $task = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'Tarefa adulto',
        'difficulty_preset_id' => $this->easy->id,
        'assignee_user_ids' => [$this->owner->id],
    ])->json('data');

    $this->postJson("/api/households/{$this->household->id}/tasks/{$task['id']}/complete")->assertOk();

    expect(PointTransaction::where('user_id', $this->owner->id)->where('status', 'confirmed')->sum('points'))->toBe(10);
});

it('returns my points totals via /api/points/me', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $task = $this->postJson("/api/households/{$this->household->id}/tasks", [
        'title' => 'X',
        'difficulty_preset_id' => $this->easy->id,
        'assignee_user_ids' => [$this->owner->id],
    ])->json('data');
    $this->postJson("/api/households/{$this->household->id}/tasks/{$task['id']}/complete");

    $response = $this->getJson('/api/points/me?household_id='.$this->household->id);
    $response->assertOk()
        ->assertJsonPath('totals.all', 10)
        ->assertJsonPath('totals.week', 10);
});
