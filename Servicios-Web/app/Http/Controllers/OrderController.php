<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const TRANSITIONS = [
        'pending' => ['paid', 'cancelled'],
        'paid' => ['shipped', 'cancelled'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

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
            Order::with([
                'user:id,name,email',
                'items.product:id,name,image_url',
                'history.actor:id,name',
            ])->latest()->get()
        );
    }

    public function show(Request $request, Order $order)
    {
        abort_unless($request->user()->role === 'admin' || $order->user_id === $request->user()->id, 403);

        return response()->json($order->load([
            'user:id,name,email',
            'items.product:id,name,image_url',
            'history.actor:id,name',
        ]));
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
                $product = Product::query()->findOrFail($item['product_id']);
                abort_unless($product->is_active, 422, "El producto {$product->name} ya no esta disponible");

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
            }

            $order = $request->user()->orders()->create([
                'status' => 'pending',
                'payment_method' => 'oxxo',
                'total' => $total,
                'customer_name' => $data['customer_name'],
                'shipping_address' => $data['shipping_address'],
                'notes' => $data['notes'] ?? null,
            ]);
            $order->update([
                'payment_reference' => sprintf('MZ-%08d-%04d', $order->id, ((int) round($total)) % 10000),
            ]);
            $order->items()->createMany($preparedItems);
            $this->recordHistory($order, $request->user()->id, null, 'pending', 'Pedido creado; esperando pago');

            return $order;
        });

        return response()->json(
            $order->fresh()->load(['items.product:id,name,image_url']),
            201,
        );
    }

    public function confirmPayment(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $paidOrder = DB::transaction(function () use ($request, $order) {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($lockedOrder->status === 'paid') {
                return $lockedOrder;
            }

            abort_unless($lockedOrder->status === 'pending', 422, 'Este pedido ya no admite confirmacion de pago');
            $this->deductInventory($lockedOrder);
            $lockedOrder->update(['status' => 'paid', 'paid_at' => now()]);
            $this->recordHistory(
                $lockedOrder,
                $request->user()->id,
                'pending',
                'paid',
                'Pago OXXO confirmado desde la aplicacion',
            );

            return $lockedOrder;
        });

        return response()->json([
            'message' => 'Pago confirmado e inventario actualizado',
            'order' => $paidOrder->fresh()->load(['items.product:id,name,image_url']),
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $updatedOrder = DB::transaction(function () use ($request, $order, $data) {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
            $from = $lockedOrder->status;
            $to = $data['status'];

            if ($from === $to) {
                return $lockedOrder;
            }

            abort_unless(
                in_array($to, self::TRANSITIONS[$from] ?? [], true),
                422,
                "No se puede cambiar un pedido de {$from} a {$to}",
            );

            if ($to === 'paid') {
                $this->deductInventory($lockedOrder);
            }

            if ($to === 'cancelled' && $from === 'paid') {
                $this->restoreInventory($lockedOrder);
            }

            $timestamps = match ($to) {
                'paid' => ['paid_at' => now()],
                'shipped' => ['shipped_at' => now()],
                'delivered' => ['delivered_at' => now()],
                'cancelled' => ['cancelled_at' => now()],
                default => [],
            };
            $lockedOrder->update(['status' => $to, ...$timestamps]);
            $this->recordHistory(
                $lockedOrder,
                $request->user()->id,
                $from,
                $to,
                $data['note'] ?? null,
            );

            return $lockedOrder;
        });

        return response()->json($updatedOrder->fresh()->load([
            'user:id,name,email',
            'items.product:id,name,image_url',
            'history.actor:id,name',
        ]));
    }

    private function deductInventory(Order $order): void
    {
        $order->load('items');

        foreach ($order->items as $item) {
            abort_unless($item->product_id, 422, "El producto {$item->product_name} ya no esta disponible");
            $product = Product::query()->lockForUpdate()->find($item->product_id);
            abort_unless($product && $product->is_active, 422, "El producto {$item->product_name} ya no esta disponible");

            if ($product->stock < $item->quantity) {
                abort(422, "Stock insuficiente para {$item->product_name}");
            }
            $product->decrement('stock', $item->quantity);
        }
    }

    private function restoreInventory(Order $order): void
    {
        $order->load('items');
        foreach ($order->items as $item) {
            if ($item->product_id) {
                Product::whereKey($item->product_id)->increment('stock', $item->quantity);
            }
        }
    }

    private function recordHistory(
        Order $order,
        ?int $actorId,
        ?string $from,
        string $to,
        ?string $note = null,
    ): void {
        $order->history()->create([
            'actor_id' => $actorId,
            'from_status' => $from,
            'to_status' => $to,
            'note' => $note,
        ]);
    }
}
