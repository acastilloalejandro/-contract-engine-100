# Revalidación CI v5.2.0

La ejecución `37877790482` falló en `npm test` por una aserción de regresión que esperaba que `additionalDocuments` se marcara como privado. El esquema de la rama ya debe declarar ese campo como `private: true`. Esta nota no sustituye una ejecución verde: el cambio solo se considerará validado cuando el workflow correspondiente al último SHA termine correctamente.

## Comprobaciones que quedan

- `npm test` completo en Node 24.
- Comprobación visual real de la página publicada.
- Validación del CSP con la configuración de producción.
- Pruebas E2E y de accesibilidad en navegadores.
- Configuración y despliegue de la API antes de activar autenticación, firma o verificación real.
