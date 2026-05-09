<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();

            // Polimórfico: source_type pode ser 'task'|'mission'|'reward'|'manual'
            $table->string('source_type');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->index(['source_type', 'source_id']);

            // Sinal: positivo (ganho) ou negativo (gasto em recompensa)
            $table->integer('points');

            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('confirmed');
            $table->string('reason_key')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'household_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
