<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate; // Importar Gate
use App\Models\User;                 // Importar el Modelo User

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('admin-access', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('purchase-products', function (User $user) {
            return ! $user->is_blocked && in_array($user->role, ['buyer', 'user'], true);
        });
    }
}
