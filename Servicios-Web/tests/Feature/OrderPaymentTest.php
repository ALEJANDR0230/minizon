<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_payment_is_authorized_and_deducts_inventory_once(): void
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
            'payment_method' => 'card',
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

    public function test_oxxo_payment_requires_admin_approval_before_deducting_inventory(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create([
            'name' => 'Bocina',
            'price' => 500,
            'stock' => 4,
            'description' => 'Bocina de prueba',
            'is_active' => true,
        ]);

        $created = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Cliente OXXO',
            'shipping_address' => 'Calle de prueba numero 456',
            'payment_method' => 'oxxo',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])->assertCreated();

        $orderId = $created->json('id');
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$orderId}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('order.status', 'pending')
            ->assertJsonPath('message', 'Pago OXXO reportado; el administrador debe validarlo');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 4]);
        $this->assertDatabaseMissing('orders', ['id' => $orderId, 'payment_reported_at' => null]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/orders/{$orderId}/status", [
                'status' => 'paid',
                'note' => 'Comprobante revisado',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
    }
}
