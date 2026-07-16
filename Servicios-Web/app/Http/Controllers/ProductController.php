<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::query()
            ->where('is_active', true)
            ->with('category:id,name,slug')
            ->with(['reviews.user:id,name'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = trim((string) $request->input('search'));
                $query->where(function ($nested) use ($term) {
                    $nested->where('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%")
                        ->orWhere('sku', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $category = $request->input('category');
                $query->whereHas('category', fn ($categoryQuery) => $categoryQuery
                    ->where('id', $category)
                    ->orWhere('slug', $category));
            })
            ->orderBy('name')
            ->get();

        return response()->json($products);
    }

    public function adminIndex()
    {
        return response()->json(
            Product::with('category:id,name,slug')
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->orderBy('name')
                ->get()
        );
    }

    public function show(Product $product)
    {
        abort_unless($product->is_active, 404);

        return response()->json(
            $product->load(['category:id,name,slug', 'reviews.user:id,name'])
                ->loadAvg('reviews', 'rating')
                ->loadCount('reviews')
        );
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        return response()->json(Product::create($data)->load('category:id,name,slug'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validatedData($request, $product);
        $product->update($data);

        return response()->json($product->fresh()->load('category:id,name,slug'));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }

    private function validatedData(Request $request, ?Product $product = null): array
    {
        $required = $product ? 'sometimes' : 'required';

        return $request->validate([
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:160'],
            'sku' => [$required, 'string', 'max:80', Rule::unique('products', 'sku')->ignore($product?->id)],
            'price' => [$required, 'numeric', 'min:0', 'max:99999999.99'],
            'stock' => [$required, 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:3000'],
            'image_url' => ['nullable', 'url', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
