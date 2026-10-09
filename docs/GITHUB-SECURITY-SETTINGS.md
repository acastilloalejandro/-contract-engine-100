# Configuración manual de seguridad de GitHub

**Proyecto:** Contract Engine 100  
**Responsable:** Alejandro Hernández Castillo  
**Última revisión:** 9 de octubre de 2026

Este documento distingue los controles presentes en código de los que requieren configuración en GitHub. Los archivos del repositorio no pueden activar por sí solos la protección de la cuenta, los permisos del repositorio, las reglas de rama ni las opciones de seguridad de GitHub.

## Estado observado

El ruleset visible **Cast** está activo, pero solo contiene las reglas `deletion` y `non_fast_forward`. Eso evita eliminar ramas o forzar actualizaciones donde aplica, pero por sí solo no exige Pull Request, revisión humana, checks de CI ni análisis de seguridad. La integración disponible no permitió leer la protección clásica de `main`; no debe inferirse de ello que no exista otra regla.

Los workflows del proyecto se han fijado a SHAs completos verificados en los repositorios oficiales de cada Action. Dependabot tiene configuradas propuestas semanales para npm y GitHub Actions; las propuestas deben revisarse antes de integrarlas.

## P0: cuenta, ramas y cadena de suministro

### 1. Cuenta del mantenedor
- Activa autenticación multifactor con passkey o llave de seguridad y conserva códigos de recuperación fuera del dispositivo habitual.
- Revisa periódicamente sesiones, aplicaciones OAuth/GitHub Apps, colaboradores y tokens de acceso personal. Revoca lo que no se use y evita tokens de larga duración.
- Habilita la firma de commits si tu flujo de trabajo puede mantenerla de forma consistente. No confundas la autoría declarada en Git con una firma criptográfica verificada.

### 2. Proteger `main`
En **Settings → Rules → Rulesets**, edita el ruleset `Cast` o crea otro exclusivo para `~DEFAULT_BRANCH`. Configura:
- Require a pull request before merging.
- Require status checks to pass before merging. Selecciona los checks que GitHub reporte realmente para el CI, CodeQL, auditoría npm y prueba de calidad.
- Block force pushes y prevent deletion.
- Require signed commits, solo cuando los commits del flujo estén firmados correctamente.
- Revisa los bypass actors actuales; deja solo los estrictamente necesarios y documentados.
- No exijas una aprobación de Code Owner imposible de satisfacer por el mismo autor. Si el proyecto sigue teniendo una sola persona mantenedora, la revisión independiente requiere incorporar un segundo revisor de confianza.

La selección de checks debe hacerse después de que GitHub los haya reportado al menos una vez. Los nombres del workflow no siempre coinciden con el nombre del job que se configura como check requerido.

### 3. Configurar Actions
En **Settings → Actions → General**:
- Configura los permisos predeterminados de `GITHUB_TOKEN` en lectura.
- Limita las Actions permitidas a las oficiales/necesarias y a las de publicadores confiables.
- Activa la política para exigir que las Actions usen SHA completo, si está disponible para este repositorio.
- Revisa permisos de despliegue de Pages: el workflow de publicación requiere `pages: write` e `id-token: write`; el resto debe seguir con permisos mínimos.
- No introduzcas `pull_request_target` con checkout/ejecución de código no confiable de un fork.
- Mantén los secrets únicamente en el entorno que realmente los necesita. El frontend público, `config.js` y el historial Git no son almacenes de secretos.

Los SHA fijados se actualizarán mediante propuestas de Dependabot. Una actualización no debe aceptarse automáticamente sin revisar cambios y resultados de CI.

## P1: alertas y detección

En **Settings → Code security and analysis**, activa cuando esté disponible:
- Dependency graph.
- Dependabot alerts y Dependabot security updates.
- Secret scanning y push protection.
- Private vulnerability reporting.

