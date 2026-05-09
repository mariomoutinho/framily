<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mission_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            // Em missões coletivas, user_id é null (progresso da casa toda).
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_value')->default(0);
            $table->timestamp('last_event_at')->nullable();
            $table->timestamps();

            $table->unique(['mission_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mission_progress');
    }
};
