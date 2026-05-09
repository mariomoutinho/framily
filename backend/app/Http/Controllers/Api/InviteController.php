<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Households\CreateInviteRequest;
use App\Http\Resources\HouseholdInviteResource;
use App\Models\Household;
use App\Models\HouseholdInvite;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InviteController extends Controller
{
    public function index(Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        return HouseholdInviteResource::collection(
            $household->invites()->latest()->get()
        );
    }

    public function store(CreateInviteRequest $request, Household $household): HouseholdInviteResource
    {
        $this->authorize('manageMembers', $household);

        $invite = $household->invites()->create([
            'code' => HouseholdInvite::makeCode(),
            'role' => $request->input('role', 'adult'),
            'email' => $request->input('email'),
            'created_by_user_id' => $request->user()->id,
            'expires_at' => $request->filled('expires_in_days')
                ? now()->addDays((int) $request->input('expires_in_days'))
                : now()->addDays(30),
        ]);

        return HouseholdInviteResource::make($invite);
    }

    public function destroy(Household $household, HouseholdInvite $invite): \Illuminate\Http\JsonResponse
    {
        $this->authorize('manageMembers', $household);
        abort_if($invite->household_id !== $household->id, 404);

        $invite->delete();

        return response()->json(['ok' => true]);
    }
}
