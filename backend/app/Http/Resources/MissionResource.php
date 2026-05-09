<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $progress = $this->whenLoaded('progress');
        $currentValue = is_iterable($progress) ? collect($progress)->sum('current_value') : null;

        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'template_id' => $this->template_id,
            'name' => $this->name,
            'description' => $this->description,
            'mission_type' => $this->mission_type,
            'difficulty' => DifficultyPresetResource::make($this->whenLoaded('difficulty')),
            'points_for_completion' => $this->pointsForCompletion(),
            'frequency' => $this->frequency,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'target_value' => $this->target_value,
            'current_value' => $currentValue,
            'requires_approval' => (bool) $this->requires_approval,
            'is_collective' => (bool) $this->is_collective,
            'status' => $this->status,
            'reward_id' => $this->reward_id,
            'participants' => UserResource::collection($this->whenLoaded('participants')),
        ];
    }
}
