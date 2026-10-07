# Producción: Contract Engine 100 v4.0

## Implementado en la versión estática

- Motor de formulario declarativo y dependencias.
- Validación local y reglas cruzadas.
- Hash SHA-256 de documentos y representación de expediente.
- QR real generado en el cliente mediante EasyQRCodeJS 4.6.2.
- Página estática de verificación del contenido transportado por el QR.
- Detección de capacidades WebAuthn sin fingir una autenticación.
- Guardado local con exclusión de campos marcados como personal/restricted y de archivos.
- CI de humo mediante GitHub Actions.

## Pendiente para producción real

1. Backend de expedientes y control de acceso por rol.
2. Challenge/response de WebAuthn y almacenamiento de credenciales.
3. Proveedor de firma electrónica y evidencia de firma.
4. Endpoint de verificación con almacenamiento de la representación firmada.
5. Almacenamiento cifrado y política de retención/borrado.
6. OCR/document intelligence real con revisión humana y trazabilidad.
7. CSP y dependencias empaquetadas con hash/versionado desde el build.
8. Tests de integración, seguridad, accesibilidad y recuperación ante fallos.

La versión estática no debe presentarse como sistema de identidad, firma electrónica o almacenamiento seguro de producción.
