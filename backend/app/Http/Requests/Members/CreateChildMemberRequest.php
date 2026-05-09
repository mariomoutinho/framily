<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Cria uma criança dentro da casa atual:
 *  - User com role=child
 *  - opcionalmente e-mail/senha próprios
 *  - opcionalmente apelido + PIN
 *  - vínculo a um adulto responsável (guardian)
 */
class CreateChildMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdult() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['sometimes', 'nullable', 'email', 'max:191', 'unique:users,email'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6', 'confirmed'],
            'nickname' => ['sometimes', 'nullable', 'string', 'max:30'],
            'pin' => ['sometimes', 'nullable', 'string', 'min:4', 'max:8'],
            'guardian_user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $hasEmail = filled($this->input('email')) && filled($this->input('password'));
            $hasPin = filled($this->input('nickname')) && filled($this->input('pin'));

            if (! $hasEmail && ! $hasPin) {
                $validator->errors()->add(
                    'pin',
                    __('errors.requires_adult_approval').' (forneça e-mail/senha OU apelido/PIN para a criança)'
                );
            }
        });
    }
}
