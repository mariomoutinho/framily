<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_list_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->string('category', 64)->nullable();
            $table->enum('status', ['open', 'bought'])->default('open');
            $table->foreignId('bought_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('bought_at')->nullable();
            $table->timestamps();

            $table->index(['shopping_list_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_items');
    }
};
