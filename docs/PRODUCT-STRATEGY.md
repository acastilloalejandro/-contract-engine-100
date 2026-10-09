# Contract Engine 100 — Estrategia de producto y plan de entrega

## Decisión de producto

Evolucionar a un Contract OS modular: un motor de expedientes y documentos contractuales con formularios adaptativos, reglas versionadas, evidencia trazable, revisión humana y preparación de firma. El núcleo común se separa de los paquetes jurídicos. El paquete laboral actual y el módulo de alquiler residencial español deben coexistir como módulos distintos, no sustituirse silenciosamente.

## Usuarios y tareas

- Iniciador: crear expediente, guardar borrador, completar datos/documentos y revisar errores.
- Contraparte: revisar condiciones sin acceder a respuestas privadas de protección.
- Revisor profesional: resolver alertas, verificar fuentes y aprobar cambios con trazabilidad.
- Administrador de organización (fase posterior): miembros, permisos, plantillas y auditoría.

## Principios no negociables

1. Explicar qué datos se solicitan, finalidad, acceso y retención.
2. Separar identidad y respuestas sensibles del documento compartible y del QR público.
3. Ningún control del navegador o valor en localStorage acredita identidad, consentimiento, firma o permiso.
4. Cada regla legal tiene jurisdicción, vigencia, fuente oficial y versión. Si falta evidencia, devolver REVIEW_REQUIRED.
5. La IA puede extraer, normalizar y explicar; la decisión jurídica se basa en reglas deterministas y revisión profesional cuando proceda.
6. Las versiones emitidas son inmutables; las correcciones crean una versión nueva.
7. Accesibilidad, uso móvil, idioma claro y tolerancia a conexiones lentas son requisitos del producto.
8. No implementar retención de documentos, restricción de movimiento ni control coercitivo sobre personas.

## Arquitectura objetivo

- UI: web app accesible, responsive e instalable, con tokens, componentes y estados de error/loading/empty.
- Form engine: esquema declarativo, dependencias, validación, guardado y recuperación.
- Contract core: ContractState canónico, normalización, clasificación, resolución jurisdiccional, reglas deterministas, evidencia, selección de cláusulas y AST.
- Trust service: autenticación OIDC, sesiones seguras, verificación de teléfono/identidad, firma y webhooks autenticados.
- Data layer: base de datos transaccional, almacenamiento cifrado, versionado y retención.
- Audit: eventos mínimos; no registrar OTP, contraseñas, documentos de identidad ni respuestas sensibles.
- Renderers: HTML accesible, PDF y QR que expone solo identificadores públicos, versión y huella.
- Operations: CI, análisis de dependencias, CSP, backups, observabilidad, recuperación y respuesta a incidentes.

GitHub Pages sirve para una demo estática, no para sesiones privadas, secretos OAuth, SMS ni verificación certificada. La versión autenticada requiere backend.

## Flujo principal

1. Elegir módulo contractual y jurisdicción.
2. Iniciar sesión o entrar en demo con datos sintéticos.
3. Explicar la finalidad y solicitar los datos mínimos.
4. Verificar correo/teléfono y, cuando proceda, iniciar verificación de identidad con proveedor.
5. Completar un wizard adaptativo con progreso, ayuda contextual y validación inmediata.
6. Adjuntar evidencia y mostrar quién tendrá acceso.
7. Ejecutar validación determinista y clasificar READY o REVIEW_REQUIRED.
8. Mostrar vista previa y diff antes de confirmar.
9. Generar versión inmutable y enviar a firma solo tras autorización.
10. Publicar QR/enlace de verificación con datos mínimos, expiración y revocación según política.

## Fases

### P0 — Estabilizar concepto y seguridad
- Un núcleo Contract OS y registro de módulos.
- Resolver ambigüedad entre flujo laboral y alquiler.
- Auditar persistencia local de documentos y campos sensibles.
- Criterios de aceptación y regresión.

### P1 — UX y formulario
- Wizard de cinco etapas configurable por módulo.
- Guardado/reanudación con estado explícito y tratamiento seguro de datos.
- Vista previa, diff por versión y revisión de errores.
- WCAG 2.2 AA, teclado, VoiceOver, foco visible y errores asociados.
- Estados vacío, carga, desconexión, error y recuperación.

### P2 — Identidad y confianza
- Backend, cuentas, recuperación y verificación de correo.
- Google/Apple OIDC con state, nonce, PKCE y redirect URIs exactas.
- OTP de un solo uso, expiración, rate limits y protección contra enumeración.
- Verificación de DNI mediante proveedor aprobado; la sintaxis no verifica identidad.
- WebAuthn con challenge de servidor y proveedor de firma real.
- Autorización por recurso/rol, CSRF, rotación de sesión y auditoría.

### P3 — Calidad jurídica y datos
- Matriz de jurisdicción, vigencia y fuente oficial.
- Tests de frontera de fechas, importes, moneda y cláusulas condicionales.
- Revisión profesional por jurisdicción y changelog de reglas.
- Cifrado, backups, retención, exportación, rectificación y borrado.

### P4 — Lanzamiento
- CI verde, análisis estático y dependencias fijadas.
- E2E móvil/desktop y pruebas de seguridad.
- CSP, TLS, observabilidad y respuesta a incidentes.
- Piloto con datos sintéticos y métricas agregadas.

## Métricas

Medir finalización por etapa, abandono, validación al primer intento, errores de dependencia, tiempo de revisión, casos REVIEW_REQUIRED, fallos de autenticación, recuperación y defectos de accesibilidad. No fijar objetivos numéricos sin línea base.

## Criterios de producción

Backend real y autorización por recurso; proveedores de identidad/firma probados; ningún secreto en frontend, Git, logs o QR; reglas legales versionadas con cobertura declarada; CI y E2E aprobados; privacidad/retención publicadas; revisión de seguridad, accesibilidad y legal completada. Rotular la demo como demo hasta cumplirlo.

## Estado honesto

El repositorio contiene motor de formulario, validación, hashing, documentos locales, snapshots, revisión, QR estático y tests. Persistencia multiusuario, autenticación real, verificación certificada y firma real siguen siendo gates de producción. Este documento es el plan, no evidencia de servicios desplegados.
