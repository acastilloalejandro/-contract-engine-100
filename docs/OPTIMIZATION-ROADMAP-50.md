# Hoja de ruta de las 50 optimizaciones

Esta matriz convierte las 50 recomendaciones de la auditoría en un estado rastreable. «Aplicado» significa que el cambio está implementado en esta rama, no que haya pasado CI, esté fusionado o esté publicado. «Parcial» identifica un primer control cuyo alcance sigue limitado. Ningún elemento pendiente se considera superado por inferencia.

## P0 · Seguridad, integridad y verdad del producto

| # | Optimización | Estado en v5.2.0 | Límite o siguiente paso |
|---:|---|---|---|
| 1 | Unificar el número de versión | Aplicado | Validar el workflow antes de fusionar. |
| 2 | Eliminar la jurisdicción predeterminada de Arabia Saudí/Jeddah | Aplicado | Añadir selección de tipo de contrato y país. |
| 3 | Verificación QR contra un registro servidor | Pendiente de backend | La pantalla estática ahora rotula el resultado «NO VERIFICADO». |
| 4 | Firma electrónica real | Pendiente de proveedor | Preparar una solicitud no equivale a firmar. |
| 5 | API de autenticación en producción | Bloqueado por infraestructura | Desplegar Worker/D1, dominios, secretos y proveedores. |
| 6 | Persistencia real de los adjuntos en modo local | Parcial aplicada | IndexedDB conserva blobs localmente; no hay cifrado ni almacén de servidor. |
| 7 | Validar tipo y contenido de los archivos | Parcial aplicada | Allowlist, tamaño, MIME y firmas iniciales en cliente; se necesita análisis antimalware de servidor antes de producción. |
| 8 | Roles y permisos autoritativos | Parcial aplicada | La vista revisora oculta campos sensibles y no puede preparar firma; los permisos reales deben imponerse en servidor. |
| 9 | Explicar claramente el modo local | Aplicado | El aviso señala almacenamiento local sin cifrado y recomienda usar datos ficticios. |
| 10 | Pruebas reales de navegador y postdespliegue | Pendiente | Ejecutar Safari/iOS y navegador de escritorio sobre la URL publicada. |

## P1 · Producto y reglas contractuales

| # | Optimización | Estado en v5.2.0 | Límite o siguiente paso |
|---:|---|---|---|
| 11 | Selector de módulos contractuales | Pendiente | Separar contratación doméstica, alquiler y otros módulos en una experiencia visible. |
| 12 | Esquemas independientes por jurisdicción | Parcial | Hay estructura modular en `src/`; aún no está conectada plenamente al formulario estático. |
| 13 | Registro versionado de fuentes legales | Parcial | Ampliar fuentes oficiales, fechas de vigencia y proceso de revisión profesional. |
| 14 | Bloquear jurisdicciones desconocidas | Parcial aplicada | Se eliminó el valor por defecto y se añade aviso jurídico; no existe validador legal de jurisdicción. |
| 15 | Motor declarativo de cláusulas | Parcial | Existen piezas del motor en `src/`; integrar su salida al frontend contractual. |
| 16 | Validación condicional robusta | Parcial aplicada | Añadidos controles de email, teléfono, límites numéricos y avisos de moneda/jurisdicción; faltan reglas por ley aplicable. |
| 17 | Vista previa del borrador contractual | Parcial aplicada | Hay previsualización agrupada por secciones y campos pendientes; aún no es una plantilla legal final revisada por jurisdicción. |
| 18 | Exportación PDF/DOCX | Parcial aplicada | El navegador permite imprimir/guardar la previsualización como PDF; no hay generación PDF nativa ni exportador DOCX. |
| 19 | Historial inmutable de versiones | Parcial | Hay snapshots locales limitados; se necesita versionado persistente en servidor. |
| 20 | Separar integridad técnica de validez legal | Aplicado | La pantalla QR aclara que el formato no verifica expediente, identidad ni firma. |

## P1 · UX, accesibilidad y contenido

