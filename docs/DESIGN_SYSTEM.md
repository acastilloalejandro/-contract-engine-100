# bithome · Fusion Light Design System 1.0

Autor: Alejandro Hernández Castillo. Producto: Bithome, web iPhone-first en modo claro.

Diseño propio basado en patrones generales de usabilidad financiera y guías de interfaz de Apple. «Apple Foundation Fusion Design» es un nombre de enfoque solicitado, no un sistema de diseño oficial acreditado por Apple. No se utiliza código, backend, fotografías, logotipos ni recursos propietarios de World Money.

## Tokens web

| Token | Valor | Uso |
|---|---|---|
| --canvas | #f6f8fb | Fondo |
| --surface | #ffffff | Tarjetas |
| --text | #15223b | Texto |
| --muted | #67738a | Texto secundario |
| --border | #e6eaf1 | Separadores |
| --blue | #195cec | Primario |
| --blue-tint | #edf3ff | Superficies activas |
| --mint | #0b896a | Confirmaciones no monetarias |

La web usa la pila tipográfica de sistema, sin distribuir fuentes propietarias. Figma usa Inter como equivalencia editable para el documento de diseño, no como fuente empaquetada del frontend.

## Componentes y flujos

Marca, aviso de entorno, hero, tarjeta, asistente de cinco pasos, campos declarativos, errores contextuales, selector, casilla, cotización BTC/EUR, revisión narrativa, exportación JSON, progreso y resumen. Paso a paso: Personas → Inmueble → Precio y Bitcoin → Condiciones → Revisión.

Figma contiene tokens reutilizables, componentes de botón y campo, y una pantalla editable con la dirección visual. Archivo: https://www.figma.com/design/aETVQUp6nLu6EkCA62SM3z

## Accesibilidad, seguridad y límites

Diseño responsive, controles táctiles, estados visibles de foco, etiquetas vinculadas, errores aria-invalid, aria-live, preferencia reduced-motion. VoiceOver y Safari iOS deben probarse en dispositivos reales antes de afirmar conformidad WCAG.

El formulario de demostración solo mantiene el estado en memoria. No envía datos al backend y no solicita direcciones de carteras, claves ni semillas. La API de Cloudflare es una referencia sin desplegar: solo almacena tipo de inmueble y fase por usuario autenticado. Ninguna parte de esta implementación ejecuta Bitcoin, custodia fondos, firma escrituras o verifica identidades.
