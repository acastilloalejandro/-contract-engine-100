# Excelencia técnica y preparación para evaluación externa

**Proyecto:** Contract Engine 100  
**Responsable declarado:** Alejandro Hernández Castillo  
**Estado:** plan de evidencias, no una certificación ni una solicitud presentada.

## Regla básica

No existe un distintivo universal de GitHub que certifique simultáneamente seguridad, accesibilidad, privacidad, calidad jurídica y resistencia cuántica. Tampoco puede prometerse la obtención de premios o reconocimientos de MIT ni de otra institución: dependen del programa concreto, sus requisitos vigentes, la elegibilidad y una evaluación externa.

El objetivo de este documento es construir evidencia reproducible para evaluaciones independientes y evitar declarar méritos que el proyecto aún no ha demostrado.

## Líneas de evaluación y evidencia exigida

| Área | Marco de referencia | Evidencia mínima antes de afirmar conformidad |
|---|---|---|
| Seguridad de repositorio | GitHub secure use, rulesets, OpenSSF Scorecard | Historial público de workflows, resultados Scorecard, reglas de rama efectivas y revisión de bypass |
| Seguridad de aplicación/API | OWASP ASVS y API Security Top 10 | Matriz de requisitos, pruebas negativas, revisión manual y penetración autorizada contra entorno controlado |
| Cadena de suministro | SHA completo de Actions, Dependabot, npm audit, SBOM | Acciones fijadas y actualizadas, inventario de componentes, SBOM de una versión y tratamiento documentado de hallazgos |
| Autorización/identidad | OWASP API1/API2/API3/API5 | Pruebas cruzadas de dos cuentas y roles sobre D1 real; registros de denegación sin exponer datos |
| Accesibilidad | WCAG 2.2 AA como objetivo | Auditoría automatizada más revisión manual de teclado, lector de pantalla, contraste, zoom y formularios; lista de defectos resueltos |
| Privacidad y derechos | GDPR/LOPDGDD cuando resulten aplicables y revisión jurídica de la jurisdicción | Inventario de datos, base jurídica, retención/borrado, contratos con proveedores y evaluación de riesgos |
| Calidad contractual | Revisión jurídica por jurisdicción y tipo de contrato | Validación por profesional competente; versionado de cláusulas y casos de prueba; no basta con imprimir un borrador |
| Preparación poscuántica | NIST FIPS 203/204/205 | Inventario de algoritmos/proveedores, decisión documentada de migración e interoperabilidad probada; no etiquetar la demo como cuánticamente segura |
| Operación y resiliencia | Continuidad, respuesta a incidentes y recuperación | Simulacro de incidentes, restauración desde backup, revocación de credenciales, métricas y responsables definidos |
| Reproducibilidad científica | Metodología empírica y evaluación independiente | Dataset de pruebas no sensible, metodología predefinida, resultados repetibles, intervalos/limitaciones y revisión de sesgos |

## Estado observado en el repositorio

Implementado en CI o documentación:
- CodeQL para JavaScript/TypeScript.
- `npm audit --audit-level=high --ignore-scripts`.
- Propuestas semanales de Dependabot para npm y GitHub Actions.
- SHA completo para las Actions presentes en los workflows.
- Pruebas automatizadas de humo, invariantes, hardening, autenticación y autorización simulada.
- Guías de modelo de amenazas, configuración manual de GitHub, producción y reporte de vulnerabilidades.
- Workflow de evaluación OpenSSF Scorecard incorporado en esta rama; el resultado debe observarse después de la integración.

Pendiente, y no debe marcarse como completado hasta guardar evidencia:
- Reglas efectivas de protección de `main`, checks requeridos y política de bypass confirmadas desde GitHub.
- MFA resistente a phishing, secret scanning/push protection y configuración de alertas activada en la cuenta/repositorio.
- Backend Cloudflare Worker + D1 desplegado y validado en dominio propio.
- E2E con D1 real, pruebas de cookies en navegadores, restauración y pruebas de proveedor/webhook en modo de prueba.
- Revisión independiente de seguridad y privacidad.
- Auditoría manual de accesibilidad y conformidad jurídica por jurisdicción.
- SBOM de una versión publicada y procedencia verificada del código vendorizado.
- Evidencia que sustente cualquier premio, sello, subvención o reconocimiento concreto; no afirmar que se posee antes de recibirlo.

## Puertas de liberación de una versión candidata

1. Identificar commit y artefacto exactos; conservar resultados CI, CodeQL, auditoría de dependencias y Scorecard.
2. Corregir hallazgos altos/críticos o documentar una excepción con responsable, vencimiento y justificación.
3. Ejecutar las pruebas de autorización en infraestructura de ensayo con cuentas ficticias.
4. Revisar manualmente UX, accesibilidad, errores, pérdida/recuperación de datos, privacidad y textos legales.
5. Generar un SBOM, verificar licencias y procedencia, y guardar hashes del artefacto.
6. Obtener una revisión externa independiente.
7. Publicar una declaración de alcance y limitaciones. Nunca equiparar “CI verde”, un resultado Scorecard o un badge con un pentest, certificación o seguridad absoluta.

## Referencias primarias

- GitHub Actions, uso seguro: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub, reglas de rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- OpenSSF Scorecard: https://scorecard.dev/
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- NIST FIPS 203: https://csrc.nist.gov/pubs/fips/203/final
- NIST FIPS 204: https://csrc.nist.gov/pubs/fips/204/final
- NIST FIPS 205: https://csrc.nist.gov/pubs/fips/205/final
