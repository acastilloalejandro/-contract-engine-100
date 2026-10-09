# Changelog

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
