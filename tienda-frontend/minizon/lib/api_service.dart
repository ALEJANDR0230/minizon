import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://minizon-api-alejandro9513.azurewebsites.net/api',
);

String resolveMediaUrl(String value) {
  if (!value.startsWith('/')) return value;
  final apiUri = Uri.parse(apiBaseUrl);
  return apiUri.replace(path: value, query: null, fragment: null).toString();
}

class ApiException implements Exception {
  const ApiException(this.message, this.status);
  final String message;
  final int status;
  @override
  String toString() => message;
}

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;
  String? token;

  Future<void> restoreToken() async {
    token = (await SharedPreferences.getInstance()).getString('minizon_token');
  }

  Future<void> saveToken(String value) async {
    token = value;
    await (await SharedPreferences.getInstance()).setString(
      'minizon_token',
      value,
    );
  }

  Future<void> clearToken() async {
    token = null;
    await (await SharedPreferences.getInstance()).remove('minizon_token');
  }

  Future<dynamic> request(
    String path, {
    String method = 'GET',
    Object? body,
    bool authenticated = false,
  }) async {
    final uri = Uri.parse(
      '${apiBaseUrl.replaceAll(RegExp(r'/+$'), '')}/${path.replaceAll(RegExp(r'^/+'), '')}',
    );
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }
    if (authenticated && token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    http.Response response;
    try {
      response = await _client
          .send(
            http.Request(method, uri)
              ..headers.addAll(headers)
              ..body = body == null ? '' : jsonEncode(body),
          )
          .then(http.Response.fromStream)
          .timeout(const Duration(seconds: 15));
    } catch (_) {
      throw const ApiException(
        'No pudimos conectar con el servidor de Minizon. Estar conectado a internet no es suficiente: el teléfono y el servidor deben estar en la misma red y la dirección del servidor debe seguir siendo la misma.',
        0,
      );
    }

    dynamic data;
    try {
      data = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body);
    } catch (_) {
      data = <String, dynamic>{};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (response.statusCode == 401 && authenticated) {
        await clearToken();
      }
      final errors = data is Map ? data['errors'] as Map? : null;
      final validation = errors?.values
          .whereType<List>()
          .expand((value) => value)
          .map((value) => value.toString())
          .join(' ');
      throw ApiException(
        data is Map && data['message'] != null
            ? data['message'].toString()
            : validation?.isNotEmpty == true
            ? validation!
            : 'Ocurrió un problema al procesar la solicitud.',
        response.statusCode,
      );
    }
    return data;
  }

  Future<UserAccount> login(String email, String password) async {
    final data =
        await request(
              'auth/login',
              method: 'POST',
              body: {'email': email, 'password': password},
            )
            as Map;
    if (data['role'] == 'admin') {
      throw const ApiException(
        'Usa una cuenta de cliente en la aplicación.',
        403,
      );
    }
    await saveToken(data['token'].toString());
    return UserAccount.fromJson(Map<String, dynamic>.from(data['user'] as Map));
  }

  Future<void> register(String name, String email, String password) => request(
    'auth/register',
    method: 'POST',
    body: {'name': name, 'email': email, 'password': password},
  );

  Future<UserAccount> me() async => UserAccount.fromJson(
    Map<String, dynamic>.from(
      await request('auth/me', authenticated: true) as Map,
    ),
  );

  Future<List<Product>> products() async => (await request('products') as List)
      .whereType<Map>()
      .map((item) => Product.fromJson(Map<String, dynamic>.from(item)))
      .toList();

  Future<List<Category>> categories() async =>
      (await request('categories') as List)
          .whereType<Map>()
          .map((item) => Category.fromJson(Map<String, dynamic>.from(item)))
          .toList();

  Future<Product> product(int id) async => Product.fromJson(
    Map<String, dynamic>.from(await request('products/$id') as Map),
  );

  Future<List<StoreOrder>> orders() async =>
      (await request('orders', authenticated: true) as List)
          .whereType<Map>()
          .map((item) => StoreOrder.fromJson(Map<String, dynamic>.from(item)))
          .toList();

  Future<StoreOrder> createOrder({
    required String customerName,
    required String address,
    String? notes,
    required List<CartLine> lines,
  }) async => StoreOrder.fromJson(
    Map<String, dynamic>.from(
      await request(
            'orders',
            method: 'POST',
            authenticated: true,
            body: {
              'customer_name': customerName,
              'shipping_address': address,
              'notes': notes,
              'items': lines
                  .map(
                    (line) => {
                      'product_id': line.product.id,
                      'quantity': line.quantity,
                    },
                  )
                  .toList(),
            },
          )
          as Map,
    ),
  );

  Future<StoreOrder> confirmPayment(int orderId) async {
    final data =
        await request(
              'orders/$orderId/confirm-payment',
              method: 'POST',
              authenticated: true,
            )
            as Map;
    return StoreOrder.fromJson(Map<String, dynamic>.from(data['order'] as Map));
  }

  Future<PostalAddress> lookupPostalCode(String postalCode) async {
    http.Response response;
    try {
      response = await _client
          .get(Uri.parse('https://api.zippopotam.us/MX/$postalCode'))
          .timeout(const Duration(seconds: 10));
    } catch (_) {
      throw const ApiException(
        'No pudimos consultar el código postal. Intenta nuevamente.',
        0,
      );
    }

    if (response.statusCode == 404) {
      throw const ApiException(
        'No encontramos ese código postal en México.',
        404,
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const ApiException(
        'El buscador de códigos postales no está disponible.',
        503,
      );
    }

    final address = PostalAddress.fromJson(
      Map<String, dynamic>.from(jsonDecode(response.body) as Map),
    );
    if (address.places.isEmpty) {
      throw const ApiException(
        'No encontramos colonias para ese código postal.',
        404,
      );
    }
    return address;
  }

  Future<void> addReview(int productId, int rating, String comment) => request(
    'products/$productId/reviews',
    method: 'POST',
    authenticated: true,
    body: {'rating': rating, 'comment': comment},
  );

  Future<ChatReply> chat(
    String message,
    List<Map<String, String>> history,
  ) async {
    final data =
        await request(
              'ai/chat',
              method: 'POST',
              authenticated: true,
              body: {
                'message': message,
                'history': history.takeLast(8).toList(),
              },
            )
            as Map;
    final suggestions = (data['suggested_products'] as List? ?? const [])
        .whereType<Map>()
        .map((item) {
          final map = Map<String, dynamic>.from(item);
          map['description'] = '';
          map['reviews_count'] = 0;
          return Product.fromJson(map);
        })
        .toList();
    return ChatReply(
      message: data['message']?.toString() ?? '',
      products: suggestions,
    );
  }

  Future<void> logout() async {
    try {
      await request('auth/logout', method: 'POST', authenticated: true);
    } finally {
      await clearToken();
    }
  }
}

extension<T> on Iterable<T> {
  Iterable<T> takeLast(int count) {
    final list = toList();
    return list.skip(list.length > count ? list.length - count : 0);
  }
}
