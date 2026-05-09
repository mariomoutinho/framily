<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tasks\CreateTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Household;
use App\Models\Task;
use App\Models\TaskCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = $household->tasks()
            ->with(['difficulty', 'assignees'])
            ->withCount(['completions as pending_completions_count' => function ($q) {
                $q->where('status', TaskCompletion::STATUS_PENDING);
            }]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('assignee_user_id')) {
            $query->whereHas(
                'assignees',
                fn ($q) => $q->where('users.id', $request->integer('assignee_user_id'))
            );
        }

        // Crianças só veem suas tarefas atribuídas.
        $user = $request->user();
        if ($user->isChild()) {
            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $user->id));
        }

        return TaskResource::collection(
            $query->orderByRaw('CASE status WHEN \'open\' THEN 0 WHEN \'in_progress\' THEN 1 ELSE 2 END')
                ->orderBy('due_at')
                ->paginate($request->integer('per_page', 50))
        );
    }

    public function store(CreateTaskRequest $request, Household $household): TaskResource
    {
        $this->authorize('view', $household);

        $task = DB::transaction(function () use ($request, $household) {
            $task = $household->tasks()->create([
                'title' => $request->string('title'),
                'description' => $request->input('description'),
                'difficulty_preset_id' => $request->integer('difficulty_preset_id'),
                'priority' => $request->input('priority', 'normal'),
                'frequency' => $request->input('frequency', 'once'),
                'status' => Task::STATUS_OPEN,
                'due_at' => $request->input('due_at'),
                'requires_approval' => $request->boolean('requires_approval', true),
                'created_by_user_id' => $request->user()->id,
            ]);

            $assignees = $request->input('assignee_user_ids', []);
            if (! empty($assignees)) {
                $task->assignees()->sync(
                    $this->memberOnly($household, $assignees)
                );
            }

            return $task;
        });

        return TaskResource::make($task->load(['difficulty', 'assignees']));
    }

    public function show(Household $household, Task $task): TaskResource
    {
        $this->authorize('view', $household);
        abort_if($task->household_id !== $household->id, 404);

        $task->load(['difficulty', 'assignees', 'completions.completedBy']);

        return TaskResource::make($task);
    }

    public function update(UpdateTaskRequest $request, Household $household, Task $task): TaskResource
    {
        $this->authorize('view', $household);
        abort_if($task->household_id !== $household->id, 404);

        DB::transaction(function () use ($request, $household, $task) {
            $task->fill($request->only([
                'title', 'description', 'difficulty_preset_id',
                'priority', 'frequency', 'status', 'due_at', 'requires_approval',
            ]))->save();

            if ($request->has('assignee_user_ids')) {
                $task->assignees()->sync(
                    $this->memberOnly($household, $request->input('assignee_user_ids', []))
                );
            }
        });

        return TaskResource::make($task->load(['difficulty', 'assignees']));
    }

    public function destroy(Household $household, Task $task): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($task->household_id !== $household->id, 404);

        $task->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Filtra ids garantindo que sejam membros da casa.
     */
    private function memberOnly(Household $household, array $userIds): array
    {
        if (empty($userIds)) {
            return [];
        }

        return $household->users()
            ->whereIn('users.id', $userIds)
            ->pluck('users.id')
            ->all();
    }
}
