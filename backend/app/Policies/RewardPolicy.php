<?php

namespace App\Policies;

use App\Models\Reward;
use App\Models\User;

class RewardPolicy
{
    public function view(User $user, Reward $reward): bool
    {
        return $user->isMemberOf($reward->household);
    }

    public function update(User $user, Reward $reward): bool
    {
        return $user->isAdult() && $user->isMemberOf($reward->household);
    }

    public function delete(User $user, Reward $reward): bool
    {
        return $this->update($user, $reward);
    }
}
