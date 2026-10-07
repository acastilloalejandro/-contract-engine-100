# Security

No incluir API keys, contraseñas, tokens, credenciales ni datos biométricos en el repositorio.

Las respuestas private permanecen en memoria durante la sesión y se excluyen de localStorage y del QR público. Los campos restricted pueden incluirse en el hash de integridad interno sin exponerse.

Los documentos se hashean en el dispositivo y sus object URLs se liberan al finalizar la sesión.

WebAuthn real requiere challenge del servidor, credencial registrada y validación server-side. Esta versión solo comprueba capacidad.

Preparar una firma no crea una firma electrónica. Debe integrarse un proveedor adecuado.

La protección activa revisión humana ante señales de posible explotación. No se implementan funciones de propiedad sobre personas, confinamiento, retención coercitiva ni control coercitivo del movimiento.