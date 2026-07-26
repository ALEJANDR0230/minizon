import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'auth_screen.dart';
import 'payment_screen.dart';
import 'store_shell.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  bool loaded = false;
  bool loading = false;
  Object? error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!loaded && StoreScope.of(context).signedIn) load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await StoreScope.of(context).refreshOrders();
      loaded = true;
    } catch (reason) {
      error = reason;
      if (mounted) await StoreScope.of(context).forceSignedOutIfNeeded(reason);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    final orders = store.orders;
    return SafeArea(
      child: Column(
        children: [
          ScreenHeader(
            title: 'Mis pedidos',
            subtitle: 'Consulta el avance de tus compras',
            trailing: IconButton.filledTonal(
              onPressed: !store.signedIn || loading ? null : load,
              icon: const Icon(Icons.refresh),
            ),
          ),
          if (!store.signedIn)
            Expanded(
              child: _OrdersLogin(
                onSignedIn: () {
                  loaded = false;
                  load();
                },
              ),
            )
          else if (loading && orders.isEmpty)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (error != null && orders.isEmpty)
            Expanded(
              child: EmptyPanel(
                icon: Icons.cloud_off_outlined,
                title: 'No pudimos cargar tus pedidos',
                message: error.toString(),
              ),
            )
          else if (orders.isEmpty)
            const Expanded(
              child: EmptyPanel(
                icon: Icons.receipt_long_outlined,
                title: 'Aún no tienes pedidos',
                message: 'Cuando hagas una compra aparecerá aquí.',
              ),
            )
          else
            Expanded(
              child: RefreshIndicator(
                onRefresh: load,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
                  itemCount: orders.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) =>
                      OrderCard(order: orders[index]),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _OrdersLogin extends StatelessWidget {
  const _OrdersLogin({required this.onSignedIn});
  final VoidCallback onSignedIn;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.receipt_long_outlined, size: 54, color: primary),
          const SizedBox(height: 18),
          Text(
            'Inicia sesión para ver tus pedidos',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Puedes explorar todos los productos sin crear una cuenta.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              if (await requireCustomerSession(context)) onSignedIn();
            },
            child: const Text('Iniciar sesión o registrarme'),
          ),
        ],
      ),
    ),
  );
}

class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.order});
  final StoreOrder order;
  @override
  Widget build(BuildContext context) {
    final status = order.paymentReportedAt != null && order.status == 'pending'
        ? (
            'Pago OXXO en revisión',
            Colors.amber.shade800,
            Icons.fact_check_outlined,
          )
        : statusInfo(order.status);
    final date = order.createdAt == null
        ? ''
        : '${order.createdAt!.day}/${order.createdAt!.month}/${order.createdAt!.year}';
    return Card(
      child: ExpansionTile(
        shape: const Border(),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: status.$2.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(status.$3, color: status.$2),
        ),
        title: Text(
          'Pedido #${order.id}',
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        subtitle: Text('${status.$1}${date.isEmpty ? '' : ' · $date'}'),
        trailing: Text(
          money(order.total),
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(),
                ...order.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text('${item.quantity} × ${item.name}'),
                        ),
                        Text(money(item.subtotal)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Entrega: ${order.shippingAddress}',
                  style: const TextStyle(fontSize: 12),
                ),
                if (order.status == 'pending' &&
                    order.paymentReportedAt == null) ...[
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PaymentScreen(order: order),
                        ),
                      ),
                      icon: Icon(
                        order.paymentMethod == 'card'
                            ? Icons.credit_card
                            : Icons.qr_code_2,
                      ),
                      label: Text(
                        order.paymentMethod == 'card'
                            ? 'Completar pago con tarjeta'
                            : 'Ver QR y pagar',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

(String, Color, IconData) statusInfo(String value) => switch (value) {
  'paid' => ('Pagado', Colors.blue, Icons.payments_outlined),
  'shipped' => ('En camino', Colors.indigo, Icons.local_shipping_outlined),
  'delivered' => ('Entregado', primary, Icons.check_circle_outline),
  'cancelled' => ('Cancelado', Colors.red, Icons.cancel_outlined),
  _ => ('Pendiente', Colors.orange, Icons.schedule),
};
