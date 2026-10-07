# Contract Engine 100 · Field System 3.0

Formulario contractual dinámico, móvil y orientado a revisión verificable.

## Qué incluye

- Motor de campos declarativo con dependencias y visibilidad contextual.
- Campos específicos de identidad, contacto, empleo, jornada, remuneración, alojamiento, viajes y documentos.
- Carga real de archivos desde navegador, arrastrar/soltar y selección múltiple.
- SHA-256 por documento y hash canónico del expediente.
- Previsualización PDF e imágenes en navegador.
- Flujo de lectura → consentimiento → autenticación → firma.
- Procedencia de datos y propuesta de extracción documental con revisión humana.
- Validación de campos y reglas cruzadas.
- Estados de expediente y auditoría local.
- Autoguardado local para borradores.
- Modo experto con Schema / Data / Rules / State.
- Diseño responsive, dark mode y controles táctiles.
- Preparado para GitHub Pages como sitio estático.

## Ejecución

No requiere backend para la demo visual. Abre `index.html` en un navegador moderno o publícalo mediante GitHub Pages.

## Producción

La demo no sustituye una implementación de identidad, firma electrónica, OCR ni almacenamiento seguro de documentos. Para producción se debe conectar:

1. WebAuthn / passkeys o LocalAuthentication en una aplicación iOS nativa.
2. Proveedor real de firma electrónica.
3. Backend con control de acceso por rol.
4. Almacenamiento cifrado de documentos.
5. OCR/document intelligence real con revisión humana.
6. QR firmado/verificable con un endpoint público que exponga únicamente los datos necesarios.

## Alcance

El formulario está planteado para relaciones laborales o de servicios legítimas y voluntarias. No implementa propiedad sobre personas, trabajo forzoso, confiscación de documentos, restricción de movimiento ni vigilancia secreta.
