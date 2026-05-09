<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShoppingListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'name' => $this->name,
            'status' => $this->status,
            'allow_children' => (bool) $this->allow_children,
            'created_by_user_id' => $this->created_by_user_id,
            'items_count' => $this->whenCounted('items'),
            'open_items_count' => $this->whenCounted('openItems'),
            'items' => ShoppingItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
