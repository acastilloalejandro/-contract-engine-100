# Changelog

## 5.2.1 — búsqueda y navegación de formulario (2026-10-09)

- Añadir búsqueda local por nombre de campo y sección, con normalización de acentos.
- Permitir filtrar campos obligatorios pendientes sin descartar respuestas ya introducidas.
- Añadir contador de campos visibles, estado vacío accesible y acción para limpiar filtros.
- Al intentar revisar un expediente incompleto, restablecer los filtros y llevar al primer campo con error.
- Actualizar la versión de la demo y la caché del service worker para evitar servir recursos antiguos.
- Incorporar comprobaciones de regresión para los nuevos controles y la versión publicada.

### Límites que permanecen

- La búsqueda y los filtros solo actúan sobre la interfaz del navegador; no verifican la legislación aplicable ni implican autenticación.
- La demo conserva las restricciones de la versión anterior: no introducir datos reales, documentos sensibles ni utilizarla como sistema contractual de producción.


## 5.2.0 — endurecimiento estático y local (2026-10-09, rama candidata)

- Añadir una previsualización contractual por secciones, lista de campos obligatorios pendientes e impresión/Guardar como PDF del navegador, con avisos visibles de borrador y no validación jurídica.

- Sincronizar el número de versión en esquema, paquete, lockfile e interfaz.
- Eliminar país y jurisdicción predeterminados; advertir de que un texto de jurisdicción no es una validación legal.
- Excluir campos `private` y `restricted` del borrador JSON y de la huella de integridad.
- Persistir/restaurar binarios de adjuntos localmente con IndexedDB y limpiar adjuntos del expediente al iniciar uno nuevo.
- Restringir adjuntos en cliente a PDF, JPEG, PNG y WebP con límite de 10 MB y comprobaciones iniciales de cabecera, MIME y extensión.
- Empaquetar el generador QR localmente y añadir licencia MIT para eliminar la carga de CDN en tiempo de ejecución.
- Separar el verificador QR estático y mostrar `NO VERIFICADO`, con límites explícitos de lo que comprueba.
- Añadir CSP en metadatos, política de referrer, icono/manifest PWA y service worker de shell versionado.
- Solicitar reconocimiento de advertencias antes de revisión, mejorar acceso al bloque documental y limitar la vista revisora a campos no privados/restringidos.
- Añadir pruebas de regresión para versión, minimización de datos, validación de archivos, moneda/jurisdicción y recursos PWA.
- Registrar el alcance y estado de las 50 recomendaciones en [OPTIMIZATION-ROADMAP-50.md](docs/OPTIMIZATION-ROADMAP-50.md).

### Límites que permanecen

- Estos cambios todavía no están fusionados ni publicados hasta que el PR y CI finalicen.
- La autenticación, OAuth, OTP, identidad, firma electrónica y comprobación del QR en servidor siguen sin estar operativas.
- IndexedDB es almacenamiento local sin cifrado de aplicación; no utilizar con documentos o expedientes reales.
- La validación del archivo ocurre en el cliente y no sustituye análisis antimalware del servidor.
- La CSP de metadatos debe ajustarse a los orígenes reales antes de habilitar una API externa; faltan cabeceras HTTP, E2E, pruebas en navegadores reales y revisión independiente.

Los cambios funcionales y de entrega se registran aquí. Una entrada no implica por sí sola que el producto completo esté listo para producción.

## 5.1.0 — frontend estático publicado (2026-10-09)

- Integrada en `main` mediante el commit `444c3f7fd675ac8febb25a2514d3587fa209ebf0`.
- El workflow de GitHub Pages y los flujos CI y contract-os finalizaron correctamente en la versión integrada.
- Sincronizar versión del paquete, documentación e interfaz.
- Actualizar la matriz CI a Node.js 24 LTS y utilizar instalación reproducible con `npm ci --ignore-scripts`.
- Incorporar `package-lock.json` y ampliar los disparadores de calidad para cambios en app, API, esquema y configuración.
- Documentar Wrangler 4.148.0 como versión CLI reproducible para el procedimiento actual.
- Integrar la arquitectura modular y la estrategia de producto mantenidas en `main`.
- Corregir la documentación para distinguir el despliegue de la demo estática del lanzamiento del servicio completo.

### No incluido en esta publicación

- La API Cloudflare no está desplegada; D1, los proveedores externos, dominios y secretos deben configurarse.
- `config.js` conserva `authBaseUrl` vacío: el acceso real no está activo.
- La URL pública no se pudo recuperar mediante el verificador web utilizado en la auditoría, aunque el workflow de publicación terminó correctamente. Verificar la página desde un navegador real.
- La identidad, el correo, los OTP y la firma requieren pruebas end-to-end con cuentas reales de proveedor antes de producción.
- Siguen pendientes funciones de producto y controles operativos descritos en [gates de producción](docs/PRODUCTION-GATES.md).

## 5.0

- Versión anterior del Field System.
