<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Household;
use App\Models\Mission;
use App\Models\Reminder;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Agrega tarefas, missões, lembretes e contas em uma timeline única.
     *
     * Query params:
     *   from, to (ISO 8601). Default: hoje – +30 dias.
     *   types[]: task, mission, reminder, bill (default: todos exceto bill se criança)
     */
    public function index(Request $request, Household $household): JsonResponse
    {
        $this->authorize('view', $household);

        $user = $request->user();
        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : now()->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->input('to')) : now()->addDays(30)->endOfDay();

        $allowedTypes = $user->isChild()
            ? ['task', 'mission', 'reminder']    // crianças não veem bills
            : ['task', 'mission', 'reminder', 'bill'];

        $requestedTypes = $request->input('types', $allowedTypes);
        $types = array_values(array_intersect($allowedTypes, (array) $requestedTypes));

        $events = collect();

        if (in_array('task', $types, true)) {
            $tasksQuery = $household->tasks()
                ->whereBetween('due_at', [$from, $to])
                ->with('difficulty');

            if ($user->isChild()) {
                $tasksQuery->whereHas('assignees', fn ($q) => $q->where('users.id', $user->id));
            }

            foreach ($tasksQuery->get() as $task) {
                $events->push([
                    'type' => 'task',
                    'id' => $task->id,
                    'title' => $task->title,
                    'date' => $task->due_at?->toIso8601String(),
                    'status' => $task->status,
                    'meta' => [
                        'difficulty' => $task->difficulty?->key,
                        'points' => $task->pointsForCompletion(),
                    ],
                ]);
            }
        }

        if (in_array('mission', $types, true)) {
            $missionsQuery = $household->missions()
                ->where(function ($q) use ($from, $to) {
                    $q->whereBetween('end_at', [$from, $to])
                        ->orWhereBetween('start_at', [$from, $to]);
                })
                ->with('difficulty');

            if ($user->isChild()) {
                $missionsQuery->where(function ($q) use ($user) {
                    $q->where('is_collective', true)
                        ->orWhereHas('participants', fn ($p) => $p->where('users.id', $user->id));
                });
            }

            foreach ($missionsQuery->get() as $mission) {
                $events->push([
                    'type' => 'mission',
                    'id' => $mission->id,
                    'title' => $mission->name,
                    'date' => ($mission->end_at ?? $mission->start_at)?->toIso8601String(),
                    'status' => $mission->status,
                    'meta' => [
                        'mission_type' => $mission->mission_type,
                        'difficulty' => $mission->difficulty?->key,
                    ],
                ]);
            }
        }

        if (in_array('reminder', $types, true)) {
            $reminders = $household->reminders()
                ->where('status', '!=', Reminder::STATUS_CANCELLED)
                ->whereBetween('remind_at', [$from, $to])
                ->get();

            foreach ($reminders as $r) {
                $events->push([
                    'type' => 'reminder',
                    'id' => $r->id,
                    'title' => $r->title,
                    'date' => $r->remind_at?->toIso8601String(),
                    'status' => $r->status,
                    'meta' => ['related_type' => $r->related_type, 'related_id' => $r->related_id],
                ]);
            }
        }

        if (in_array('bill', $types, true)) {
            $bills = $household->bills()
                ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
                ->get();

            foreach ($bills as $b) {
                $events->push([
                    'type' => 'bill',
                    'id' => $b->id,
                    'title' => $b->title,
                    'date' => $b->due_date?->toIso8601String(),
                    'status' => $b->status,
                    'meta' => ['amount' => (float) $b->amount, 'category' => $b->category],
                ]);
            }
        }

        $events = $events
            ->filter(fn ($e) => $e['date'] !== null)
            ->sortBy('date')
            ->values();

        return response()->json([
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
            'types' => $types,
            'events' => $events->all(),
        ]);
    }
}
