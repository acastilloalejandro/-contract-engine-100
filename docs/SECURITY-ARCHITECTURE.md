# Modelo de amenazas y hoja de ruta de seguridad

**Proyecto:** Contract Engine 100  
**Responsable del proyecto:** Alejandro Hernández Castillo  
**Contacto de seguridad:** [acastilloalejandro@icloud.com](mailto:acastilloalejandro@icloud.com)  
**Estado del documento:** línea base y plan de trabajo; no constituye una certificación ni una auditoría independiente.

## 1. Alcance real y límite de garantía

El repositorio contiene una aplicación web estática publicada en GitHub Pages y una API de referencia todavía pendiente de despliegue/configuración. Mientras `config.js` mantenga `authBaseUrl` vacío, la interfaz no debe tratarse como un servicio de autenticación real. Un control del lado del navegador no puede sustituir la autenticación, autorización, validación de firmas ni controles de acceso aplicados en un servidor confiable.

No existe un sistema que pueda garantizar protección absoluta contra todos los ataques, sesgos, fallos de implementación o futuros avances criptanalíticos. Esta hoja establece controles verificables y riesgos pendientes; no afirma que el proyecto esté blindado ni certificado.

## 2. Activos y límites de confianza

- Código fuente, historial Git, workflows, dependencias, credenciales de mantenimiento y configuración de despliegue.
- Borradores contractuales, adjuntos locales y metadatos que una persona introduzca en el navegador.
- Integridad de artefactos descargados, configuración de runtime, sesiones y futuras claves del backend.
- Servicios externos: GitHub Pages/Actions, futuro proveedor de identidad, API, base de datos, correo/SMS y cualquier servicio criptográfico.

El navegador, el almacenamiento local, las entradas del usuario, los parámetros de URL, el código de terceros y los resultados de herramientas externas se consideran no confiables. Los secretos no deben llegar al frontend ni al repositorio.

## 3. Principales amenazas y medidas

| Amenaza | Control implementado en esta línea base | Trabajo pendiente / límite |
|---|---|---|
| Vulnerabilidades en JavaScript/TypeScript | Análisis CodeQL en PR, push a `main` y semanal | Revisar cada hallazgo y añadir pruebas para rutas críticas |
| Introducción de dependencias vulnerables | Dependency Review bloquea nuevas vulnerabilidades de severidad alta o crítica | Activar alertas de Dependabot y revisar todas las dependencias ya existentes |
| Dependencias o Actions obsoletas | Dependabot propone actualizaciones semanales | Revisar los diffs, validar cambios y fijar Actions a SHA completo donde sea viable |
| Secretos publicados accidentalmente | Política documentada: nunca incluir tokens, claves o datos reales | Activar secret scanning y push protection en la configuración de GitHub si el plan lo permite; rotar cualquier secreto expuesto |
| Compromiso de cuenta o de cadena de suministro | Workflows con permisos mínimos y sin publicar artefactos privilegiados desde forks | Activar MFA resistente a phishing/passkeys, revisar colaboradores, tokens y aplicaciones OAuth/GitHub Apps |
| Alteración maliciosa de `main` o del despliegue | CI y revisión por PR como línea base | Configurar reglas de rama: PR obligatorio, checks requeridos, sin force-push/borrado, aprobaciones y CODEOWNERS. Requiere acción administrativa de GitHub |
| XSS, inyección, datos maliciosos o acceso indebido | Análisis estático como detector complementario | Auditoría manual de DOM/HTML, validación de entradas, CSP y pruebas dinámicas; CodeQL no demuestra ausencia de fallos |
| Robo o exposición de documentos del usuario | Avisos sobre los límites del almacenamiento en navegador | Para uso real, backend con autorización por recurso, cifrado en tránsito y reposo, gestión/rotación de claves, retención/borrado y registro de auditoría |
| Suplantación de identidad o firma | La documentación distingue huellas de integridad de identidad y firma | Autenticación, identidad y firma deben validarse en servidor y con proveedores/protocolos auditados |

