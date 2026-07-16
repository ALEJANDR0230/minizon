<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Admin\AdminAdvisorController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');
    Route::post('register', [AuthController::class, 'register']);
});

// Compatibilidad con el frontend anterior.
Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);
Route::get('products/{product}/reviews', [ReviewController::class, 'productIndex']);
Route::post('ai/chat', [AiController::class, 'chat'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);

    Route::post('products/{product}/reviews', [ReviewController::class, 'store'])->can('purchase-products');
    Route::put('reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);

    Route::prefix('admin')->middleware('can:admin-access')->group(function () {
        Route::get('dashboard', [AdminController::class, 'dashboard']);
        Route::get('advisor', [AdminAdvisorController::class, 'show']);
        Route::post('advisor/generate', [AdminAdvisorController::class, 'generate'])->middleware('throttle:10,1');
        Route::post('advisor/chat', [AdminAdvisorController::class, 'chat'])->middleware('throttle:15,1');
        Route::get('reports/summary', [AdminReportController::class, 'summary']);
        Route::get('reports/export', [AdminReportController::class, 'export']);

        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        Route::get('categories', [CategoryController::class, 'adminIndex']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

        Route::get('products', [ProductController::class, 'adminIndex']);
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        Route::get('orders', [OrderController::class, 'adminIndex']);
        Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);

        Route::get('reviews', [ReviewController::class, 'adminIndex']);
        Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);
        Route::delete('products/{product}/reviews/{review}', [ReviewController::class, 'destroyForProduct']);
    });
});
