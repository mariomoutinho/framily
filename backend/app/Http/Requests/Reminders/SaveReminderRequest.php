<?php

namespace App\Http\Requests\Reminders;

use Illuminate\Foundation\Http\FormRequest;

class SaveReminderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'body' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'remind_at' => ['required', 'date'],
            'related_type' => ['sometimes', 'nullable', 'string', 'in:task,mission,bill,shopping_list,custom'],
            'related_id' => ['sometimes', 'nullable', 'integer'],
        ];
    }
}
