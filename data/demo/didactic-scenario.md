# Escenario Didactico De Demo

Este escenario existe para algo mas util que un smoke test: dejar una base lista para demo, capacitacion y primeros recorridos con datos que expliquen para que sirve el producto.

## Comando

Ejecutar:

```bash
npm run demo:reset
```

## Que hace

1. borra los datos operativos de mappings, groups, parameters, import batches y audit log
2. conserva catalogos base como usuarios, roles, entity types y rule sets
3. crea un escenario corto y navegable para dos entidades: `CLIENT` y `PRODUCT`
4. deja ejemplos `approved` para listas y vistas activas
5. deja ejemplos `pending_approval` para la cola de aprobaciones
6. escribe un reporte en `reports/demo-reset-latest.json`

## Historia que cuenta el demo

### CLIENT

La demo muestra que varias formas de nombrar un mismo cliente terminan en un cliente canonico.

Ejemplos:

1. `ACME S.A.` -> `ACME_RETAIL`
2. `ACME SA` -> `ACME_RETAIL`
3. `MEGA STORE` -> `MEGA_STORE`
4. `MEGASTORE ONLINE` -> `MEGA_STORE`

Despues muestra que esos canonicos pueden:

1. caer en grupos de negocio
2. tener parametros comerciales por cliente
3. recibir propuestas nuevas que quedan pendientes de aprobacion

### PRODUCT

La demo muestra el mismo patron para productos:

1. aliases y nombres heredados convergen a un SKU canonico
2. el SKU se puede agrupar en una familia
3. el SKU puede tener parametros operativos como margen minimo
4. cambios futuros pueden quedar pendientes antes de impactar procesos

## Que mirar en la UI

1. `Mappings`: ver las equivalencias aprobadas de CLIENT y PRODUCT
2. `Groups`: ver como los canonicos terminan en segmentos o familias
3. `Parameters`: ver factores comerciales y margenes minimos
4. `Approvals`: ver cuatro registros pendientes listos para explicar workflow
5. `Audit`: ver la historia de create + approve o create + submit

## Que mirar desde consumo tecnico

Consultas utiles para explicar el valor a gente de Fabric, Databricks o Snowflake:

```sql
select entity_type_code, source_key, source_value, target_value
from vw_mdm_mapping_rule_active
order by entity_type_code, source_value;

select entity_type_code, member_value, group_value
from vw_mdm_group_rule_active
order by entity_type_code, member_value;

select parameter_key, parameter_value, parameter_scope_type, parameter_scope_value
from vw_mdm_parameter_active
where domain = 'demo_training'
order by parameter_scope_type, parameter_scope_value;
```

## Resultado esperado

Despues de ejecutar el comando:

1. `mdm_mapping_rule` = 10 registros
2. `mdm_group_rule` = 5 registros
3. `mdm_parameter` = 5 registros
4. cola pending = 4 registros
5. vistas activas = 8 mappings, 4 groups, 4 parameters
6. audit log = 40 eventos

## Cuando conviene usarlo

1. antes de una demo comercial o funcional
2. antes de una capacitacion interna
3. cuando la base local quedo sucia por pruebas tecnicas
4. cuando queres mostrar rapido por que esto sirve en procesos de estandarizacion y consumo analitico