<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\Admin\AdminAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\Rule;

class AdminReportController extends Controller
{
    public function summary(Request $request, AdminAnalyticsService $analytics)
    {
        [$from, $to] = $this->period($request);

        return response()->json($analytics->reportSummary($from, $to));
    }

    public function export(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['sales', 'inventory', 'reviews'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        [$from, $to] = $this->period($request);
        $type = $data['type'];
        $filename = sprintf('reporte-%s-%s-%s.csv', $type, $from->toDateString(), $to->toDateString());

        return Response::streamDownload(function () use ($type, $from, $to) {
            $output = fopen('php://output', 'wb');
            fwrite($output, "\xEF\xBB\xBF");

            if ($type === 'sales') {
                fputcsv($output, [
                    'Pedido', 'Fecha', 'Cliente móvil', 'Correo', 'Estado', 'Método de pago',
                    'Referencia de pago', 'Fecha de pago', 'Total', 'Artículos',
                    'Persona que recibe', 'Dirección', 'Referencias de entrega',
                ]);
                Order::with(['user:id,name,email', 'items:id,order_id,quantity'])
                    ->whereBetween('created_at', [$from, $to])
                    ->orderByDesc('created_at')
                    ->chunkById(200, function ($orders) use ($output) {
                        foreach ($orders as $order) {
                            fputcsv($output, [
                                $order->id,
                                $order->created_at?->format('Y-m-d H:i'),
                                $this->safeCsv($order->user?->name ?? $order->customer_name),
                                $this->safeCsv($order->user?->email),
                                $order->status,
                                $order->payment_method,
                                $this->safeCsv($order->payment_reference),
                                $order->paid_at?->format('Y-m-d H:i'),
                                number_format((float) $order->total, 2, '.', ''),
                                $order->items->sum('quantity'),
                                $this->safeCsv($order->customer_name),
                                $this->safeCsv($order->shipping_address),
                                $this->safeCsv($order->notes),
                            ]);
                        }
                    });
            } elseif ($type === 'inventory') {
                fputcsv($output, ['SKU', 'Producto', 'Categoría', 'Precio', 'Stock', 'Activo', 'Calificación', 'Reseñas']);
                Product::with('category:id,name')->withAvg('reviews', 'rating')->withCount('reviews')
                    ->orderBy('name')->chunkById(200, function ($products) use ($output) {
                        foreach ($products as $product) {
                            fputcsv($output, [
                                $this->safeCsv($product->sku),
                                $this->safeCsv($product->name),
                                $this->safeCsv($product->category?->name ?? 'Sin categoría'),
                                number_format((float) $product->price, 2, '.', ''),
                                $product->stock,
                                $product->is_active ? 'Sí' : 'No',
                                number_format((float) ($product->reviews_avg_rating ?? 0), 1, '.', ''),
                                $product->reviews_count,
                            ]);
                        }
                    });
            } else {
                fputcsv($output, ['Fecha', 'Producto', 'Cliente móvil', 'Estrellas', 'Comentario']);
                ProductReview::with(['product:id,name', 'user:id,name,email'])
                    ->whereBetween('created_at', [$from, $to])
                    ->orderByDesc('created_at')
                    ->chunkById(200, function ($reviews) use ($output) {
                        foreach ($reviews as $review) {
                            fputcsv($output, [
                                $review->created_at?->format('Y-m-d H:i'),
                                $this->safeCsv($review->product?->name ?? 'Producto eliminado'),
                                $this->safeCsv($review->user?->email ?? 'Cuenta eliminada'),
                                $review->rating,
                                $this->safeCsv($review->comment),
                            ]);
                        }
                    });
            }

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function period(Request $request): array
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($request->input('from', now()->subDays(29)->toDateString()))->startOfDay();
        $to = Carbon::parse($request->input('to', now()->toDateString()))->endOfDay();

        return [$from, $to];
    }

    private function safeCsv(?string $value): string
    {
        $value = (string) $value;

        return preg_match('/^[=+\-@]/', $value) ? "'{$value}" : $value;
    }
}
