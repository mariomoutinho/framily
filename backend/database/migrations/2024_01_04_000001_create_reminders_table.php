<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body')->nullable();
            $table->timestamp('remind_at');
            // Polimórfico opcional: ligado a uma task/mission/bill/shopping_list/etc.
            $table->string('related_type')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->index(['related_type', 'related_id']);
            $table->enum('status', ['scheduled', 'sent', 'cancelled'])->default('scheduled');
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();

            $table->index(['household_id', 'remind_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
