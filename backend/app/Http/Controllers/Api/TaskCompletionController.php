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
     * Marca a tarefa como concluída.
     *  - Adulto: aprova direto (status=approved, points_awarded calculado, PointTransaction confirmed)
     *  - Criança em tarefa com requires_approval=true: cria pending; PointTransaction pending
     */
    public function complete(Request $request, Household $household, Task $task): TaskCompletionResource
    {
        $this->authorize('view', $household);
        abort_if($task->household_id !== $household->id, 404);

        $user = $request->user();

        // Apenas o atribuído (ou o adulto criando o registro) pode concluir.
        $isAssignee = $task->assignees()->where('users.id', $user->id)->exists();
        if ($user->isChild() && ! $isAssignee) {
            abort(403, __('errors.forbidden'));
        }

        $points = $task->pointsForCompletion();
        $needsApproval = $user->isChild() && $task->requires_approval;
        $status = $needsApproval ? TaskCompletion::STATUS_PENDING : TaskCompletion::STATUS_APPROVED;

        $completion = DB::transaction(function () use ($task, $user, $points, $status, $household, $needsApproval, $request) {
            $completion = $task->completions()->create([
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
                'meta' => ['task_id' => $task->id, 'task_title' => $task->title],
            ]);

            // Atualiza o status da Task quando concluída por adulto e for tarefa única
            if (! $needsApproval && $task->frequency === 'once') {
                $task->forceFill(['status' => Task::STATUS_COMPLETED])->save();
            }

            return $completion;
        });

        return TaskCompletionResource::make($completion->load('completedBy'));
    }

    /**
     * Aprova uma conclusão pendente.
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

            // Atualiza individualmente para que o Observer dispare AchievementChecker.
            PointTransaction::where('source_type', PointTransaction::SOURCE_TASK)
                ->where('source_id', $completion->id)
                ->where('status', PointTransaction::STATUS_PENDING)
                ->each(function (PointTransaction $tx) {
                    $tx->status = PointTransaction::STATUS_CONFIRMED;
                    $tx->save();
                });

            if ($task->frequency === 'once') {
                $task->forceFill(['status' => Task::STATUS_COMPLETED])->save();
            }
        });

        // Garantia adicional: rechecagem direta para o concluinte (defensive).
        $checker->checkForUser($completion->completedBy, $household->id);

        return TaskCompletionResource::make($completion->fresh()->load('completedBy'));
    }

    /**
     * Rejeita uma conclusão pendente.
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
     * Lista conclusões pendentes de aprovação na casa (apenas adultos veem).
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
