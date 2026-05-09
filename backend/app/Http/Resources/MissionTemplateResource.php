<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MissionTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name_key' => $this->name_key,
            'description_key' => $this->description_key,
            'mission_type' => $this->mission_type,
            'difficulty' => DifficultyPresetResource::make($this->whenLoaded('difficulty')),
            'default_target' => $this->default_target,
            'default_frequency' => $this->default_frequency,
            'is_collective' => (bool) $this->is_collective,
            'child_friendly' => (bool) $this->child_friendly,
        ];
    }
}
