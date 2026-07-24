# Despliegue de Minizon en Railway y Hostinger

## Arquitectura de producción

```text
https://minizon.store
https://www.minizon.store
        |
        v
Frontend React/Vite (Railway + Caddy)
        |
        | HTTPS + Authorization: Bearer
        v
https://api.minizon.store/api
Backend Laravel/Sanctum (Railway + FrankenPHP)
        |
        +---- MySQL privado en Railway
        |
        +---- Railway Volume para imágenes
        |
        +---- Groq API (opcional)
```

El dominio canónico es `https://minizon.store`. Caddy responde con una
redirección permanente desde `https://www.minizon.store`.

La aplicación móvil se encuentra en `tienda-frontend/minizon`, pero no forma
parte del servicio frontend de Railway. Al compilar la app móvil se debe usar:

```text
--dart-define=API_URL=https://api.minizon.store/api
```

## Causa del fallo original de Railway

El log mostró que Railpack 0.33.0 analizó la raíz del repositorio:

```text
./
├── Servicios-Web/
├── tienda-frontend/
└── .gitignore
```

Por eso no encontró `Servicios-Web/composer.json` ni
`Servicios-Web/artisan`, no detectó PHP/Laravel y terminó con:

```text
Railpack could not determine how to build the app.
```

La configuración de Root Directory no se había aplicado al build que generó
ese log. `start.sh not found` es una consecuencia de la detección fallida, no
un script que este repositorio deba incluir.

## Servicio backend

### Configuración

| Opción | Valor |
|---|---|
| Source | Repositorio `ALEJANDR0230/minizon` |
| Branch | Rama aprobada o `main` después del merge |
| Root Directory | `/Servicios-Web` |
| Config as Code | `/Servicios-Web/railway.json` |
| Builder | Railpack |
| Build Command | Sin override; usar detección de Railpack |
| Start Command | Sin override; usar FrankenPHP de Railpack |
| Pre-deploy Command | `php artisan migrate --force` |
| Healthcheck | `/up` |

Railway no aplica automáticamente el Root Directory a la ubicación de
Config as Code. Se deben configurar las dos opciones anteriores por separado.

### Variables obligatorias

```text
APP_NAME=Minizon
APP_ENV=production
APP_DEBUG=false
APP_KEY=<GENERAR_Y_GUARDAR_SOLO_EN_RAILWAY>
APP_URL=https://api.minizon.store

LOG_CHANNEL=stderr
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=sync

FILESYSTEM_DISK=public

CORS_ALLOWED_ORIGINS=https://minizon.store,https://www.minizon.store

RAILPACK_SKIP_MIGRATIONS=true
RAILPACK_PHP_EXTENSIONS=pdo_mysql
```

Si el frontend todavía se prueba mediante su dominio temporal, agregar ese
origen exacto a `CORS_ALLOWED_ORIGINS`, separado por coma. Retirarlo cuando los
dominios personalizados funcionen.

`RAILPACK_SKIP_MIGRATIONS=true` es obligatorio. Evita que el arranque
automático de Railpack ejecute migraciones y seeders. Las migraciones se
realizan de forma controlada mediante el pre-deploy de `railway.json`.

### APP_KEY

Desde una copia local con dependencias instaladas:

```bash
cd Servicios-Web
php artisan key:generate --show
```

Copiar el resultado a `APP_KEY` en Railway. No guardarlo en GitHub,
`DEPLOYMENT.md`, capturas ni logs compartidos.

### Inteligencia artificial

Estas variables son necesarias para las funciones que consultan Groq:

```text
GROQ_API_KEY=<SECRETO_SOLO_EN_RAILWAY>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
```

La clave de Groq nunca debe usar un nombre `VITE_*`, porque esas variables se
publican en el bundle del navegador.

### Cachés de Laravel

Las rutas actuales son compatibles con:

```bash
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache
```

Railpack realiza la optimización al iniciar. No ejecutar `optimize:clear`
antes de crear las tablas cuando `CACHE_STORE=database`, porque intentaría
acceder a la tabla `cache`.

### Colas

El código actual no despacha trabajos ni contiene clases `ShouldQueue`.
`QUEUE_CONNECTION=sync` evita crear un worker que la aplicación no necesita.
Si se agregan trabajos asíncronos en el futuro, crear un servicio Railway
separado con `php artisan queue:work`.

## Base de datos MySQL

