<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloqueia rotas adultas para tokens com ability 'child'.
 * Aplicado após auth:sanctum.
 */
class EnsureAdultAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'error' => [
                    'code' => 'unauthenticated',
                    'message_key' => 'errors.unauthenticated',
                ],
            ], 401);
        }

        // Crianças não acessam rotas adultas.
        if ($user->role === 'child' || $request->user()?->tokenCan('child')) {
            return response()->json([
                'error' => [
                    'code' => 'child_forbidden',
                    'message_key' => 'errors.child_cannot_access_adult_area',
                ],
            ], 403);
        }

        return $next($request);
    }
}
