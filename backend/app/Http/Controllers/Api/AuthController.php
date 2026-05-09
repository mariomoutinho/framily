<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'password' => $request->string('password'),
            'role' => User::ROLE_OWNER, // o primeiro usuário cria a casa = owner
            'locale' => $request->input('locale', 'pt_BR'),
        ]);

        $token = $user->createToken('adult', $user->defaultTokenAbilities())->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $token,
            'abilities' => $user->defaultTokenAbilities(),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $key = 'login:'.strtolower($request->input('email')).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'error' => [
                    'code' => 'too_many_attempts',
                    'message_key' => 'errors.too_many_attempts',
                ],
            ], 429);
        }

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password ?? '')) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'error' => ['code' => 'account_disabled', 'message_key' => 'errors.forbidden'],
            ], 403);
        }

        if ($user->isChild()) {
            // Crianças não podem usar o login adulto.
            return response()->json([
                'error' => [
                    'code' => 'use_kids_login',
                    'message_key' => 'errors.kids_route_requires_child_account',
                ],
            ], 403);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('adult', $user->defaultTokenAbilities())->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $token,
            'abilities' => $user->defaultTokenAbilities(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => UserResource::make($request->user()),
            'abilities' => $request->user()?->currentAccessToken()?->abilities ?? [],
        ]);
    }
}
