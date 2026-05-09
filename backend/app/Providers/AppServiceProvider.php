<?php

namespace App\Providers;

use App\Models\Household;
use App\Models\PointTransaction;
use App\Models\Reward;
use App\Observers\PointTransactionObserver;
use App\Policies\HouseholdPolicy;
use App\Policies\RewardPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Household::class, HouseholdPolicy::class);
        Gate::policy(Reward::class, RewardPolicy::class);

        PointTransaction::observe(PointTransactionObserver::class);

        // 10 requests por minuto por IP nas rotas de autenticação (login/register/PIN)
        RateLimiter::for('auth', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
            ];
        });
    }
}
