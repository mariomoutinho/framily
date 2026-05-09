<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HouseholdInviteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'code' => $this->code,
            'email' => $this->email,
            'role' => $this->role,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'used_at' => $this->used_at?->toIso8601String(),
            'created_by_user_id' => $this->created_by_user_id,
            'is_usable' => $this->isUsable(),
        ];
    }
}
