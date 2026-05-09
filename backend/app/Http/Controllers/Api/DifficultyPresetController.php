<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DifficultyPresetResource;
use App\Models\DifficultyPreset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DifficultyPresetController extends Controller
{
    /**
     * Lista presets globais (household_id null) + presets da casa atual quando informada.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $householdId = $request->integer('household_id');

        $presets = DifficultyPreset::query()
            ->where(function ($q) use ($householdId) {
                $q->whereNull('household_id');
                if ($householdId) {
                    $q->orWhere('household_id', $householdId);
                }
            })
            ->orderBy('sort_order')
            ->get();

        return DifficultyPresetResource::collection($presets);
    }
}
