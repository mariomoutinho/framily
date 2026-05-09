<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mission_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();                 // ex: 'arrumar_cama_5_dias'
            $table->string('name_key');                      // chave i18n
            $table->string('description_key')->nullable();
            $table->enum('mission_type', [
                'single_task', 'recurring_task', 'streak', 'count', 'collective', 'custom',
            ]);
            $table->foreignId('difficulty_preset_id')->constrained();
            $table->unsignedInteger('default_target')->nullable();
            $table->string('default_frequency', 16)->nullable(); // daily | weekly | monthly | etc
            $table->boolean('is_collective')->default(false);
            $table->boolean('child_friendly')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mission_templates');
    }
};
