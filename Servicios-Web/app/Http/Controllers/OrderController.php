<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->orders()
                ->with('items.product:id,name,image_url')
                ->latest()
                ->get()
        );
    }

    public function adminIndex()
    {
        return response()->json(
            Order::with(['user:id,name,email', 'items.product:id,name,image_url'])
                ->latest()
                ->get()
        );
    }

    public function show(Request $request, Order $order)
    {
        abort_unless($request->user()->role === 'admin' || $order->user_id === $request->user()->id, 403);

        return response()->json($order->load(['user:id,name,email', 'items.product:id,name,image_url']));
    }

    public function store(Request $request)
    {
        abort_unless(in_array($request->user()->role, ['user', 'buyer'], true), 403);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $order = DB::transaction(function () use ($request, $data) {
            $preparedItems = [];
            $total = 0;

            foreach ($data['items'] as $item) {
                $product = Product::query()->lockForUpdate()->findOrFail($item['product_id']);
                abort_unless($product->is_active, 422, "El producto {$product->name} ya no está disponible");

                if ($product->stock < $item['quantity']) {
                    abort(422, "Stock insuficiente para {$product->name}");
                }

                $unitPrice = (float) $product->price;
                $subtotal = round($unitPrice * $item['quantity'], 2);
                $total = round($total + $subtotal, 2);

                $preparedItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $subtotal,
                ];

                $product->decrement('stock', $item['quantity']);
            }

            $order = $request->user()->orders()->create([
                'status' => 'pending',
                'total' => $total,
                'customer_name' => $data['customer_name'],
                'shipping_address' => $data['shipping_address'],
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($preparedItems);

            return $order;
        });

        return response()->json(
            $order->load(['user:id,name,email', 'items.product:id,name,image_url']),
            201,
        );
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
        ]);

        if ($order->status === 'cancelled' && $data['status'] !== 'cancelled') {
            return response()->json(['message' => 'Un pedido cancelado no se puede reactivar'], 422);
        }

        DB::transaction(function () use ($order, $data) {
            if ($data['status'] === 'cancelled' && $order->status !== 'cancelled') {
                $order->load('items');
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                    }
                }
            }

            $order->update(['status' => $data['status']]);
        });

        return response()->json($order->fresh()->load(['user:id,name,email', 'items.product:id,name,image_url']));
    }
}
