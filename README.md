# Contract Engine 100 · Field System 5.0

Frontend estático, iPhone-first y orientado a registro contractual, verificación documental y protección del trabajador.

## Estructura

- index.html: shell de la aplicación.
- styles/world-ui.css: sistema visual local.
- app/schema.js: esquema declarativo y catálogo de 100 optimizaciones.
- app/engine.js: validación, riesgo, hashing, documentos y persistencia.
- app/ui.js: renderizado accesible.
- app/main.js: orquestación de eventos y flujo.
- verify.html: verificación estática.
- manifest.webmanifest: instalación tipo app.

## UX/UI

La interfaz usa una composición inspirada en patrones públicos de aplicaciones financieras móviles: métrica principal, acciones rápidas, tarjetas compactas y navegación inferior. World Money indica actualmente un nuevo diseño orientado a finanzas y su ficha de App Store identifica la versión 4.0.2900. La implementación aquí mantiene identidad, código y activos propios.

## Seguridad y protección

Las respuestas privadas no se persisten en localStorage ni se incluyen en el QR público. Los campos restringidos pueden cubrirse en la huella de integridad sin exponerse.

La capa de protección utiliza señales para revisión humana. No implementa propiedad sobre personas, confinamiento, retención coercitiva ni control coercitivo del movimiento.

## Firma

WebAuthn solo se detecta como capacidad. La firma solo se prepara. No se simulan credenciales, biometría ni firmas cualificadas.

## Producción

Antes de producción faltan backend, autorización por rol, almacenamiento cifrado, WebAuthn real, proveedor de firma, verificación server-side, OCR/document intelligence, CSP, gestión de claves, observabilidad y revisión jurídica por jurisdicción.