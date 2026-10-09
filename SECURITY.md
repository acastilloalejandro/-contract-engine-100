# Seguridad

No incluyas claves de API, contraseñas, tokens, credenciales ni datos biométricos en el repositorio.

Las respuestas privadas permanecen en memoria durante la sesión y se excluyen de `localStorage` y del QR público. Los campos restringidos pueden formar parte de una huella de integridad interna sin exponerse en el contenido compartible.

Los documentos se procesan localmente para calcular su hash y se liberan sus URL de objeto al finalizar la sesión. Un hash prueba la integridad de los bytes hashados, no la identidad del emisor ni la validez jurídica del documento.

La autenticación real, la autorización por recurso, la verificación de identidad y el estado de firma deben confirmarse en el servidor. WebAuthn exige un desafío del servidor, credencial registrada y validación server-side; detectar la capacidad del navegador no equivale a autenticarse. Preparar un flujo de firma tampoco crea una firma electrónica.

La función de protección dirige señales de posible explotación a revisión humana. No se implementan funciones de confinamiento, retención coercitiva de documentos ni control coercitivo del movimiento.

Reporta vulnerabilidades sin publicar secretos ni datos personales en issues públicos.
