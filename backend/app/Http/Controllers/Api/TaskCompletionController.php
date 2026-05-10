<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskCompletionResource;
use App\Models\Household;
use App\Models\PointTransaction;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Services\AchievementChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskCompletionController extends Controller
{
    /**
     * Marca a tarefa como concluida.
     *  - Adulto: aprova direto (status=approved, points_awarded calculado, PointTransaction confirmed)
     *  - Crianca em tarefa com requires_approval=true: cria pending; PointTransaction pending
     */
    public function complete(Request $request, Household $household, Task $task): TaskCompletionResource
    {
        $this->authorize('view', $household);
        abort_if($task->household_id !== $household->id, 404);

        $user = $request->user();

        $isAssignee = $task->assignees()->where('users.id', $user->id)->exists();
        if ($user->isChild() && ! $isAssignee) {
            abort(403, __('errors.forbidden'));
        }

        $needsApproval = $user->isChild() && $task->requires_approval;
        $status = $needsApproval ? TaskCompletion::STATUS_PENDING : TaskCompletion::STATUS_APPROVED;

        $completion = DB::transaction(function () use ($task, $user, $status, $household, $needsApproval, $request) {
            $lockedTask = Task::query()
                ->whereKey($task->id)
                ->lockForUpdate()
                ->firstOrFail();

            $completionQuery = $lockedTask->completions()
                ->whereIn('status', [TaskCompletion::STATUS_PENDING, TaskCompletion::STATUS_APPROVED]);

            if ($lockedTask->frequency === 'once') {
                abort_if($completionQuery->exists(), 422, __('errors.task_already_completed'));
            } else {
                // Recorrencias ainda nao geram instancias por periodo; por enquanto,
                // limitamos uma pontuacao por usuario/dia para evitar duplicidade.
                abort_if(
                    $completionQuery
                        ->where('completed_by_user_id', $user->id)
                        ->where('completed_at', '>=', now()->startOfDay())
                        ->exists(),
                    422,
                    __('errors.task_already_completed'),
                );
            }

            $points = $lockedTask->pointsForCompletion();

            $completion = $lockedTask->completions()->create([
                'completed_by_user_id' => $user->id,
                'completed_at' => now(),
                'status' => $status,
                'approved_by_user_id' => $needsApproval ? null : $user->id,
                'approved_at' => $needsApproval ? null : now(),
                'points_awarded' => $points,
                'note' => $request->input('note'),
            ]);

            PointTransaction::create([
                'user_id' => $user->id,
                'household_id' => $household->id,
                'source_type' => PointTransaction::SOURCE_TASK,
                'source_id' => $completion->id,
                'points' => $points,
                'status' => $needsApproval
                    ? PointTransaction::STATUS_PENDING
                    : PointTransaction::STATUS_CONFIRMED,
                'reason_key' => 'gamification.reason.task_completed',
                'meta' => ['task_id' => $lockedTask->id, 'task_title' => $lockedTask->title],
            ]);

            if (! $needsApproval) {
                $lockedTask->forceFill([
                    'status' => $lockedTask->frequency === 'once'
                        ? Task::STATUS_COMPLETED
                        : $lockedTask->status,
                    'completed_at' => now(),
                ])->save();
            }

            return $completion;
        });

        return TaskCompletionResource::make($completion->fresh()->load('completedBy'));
    }

    /**
     * Aprova uma conclusao pendente.
     */
    public function approve(
        Request $request,
        Household $household,
        TaskCompletion $completion,
        AchievementChecker $checker,
    ): TaskCompletionResource {
        $this->authorize('view', $household);
        $task = $completion->task;
        abort_if($task->household_id !== $household->id, 404);
        abort_if($completion->status !== TaskCompletion::STATUS_PENDING, 422, __('errors.task_already_completed'));

        $approver = $request->user();
        abort_unless($approver->isAdult(), 403);

        DB::transaction(function () use ($completion, $approver, $task) {
            $completion->forceFill([
                'status' => TaskCompletion::STATUS_APPROVED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
            ])->save();

            PointTransaction::where('source_type', PointTransaction::SOURCE_TASK)
                ->where('source_id', $completion->id)
                ->where('status', PointTransaction::STATUS_PENDING)
                ->each(function (PointTransaction $tx) {
                    $tx->status = PointTransaction::STATUS_CONFIRMED;
                    $tx->save();
                });

            $task->forceFill([
                'status' => $task->frequency === 'once' ? Task::STATUS_COMPLETED : $task->status,
                'completed_at' => now(),
            ])->save();
        });

        $checker->checkForUser($completion->completedBy, $household->id);

        return TaskCompletionResource::make($completion->fresh()->load('completedBy'));
    }

    /**
     * Rejeita uma conclusao pendente.
     */
    public function reject(Request $request, Household $household, TaskCompletion $completion): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($completion->task->household_id !== $household->id, 404);
        abort_if($completion->status !== TaskCompletion::STATUS_PENDING, 422);

        abort_unless($request->user()->isAdult(), 403);

        DB::transaction(function () use ($completion, $request) {
            $completion->forceFill([
                'status' => TaskCompletion::STATUS_REJECTED,
                'approved_by_user_id' => $request->user()->id,
                'approved_at' => now(),
            ])->save();

            PointTransaction::where('source_type', PointTransaction::SOURCE_TASK)
                ->where('source_id', $completion->id)
                ->where('status', PointTransaction::STATUS_PENDING)
                ->update([
                    'status' => PointTransaction::STATUS_CANCELLED,
                    'updated_at' => now(),
                ]);
        });

        return response()->json(['ok' => true]);
    }

    /**
     * Lista conclusoes pendentes de aprovacao na casa (apenas adultos veem).
     */
    public function pending(Request $request, Household $household)
    {
        $this->authorize('view', $household);
        abort_unless($request->user()->isAdult(), 403);

        $completions = TaskCompletion::query()
            ->whereHas('task', fn ($q) => $q->where('household_id', $household->id))
            ->where('status', TaskCompletion::STATUS_PENDING)
            ->with(['task.difficulty', 'completedBy'])
            ->latest()
            ->get();

        return TaskCompletionResource::collection($completions);
    }
}
