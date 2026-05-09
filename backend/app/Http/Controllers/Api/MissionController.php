<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Missions\CreateMissionRequest;
use App\Http\Resources\MissionResource;
use App\Models\Household;
use App\Models\Mission;
use App\Models\MissionTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class MissionController extends Controller
{
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = $household->missions()
            ->with(['difficulty', 'participants', 'progress'])
            ->whereNull('deleted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $user = $request->user();
        if ($user->isChild()) {
            // Crianças veem missões coletivas + suas missões individuais.
            $query->where(function ($q) use ($user) {
                $q->where('is_collective', true)
                    ->orWhereHas('participants', fn ($p) => $p->where('users.id', $user->id));
            });
        }

        return MissionResource::collection(
            $query->latest()->paginate($request->integer('per_page', 50))
        );
    }

    public function store(CreateMissionRequest $request, Household $household): MissionResource
    {
        $this->authorize('view', $household);

        $template = $request->filled('template_id')
            ? MissionTemplate::with('difficulty')->findOrFail($request->integer('template_id'))
            : null;

        $mission = DB::transaction(function () use ($request, $household, $template) {
            $missionData = [
                'household_id' => $household->id,
                'template_id' => $template?->id,
                'created_by_user_id' => $request->user()->id,
                'name' => $request->input('name', $template?->key),
                'description' => $request->input('description'),
                'mission_type' => $request->input('mission_type', $template?->mission_type),
                'difficulty_preset_id' => $request->input(
                    'difficulty_preset_id',
                    $template?->difficulty_preset_id
                ),
                'points_override' => $request->input('points_override'),
                'frequency' => $request->input('frequency', $template?->default_frequency),
                'start_at' => $request->input('start_at'),
                'end_at' => $request->input('end_at'),
                'target_value' => $request->input('target_value', $template?->default_target),
                'requires_approval' => $request->boolean('requires_approval', true),
                'is_collective' => $request->boolean('is_collective', $template?->is_collective ?? false),
                'status' => Mission::STATUS_ACTIVE,
            ];

            $mission = Mission::create($missionData);

            $participants = $request->input('participant_user_ids', []);
            if (! empty($participants)) {
                $mission->participants()->sync(
                    $household->users()->whereIn('users.id', $participants)->pluck('users.id')->all()
                );
            }

            return $mission;
        });

        return MissionResource::make($mission->load(['difficulty', 'participants', 'progress']));
    }

    public function show(Household $household, Mission $mission): MissionResource
    {
        $this->authorize('view', $household);
        abort_if($mission->household_id !== $household->id, 404);

        return MissionResource::make(
            $mission->load(['difficulty', 'participants', 'progress', 'completions.completedBy'])
        );
    }

    public function update(Request $request, Household $household, Mission $mission): MissionResource
    {
        $this->authorize('view', $household);
        abort_if($mission->household_id !== $household->id, 404);

        $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:active,completed,cancelled'],
            'target_value' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:9999'],
            'points_override' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:9999'],
            'requires_approval' => ['sometimes', 'boolean'],
        ]);

        $mission->fill($request->only([
            'name', 'description', 'status', 'target_value', 'points_override', 'requires_approval',
        ]))->save();

        return MissionResource::make($mission->fresh()->load(['difficulty', 'participants', 'progress']));
    }

    public function destroy(Household $household, Mission $mission): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($mission->household_id !== $household->id, 404);

        $mission->delete();

        return response()->json(['ok' => true]);
    }
}
