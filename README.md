# Contract Engine 100 · Field System 4.0

Formulario contractual dinámico, iPhone-first y orientado a revisión verificable.

## Incluye

- Campos contextuales y reglas declarativas.
- Validación cruzada de fechas, horarios, descanso y remuneración.
- Documentos con SHA-256, revisión y procedencia.
- QR real con enlace de verificación estático.
- Comprobación de capacidad WebAuthn sin simular una credencial.
- Guardado local con reducción de exposición de datos sensibles.
- Página `verify.html` para inspeccionar el payload del QR.
- GitHub Actions para smoke tests.

## Publicación

GitHub Pages puede servir `index.html` directamente desde `main` y `/(root)`.

## Importante

Esta versión sigue siendo un frontend estático. No proporciona por sí sola identidad verificable, firma electrónica, OCR server-side ni almacenamiento seguro de producción.
