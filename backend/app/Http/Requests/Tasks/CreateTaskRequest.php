<?php

namespace App\Http\Requests\Tasks;

use Illuminate\Foundation\Http\FormRequest;

class CreateTaskRequest extends FormRequest
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
            'difficulty_preset_id' => ['required', 'integer', 'exists:difficulty_presets,id'],
            'priority' => ['sometimes', 'in:low,normal,high'],
            'frequency' => ['sometimes', 'in:once,daily,weekly,monthly,weekdays,specific_dates'],
            'frequency_days' => ['sometimes', 'array'],
            'frequency_days.*' => ['integer', 'between:0,6'],
            'frequency_dates' => ['sometimes', 'array'],
            'frequency_dates.*' => ['date_format:Y-m-d'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'requires_approval' => ['sometimes', 'boolean'],
            'assignee_user_ids' => ['sometimes', 'array'],
            'assignee_user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
