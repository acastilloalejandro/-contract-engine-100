# Gates de producción · Contract Engine 100

No presentar la aplicación como lista para producción hasta que se hayan completado todas las puertas aplicables y se hayan guardado las evidencias de verificación.

## Estado de la rama candidata 5.2.0 (9 de octubre de 2026)

- [ ] PR [#13](https://github.com/acastilloalejandro/-contract-engine-100/pull/13) contiene el endurecimiento local y la vista previa imprimible; ejecutar los checks del SHA más reciente antes de fusionar.
- [x] Implementados en la rama: versión sincronizada, ausencia de jurisdicción predeterminada, minimización de campos privados/restringidos en borrador JSON y huella, validación inicial de archivos en cliente, persistencia local de adjuntos, QR local, etiqueta «NO VERIFICADO», CSP meta, shell PWA versionado y borrador contractual imprimible.
- [ ] Repetir CI completa tras añadir la vista previa contractual y su CSS de impresión; no reutilizar el resultado verde de un SHA anterior.
- [ ] Probar la URL publicada en Safari/iOS y en un navegador de escritorio; el contenido de la rama aún no está publicado en Pages.
- [ ] Desplegar API y D1, configurar proveedores y ejecutar integración end-to-end. `config.js` conserva `authBaseUrl: ""`; la autenticación real no está activa.
- [ ] Revisar la [matriz de las 50 optimizaciones](OPTIMIZATION-ROADMAP-50.md); la matriz diferencia trabajo aplicado, parcial y bloqueado.

## Historial verificado de la versión 5.1.0 (9 de octubre de 2026)

- [x] Versión 5.1.0 integrada en `main`, commit `444c3f7fd675ac8febb25a2514d3587fa209ebf0`.
- [x] CI `Contract Engine CI`: ejecución [#142](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410270) completada correctamente para la entrega anterior.
- [x] `contract-os`: ejecución [#132](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410267) completada correctamente para la entrega anterior.
- [x] GitHub Pages: ejecución [#2](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37875410276) completada correctamente para la entrega anterior.


## 1. Entrega y despliegue

- [x] CI de la versión integrada completa correctamente.
- [x] Workflow de publicación estática completo correctamente.
- [ ] Abrir la URL pública en Safari y al menos un navegador de escritorio; comprobar consola, carga de módulos, manifest, navegación, almacenamiento local, QR y enlaces.
- [ ] Añadir comprobación automatizada de disponibilidad de la URL pública y carga de recursos esenciales después de cada despliegue.
- [ ] Verificar configuración de dominio y política de caché para futuras actualizaciones.

## 2. Backend y configuración

- [ ] Crear Worker de Cloudflare y base D1 reales; sustituir `REPLACE_WITH_D1_DATABASE_UUID`.
- [ ] Aplicar `workers/api/schema.sql` a la base remota y validar migraciones.
- [ ] Elegir un dominio propio y publicar frontend/API bajo el mismo dominio registrable (por ejemplo `app.example.com` y `api.example.com`).
- [ ] Configurar `APP_ORIGIN`, `API_ORIGIN`, `authBaseUrl` y los dominios de identidad permitidos con los valores de producción exactos.
- [ ] Guardar credenciales mediante secretos de Cloudflare: Resend, Google, Apple, Twilio y Stripe. Ningún secreto debe almacenarse en GitHub ni en `config.js`.
- [ ] Configurar los URI de retorno de OAuth y el webhook de Stripe en cada proveedor.
- [ ] Comprobar `GET /health` y validar flujos de registro, confirmación de correo, login, logout, recuperación de contraseña, OAuth, OTP y verificación documental con cuentas de prueba.
- [ ] Probar cookies y sesiones en Safari/iOS, Chrome y Firefox, incluyendo caducidad, revocación y uso entre pestañas.

## 3. Seguridad y privacidad

- [ ] Revisión independiente de autenticación, autorización por recurso/rol, aislamiento entre usuarios y validación de entradas.
- [ ] Protección CSRF, CSP y cabeceras seguras verificadas en el dominio definitivo.
- [ ] Limitar abuso con rate limiting revisado, mitigación de bots/WAF, alertas y respuestas genéricas que eviten enumeración de cuentas.
- [ ] Definir retención, exportación y borrado de datos; probar borrado de cuenta y revocación de sesiones.
- [ ] Implementar almacenamiento de documentos cifrado, control de acceso, URLs firmadas, registro de auditoría y política de recuperación.
- [ ] Probar restauración de copias de seguridad y el procedimiento de respuesta a incidentes.
- [ ] Realizar evaluación de privacidad y revisión RGPD/LOPDGDD para los datos y proveedores seleccionados.
- [ ] Realizar pruebas de penetración y revisión de dependencias antes de aceptar datos reales.

## 4. Documentos, firma y verificación

- [ ] Persistencia server-side de expedientes, con versiones inmutables y snapshots de las reglas utilizadas.
- [ ] Renderizado determinista y pruebas de salida PDF/DOCX si se habilitan esos formatos.
- [ ] Integrar proveedor de firma y verificar las firmas en servidor; preparar una solicitud no equivale a firmar.
- [ ] Asegurar que QR y endpoint público exponen solo datos aprobados y nunca documentos privados, identificadores sensibles ni secretos.
- [ ] Validar las reglas jurídicas, fuentes autorizadas, jurisdicción, fechas efectivas y casos de regresión con profesionales competentes.
- [ ] Completar pruebas end-to-end y pruebas de accesibilidad con las pantallas finales.

## 5. Criterio de lanzamiento

La última publicación conocida, 5.1.0, está publicada como **demo estática**; la rama 5.2.0 candidata sigue sin ser producción, no como servicio contractual completo. No se debe habilitar producción general hasta que todas las casillas bloqueantes estén verificadas, documentadas y aprobadas. Si un gate no aplica, documentar la justificación en vez de marcarlo como superado.
