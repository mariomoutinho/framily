<?php

namespace App\Policies;

use App\Models\Household;
use App\Models\User;

class HouseholdPolicy
{
    /**
     * Visualizar a casa requer ser membro.
     */
    public function view(User $user, Household $household): bool
    {
        return $user->isMemberOf($household);
    }

    /**
     * Atualizar configurações da casa: owner ou admin.
     */
    public function update(User $user, Household $household): bool
    {
        return $this->memberRole($user, $household, [User::ROLE_OWNER, User::ROLE_ADMIN]);
    }

    /**
     * Excluir a casa: somente owner.
     */
    public function delete(User $user, Household $household): bool
    {
        return $household->owner_id === $user->id;
    }

    /**
     * Gerenciar membros (convidar, remover, configurar PIN, vincular guardiões):
     * owner ou admin.
     */
    public function manageMembers(User $user, Household $household): bool
    {
        return $this->memberRole($user, $household, [User::ROLE_OWNER, User::ROLE_ADMIN]);
    }

    private function memberRole(User $user, Household $household, array $allowed): bool
    {
        $role = $household->members()->where('user_id', $user->id)->value('role');

        return $role !== null && in_array($role, $allowed, true);
    }
}
