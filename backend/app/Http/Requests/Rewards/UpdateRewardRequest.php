<?php

namespace App\Http\Requests\Rewards;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'points_cost' => ['sometimes', 'integer', 'min:1', 'max:99999'],
            'stock' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:9999'],
            'requires_approval' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
