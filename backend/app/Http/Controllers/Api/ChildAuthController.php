<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChildLoginPinRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\ChildCredential;
use App\Models\Household;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class ChildAuthController extends Controller
{
    /**
     * Login infantil por e-mail e senha.
     */
    public function loginEmail(LoginRequest $request): JsonResponse
    {
        $key = 'kids-email:'.strtolower($request->input('email')).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return $this->tooMany();
        }

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! $user->isChild() || ! Hash::check($request->string('password'), $user->password ?? '')) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => __('errors.invalid_pin'),
            ]);
        }

        if (! $user->is_active) {
            return $this->disabled();
        }

        RateLimiter::clear($key);

        $token = $user->createToken('child', ['child'])->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $token,
            'abilities' => ['child'],
        ]);
    }

    /**
     * Login infantil por apelido + PIN dentro do contexto da casa (invite_code).
     */
    public function loginPin(ChildLoginPinRequest $request): JsonResponse
    {
        $code = strtoupper($request->string('household_code'));
        $nickname = $request->string('nickname');
        $pin = $request->string('pin');

        $key = 'kids-pin:'.$code.'|'.strtolower($nickname).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return $this->tooMany();
        }

        $household = Household::where('invite_code', $code)->first();
        if (! $household) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'household_code' => __('errors.invalid_pin'),
            ]);
        }

        $credential = ChildCredential::where('household_id', $household->id)
            ->where('nickname', $nickname)
            ->first();

        if (! $credential || ! $credential->is_active || ! $credential->checkPin((string) $pin)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'pin' => __('errors.invalid_pin'),
            ]);
        }

        $user = $credential->user;
        if (! $user || ! $user->is_active) {
            return $this->disabled();
        }

        RateLimiter::clear($key);

        $credential->forceFill(['last_login_at' => now()])->save();

        $token = $user->createToken('child-pin', ['child'])->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $token,
            'abilities' => ['child'],
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

    private function tooMany(): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'too_many_attempts',
                'message_key' => 'errors.too_many_attempts',
            ],
        ], 429);
    }

    private function disabled(): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'child_account_disabled',
                'message_key' => 'errors.child_account_disabled',
            ],
        ], 403);
    }
}
