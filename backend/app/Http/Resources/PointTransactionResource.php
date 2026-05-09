<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PointTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'household_id' => $this->household_id,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'points' => $this->points,
            'status' => $this->status,
            'reason_key' => $this->reason_key,
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
