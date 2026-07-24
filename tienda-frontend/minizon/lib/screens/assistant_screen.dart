import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'auth_screen.dart';
import 'product_detail_screen.dart';
import 'store_shell.dart';

class ChatMessage {
  const ChatMessage(this.role, this.content, {this.products = const []});
  final String role;
  final String content;
  final List<Product> products;
}

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});
  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final input = TextEditingController();
  final scroll = ScrollController();
  bool sending = false;
  final messages = <ChatMessage>[
    const ChatMessage(
      'assistant',
      '¡Hola! Soy el asistente de Minizon. Puedo ayudarte con el catálogo, comparar productos, revisar existencias y consultar tus propios pedidos.',
    ),
  ];

  @override
  void dispose() {
    input.dispose();
    scroll.dispose();
    super.dispose();
  }

  Future<void> send([String? suggestion]) async {
    final text = (suggestion ?? input.text).trim();
    if (text.isEmpty || sending) {
      return;
    }
    setState(() {
      messages.add(ChatMessage('user', text));
      input.clear();
      sending = true;
    });
    scrollDown();
    try {
      final history = messages
          .take(messages.length - 1)
          .map((item) => {'role': item.role, 'content': item.content})
          .toList();
      final reply = await StoreScope.of(context).api.chat(text, history);
      if (mounted) {
        setState(
          () => messages.add(
            ChatMessage('assistant', reply.message, products: reply.products),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        await StoreScope.of(context).forceSignedOutIfNeeded(error);
        if (mounted) {
          setState(
            () => messages.add(
              ChatMessage(
                'assistant',
                'No pude responder en este momento. ${error.toString()}',
              ),
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => sending = false);
      }
      scrollDown();
    }
  }

  void scrollDown() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (scroll.hasClients) {
      scroll.animateTo(
        scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    }
  });

  @override
  Widget build(BuildContext context) {
    if (!StoreScope.of(context).signedIn) {
      return SafeArea(
        child: Column(
          children: [
            const ScreenHeader(
              title: 'Asistente Minizon',
              subtitle: 'Ayuda segura para tus compras',
            ),
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(36),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.auto_awesome, size: 58, color: primary),
                      const SizedBox(height: 18),
                      Text(
                        'Tu asistente personal',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'El catálogo es público. Para consultar información personal y tus pedidos, inicia sesión.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: () => requireCustomerSession(context),
                        child: const Text('Iniciar sesión o registrarme'),
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
    return SafeArea(
      child: Column(
        children: [
          const ScreenHeader(
            title: 'Asistente Minizon',
            subtitle: 'Ayuda segura para tus compras',
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(18, 0, 18, 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFDCECE5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, color: primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Solo conoce el catálogo y la información de tu propia cuenta. No comparte datos administrativos ni de otros usuarios.',
                    style: TextStyle(fontSize: 12, color: ink),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 42,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              children: [
                _Prompt('¿Qué puedo comprar con \$500?', send),
                _Prompt('¿Qué producto recomiendas?', send),
                _Prompt('¿Dónde está mi pedido?', send),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
              itemCount: messages.length + (sending ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == messages.length) return const _Thinking();
                final message = messages[index];
                final mine = message.role == 'user';
                return Align(
                  alignment: mine
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.sizeOf(context).width * .82,
                    ),
                    child: Column(
                      crossAxisAlignment: mine
                          ? CrossAxisAlignment.end
                          : CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 15,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: mine ? primary : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(18),
                              topRight: const Radius.circular(18),
                              bottomLeft: Radius.circular(mine ? 18 : 4),
                              bottomRight: Radius.circular(mine ? 4 : 18),
                            ),
                          ),
                          child: Text(
                            message.content,
                            style: TextStyle(
                              color: mine ? Colors.white : ink,
                              height: 1.4,
                            ),
                          ),
                        ),
                        if (message.products.isNotEmpty)
                          ...message.products.map(
                            (product) => Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(
                                      productId: product.id,
                                    ),
                                  ),
                                ),
                                leading: const CircleAvatar(
                                  backgroundColor: Color(0xFFDCECE5),
                                  child: Icon(
                                    Icons.inventory_2_outlined,
                                    color: primary,
                                  ),
                                ),
                                title: Text(product.name, maxLines: 1),
                                subtitle: Text(money(product.price)),
                                trailing: const Icon(Icons.chevron_right),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 10, 10),
            color: Colors.white,
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: input,
                      maxLength: 1000,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        counterText: '',
                        hintText: 'Pregunta sobre productos o tus pedidos',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        fillColor: Colors.white,
                      ),
                    ),
                  ),
                  IconButton.filled(
                    onPressed: sending ? null : send,
                    icon: const Icon(Icons.arrow_upward_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Prompt extends StatelessWidget {
  const _Prompt(this.text, this.onTap);
  final String text;
  final ValueChanged<String> onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: ActionChip(label: Text(text), onPressed: () => onTap(text)),
  );
}

class _Thinking extends StatelessWidget {
  const _Thinking();
  @override
  Widget build(BuildContext context) => const Align(
    alignment: Alignment.centerLeft,
    child: Card(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        child: SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    ),
  );
}
