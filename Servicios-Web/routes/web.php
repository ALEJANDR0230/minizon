<?php

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $frontend = public_path('index.html');

    return is_file($frontend)
        ? response()->file($frontend)
        : view('welcome');
})->where('path', '^(?!api(?:/|$)|storage(?:/|$)).*');
