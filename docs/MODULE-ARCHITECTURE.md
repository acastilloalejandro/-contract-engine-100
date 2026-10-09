# Contract OS — Arquitectura modular y compatibilidad

## Registro de módulos

| Module ID | Dominio | Estado | Regla |
|---|---|---|---|
| employment.domestic | Contrato laboral doméstico | Rama principal actual | Preservar esquema y salvaguardas |
| housing.rental.es | Alquiler residencial en España | PR #4/#5 | Separar esquema, reglas, cláusulas y fuentes |
| trust.identity-signature | Identidad y firma | PR #2 | Requiere backend y proveedor real |
| auth.onboarding | Registro e incorporación | PR #6 | No equivale a autenticación funcional |

## Contrato de módulo

Cada módulo declara moduleId, schemaVersion, jurisdicciones y fechas de vigencia, campos y dependencias, validadores deterministas y códigos de error, cláusulas con fuente/versión, política de privacidad por campo, renderer de vista previa y pruebas de regresión.

## Compatibilidad

- Migraciones explícitas, versionadas y probadas.
- Nunca reinterpretar un expediente laboral como alquiler residencial.
- Cada expediente conserva módulo y versión de reglas de origen.
- Los módulos comparten identidad técnica, auditoría, permisos y renderizado, no las reglas jurídicas específicas.
- La falta de cobertura territorial devuelve REVIEW_REQUIRED.

## Límites de confianza

El navegador no es confiable. El backend es la autoridad para identidad, permisos, sesiones, estado de firma y verificación. Los enlaces públicos reciben solo datos expresamente aprobados. Un hash prueba integridad del contenido hasheado, no que la identidad, fuente legal o firma sean verdaderas.

## Decisión recomendada

Adoptar Contract OS como arquitectura común y lanzar primero un paquete contractual estable. La selección del módulo debe ser explícita al crear el expediente. No fusionar automáticamente PR #2, #4 y #6 en main: representan dominios, contratos y estados de confianza diferentes.

## Arquitectura de ejecución v5.2

### Componentes y límites de confianza

El flujo técnico es: interfaz estática → esquema declarativo → motor de validación y estado → renderizador de formulario/revisión → borrador contractual imprimible. El almacenamiento local se divide en localStorage para los campos permitidos y IndexedDB para blobs documentales. El generador QR está empaquetado localmente; la página de verificación solo valida el formato de los parámetros.

El backend de Cloudflare Workers + D1 y los proveedores externos de autenticación/firma son una capa futura, todavía no desplegada ni configurada. No debe interpretarse la existencia de carpetas, adaptadores o pantallas como prueba de que esos servicios estén activos.

### Ciclo de vida del expediente

1. **Crear:** el expediente comienza sin país ni jurisdicción predeterminados. El esquema desplegado corresponde al dominio laboral y no debe reutilizarse automáticamente para arrendamientos.
2. **Capturar:** el esquema declara tipo, obligatoriedad, dependencias, actor y clasificación de privacidad. La vista revisora es una restricción de presentación, no un sistema de autorización.
3. **Validar:** se separan errores bloqueantes y advertencias; las advertencias requieren reconocimiento. La validación jurídica territorial no se automatiza ni se presume.
4. **Guardar:** localStorage conserva una proyección de campos no privados; IndexedDB conserva adjuntos en el dispositivo. Ninguno está cifrado por la aplicación ni sincronizado con un servidor.
5. **Revisar:** el motor calcula señales protectoras y una huella SHA-256 del subconjunto de datos incluido en el cálculo. La huella no demuestra identidad, firma, fecha fiable ni exhaustividad del expediente.
6. **Previsualizar:** se genera una vista por secciones desde el esquema y los datos presentes. Excluye las respuestas de protección, los documentos de identidad y los identificadores restringidos, y lista los datos obligatorios que faltan.
7. **Imprimir:** el botón usa el diálogo de impresión del navegador. Guardar como PDF depende del navegador y del sistema operativo; no es un exportador PDF nativo ni una firma.
8. **Compartir/verificar:** el QR contiene un enlace de formato estático. Hasta existir un registro servidor, la página debe mostrar «NO VERIFICADO» y no certificar el contenido.
9. **Producir:** el cambio a producción requiere API, D1, sesiones seguras, permisos por recurso, almacenamiento de archivos cifrado, análisis antimalware, firma real, verificación servidor, E2E, auditoría de accesibilidad y revisión legal/seguridad.

### Vista de componentes

- **app/schema.js:** metadatos de campo, dependencias, privacidad, versiones y señales de protección.
- **app/engine.js:** validación, minimización de datos, borradores, documentos locales, hashing, instantáneas y eventos locales.
- **app/ui.js:** formulario, resumen de revisión y panel de estado.
- **app/contract-preview.js:** transforma el esquema y el estado local en una vista de borrador escapada; no evalúa cláusulas legales.
- **app/verify.js:** valida formato de parámetros únicamente; no consulta base de datos ni comprueba una firma.
- **app/auth.js y app/onboarding-ui.js:** adaptador y pantallas del servicio de identidad futuro; no significan autenticación real si config.js no tiene authBaseUrl y el backend no está desplegado.
- **workers/api/:** referencia de API; requiere configuración real, pruebas de integración y revisión antes de activar.
- **sw.js:** caché versionada del shell estático, no backend offline, persistencia sincronizada ni resolución de conflictos.

### Decisiones de seguridad pendientes

- La validación de formato y firma de archivo del cliente es solo una primera barrera. Producción requiere validar nuevamente en servidor, límites de solicitud, análisis antimalware y almacenamiento privado. OWASP recomienda defensa en profundidad para cargas de archivos: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html.
- Las sesiones, identidad y derechos deben aplicarse en servidor, con cookies y ciclo de sesión seguros; la detección de WebAuthn no autentica por sí sola. Referencia: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html.
- La CSP incluida como meta es una defensa adicional; el alojamiento final debe imponer cabeceras HTTP y restringir los orígenes permitidos reales.
- No activar API externa sin revisar connect-src, CORS, CSRF, cookies, límites, telemetría y tratamiento de datos.
- El contenido privado almacenado como blob en IndexedDB no se cifra por la aplicación. Usar datos ficticios hasta implantar almacenamiento seguro apropiado.

### Criterio de aceptación

La rama puede considerarse lista para una demo técnica cuando los tests estén en verde y se verifiquen la página y el flujo de impresión en navegadores reales. No puede considerarse lista para contratos reales hasta completar todas las puertas bloqueantes de docs/PRODUCTION-GATES.md.
