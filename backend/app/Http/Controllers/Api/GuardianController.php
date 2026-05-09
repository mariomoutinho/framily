<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuardianChild;
use App\Models\Household;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function attach(Request $request, Household $household, User $child): JsonResponse
    {
        $this->authorize('manageMembers', $household);

        $request->validate([
            'guardian_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $guardianId = (int) $request->input('guardian_user_id');
        abort_unless($household->users()->whereKey($guardianId)->exists(), 422);
        abort_unless($child->isChild() && $household->users()->whereKey($child->id)->exists(), 404);

        GuardianChild::firstOrCreate([
            'guardian_user_id' => $guardianId,
            'child_user_id' => $child->id,
        ], [
            'household_id' => $household->id,
        ]);

        return response()->json(['ok' => true]);
    }

    public function detach(Household $household, User $child, User $guardian): JsonResponse
    {
        $this->authorize('manageMembers', $household);

        GuardianChild::where('household_id', $household->id)
            ->where('guardian_user_id', $guardian->id)
            ->where('child_user_id', $child->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
