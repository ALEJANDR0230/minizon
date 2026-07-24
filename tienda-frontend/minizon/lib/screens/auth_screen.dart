import 'package:flutter/material.dart';

import '../api_service.dart';
import '../main.dart';
import '../store.dart';
import '../theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool register = false;
  bool obscure = true;
  bool busy = false;

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      final store = StoreScope.of(context);
      if (register) {
        await store.register(name.text, email.text, password.text);
      } else {
        await store.login(email.text, password.text);
      }
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context, true);
      }
    } on ApiException catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: BrandMark(size: 62),
                    ),
                    const SizedBox(height: 34),
                    Text(
                      register
                          ? 'Crea tu cuenta'
                          : 'Todo lo que buscas,\nen un solo lugar.',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      register
                          ? 'Únete a Minizon y empieza a comprar.'
                          : 'Inicia sesión para descubrir productos, comprar y seguir tus pedidos.',
                    ),
                    const SizedBox(height: 34),
                    if (register) ...[
                      TextFormField(
                        controller: name,
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(
                          labelText: 'Nombre completo',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (value) => (value?.trim().length ?? 0) < 2
                            ? 'Escribe tu nombre'
                            : null,
                      ),
                      const SizedBox(height: 14),
                    ],
                    TextFormField(
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                      validator: (value) =>
                          !RegExp(r'^.+@.+\..+$').hasMatch(value?.trim() ?? '')
                          ? 'Escribe un correo válido'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: password,
                      obscureText: obscure,
                      onFieldSubmitted: (_) => submit(),
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => obscure = !obscure),
                          icon: Icon(
                            obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) => (value?.length ?? 0) < 8
                          ? 'Usa al menos 8 caracteres'
                          : null,
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: busy ? null : submit,
                      child: busy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              register ? 'Crear cuenta' : 'Entrar a Minizon',
                            ),
                    ),
                    const SizedBox(height: 14),
                    TextButton(
                      onPressed: busy
                          ? null
                          : () => setState(() => register = !register),
                      child: Text(
                        register
                            ? 'Ya tengo cuenta'
                            : '¿Aún no tienes cuenta? Regístrate',
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Row(
                      children: [
                        Icon(Icons.shield_outlined, size: 18, color: primary),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tu información se usa únicamente para tus compras y pedidos.',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Servidor: $apiBaseUrl',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF89918D),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<bool> requireCustomerSession(BuildContext context) async {
  if (StoreScope.of(context).signedIn) {
    return true;
  }
  final result = await Navigator.push<bool>(
    context,
    MaterialPageRoute(builder: (_) => const AuthScreen()),
  );
  return result == true && context.mounted && StoreScope.of(context).signedIn;
}
