<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PointTransactionResource;
use App\Models\Household;
use App\Models\PointTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PointController extends Controller
{
    /**
     * Totais do usuário autenticado: total, semana, mês + transações recentes.
     * Pode ser filtrado por household_id (recomendado).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $householdId = $request->integer('household_id');

        $query = PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('status', PointTransaction::STATUS_CONFIRMED);

        if ($householdId) {
            $query->where('household_id', $householdId);
        }

        $total = (clone $query)->sum('points');
        $week = (clone $query)->where('created_at', '>=', now()->startOfWeek())->sum('points');
        $month = (clone $query)->where('created_at', '>=', now()->startOfMonth())->sum('points');
        $pending = PointTransaction::where('user_id', $user->id)
            ->where('status', PointTransaction::STATUS_PENDING)
            ->when($householdId, fn ($q) => $q->where('household_id', $householdId))
            ->sum('points');

        $recent = PointTransaction::where('user_id', $user->id)
            ->when($householdId, fn ($q) => $q->where('household_id', $householdId))
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'totals' => [
                'all' => (int) $total,
                'week' => (int) $week,
                'month' => (int) $month,
                'pending' => (int) $pending,
            ],
            'recent' => PointTransactionResource::collection($recent)->resolve(),
        ]);
    }

    /**
     * Ranking da casa (pontos confirmados em escopo).
     */
    public function household(Request $request, Household $household): JsonResponse
    {
        $this->authorize('view', $household);

        $scope = $request->input('scope', 'week'); // week|month|all

        $query = PointTransaction::query()
            ->where('household_id', $household->id)
            ->where('status', PointTransaction::STATUS_CONFIRMED);

        if ($scope === 'week') {
            $query->where('created_at', '>=', now()->startOfWeek());
        } elseif ($scope === 'month') {
            $query->where('created_at', '>=', now()->startOfMonth());
        }

        $rows = $query
            ->selectRaw('user_id, SUM(points) as total_points')
            ->groupBy('user_id')
            ->orderByDesc('total_points')
            ->with('user:id,name,role,avatar_url')
            ->get();

        $entries = $rows->values()->map(fn ($row, $i) => [
            'position' => $i + 1,
            'user_id' => (int) $row->user_id,
            'name' => $row->user->name ?? null,
            'role' => $row->user->role ?? null,
            'avatar_url' => $row->user->avatar_url ?? null,
            'points' => (int) $row->total_points,
        ]);

        return response()->json(['scope' => $scope, 'entries' => $entries]);
    }
}
