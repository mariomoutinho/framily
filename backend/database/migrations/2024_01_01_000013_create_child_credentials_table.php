<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('nickname', 30);
            $table->string('pin_hash');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();

            // Apelido único por casa (não global), garante visibilidade simples ao login PIN
            $table->unique(['household_id', 'nickname']);
            // Uma criança = uma credencial
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_credentials');
    }
};
