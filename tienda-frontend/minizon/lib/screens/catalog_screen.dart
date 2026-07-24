import 'package:flutter/material.dart';

import '../api_service.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'auth_screen.dart';
import 'product_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, required this.onOpenCart});
  final VoidCallback onOpenCart;
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  String query = '';
  int? categoryId;

  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    final visible = store.products.where((product) {
      final search = query.toLowerCase();
      final matchesText =
          product.name.toLowerCase().contains(search) ||
          product.description.toLowerCase().contains(search);
      final category = categoryId == null
          ? null
          : store.categories.where((item) => item.id == categoryId).firstOrNull;
      return matchesText &&
          (category == null || product.categoryName == category.name);
    }).toList();

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: store.refreshCatalog,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(22, 20, 22, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            store.signedIn
                                ? 'Hola, ${store.user!.name.split(' ').first}'
                                : 'Explora sin registrarte',
                            style: const TextStyle(
                              color: primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Encuentra algo increíble',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                        ],
                      ),
                    ),
                    if (!store.signedIn)
                      IconButton(
                        onPressed: () => requireCustomerSession(context),
                        tooltip: 'Iniciar sesión',
                        icon: const Icon(Icons.person_outline),
                      ),
                    IconButton.filledTonal(
                      onPressed: widget.onOpenCart,
                      icon: Badge(
                        isLabelVisible: store.cartCount > 0,
                        label: Text('${store.cartCount}'),
                        child: const Icon(Icons.shopping_bag_outlined),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(22, 8, 22, 12),
                child: TextField(
                  onChanged: (value) => setState(() => query = value.trim()),
                  decoration: const InputDecoration(
                    hintText: 'Buscar productos',
                    prefixIcon: Icon(Icons.search),
                    suffixIcon: Icon(Icons.tune),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 52,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                  children: [
                    FilterChip(
                      label: const Text('Todo'),
                      selected: categoryId == null,
                      onSelected: (_) => setState(() => categoryId = null),
                    ),
                    const SizedBox(width: 8),
                    ...store.categories.map(
                      (category) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(category.name),
                          selected: categoryId == category.id,
                          onSelected: (_) =>
                              setState(() => categoryId = category.id),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (store.loadingCatalog && store.products.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (visible.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text('No encontramos productos con esos filtros.'),
                ),
              )
            else ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 12, 22, 12),
                  child: Text(
                    '${visible.length} productos',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                sliver: SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: .66,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: visible.length,
                  itemBuilder: (context, index) =>
                      ProductCard(product: visible[index]),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.compact = false});
  final Product product;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: ProductImage(product: product)),
            Padding(
              padding: const EdgeInsets.fromLTRB(13, 12, 13, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.categoryName.toUpperCase(),
                    maxLines: 1,
                    style: const TextStyle(
                      color: primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .8,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          money(product.price),
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: ink,
                          ),
                        ),
                      ),
                      IconButton.filled(
                        onPressed: product.stock > 0
                            ? () {
                                store.addToCart(product);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('${product.name} agregado'),
                                    behavior: SnackBarBehavior.floating,
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              }
                            : null,
                        visualDensity: VisualDensity.compact,
                        icon: const Icon(Icons.add_shopping_cart, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProductImage extends StatelessWidget {
  const ProductImage({super.key, required this.product, this.height});
  final Product product;
  final double? height;
  @override
  Widget build(BuildContext context) {
    final url = product.imageUrl;
    return Container(
      height: height,
      width: double.infinity,
      color: const Color(0xFFE9EEE9),
      child: url != null && url.isNotEmpty
          ? Image.network(
              resolveMediaUrl(url),
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Icon(
                Icons.inventory_2_outlined,
                size: 54,
                color: Color(0xFF90A098),
              ),
            )
          : const Icon(
              Icons.inventory_2_outlined,
              size: 54,
              color: Color(0xFF90A098),
            ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
