# Contract Engine 100 · Field System 5.2.0

Motor contractual modular, móvil primero, para crear expedientes guiados, validar datos y separar los datos privados del contenido compartible.

> **Estado de entrega (9 de octubre de 2026):** los cambios de endurecimiento 5.2.0 están en la rama `feat/production-hardening-v5.2.0` y pendientes de CI/revisión; no se consideran fusionados ni publicados hasta que el PR se integre en `main`. La versión 5.1.0 fue la última publicación estática conocida. La API de autenticación no está desplegada y `config.js` mantiene `authBaseUrl` vacío.

## Estado actual

- **Frontend estático:** workflow de publicación completado correctamente. [Abrir la aplicación](https://acastilloalejandro.github.io/-contract-engine-100/).
- **Calidad de código:** la rama 5.2.0 añade regresiones para privacidad, validación de archivos, CSP, QR local y PWA; el resultado actual debe confirmarse en las ejecuciones de CI asociadas al PR.
- **Autenticación e identidad reales:** no disponibles para usuarios reales hasta crear y desplegar la API, configurar D1, dominio, secretos y proveedores, y superar pruebas de integración.
- **Uso recomendado:** demo técnica y entorno de evaluación. No utilizar todavía para formalizar contratos reales, almacenar documentación sensible ni acreditar identidad o firma.

## Qué incluye

- Formulario declarativo, validación mejorada, advertencias que requieren reconocimiento, persistencia local de adjuntos con IndexedDB, huellas de integridad, QR generado desde una biblioteca local y aviso explícito de no verificación.
- Vista previa local del borrador contractual agrupada por secciones, campos obligatorios pendientes e impresión/guardado como PDF mediante el navegador. No produce un contrato legal certificado ni un PDF firmado.
- Pantallas de acceso e incorporación y un adaptador para conectar correo/contraseña, Google/Apple, OTP y verificación documental con proveedores externos. Estas pantallas no equivalen a un servicio de autenticación desplegado.
- API de referencia en Cloudflare Workers + D1 para sesiones, OAuth, correo, teléfono y estado de identidad, pendiente de despliegue y configuración.
- Pruebas automatizadas de humo, invariantes, autenticación, onboarding, contrato de API y regresiones v5.2.0 de minimización de datos y validación de archivos.
- Arquitectura modular para que empleo doméstico, alquiler residencial y otros contratos mantengan esquemas y reglas separados.

## Estructura principal

- `index.html`, `styles/world-ui.css`: interfaz adaptable, CSP en metadatos y avisos de privacidad.
- `app/schema.js`, `app/engine.js`, `app/ui.js`, `app/main.js`: esquema, lógica contractual, renderizado y orquestación.
- `app/auth.js`, `app/onboarding-ui.js`, `config.js`: adaptador de acceso, pantallas y configuración pública sin secretos.
- `src/`, `schema/`, `legal/`: contratos de tipos, validación y registro de reglas.
- `workers/api/src/index.js`, `workers/api/schema.sql`, `workers/api/wrangler.toml`: backend Cloudflare de referencia.
- `tests/`: regresiones y pruebas de invariantes.
- [Arquitectura modular y límites de confianza](docs/MODULE-ARCHITECTURE.md), [estrategia de producto](docs/PRODUCT-STRATEGY.md), [onboarding y seguridad](docs/AUTH-ONBOARDING.md), [estado y gates de producción](docs/PRODUCTION-GATES.md), [matriz de 50 optimizaciones](docs/OPTIMIZATION-ROADMAP-50.md).
- [Historial de cambios](CHANGELOG.md).
- [Hoja de ruta de las 50 optimizaciones y bloqueos](docs/OPTIMIZATION-ROADMAP-50.md).

## Cambios preparados para 5.2.0

- Versión del esquema, paquete, lockfile e interfaz sincronizadas en 5.2.0.
- Eliminados los valores por defecto de país y jurisdicción; añadido aviso de revisión jurídica.
- Campos marcados privados/restringidos excluidos del borrador serializado y del payload de integridad.
- Validación cliente de tipo, extensión, MIME, firma inicial y tamaño de archivos; los controles de servidor siguen pendientes.
- Adjuntos restaurables en IndexedDB local, con aviso de que no están cifrados.
- Generador QR empaquetado localmente; verificador estático rotula el resultado «NO VERIFICADO».
- Añadidos CSP meta, referrer policy, service worker versionado, icono PWA y pruebas de regresión.
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

La demo no acredita identidad ni crea una firma electrónica. El navegador no es una autoridad de permisos. Los campos privados y restringidos se excluyen del borrador JSON local y de la huella de integridad; no equivale a cifrado de dispositivo. Los adjuntos pueden quedar en IndexedDB sin cifrado, por lo que no se deben introducir datos reales. El QR estático solo comprueba formato y declara explícitamente «NO VERIFICADO».

La capa de protección dirige las señales de riesgo a revisión humana. No implementa confinamiento, retención coercitiva de documentos ni control coercitivo del movimiento.

Antes de producción siguen pendientes, como mínimo: despliegue y conexión del backend, verificación QR en servidor, recuperación y borrado de cuenta, autorización por recurso y rol, almacén de documentos cifrado, proveedor de firma, cabeceras de seguridad HTTP, análisis antimalware server-side, observabilidad, copias de seguridad y restauración, pruebas end-to-end, prueba en navegador real y revisión legal, seguridad, privacidad y accesibilidad por jurisdicción. La lista operativa está en [gates de producción](docs/PRODUCTION-GATES.md).


### Estado de calidad v5.2.0

La rama candidata debe superar de nuevo `npm test` después de los últimos cambios de privacidad y persistencia. Un resultado fallido en una ejecución anterior no demuestra que el último commit siga fallando; consulta las ejecuciones asociadas al SHA actual antes de publicar.
