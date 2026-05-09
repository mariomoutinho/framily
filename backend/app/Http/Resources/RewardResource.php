<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RewardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'name' => $this->name,
            'description' => $this->description,
            'points_cost' => $this->points_cost,
            'stock' => $this->stock,
            'requires_approval' => (bool) $this->requires_approval,
            'image' => $this->image,
            'is_active' => (bool) $this->is_active,
            'is_available' => $this->isAvailable(),
            'pending_redemptions_count' => $this->whenCounted('pendingRedemptions'),
        ];
    }
}
