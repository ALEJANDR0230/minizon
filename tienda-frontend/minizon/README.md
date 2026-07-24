# Minizon

Aplicación Flutter para clientes conectada a la API REST de Laravel de la tienda.

## Funciones

- Registro e inicio de sesión de clientes.
- Catálogo público: no se necesita una cuenta para explorar productos o llenar el carrito.
- Catálogo, categorías, búsqueda, detalle y existencias.
- Carrito, creación de pedidos y seguimiento de estado.
- Pago OXXO de demostración con referencia y QR.
- El inventario se descuenta al confirmar el pago, no al generar el pedido.
- Reseñas de productos.
- Asistente de IA limitado al catálogo y a los pedidos del usuario autenticado.
- Revocación automática de la sesión cuando el administrador bloquea la cuenta.

El registro se solicita únicamente al confirmar una compra, escribir una reseña,
consultar pedidos o acceder al asistente personal.

## Conexión con el servidor

La URL se inyecta al compilar para no dejarla fija en el código:

```text
flutter build apk --release --dart-define=API_URL=https://dominio-del-servidor/api
```

El APK de esta entrega fue compilado para la red local con:

```text
http://192.168.1.69:5173/api
```

El puerto 5173 corresponde al proxy del frontend administrativo, que publica la API
de Laravel en la red local. Tanto Laravel como Vite deben permanecer encendidos.
Para distribuirlo por Internet se debe desplegar Laravel en una URL HTTPS pública y
recompilar con esa dirección.

## APK

El archivo instalable se encuentra en `build/app/outputs/flutter-apk/Minizon.apk`.

## Pago real

El botón de confirmación simula la notificación de un proveedor. Para aceptar
dinero real en OXXO se debe contratar un proveedor compatible y confirmar el
pago desde un webhook firmado en Laravel; nunca desde el teléfono del cliente.
