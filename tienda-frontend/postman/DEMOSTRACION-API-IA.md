# Demostración en Postman — API de IA

## Archivos para importar

1. `mitienda-api-ia.postman_collection.json`
2. `mitienda-local.postman_environment.json`

## Preparación

1. Abrir Postman y elegir **Import**.
2. Importar los dos archivos.
3. Seleccionar el entorno **mitienda - servidor local**.
4. En las variables del entorno completar `admin_email` y `admin_password`.
5. No agregar `GROQ_API_KEY` en Postman. La clave permanece en el `.env` privado de Laravel.

## Orden recomendado para exponer

1. Ejecutar **Iniciar sesión y guardar token**. La pestaña Tests guarda automáticamente `admin_token`.
2. Abrir **Preguntar por inventario y stock** y mostrar:
   - método `POST`;
   - URL `/api/admin/advisor/chat`;
   - token Bearer;
   - cuerpo JSON con `message` e `history`;
   - respuesta con `message`, `source` y `generated_at`.
3. Ejecutar **Solicitar una oferta** para demostrar conversación y recomendaciones.
4. Ejecutar **Consultar análisis calculado con MySQL** para demostrar que existen alertas locales aun si Groq falla.
5. Ejecutar **Enriquecer recomendaciones con Groq** para mostrar el resumen generado por IA.
6. Ejecutar **Chat sin token debe ser rechazado** y mostrar el estado `401`.

## Funciones demostradas

| Función | Endpoint | Resultado |
|---|---|---|
| Conversar sobre la tienda | `POST /api/admin/advisor/chat` | Respuesta natural con historial. |
| Revisar stock | `POST /api/admin/advisor/chat` | Prioriza productos con pocas existencias. |
| Proponer ofertas | `POST /api/admin/advisor/chat` | Sugiere descuento y precio estimado. |
| Resumir ventas y pedidos | `POST /api/admin/advisor/chat` | Ingresos, ticket promedio y pedidos pendientes. |
| Revisar reseñas | `POST /api/admin/advisor/chat` | Calificaciones y situaciones relevantes. |
| Alertas sin IA externa | `GET /api/admin/advisor` | Recomendaciones calculadas con MySQL. |
| Análisis con Groq | `POST /api/admin/advisor/generate` | Resumen ejecutivo enriquecido. |
| Seguridad | Todas las rutas `/api/admin/*` | Requieren token administrativo. |

## Respuesta esperada del chat

```json
{
  "message": "Los productos que conviene revisar primero son...",
  "source": "groq",
  "generated_at": "2026-07-15T18:30:00-06:00"
}
```

Si Groq no está disponible, el contrato no cambia; `source` será `local` y la API devolverá una respuesta calculada con MySQL en lugar de dejar el chat sin respuesta.
