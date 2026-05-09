<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bills\SaveBillRequest;
use App\Http\Resources\BillResource;
use App\Models\Bill;
use App\Models\BillSplit;
use App\Models\Household;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = $household->bills()->with(['splits.user']);
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return BillResource::collection($query->orderByRaw('due_date IS NULL, due_date')->get());
    }

    public function store(SaveBillRequest $request, Household $household): BillResource
    {
        $this->authorize('view', $household);

        $splitIds = $request->input('split_user_ids', []);
        // Restringe split a adultos da casa.
        if (! empty($splitIds)) {
            $splitIds = $household->users()
                ->whereIn('users.id', $splitIds)
                ->where('users.role', '!=', 'child')
                ->pluck('users.id')
                ->all();
        }

        $bill = DB::transaction(function () use ($request, $household, $splitIds) {
            $bill = $household->bills()->create([
                'title' => $request->string('title'),
                'description' => $request->input('description'),
                'amount' => $request->float('amount'),
                'due_date' => $request->input('due_date'),
                'category' => $request->input('category'),
                'created_by_user_id' => $request->user()->id,
            ]);

            if (! empty($splitIds)) {
                $share = round($bill->amount / count($splitIds), 2);
                foreach ($splitIds as $userId) {
                    $bill->splits()->create([
                        'user_id' => $userId,
                        'share_amount' => $share,
                    ]);
                }
            }

            return $bill;
        });

        return BillResource::make($bill->load('splits.user'));
    }

    public function update(SaveBillRequest $request, Household $household, Bill $bill): BillResource
    {
        $this->authorize('view', $household);
        abort_if($bill->household_id !== $household->id, 404);

        $bill->fill($request->only(['title', 'description', 'amount', 'due_date', 'category']))->save();

        return BillResource::make($bill->fresh()->load('splits.user'));
    }

    public function destroy(Household $household, Bill $bill): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($bill->household_id !== $household->id, 404);

        $bill->delete();

        return response()->json(['ok' => true]);
    }

    /** Marca a conta inteira como paga. */
    public function markPaid(Household $household, Bill $bill): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($bill->household_id !== $household->id, 404);

        DB::transaction(function () use ($bill) {
            $bill->forceFill(['status' => Bill::STATUS_PAID, 'paid_at' => now()])->save();
            $bill->splits()->update([
                'status' => BillSplit::STATUS_PAID,
                'paid_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['ok' => true]);
    }

    /** Marca apenas o split do usuário como pago. */
    public function markSplitPaid(Household $household, Bill $bill, BillSplit $split): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($bill->household_id !== $household->id, 404);
        abort_if($split->bill_id !== $bill->id, 404);

        $split->forceFill(['status' => BillSplit::STATUS_PAID, 'paid_at' => now()])->save();

        // Se todos os splits estão pagos, marca a conta também.
        $allPaid = $bill->splits()->where('status', '!=', BillSplit::STATUS_PAID)->count() === 0;
        if ($allPaid && $bill->splits()->count() > 0) {
            $bill->forceFill(['status' => Bill::STATUS_PAID, 'paid_at' => now()])->save();
        }

        return response()->json(['ok' => true]);
    }
}
