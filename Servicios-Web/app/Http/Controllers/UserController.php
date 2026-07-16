<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::where('role', '!=', 'admin')->withCount('orders')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['role'] = 'user';

        return response()->json(User::create($data), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->loadCount('orders'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        abort_if($user->role === 'admin', 403, 'La cuenta administrativa no se gestiona desde clientes móviles');

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user->fresh()->loadCount('orders'));
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403, 'La cuenta administrativa no se puede eliminar aquí');

        if ($request->user()->is($user)) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta administrativa'], 422);
        }

        if ($user->orders()->exists()) {
            return response()->json(['message' => 'No se puede eliminar un usuario que tiene pedidos'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }
}
