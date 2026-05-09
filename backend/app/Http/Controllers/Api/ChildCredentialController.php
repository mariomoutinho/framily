<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Members\SetChildPinRequest;
use App\Models\ChildCredential;
use App\Models\Household;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ChildCredentialController extends Controller
{
    /**
     * Cria ou atualiza apelido + PIN de uma criança da casa.
     */
    public function upsert(SetChildPinRequest $request, Household $household, User $child): JsonResponse
    {
        $this->authorize('manageMembers', $household);

        abort_unless($child->isChild() && $household->users()->whereKey($child->id)->exists(), 404);

        $nickname = (string) $request->string('nickname');

        $exists = $household->childCredentials()
            ->where('nickname', $nickname)
            ->where('user_id', '!=', $child->id)
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'nickname' => __('validation.unique', ['attribute' => __('validation.attributes.nickname')]),
            ]);
        }

        $cred = ChildCredential::firstOrNew([
            'user_id' => $child->id,
            'household_id' => $household->id,
        ]);
        $cred->nickname = $nickname;
        $cred->is_active = $request->boolean('is_active', true);
        $cred->setPin((string) $request->string('pin'));
        $cred->save();

        return response()->json([
            'ok' => true,
            'nickname' => $cred->nickname,
            'is_active' => $cred->is_active,
        ]);
    }

    public function disable(Household $household, User $child): JsonResponse
    {
        $this->authorize('manageMembers', $household);
        abort_unless($child->isChild(), 404);

        $cred = ChildCredential::where('household_id', $household->id)
            ->where('user_id', $child->id)
            ->first();

        if ($cred) {
            $cred->forceFill(['is_active' => false])->save();
        }

        return response()->json(['ok' => true]);
    }
}
