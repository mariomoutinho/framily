<?php

use App\Models\Bill;
use App\Models\Household;
use App\Models\ShoppingList;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
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

it('adult creates a reminder and lists it', function () {
    Sanctum::actingAs($this->owner, ['adult']);

    $this->postJson("/api/households/{$this->household->id}/reminders", [
        'title' => 'Pagar luz',
        'remind_at' => now()->addDay()->toIso8601String(),
    ])->assertCreated();

    $this->getJson("/api/households/{$this->household->id}/reminders")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('adult creates a bill with splits and child cannot see it', function () {
    $other = User::factory()->create();
    $this->household->members()->create([
        'user_id' => $other->id,
        'role' => User::ROLE_ADULT,
        'joined_at' => now(),
    ]);

    Sanctum::actingAs($this->owner, ['adult']);

    $response = $this->postJson("/api/households/{$this->household->id}/bills", [
        'title' => 'Aluguel',
        'amount' => 1500,
        'due_date' => now()->addDays(5)->toDateString(),
        'split_user_ids' => [$this->owner->id, $other->id],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.amount', 1500)
        ->assertJsonCount(2, 'data.splits');

    expect(Bill::first()->splits()->where('share_amount', 750)->count())->toBe(2);

    // Criança não pode listar bills (adult.access middleware)
    Sanctum::actingAs($this->child, ['child']);
    $this->getJson("/api/households/{$this->household->id}/bills")->assertStatus(403);
});

it('marking all splits paid marks the bill as paid', function () {
    $other = User::factory()->create();
    $this->household->members()->create([
        'user_id' => $other->id,
        'role' => User::ROLE_ADULT,
        'joined_at' => now(),
    ]);

    Sanctum::actingAs($this->owner, ['adult']);
    $bill = $this->postJson("/api/households/{$this->household->id}/bills", [
        'title' => 'X',
        'amount' => 100,
        'split_user_ids' => [$this->owner->id, $other->id],
    ])->json('data');

    $splits = $bill['splits'];
    $this->postJson("/api/households/{$this->household->id}/bills/{$bill['id']}/splits/{$splits[0]['id']}/pay")
        ->assertOk();
    $this->postJson("/api/households/{$this->household->id}/bills/{$bill['id']}/splits/{$splits[1]['id']}/pay")
        ->assertOk();

    expect(Bill::find($bill['id'])->status)->toBe(Bill::STATUS_PAID);
});

it('child cannot see shopping lists not marked allow_children', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $list = ShoppingList::create([
        'household_id' => $this->household->id,
        'name' => 'Mercado',
        'allow_children' => false,
        'created_by_user_id' => $this->owner->id,
    ]);

    Sanctum::actingAs($this->child, ['child']);
    $response = $this->getJson("/api/households/{$this->household->id}/shopping-lists");
    $response->assertOk()->assertJsonCount(0, 'data');

    // Tentando acessar diretamente, recebe 403
    $this->getJson("/api/households/{$this->household->id}/shopping-lists/{$list->id}")
        ->assertStatus(403);
});

it('child can toggle items in lists with allow_children=true', function () {
    Sanctum::actingAs($this->owner, ['adult']);
    $list = $this->postJson("/api/households/{$this->household->id}/shopping-lists", [
        'name' => 'Família',
        'allow_children' => true,
    ])->json('data');

    Sanctum::actingAs($this->child, ['child']);
    $item = $this->postJson(
        "/api/households/{$this->household->id}/shopping-lists/{$list['id']}/items",
        ['name' => 'Maçã', 'quantity' => 6],
    )->json('data');

    $this->postJson(
        "/api/households/{$this->household->id}/shopping-lists/{$list['id']}/items/{$item['id']}/toggle"
    )->assertOk()->assertJsonPath('data.status', 'bought');
});

it('calendar aggregates events from all sources', function () {
    Sanctum::actingAs($this->owner, ['adult']);

    $this->postJson("/api/households/{$this->household->id}/reminders", [
        'title' => 'Reunião',
        'remind_at' => now()->addDay()->toIso8601String(),
    ])->assertCreated();

    $this->postJson("/api/households/{$this->household->id}/bills", [
        'title' => 'Aluguel',
        'amount' => 500,
        'due_date' => now()->addDays(2)->toDateString(),
    ])->assertCreated();

    $response = $this->getJson("/api/households/{$this->household->id}/calendar");
    $response->assertOk();
    expect(count($response->json('events')))->toBeGreaterThanOrEqual(2);

    // Criança não vê bills
    Sanctum::actingAs($this->child, ['child']);
    $childResponse = $this->getJson("/api/households/{$this->household->id}/calendar");
    $childResponse->assertOk();
    $events = $childResponse->json('events');
    expect(collect($events)->pluck('type')->all())->not->toContain('bill');
});
