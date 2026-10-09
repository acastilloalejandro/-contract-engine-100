# Compraventa inmobiliaria en España con Bitcoin · Módulo MVP

**Estado: borrador local, sin custodia, sin firma, sin verificación y sin pago.** Autor: Alejandro Hernández Castillo.

Ruta de demostración: `/real-estate/`. Se conserva intacto el formulario laboral original y su versión 5.2.1. El módulo inmobiliario tiene versión independiente 1.0.0 y reglas propias.

## Alcance real
- Identificación textual de las partes, referencia catastral, carácter nuevo/usado, valor EUR, BTC, referencia de cotización y fecha, propuesta de liquidación y revisión.
- Validaciones deterministas de formato y cantidad máxima de 8 decimales BTC. No se valida titularidad, vigencia catastral, valoración ni el DNI.
- Previsualización y exportación JSON local con SHA-256. Hash **no es firma**; exportación **no es escritura**, enlace ni autenticación de pago.
- El módulo no pide DNI/NIE, fotos, claves privadas, frases semilla o direcciones BTC y no transmite datos al servidor.

## Pendientes bloqueantes de producción
1. Informe notarial y fiscal independiente por tipología y comunidad autónoma. **No asumir una fiscalidad idéntica para toda operación ni una segunda liquidación del ITP automática**. La venta inmobiliaria y la disposición de BTC pueden generar hechos imponibles distintos según la calificación y circunstancias.
2. Comprobación de identidad, capacidad, titularidad y cargas por profesionales habilitados; nota simple, Catastro, certificado energético y expediente de medios de pago; minimizar documentación personal.
3. Consentimiento informado para la cotización pactada: fuente, hora UTC, expiración, comisiones, volatilidad, red, confirmaciones, reversos/imposibilidad de reversión, incidentes, prueba de entrega y conciliación de pagos.
4. Arquitectura autenticada de expedientes: autorización por expediente en cada ruta, DB D1 y R2 cifrado por objeto con KMS; firma electrónica con proveedor cualificado cuando proceda y coordinación notarial, verificaciones externas de firma, sello temporal y evidencia retenida según plazo legal.
5. Análisis RGPD (registro de actividades, contratos con encargados, evaluación de necesidad de EIPD), regulación AML/CFT, evaluación MiCA/servicios cripto; no afirmar que todo adquirente de inmueble está obligado a KYC como sujeto obligado.
6. Reglas WAF, límites de tasa, logs sin PII, auditoría append-only externamente sellada, retención limitada, recuperación, pentest y controles de acceso.
7. Integrar E2E y entorno sandbox de proveedor de pagos **sin custodia ni claves privadas**. No habilitar instrucciones de pago reales antes de aprobación notarial, fiscal y de seguridad.
8. Evaluar NIST ML-KEM (FIPS 203), ML-DSA (FIPS 204) y SLH-DSA (FIPS 205) como hoja de ruta, sin fingir que Bitcoin on-chain es poscuántico.
9. Despliegue productivo requiere dominio API distinto de GitHub Pages o enrutamiento compatible, cookies seguras y configuración real: Pages estático **no ofrece backend**.

## Referencias normativas y técnicas para revisión
- BOE: Código Civil, arts. 609, 1278–1280, 1445 y ss.; Ley Hipotecaria.
- AEAT: IRPF sobre transmisión de inmuebles; tratamiento de permutas (art. 37.1.h LIRPF); disposición de criptoactivos; ITP/IVA/AJD.
- BOE: Ley 10/2010 PBC/FT; Reglamento eIDAS, RGPD y LOPDGDD.
- AEPD: desde 2018 no se inscriben ficheros; mantener registro de actividades cuando proceda.
- OWASP ASVS, Cheat Sheets: File Upload, Authentication, Session Management, CSRF.
- NIST estándares PQC FIPS 203/204/205.

No convertir este documento en una lista de garantías ya implementadas.
