<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'key' => 'first_task',
                'name_key' => 'achievements.first_task.name',
                'description_key' => 'achievements.first_task.description',
                'icon' => 'rocket',
                'criteria' => ['type' => 'first_task'],
                'sort_order' => 1,
            ],
            [
                'key' => 'first_mission',
                'name_key' => 'achievements.first_mission.name',
                'description_key' => 'achievements.first_mission.description',
                'icon' => 'target',
                'criteria' => ['type' => 'first_mission'],
                'sort_order' => 2,
            ],
            [
                'key' => 'pts_week_50',
                'name_key' => 'achievements.pts_week_50.name',
                'description_key' => 'achievements.pts_week_50.description',
                'icon' => 'star',
                'criteria' => ['type' => 'points_week', 'value' => 50],
                'sort_order' => 3,
            ],
            [
                'key' => 'pts_week_100',
                'name_key' => 'achievements.pts_week_100.name',
                'description_key' => 'achievements.pts_week_100.description',
                'icon' => 'sparkles',
                'criteria' => ['type' => 'points_week', 'value' => 100],
                'sort_order' => 4,
            ],
            [
                'key' => 'pts_total_500',
                'name_key' => 'achievements.pts_total_500.name',
                'description_key' => 'achievements.pts_total_500.description',
                'icon' => 'trophy',
                'criteria' => ['type' => 'points_total', 'value' => 500],
                'sort_order' => 5,
            ],
            [
                'key' => 'pts_total_2000',
                'name_key' => 'achievements.pts_total_2000.name',
                'description_key' => 'achievements.pts_total_2000.description',
                'icon' => 'crown',
                'criteria' => ['type' => 'points_total', 'value' => 2000],
                'sort_order' => 6,
            ],
            [
                'key' => 'first_redeem',
                'name_key' => 'achievements.first_redeem.name',
                'description_key' => 'achievements.first_redeem.description',
                'icon' => 'gift',
                'criteria' => ['type' => 'first_redeem'],
                'sort_order' => 7,
            ],
            [
                'key' => 'team_player',
                'name_key' => 'achievements.team_player.name',
                'description_key' => 'achievements.team_player.description',
                'icon' => 'users',
                'criteria' => ['type' => 'first_collective_mission'],
                'sort_order' => 8,
            ],
        ];

        foreach ($achievements as $row) {
            Achievement::updateOrCreate(['key' => $row['key']], $row);
        }
    }
}
