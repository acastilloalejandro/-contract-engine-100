# Revalidación CI v5.2.0

La primera ejecución falló porque el test usaba una expresión regular que no incluía la sección y la etiqueta del campo `additionalDocuments`. La aserción fue corregida para comprobar su definición completa. Una ejecución intermedia falló por una expresión regular mal escapada al añadir el test postdespliegue; se sustituyó por una comprobación de cadena simple.

## Últimos resultados conocidos

- Commit verificado: `d4051ffb4bfab33952bbd0b57d35e93f2f8094e8`.
- [Contract Engine CI](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37878570802): correcto.
- [contract-os / quality](https://github.com/acastilloalejandro/-contract-engine-100/actions/runs/37878570856): correcto.

Las ejecuciones corresponden a ese SHA. Repite CI si cambia el código. Tras fusionar, el workflow de Pages ejecutará la comprobación automatizada de rutas y recursos; aún requiere confirmación visual humana en Safari/iOS y escritorio.
