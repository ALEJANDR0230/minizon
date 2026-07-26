import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'payment_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final postalCode = TextEditingController();
  final street = TextEditingController();
  final references = TextEditingController();
  PostalAddress? postalAddress;
  String? selectedPlace;
  bool searchingPostal = false;
  bool busy = false;
  String paymentMethod = 'oxxo';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (name.text.isEmpty) name.text = StoreScope.of(context).user?.name ?? '';
  }

  @override
  void dispose() {
    name.dispose();
    postalCode.dispose();
    street.dispose();
    references.dispose();
    super.dispose();
  }

  Future<bool> searchPostalCode() async {
    final value = postalCode.text.trim();
    if (!RegExp(r'^\d{5}$').hasMatch(value)) {
      showError(context, 'Escribe un código postal de 5 números.');
      return false;
    }

    setState(() {
      searchingPostal = true;
      postalAddress = null;
      selectedPlace = null;
    });
    try {
      final result = await StoreScope.of(context).api.lookupPostalCode(value);
      if (!mounted) return false;
      setState(() {
        postalAddress = result;
        selectedPlace = result.places.first;
      });
      return true;
    } catch (error) {
      if (mounted) showError(context, error);
      return false;
    } finally {
      if (mounted) setState(() => searchingPostal = false);
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    if (postalAddress == null && !await searchPostalCode()) return;
    if (!mounted || selectedPlace == null) return;

    final fullAddress = [
      street.text.trim(),
      selectedPlace!,
      'C.P. ${postalCode.text.trim()}',
      postalAddress!.state,
      'México',
    ].where((part) => part.isNotEmpty).join(', ');

    setState(() => busy = true);
    try {
      final order = await StoreScope.of(context).createPendingOrder(
        name.text,
        fullAddress,
        references.text,
        paymentMethod,
      );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => PaymentScreen(order: order)),
      );
    } catch (error) {
      if (mounted) {
        await StoreScope.of(context).forceSignedOutIfNeeded(error);
        if (mounted) showError(context, error);
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = StoreScope.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dirección de entrega'),
        backgroundColor: Colors.transparent,
      ),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              '¿Dónde entregamos?',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text(
              'Empieza con tu código postal y completaremos automáticamente tu zona.',
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: postalCode,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.search,
              maxLength: 5,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) {
                if (postalAddress != null) {
                  setState(() {
                    postalAddress = null;
                    selectedPlace = null;
                  });
                }
              },
              onFieldSubmitted: (_) => searchPostalCode(),
              decoration: InputDecoration(
                labelText: 'Código postal',
                hintText: 'Ejemplo: 01000',
                counterText: '',
                prefixIcon: const Icon(Icons.markunread_mailbox_outlined),
                suffixIcon: searchingPostal
                    ? const Padding(
                        padding: EdgeInsets.all(14),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : IconButton(
                        onPressed: searchPostalCode,
                        tooltip: 'Buscar código postal',
                        icon: const Icon(Icons.search),
                      ),
              ),
              validator: (value) =>
                  !RegExp(r'^\d{5}$').hasMatch(value?.trim() ?? '')
                  ? 'Escribe un código postal de 5 números'
                  : null,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: searchingPostal ? null : searchPostalCode,
                icon: const Icon(Icons.location_searching),
                label: const Text('Buscar mi zona'),
              ),
            ),
            if (postalAddress != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCECE5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${postalAddress!.state}, México',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                initialValue: selectedPlace,
                decoration: const InputDecoration(
                  labelText: 'Colonia o localidad',
                  prefixIcon: Icon(Icons.map_outlined),
                ),
                items: postalAddress!.places
                    .map(
                      (place) =>
                          DropdownMenuItem(value: place, child: Text(place)),
                    )
                    .toList(),
                onChanged: (value) => setState(() => selectedPlace = value),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: street,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Calle y número',
                  hintText: 'Ejemplo: Av. Reforma 125, interior 3',
                  prefixIcon: Icon(Icons.home_outlined),
                ),
                validator: (value) => (value?.trim().length ?? 0) < 5
                    ? 'Escribe la calle y el número'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Nombre de quien recibe',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) => (value?.trim().length ?? 0) < 2
                    ? 'Escribe el nombre de quien recibe'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: references,
                maxLength: 1000,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Referencias o información extra (opcional)',
                  hintText:
                      'Color de la casa, entre qué calles está, portón, piso o instrucciones para entregar',
                  prefixIcon: Icon(Icons.assistant_direction_outlined),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    ...store.cart.values.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${line.quantity} × ${line.product.name}',
                              ),
                            ),
                            Text(
                              money(line.subtotal),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Total',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        Text(
                          money(store.cartTotal),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              'Método de pago',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            _PaymentMethodTile(
              selected: paymentMethod == 'oxxo',
              icon: Icons.storefront_outlined,
              title: 'Efectivo en OXXO',
              subtitle: 'Recibe un QR. El administrador validará tu pago.',
              onTap: () => setState(() => paymentMethod = 'oxxo'),
            ),
            const SizedBox(height: 10),
            _PaymentMethodTile(
              selected: paymentMethod == 'card',
              icon: Icons.credit_card,
              title: 'Tarjeta',
              subtitle: 'Autorización inmediata dentro de Minizon.',
              onTap: () => setState(() => paymentMethod = 'card'),
            ),
            const SizedBox(height: 22),
            FilledButton.icon(
              onPressed: busy || postalAddress == null ? null : submit,
              icon: busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(
                      paymentMethod == 'oxxo'
                          ? Icons.qr_code_2
                          : Icons.lock_outline,
                    ),
              label: Text(
                busy
                    ? 'Preparando pago…'
                    : paymentMethod == 'oxxo'
                    ? 'Generar referencia OXXO'
                    : 'Continuar con tarjeta',
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Verificaremos precio y existencias nuevamente al confirmar el pago.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  const _PaymentMethodTile({
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: selected ? const Color(0xFFDCECE5) : Colors.white,
    shape: RoundedRectangleBorder(
      side: BorderSide(
        color: selected ? primary : const Color(0xFFE1E4DF),
        width: selected ? 2 : 1,
      ),
      borderRadius: BorderRadius.circular(17),
    ),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(17),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: selected ? primary : ink),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 3),
                  Text(subtitle, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? primary : const Color(0xFF9AA39F),
            ),
          ],
        ),
      ),
    ),
  );
}
