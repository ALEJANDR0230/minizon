<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sku')->nullable()->unique();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
        });

        $now = now();
        $generalId = DB::table('categories')->insertGetId([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'Productos generales de la tienda.',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('products')->orderBy('id')->get(['id'])->each(function ($product) use ($generalId) {
            DB::table('products')->where('id', $product->id)->update([
                'category_id' => $generalId,
                'sku' => sprintf('PROD-%05d', $product->id),
                'is_active' => true,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn(['sku', 'image_url', 'is_active']);
        });

        Schema::dropIfExists('categories');
    }
};
