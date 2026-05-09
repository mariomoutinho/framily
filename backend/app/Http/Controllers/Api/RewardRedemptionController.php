<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RewardRedemptionResource;
use App\Models\Household;
use App\Models\PointTransaction;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Services\AchievementChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class RewardRedemptionController extends Controller
{
    /**
     * Lista resgates da casa (adultos veem todos; crianças veem apenas os próprios).
     */
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = RewardRedemption::query()
            ->where('household_id', $household->id)
            ->with(['reward', 'requestedBy']);

        $user = $request->user();
        if ($user->isChild()) {
            $query->where('requested_by_user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return RewardRedemptionResource::collection($query->latest()->limit(100)->get());
    }

    /**
     * Solicita o resgate de uma recompensa.
     *  - Adulto: cria approved + cria PointTransaction negativa confirmed (gasta pontos)
     *  - Criança: cria pending; só consome pontos quando adulto aprovar
     */
    public function request(Request $request, Household $household, Reward $reward): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($reward->household_id !== $household->id, 404);
        abort_unless($reward->isAvailable(), 422);

        $user = $request->user();
        $availablePoints = $this->confirmedPoints($user->id, $household->id);
        if ($availablePoints < $reward->points_cost) {
            return response()->json([
                'error' => [
                    'code' => 'insufficient_points',
                    'message_key' => 'errors.insufficient_points',
                    'available_points' => $availablePoints,
                ],
            ], 422);
        }

        $needsApproval = $user->isChild() || $reward->requires_approval;
        $status = $needsApproval ? RewardRedemption::STATUS_PENDING : RewardRedemption::STATUS_APPROVED;

        $redemption = DB::transaction(function () use ($reward, $user, $household, $status, $needsApproval, $request) {
            $redemption = $household->rewardRedemptions()->create([
                'reward_id' => $reward->id,
                'requested_by_user_id' => $user->id,
                'status' => $status,
                'approved_by_user_id' => $needsApproval ? null : $user->id,
                'approved_at' => $needsApproval ? null : now(),
                'points_spent' => $reward->points_cost,
                'note' => $request->input('note'),
            ]);

            if (! $needsApproval) {
                // Adulto auto-resgate: debita pontos imediatamente
                $this->debitPoints($user->id, $household->id, $reward, $redemption);
                if ($reward->stock !== null) {
                    $reward->decrement('stock');
                }
            }

            return $redemption;
        });

        return RewardRedemptionResource::make($redemption->fresh()->load(['reward', 'requestedBy']))
            ->response()
            ->setStatusCode(201);
    }

    public function approve(
        Request $request,
        Household $household,
        RewardRedemption $redemption,
        AchievementChecker $checker,
    ): JsonResponse {
        $this->authorize('view', $household);
        abort_if($redemption->household_id !== $household->id, 404);
        abort_if($redemption->status !== RewardRedemption::STATUS_PENDING, 422);
        abort_unless($request->user()->isAdult(), 403);

        $reward = $redemption->reward;
        // Verifica saldo no momento da aprovação
        $available = $this->confirmedPoints($redemption->requested_by_user_id, $household->id);
        if ($available < $redemption->points_spent) {
            return response()->json([
                'error' => [
                    'code' => 'insufficient_points',
                    'message_key' => 'errors.insufficient_points',
                    'available_points' => $available,
                ],
            ], 422);
        }

        DB::transaction(function () use ($redemption, $request, $reward) {
            $redemption->forceFill([
                'status' => RewardRedemption::STATUS_APPROVED,
                'approved_by_user_id' => $request->user()->id,
                'approved_at' => now(),
            ])->save();

            $this->debitPoints(
                $redemption->requested_by_user_id,
                $redemption->household_id,
                $reward,
                $redemption,
            );

            if ($reward && $reward->stock !== null) {
                $reward->decrement('stock');
            }
        });

        // Concede achievement first_redeem se aplicável.
        $requester = $redemption->requestedBy;
        if ($requester) {
            $checker->checkForUser($requester, $household->id);
        }

        return response()->json(['ok' => true]);
    }

    public function deny(Request $request, Household $household, RewardRedemption $redemption): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($redemption->household_id !== $household->id, 404);
        abort_if($redemption->status !== RewardRedemption::STATUS_PENDING, 422);
        abort_unless($request->user()->isAdult(), 403);

        $redemption->forceFill([
            'status' => RewardRedemption::STATUS_DENIED,
            'approved_by_user_id' => $request->user()->id,
            'approved_at' => now(),
        ])->save();

        return response()->json(['ok' => true]);
    }

    public function deliver(Request $request, Household $household, RewardRedemption $redemption): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($redemption->household_id !== $household->id, 404);
        abort_if($redemption->status !== RewardRedemption::STATUS_APPROVED, 422);
        abort_unless($request->user()->isAdult(), 403);

        $redemption->forceFill(['status' => RewardRedemption::STATUS_DELIVERED])->save();

        return response()->json(['ok' => true]);
    }

    private function confirmedPoints(int $userId, int $householdId): int
    {
        return (int) PointTransaction::where('user_id', $userId)
            ->where('household_id', $householdId)
            ->where('status', PointTransaction::STATUS_CONFIRMED)
            ->sum('points');
    }

    private function debitPoints(int $userId, int $householdId, ?Reward $reward, RewardRedemption $redemption): void
    {
        PointTransaction::create([
            'user_id' => $userId,
            'household_id' => $householdId,
            'source_type' => PointTransaction::SOURCE_REWARD,
            'source_id' => $redemption->id,
            'points' => -1 * $redemption->points_spent,
            'status' => PointTransaction::STATUS_CONFIRMED,
            'reason_key' => 'gamification.reason.reward_redeemed',
            'meta' => ['reward_id' => $reward?->id, 'reward_name' => $reward?->name],
        ]);
    }
}
