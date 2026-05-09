<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Mission;
use App\Models\PointTransaction;
use App\Models\RewardRedemption;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Support\Collection;

/**
 * Verifica se o usuário desbloqueou novas conquistas a partir de um evento.
 *
 * Tipos suportados em criteria.type:
 *   - first_task              → primeira TaskCompletion approved do usuário
 *   - first_mission           → primeira MissionCompletion approved
 *   - first_collective_mission → primeira missão coletiva concluída em que participou
 *   - first_redeem            → primeira RewardRedemption approved
 *   - points_total (value)    → total de pontos confirmados ≥ value
 *   - points_week  (value)    → pontos confirmados na semana atual ≥ value
 */
class AchievementChecker
{
    public function checkForUser(User $user, ?int $householdId = null): array
    {
        $achievements = Achievement::where('is_active', true)->get();
        $unlockedNow = [];

        foreach ($achievements as $achievement) {
            if ($achievement->child_only && ! $user->isChild()) {
                continue;
            }
            if (! $this->matches($user, $achievement, $householdId)) {
                continue;
            }
            // Já desbloqueado?
            $exists = UserAchievement::where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->where(function ($q) use ($householdId) {
                    if ($householdId) {
                        $q->where('household_id', $householdId)->orWhereNull('household_id');
                    }
                })
                ->exists();
            if ($exists) {
                continue;
            }

            UserAchievement::create([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'household_id' => $householdId,
                'unlocked_at' => now(),
            ]);
            $unlockedNow[] = $achievement;
        }

        return $unlockedNow;
    }

    private function matches(User $user, Achievement $achievement, ?int $householdId): bool
    {
        $criteria = (array) ($achievement->criteria ?? []);
        $type = $criteria['type'] ?? null;
        $value = (int) ($criteria['value'] ?? 0);

        return match ($type) {
            'first_task' => TaskCompletion::where('completed_by_user_id', $user->id)
                ->where('status', TaskCompletion::STATUS_APPROVED)
                ->exists(),
            'first_mission' => $this->hasMissionApproved($user, $householdId, false),
            'first_collective_mission' => $this->hasMissionApproved($user, $householdId, true),
            'first_redeem' => RewardRedemption::where('requested_by_user_id', $user->id)
                ->whereIn('status', [
                    RewardRedemption::STATUS_APPROVED,
                    RewardRedemption::STATUS_DELIVERED,
                ])
                ->exists(),
            'points_total' => $this->confirmedPoints($user, $householdId) >= $value,
            'points_week' => $this->confirmedPoints($user, $householdId, 'week') >= $value,
            default => false,
        };
    }

    private function confirmedPoints(User $user, ?int $householdId, string $scope = 'all'): int
    {
        $query = PointTransaction::where('user_id', $user->id)
            ->where('status', PointTransaction::STATUS_CONFIRMED);

        if ($householdId) {
            $query->where('household_id', $householdId);
        }
        if ($scope === 'week') {
            $query->where('created_at', '>=', now()->startOfWeek());
        }

        return (int) $query->sum('points');
    }

    private function hasMissionApproved(User $user, ?int $householdId, bool $collectiveOnly): bool
    {
        $query = \App\Models\MissionCompletion::query()
            ->where('status', \App\Models\MissionCompletion::STATUS_APPROVED)
            ->whereHas('mission', function ($q) use ($user, $householdId, $collectiveOnly) {
                if ($householdId) {
                    $q->where('household_id', $householdId);
                }
                if ($collectiveOnly) {
                    $q->where('is_collective', true);
                }
                $q->whereHas('participants', fn ($p) => $p->where('users.id', $user->id));
            });

        if (! $collectiveOnly) {
            // missão individual concluída pelo próprio usuário OU coletiva onde participou
            $query->where(function ($q) use ($user) {
                $q->where('completed_by_user_id', $user->id);
            });
        }

        return $query->exists();
    }

    /**
     * Helper para chamar a partir de eventos com lista de usuários (ex: missão coletiva).
     */
    public function checkForUsers(Collection|array $users, ?int $householdId = null): array
    {
        $unlocks = [];
        foreach ($users as $user) {
            $unlocks[$user->id ?? null] = $this->checkForUser($user, $householdId);
        }

        return $unlocks;
    }
}
