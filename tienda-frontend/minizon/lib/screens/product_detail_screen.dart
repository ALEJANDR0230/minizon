import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'catalog_screen.dart';
import 'auth_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final int productId;
  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? product;
  Object? error;
  int quantity = 1;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (product == null && error == null) load();
  }

  Future<void> load() async {
    try {
      final value = await StoreScope.of(context).api.product(widget.productId);
      if (mounted) setState(() => product = value);
    } catch (reason) {
      if (mounted) setState(() => error = reason);
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = product;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Detalle'),
        actions: [
          IconButton(
            onPressed: item == null
                ? null
                : () async {
                    if (await requireCustomerSession(context) &&
                        context.mounted) {
                      showReviewDialog(context, item, load);
                    }
                  },
            icon: const Icon(Icons.rate_review_outlined),
          ),
        ],
      ),
      body: error != null
          ? Center(child: Text(error.toString()))
          : item == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 120),
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                  child: ProductImage(product: item, height: 330),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.categoryName.toUpperCase(),
                        style: const TextStyle(
                          color: primary,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const Icon(Icons.star_rounded, color: accent, size: 20),
                    Text(
                      ' ${item.rating.toStringAsFixed(1)} (${item.reviewsCount})',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  item.name,
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 12),
                Text(
                  money(item.price),
                  style: const TextStyle(
                    fontSize: 27,
                    color: primary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  item.description.isEmpty
                      ? 'Sin descripción disponible.'
                      : item.description,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Icon(
                      item.stock > 0 ? Icons.check_circle : Icons.cancel,
                      color: item.stock > 0 ? primary : Colors.red,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      item.stock > 0 ? '${item.stock} disponibles' : 'Agotado',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Opiniones',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () async {
                        if (await requireCustomerSession(context) &&
                            context.mounted) {
                          showReviewDialog(context, item, load);
                        }
                      },
                      icon: const Icon(Icons.add),
                      label: const Text('Escribir'),
                    ),
                  ],
                ),
                if (item.reviews.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'Aún no hay opiniones. Sé la primera persona en compartir la tuya.',
                      ),
                    ),
                  )
                else
                  ...item.reviews
                      .take(5)
                      .map(
                        (review) => Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        review.userName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '★' * review.rating,
                                      style: const TextStyle(
                                        color: Color(0xFFE6A526),
                                      ),
                                    ),
                                  ],
                                ),
                                if (review.comment.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(review.comment),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
              ],
            ),
      bottomNavigationBar: item == null
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x18000000),
                      blurRadius: 18,
                      offset: Offset(0, -4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: cream,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: quantity > 1
                                ? () => setState(() => quantity--)
                                : null,
                            icon: const Icon(Icons.remove),
                          ),
                          Text(
                            '$quantity',
                            style: const TextStyle(fontWeight: FontWeight.w900),
                          ),
                          IconButton(
                            onPressed: quantity < item.stock
                                ? () => setState(() => quantity++)
                                : null,
                            icon: const Icon(Icons.add),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: item.stock > 0
                            ? () {
                                StoreScope.of(
                                  context,
                                ).addToCart(item, quantity: quantity);
                                Navigator.pop(context);
                              }
                            : null,
                        icon: const Icon(Icons.shopping_bag_outlined),
                        label: Text(
                          item.stock > 0
                              ? 'Agregar · ${money(item.price * quantity)}'
                              : 'Agotado',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

Future<void> showReviewDialog(
  BuildContext context,
  Product product,
  VoidCallback reload,
) async {
  int rating = 5;
  final comment = TextEditingController();
  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setDialogState) => AlertDialog(
        title: const Text('Escribe tu opinión'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Wrap(
              children: List.generate(
                5,
                (index) => IconButton(
                  onPressed: () => setDialogState(() => rating = index + 1),
                  icon: Icon(
                    index < rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: accent,
                  ),
                ),
              ),
            ),
            TextField(
              controller: comment,
              maxLength: 1000,
              maxLines: 4,
              decoration: const InputDecoration(hintText: '¿Qué te pareció?'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              try {
                await StoreScope.of(
                  context,
                ).api.addReview(product.id, rating, comment.text);
                if (dialogContext.mounted) Navigator.pop(dialogContext, true);
              } catch (error) {
                if (dialogContext.mounted) showError(dialogContext, error);
              }
            },
            child: const Text('Publicar'),
          ),
        ],
      ),
    ),
  );
  comment.dispose();
  if (result == true) reload();
}