1. En el proyecto Railway, seleccionar **New → Database → MySQL**.
2. Conservar el volumen y las credenciales generados por Railway.
3. En el servicio backend, crear referencias a:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
4. Usar la red privada, no el TCP Proxy público, desde Laravel.
5. Habilitar backups antes de cargar datos de producción.

No copiar manualmente valores de conexión a GitHub. Si el servicio se llama
distinto de `MySQL`, sustituir ese nombre en las referencias `${{...}}`.

### Migraciones

El pre-deploy autorizado es:

```bash
php artisan migrate --force
```

No usar:

```text
php artisan migrate:fresh
php artisan migrate:refresh
php artisan db:wipe
php artisan db:seed
```

Los seeders contienen datos de demostración y no deben ejecutarse en
producción.

Antes de una migración con cambios destructivos:

1. crear un backup;
2. revisar `php artisan migrate:status`;
3. probar en un entorno Railway separado;
4. desplegar en una ventana controlada.

## Autenticación y CORS

El proyecto utiliza tokens personales de Laravel Sanctum:

```text
Authorization: Bearer <token>
```

El panel guarda su token en `localStorage`; la app móvil usa almacenamiento
local. No se utilizan cookies SPA de Sanctum.

Por lo tanto:

- `supports_credentials=false`;
- no configurar `SESSION_DOMAIN=.minizon.store`;
- no configurar `SANCTUM_STATEFUL_DOMAINS`;
- no solicitar `/sanctum/csrf-cookie`;
- permitir `Accept`, `Authorization` y `Content-Type`;
- exponer `Content-Disposition` para nombres de archivos CSV.

Los únicos orígenes permanentes son:

```text
https://minizon.store
https://www.minizon.store
```

No usar `*` en producción.

## Imágenes y almacenamiento persistente

Las imágenes se escriben en:

```text
/app/storage/app/public/products
```

Crear un Railway Volume montado en:

```text
/app/storage/app/public
```

Railpack crea el enlace `public/storage`. Sin volumen, las imágenes subidas se
perderán al reemplazar el contenedor.

Para múltiples réplicas o distribución mediante CDN, migrar posteriormente a
S3, Cloudflare R2 o Railway Storage Buckets e instalar el adaptador Flysystem
correspondiente. No guardar credenciales de almacenamiento en el repositorio.

## Servicio frontend

### Configuración

| Opción | Valor |
|---|---|
| Source | Repositorio `ALEJANDR0230/minizon` |
| Branch | Rama aprobada o `main` después del merge |
| Root Directory | `/tienda-frontend` |
| Config as Code | `/tienda-frontend/railway.json` |
| Builder | Railpack |
| Install | Detección npm mediante `package-lock.json` |
| Build | `npm run build`, detectado por Railpack |
| Start | Caddy estático de Railpack |
| Output | `dist` |
| Healthcheck | `/health` |

No configurar `npx serve` ni un Start Command manual. Railpack detecta Vite,
construye `dist` y usa el `Caddyfile` versionado.

### Variables

```text
VITE_API_URL=https://api.minizon.store/api
RAILPACK_NODE_VERSION=24
```

Las variables `VITE_*` se incorporan durante `npm run build`. Cambiar
`VITE_API_URL` requiere un nuevo build y despliegue.

### SPA y redirección canónica

El `Caddyfile`:

- escucha el `PORT` asignado por Railway;
- sirve `dist`;
- devuelve `index.html` para rutas de React;
- comprime respuestas;
- expone `/health`;
- redirige `www.minizon.store` a `minizon.store` con HTTP 301.

## Dominios temporales

Antes de tocar DNS:

1. generar un dominio `*.up.railway.app` para cada servicio;
2. comprobar `/up` en backend;
3. comprobar `/health` y rutas internas en frontend;
4. configurar temporalmente `VITE_API_URL` con el dominio Railway del backend;
5. incluir el dominio temporal del frontend en CORS;
6. probar login, productos, imágenes y reportes.

No configurar `minizon.store` hasta que ambos servicios funcionen mediante
sus dominios temporales.

## Custom Domains en Railway

En **Settings → Networking → Public Networking → Custom Domain**:

Frontend:

```text
minizon.store
www.minizon.store
```

Backend:

```text
api.minizon.store
```

Railway mostrará los registros DNS de enrutamiento y los TXT de verificación.
Copiar exactamente esos valores; no usar ejemplos de terceros.

## DNS en Hostinger

Ruta de hPanel:

```text
Dominios
→ Portafolio de dominios
→ Administrar minizon.store
→ DNS / Nameservers
→ Registros DNS
```

### Dominio raíz

