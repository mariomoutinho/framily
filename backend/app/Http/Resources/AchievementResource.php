<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AchievementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name_key' => $this->name_key,
            'description_key' => $this->description_key,
            'icon' => $this->icon,
            'criteria' => $this->criteria,
            'child_only' => (bool) $this->child_only,
            'unlocked_at' => $this->whenPivotLoaded('user_achievements', fn () => $this->pivot->unlocked_at),
        ];
    }
}
