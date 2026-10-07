# Arquitectura

```text
Context
  ↓
Role / Permissions
  ↓
Dynamic Field Engine
  ↓
Normalize
  ↓
Cross-field Validation
  ↓
Document Intelligence
  ↓
Provenance
  ↓
Review
  ↓
Read & Understand
  ↓
Consent
  ↓
Authenticate
  ↓
Sign
  ↓
Seal / Hash
  ↓
Verify
  ↓
Audit
```

## Separación de datos

- `raw input`: entrada de usuario.
- `normalized`: valores normalizados y datos derivados.
- `validated`: resultado de reglas.
- `signed representation`: representación exacta que se pretende firmar.
- `verification representation`: mínimo necesario para verificar sin exponer PII innecesaria.

## Modelo de roles

`worker`, `employer`, `reviewer`, `auditor`, `verifier`.

Cada definición de campo declara quién puede introducir o revisar el valor. La capa de interfaz no debe ser la única barrera: el backend debe repetir las comprobaciones de autorización.
