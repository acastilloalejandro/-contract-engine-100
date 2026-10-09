# Autenticación e incorporación: contrato de integración

## Estado actual

La versión 5.1.0 está integrada en `main` y el workflow de GitHub Pages terminó correctamente para el frontend estático. La API de autenticación **no está desplegada** y `config.js` mantiene `authBaseUrl` vacío. Por tanto, registro, inicio de sesión, OAuth, OTP y verificación documental no están disponibles como servicios reales en la publicación actual.

El repositorio incluye las pantallas de acceso (`index.html`, `app/onboarding-ui.js`), el adaptador (`app/auth.js`) y una implementación backend de referencia en `workers/api/src/index.js`. La API debe desplegarse y configurarse, y superar pruebas de integración antes de aceptar usuarios reales. Un botón o campo no demuestra autenticación ni identidad verificada.

## Flujo previsto

1. Acceso: registro con correo y contraseña o inicio mediante Google/Apple (OAuth 2.0 / OpenID Connect).
2. Sesión: el backend crea una sesión mediante cookie HttpOnly, Secure y SameSite. No almacenar tokens de sesión en localStorage.
3. Teléfono: iniciar y confirmar OTP con límites de frecuencia, expiración, consumo único y protección contra enumeración.
4. DNI: iniciar verificación con proveedor especializado o revisión documentada. La validación sintáctica del número no equivale a verificar identidad.
5. Consentimiento y perfil: explicar finalidad y retención; pedir únicamente atributos necesarios. Evitar guardar la imagen del DNI si basta un estado e identificador de verificación.
6. Formulario personalizado: habilitar opciones según permisos y atributos verificados recibidos del servidor, nunca según flags locales manipulables.
7. Auditoría: registrar eventos mínimos, sin OTP, contraseñas, imágenes del DNI ni tokens.

## Contrato HTTP esperado

- GET /v1/auth/session → sesión actual o 401.
- POST /v1/auth/register → cuenta creada o verificación de correo pendiente.
- POST /v1/auth/login → sesión iniciada.
- POST /v1/auth/logout → sesión revocada.
- GET /v1/auth/oauth/google y /v1/auth/oauth/apple → URL de autorización generada en servidor, con state, nonce, PKCE y URI de retorno exacta.
- POST /v1/onboarding/phone/start → challengeId y vencimiento, nunca el OTP.
- POST /v1/onboarding/phone/confirm → resultado validado por servidor.
- POST /v1/onboarding/identity/start → URL/identificador de flujo de proveedor, sin secretos en el cliente.
- GET /v1/onboarding/status → estados server-side de correo, teléfono e identidad.

## Seguridad obligatoria antes de producción

- Configurar Google OAuth Client ID y Sign in with Apple en proveedor y backend. Las claves privadas de Apple nunca se publican en el repositorio.
- Validar en backend firmas, issuer, audience, nonce, state, PKCE, expiración y URI de retorno.
- Usar cookies seguras, protección CSRF para mutaciones, rotación/revocación, límites de intentos y rate limiting.
- Para OTP: límite por cuenta/IP/dispositivo, caducidad breve, uso único y respuestas que no revelen si una cuenta existe.
- Para identidad: proveedor y base jurídica aprobados, evaluación de privacidad, plazos de borrado, control de acceso y separación entre datos identificativos y expediente contractual.
- No guardar DNI, teléfono, imágenes ni estados de verificación en QR público o localStorage. No almacenar documentos de identidad en GitHub.
- Publicar aviso de privacidad y revisar RGPD/LOPDGDD con asesoría competente.
- Mantener GitHub Pages como demo estática o mover la aplicación autenticada a hosting con backend. No incluir secretos ni afirmar que el despliegue está listo para producción.

## Configuración frontend

El archivo público `config.js` contiene actualmente:

```js
window.CONTRACT_ENGINE_CONFIG = Object.freeze({
  authBaseUrl: "",
  identityProviderHosts: []
});
```

El valor `authBaseUrl` debe configurarse con una URL HTTPS de API, nunca con una clave secreta. `identityProviderHosts` debe incluir solo los nombres de host exactos del proveedor elegido. La configuración actual vacía hace que el adaptador falle explícitamente y no simule una sesión.

## Criterios de aceptación

- Sin backend configurado, registro, OAuth, OTP e identidad no se muestran como completados.
- La sesión sobrevive a recargas mediante cookie de servidor y puede revocarse.
- La cuenta no accede al formulario personalizado hasta que el servidor confirme los requisitos aplicables.
- Cambiar el estado en el navegador no desbloquea el formulario ni permite acceder a datos ajenos.
- DNI, OTP y tokens no aparecen en URL, logs, analítica, QR público ni almacenamiento local.
- Tests de OAuth state/nonce/PKCE, CSRF, expiración, reuso de OTP, rate limits, control de acceso y borrado pasan antes del lanzamiento.

## Backend de referencia implementado

La API Cloudflare Workers + D1 del repositorio contempla:
- Registro de contraseña y verificación de correo por enlace de un solo uso mediante Resend.
- Sesiones server-side con cookies HttpOnly, Secure y SameSite=None, almacenando solo el hash del token de sesión.
- Google OIDC con state, nonce y PKCE; Apple Sign in with Apple con client-secret ES256 generado en servidor y validación de ID token.
- Verificación telefónica mediante Twilio Verify, con códigos de corta duración, intentos limitados y estado de servidor.
- Inicio de verificación documental con Stripe Identity. El estado cambia a verified únicamente cuando se recibe y valida el webhook de Stripe.
- Rate limits básicos en D1, CORS restringido al origen configurado, consultas SQL preparadas y endpoint de salud sin exposición de configuración.

El esquema está en `workers/api/schema.sql`. La configuración de Wrangler y los pasos de despliegue están en `workers/api/wrangler.toml` y `workers/api/README.md`. La API requiere una cuenta Cloudflare, base D1, remitente de correo, credenciales Google/Apple, Twilio, Stripe y un dominio propio. Ninguno de esos servicios queda activado por publicar la página estática.

## Restricción del dominio

La URL actual de GitHub Pages y un API en workers.dev son sitios diferentes. Aunque el backend usa cookies Secure y SameSite=None y CORS con credenciales, los controles de cookies de terceros de los navegadores pueden interrumpir la continuidad de sesión. El despliegue de producción debe poner la app y la API bajo el mismo dominio registrable (por ejemplo app.example.com y api.example.com). No activar login real en GitHub Pages con un API de otro sitio sin probar navegadores y configurar el dominio adecuado.

## Limitaciones aún abiertas

- Recuperación de contraseña y revocación total de sesiones en todos los dispositivos.
- Gestión de roles/organizaciones y autorización por expediente.
- Backups, restauración, retención y borrado automático, telemetría y alertas.
- Persistencia cifrada de documentos contractuales y generación/almacenamiento de contratos.
- Proveedor de firma electrónica y validación de firmas.
- Revisión de seguridad, privacidad, accesibilidad, cobertura legal y pruebas E2E antes de producción.
