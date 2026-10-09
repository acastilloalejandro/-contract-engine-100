# Spain Housing Rental · Legal/UX Model v6.1

## Scope
Aplicación iPhone-first para preparar expedientes de alquiler de vivienda en España. El producto separa dato, evidencia, cálculo, revisión y firma. No sustituye asesoramiento jurídico ni actúa como registro oficial.

## Architecture implemented
1. Wizard de cinco etapas: Inmueble → Partes → Renta → Condiciones → Firma.
2. Motor declarativo de cláusulas.
3. Perfiles locales reutilizables de arrendador y arrendatario.
4. contractId permanente por expediente.
5. contractVersion independiente de la versión de la aplicación, con semver.
6. Timeline construido desde auditoría.
7. Estado contractual: DRAFT, REVIEW, PENDING_SIGNATURE, SIGNED, ACTIVE, FINALIZED.
8. Navegación por tareas pendientes.
11. Motor de contexto jurídico de alquiler.
12. Vivienda habitual/temporada.
13. Supuestos especiales.
14. Jurisdicción por comunidad/provincia/municipio.
15. Control de zona tensionada con vigencia, registro local y fallback a consulta oficial.

## Policy provenance
La política se versiona como `2026.10.08` y contiene URLs oficiales para la LAU consolidada y la Generalitat de Catalunya.

La LAU consolidada del BOE informa de una última actualización publicada el 02/10/2026. El texto consolidado es informativo y para uso jurídico debe consultarse la publicación oficial correspondiente.

La Generalitat publica actualmente 271 municipios catalanes como zonas declaradas, en dos listados: 140 de la Resolución TER/800/2024 y 131 de la Resolución TER/2408/2024. El listado oficial incluye L'Hospitalet de Llobregat. La declaración tiene duración inicial de tres años y puede prorrogarse anualmente.

## Evidence-first rule
El motor sigue:

LEGISLACIÓN → DATOS → EVIDENCIA → CÁLCULO → REVISIÓN HUMANA → PREPARACIÓN DE FIRMA.

Nunca se presenta una inferencia local como confirmación oficial. Fuera del registro local incorporado, el estado es `official_lookup_required`.

## Rent control
Para vivienda habitual ubicada en zona tensionada, el motor recoge:
- renta anterior y su evidencia cuando existe;
- existencia o no de contrato residencial en los cinco años anteriores;
- condición de gran tenedor;
- referencia/índice aportado y evidencia;
- explicación del cumplimiento del límite.

Cuando no existe suficiente evidencia para calcular el límite, el expediente queda con tarea de revisión. El motor no inventa un valor de referencia.

## Signature boundary
WebAuthn solo se presenta como capacidad del navegador. La preparación de firma genera una petición vinculada a contractId, versión, política y hash. No se simula una firma electrónica cualificada ni una identidad verificada por un tercero.

## Production prerequisites
Antes de producción jurídica deben mantenerse actualizados:
- política nacional y autonómica con fecha de entrada en vigor;
- registros oficiales de municipios y resoluciones;
- sistema estatal de índices/referencias cuando sea aplicable;
- reglas específicas por comunidad autónoma;
- backend de verificación;
- proveedor de firma válido;
- política de conservación y borrado;
- revisión profesional de cláusulas y supuestos especiales.
