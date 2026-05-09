<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();           // ex: 'first_task', 'streak_3_days'
            $table->string('name_key');                // chave i18n
            $table->string('description_key')->nullable();
            $table->string('icon', 32)->nullable();    // nome do ícone Lucide ou identificador
            $table->json('criteria')->nullable();      // {type: 'first_task'|'points_total'|'points_week'|'streak_days'|'first_mission'|'first_redeem', value: int?}
            $table->boolean('is_active')->default(true);
            $table->boolean('child_only')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
