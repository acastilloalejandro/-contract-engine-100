# bithome · Transacciones inmobiliarias con Bitcoin

> **Autoría del proyecto:** Alejandro Hernández Castillo · **Contacto:** [acastilloalejandro@icloud.com](mailto:acastilloalejandro@icloud.com) · **Titularidad y licencias:** consulte [NOTICE.md](NOTICE.md) y [LICENSE](LICENSE).

**Producto principal: bithome.** Aplicación web para preparar operaciones inmobiliarias documentadas con Bitcoin. La marca Contract Engine 100 queda como nombre histórico del motor.\n\n**[Diseño Fusion Light (Figma)](https://www.figma.com/design/aETVQUp6nLu6EkCA62SM3z)** · [Arquitectura y limitaciones](docs/BITHOME-FUSION-LIGHT.md).\n\n**Nuevo enfoque inmobiliario:** [Formulario de compraventa con Bitcoin](real-estate/index.html) · [Alcance jurídico y técnico](docs/REAL-ESTATE-BITCOIN.md). El módulo realiza borradores locales; no tramita pagos, notaría ni verificación de identidad.\n\nMotor contractual modular, móvil primero, para crear expedientes guiados, validar datos y separar los datos privados del contenido compartible.

> **Estado de entrega (9 de octubre de 2026):** la versión base 5.2.1 se mantiene, junto al nuevo módulo inmobiliario independiente 1.0.0. La API de autenticación no está desplegada y `config.js` mantiene `authBaseUrl` vacío. Las licencias y avisos de autoría deben revisarse junto con los derechos de contribución y dependencias.

## Estado actual

- **Frontend estático:** workflow de publicación completado correctamente. [Abrir la aplicación](https://acastilloalejandro.github.io/-contract-engine-100/).
- **Calidad de código:** los cambios de formulario 5.2.1 incluyen búsqueda local y filtro de campos obligatorios pendientes; consulta las ejecuciones de CI del SHA actual.
- **Autenticación e identidad reales:** no disponibles para usuarios reales hasta crear y desplegar la API, configurar D1, dominio, secretos y proveedores, y superar pruebas de integración.
- **Uso recomendado:** demo técnica y entorno de evaluación. No utilizar todavía para formalizar contratos reales, almacenar documentación sensible ni acreditar identidad o firma.

## Seguridad y evaluación externa

- [Modelo de amenazas y hoja de ruta de seguridad](docs/SECURITY-ARCHITECTURE.md).
- [Configuración manual de seguridad de GitHub](docs/GITHUB-SECURITY-SETTINGS.md).
- [Puertas de producción y estado de evidencias](docs/PRODUCTION-GATES.md).
- [Preparación para evaluación externa](docs/RECOGNITION-READINESS.md).
- [Inventario de software de terceros](THIRD-PARTY-NOTICES.md).

La CI integra CodeQL, auditoría npm y OpenSSF Scorecard. Esos resultados son evidencias parciales, no un sello de seguridad ni una concesión de premios. Para procesar contratos reales siguen siendo obligatorios el backend desplegado, las autorizaciones validadas con D1, la configuración de cuenta/ramas, la revisión de privacidad y una auditoría externa.

## Qué incluye

- Formulario declarativo, validación mejorada, advertencias que requieren reconocimiento, persistencia local de adjuntos con IndexedDB, huellas de integridad, QR generado desde una biblioteca local y aviso explícito de no verificación.
- Vista previa local del borrador contractual agrupada por secciones, campos obligatorios pendientes e impresión/guardado como PDF mediante el navegador. No produce un contrato legal certificado ni un PDF firmado.
- Búsqueda por nombre de campo o sección, filtro de obligatorios pendientes y recuperación visible de los errores de validación.
- Pantallas de acceso e incorporación y un adaptador para conectar correo/contraseña, Google/Apple, OTP y verificación documental con proveedores externos. Estas pantallas no equivalen a un servicio de autenticación desplegado.
- API de referencia en Cloudflare Workers + D1 para sesiones, OAuth, correo, teléfono y estado de identidad, pendiente de despliegue y configuración.
- Pruebas automatizadas de humo, invariantes, autenticación, onboarding, contrato de API y regresiones de minimización de datos y validación de archivos.
- El workflow de publicación ejecuta un smoke test posterior al despliegue de la página raíz, verificador, configuración, manifest, CSS, módulos y generador QR.
- Arquitectura modular para que empleo doméstico, alquiler residencial y otros contratos mantengan esquemas y reglas separados.

## Autoría, licencia y uso de la propiedad intelectual

- **Autor del proyecto:** Alejandro Hernández Castillo.
- **Contacto para consultas sobre licencias o permisos:** [acastilloalejandro@icloud.com](mailto:acastilloalejandro@icloud.com).
- **Aviso de autoría:** [NOTICE.md](NOTICE.md).
- **Licencia de código que conserva el repositorio:** [LICENSE](LICENSE), MIT. MIT permite usos, copias, modificaciones y redistribuciones condicionados a conservar los avisos y la licencia. La nota de autoría no transforma MIT en una licencia restrictiva.
- **Componentes de terceros:** sus licencias y atribuciones prevalecen respecto de esos componentes; revisar los avisos y las dependencias antes de redistribuir.
- **Marcas e identidad visual:** la licencia de código no concede por sí sola derechos sobre marcas, logotipos ni una falsa apariencia de afiliación.
- **Límite importante:** un repositorio público permite acceder al contenido visible. Los avisos documentan autoría y condiciones, pero no bloquean técnicamente la copia. La protección de arquitectura, los secretos empresariales y la aplicación de derechos dependen de los hechos y de la legislación aplicable; esto no es asesoramiento jurídico.

## Estado actual

- **Frontend estático:** workflow de publicación completado correctamente. [Abrir la aplicación](https://acastilloalejandro.github.io/-contract-engine-100/).
- **Calidad de código:** los cambios de formulario 5.2.1 incluyen búsqueda local y filtro de campos obligatorios pendientes; consulta las ejecuciones de CI del SHA actual.
- **Autenticación e identidad reales:** no disponibles para usuarios reales hasta crear y desplegar la API, configurar D1, dominio, secretos y proveedores, y superar pruebas de integración.
- **Uso recomendado:** demo técnica y entorno de evaluación. No utilizar todavía para formalizar contratos reales, almacenar documentación sensible ni acreditar identidad o firma.

## Qué incluye

- Formulario declarativo, validación mejorada, advertencias que requieren reconocimiento, persistencia local de adjuntos con IndexedDB, huellas de integridad, QR generado desde una biblioteca local y aviso explícito de no verificación.
- Vista previa local del borrador contractual agrupada por secciones, campos obligatorios pendientes e impresión/guardado como PDF mediante el navegador. No produce un contrato legal certificado ni un PDF firmado.
- Búsqueda por nombre de campo o sección, filtro de obligatorios pendientes y recuperación visible de los errores de validación.
- Pantallas de acceso e incorporación y un adaptador para conectar correo/contraseña, Google/Apple, OTP y verificación documental con proveedores externos. Estas pantallas no equivalen a un servicio de autenticación desplegado.
- API de referencia en Cloudflare Workers + D1 para sesiones, OAuth, correo, teléfono y estado de identidad, pendiente de despliegue y configuración.
- Pruebas automatizadas de humo, invariantes, autenticación, onboarding, contrato de API y regresiones de minimización de datos y validación de archivos.
- El workflow de publicación ejecuta un smoke test posterior al despliegue de la página raíz, verificador, configuración, manifest, CSS, módulos y generador QR.
- Arquitectura modular para que empleo doméstico, alquiler residencial y otros contratos mantengan esquemas y reglas separados.

## Autoría, licencia y uso de la propiedad intelectual

- **Autor del proyecto:** Alejandro Hernández Castillo.
- **Contacto para consultas de licencia o permisos:** [acastilloalejandro@icloud.com](mailto:acastilloalejandro@icloud.com).
- **Aviso de autoría:** [NOTICE.md](NOTICE.md).
- **Licencia del código fuente:** consulte el archivo [LICENSE](LICENSE). El aviso de autoría no sustituye ni amplía esa licencia.
- **Componentes de terceros:** sus licencias y atribuciones prevalecen respecto de esos componentes; revise avisos y dependencias antes de redistribuir.
- **Marcas e identidad visual:** la licencia de código no concede por sí sola derechos sobre marcas, logotipos ni una falsa apariencia de afiliación.
- **Límite importante:** un repositorio público permite acceder al contenido visible. La documentación de derechos ayuda a establecer condiciones y atribución, pero no bloquea técnicamente la copia. La protección de arquitectura, el secreto empresarial y la aplicación de derechos dependen de hechos y legislación; esta documentación no es asesoramiento jurídico.

## Organización del repositorio

| Ruta | Propósito |
|---|---|
| `app/` | Interfaz, esquema, motor, previsualización y verificación estática |
| `styles/`, `icons/`, `vendor/` | Estilos y recursos de interfaz; revisar licencias de recursos de terceros |
| `src/`, `schema/`, `legal/` | Tipos, reglas, esquemas y material contractual |
| `workers/api/` | API de referencia, todavía pendiente de despliegue de producción |
| `tests/` | Regresiones, invariantes y pruebas de contrato |
| `docs/` | Arquitectura, estrategia, seguridad y puertas de producción |
| `.github/` | Automatización de calidad y despliegue |
| `LICENSE`, `NOTICE.md`, `SECURITY.md` | Derechos, atribución y reporte de seguridad |

## Estructura funcional

- `index.html`, `styles/world-ui.css`: interfaz adaptable, CSP en metadatos y avisos de privacidad.
- `app/schema.js`, `app/engine.js`, `app/ui.js`, `app/main.js`: esquema, lógica contractual, renderizado y orquestación.
- `app/auth.js`, `app/onboarding-ui.js`, `config.js`: adaptador de acceso, pantallas y configuración pública sin secretos.
- `src/`, `schema/`, `legal/`: contratos de tipos, validación y registro de reglas.
- `workers/api/src/index.js`, `workers/api/schema.sql`, `workers/api/wrangler.toml`: backend Cloudflare de referencia.
- `tests/`: regresiones y pruebas de invariantes.
- [Política de propiedad intelectual y licencias](docs/IP-POLICY.md), [aviso de autoría](NOTICE.md), [autores](AUTHORS.md), [contribución](CONTRIBUTING.md), [cita del software](CITATION.cff), [seguridad](SECURITY.md).
- [Arquitectura modular y límites de confianza](docs/MODULE-ARCHITECTURE.md), [estrategia de producto](docs/PRODUCT-STRATEGY.md), [onboarding y seguridad](docs/AUTH-ONBOARDING.md), [estado y gates de producción](docs/PRODUCTION-GATES.md), [matriz de 50 optimizaciones](docs/OPTIMIZATION-ROADMAP-50.md).
- [Historial de cambios](CHANGELOG.md).

## Ejecutar y verificar localmente

Requisitos: Node.js 24 o superior.

```sh
npm ci --ignore-scripts
npm test
```

Para la API, consulta [workers/api/README.md](workers/api/README.md). Antes del despliegue, sustituye el UUID ficticio de D1, establece los orígenes HTTPS reales y guarda las credenciales exclusivamente en los secretos de Cloudflare.

## Seguridad y límites reales

La demo no acredita identidad ni crea una firma electrónica. El navegador no es una autoridad de permisos. Los campos privados y restringidos se excluyen del borrador JSON local y de la huella de integridad; esto no equivale a cifrado de dispositivo. Los adjuntos pueden quedar en IndexedDB sin cifrado, por lo que no se deben introducir datos reales. El QR estático solo comprueba formato y declara explícitamente «NO VERIFICADO».

La capa de protección dirige señales de riesgo a revisión humana. No implementa confinamiento, retención coercitiva de documentos ni control coercitivo del movimiento.

Antes de producción siguen pendientes, como mínimo: despliegue y conexión del backend, verificación QR en servidor, recuperación y borrado de cuenta, autorización por recurso y rol, almacén de documentos cifrado, proveedor de firma, cabeceras de seguridad HTTP, análisis antimalware server-side, observabilidad, copias de seguridad y restauración, pruebas end-to-end, prueba en navegador real y revisión legal, seguridad, privacidad y accesibilidad por jurisdicción. La lista operativa está en [gates de producción](docs/PRODUCTION-GATES.md).
