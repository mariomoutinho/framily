<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Households\CreateHouseholdRequest;
use App\Http\Requests\Households\JoinHouseholdRequest;
use App\Http\Resources\HouseholdResource;
use App\Models\Household;
use App\Models\HouseholdInvite;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class HouseholdController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $households = $request->user()->households()
            ->withCount('members')
            ->orderBy('households.created_at')
            ->get();

        return HouseholdResource::collection($households);
    }

    public function store(CreateHouseholdRequest $request): JsonResponse
    {
        $user = $request->user();

        $household = DB::transaction(function () use ($request, $user) {
            $h = Household::create([
                'name' => $request->string('name'),
                'owner_id' => $user->id,
            ]);

            $h->members()->create([
                'user_id' => $user->id,
                'role' => User::ROLE_OWNER,
                'joined_at' => now(),
            ]);

            // Garante que o criador tem role owner se ainda for adult
            if ($user->role === User::ROLE_ADULT) {
                $user->forceFill(['role' => User::ROLE_OWNER])->save();
            }

            return $h;
        });

        return HouseholdResource::make($household)->response()->setStatusCode(201);
    }

    public function show(Request $request, Household $household): HouseholdResource
    {
        $this->authorize('view', $household);

        $household->loadCount('members');

        return HouseholdResource::make($household);
    }

    public function join(JoinHouseholdRequest $request): JsonResponse
    {
        $code = strtoupper((string) $request->string('code'));

        $invite = HouseholdInvite::where('code', $code)->first();

        if (! $invite || ! $invite->isUsable()) {
            // Suporta também o invite_code "estável" da casa (quick-join sem convite explícito).
            $household = Household::where('invite_code', $code)->first();
            if (! $household) {
                return response()->json([
                    'error' => ['code' => 'invite_invalid', 'message_key' => 'errors.invite_invalid'],
                ], 404);
            }
            $role = User::ROLE_ADULT;
        } else {
            $household = $invite->household;
            $role = $invite->role;
        }

        $user = $request->user();

        if ($user->isMemberOf($household)) {
            return HouseholdResource::make($household)->response();
        }

        DB::transaction(function () use ($household, $user, $role, $invite) {
            $household->members()->create([
                'user_id' => $user->id,
                'role' => $role,
                'joined_at' => now(),
            ]);

            if ($invite) {
                $invite->forceFill([
                    'used_at' => now(),
                    'used_by_user_id' => $user->id,
                ])->save();
            }
        });

        return HouseholdResource::make($household)->response()->setStatusCode(201);
    }
}
