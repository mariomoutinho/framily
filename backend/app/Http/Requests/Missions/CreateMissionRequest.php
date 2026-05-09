<?php

namespace App\Http\Requests\Missions;

use Illuminate\Foundation\Http\FormRequest;

class CreateMissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['sometimes', 'nullable', 'integer', 'exists:mission_templates,id'],
            'name' => ['required_without:template_id', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'mission_type' => [
                'required_without:template_id',
                'in:single_task,recurring_task,streak,count,collective,custom',
            ],
            'difficulty_preset_id' => ['required_without:template_id', 'integer', 'exists:difficulty_presets,id'],
            'points_override' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:9999'],
            'frequency' => ['sometimes', 'nullable', 'string', 'max:16'],
            'start_at' => ['sometimes', 'nullable', 'date'],
            'end_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_at'],
            'target_value' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:9999'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_collective' => ['sometimes', 'boolean'],
            'participant_user_ids' => ['sometimes', 'array'],
            'participant_user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