```text
Tipo: REGISTRO_INDICADO_POR_RAILWAY
Nombre/Host: @
Destino: VALOR_ENTREGADO_POR_RAILWAY_PARA_MINIZON_STORE
TTL: Predeterminado
```

Si Railway entrega un CNAME para `@`, Hostinger puede mostrarlo como ALIAS
después de guardarlo.

### www

```text
Tipo: CNAME
Nombre/Host: www
Destino: VALOR_ENTREGADO_POR_RAILWAY_PARA_WWW
TTL: Predeterminado
```

### API

```text
Tipo: CNAME
Nombre/Host: api
Destino: VALOR_ENTREGADO_POR_RAILWAY_PARA_API
TTL: Predeterminado
```

Agregar también cada TXT de verificación con el nombre y valor exactos que
muestre Railway.

Eliminar o modificar únicamente registros A, AAAA, CNAME o ALIAS que entren
en conflicto con `@`, `www` o `api`.

No eliminar:

- MX;
- SPF;
- DKIM;
- DMARC;
- TXT de correo;
- registros de verificación de servicios legítimos.

La propagación suele tardar minutos u horas, pero puede requerir hasta 72
horas. Railway mostrará un check verde cuando verifique el dominio y emitirá
automáticamente el certificado HTTPS.

## Despliegues futuros

1. Crear una rama desde `main`.
2. Ejecutar localmente:

```bash
cd Servicios-Web
composer validate
composer install
php artisan test

cd ../tienda-frontend
npm ci
npm run lint
npm run build
```

3. Abrir PR y revisar los cambios de migraciones.
4. Probar con un PR Environment o servicio de staging.
5. Hacer merge únicamente tras aprobación.
6. Railway construirá ambos servicios desde sus Root Directories.
7. El pre-deploy aplicará migraciones pendientes.
8. Verificar health checks y logs.

## Rollback

Para código:

1. abrir el historial de Deployments del servicio;
2. seleccionar la última versión estable;
3. usar **Rollback**;
4. comprobar `/up` o `/health`.

Un rollback de código no deshace migraciones. Si una migración necesita
revertirse, preparar y probar primero una migración compensatoria. No ejecutar
`migrate:rollback` a ciegas en producción.

Para DNS, Hostinger conserva historial de la zona DNS. Restaurarlo solo si los
valores anteriores han sido verificados y sin sobrescribir registros de
correo añadidos después.

## Lista de comprobación posterior

### Backend

- [ ] Deployment Successful.
- [ ] Railpack analizó el contenido de `/Servicios-Web`.
- [ ] `/up` responde 200.
- [ ] `https://api.minizon.store` tiene HTTPS válido.
- [ ] `/api/products` responde.
- [ ] MySQL conecta por red privada.
- [ ] `php artisan migrate:status` no muestra migraciones pendientes.
- [ ] `APP_DEBUG=false`.
- [ ] Los logs aparecen en Railway.
- [ ] No se exponen secretos.
- [ ] El volumen conserva una imagen después de redeploy.

### Frontend

- [ ] Deployment Successful.
- [ ] `https://minizon.store` carga.
- [ ] `www` redirige una sola vez al dominio raíz.
- [ ] Recargar `/admin/productos` no devuelve 404.
- [ ] El bundle usa `https://api.minizon.store/api`.
- [ ] Login y logout funcionan.
- [ ] Las solicitudes incluyen el Bearer token.
- [ ] No hay errores CORS.
- [ ] Las imágenes se cargan desde `api.minizon.store`.
- [ ] Los reportes CSV se descargan con nombre.

### DNS y HTTPS

- [ ] `minizon.store` resuelve al frontend.
- [ ] `www.minizon.store` resuelve al frontend.
- [ ] `api.minizon.store` resuelve al backend.
- [ ] Los TXT de Railway están verificados.
- [ ] Los tres hosts tienen certificados válidos.
- [ ] No hay registros A, AAAA, CNAME o ALIAS conflictivos.
- [ ] Los registros de correo permanecen intactos.

## Problemas conocidos y pasos pendientes

- Las pruebas `ProductPurchaseTest` todavía describen rutas retiradas y fallan
  con 404/405. Es un problema previo a esta preparación de despliegue.
- npm mantiene un aviso alto en React Router relacionado con funciones RSC.
  Este frontend es una SPA cliente y no usa RSC, pero se debe actualizar cuando
  exista una versión 7 corregida y compatible.
- El despliegue real, las migraciones, DNS y HTTPS solo pueden verificarse en
  Railway y Hostinger.
- No ejecutar seeders de demostración en producción.
