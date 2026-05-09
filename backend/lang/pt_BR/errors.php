<?php

/**
 * Mensagens de erro personalizadas do Framily.
 * Usadas em respostas JSON via 'message_key' para o frontend traduzir
 * conforme o locale do usuário.
 */
return [
    'unauthenticated' => 'Você precisa estar autenticado.',
    'forbidden' => 'Você não tem permissão para esta ação.',
    'validation_failed' => 'Dados inválidos.',
    'not_found' => 'Recurso não encontrado.',
    'too_many_attempts' => 'Tentativas demais. Aguarde um momento.',

    // Específicos do fluxo infantil
    'child_cannot_access_adult_area' => 'Esta área é para adultos da casa.',
    'kids_route_requires_child_account' => 'Esta rota é exclusiva da área infantil.',
    'invalid_pin' => 'Apelido ou PIN inválido.',
    'child_account_disabled' => 'Esta conta infantil está desativada. Fale com um responsável.',

    // Casa/membros
    'household_not_found' => 'Casa não encontrada.',
    'invite_invalid' => 'Código de convite inválido ou expirado.',

    // Pontos / missões
    'task_already_completed' => 'Esta tarefa já foi concluída.',
    'mission_already_completed' => 'Esta missão já foi concluída.',
    'requires_adult_approval' => 'Aguardando aprovação de um adulto.',
    'not_assigned_to_task' => 'Você não está atribuído(a) a esta tarefa.',
    'insufficient_points' => 'Pontos insuficientes para esta recompensa.',
    'reward_unavailable' => 'Esta recompensa não está disponível no momento.',
];
