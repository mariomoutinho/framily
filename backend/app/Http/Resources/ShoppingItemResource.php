<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShoppingItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shopping_list_id' => $this->shopping_list_id,
            'name' => $this->name,
            'quantity' => $this->quantity,
            'category' => $this->category,
            'status' => $this->status,
            'bought_by_user_id' => $this->bought_by_user_id,
            'bought_at' => $this->bought_at?->toIso8601String(),
        ];
    }
}
