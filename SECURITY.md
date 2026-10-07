# Security

No se deben introducir API keys, contraseñas, tokens, datos biométricos ni secretos en el frontend o en Git.

Los campos sensibles se deben procesar con mínimo privilegio y permanecer fuera del QR público. La verificación pública debe exponer únicamente los datos necesarios.

La autenticación y la firma del prototipo están expresamente marcadas como `STATIC-DEMO`. Para producción, el servidor debe emitir el challenge, validar la respuesta y conservar la evidencia correspondiente.
