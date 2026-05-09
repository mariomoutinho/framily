<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reminders\SaveReminderRequest;
use App\Http\Resources\ReminderResource;
use App\Models\Household;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReminderController extends Controller
{
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = $household->reminders()
            ->where('status', '!=', Reminder::STATUS_CANCELLED)
            ->orderBy('remind_at');

        if ($request->filled('from')) {
            $query->where('remind_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->where('remind_at', '<=', $request->date('to'));
        }

        return ReminderResource::collection($query->limit(200)->get());
    }

    public function store(SaveReminderRequest $request, Household $household): ReminderResource
    {
        $this->authorize('view', $household);

        $reminder = $household->reminders()->create([
            'title' => $request->string('title'),
            'body' => $request->input('body'),
            'remind_at' => $request->date('remind_at'),
            'related_type' => $request->input('related_type'),
            'related_id' => $request->input('related_id'),
            'created_by_user_id' => $request->user()->id,
        ]);

        return ReminderResource::make($reminder);
    }

    public function update(SaveReminderRequest $request, Household $household, Reminder $reminder): ReminderResource
    {
        $this->authorize('view', $household);
        abort_if($reminder->household_id !== $household->id, 404);

        $reminder->fill($request->only(['title', 'body', 'remind_at', 'related_type', 'related_id']))->save();

        return ReminderResource::make($reminder->fresh());
    }

    public function destroy(Household $household, Reminder $reminder): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($reminder->household_id !== $household->id, 404);

        $reminder->delete();

        return response()->json(['ok' => true]);
    }
}
