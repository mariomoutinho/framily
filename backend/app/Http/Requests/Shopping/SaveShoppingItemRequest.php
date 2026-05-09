<?php

namespace App\Http\Requests\Shopping;

use Illuminate\Foundation\Http\FormRequest;

class SaveShoppingItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:9999'],
            'category' => ['sometimes', 'nullable', 'string', 'max:64'],
        ];
    }
}
