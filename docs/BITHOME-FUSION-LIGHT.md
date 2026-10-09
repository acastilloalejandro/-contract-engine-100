# bithome · Arquitectura Fusion Light 1.1
**Autor y contacto:** Alejandro Hernández Castillo · acastilloalejandro@icloud.com  
**Estado:** implementación experimental en el repositorio. No certificada, no desplegada como API operativa.  
**Figma:** https://www.figma.com/design/aETVQUp6nLu6EkCA62SM3z

## Propósito y limitaciones
bithome es una interfaz original para preparar borradores de compraventa inmobiliaria en España con una contraprestación documentada en BTC y EUR. No liquida activos, no proporciona custodia, no obtiene tipos de cambio, no firma escrituras y no reemplaza asesoramiento profesional.

El lenguaje visual **Fusion Light** es un nombre interno: adopta principios generales de claridad, fondos claros, superficies jerarquizadas, navegación progresiva, controles táctiles accesibles y reducción de movimiento. No constituye un framework ni un producto oficial de Apple. El sistema está inspirado en patrones públicos de experiencia fintech y no utiliza código, marca, identidad gráfica, APIs internas ni backend propietarios de World Money.

## Módulos y límites de confianza
| Capa | Entrada | Estado | Destino |
|---|---|---|---|
| Portal | `index.html` | Entrypoint Bithome con acceso al módulo histórico | GitHub Pages |
| UI principal | `real-estate/index.html`, `style.css`, `main.js` | Wizard local y exportación JSON | Navegador |
| Contrato de datos | `real-estate/schema.js` | Campos declarativos, condicionalidad, validación de precisión, estado DRAFT_UNVERIFIED | Navegador |
| Diseño | Figma "Fusion Light" y tokens CSS | Variables y componentes editables, sin dependencia runtime de Figma/Adobe | Diseño |
| API de referencia | `workers/api/src/index.js` | Endpoints autenticados que aceptan solo tipo de inmueble y fase | Cloudflare Worker sin desplegar |
| Base de datos | `workers/api/schema.sql` + migración bithome | Relación user_id, metadatos y control de acceso | D1 sin provisionar |
| Protección | `tests`, CI y revisiones | Pruebas unitarias y reglas de acceso | GitHub Actions |
| Histórico | `app/`, `styles/world-ui.css` | Motor contractual 5.2.1 independiente, conservado | GitHub Pages |

No unificar tablas ni registros entre expedientes laborales e inmobiliarios. No migrar datos históricos de usuarios sin revisión y consentimiento cuando sea necesario.

## Flujo de formulario
Personas → Inmueble → Precio y Bitcoin → Condiciones → Revisión. Los campos condicionales se ocultan según el método de pago y tipo de arras. Las respuestas desactivadas se excluyen del borrador exportado. Los errores enfocan el control afectado. El cálculo EUR/BTC mostrado es una **relación matemática de importes introducidos**, nunca una cotización de mercado ni una orden.

El documento exportado es local y lleva fecha UTC, estado `DRAFT_UNVERIFIED` y hash SHA-256. Una huella no demuestra autenticidad legal, posesión de claves, confirmaciones Bitcoin ni firma electrónica.

## API de expedientes (pendiente de despliegue)
**Requiere:** orígenes HTTPS configurados, sesión de servidor verificada, D1 provisionada, migraciones, TLS, política de retención, pruebas de autorización y auditoría de seguridad. Las cookies `__Host-ce_session` existentes exigen un esquema de dominios compatible con SameSite.

Rutas habilitadas en código: `POST /v1/real-estate/cases`, `GET /v1/real-estate/cases`, `GET /v1/real-estate/cases/:id`. `POST` solo acepta `{"propertyType":"segunda_mano|obra_nueva","phase":1..5}`. La API **rechaza** cualquier campo extra, incluidos nombres, direcciones y carteras. Todas las lecturas consultan `user_id`, obtenido de la sesión y nunca del cliente. No hay `PUT` de casos ni lógica de transferencias.

El navegador no utiliza actualmente esos endpoints: la página tiene CSP `connect-src 'none'` para el prototipo local, por diseño. Una integración real requiere frontend autenticado, CSP de origen API explícito, proxy/domino compatible, CSRF, aviso de privacidad y pruebas end-to-end antes de activar sincronización.

## Migraciones e infraestructura
1. Crear Worker y D1 bajo nombres bithome; sustituir el ID de base `REPLACE_WITH_D1_DATABASE_UUID`.
2. Desplegar esquema inicial; en instancias existentes ejecutar `workers/api/migrations/20261009_bithome_cases.sql`, más la migración de idempotencia cuando proceda. No ejecutar esquema y migración dos veces sin revisar.
3. Configurar `APP_ORIGIN`, `API_ORIGIN`, secretos OAuth y correo en entorno protegido.
4. Ejecutar suite API, permisos por expediente y pruebas E2E con dos cuentas aisladas.
5. Validar requisitos de RGPD, servicios cripto/AML, notaría y fiscalidad en España antes de habilitar operaciones reales.

## Cobertura de las 50 propuestas
**Implementadas o parcialmente integradas:** pasos 1-10 de manera básica, condicionalidad 3-4, campos financieros 16-20 en alcance parcial, red y método 21-24 de forma informativa, exportación 49 en JSON e impresión y controles de accesibilidad 31-40 en alcance parcial. Se mantiene estado no verificado explícito (29) y prohibición de claves (42).

**Pendientes y no simuladas:** verificación catastral real, cotización externa, validación de cargas, KYC, proveedor de firma, multisig operativa, pagos reales, TXID comprobable, custodia cifrada, auditoría de eventos inmutable, automatización notarial/fiscal y PDF/DOCX nativos. Los requisitos del documento `BITHOME-50-FORM-IDEAS.md` son una hoja de ruta, no un inventario de prestaciones habilitadas.

## Condiciones de aceptación
- No debe ser posible crear o consultar casos sin sesión válida y origen admitido.
- Una cuenta no debe obtener datos de casos de otra.
- Las peticiones de creación con campos personales o BTC no permitidos deben fallar sin insertar datos.
- No se comunica un resultado Bitcoin como confirmado, firmado ni ejecutado.
- El diseño debe poder usarse con teclado, móvil, modo claro y movimiento reducido.
- El despliegue de Pages no debe presentarse como backend Cloudflare operativo.
