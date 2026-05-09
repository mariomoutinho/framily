<?php

use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ChildAuthController;
use App\Http\Controllers\Api\ChildCredentialController;
use App\Http\Controllers\Api\DifficultyPresetController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\HouseholdController;
use App\Http\Controllers\Api\InviteController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MissionCompletionController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\MissionTemplateController;
use App\Http\Controllers\Api\PointController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\RewardRedemptionController;
use App\Http\Controllers\Api\ShoppingListController;
use App\Http\Controllers\Api\TaskCompletionController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Framily — API Routes
|--------------------------------------------------------------------------
|
| Tokens Sanctum têm abilities 'adult', 'admin' ou 'child'.
| Middlewares 'adult.access' e 'child.access' filtram acesso por perfil.
*/

Route::get('/health', HealthController::class);

// -----------------------------------------------------------------------
// Auth pública
// -----------------------------------------------------------------------
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/kids/auth/login-email', [ChildAuthController::class, 'loginEmail']);
    Route::post('/kids/auth/login-pin', [ChildAuthController::class, 'loginPin']);
});

// -----------------------------------------------------------------------
// Sessão atual
// -----------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/kids/me', [ChildAuthController::class, 'me'])->middleware('child.access');
    Route::post('/kids/auth/logout', [ChildAuthController::class, 'logout'])->middleware('child.access');

    Route::get('/points/me', [PointController::class, 'me']);
    Route::get('/achievements', [AchievementController::class, 'index']);
    Route::get('/achievements/me', [AchievementController::class, 'me']);
});

// -----------------------------------------------------------------------
// Recursos compartilhados (autenticados)
// -----------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/difficulty-presets', [DifficultyPresetController::class, 'index']);
    Route::get('/mission-templates', [MissionTemplateController::class, 'index']);
});

// -----------------------------------------------------------------------
// Casas / Membros (rotas adultas)
// -----------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'adult.access'])->group(function () {
    Route::get('/households', [HouseholdController::class, 'index']);
    Route::post('/households', [HouseholdController::class, 'store']);
    Route::post('/households/join', [HouseholdController::class, 'join']);
    Route::get('/households/{household}', [HouseholdController::class, 'show']);

    Route::get('/households/{household}/invites', [InviteController::class, 'index']);
    Route::post('/households/{household}/invites', [InviteController::class, 'store']);
    Route::delete('/households/{household}/invites/{invite}', [InviteController::class, 'destroy']);

    Route::get('/households/{household}/members', [MemberController::class, 'index']);
    Route::post('/households/{household}/members/children', [MemberController::class, 'storeChild']);
    Route::delete('/households/{household}/members/{member}', [MemberController::class, 'destroy']);

    Route::post('/households/{household}/children/{child}/credentials', [ChildCredentialController::class, 'upsert']);
    Route::delete('/households/{household}/children/{child}/credentials', [ChildCredentialController::class, 'disable']);

    Route::post('/households/{household}/children/{child}/guardians', [GuardianController::class, 'attach']);
    Route::delete('/households/{household}/children/{child}/guardians/{guardian}', [GuardianController::class, 'detach']);

    // Tarefas (adultos: CRUD + aprovação)
    Route::post('/households/{household}/tasks', [TaskController::class, 'store']);
    Route::patch('/households/{household}/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/households/{household}/tasks/{task}', [TaskController::class, 'destroy']);
    Route::get('/households/{household}/task-completions/pending', [TaskCompletionController::class, 'pending']);
    Route::post('/households/{household}/task-completions/{completion}/approve', [TaskCompletionController::class, 'approve']);
    Route::post('/households/{household}/task-completions/{completion}/reject', [TaskCompletionController::class, 'reject']);

    // Missões (adultos: CRUD)
    Route::post('/households/{household}/missions', [MissionController::class, 'store']);
    Route::patch('/households/{household}/missions/{mission}', [MissionController::class, 'update']);
    Route::delete('/households/{household}/missions/{mission}', [MissionController::class, 'destroy']);
    Route::post('/households/{household}/mission-completions/{completion}/approve', [MissionCompletionController::class, 'approve']);

    // Recompensas (adultos: CRUD + aprovação)
    Route::post('/households/{household}/rewards', [RewardController::class, 'store']);
    Route::patch('/households/{household}/rewards/{reward}', [RewardController::class, 'update']);
    Route::delete('/households/{household}/rewards/{reward}', [RewardController::class, 'destroy']);
    Route::post('/households/{household}/reward-redemptions/{redemption}/approve', [RewardRedemptionController::class, 'approve']);
    Route::post('/households/{household}/reward-redemptions/{redemption}/deny', [RewardRedemptionController::class, 'deny']);
    Route::post('/households/{household}/reward-redemptions/{redemption}/deliver', [RewardRedemptionController::class, 'deliver']);

    // Contas (adultos only)
    Route::get('/households/{household}/bills', [BillController::class, 'index']);
    Route::post('/households/{household}/bills', [BillController::class, 'store']);
    Route::patch('/households/{household}/bills/{bill}', [BillController::class, 'update']);
    Route::delete('/households/{household}/bills/{bill}', [BillController::class, 'destroy']);
    Route::post('/households/{household}/bills/{bill}/pay', [BillController::class, 'markPaid']);
    Route::post('/households/{household}/bills/{bill}/splits/{split}/pay', [BillController::class, 'markSplitPaid']);

    // Listas de compras (CRUD adulto)
    Route::post('/households/{household}/shopping-lists', [ShoppingListController::class, 'store']);
    Route::patch('/households/{household}/shopping-lists/{list}', [ShoppingListController::class, 'update']);
    Route::delete('/households/{household}/shopping-lists/{list}', [ShoppingListController::class, 'destroy']);

    // Ranking
    Route::get('/households/{household}/points', [PointController::class, 'household']);
});

