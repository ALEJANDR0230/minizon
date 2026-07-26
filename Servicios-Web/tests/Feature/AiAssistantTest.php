<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiAssistantTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_assistant_uses_safe_catalog_fallback_when_external_ai_fails(): void
    {
        config([
            'services.groq.key' => 'test-key',
            'services.groq.provider' => 'azure',
            'services.groq.url' => 'https://example.test/chat',
        ]);
        Http::fake(['example.test/*' => Http::response(['error' => 'unavailable'], 503)]);

        $user = User::factory()->create(['role' => 'user']);
        $product = Product::create([
            'name' => 'Audífonos Minizon',
            'price' => 699,
            'stock' => 8,
            'description' => 'Producto de prueba',
            'is_active' => true,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/ai/chat', ['message' => '¿Qué producto me recomiendas?'])
            ->assertOk()
            ->assertJsonPath('suggested_products.0.id', $product->id)
            ->assertJsonPath('suggested_products.0.name', 'Audífonos Minizon')
            ->assertJsonFragment(['message' => 'Puedo recomendarte estas opciones disponibles: Audífonos Minizon por $699.00. El stock puede cambiar antes de finalizar la compra.']);
    }
}
