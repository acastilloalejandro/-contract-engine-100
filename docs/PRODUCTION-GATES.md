# Gates de producción · Contract Engine 100

No presentar la aplicación como lista para producción hasta que se hayan completado todas las puertas aplicables y se hayan guardado las evidencias de verificación.


## Estado actualizado de seguridad y autorización (9 de octubre de 2026)

El commit actual de `main` mantiene el producto como demo estática: `config.js` tiene `authBaseUrl: ""` y `workers/api/wrangler.toml` aún contiene un UUID D1 de marcador y dominios de ejemplo. No hay evidencia en el repositorio de que la API real esté desplegada, de que se hayan configurado los secretos del proveedor, ni de que se haya ejecutado una prueba de autorización contra una instancia real de D1.

- [x] CodeQL, auditoría npm, CI y despliegue de GitHub Pages ejecutados correctamente en el commit integrado que añadió cabeceras más estrictas al Worker.
- [x] Guía de configuración administrativa: [GITHUB-SECURITY-SETTINGS.md](GITHUB-SECURITY-SETTINGS.md).
- [x] Matriz de pruebas de autorización negativas y dependencias operativas: [AUTHORIZATION-TESTS.md](AUTHORIZATION-TESTS.md).
- [ ] Activar y verificar en la cuenta de GitHub MFA resistente a phishing, políticas de Actions, secretos, Dependency Graph y protección de `main` con PR y checks requeridos.
- [ ] Desplegar Worker y D1 en el dominio propio, aplicar esquema/migraciones y configurar secretos en Cloudflare.
- [ ] Ejecutar pruebas E2E de autorización con dos cuentas distintas: acceso cruzado a expediente, sesión, desafíos, estado de identidad y cualquier futuro recurso documental debe ser denegado.
- [ ] Probar cookies y sesión en navegadores reales, webhook real en modo de prueba, revocación, rate limiting, restore de copias y borrado/retención.
- [x] Añadida en código la reserva atómica de intentos OTP, deduplicación de eventos de Stripe y protección de transiciones de identidad fuera de orden; existen pruebas simuladas para esos casos.
- [ ] Si D1 se inicializó desde un esquema anterior, aplicar `workers/api/migrations/20261009_webhook_idempotency.sql` antes del Worker nuevo. En una base nueva, usar únicamente el `workers/api/schema.sql` actual.
- [ ] Verificar la lógica de migración, deduplicación y eventos fuera de orden contra una instancia D1 real y webhooks de Stripe en modo de prueba.
- [ ] Conseguir revisión de seguridad independiente y corregir los hallazgos antes de aceptar datos reales.

Los tests con D1 simulado prueban invariantes del Worker; no prueban configuración administrativa, infraestructura, cookies de terceros ni aislamiento real de datos en producción. Un resultado verde de CI no sustituye esas comprobaciones.

## Historial de una rama candidata anterior (referencia histórica)

