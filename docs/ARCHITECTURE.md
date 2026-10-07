# Contract Engine 100 · Architecture

## Pipeline
CAPTAR → CLASIFICAR → PREGUNTAR → NORMALIZAR → VALIDAR → REVISAR → AUTENTICAR → FIRMAR → SELLAR → VERIFICAR → AUDITAR

## Capas
UI → Form Engine → Schema Engine → Rules Engine → Validation → Document Engine → Authentication → Signature → Verification → Audit → Persistence/API

## Record
ContractRecord mantiene identificador, versión, estado, jurisdicción, partes, identidad, condiciones laborales, documentos, consentimientos, autenticación, firma, verificación y auditoría.

## Declarative schema
Cada campo puede definir tipo, etiqueta, obligatoriedad, opciones, visibilidad, habilitación, validación, dependencias, sensibilidad y procedencia. El motor soporta reglas compuestas all, any y not, además de dependencias de datos.

## Provenance
Los valores distinguen entre USER_INPUT, DOCUMENT_EXTRACTED, SYSTEM_DERIVED, IMPORTED, VERIFIED y AI_SUGGESTED. La confianza nunca sustituye la revisión humana.

## Integrity
La huella del expediente usa una representación canónica que excluye object URLs, objetos File y metadatos de procedencia volátiles. Los documentos se representan mediante un manifiesto estable con identificador, nombre, tipo, tamaño, hash, versión y estados de revisión.

## UX/UI
La capa compartida styles/world-ui.css aplica una gramática iPhone-first inspirada en patrones modernos de finanzas móviles: métrica principal, acciones rápidas, tarjetas compactas y navegación inferior. La identidad visual y los recursos del proyecto son propios.

## Security boundary
Los identificadores restringidos y documentos no forman parte del payload público del QR. WebAuthn y firma electrónica reales requieren servidor, challenge y evidencia verificable. El frontend estático no almacena biometría ni pretende crear una identidad.

## Verification
verify.html valida estructura y formato del enlace transportado por el QR. Una implementación productiva debe verificar la representación firmada contra un registro de servidor.

## Accessibility
Interfaz táctil, Dynamic Type, VoiceOver, dark mode, safe areas, teclado móvil, estados visibles, reducción de movimiento y zoom del sistema.

## Testing
Smoke tests, validación de esquema, reglas condicionales, hashing, QR, seguridad, estados, accesibilidad y recuperación deben ejecutarse en CI.