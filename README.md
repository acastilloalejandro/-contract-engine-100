# Contract Engine 100 · Field System 5.1.0

Motor contractual modular, móvil primero, para crear expedientes guiados, validar datos y separar los datos privados del contenido compartible.

> **Estado de esta versión:** candidata de actualización en una rama de trabajo. La URL pública de GitHub Pages no cambia hasta que se integre y despliegue la versión. La autenticación del backend sigue sin desplegar ni configurar con credenciales reales.

## Qué incluye

- Formulario declarativo, validación, reglas de revisión, documentos, hashing de integridad, borrador local y QR con datos públicos mínimos.
- Acceso y onboarding para correo/contraseña, Google/Apple, OTP y verificación documental a través de proveedores externos.
- API de referencia en Cloudflare Workers + D1 para sesiones, OAuth, correo, teléfono y estado de identidad.
- Pruebas automatizadas de UI, invariantes, autenticación, onboarding y API.
- Arquitectura modular para que empleo doméstico, alquiler residencial y otros contratos mantengan esquemas y reglas separados.

## Estructura principal

- `index.html`, `styles/world-ui.css`: interfaz accesible y adaptable.
- `app/schema.js`, `app/engine.js`, `app/ui.js`, `app/main.js`: esquema, lógica contractual, renderizado y orquestación.
- `app/auth.js`, `app/onboarding-ui.js`, `config.js`: adaptador de acceso y configuración pública sin secretos.
- `src/`, `schema/`, `legal/`: contratos de tipos, validación y registro de reglas.
- `workers/api/src/index.js`, `workers/api/schema.sql`, `workers/api/wrangler.toml`: backend Cloudflare de referencia.
- `tests/`: regresiones y pruebas de invariantes.
- [Arquitectura modular](docs/MODULE-ARCHITECTURE.md), [estrategia de producto](docs/PRODUCT-STRATEGY.md), [onboarding y seguridad](docs/AUTH-ONBOARDING.md), [límites de producción](docs/PRODUCTION-GATES.md).
- [Historial de cambios](CHANGELOG.md).

## Versión 5.1.0

- Versión del paquete y de la interfaz sincronizadas.
- CI migrada a Node.js 24 LTS y acciones mantenidas de GitHub Actions.
- Instalación reproducible con `npm ci` y lockfile, aunque el núcleo no depende de paquetes npm.
- CLI de Wrangler documentada con versión exacta para que las instrucciones no cambien bajo los pies del despliegue.

## Ejecutar y verificar localmente

Requisitos: Node.js 24 o superior.

```sh
npm ci --ignore-scripts
npm test
```

Para la API, revisa [workers/api/README.md](workers/api/README.md). No despliegues hasta sustituir el UUID ficticio de D1, configurar los orígenes HTTPS y guardar todas las credenciales exclusivamente en los secretos de Cloudflare.

## Seguridad y límites reales

La demo no acredita una identidad ni crea una firma electrónica. El navegador no es una autoridad de permisos. Los datos privados de protección se excluyen del QR público y de la persistencia local prevista; los borradores locales no están cifrados como almacenamiento de servidor.

La capa de protección dirige las señales de riesgo a revisión humana. No implementa confinamiento, retención coercitiva de documentos ni control coercitivo del movimiento.

GitHub Pages solo sirve para la demo estática. Antes de producción faltan, como mínimo, despliegue real, recuperación/borrado de cuenta, autorización por recurso y rol, persistencia cifrada de documentos, proveedor de firma, CSP, observabilidad, backups y revisión de seguridad, privacidad, accesibilidad y legal por jurisdicción. Ver [gates de producción](docs/PRODUCTION-GATES.md).
