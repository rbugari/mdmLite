# Analisis del input demo - MDM Lite

## Archivo revisado
`input_mvp_ventas_perseida_v2.xlsx`

## Hojas detectadas
1. `facturas_cabecera`
2. `facturas_detalle`
3. `clientes`
4. `materiales`
5. `sociedades`
6. `mdm_clientes_equivalencia`
7. `mdm_clientes_agrupacion`
8. `mdm_parametros_pvp`

## Estructura relevante para el MVP

### `mdm_clientes_equivalencia`
Columnas:
1. `source_value`
2. `target_value`
3. `activo`

Ejemplo:
- `ALDI SAN ISIDRO SUPERMERCADOS, S.L.` -> `ALDI SUPERMERCADOS`

### `mdm_clientes_agrupacion`
Columnas:
1. `cliente`
2. `grupo_cliente`

Ejemplos:
- `EROSKI S.COOP.` -> `EROSKY`
- `PRIMOR INVESTMENT MANAGEMENT, S.L.` -> `PRIMOR`

### `mdm_parametros_pvp`
Columnas:
1. `cliente`
2. `factor`

Ejemplos:
- `PRIMOR INVESTMENT MANAGEMENT, S.L.` -> `0.97`
- `MARJANE` -> `1.09`

## Observacion clave
Las hojas MDM del Excel demo no traen contexto adicional como canal, pais o division dentro de la propia regla. El modelo operativo base si contiene `sociedad` en `facturas_cabecera`, pero las reglas demo no lo usan como parte de la definicion.

## Conclusiones para el MVP
1. Las claves de negocio pueden arrancar simples para el MVP demo.
2. La importacion inicial debe soportar `xlsx`, `xls` o `csv`, ademas de alta manual simple.
3. La experiencia inicial no necesita un ABM completo; basta con tabla filtrable + formulario simple + importacion.
4. El modelo debe conservar un punto de extension por si en una fase posterior las reglas pasan a depender de `sociedad`, `canal`, `pais` u otro contexto.

## Recomendacion de clave por tipo de dato demo
1. Equivalencias de clientes: `rule_set + entity_type + source_value + valid_from`
2. Agrupaciones de clientes: `rule_set + entity_type + member_value + valid_from`
3. Parametros por cliente: `parameter_key + parameter_scope_value + valid_from`

## Implicacion de modelado
Para parametros, el Excel demo muestra que el valor no es puramente global por dominio, sino asociado a un cliente. Por eso conviene introducir un campo de alcance funcional simple en parametros, por ejemplo:
1. `parameter_scope_type` = `CLIENT`
2. `parameter_scope_value` = nombre de cliente

Con eso el MVP sigue siendo simple sin forzar todavia un esquema totalmente compuesto.