<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('difficulty_presets', function (Blueprint $table) {
            $table->id();
            $table->string('key', 32);                      // easy | medium | hard | challenge | <custom>
            $table->string('name_key');                     // chave i18n: gamification.difficulty.easy
            $table->unsignedInteger('base_points');
            $table->string('color', 16)->nullable();
            $table->foreignId('household_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            // Presets globais: household_id null + key único; presets da casa: único por casa
            $table->unique(['household_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('difficulty_presets');
    }
};
