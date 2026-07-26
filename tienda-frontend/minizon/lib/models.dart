class UserAccount {
  const UserAccount({
    required this.id,
    required this.name,
    required this.email,
  });

  final int id;
  final String name;
  final String email;

  factory UserAccount.fromJson(Map<String, dynamic> json) => UserAccount(
    id: _asInt(json['id']),
    name: json['name']?.toString() ?? '',
    email: json['email']?.toString() ?? '',
  );
}

class Category {
  const Category({required this.id, required this.name, required this.slug});

  final int id;
  final String name;
  final String slug;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: _asInt(json['id']),
    name: json['name']?.toString() ?? '',
    slug: json['slug']?.toString() ?? '',
  );
}

class Review {
  const Review({
    required this.id,
    required this.rating,
    required this.comment,
    required this.userName,
  });

  final int id;
  final int rating;
  final String comment;
  final String userName;

  factory Review.fromJson(Map<String, dynamic> json) => Review(
    id: _asInt(json['id']),
    rating: _asInt(json['rating']),
    comment: json['comment']?.toString() ?? '',
    userName: (json['user'] as Map?)?['name']?.toString() ?? 'Cliente',
  );
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    required this.imageUrl,
    required this.categoryName,
    required this.rating,
    required this.reviewsCount,
    required this.reviews,
  });

  final int id;
  final String name;
  final String description;
  final double price;
  final int stock;
  final String? imageUrl;
  final String categoryName;
  final double rating;
  final int reviewsCount;
  final List<Review> reviews;

  factory Product.fromJson(Map<String, dynamic> json) {
    final reviewsJson = json['reviews'] as List? ?? const [];
    final category = json['category'];
    return Product(
      id: _asInt(json['id']),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      price: _asDouble(json['price']),
      stock: _asInt(json['stock']),
      imageUrl: json['image_url']?.toString(),
      categoryName: category is Map
          ? category['name']?.toString() ?? 'General'
          : category?.toString() ?? 'General',
      rating: _asDouble(json['reviews_avg_rating']),
      reviewsCount: _asInt(json['reviews_count']),
      reviews: reviewsJson
          .whereType<Map>()
          .map((item) => Review.fromJson(Map<String, dynamic>.from(item)))
          .toList(),
    );
  }
}

class CartLine {
  CartLine({required this.product, this.quantity = 1});

  final Product product;
  int quantity;
  double get subtotal => product.price * quantity;
}

class OrderLine {
  const OrderLine({
    required this.name,
    required this.quantity,
    required this.subtotal,
  });
  final String name;
  final int quantity;
  final double subtotal;

  factory OrderLine.fromJson(Map<String, dynamic> json) => OrderLine(
    name:
        json['product_name']?.toString() ??
        (json['product'] as Map?)?['name']?.toString() ??
        'Producto',
    quantity: _asInt(json['quantity']),
    subtotal: _asDouble(json['subtotal']),
  );
}

class StoreOrder {
  const StoreOrder({
    required this.id,
    required this.status,
    required this.total,
    required this.customerName,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.paymentReference,
    required this.createdAt,
    required this.paidAt,
    required this.paymentReportedAt,
    required this.items,
  });

  final int id;
  final String status;
  final double total;
  final String customerName;
  final String shippingAddress;
  final String? paymentMethod;
  final String? paymentReference;
  final DateTime? createdAt;
  final DateTime? paidAt;
  final DateTime? paymentReportedAt;
  final List<OrderLine> items;

  factory StoreOrder.fromJson(Map<String, dynamic> json) => StoreOrder(
    id: _asInt(json['id']),
    status: json['status']?.toString() ?? 'pending',
    total: _asDouble(json['total']),
    customerName: json['customer_name']?.toString() ?? '',
    shippingAddress: json['shipping_address']?.toString() ?? '',
    paymentMethod: json['payment_method']?.toString(),
    paymentReference: json['payment_reference']?.toString(),
    createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    paidAt: DateTime.tryParse(json['paid_at']?.toString() ?? ''),
    paymentReportedAt: DateTime.tryParse(
      json['payment_reported_at']?.toString() ?? '',
    ),
    items: (json['items'] as List? ?? const [])
        .whereType<Map>()
        .map((item) => OrderLine.fromJson(Map<String, dynamic>.from(item)))
        .toList(),
  );
}

class ChatReply {
  const ChatReply({required this.message, required this.products});
  final String message;
  final List<Product> products;
}

class PostalAddress {
  const PostalAddress({
    required this.postalCode,
    required this.state,
    required this.places,
  });

  final String postalCode;
  final String state;
  final List<String> places;

  factory PostalAddress.fromJson(Map<String, dynamic> json) {
    final rawPlaces = (json['places'] as List? ?? const [])
        .whereType<Map>()
        .toList();
    return PostalAddress(
      postalCode: json['post code']?.toString() ?? '',
      state: rawPlaces.isEmpty
          ? ''
          : rawPlaces.first['state']?.toString() ?? '',
      places: rawPlaces
          .map((place) => place['place name']?.toString() ?? '')
          .where((place) => place.isNotEmpty)
          .toSet()
          .toList(),
    );
  }
}

int _asInt(dynamic value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;
double _asDouble(dynamic value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
