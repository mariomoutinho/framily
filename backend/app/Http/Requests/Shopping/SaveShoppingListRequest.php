<?php

namespace App\Http\Requests\Shopping;

use Illuminate\Foundation\Http\FormRequest;

class SaveShoppingListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'allow_children' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:open,archived'],
        ];
    }
}
