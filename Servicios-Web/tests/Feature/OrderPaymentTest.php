<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_is_deducted_only_when_payment_is_confirmed(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $product = Product::create([
            'name' => 'Audifonos',
            'price' => 700,
            'stock' => 5,
            'description' => 'Audifonos de prueba',
            'is_active' => true,
        ]);

        $created = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Cliente de prueba',
            'shipping_address' => 'Calle de prueba numero 123',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $created->assertCreated()->assertJsonPath('status', 'pending');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);

        $orderId = $created->json('id');
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$orderId}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('order.status', 'paid');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);

        // Repetir la confirmacion no debe descontar dos veces.
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$orderId}/confirm-payment")
            ->assertOk();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
    }
}
