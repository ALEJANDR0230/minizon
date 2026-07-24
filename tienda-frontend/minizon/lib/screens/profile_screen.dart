import 'package:flutter/material.dart';

import '../api_service.dart';
import '../store.dart';
import '../theme.dart';
import 'auth_screen.dart';
import 'store_shell.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    if (!store.signedIn) {
      return SafeArea(
        child: Column(
          children: [
            const ScreenHeader(
              title: 'Mi cuenta',
              subtitle: 'Comprar es opcional; explorar es gratis',
            ),
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(36),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircleAvatar(
                        radius: 40,
                        backgroundColor: Color(0xFFDCECE5),
                        child: Icon(
                          Icons.person_outline,
                          size: 40,
                          color: primary,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Explora sin cuenta',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Regístrate solamente cuando quieras comprar, reseñar o consultar tus pedidos.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 22),
                      FilledButton(
                        onPressed: () => requireCustomerSession(context),
                        child: const Text('Iniciar sesión o crear cuenta'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }
    final user = store.user!;
    return SafeArea(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const ScreenHeader(title: 'Mi perfil', subtitle: 'Tu cuenta Minizon'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Column(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 34,
                          backgroundColor: const Color(0xFFDCECE5),
                          child: Text(
                            user.name.isEmpty
                                ? 'M'
                                : user.name[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.name,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(user.email),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Card(
                  child: Column(
                    children: [
                      _ProfileItem(
                        icon: Icons.verified_user_outlined,
                        title: 'Cuenta protegida',
                        subtitle:
                            'Tu sesión usa un acceso privado y revocable.',
                      ),
                      Divider(height: 1, indent: 68),
                      _ProfileItem(
                        icon: Icons.privacy_tip_outlined,
                        title: 'Privacidad de la IA',
                        subtitle:
                            'No puede ver datos de otros clientes ni información administrativa.',
                      ),
                      Divider(height: 1, indent: 68),
                      _ProfileItem(
                        icon: Icons.support_agent,
                        title: 'Ayuda',
                        subtitle:
                            'Contacta al administrador si tienes un problema con tu cuenta.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.cloud_outlined, color: primary),
                    title: const Text('Conexión del servidor'),
                    subtitle: Text(
                      apiBaseUrl,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: busy
                        ? null
                        : () async {
                            setState(() => busy = true);
                            try {
                              await store.logout();
                            } catch (error) {
                              if (context.mounted) showError(context, error);
                            }
                            if (mounted) setState(() => busy = false);
                          },
                    icon: const Icon(Icons.logout),
                    label: Text(busy ? 'Cerrando sesión…' : 'Cerrar sesión'),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Minizon 1.0.0', style: TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileItem extends StatelessWidget {
  const _ProfileItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7),
    leading: Container(
      padding: const EdgeInsets.all(9),
      decoration: BoxDecoration(
        color: const Color(0xFFDCECE5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: primary),
    ),
    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
    subtitle: Text(subtitle),
  );
}
