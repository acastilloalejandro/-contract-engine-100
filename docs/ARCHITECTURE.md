# Contract Engine 100 · Architecture

## Pipeline

CAPTAR → CLASIFICAR → PREGUNTAR → NORMALIZAR → VALIDAR → REVISAR → AUTENTICAR → FIRMAR → SELLAR → VERIFICAR → AUDITAR

## Capas

UI → Form Engine → Schema Engine → Rules Engine → Validation → Document Engine → Authentication → Signature → Verification → Audit → Persistence/API

## Record

ContractRecord mantiene identificador, versión, estado, jurisdicción, partes, identidad, condiciones laborales, documentos, consentimientos, autenticación, firma, verificación y auditoría.

## Declarative schema

Cada campo puede definir tipo, etiqueta, obligatoriedad, opciones, visibilidad, habilitación, validación, dependencias, sensibilidad y procedencia. El motor soporta reglas compuestas `all`, `any` y `not`, además de dependencias de datos.

## Provenance

Los valores deben distinguir entre USER_INPUT, DOCUMENT_EXTRACTED, SYSTEM_DERIVED, IMPORTED, VERIFIED y AI_SUGGESTED. La confianza nunca sustituye la revisión humana.

## Security boundary

Los identificadores restringidos y documentos no forman parte del payload público del QR. WebAuthn y firma electrónica reales requieren servidor, challenge y evidencia verificable. El frontend estático no almacena biometría ni pretende crear una identidad.

## Verification

`verify.html` valida estructura y formato del payload transportado por el QR. Una implementación productiva debe verificar la representación firmada contra un registro de servidor.

## Accessibility

Interfaz táctil, Dynamic Type, VoiceOver, dark mode, safe areas, teclado móvil, estados visibles y mensajes de validación.

## Testing

Smoke tests, validación de esquema, reglas condicionales, hashing, QR, seguridad, estados, accesibilidad y recuperación deben ejecutarse en CI.
