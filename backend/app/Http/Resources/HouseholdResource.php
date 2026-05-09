<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HouseholdResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'invite_code' => $this->when($request->user()?->isAdult(), $this->invite_code),
            'owner_id' => $this->owner_id,
            'settings' => $this->settings,
            'members_count' => $this->whenCounted('members'),
        ];
    }
}
