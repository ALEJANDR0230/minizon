<?php

namespace App\Http\Controllers;

use App\Services\Ai\StoreAssistantOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AiController extends Controller
{
    public function chat(Request $request, StoreAssistantOrchestrator $orchestrator): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'history' => ['sometimes', 'array', 'max:10'],
            'history.*.role' => ['required', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:1000'],
        ]);

        try {
            return response()->json($orchestrator->chat(
                $request->user(),
                trim($validated['message']),
                $validated['history'] ?? [],
            ));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }
}
