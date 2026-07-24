import 'package:flutter/material.dart';
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
  bool confirming = false;

  String get reference => widget.order.paymentReference?.isNotEmpty == true
      ? widget.order.paymentReference!
      : 'MZ-${widget.order.id.toString().padLeft(8, '0')}-${widget.order.total.toStringAsFixed(0).padLeft(4, '0')}';

  String get qrData =>
      'MINIZON|OXXO|ORDER=${widget.order.id}|REFERENCE=$reference|TOTAL=${widget.order.total.toStringAsFixed(2)}';

  Future<void> confirm() async {
    setState(() => confirming = true);
    try {
      final paidOrder = await StoreScope.of(
        context,
      ).confirmPayment(widget.order);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => AlertDialog(
          icon: const Icon(Icons.verified_rounded, size: 58, color: primary),
          title: const Text('Pago confirmado'),
          content: Text(
            'El pedido #${paidOrder.id} quedó pagado. Las existencias ya se actualizaron y el administrador puede preparar el envío.',
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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pago en OXXO'),
        backgroundColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFED1C24),
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Row(
              children: [
                CircleAvatar(
                  backgroundColor: Color(0xFFFFDA00),
                  child: Icon(Icons.storefront, color: Color(0xFFB51218)),
                ),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PAGA EN TIENDA',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Text(
                        'Referencia de pago Minizon',
                        style: TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                children: [
                  Text(
                    'Pedido #${widget.order.id}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    money(widget.order.total),
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
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: ink,
                      ),
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: ink,
                      ),
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
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
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
                    text: 'Conserva tu comprobante y confirma el pago aquí.',
                  ),
                ],
              ),
            ),
          ),
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
                : const Icon(Icons.check_circle_outline),
            label: Text(
              confirming ? 'Validando pago…' : 'Ya pagué · Confirmar pago',
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Modo demostración: el botón simula la confirmación del proveedor de pagos. Para recibir pagos reales en OXXO se necesita contratar un proveedor y validar mediante webhook.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: Color(0xFF6D7772)),
          ),
        ],
      ),
    );
  }
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
