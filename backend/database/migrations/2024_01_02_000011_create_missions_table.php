<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('mission_templates')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('mission_type', [
                'single_task', 'recurring_task', 'streak', 'count', 'collective', 'custom',
            ]);
            $table->foreignId('difficulty_preset_id')->constrained();
            $table->unsignedInteger('points_override')->nullable();
            $table->string('frequency', 16)->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->unsignedInteger('target_value')->nullable();
            $table->boolean('requires_approval')->default(true);
            $table->boolean('is_collective')->default(false);
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->foreignId('reward_id')->nullable(); // FK virá quando criarmos rewards na Fase 4
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['household_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
