<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DifficultyPresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name_key' => $this->name_key,
            'base_points' => $this->base_points,
            'color' => $this->color,
            'household_id' => $this->household_id,
            'sort_order' => $this->sort_order,
        ];
    }
}
