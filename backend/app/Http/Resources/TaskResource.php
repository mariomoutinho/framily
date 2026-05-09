<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'title' => $this->title,
            'description' => $this->description,
            'difficulty' => DifficultyPresetResource::make($this->whenLoaded('difficulty')),
            'priority' => $this->priority,
            'frequency' => $this->frequency,
            'status' => $this->status,
            'due_at' => $this->due_at?->toIso8601String(),
            'requires_approval' => (bool) $this->requires_approval,
            'created_by_user_id' => $this->created_by_user_id,
            'assignees' => UserResource::collection($this->whenLoaded('assignees')),
            'pending_completions_count' => $this->whenCounted('pendingCompletions'),
            'last_completion' => TaskCompletionResource::make(
                $this->whenLoaded('lastCompletion'),
            ),
            'points_for_completion' => $this->pointsForCompletion(),
        ];
    }
}
