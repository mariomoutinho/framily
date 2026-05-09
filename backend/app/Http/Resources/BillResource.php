<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'title' => $this->title,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'category' => $this->category,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'splits' => BillSplitResource::collection($this->whenLoaded('splits')),
        ];
    }
}
