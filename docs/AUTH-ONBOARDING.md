# Autenticación e incorporación: contrato de integración

## Estado actual

La aplicación publicada es un frontend estático servido desde GitHub Pages. GitHub Pages no proporciona sesiones privadas, base de datos, secretos OAuth, envío de SMS ni verificación de DNI. Un botón o campo no demuestra autenticación ni identidad verificada.

Esta rama añade un adaptador frontend provider-neutral (app/auth.js) y define el contrato que deberá implementar el backend. No marca usuarios como autenticados o verificados por sí solo.

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
- Validar en backend firmas, issuer, audience, nonce, state, PKCE, expiración y URI de retorno. No confiar en un email recibido del navegador.
- Usar cookies seguras, protección CSRF para mutaciones, rotación/revocación, límites de intentos y rate limiting.
- Para OTP: límite por cuenta/IP/dispositivo, caducidad breve, uso único y respuestas que no revelen si una cuenta existe.
- Para identidad: proveedor y base jurídica aprobados, evaluación de privacidad, plazos de borrado, control de acceso y separación entre datos identificativos y expediente contractual.
- No guardar DNI, teléfono, imágenes ni estados de verificación en QR público o localStorage. No almacenar documentos de identidad en GitHub.
- Publicar aviso de privacidad y revisar RGPD/LOPDGDD con asesoría competente.
- Mantener GitHub Pages como demo estática o mover la aplicación autenticada a hosting con backend. No incluir secretos ni afirmar que el despliegue está listo para producción.

## Configuración frontend

El hosting puede inyectar window.CONTRACT_ENGINE_CONFIG = { authBaseUrl: "https://api.example.com" } antes de cargar app/main.js. El valor debe ser un endpoint público, nunca una clave secreta. Si no está configurado, el adaptador falla explícitamente y no simula una sesión.

## Criterios de aceptación

- Sin backend configurado, registro, OAuth, OTP e identidad no se muestran como completados.
- La sesión sobrevive a recargas mediante cookie de servidor y puede revocarse.
- La cuenta no accede al formulario personalizado hasta que el servidor confirme los requisitos aplicables.
- Cambiar el estado en el navegador no desbloquea el formulario ni permite acceder a datos ajenos.
- DNI, OTP y tokens no aparecen en URL, logs, analítica, QR público ni almacenamiento local.
- Tests de OAuth state/nonce/PKCE, CSRF, expiración, reuso de OTP, rate limits, control de acceso y borrado pasan antes del lanzamiento.

## Pantallas frontend añadidas

La pantalla de acceso vive en `index.html` y la lógica está en `app/onboarding-ui.js`. El shell contractual permanece oculto hasta que el usuario elige explícitamente la demo o el servidor confirma una sesión y el estado de incorporación. El formulario de onboarding solicita teléfono y redirige a una página de identidad solo si el host está autorizado en `config.js`.

`config.js` es público y solo contiene configuración no secreta. Para habilitar el backend se configura `authBaseUrl` con un endpoint HTTPS y `identityProviderHosts` con los dominios exactos del proveedor elegido. Nunca colocar tokens privados ni claves de Apple en ese archivo.

Los borradores locales se separan mediante un identificador de cuenta hasheado, pero esto no cifra el contenido del navegador. El distintivo de interfaz debe conservar la aclaración de que el borrador es local hasta que se implemente almacenamiento server-side.

La copia completa del DNI no se solicita en la pantalla de onboarding: el flujo arranca mediante un proveedor especializado. Esto sigue el principio de minimización. La AEPD indica que, como regla general, una copia del DNI no es necesaria para ejercer derechos y que deben protegerse datos no necesarios cuando se facilite una copia: https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/3-identificacion-con-dni/FAQ-0108-para-el-ejercicio-de-estos-derechos-es-necesario-facilitar-la-copia-del-dni
