<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MissionTemplateResource;
use App\Models\MissionTemplate;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MissionTemplateController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $templates = MissionTemplate::query()
            ->with('difficulty')
            ->orderBy('sort_order')
            ->get();

        return MissionTemplateResource::collection($templates);
    }
}
