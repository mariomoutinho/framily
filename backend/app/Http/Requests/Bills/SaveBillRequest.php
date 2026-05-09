<?php

namespace App\Http\Requests\Bills;

use Illuminate\Foundation\Http\FormRequest;

class SaveBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999.99'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'category' => ['sometimes', 'nullable', 'string', 'max:64'],
            'split_user_ids' => ['sometimes', 'array'],
            'split_user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
