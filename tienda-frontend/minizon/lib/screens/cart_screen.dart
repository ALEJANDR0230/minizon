import 'package:flutter/material.dart';

import '../store.dart';
import '../theme.dart';
import 'auth_screen.dart';
import 'checkout_screen.dart';
import 'store_shell.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    final lines = store.cart.values.toList();
    return SafeArea(
      child: Column(
        children: [
          ScreenHeader(
            title: 'Tu carrito',
            subtitle: '${store.cartCount} artículos',
          ),
          if (lines.isEmpty)
            const Expanded(
              child: EmptyPanel(
                icon: Icons.shopping_bag_outlined,
                title: 'Tu carrito está vacío',
                message: 'Explora la tienda y agrega lo que te guste.',
              ),
            )
          else ...[
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                itemCount: lines.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final line = lines[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE9EEE9),
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: const Icon(
                              Icons.inventory_2_outlined,
                              color: primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  line.product.name,
                                  maxLines: 2,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 5),
                                Text(
                                  money(line.subtotal),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    color: primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            children: [
                              IconButton(
                                onPressed: () => store.changeQuantity(
                                  line.product,
                                  line.quantity + 1,
                                ),
                                icon: const Icon(Icons.add_circle_outline),
                              ),
                              Text(
                                '${line.quantity}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              IconButton(
                                onPressed: () => store.changeQuantity(
                                  line.product,
                                  line.quantity - 1,
                                ),
                                icon: Icon(
                                  line.quantity == 1
                                      ? Icons.delete_outline
                                      : Icons.remove_circle_outline,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Expanded(child: Text('Total estimado')),
                        Text(
                          money(store.cartTotal),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: ink,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () async {
                          if (await requireCustomerSession(context) &&
                              context.mounted) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const CheckoutScreen(),
                              ),
                            );
                          }
                        },
                        child: Text(
                          store.signedIn
                              ? 'Continuar con la compra'
                              : 'Inicia sesión para comprar',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
