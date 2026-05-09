<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskCompletionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'completed_by_user_id' => $this->completed_by_user_id,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'status' => $this->status,
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'points_awarded' => $this->points_awarded,
            'note' => $this->note,
            'completed_by' => UserResource::make($this->whenLoaded('completedBy')),
        ];
    }
}
