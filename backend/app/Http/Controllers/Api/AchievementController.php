<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AchievementResource;
use App\Models\Achievement;
use App\Models\UserAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AchievementController extends Controller
{
    /**
     * Lista todos os achievements ativos.
     */
    public function index(): AnonymousResourceCollection
    {
        return AchievementResource::collection(
            Achievement::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    /**
     * Conquistas do usuário autenticado, com flag unlocked.
     * Pode filtrar por household_id via query.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $householdId = $request->integer('household_id');

        $achievements = Achievement::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $userAchievements = UserAchievement::where('user_id', $user->id)
            ->when($householdId, fn ($q) => $q->where('household_id', $householdId))
            ->get()
            ->keyBy('achievement_id');

        $items = $achievements->map(function (Achievement $a) use ($userAchievements) {
            $entry = $userAchievements->get($a->id);

            return [
                'id' => $a->id,
                'key' => $a->key,
                'name_key' => $a->name_key,
                'description_key' => $a->description_key,
                'icon' => $a->icon,
                'criteria' => $a->criteria,
                'unlocked' => $entry !== null,
                'unlocked_at' => $entry?->unlocked_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'unlocked_count' => $userAchievements->count(),
            'total_count' => $achievements->count(),
            'items' => $items,
        ]);
    }
}
