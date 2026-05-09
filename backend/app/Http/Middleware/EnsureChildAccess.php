<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permite somente tokens infantis (ability 'child') ou role='child'.
 * Aplicado após auth:sanctum nas rotas /api/kids/*.
 */
class EnsureChildAccess
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

        $isChild = $user->role === 'child' || $request->user()?->tokenCan('child');

        if (! $isChild) {
            return response()->json([
                'error' => [
                    'code' => 'not_a_child',
                    'message_key' => 'errors.kids_route_requires_child_account',
                ],
            ], 403);
        }

        return $next($request);
    }
}
