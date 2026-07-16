<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_can_purchase_product_and_reduce_stock(): void
    {
        $user = User::factory()->create([
            'role' => 'buyer',
        ]);

        $product = Product::create([
            'name' => 'Teclado mecánico',
            'price' => 500,
            'stock' => 10,
            'description' => 'Teclado gamer',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/products/{$product->id}/purchase", [
            'quantity' => 2,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Compra realizada correctamente')
            ->assertJsonPath('stock', 8);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 8]);
    }

    public function test_admin_cannot_purchase_product(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $product = Product::create([
            'name' => 'Mouse gamer',
            'price' => 300,
            'stock' => 5,
            'description' => 'Mouse',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/products/{$product->id}/purchase", [
            'quantity' => 1,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
    }

    public function test_admin_cannot_change_product_price(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $product = Product::create([
            'name' => 'Monitor',
            'price' => 2000,
            'stock' => 3,
            'description' => 'Monitor 24"',
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/products/{$product->id}", [
            'price' => 2500,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'price' => 2000]);
    }
}
