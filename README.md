# Contract Engine 100 · Field System 5.0

Frontend estático, iPhone-first y orientado a registro contractual, verificación documental y protección del trabajador.

## Estructura

- index.html: shell de la aplicación.
- styles/world-ui.css: sistema visual local.
- app/schema.js: esquema declarativo y catálogo de optimizaciones.
- app/engine.js: validación, riesgo, hashing, documentos y persistencia local.
- app/ui.js: renderizado accesible.
- app/main.js: orquestación de eventos y flujo.
- app/auth.js: adaptador de autenticación e incorporación conectado a un backend externo; no simula autenticación.
- app/onboarding-ui.js: puerta de acceso, registro, inicio de sesión y pasos de verificación.
- config.js: configuración pública para la API y lista permitida de dominios de identidad.
- tests/onboarding.test.mjs: pruebas del acceso, minimización de datos y redirecciones OAuth.
- docs/AUTH-ONBOARDING.md: contrato API, flujo de alta y requisitos de seguridad.
- workers/api/src/index.js: backend Cloudflare Worker para sesiones, OAuth, email, OTP y verificación de identidad.
- workers/api/schema.sql: esquema D1.
- workers/api/wrangler.toml y workers/api/README.md: configuración de despliegue y secretos.
- verify.html: verificación estática.
- manifest.webmanifest: instalación tipo app.

## Autenticación e incorporación

La rama de integración incluye una pantalla de acceso, modo demo separado, formulario de registro/inicio de sesión, botones OAuth y pasos de OTP e identidad. Para habilitar el acceso real se debe configurar `config.js` con el endpoint HTTPS del backend y los hosts del proveedor de identidad. La UI no simula verificación. Los borradores del frontend siguen siendo locales y no están cifrados; consulta [docs/AUTH-ONBOARDING.md](docs/AUTH-ONBOARDING.md).

## Seguridad y protección

Las respuestas privadas no se persisten en localStorage ni se incluyen en el QR público. Los campos restringidos pueden cubrirse en la huella de integridad sin exponerse.

La capa de protección utiliza señales para revisión humana. No implementa propiedad sobre personas, confinamiento, retención coercitiva ni control coercitivo del movimiento.

## Firma

WebAuthn solo se detecta como capacidad. La firma solo se prepara. No se simulan credenciales, biometría ni firmas cualificadas.

## Producción

Se ha añadido una implementación de referencia del backend en workers/api, pero todavía no está desplegada ni configurada con credenciales. Antes de producción faltan autorización por rol, almacenamiento cifrado de documentos contractuales, WebAuthn real, proveedor de firma, OCR/document intelligence, CSP, gestión de claves, observabilidad, recuperación de cuenta, política de retención y revisión jurídica por jurisdicción. Consulta workers/api/README.md. La web de GitHub Pages debe tratarse como demo hasta que se despliegue el backend y se use un dominio compatible con cookies seguras.
