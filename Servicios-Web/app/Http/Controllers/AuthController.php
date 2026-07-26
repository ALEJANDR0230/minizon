<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'user',
        ]);

        return response()->json(['message' => 'Cuenta creada correctamente', 'user' => $user], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        if ($user->role !== 'admin' && $user->is_blocked) {
            return response()->json(['message' => 'Tu cuenta está bloqueada. Contacta al administrador.'], 403);
        }

        $token = $user->createToken('storefront')->plainTextToken;

        return response()->json([
            'message' => 'Sesión iniciada correctamente',
            'token' => $token,
            'role' => $user->role,
            'user' => $user,
        ]);
    }

    public function adminLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || $user->role !== 'admin' || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Acceso exclusivo para el administrador'], 403);
        }

        $token = $user->createToken('admin-panel')->plainTextToken;

        return response()->json([
            'message' => 'Sesión administrativa iniciada correctamente',
            'token' => $token,
            'role' => 'admin',
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:10', 'confirmed', 'different:current_password'],
        ]);

        if (! Hash::check($data['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'La contraseña actual no es correcta.'], 422);
        }

        $request->user()->update([
            'password' => Hash::make($data['password']),
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }
}
