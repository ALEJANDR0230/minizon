<?php

namespace App\Services\Admin;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    public function dashboard(): array
    {
        $revenueQuery = Order::query()->whereIn('status', ['paid', 'shipped', 'delivered']);
        $trendStart = now()->subDays(13)->startOfDay();
        $trendRows = Order::query()
            ->whereIn('status', ['paid', 'shipped', 'delivered'])
            ->where('created_at', '>=', $trendStart)
            ->selectRaw('DATE(created_at) as day, SUM(total) as total, COUNT(*) as orders_count')
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy('day');

        $salesTrend = collect(range(13, 0))->map(function (int $daysAgo) use ($trendRows) {
            $date = now()->subDays($daysAgo);
            $row = $trendRows->get($date->toDateString());

            return [
                'date' => $date->toDateString(),
                'label' => $date->format('d/m'),
                'revenue' => round((float) ($row?->total ?? 0), 2),
                'orders' => (int) ($row?->orders_count ?? 0),
            ];
        })->values();

        $statusRows = Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusLabels = [
            'pending' => 'Pendientes',
            'paid' => 'Pagados',
            'shipped' => 'Enviados',
            'delivered' => 'Entregados',
            'cancelled' => 'Cancelados',
        ];

        $orderStatus = collect(Order::STATUSES)->map(fn (string $status) => [
            'status' => $status,
            'label' => $statusLabels[$status],
            'value' => (int) ($statusRows[$status] ?? 0),
        ])->values();

        $inventoryByCategory = Category::query()
            ->leftJoin('products', 'categories.id', '=', 'products.category_id')
            ->select([
                'categories.id',
                'categories.name',
                DB::raw('COUNT(products.id) as products_count'),
                DB::raw('COALESCE(SUM(products.stock), 0) as stock'),
            ])
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('stock')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'products' => (int) $row->products_count,
                'stock' => (int) $row->stock,
            ]);

        $topProducts = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', ['paid', 'shipped', 'delivered'])
            ->select([
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as units'),
                DB::raw('SUM(order_items.subtotal) as revenue'),
            ])
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('units')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->product_id,
                'name' => $row->product_name,
                'units' => (int) $row->units,
                'revenue' => round((float) $row->revenue, 2),
            ]);

        $alerts = $this->alerts();

        return [
            'metrics' => [
                'mobile_customers' => User::where('role', '!=', 'admin')->count(),
                'products' => Product::count(),
                'active_products' => Product::where('is_active', true)->count(),
                'categories' => Category::count(),
                'orders' => Order::count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'pending_payment_orders' => Order::where('status', 'pending')->count(),
                'oxxo_review_orders' => Order::where('status', 'pending')
                    ->where('payment_method', 'oxxo')
                    ->whereNotNull('payment_reported_at')
                    ->count(),
                'ready_to_ship_orders' => Order::where('status', 'paid')->count(),
                'preparing_orders' => Order::where('status', 'preparing')->count(),
                'reviews' => ProductReview::count(),
                'revenue' => round((float) (clone $revenueQuery)->sum('total'), 2),
                'revenue_month' => round((float) (clone $revenueQuery)
                    ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('total'), 2),
                'sales_today' => round((float) (clone $revenueQuery)
                    ->whereDate('created_at', today())
                    ->sum('total'), 2),
                'average_order' => round((float) ((clone $revenueQuery)->avg('total') ?? 0), 2),
                'inventory_units' => (int) Product::where('is_active', true)->sum('stock'),
                'critical_alerts' => $alerts->where('severity', 'critical')->count(),
            ],
            'sales_trend' => $salesTrend,
            'order_status' => $orderStatus,
            'inventory_by_category' => $inventoryByCategory,
            'top_products' => $topProducts,
            'alerts' => $alerts->values(),
            'recent_orders' => Order::with('user:id,name,email')->latest()->limit(5)->get(),
            'recent_paid_orders' => Order::with('user:id,name,email')
                ->whereNotNull('paid_at')
                ->latest('paid_at')
                ->limit(5)
                ->get(),
            'low_stock_products' => Product::where('is_active', true)
                ->where('stock', '<=', 5)
                ->orderBy('stock')
                ->limit(8)
                ->get(['id', 'name', 'sku', 'stock']),
            'recent_reviews' => ProductReview::with(['product:id,name', 'user:id,name'])
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }

    public function alerts()
    {
        $alerts = collect();

        Product::query()->where('is_active', true)->where('stock', '<=', 5)->orderBy('stock')->get()
            ->each(function (Product $product) use ($alerts) {
                $alerts->push([
                    'severity' => $product->stock === 0 ? 'critical' : 'warning',
                    'title' => $product->stock === 0 ? 'Producto agotado' : 'Stock bajo',
                    'message' => "{$product->name}: {$product->stock} unidad(es) disponibles.",
                    'path' => '/admin/productos',
                ]);
            });

        $oldPending = Order::query()
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subDays(2))
            ->count();

        if ($oldPending > 0) {
            $alerts->push([
                'severity' => 'critical',
                'title' => 'Pagos pendientes vencidos',
                'message' => "Hay {$oldPending} pedido(s) con más de 48 horas sin atender.",
                'path' => '/admin/pedidos',
            ]);
        }

        $readyToShip = Order::query()->where('status', 'paid')->count();
        if ($readyToShip > 0) {
            $alerts->push([
                'severity' => 'info',
                'title' => 'Pagos nuevos por preparar',
                'message' => "Hay {$readyToShip} pedido(s) pagado(s) listos para envio.",
                'path' => '/admin/pedidos',
            ]);
        }

        $negativeReviews = ProductReview::query()->where('rating', '<=', 2)->where('created_at', '>=', now()->subDays(30))->count();
        if ($negativeReviews > 0) {
            $alerts->push([
                'severity' => 'warning',
                'title' => 'Reseñas que requieren atención',
                'message' => "Hay {$negativeReviews} reseña(s) de dos estrellas o menos este mes.",
                'path' => '/admin/resenas',
            ]);
        }

        if ($alerts->isEmpty()) {
            $alerts->push([
                'severity' => 'info',
                'title' => 'Operación estable',
                'message' => 'No hay situaciones críticas detectadas en este momento.',
                'path' => '/admin',
            ]);
        }

        return $alerts;
    }

    public function reportSummary(Carbon $from, Carbon $to): array
    {
        $orders = Order::query()->whereBetween('created_at', [$from, $to]);
        $validOrders = (clone $orders)->whereIn('status', ['paid', 'shipped', 'delivered']);
        $orderIds = (clone $validOrders)->pluck('id');

        $topProducts = OrderItem::query()
            ->whereIn('order_id', $orderIds)
            ->select('product_name', DB::raw('SUM(quantity) as units'), DB::raw('SUM(subtotal) as revenue'))
            ->groupBy('product_name')
            ->orderByDesc('units')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->product_name,
                'units' => (int) $row->units,
                'revenue' => round((float) $row->revenue, 2),
            ]);

        return [
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => [
                'orders' => (clone $orders)->count(),
                'revenue' => round((float) (clone $validOrders)->sum('total'), 2),
                'average_order' => round((float) ((clone $validOrders)->avg('total') ?? 0), 2),
                'units_sold' => (int) OrderItem::whereIn('order_id', $orderIds)->sum('quantity'),
                'new_mobile_customers' => User::where('role', '!=', 'admin')->whereBetween('created_at', [$from, $to])->count(),
                'reviews' => ProductReview::whereBetween('created_at', [$from, $to])->count(),
            ],
            'status' => (clone $orders)
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->get()
                ->map(fn ($row) => ['status' => $row->status, 'total' => (int) $row->total]),
            'top_products' => $topProducts,
            'low_stock' => Product::with('category:id,name')
                ->where('is_active', true)
                ->where('stock', '<=', 5)
                ->orderBy('stock')
                ->get(['id', 'category_id', 'name', 'sku', 'stock', 'price']),
        ];
    }
}
