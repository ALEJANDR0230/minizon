<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Ai\AdminAdvisorService;
use Illuminate\Http\Request;

class AdminAdvisorController extends Controller
{
    public function show(AdminAdvisorService $advisor)
    {
        return response()->json($advisor->snapshot());
    }

    public function generate(AdminAdvisorService $advisor)
    {
        return response()->json($advisor->generate());
    }

    public function chat(Request $request, AdminAdvisorService $advisor)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1500'],
            'history' => ['nullable', 'array', 'max:12'],
            'history.*.role' => ['required', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:1500'],
        ]);

        return response()->json($advisor->chat(
            trim($data['message']),
            $data['history'] ?? [],
        ));
    }
}
