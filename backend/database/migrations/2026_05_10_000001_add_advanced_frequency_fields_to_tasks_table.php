<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tasks MODIFY frequency VARCHAR(32) NOT NULL DEFAULT 'once'");
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->json('frequency_days')->nullable()->after('frequency');
            $table->json('frequency_dates')->nullable()->after('frequency_days');
            $table->timestamp('completed_at')->nullable()->after('due_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['frequency_days', 'frequency_dates', 'completed_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tasks MODIFY frequency ENUM('once', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'once'");
        }
    }
};
