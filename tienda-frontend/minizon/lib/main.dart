import 'package:flutter/material.dart';

import 'api_service.dart';
import 'screens/store_shell.dart';
import 'store.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final store = StoreState(ApiService());
  runApp(MinizonApp(store: store));
  store.initialize();
}

class MinizonApp extends StatelessWidget {
  const MinizonApp({super.key, required this.store});
  final StoreState store;

  @override
  Widget build(BuildContext context) {
    return StoreScope(
      store: store,
      child: MaterialApp(
        title: 'Minizon',
        debugShowCheckedModeBanner: false,
        theme: minizonTheme(),
        home: AnimatedBuilder(
          animation: store,
          builder: (context, _) {
            if (store.initializing) return const SplashScreen();
            return const StoreShell();
          },
        ),
      ),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          BrandMark(size: 76),
          SizedBox(height: 20),
          Text(
            'MINIZON',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              letterSpacing: 3,
            ),
          ),
          SizedBox(height: 28),
          SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
        ],
      ),
    ),
  );
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 52});
  final double size;
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: primary,
      borderRadius: BorderRadius.circular(size * .32),
      boxShadow: const [
        BoxShadow(
          color: Color(0x33205745),
          blurRadius: 22,
          offset: Offset(0, 10),
        ),
      ],
    ),
    child: Icon(Icons.shopping_bag_rounded, color: accent, size: size * .55),
  );
}
