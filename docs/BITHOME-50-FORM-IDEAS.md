# bithome · 50 ideas priorizadas para formularios inmobiliarios Bitcoin

Autor: Alejandro Hernández Castillo. Estas son propuestas, no funciones ya implementadas. Priorización: P0 seguridad, exactitud y usabilidad básica; P1 experiencia; P2 evolución.

## Arquitectura y navegación
1. **P0** · Asistente progresivo basado en objetivos.
2. **P0** · Campos declarativos versionados.
3. **P0** · Rutas condicionales según tipo de inmueble.
4. **P0** · Dependencias visibles entre campos.
5. **P0** · Indicador de progreso por tareas.
6. **P0** · Resumen lateral del expediente.
7. **P0** · Guardado explícito con alcance identificado.
8. **P0** · Continuación controlada de borradores.
9. **P0** · Historial reversible de cambios.
10. **P0** · Revisión final por bloques.

## Campos y validación
11. **P1** · Identidad con formato y verificación separadas.
12. **P1** · Referencia catastral con verificación oficial opcional.
13. **P1** · Dirección estructurada y autocompletado consentido.
14. **P1** · Selector de comunidad autónoma y municipio.
15. **P1** · Superficie con unidades y advertencias.
16. **P1** · Importes monetarios decimales exactos.
17. **P1** · BTC limitado a ocho posiciones decimales.
18. **P1** · Cotización BTC/EUR con fuente y UTC.
19. **P1** · Arras condicionales con calendario.
20. **P1** · Cláusulas adaptativas con origen normativo.

## Bitcoin y evidencia
21. **P1** · Selector on-chain o proveedor externo.
22. **P1** · Visualización de comisiones estimadas no vinculantes.
23. **P1** · Vista previa de liquidación sin ejecutar.
24. **P1** · Confirmación explícita de red Bitcoin.
25. **P1** · Protección contra direcciones copiadas incorrectamente.
26. **P1** · Explicación de volatilidad y caducidad de cotización.
27. **P1** · Registro de TXID con comprobación independiente futura.
28. **P1** · Multifirma de depósito con tercero evaluado jurídicamente.
29. **P1** · Distinción de pago solicitado y confirmado.
30. **P1** · Hash de borrador separado de firma efectiva.

## Diseño y accesibilidad
31. **P2** · Diseño responsive de columna única en iPhone.
32. **P2** · Tipografía de sistema y Dynamic Type web.
33. **P2** · Áreas seguras CSS env(safe-area-inset).
34. **P2** · Superficies translúcidas con alternativa opaca.
35. **P2** · Animaciones discretas con reduced-motion.
36. **P2** · Microinteracciones de foco y éxito verificable.
37. **P2** · Objetivos táctiles de al menos 44 px.
38. **P2** · Contraste AA y errores no basados solo en color.
39. **P2** · Navegación completa con teclado y lector de pantalla.
40. **P2** · Modo oscuro de alto contraste.

## Privacidad, seguridad y confianza
41. **P0** · Clasificación de sensibilidad por campo.
42. **P0** · No almacenar semillas ni claves privadas.
43. **P0** · KYC profesional con mínima recogida necesaria.
44. **P0** · Autorización por expediente en backend.
45. **P0** · Almacenamiento documental segregado y cifrado.
46. **P0** · Expediente con eventos append-only comprobables.
47. **P0** · Firma electrónica identificada por proveedor.
48. **P0** · QR público que no contiene datos personales.
49. **P0** · Exportación JSON PDF DOCX con estados claros.
50. **P0** · Checklist notarial y fiscal antes de habilitar cierre.

## Condiciones de aceptación
- Nunca presentar una operación como pagada, firmada o verificada sin evidencia backend independiente.
- Separar propuesta de pago y pago efectivo.
- Ningún campo sensible debe enviarse o aparecer en URL sin base legal ni protección adecuada.
- Probar en iPhone/Safari, escritorio, teclado, VoiceOver y modo de movimiento reducido.
- Desplegar solo tras CI, controles jurídicos y pruebas de regresión.
