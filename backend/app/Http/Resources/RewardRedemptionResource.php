<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RewardRedemptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reward_id' => $this->reward_id,
            'household_id' => $this->household_id,
            'requested_by_user_id' => $this->requested_by_user_id,
            'status' => $this->status,
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'points_spent' => $this->points_spent,
            'note' => $this->note,
            'created_at' => $this->created_at?->toIso8601String(),
            'reward' => RewardResource::make($this->whenLoaded('reward')),
            'requested_by' => UserResource::make($this->whenLoaded('requestedBy')),
        ];
    }
}
