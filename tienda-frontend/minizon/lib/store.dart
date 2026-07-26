import 'package:flutter/material.dart';

import 'api_service.dart';
import 'models.dart';

class StoreState extends ChangeNotifier {
  StoreState(this.api);
  final ApiService api;

  bool initializing = true;
  bool loadingCatalog = false;
  UserAccount? user;
  List<Product> products = [];
  List<Category> categories = [];
  List<StoreOrder> orders = [];
  final Map<int, CartLine> cart = {};

  bool get signedIn => user != null;
  int get cartCount => cart.values.fold(0, (sum, line) => sum + line.quantity);
  double get cartTotal =>
      cart.values.fold(0, (sum, line) => sum + line.subtotal);

  Future<void> initialize() async {
    await api.restoreToken();
    if (api.token != null) {
      try {
        user = await api.me();
      } on ApiException {
        await api.clearToken();
      }
    }
    initializing = false;
    notifyListeners();
    await refreshCatalog();
  }

  Future<void> login(String email, String password) async {
    user = await api.login(email.trim(), password);
    notifyListeners();
    await refreshCatalog();
  }

  Future<void> register(String name, String email, String password) async {
    await api.register(name.trim(), email.trim(), password);
    await login(email, password);
  }

  Future<void> refreshCatalog() async {
    loadingCatalog = true;
    notifyListeners();
    try {
      final result = await Future.wait([api.products(), api.categories()]);
      products = result[0] as List<Product>;
      categories = result[1] as List<Category>;
    } finally {
      loadingCatalog = false;
      notifyListeners();
    }
  }

  Future<void> refreshOrders() async {
    orders = await api.orders();
    notifyListeners();
  }

  void addToCart(Product product, {int quantity = 1}) {
    final current = cart[product.id];
    if (current == null) {
      cart[product.id] = CartLine(
        product: product,
        quantity: quantity.clamp(1, product.stock),
      );
    } else {
      current.quantity = (current.quantity + quantity).clamp(1, product.stock);
    }
    notifyListeners();
  }

  void changeQuantity(Product product, int quantity) {
    if (quantity <= 0) {
      cart.remove(product.id);
    } else {
      cart[product.id]?.quantity = quantity.clamp(1, product.stock);
    }
    notifyListeners();
  }

  Future<StoreOrder> createPendingOrder(
    String name,
    String address,
    String notes,
    String paymentMethod,
  ) async {
    final order = await api.createOrder(
      customerName: name.trim(),
      address: address.trim(),
      paymentMethod: paymentMethod,
      notes: notes.trim().isEmpty ? null : notes.trim(),
      lines: cart.values.toList(),
    );
    cart.clear();
    await refreshOrders();
    notifyListeners();
    return order;
  }

  Future<StoreOrder> confirmPayment(StoreOrder order) async {
    final paidOrder = await api.confirmPayment(order.id);
    await Future.wait([refreshCatalog(), refreshOrders()]);
    notifyListeners();
    return paidOrder;
  }

  Future<void> logout() async {
    await api.logout();
    user = null;
    orders = [];
    notifyListeners();
  }

  Future<void> forceSignedOutIfNeeded(Object error) async {
    if (error is ApiException &&
        (error.status == 401 || error.status == 403) &&
        api.token == null) {
      user = null;
      cart.clear();
      notifyListeners();
    }
  }
}

class StoreScope extends InheritedNotifier<StoreState> {
  const StoreScope({super.key, required StoreState store, required super.child})
    : super(notifier: store);
  static StoreState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<StoreScope>()!.notifier!;
}