- [ ] PR [#13](https://github.com/acastilloalejandro/-contract-engine-100/pull/13) contiene el endurecimiento local y la vista previa imprimible; ejecutar los checks del SHA más reciente antes de fusionar.
- [x] Implementados en la rama: versión sincronizada, ausencia de jurisdicción predeterminada, minimización de campos privados/restringidos en borrador JSON y huella, validación inicial de archivos en cliente, persistencia local de adjuntos, QR local, etiqueta «NO VERIFICADO», CSP meta, shell PWA versionado y borrador contractual imprimible.
- [ ] Repetir CI completa tras añadir la vista previa contractual y su CSS de impresión; no reutilizar el resultado verde de un SHA anterior.
- [ ] Probar la URL publicada en Safari/iOS y en un navegador de escritorio; el contenido de la rama aún no está publicado en Pages.
- [ ] Desplegar API y D1, configurar proveedores y ejecutar integración end-to-end. `config.js` conserva `authBaseUrl: ""`; la autenticación real no está activa.
- [ ] Revisar la [matriz de las 50 optimizaciones](OPTIMIZATION-ROADMAP-50.md); la matriz diferencia trabajo aplicado, parcial y bloqueado.

## Historial verificado de la versión 5.1.0 (9 de octubre de 2026)

- [x] Versión 5.1.0 integrada en `main`, commit `444c3f7fd675ac8febb25a2514d3587fa209ebf0`.
- [x] CI `Contract Engine CI`: ejecución [#142](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410270) completada correctamente para la entrega anterior.
- [x] `contract-os`: ejecución [#132](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410267) completada correctamente para la entrega anterior.
- [x] GitHub Pages: ejecución [#2](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410276) completada correctamente para la entrega anterior.


## 1. Entrega y despliegue

- [x] CI de la versión integrada completa correctamente.
- [x] Workflow de publicación estática completo correctamente.
- [ ] Abrir la URL pública en Safari y al menos un navegador de escritorio; comprobar apariencia, consola, manifest, navegación, borrador, impresión y QR después del despliegue 5.2.0.
- [x] Añadida comprobación automatizada de URL y recursos esenciales tras cada despliegue en el workflow de Pages; queda pendiente observar un despliegue real y confirmar manualmente la apariencia en Safari/iOS y escritorio.
- [ ] Verificar configuración de dominio y política de caché para futuras actualizaciones.

## 2. Backend y configuración

- [ ] Crear Worker de Cloudflare y base D1 reales; sustituir `REPLACE_WITH_D1_DATABASE_UUID`.
- [ ] Aplicar `workers/api/schema.sql` a la base remota y validar migraciones.
- [ ] Elegir un dominio propio y publicar frontend/API bajo el mismo dominio registrable (por ejemplo `app.example.com` y `api.example.com`).
- [ ] Configurar `APP_ORIGIN`, `API_ORIGIN`, `authBaseUrl` y los dominios de identidad permitidos con los valores de producción exactos.
- [ ] Guardar credenciales mediante secretos de Cloudflare: Resend, Google, Apple, Twilio y Stripe. Ningún secreto debe almacenarse en GitHub ni en `config.js`.
- [ ] Configurar los URI de retorno de OAuth y el webhook de Stripe en cada proveedor.
- [ ] Comprobar `GET /health` y validar flujos de registro, confirmación de correo, login, logout, recuperación de contraseña, OAuth, OTP y verificación documental con cuentas de prueba.
- [ ] Probar cookies y sesiones en Safari/iOS, Chrome y Firefox, incluyendo caducidad, revocación y uso entre pestañas.

## 3. Seguridad y privacidad

- [ ] Revisión independiente de autenticación, autorización por recurso/rol, aislamiento entre usuarios y validación de entradas.
- [ ] Protección CSRF, CSP y cabeceras seguras verificadas en el dominio definitivo.
- [ ] Limitar abuso con rate limiting revisado, mitigación de bots/WAF, alertas y respuestas genéricas que eviten enumeración de cuentas.
- [ ] Definir retención, exportación y borrado de datos; probar borrado de cuenta y revocación de sesiones.
- [ ] Implementar almacenamiento de documentos cifrado, control de acceso, URLs firmadas, registro de auditoría y política de recuperación.
- [ ] Probar restauración de copias de seguridad y el procedimiento de respuesta a incidentes.
- [ ] Realizar evaluación de privacidad y revisión RGPD/LOPDGDD para los datos y proveedores seleccionados.
- [ ] Realizar pruebas de penetración y revisión de dependencias antes de aceptar datos reales.

## 4. Documentos, firma y verificación

- [ ] Persistencia server-side de expedientes, con versiones inmutables y snapshots de las reglas utilizadas.
- [ ] Renderizado determinista y pruebas de salida PDF/DOCX si se habilitan esos formatos.
- [ ] Integrar proveedor de firma y verificar las firmas en servidor; preparar una solicitud no equivale a firmar.
- [ ] Asegurar que QR y endpoint público exponen solo datos aprobados y nunca documentos privados, identificadores sensibles ni secretos.
- [ ] Validar las reglas jurídicas, fuentes autorizadas, jurisdicción, fechas efectivas y casos de regresión con profesionales competentes.
- [ ] Completar pruebas end-to-end y pruebas de accesibilidad con las pantallas finales.

## 5. Criterio de lanzamiento

La última publicación conocida, 5.1.0, está publicada como **demo estática**; la rama 5.2.0 candidata sigue sin ser producción, no como servicio contractual completo. No se debe habilitar producción general hasta que todas las casillas bloqueantes estén verificadas, documentadas y aprobadas. Si un gate no aplica, documentar la justificación en vez de marcarlo como superado.
