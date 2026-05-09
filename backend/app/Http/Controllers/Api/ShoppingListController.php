<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shopping\SaveShoppingItemRequest;
use App\Http\Requests\Shopping\SaveShoppingListRequest;
use App\Http\Resources\ShoppingItemResource;
use App\Http\Resources\ShoppingListResource;
use App\Models\Household;
use App\Models\ShoppingItem;
use App\Models\ShoppingList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShoppingListController extends Controller
{
    public function index(Request $request, Household $household): AnonymousResourceCollection
    {
        $this->authorize('view', $household);

        $query = $household->shoppingLists()
            ->withCount(['items as items_count'])
            ->withCount(['items as open_items_count' => function ($q) {
                $q->where('status', ShoppingItem::STATUS_OPEN);
            }]);

        // Crianças veem apenas listas marcadas como allow_children.
        if ($request->user()->isChild()) {
            $query->where('allow_children', true);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return ShoppingListResource::collection($query->latest()->get());
    }

    public function store(SaveShoppingListRequest $request, Household $household): ShoppingListResource
    {
        $this->authorize('view', $household);

        $list = $household->shoppingLists()->create([
            'name' => $request->string('name'),
            'allow_children' => $request->boolean('allow_children', false),
            'status' => $request->input('status', ShoppingList::STATUS_OPEN),
            'created_by_user_id' => $request->user()->id,
        ]);

        return ShoppingListResource::make($list);
    }

    public function show(Household $household, ShoppingList $list): ShoppingListResource
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);
        abort_if(request()->user()->isChild() && ! $list->allow_children, 403);

        return ShoppingListResource::make($list->load('items'));
    }

    public function update(SaveShoppingListRequest $request, Household $household, ShoppingList $list): ShoppingListResource
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);

        $list->fill($request->only(['name', 'allow_children', 'status']))->save();

        return ShoppingListResource::make($list->fresh());
    }

    public function destroy(Household $household, ShoppingList $list): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);

        $list->delete();

        return response()->json(['ok' => true]);
    }

    // ----------------------------------------------------------------------
    // Itens
    // ----------------------------------------------------------------------

    public function addItem(SaveShoppingItemRequest $request, Household $household, ShoppingList $list): ShoppingItemResource
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);

        // Crianças só podem adicionar se a lista permite
        if ($request->user()->isChild() && ! $list->allow_children) {
            abort(403, __('errors.forbidden'));
        }

        $item = $list->items()->create([
            'name' => $request->string('name'),
            'quantity' => $request->integer('quantity', 1),
            'category' => $request->input('category'),
            'status' => ShoppingItem::STATUS_OPEN,
        ]);

        return ShoppingItemResource::make($item);
    }

    public function toggleItem(Request $request, Household $household, ShoppingList $list, ShoppingItem $item): ShoppingItemResource
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);
        abort_if($item->shopping_list_id !== $list->id, 404);

        if ($request->user()->isChild() && ! $list->allow_children) {
            abort(403, __('errors.forbidden'));
        }

        $bought = $item->status !== ShoppingItem::STATUS_BOUGHT;
        $item->forceFill([
            'status' => $bought ? ShoppingItem::STATUS_BOUGHT : ShoppingItem::STATUS_OPEN,
            'bought_by_user_id' => $bought ? $request->user()->id : null,
            'bought_at' => $bought ? now() : null,
        ])->save();

        return ShoppingItemResource::make($item);
    }

    public function removeItem(Household $household, ShoppingList $list, ShoppingItem $item): JsonResponse
    {
        $this->authorize('view', $household);
        abort_if($list->household_id !== $household->id, 404);
        abort_if($item->shopping_list_id !== $list->id, 404);

        $item->delete();

        return response()->json(['ok' => true]);
    }
}
