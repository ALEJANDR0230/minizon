# mitienda — panel administrativo

Aplicación web React + Vite para la administración de la tienda. El navegador es exclusivo para el administrador; los clientes se conectarán desde una aplicación móvil mediante la API REST de Laravel.

## Acceso y rutas del navegador

- `/iniciar-sesion`: acceso exclusivo del administrador.
- `/admin`: dashboard con métricas, gráficas y alertas.
- `/admin/productos`: inventario y productos.
- `/admin/categorias`: categorías.
- `/admin/pedidos`: seguimiento de pedidos móviles.
- `/admin/clientes-moviles`: cuentas de la aplicación móvil.
- `/admin/resenas`: moderación de reseñas.
- `/admin/reportes`: informes imprimibles y exportación CSV.
- `/admin/asesor-ia`: chat administrativo y recomendaciones de ofertas y situaciones.

Las antiguas páginas públicas de catálogo, carrito, registro, pedidos y asistente de clientes fueron retiradas del frontend.

## Base de datos

Laravel está conectado a MySQL 8.4:

- Base: `tienda_admin`
- Usuario de aplicación: `tienda_app`
- Conexión final: `mysql`
- Configuración privada: `/home/alejandro/Servicios-Web/.env` en el servidor Ubuntu.

Los datos de SQLite fueron migrados y verificados tabla por tabla. El archivo SQLite se conserva únicamente dentro del respaldo de migración; la aplicación ya no lo usa.

## API REST

Backend en el servidor:

```text
/home/alejandro/Servicios-Web
```

Rutas principales para la app móvil:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/categories`
- `GET|POST /api/orders`
- `GET /api/orders/{id}`
- `GET|POST /api/products/{id}/reviews`

Rutas privadas del administrador:

- `POST /api/auth/admin/login`
- `GET /api/admin/dashboard`
- `/api/admin/products`
- `/api/admin/categories`
- `/api/admin/orders`
- `/api/admin/users`
- `/api/admin/reviews`
- `GET /api/admin/reports/summary`
- `GET /api/admin/reports/export`
- `GET /api/admin/advisor`
- `POST /api/admin/advisor/generate`
- `POST /api/admin/advisor/chat`

Todas las rutas `/api/admin/*` requieren token de administrador.

### Demostración con Postman

La carpeta `postman/` contiene una colección, un entorno local y una guía de exposición. Incluye autenticación automática, chat con IA, inventario, ofertas, ventas, pedidos, reseñas y pruebas de seguridad.

## Inteligencia artificial

La clave de Groq se guarda únicamente en el `.env` privado de Laravel como `GROQ_API_KEY`. Nunca debe colocarse en `.env` del frontend ni en una variable `VITE_*`, porque eso la expondría al navegador.

El área de recomendaciones siempre calcula alertas y ofertas con MySQL. Al elegir **Actualizar sugerencias**, intenta enriquecer el análisis con Groq; si el servicio externo falla, conserva las recomendaciones locales y muestra un aviso claro.

## Organización del frontend

```text
src/
├── api/                 cliente HTTP y descargas CSV
├── components/
│   ├── admin/           gráficas y alertas
│   ├── auth/            protección de rutas
│   └── ui/              componentes reutilizables
├── context/             sesión administrativa
├── hooks/               acceso al contexto
├── layouts/             estructura del panel
├── pages/
│   ├── admin/           vistas separadas por módulo
│   └── auth/            inicio de sesión
├── styles/              base, layout, componentes y páginas
└── utils/               formato de moneda y fechas
```

## Configuración local

El frontend usa la redirección NAT local del servidor:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Comandos:

```bash
npm install
npm run dev
npm run lint
npm run build
```