GitHub informó que el dependency graph no estaba habilitado al intentar ejecutar la acción nativa Dependency Review. En el repositorio se sustituyó ese workflow por `npm audit --audit-level=high --ignore-scripts`, que pasa en el estado actual. Son controles diferentes: habilitar el grafo mejora la visibilidad de dependencias, pero no analiza por sí solo todo el código ni los archivos vendorizados.

**Límite importante:** `npm audit` analiza el árbol de dependencias que npm conoce en el lockfile. No encuentra necesariamente fallos en `vendor/qrcode.min.js`, código copiado manualmente, la configuración de GitHub, el contenido que se ejecuta en el navegador ni vulnerabilidades lógicas propias. Mantén un inventario de origen, versión, licencia y proceso de actualización para ese código vendorizado.

## P1: publicación web y aplicación

- La política CSP se ha endurecido en las páginas HTML y ya no permite `unsafe-inline` para estilos; los estilos de la página de verificación se han movido a la hoja CSS.
- GitHub Pages no ofrece a este repositorio un archivo de cabeceras HTTP arbitrarias mediante un simple cambio HTML. Las políticas que solo pueden establecerse como cabeceras de respuesta, por ejemplo `Strict-Transport-Security`, `X-Content-Type-Options`, `Permissions-Policy`, `frame-ancestors` y opciones avanzadas de aislamiento, requieren comprobar la respuesta real del hosting y, si no son configurables, desplegar detrás de un hosting/proxy que sí permita gestionarlas. Una etiqueta CSP no sustituye a una cabecera HTTP en todos sus usos.
- La CSP incluye `connect-src 'self'`. Al conectar una API en otro origen, actualiza esta directiva con el origen HTTPS exacto y limita CORS al mismo origen esperado. No uses comodines para “hacer que funcione”.
- La demo persiste borradores y documentos en el almacenamiento del navegador. IndexedDB no es cifrado de disco ni un límite de autorización: un XSS o un perfil de navegador comprometido puede acceder a sus datos. No se deben cargar documentos reales en la demo pública.

## P0 antes de contratos reales

No abrir el servicio a documentos contractuales reales hasta completar y validar, como mínimo:
1. Desplegar la API y base de datos en un dominio propio controlado, preferiblemente con frontend y API bajo el mismo dominio registrable.
2. Probar autorización por objeto/usuario para cada recurso, no solo autenticación de sesión.
3. Cifrar documentos en servidor y diseñar gestión, rotación y recuperación de claves separada del almacenamiento.
4. Validar controles CSRF/origen, cookies de sesión, cierre y revocación, límites antiabuso, recuperación de cuenta y sesiones OAuth.
5. Añadir pruebas E2E y de autorización, escaneo DAST autorizado, revisión manual de XSS/IDOR/CSRF y una prueba de penetración independiente.
6. Probar copias de seguridad, restauración, borrado, registros de auditoría y respuesta a incidentes.
7. Revisar privacidad, retención, base jurídica y proveedores de email, teléfono, identidad y hosting.

## Preparación poscuántica

No se debe añadir criptografía propia al frontend. Mantén un inventario de algoritmos y protocolos del proveedor TLS, identidad, certificados y firma. Para una futura integración de servidor, evalúa estándares NIST actuales según la función: ML-KEM/FIPS 203 para establecimiento de secretos compartidos; ML-DSA/FIPS 204 y SLH-DSA/FIPS 205 para firmas digitales. Confirma compatibilidad e implementación mantenida del runtime/proveedor y su plan de transición antes de elegir parámetros o activar un modo híbrido.

Referencias primarias:
- [GitHub: protegerse contra amenazas de seguridad](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats)
- [GitHub Actions: uso seguro](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub: reglas disponibles en rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [NIST FIPS 203, ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204, ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205, SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)

## Criterio de finalización

No declarar el proyecto “blindado”, “cuánticamente seguro” ni certificado porque los workflows estén verdes. Se requiere configuración administrativa verificada, resultados de análisis revisados, backend operativo, pruebas de seguridad, revisión independiente y documentación de los riesgos residuales.
