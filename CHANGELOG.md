# Changelog

Los cambios funcionales y de entrega se registran aquí. Una entrada no implica por sí sola que la versión esté desplegada en producción.

## 5.1.0 — candidato de actualización (2026-10-09)

- Sincronizar versión del paquete, documentación e interfaz.
- Actualizar la matriz CI a Node.js 24 LTS y las acciones oficiales `checkout` / `setup-node` v7.
- Incorporar `package-lock.json` y sustituir instalaciones mutables por `npm ci --ignore-scripts`.
- Ampliar los disparadores de calidad para que cambios en app, API, esquema y configuración también ejecuten pruebas.
- Documentar Wrangler 4.148.0 como versión CLI reproducible para el procedimiento actual.
- Integrar la arquitectura modular y estrategia de producto mantenidas en `main`.

### No incluido en esta publicación

- La API Cloudflare no está desplegada; los proveedores externos y secretos deben configurarse fuera del repositorio.
- No se ha integrado ni desplegado esta rama en la URL pública de GitHub Pages.
- La identidad, el correo, los OTP y la firma requieren pruebas end-to-end con cuentas de proveedor reales antes de producción.

## 5.0

- Versión anterior del Field System.
