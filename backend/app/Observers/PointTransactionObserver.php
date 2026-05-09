<?php

namespace App\Observers;

use App\Models\PointTransaction;
use App\Services\AchievementChecker;

class PointTransactionObserver
{
    public function __construct(private readonly AchievementChecker $checker) {}

    public function created(PointTransaction $tx): void
    {
        if ($tx->status === PointTransaction::STATUS_CONFIRMED) {
            $this->run($tx);
        }
    }

    public function updated(PointTransaction $tx): void
    {
        // Quando um PointTransaction passa de pending → confirmed, dispara o check.
        if (
            $tx->wasChanged('status')
            && $tx->status === PointTransaction::STATUS_CONFIRMED
        ) {
            $this->run($tx);
        }
    }

    private function run(PointTransaction $tx): void
    {
        $user = $tx->user;
        if (! $user) {
            return;
        }
        $this->checker->checkForUser($user, $tx->household_id);
    }
}
