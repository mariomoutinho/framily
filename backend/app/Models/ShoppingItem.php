<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingItem extends Model
{
    use HasFactory;

    public const STATUS_OPEN = 'open';
    public const STATUS_BOUGHT = 'bought';

    protected $fillable = [
        'shopping_list_id',
        'name',
        'quantity',
        'category',
        'status',
        'bought_by_user_id',
        'bought_at',
    ];

    protected $casts = [
        'bought_at' => 'datetime',
    ];

    public function list(): BelongsTo
    {
        return $this->belongsTo(ShoppingList::class, 'shopping_list_id');
    }

    public function boughtBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bought_by_user_id');
    }
}
