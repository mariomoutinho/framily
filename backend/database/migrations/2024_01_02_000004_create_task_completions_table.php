<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('completed_by_user_id')->constrained('users');
            $table->timestamp('completed_at');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedInteger('points_awarded')->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'status']);
            $table->index('completed_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_completions');
    }
};
