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
- docs/AUTH-ONBOARDING.md: contrato API, flujo de alta y requisitos de seguridad.
- verify.html: verificación estática.
- manifest.webmanifest: instalación tipo app.

## Autenticación e incorporación

La rama de integración de autenticación introduce un adaptador para registro convencional, Google/Apple, verificación OTP de teléfono y verificación de identidad mediante proveedor. Requiere un backend real configurado en `window.CONTRACT_ENGINE_CONFIG.authBaseUrl`. El adaptador no puede verificar usuarios desde GitHub Pages por sí solo. Consulta [docs/AUTH-ONBOARDING.md](docs/AUTH-ONBOARDING.md).

## Seguridad y protección

Las respuestas privadas no se persisten en localStorage ni se incluyen en el QR público. Los campos restringidos pueden cubrirse en la huella de integridad sin exponerse.

La capa de protección utiliza señales para revisión humana. No implementa propiedad sobre personas, confinamiento, retención coercitiva ni control coercitivo del movimiento.

## Firma

WebAuthn solo se detecta como capacidad. La firma solo se prepara. No se simulan credenciales, biometría ni firmas cualificadas.

## Producción

Antes de producción faltan backend, autorización por rol, almacenamiento cifrado, WebAuthn real, proveedor de firma, verificación server-side, OCR/document intelligence, CSP, gestión de claves, observabilidad y revisión jurídica por jurisdicción. GitHub Pages debe tratarse como demo estática hasta que se despliegue y audite el backend.
