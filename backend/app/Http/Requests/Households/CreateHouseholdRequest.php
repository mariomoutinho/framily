<?php

namespace App\Http\Requests\Households;

use Illuminate\Foundation\Http\FormRequest;

class CreateHouseholdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}
