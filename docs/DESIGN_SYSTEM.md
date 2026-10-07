# Contract Engine 100 · UI Design System 4.0

La interfaz adopta una gramática visual inspirada en aplicaciones financieras móviles modernas, en particular el patrón observado en World Money: encabezado compacto, métrica principal grande, acciones rápidas en pastillas, tarjetas de información compactas y navegación inferior.

## Principios
- iPhone-first, una columna y anchura contenida.
- Una métrica principal por pantalla, usada aquí para el progreso del expediente.
- Acciones primarias cortas y táctiles.
- Tarjetas con superficies neutras, separación suave y mínima decoración.
- Navegación inferior persistente.
- Dark mode, safe areas y reducción de movimiento.
- Zoom del sistema permitido. No se bloquea la ampliación del contenido.
- No se incorporan logotipos, ilustraciones ni recursos propietarios de terceros.

## Mapeo al producto
World Money: saldo principal → Contract Engine: progreso del expediente.
World Money: Buy / Send / More → Contract Engine: Continuar / Revisar / Tema.
World Money: tarjetas de activos → Contract Engine: campos / documentos / errores / versión.
World Money: navegación inferior → Contract Engine: Formulario / Documentos / Revisión / Estado.

## Componentes
world-hero, world-mini-card, world-action, world-nav, world-tab, world-section-title y glass forman la capa visual compartida.

## Rendimiento
La capa visual está separada en styles/world-ui.css. Se evita el blur pesado en las tarjetas principales. El guardado de borrador usa debounce de 350 ms. Los object URLs de documentos se revocan al eliminar archivos.

## Límites
Esta implementación es una inspiración funcional y visual. No incorpora código, logotipos, imágenes ni activos propietarios de World Money.