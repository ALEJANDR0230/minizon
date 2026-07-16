<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function productIndex(Product $product)
    {
        return response()->json($product->reviews()->with('user:id,name')->latest()->get());
    }

    public function adminIndex()
    {
        return response()->json(
            ProductReview::with(['user:id,name,email', 'product:id,name'])
                ->latest()
                ->get()
        );
    }

    public function store(Request $request, Product $product)
    {
        $data = $this->validatedData($request);

        $review = ProductReview::updateOrCreate(
            ['product_id' => $product->id, 'user_id' => $request->user()->id],
            $data,
        );

        return response()->json(
            $review->load('user:id,name'),
            $review->wasRecentlyCreated ? 201 : 200,
        );
    }

    public function update(Request $request, ProductReview $review)
    {
        $this->authorizeReview($request, $review);
        $review->update($this->validatedData($request));

        return response()->json($review->fresh()->load(['user:id,name', 'product:id,name']));
    }

    public function destroy(Request $request, ProductReview $review)
    {
        $this->authorizeReview($request, $review);
        $review->delete();

        return response()->json(['message' => 'Reseña eliminada correctamente']);
    }

    public function destroyForProduct(Request $request, Product $product, ProductReview $review)
    {
        abort_unless($review->product_id === $product->id, 404);

        return $this->destroy($request, $review);
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'comment' => ['required', 'string', 'min:3', 'max:2000'],
            'rating' => ['required', 'integer', 'between:1,5'],
        ]);
    }

    private function authorizeReview(Request $request, ProductReview $review): void
    {
        $isOwner = $review->user_id === $request->user()->id;
        $isAdmin = $request->user()->role === 'admin';

        abort_unless($isOwner || $isAdmin, 403, 'No tienes permiso para modificar esta reseña');
    }
}
