<?php

namespace Database\Seeders;

use App\Models\DifficultyPreset;
use Illuminate\Database\Seeder;

class DifficultyPresetSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            ['key' => 'easy',      'name_key' => 'gamification.difficulty.easy',      'base_points' => 10,  'color' => 'emerald', 'sort_order' => 1],
            ['key' => 'medium',    'name_key' => 'gamification.difficulty.medium',    'base_points' => 25,  'color' => 'amber',   'sort_order' => 2],
            ['key' => 'hard',      'name_key' => 'gamification.difficulty.hard',      'base_points' => 50,  'color' => 'orange',  'sort_order' => 3],
            ['key' => 'challenge', 'name_key' => 'gamification.difficulty.challenge', 'base_points' => 100, 'color' => 'fuchsia', 'sort_order' => 4],
        ];

        foreach ($presets as $row) {
            DifficultyPreset::updateOrCreate(
                ['household_id' => null, 'key' => $row['key']],
                $row,
            );
        }
    }
}
