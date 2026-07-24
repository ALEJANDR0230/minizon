import 'package:flutter_test/flutter_test.dart';
import 'package:minizon/models.dart';

void main() {
  test('convierte los datos del producto enviados por Laravel', () {
    final product = Product.fromJson({
      'id': 7,
      'name': 'Mochila',
      'description': 'Resistente',
      'price': '349.90',
      'stock': 4,
      'image_url': null,
      'category': {'name': 'Accesorios'},
      'reviews_avg_rating': '4.5',
      'reviews_count': 2,
      'reviews': [],
    });

    expect(product.id, 7);
    expect(product.price, 349.9);
    expect(product.categoryName, 'Accesorios');
    expect(product.stock, 4);
  });

  test('calcula el subtotal de una línea del carrito', () {
    final product = Product.fromJson({
      'id': 1,
      'name': 'Producto',
      'price': 125,
      'stock': 10,
    });
    expect(CartLine(product: product, quantity: 3).subtotal, 375);
  });

  test('acepta la categoría de una sugerencia de IA como texto', () {
    final product = Product.fromJson({
      'id': 4,
      'name': 'Audífonos',
      'price': 700,
      'stock': 8,
      'category': 'General',
    });

    expect(product.categoryName, 'General');
  });

  test('convierte las colonias encontradas por código postal', () {
    final address = PostalAddress.fromJson({
      'post code': '01000',
      'places': [
        {'place name': 'San Angel', 'state': 'Distrito Federal'},
        {'place name': 'Villa Obregon', 'state': 'Distrito Federal'},
      ],
    });

    expect(address.postalCode, '01000');
    expect(address.state, 'Distrito Federal');
    expect(address.places, ['San Angel', 'Villa Obregon']);
  });
}
