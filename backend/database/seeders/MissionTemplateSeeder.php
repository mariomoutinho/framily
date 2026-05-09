<?php

namespace Database\Seeders;

use App\Models\DifficultyPreset;
use App\Models\MissionTemplate;
use Illuminate\Database\Seeder;

class MissionTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $presets = DifficultyPreset::whereNull('household_id')->pluck('id', 'key');

        $templates = [
            [
                'key' => 'arrumar_cama_5_dias',
                'name_key' => 'missions.templates.arrumar_cama_5_dias.name',
                'description_key' => 'missions.templates.arrumar_cama_5_dias.description',
                'mission_type' => 'streak',
                'difficulty' => 'easy',
                'default_target' => 5,
                'default_frequency' => 'daily',
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'guardar_brinquedos_diario',
                'name_key' => 'missions.templates.guardar_brinquedos_diario.name',
                'description_key' => 'missions.templates.guardar_brinquedos_diario.description',
                'mission_type' => 'recurring_task',
                'difficulty' => 'easy',
                'default_target' => null,
                'default_frequency' => 'daily',
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 2,
            ],
            [
                'key' => 'completar_3_tarefas_faceis',
                'name_key' => 'missions.templates.completar_3_tarefas_faceis.name',
                'description_key' => 'missions.templates.completar_3_tarefas_faceis.description',
                'mission_type' => 'count',
                'difficulty' => 'medium',
                'default_target' => 3,
                'default_frequency' => null,
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 3,
            ],
            [
                'key' => 'ajudar_nas_compras',
                'name_key' => 'missions.templates.ajudar_nas_compras.name',
                'description_key' => 'missions.templates.ajudar_nas_compras.description',
                'mission_type' => 'single_task',
                'difficulty' => 'medium',
                'default_target' => null,
                'default_frequency' => null,
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 4,
            ],
            [
                'key' => 'organizar_o_quarto',
                'name_key' => 'missions.templates.organizar_o_quarto.name',
                'description_key' => 'missions.templates.organizar_o_quarto.description',
                'mission_type' => 'single_task',
                'difficulty' => 'medium',
                'default_target' => null,
                'default_frequency' => null,
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 5,
            ],
            [
                'key' => 'completar_tarefas_da_semana',
                'name_key' => 'missions.templates.completar_tarefas_da_semana.name',
                'description_key' => 'missions.templates.completar_tarefas_da_semana.description',
                'mission_type' => 'count',
                'difficulty' => 'challenge',
                'default_target' => 7,
                'default_frequency' => 'weekly',
                'is_collective' => false,
                'child_friendly' => true,
                'sort_order' => 6,
            ],
            [
                'key' => 'casa_organizada_fim_de_semana',
                'name_key' => 'missions.templates.casa_organizada_fim_de_semana.name',
                'description_key' => 'missions.templates.casa_organizada_fim_de_semana.description',
                'mission_type' => 'collective',
                'difficulty' => 'hard',
                'default_target' => null,
                'default_frequency' => 'weekly',
                'is_collective' => true,
                'child_friendly' => true,
                'sort_order' => 7,
            ],
            [
                'key' => 'lista_compras_concluida',
                'name_key' => 'missions.templates.lista_compras_concluida.name',
                'description_key' => 'missions.templates.lista_compras_concluida.description',
                'mission_type' => 'collective',
                'difficulty' => 'medium',
                'default_target' => null,
                'default_frequency' => null,
                'is_collective' => true,
                'child_friendly' => false,
                'sort_order' => 8,
            ],
        ];

        foreach ($templates as $row) {
            $difficultyKey = $row['difficulty'];
            unset($row['difficulty']);
            $row['difficulty_preset_id'] = $presets[$difficultyKey];

            MissionTemplate::updateOrCreate(['key' => $row['key']], $row);
        }
    }
}
