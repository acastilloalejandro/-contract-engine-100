# Contract Engine 100 · Field System 5.1.0

Motor contractual modular, móvil primero, para crear expedientes guiados, validar datos y separar los datos privados del contenido compartible.

> **Estado de entrega (9 de octubre de 2026):** la versión 5.1.0 está integrada en `main`. Los flujos de CI, contract-os y GitHub Pages han finalizado correctamente para el commit `444c3f7fd675ac8febb25a2514d3587fa209ebf0`. Esto confirma la ejecución de las comprobaciones y del trabajo de despliegue estático, no la preparación del producto completo para producción. La API de autenticación no está desplegada y `config.js` mantiene `authBaseUrl` vacío.

## Estado actual

- **Frontend estático:** workflow de publicación completado correctamente. [Abrir la aplicación](https://acastilloalejandro.github.io/-contract-engine-100/).
- **Calidad de código:** CI y contract-os completados correctamente en el commit de publicación.
- **Autenticación e identidad reales:** no disponibles para usuarios reales hasta crear y desplegar la API, configurar D1, dominio, secretos y proveedores, y superar pruebas de integración.
- **Uso recomendado:** demo técnica y entorno de evaluación. No utilizar todavía para formalizar contratos reales, almacenar documentación sensible ni acreditar identidad o firma.

## Qué incluye

- Formulario declarativo, validación, reglas de revisión, gestión local de documentos, hashes de integridad, borrador local y QR con datos públicos mínimos.
- Pantallas de acceso e incorporación y un adaptador para conectar correo/contraseña, Google/Apple, OTP y verificación documental con proveedores externos. Estas pantallas no equivalen a un servicio de autenticación desplegado.
- API de referencia en Cloudflare Workers + D1 para sesiones, OAuth, correo, teléfono y estado de identidad, pendiente de despliegue y configuración.
- Pruebas automatizadas de humo, invariantes, autenticación, onboarding y contrato de la API.
- Arquitectura modular para que empleo doméstico, alquiler residencial y otros contratos mantengan esquemas y reglas separados.

## Estructura principal

- `index.html`, `styles/world-ui.css`: interfaz adaptable.
- `app/schema.js`, `app/engine.js`, `app/ui.js`, `app/main.js`: esquema, lógica contractual, renderizado y orquestación.
- `app/auth.js`, `app/onboarding-ui.js`, `config.js`: adaptador de acceso, pantallas y configuración pública sin secretos.
- `src/`, `schema/`, `legal/`: contratos de tipos, validación y registro de reglas.
- `workers/api/src/index.js`, `workers/api/schema.sql`, `workers/api/wrangler.toml`: backend Cloudflare de referencia.
- `tests/`: regresiones y pruebas de invariantes.
- [Arquitectura modular](docs/MODULE-ARCHITECTURE.md), [estrategia de producto](docs/PRODUCT-STRATEGY.md), [onboarding y seguridad](docs/AUTH-ONBOARDING.md), [estado y gates de producción](docs/PRODUCTION-GATES.md).
- [Historial de cambios](CHANGELOG.md).

## Versión 5.1.0

- Versión del paquete y de la interfaz sincronizadas.
- CI migrada a Node.js 24 LTS y dependencias de instalación reproducibles con `npm ci --ignore-scripts`.
- Lockfile para que la instalación automatizada sea reproducible.
- Instrucciones de Wrangler fijadas a la versión documentada 4.148.0.
- Estado de publicación y limitaciones de producción documentados de forma explícita.

## Ejecutar y verificar localmente

Requisitos: Node.js 24 o superior.

```sh
npm ci --ignore-scripts
npm test
```

Para la API, consulta [workers/api/README.md](workers/api/README.md). Antes del despliegue, sustituye el UUID ficticio de D1, establece los orígenes HTTPS reales y guarda las credenciales exclusivamente en los secretos de Cloudflare.

## Seguridad y límites reales

La demo no acredita identidad ni crea una firma electrónica. El navegador no es una autoridad de permisos. Los datos privados se excluyen del QR público previsto; los borradores locales no están cifrados como almacenamiento de servidor y pueden permanecer en el dispositivo.

La capa de protección dirige las señales de riesgo a revisión humana. No implementa confinamiento, retención coercitiva de documentos ni control coercitivo del movimiento.

Antes de producción siguen pendientes, como mínimo: despliegue y conexión del backend, recuperación y borrado de cuenta, autorización por recurso y rol, persistencia y cifrado de documentos, proveedor de firma, CSP/cabeceras, observabilidad, copias de seguridad y restauración, pruebas end-to-end, y revisión legal, de seguridad, privacidad y accesibilidad por jurisdicción. La lista operativa está en [gates de producción](docs/PRODUCTION-GATES.md).
