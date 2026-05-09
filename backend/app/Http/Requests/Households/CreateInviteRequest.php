<?php

namespace App\Http\Requests\Households;

use Illuminate\Foundation\Http\FormRequest;

class CreateInviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'role' => ['sometimes', 'string', 'in:admin,adult,child'],
            'email' => ['sometimes', 'nullable', 'email'],
            'expires_in_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ];
    }
}
