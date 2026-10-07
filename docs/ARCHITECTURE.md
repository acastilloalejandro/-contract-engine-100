# Architecture · Field System 5.0

## Pipeline

CAPTAR → CLASIFICAR → PREGUNTAR → NORMALIZAR → VALIDAR → REVISAR → PROTEGER → AUTENTICAR → PREPARAR FIRMA → VERIFICAR → AUDITAR

## Módulos

index.html → app/main.js → app/ui.js + app/engine.js → app/schema.js

## Data boundaries

publicData() excluye respuestas private/restricted. integrityData() incluye campos restricted para la huella, pero excluye respuestas private. El QR contiene identificadores de verificación, no documentos ni respuestas privadas.

## Validation

Se separan errores bloqueantes y advertencias. Se comprueban fechas, jornada, descanso, deducciones, idioma/asistencia y documentos.

## Protection Engine

RISK_MAP transforma señales privadas en NORMAL/REVIEW/HIGH. HIGH activa Protective Gate y exige revisión humana. No es un diagnóstico jurídico.

## Document Engine

Cada archivo recibe id, MIME, tamaño, SHA-256, estado, versión y object URL. Los object URLs se liberan al cerrar.

## Integrity

La huella usa una representación canónica estable, sin object URLs y sin respuestas privadas.

## Authentication / Signature

El cliente solo detecta capacidad WebAuthn y prepara una solicitud de firma. No almacena biometría ni fabrica firmas.

## UX/UI

styles/world-ui.css es un sistema visual local iPhone-first basado en patrones públicos de composición de apps financieras, con identidad propia y sin recursos propietarios de terceros.

## Testing

CI ejecuta node --check sobre cada módulo y npm test.