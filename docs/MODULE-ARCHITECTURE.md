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
