<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rewards\CreateRewardRequest;
use App\Http\Requests\Rewards\UpdateRewardRequest;
use App\Http\Resources\RewardResource;
use App\Models\Household;
use App\Models\Reward;
use App\Models\RewardRedemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RewardController extends Controller
{
    public function index(Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $rewards = $household->rewards()
            ->where('is_active', true)
            ->withCount(['redemptions as pending_redemptions_count' => function ($q) {
                $q->where('status', RewardRedemption::STATUS_PENDING);
            }])
            ->orderBy('points_cost')
            ->get();

        return RewardResource::collection($rewards);
    }

    public function store(CreateRewardRequest $request, Household $household): RewardResource
    {
        $this->authorize('view', $household);

        $reward = $household->rewards()->create([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
            'points_cost' => $request->integer('points_cost'),
            'stock' => $request->input('stock'),
            'requires_approval' => $request->boolean('requires_approval', true),
            'image' => $request->input('image'),
            'is_active' => $request->boolean('is_active', true),
            'created_by_user_id' => $request->user()->id,
        ]);

        return RewardResource::make($reward);
    }

    public function update(UpdateRewardRequest $request, Household $household, Reward $reward): RewardResource
    {
        $this->authorize('view', $household);
        abort_if($reward->household_id !== $household->id, 404);

        $reward->fill($request->only([
            'name', 'description', 'points_cost', 'stock',
            'requires_approval', 'image', 'is_active',
        ]))->save();

        return RewardResource::make($reward->fresh());
    }

    public function destroy(Household $household, Reward $reward): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($reward->household_id !== $household->id, 404);

        $reward->delete();

        return response()->json(['ok' => true]);
    }
}
