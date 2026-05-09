<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\Mission;
use App\Models\MissionCompletion;
use App\Models\MissionProgress;
use App\Models\PointTransaction;
use App\Services\AchievementChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MissionCompletionController extends Controller
{
    /**
     * Avança o progresso da missão (count, streak, recurring).
     */
    public function progress(Request $request, Household $household, Mission $mission): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($mission->household_id !== $household->id, 404);

        $request->validate(['amount' => ['sometimes', 'integer', 'min:1', 'max:1000']]);
        $amount = $request->integer('amount', 1);
        $user = $request->user();

        $progress = MissionProgress::firstOrNew([
            'mission_id' => $mission->id,
            'user_id' => $mission->is_collective ? null : $user->id,
        ]);
        $progress->current_value = ((int) $progress->current_value) + $amount;
        $progress->last_event_at = now();
        $progress->save();

        $reachedTarget = $mission->target_value && $progress->current_value >= $mission->target_value;

        return response()->json([
            'mission_id' => $mission->id,
            'current_value' => (int) $progress->current_value,
            'target_value' => $mission->target_value,
            'reached_target' => (bool) $reachedTarget,
        ]);
    }

    /**
     * Conclui uma missão (cria MissionCompletion + PointTransaction).
     */
    public function complete(Request $request, Household $household, Mission $mission): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($mission->household_id !== $household->id, 404);
        abort_if($mission->status !== Mission::STATUS_ACTIVE, 422, __('errors.mission_already_completed'));

        $user = $request->user();
        $points = $mission->pointsForCompletion();
        $needsApproval = $user->isChild() && $mission->requires_approval;
        $status = $needsApproval ? MissionCompletion::STATUS_PENDING : MissionCompletion::STATUS_APPROVED;

        $completion = DB::transaction(function () use ($mission, $user, $status, $needsApproval, $points, $household) {
            $completion = $mission->completions()->create([
                'completed_by_user_id' => $user->id,
                'completed_at' => now(),
                'status' => $status,
                'approved_by_user_id' => $needsApproval ? null : $user->id,
                'approved_at' => $needsApproval ? null : now(),
                'points_awarded' => $points,
            ]);

            // Distribui pontos: se coletiva, todos os participantes ganham; se individual, só o concluinte.
            $recipients = $mission->is_collective
                ? $mission->participants()->pluck('users.id')->all()
                : [$user->id];

            if (empty($recipients)) {
                $recipients = [$user->id];
            }

            foreach ($recipients as $userId) {
                PointTransaction::create([
                    'user_id' => $userId,
                    'household_id' => $household->id,
                    'source_type' => PointTransaction::SOURCE_MISSION,
                    'source_id' => $completion->id,
                    'points' => $points,
                    'status' => $needsApproval
                        ? PointTransaction::STATUS_PENDING
                        : PointTransaction::STATUS_CONFIRMED,
                    'reason_key' => 'gamification.reason.mission_completed',
                    'meta' => ['mission_id' => $mission->id, 'mission_name' => $mission->name],
                ]);
            }

            // Marca a missão como completed se for individual ou se for one-shot
            if (! $needsApproval && in_array($mission->mission_type, ['single_task', 'count', 'collective'], true)) {
                $mission->forceFill(['status' => Mission::STATUS_COMPLETED])->save();
            }

            return $completion;
        });

        return response()->json([
            'completion_id' => $completion->id,
            'status' => $completion->status,
            'points_awarded' => $completion->points_awarded,
        ], 201);
    }

    public function approve(
        Request $request,
        Household $household,
        MissionCompletion $completion,
        AchievementChecker $checker,
    ): JsonResponse {
        $this->authorize('view', $household);
        abort_if($completion->mission->household_id !== $household->id, 404);
        abort_if($completion->status !== MissionCompletion::STATUS_PENDING, 422);

        abort_unless($request->user()->isAdult(), 403);

        DB::transaction(function () use ($completion, $request) {
            $completion->forceFill([
                'status' => MissionCompletion::STATUS_APPROVED,
                'approved_by_user_id' => $request->user()->id,
                'approved_at' => now(),
            ])->save();

            PointTransaction::where('source_type', PointTransaction::SOURCE_MISSION)
                ->where('source_id', $completion->id)
                ->where('status', PointTransaction::STATUS_PENDING)
                ->each(function (PointTransaction $tx) {
                    $tx->status = PointTransaction::STATUS_CONFIRMED;
                    $tx->save();
                });
        });

        // Recheca achievements para todos os participantes da missão (e o concluinte).
        $mission = $completion->mission()->with('participants')->first();
        $candidates = collect($mission->participants ?? [])
            ->push($completion->completedBy)
            ->filter()
            ->unique('id');

        foreach ($candidates as $user) {
            $checker->checkForUser($user, $household->id);
        }

        return response()->json(['ok' => true]);
    }
}
