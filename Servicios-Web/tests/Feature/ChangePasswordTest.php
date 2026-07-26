<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_password_with_current_password(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('Anterior#123'),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/auth/change-password', [
                'current_password' => 'Anterior#123',
                'password' => 'NuevaClave#456',
                'password_confirmation' => 'NuevaClave#456',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('NuevaClave#456', $admin->fresh()->password));
    }

    public function test_current_password_must_be_correct(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('Anterior#123'),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/auth/change-password', [
                'current_password' => 'Incorrecta#123',
                'password' => 'NuevaClave#456',
                'password_confirmation' => 'NuevaClave#456',
            ])
            ->assertUnprocessable();
    }
}
