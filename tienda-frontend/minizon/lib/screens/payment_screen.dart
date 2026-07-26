import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, required this.order});
  final StoreOrder order;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final cardFormKey = GlobalKey<FormState>();
  final cardName = TextEditingController();
  final cardNumber = TextEditingController();
  final expiry = TextEditingController();
  final cvv = TextEditingController();
  bool confirming = false;

  bool get isCard => widget.order.paymentMethod == 'card';

  String get reference => widget.order.paymentReference?.isNotEmpty == true
      ? widget.order.paymentReference!
      : 'MZ-${widget.order.id.toString().padLeft(8, '0')}-${widget.order.total.toStringAsFixed(0).padLeft(4, '0')}';

  String get qrData =>
      'MINIZON|OXXO|ORDER=${widget.order.id}|REFERENCE=$reference|TOTAL=${widget.order.total.toStringAsFixed(2)}';

  @override
  void dispose() {
    cardName.dispose();
    cardNumber.dispose();
    expiry.dispose();
    cvv.dispose();
    super.dispose();
  }

  Future<void> confirm() async {
    if (isCard && !cardFormKey.currentState!.validate()) return;
    setState(() => confirming = true);
    try {
      final updatedOrder = await StoreScope.of(
        context,
      ).confirmPayment(widget.order);
      if (!mounted) return;
      final paid = updatedOrder.status == 'paid';
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => AlertDialog(
          icon: Icon(
            paid ? Icons.verified_rounded : Icons.hourglass_top_rounded,
            size: 58,
            color: primary,
          ),
          title: Text(paid ? 'Pago autorizado' : 'Pago enviado a revisión'),
          content: Text(
            paid
                ? 'El pedido #${updatedOrder.id} quedó pagado y el inventario se actualizó.'
                : 'El administrador revisará el pago OXXO del pedido #${updatedOrder.id}. El inventario se descontará cuando lo apruebe.',
            textAlign: TextAlign.center,
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Ver mis pedidos'),
            ),
          ],
        ),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => confirming = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(isCard ? 'Pago con tarjeta' : 'Pago en OXXO'),
      backgroundColor: Colors.transparent,
    ),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        _PaymentHeader(isCard: isCard),
        const SizedBox(height: 18),
        if (isCard)
          _CardPaymentForm(
            formKey: cardFormKey,
            name: cardName,
            number: cardNumber,
            expiry: expiry,
            cvv: cvv,
            order: widget.order,
          )
        else ...[
          _OxxoReference(
            order: widget.order,
            reference: reference,
            qrData: qrData,
          ),
          const SizedBox(height: 16),
          const _OxxoSteps(),
        ],
        const SizedBox(height: 18),
        FilledButton.icon(
          onPressed: confirming ? null : confirm,
          icon: confirming
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Icon(isCard ? Icons.lock_outline : Icons.receipt_long_outlined),
          label: Text(
            confirming
                ? 'Procesando…'
                : isCard
                ? 'Pagar ${money(widget.order.total)}'
                : 'Ya pagué · Enviar a revisión',
          ),
        ),
        const SizedBox(height: 12),
        Text(
          isCard
              ? 'Demostración: Minizon valida el formato y simula una autorización. No se almacena el número, vencimiento ni CVV.'
              : 'El pago OXXO no se marcará como pagado hasta que el administrador revise el comprobante y lo apruebe.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: Color(0xFF6D7772)),
        ),
      ],
    ),
  );
}

class _PaymentHeader extends StatelessWidget {
  const _PaymentHeader({required this.isCard});
  final bool isCard;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: isCard
            ? const [Color(0xFF173E31), Color(0xFF32735A)]
            : const [Color(0xFFED1C24), Color(0xFFB51218)],
      ),
      borderRadius: BorderRadius.circular(22),
    ),
    child: Row(
      children: [
        CircleAvatar(
          backgroundColor: isCard ? Colors.white : const Color(0xFFFFDA00),
          child: Icon(
            isCard ? Icons.credit_card : Icons.storefront,
            color: isCard ? primary : const Color(0xFFB51218),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isCard ? 'PAGO PROTEGIDO' : 'PAGA EN TIENDA',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                isCard
                    ? 'Autorización inmediata'
                    : 'Referencia de pago Minizon',
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _CardPaymentForm extends StatelessWidget {
  const _CardPaymentForm({
    required this.formKey,
    required this.name,
    required this.number,
    required this.expiry,
    required this.cvv,
    required this.order,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController name;
  final TextEditingController number;
  final TextEditingController expiry;
  final TextEditingController cvv;
  final StoreOrder order;

  @override
  Widget build(BuildContext context) => Form(
    key: formKey,
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pedido #${order.id}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              money(order.total),
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w900,
                color: primary,
              ),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: name,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Nombre en la tarjeta',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (value) => (value?.trim().length ?? 0) < 3
                  ? 'Escribe el nombre de la tarjeta'
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: number,
              keyboardType: TextInputType.number,
              maxLength: 16,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                labelText: 'Número de tarjeta',
                hintText: '4242 4242 4242 4242',
                counterText: '',
                prefixIcon: Icon(Icons.credit_card),
              ),
              validator: (value) =>
                  (value?.length ?? 0) != 16 ? 'Escribe los 16 dígitos' : null,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: expiry,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Vencimiento',
                      hintText: 'MMYY',
                      counterText: '',
                    ),
                    validator: _validateExpiry,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: cvv,
                    obscureText: true,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'CVV',
                      counterText: '',
                    ),
                    validator: (value) =>
                        (value?.length ?? 0) < 3 ? 'CVV inválido' : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );

  static String? _validateExpiry(String? value) {
    if (value == null || value.length != 4) return 'Usa MMYY';
    final month = int.tryParse(value.substring(0, 2)) ?? 0;
    return month < 1 || month > 12 ? 'Mes inválido' : null;
  }
}

class _OxxoReference extends StatelessWidget {
  const _OxxoReference({
    required this.order,
    required this.reference,
    required this.qrData,
  });
  final StoreOrder order;
  final String reference;
  final String qrData;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          Text(
            'Pedido #${order.id}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            money(order.total),
            style: const TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              color: ink,
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE1E4DF)),
              borderRadius: BorderRadius.circular(18),
            ),
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 210,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'REFERENCIA',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: primary,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 5),
          SelectableText(
            reference,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    ),
  );
}

class _OxxoSteps extends StatelessWidget {
  const _OxxoSteps();

  @override
  Widget build(BuildContext context) => const Card(
    child: Padding(
      padding: EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Cómo pagar',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
          SizedBox(height: 14),
          _PaymentStep(
            number: '1',
            text: 'Muestra este QR o la referencia en caja.',
          ),
          _PaymentStep(
            number: '2',
            text: 'Paga el importe exacto en efectivo.',
          ),
          _PaymentStep(
            number: '3',
            text: 'Conserva el comprobante y envíalo a revisión.',
          ),
        ],
      ),
    ),
  );
}

class _PaymentStep extends StatelessWidget {
  const _PaymentStep({required this.number, required this.text});
  final String number;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: const Color(0xFFDCECE5),
          child: Text(
            number,
            style: const TextStyle(fontWeight: FontWeight.w900, color: primary),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(text)),
      ],
    ),
  );
}
