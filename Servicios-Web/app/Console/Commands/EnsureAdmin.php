<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsureAdmin extends Command
{
    protected $signature = 'minizon:ensure-admin';

    protected $description = 'Create the initial Minizon administrator from environment variables';

    public function handle(): int
    {
        $email = trim((string) env('INITIAL_ADMIN_EMAIL'));
        $password = (string) env('INITIAL_ADMIN_PASSWORD');
        $name = trim((string) env('INITIAL_ADMIN_NAME', 'Administrador Minizon'));

        if ($email === '' || $password === '') {
            $this->components->info('Initial administrator is not configured.');

            return self::SUCCESS;
        }

        $admin = User::firstOrNew(['email' => $email]);

        if (! $admin->exists) {
            $admin->password = Hash::make($password);
        }

        $admin->name = $name !== '' ? $name : 'Administrador Minizon';
        $admin->role = 'admin';
        $admin->is_blocked = false;
        $admin->save();

        $this->components->info('Initial administrator is ready.');

        return self::SUCCESS;
    }
}
