# Matriz de pruebas de autorización y puertas de infraestructura

**Proyecto:** Contract Engine 100  
**Responsable:** Alejandro Hernández Castillo  
**Estado:** pruebas de regresión en CI; backend aún no desplegado como servicio de producción.

## Qué comprueban las pruebas añadidas

Las pruebas de `workers/api/tests/api.test.mjs` ejercitan el Worker con una base D1 simulada. No necesitan secretos de proveedores ni hacen llamadas externas reales.

| Caso | Resultado exigido | Qué evita |
|---|---|---|
| Sin sesión: inicio de OTP, confirmación OTP, inicio de identidad y consulta del onboarding | HTTP 401 y `AUTH_REQUIRED` | Ejecutar endpoints protegidos sin autenticación |
| Origen web no autorizado | HTTP 403 y `ORIGIN_NOT_ALLOWED` antes de consultar la base | Solicitudes de navegador desde un origen no permitido |
| Sesión válida consultando el onboarding | HTTP 200 y solo estado de la cuenta autenticada | Confundir capacidad del navegador con identidad autenticada |
| Usuario A confirma el desafío telefónico del usuario B | Rechazo y cero actualizaciones del desafío | IDOR/BOLA sobre desafíos de verificación |
| Webhook firmado se refiere a una sesión de identidad que pertenece a B pero declara a A en los metadatos | Evento ignorado y cero actualizaciones de identidad | Cambiar el estado de identidad de otra cuenta por desacoplar ID de proveedor y propietario |
| Dos entregas del mismo evento de Stripe | La segunda entrega no ejecuta mutaciones | Duplicar o repetir una transición desde un webhook reintentado |
| Evento de identidad antiguo llega después de uno posterior | Se ignora el evento obsoleto | Degradar el estado con entregas fuera de orden |
| Estado verificado recibe un evento no terminal tardío | La cuenta conserva `verified` | Revocar la identidad de forma accidental por el orden de eventos |
| Evento `redacted` de Stripe | No cambia el resultado de identidad | Confundir eliminación/retención de datos con fallo de verificación |
| Carrera de confirmación de teléfono en el último intento | La reserva SQL condicional rechaza una petición perdedora | Superar el máximo de cinco intentos mediante solicitudes concurrentes |
| Respuestas textuales del webhook | Cabeceras HTTP de seguridad presentes | Respuestas exitosas del webhook sin controles de cabecera |

Estas son pruebas unitarias con mocks. No simulan una cuenta real de Cloudflare, el motor SQL real de D1, cookies reales de Safari, el proveedor de identidad ni despliegue/secretos. Tampoco son una prueba de penetración.

## Autorización que debe mantenerse en cada endpoint

1. La identidad de la cuenta procede de una sesión del servidor, no de un `userId` enviado por el cliente.
2. Toda consulta o mutación de un recurso privado debe incluir el propietario derivado de esa sesión en la propia consulta, por ejemplo `WHERE resource_id = ? AND user_id = ?`.
3. El webhook de Stripe es una frontera distinta: se verifica la firma sobre el cuerpo sin alterar, se valida el tipo de evento y la sesión del proveedor se correlaciona con el usuario ya guardado por el servidor. El `user_id` del metadato por sí solo no autoriza una actualización.
4. Devuelve respuestas genéricas para recursos que no existen o pertenecen a otra cuenta cuando revelar su existencia pueda filtrar información.
5. Añade pruebas negativas para cada nueva ruta. Una prueba de login correcto no demuestra autorización; debe comprobarse también usuario anónimo, usuario equivocado, ID alterado, recurso caducado y rol no permitido.

## Puertas bloqueantes de infraestructura

### GitHub
- [ ] Exigir PR para cambios en `main`, impedir force-push/borrado y exigir los checks de CI, CodeQL y auditoría de dependencias.
- [ ] Revisar actores de bypass y permisos mínimos de `GITHUB_TOKEN`.
- [ ] Activar MFA resistente a phishing en la cuenta mantenedora.
- [ ] Activar Dependency Graph, Dependabot alerts, secret scanning/push protection y reporte privado de vulnerabilidades donde estén disponibles.
- [ ] Revisar colaboraciones, tokens, GitHub Apps, entornos y permisos de Pages.

El ruleset visible revisado se llama `Cast` y solo contiene reglas de borrado y non-fast-forward; eso no basta para afirmar que `main` exige revisiones o checks. La conexión disponible permite leer settings, pero no editar reglas de repositorio con la herramienta de GitHub utilizada para este cambio; estos pasos son de configuración administrativa y se deben confirmar en la UI/API de GitHub.

### Cloudflare y dominio
- [ ] Crear el Worker real y la base D1; reemplazar `REPLACE_WITH_D1_DATABASE_UUID`.
- [ ] Migrar el esquema en D1 remoto y comprobar backups/restauración.
- [ ] Desplegar en un dominio controlado y mantener frontend/API bajo el mismo sitio registrable para evitar depender de cookies de terceros.
- [ ] Configurar valores exactos de `APP_ORIGIN`, `API_ORIGIN`, cookies, proveedores, webhooks y secretos desde el almacén de secretos del proveedor.
- [ ] Configurar rate limiting/WAF/alertas y probar incidentes y revocación de credenciales.
- [ ] Conectar `config.js` solo con el endpoint público definitivo, sin secretos, y probar los flujos de extremo a extremo en Safari/iOS, Chrome y Firefox.

**Estado observado en el repositorio:** `config.js` conserva `authBaseUrl: ""`; `workers/api/wrangler.toml` conserva valores de ejemplo y el UUID D1 de marcador. No se declara autenticación operativa ni servicio de contratos listo para producción.

## Criterio de salida

No habilitar documentos contractuales reales hasta que las pruebas unitarias y de integración pasen con D1, se hayan probado autorizaciones entre dos cuentas reales de prueba, exista una revisión de seguridad independiente y estén confirmadas las opciones administrativas y la infraestructura. Una CI verde demuestra que pasan las comprobaciones automatizadas incluidas, no que todos los ataques sean imposibles.
