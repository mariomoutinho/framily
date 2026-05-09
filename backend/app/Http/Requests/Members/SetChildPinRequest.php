<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;

class SetChildPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'nickname' => ['required', 'string', 'max:30'],
            'pin' => ['required', 'string', 'min:4', 'max:8'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