// -----------------------------------------------------------------------
// Tarefas, missões e recompensas: leitura + ações (adultos e crianças)
// -----------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/households/{household}/tasks', [TaskController::class, 'index']);
    Route::get('/households/{household}/tasks/{task}', [TaskController::class, 'show']);
    Route::post('/households/{household}/tasks/{task}/complete', [TaskCompletionController::class, 'complete']);

    Route::get('/households/{household}/missions', [MissionController::class, 'index']);
    Route::get('/households/{household}/missions/{mission}', [MissionController::class, 'show']);
    Route::post('/households/{household}/missions/{mission}/progress', [MissionCompletionController::class, 'progress']);
    Route::post('/households/{household}/missions/{mission}/complete', [MissionCompletionController::class, 'complete']);

    Route::get('/households/{household}/rewards', [RewardController::class, 'index']);
    Route::get('/households/{household}/reward-redemptions', [RewardRedemptionController::class, 'index']);
    Route::post('/households/{household}/rewards/{reward}/redeem', [RewardRedemptionController::class, 'request']);

    // Calendário agregado (adultos veem tudo, crianças não veem bills)
    Route::get('/households/{household}/calendar', [CalendarController::class, 'index']);

    // Lembretes (adulto + criança podem visualizar/criar/editar)
    Route::get('/households/{household}/reminders', [ReminderController::class, 'index']);
    Route::post('/households/{household}/reminders', [ReminderController::class, 'store']);
    Route::patch('/households/{household}/reminders/{reminder}', [ReminderController::class, 'update']);
    Route::delete('/households/{household}/reminders/{reminder}', [ReminderController::class, 'destroy']);

    // Listas de compras (leitura + colaboração quando allow_children)
    Route::get('/households/{household}/shopping-lists', [ShoppingListController::class, 'index']);
    Route::get('/households/{household}/shopping-lists/{list}', [ShoppingListController::class, 'show']);
    Route::post('/households/{household}/shopping-lists/{list}/items', [ShoppingListController::class, 'addItem']);
    Route::post('/households/{household}/shopping-lists/{list}/items/{item}/toggle', [ShoppingListController::class, 'toggleItem']);
    Route::delete('/households/{household}/shopping-lists/{list}/items/{item}', [ShoppingListController::class, 'removeItem']);
});
