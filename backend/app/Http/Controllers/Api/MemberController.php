<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Members\CreateChildMemberRequest;
use App\Http\Resources\HouseholdMemberResource;
use App\Models\ChildCredential;
use App\Models\GuardianChild;
use App\Models\Household;
use App\Models\HouseholdMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    public function index(Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        return HouseholdMemberResource::collection(
            $household->members()->with('user')->orderBy('created_at')->get()
        );
    }

    /**
     * Cria uma criança vinculada à casa, com login próprio (e-mail/senha
     * e/ou apelido/PIN) e guardião responsável.
     */
    public function storeChild(CreateChildMemberRequest $request, Household $household): JsonResponse
    {
        $this->authorize('manageMembers', $household);

        $guardianId = (int) $request->input('guardian_user_id');
        if (! $household->users()->whereKey($guardianId)->exists()) {
            throw ValidationException::withMessages([
                'guardian_user_id' => __('errors.forbidden'),
            ]);
        }

        $nickname = $request->input('nickname');
        if ($nickname && $household->childCredentials()->where('nickname', $nickname)->exists()) {
            throw ValidationException::withMessages([
                'nickname' => __('validation.unique', ['attribute' => __('validation.attributes.nickname')]),
            ]);
        }

        return DB::transaction(function () use ($request, $household, $guardianId, $nickname) {
            $email = $request->input('email');
            $password = $request->input('password');

            $child = User::create([
                'name' => $request->string('name'),
                // E-mail é único; quando criança usa só PIN, geramos placeholder único.
                'email' => $email ?: 'child+'.Str::random(10).'@framily.local',
                'password' => $password ?: Str::random(40),
                'role' => User::ROLE_CHILD,
                'locale' => $request->input('locale', 'pt_BR'),
            ]);

            $member = $household->members()->create([
                'user_id' => $child->id,
                'role' => User::ROLE_CHILD,
                'joined_at' => now(),
            ]);

            if ($nickname && $request->filled('pin')) {
                $cred = new ChildCredential([
                    'user_id' => $child->id,
                    'household_id' => $household->id,
                    'nickname' => $nickname,
                    'is_active' => true,
                ]);
                $cred->setPin((string) $request->string('pin'));
                $cred->save();
            }

            GuardianChild::firstOrCreate([
                'guardian_user_id' => $guardianId,
                'child_user_id' => $child->id,
            ], [
                'household_id' => $household->id,
            ]);

            return HouseholdMemberResource::make($member->load('user'))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function destroy(Household $household, HouseholdMember $member): JsonResponse
    {
        $this->authorize('manageMembers', $household);
        abort_if($member->household_id !== $household->id, 404);
        abort_if($member->role === User::ROLE_OWNER, 403, __('errors.forbidden'));

        $member->delete();

        return response()->json(['ok' => true]);
    }
}
