# Contract Engine 100 · Field System 4.0

Formulario contractual dinámico, iPhone-first y orientado a revisión verificable.

## Estado actual
- Motor de formulario declarativo y dependencias.
- Validación cruzada y reglas condicionales.
- Hash SHA-256 con representación canónica estable y manifiesto de documentos.
- Gestión de documentos con revisión, procedencia y liberación de object URLs.
- QR real con enlace de verificación.
- Verificación estática del formato del QR.
- Comprobación de capacidad WebAuthn sin simular una credencial.
- Borrador local con reducción de exposición de datos sensibles y guardado con debounce.
- UI iPhone-first inspirada en patrones de finanzas móviles: métrica principal, acciones rápidas, tarjetas compactas y navegación inferior.
- GitHub Actions para smoke tests.

## UI
La gramática visual toma como referencia la experiencia móvil actual de World Money, que presenta una métrica financiera principal, acciones rápidas, tarjetas y navegación inferior. La implementación de este repositorio usa identidad y componentes propios, sin copiar recursos propietarios.

## Publicación
GitHub Pages puede servir index.html directamente desde main y /(root).

## Importante
Esta versión sigue siendo un frontend estático. No proporciona por sí sola identidad verificable, firma electrónica cualificada, OCR server-side ni almacenamiento seguro de producción.