## 4. Preparación poscuántica

“Resistencia cuántica” no es una opción que se añada mediante una etiqueta ni una garantía de seguridad para toda la aplicación. Se aplica a algoritmos y protocolos concretos.

La aplicación actual no debe implementar criptografía propia ni afirmar que genera firmas electrónicas resistentes a ataques cuánticos. Las huellas de archivos sirven para detectar cambios en los bytes hashados, pero no acreditan identidad, autoría, tiempo fiable ni validez jurídica. El protocolo HTTPS/TLS de GitHub Pages está bajo el control del proveedor de alojamiento, no del JavaScript del repositorio.

Para el futuro backend, seguir un inventario criptográfico y una migración basada en estándares:
- **ML-KEM (FIPS 203):** encapsulación de claves para establecer secretos compartidos; no es una firma.
- **ML-DSA (FIPS 204):** firmas digitales poscuánticas.
- **SLH-DSA (FIPS 205):** firmas digitales basadas en hash como alternativa estandarizada.

Antes de desplegarlos, confirmar soporte en el protocolo, runtime, proveedor de identidad, certificados, bibliotecas y clientes; mantener interoperabilidad, gestión de claves y estrategia de actualización. No sustituir algoritmos a ciegas ni inventar esquemas híbridos. La guía de transición de NIST y el calendario del proveedor de infraestructura deben revisarse periódicamente.

Referencias:
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/Projects/Post-Quantum-Cryptography)
- [NIST FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205: SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)

## 5. Sesgos y seguridad de decisiones automatizadas

No presentar una puntuación, clasificación o señal automatizada como prueba de mala conducta, identidad o intención. Las señales de riesgo deben:
- explicar su propósito y límites;
- permitir revisión humana y corrección;
- minimizar datos y no utilizar atributos sensibles sin una base legal y evaluación apropiadas;
- registrar falsos positivos/negativos en pruebas controladas, sin incorporar datos contractuales reales al CI;
- evitar sanciones irreversibles basadas únicamente en una clasificación automatizada.

La revisión humana no elimina automáticamente el sesgo: hacen falta criterios medibles, datos de evaluación adecuados, documentación y seguimiento.

## 6. Requisitos antes de procesar contratos reales

1. Desplegar y auditar la API; configurar HTTPS, sesiones seguras, límites de frecuencia, validación de origen, CSRF cuando corresponda, autorización por objeto y registros sin datos sensibles.
2. Diseñar cifrado en reposo y gestión de claves en servidor; la clave no debe estar junto al documento cifrado ni incrustada en el cliente.
3. Hacer revisión de seguridad independiente, pruebas de penetración autorizadas y pruebas de recuperación/incidentes.
4. Validar controles de privacidad, retención/borrado, base legal y jurisdicciones de alojamiento.
5. Usar WebAuthn/passkeys y firma electrónica sólo con desafíos, validación y evidencias verificadas en servidor.
6. Configurar reglas de rama, protección de secretos, CodeQL, alertas de dependencias y notificaciones de seguridad en GitHub.

## 7. Interpretación de los workflows

CodeQL y Dependency Review son controles de detección dentro de CI, no una certificación. Dependency Review revisa los cambios de dependencias en PR; no equivale por sí solo a una auditoría exhaustiva de todo el historial o de componentes vendorizados. Los resultados deben revisarse y corregirse. La activación de características de seguridad de GitHub y las reglas de rama puede requerir cambios manuales en la configuración del repositorio y depende del plan disponible.

## 8. Criterio de aceptación

No declarar el sistema “seguro”, “blindado”, “cuánticamente seguro” ni apto para contratos reales por el simple hecho de que los workflows pasen. El criterio de salida requiere, como mínimo, revisión de resultados, protección de ramas y secretos configurada, backend operativo, pruebas de autorización e identidad, auditoría independiente y aprobación del responsable.
