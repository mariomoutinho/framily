<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReminderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'title' => $this->title,
            'body' => $this->body,
            'remind_at' => $this->remind_at?->toIso8601String(),
            'related_type' => $this->related_type,
            'related_id' => $this->related_id,
            'status' => $this->status,
            'created_by_user_id' => $this->created_by_user_id,
        ];
    }
}