| # | Optimización | Estado en v5.2.0 | Límite o siguiente paso |
|---:|---|---|---|
| 21 | Onboarding por etapas | Parcial | Ya existe una pantalla de acceso/onboarding; falta validar el recorrido integrado con proveedores reales. |
| 22 | Indicador de progreso | Existente | El formulario muestra requisitos completados; revisar el cálculo por cada rol y módulo. |
| 23 | Vista dedicada de documentos | Parcial aplicada | El acceso navega al bloque documental y la revisión lista adjuntos; no hay biblioteca independiente completa. |
| 24 | Mensajes precisos de guardado | Parcial aplicada | La persistencia informa de fallos; falta prueba visual en navegadores reales. |
| 25 | Recuperación de borradores y adjuntos | Parcial aplicada | IndexedDB recupera blobs locales; la recuperación queda limitada al mismo navegador/dispositivo. |
| 26 | Errores accionables | Parcial | Mejorar ubicación de errores, mensajes y recuperación; quedan alertas de navegador. |
| 27 | Separar errores, advertencias y bloqueos | Aplicado parcialmente | Las advertencias requieren reconocimiento explícito; la revisión jurídica y las condiciones de bloqueo siguen necesitando pruebas. |
| 28 | Auditoría WCAG 2.2 AA | Pendiente | Ejecutar revisión automatizada y manual con teclado, lector de pantalla y contraste. |
| 29 | Internacionalización completa | Pendiente | Traducir validaciones, ayuda, errores y términos legales por idioma. |
| 30 | Pruebas responsive reales | Parcial | CSS móvil primero existe; aún falta una matriz de dispositivos y capturas verificadas. |

## P1 · Seguridad, privacidad y abuso

| # | Optimización | Estado en v5.2.0 | Límite o siguiente paso |
|---:|---|---|---|
| 31 | Content Security Policy | Parcial aplicada | Hay CSP meta para páginas estáticas; validar directivas y añadir cabeceras HTTP en el alojamiento definitivo. Ajustar `connect-src` antes de habilitar una API externa. |
| 32 | Eliminar el QR CDN dinámico | Aplicado | El generador QR está empaquetado localmente con licencia MIT. |
| 33 | Sesiones y autenticación reales | Bloqueado por backend | La detección de WebAuthn no autentica al usuario; implementar challenge y sesión servidor. |
| 34 | CSRF y validación de origen | Parcial | El backend de referencia tiene comprobaciones de origen; validar el flujo completo, cookies y tokens en el dominio real. |
| 35 | Autorización por expediente/recurso | Pendiente de backend | No fiar el rol de UI ni el identificador enviado por el cliente. |
| 36 | Minimización de datos sensibles | Parcial aplicada | Campos privados/restringidos salen del borrador JSON y la huella; los blobs siguen locales y sin cifrar. |
| 37 | Cifrado y gestión de claves | Pendiente | IndexedDB no es almacenamiento cifrado de aplicación; diseñar cifrado de servidor y ciclo de claves. |
| 38 | Auditoría sin secretos | Parcial | El registro local limita metadatos; falta registro central protegido y política de retención. |
| 39 | Rate limits y prevención de abuso | Pendiente de despliegue | Configurar límites, alertas, protección de bots y respuestas anti-enumeración. |
| 40 | Modelo de amenazas y pentest | Pendiente | Revisión independiente antes de aceptar datos reales. |

## P2 · Rendimiento, PWA y calidad de entrega

| # | Optimización | Estado en v5.2.0 | Límite o siguiente paso |
|---:|---|---|---|
| 41 | Presupuesto Core Web Vitals | Pendiente | Medir en producción; objetivos recomendados a p75: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1. |
| 42 | Carga diferida de módulos secundarios | Pendiente | Separar renderizador, revisión y exportadores en módulos que se carguen bajo demanda. |
| 43 | Procesar archivos grandes en Worker | Pendiente | La carga actual tiene límite de 10 MB; evaluar hashing/tratamiento fuera del hilo principal si crece la demanda. |
| 44 | Cacheo versionado y modo offline | Parcial aplicada | El service worker cachea recursos estáticos; no hace que la API ni el flujo contractual sean plenamente offline. |
| 45 | PWA completa | Parcial aplicada | Hay manifest, icono y service worker; verificar instalación, actualización y funcionamiento offline en dispositivos reales. |
| 46 | Tests unitarios de reglas | Parcial | Ampliados tests de privacidad/validación; falta cobertura amplia de reglas jurídicas y fronteras. |
| 47 | Tests end-to-end | Pendiente | Añadir Playwright u otra herramienta y ejecutarla en CI. |
| 48 | Regresión de privacidad/seguridad | Parcial aplicada | Nuevos tests para minimización, rol revisor y firma de archivos; no sustituyen pentest ni análisis server-side. |
| 49 | Observabilidad | Pendiente | Añadir logs, métricas y alertas evitando PII/secretos. |
| 50 | Gates automatizados de release | Parcial | CI incorpora nuevas comprobaciones; faltan pruebas E2E, comprobación de URL publicada, análisis de dependencias y seguridad. |

## Fuentes técnicas de referencia

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [AEPD: protección de datos por defecto](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-por-defecto)
- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)

## Regla de aceptación

La rama no puede declararse «producción lista» porque pase CI. Requiere backend real, revisión legal por jurisdicción, revisión independiente de seguridad/privacidad, pruebas de extremo a extremo, prueba de navegador y aprobación de todos los gates aplicables.
