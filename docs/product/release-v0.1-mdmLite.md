# Release v0.1 - MDM Lite

## Objetivo del release
Cerrar una version v0.1 demostrable del MVP para cargar y administrar equivalencias, agrupaciones y parametros, y explicar como se consumirian desde procesos tecnicos en SQL, Python o dbt.

## Alcance incluido
1. Carga manual simple de equivalencias, agrupaciones y parametros.
2. Importacion por archivo para poblar datos desde csv o xlsx.
3. Edicion manual simple de registros existentes desde la UI.
4. Lectura operativa desde la aplicacion y lectura tecnica desde vistas SQL activas.
5. Help funcional y tecnica dentro de la app.
6. Dataset demo y flujo reproducible de arranque.

## Contrato tecnico recomendado
Los consumidores tecnicos deben leer desde estas vistas:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

No se recomienda acoplar ETL, scripts o modelos analiticos a tablas internas del esquema.

## Casos de uso cubiertos
1. Homologar nombres o codigos externos a un valor canonico.
2. Consolidar clientes o entidades en grupos funcionales.
3. Aplicar factores o parametros por dominio y alcance.
4. Reprocesar cargas sin tocar codigo cuando aparece una nueva regla.

## Flujo funcional esperado
1. Negocio o el admin detecta una nueva necesidad de normalizacion.
2. La regla se carga manualmente o por archivo.
3. El ETL consulta las vistas activas.
4. El proceso transforma los datos crudos.
5. El resultado se carga a reporting, mart o consumo downstream.

## Ejemplo de consumo SQL
```sql
select
  f.invoice_id,
  f.customer_name as customer_source,
  coalesce(m.target_value, f.customer_name) as customer_canonical,
  g.group_value as customer_group,
  cast(p.parameter_value as numeric) as pvp_factor
from staging_sales f
left join vw_mdm_mapping_rule_active m
  on m.entity_type_code = 'CLIENT'
 and m.source_key = 'customer_name'
 and m.source_value = f.customer_name
left join vw_mdm_group_rule_active g
  on g.entity_type_code = 'CLIENT'
 and g.member_value = coalesce(m.target_value, f.customer_name)
left join vw_mdm_parameter_active p
  on p.parameter_key = 'PVP_FACTOR'
 and p.domain = 'ventas_perseida'
 and p.parameter_scope_type = 'CLIENT'
 and p.parameter_scope_value = coalesce(m.target_value, f.customer_name);
```

## Ejemplo de consumo Python
```python
import pandas as pd
import sqlalchemy as sa

engine = sa.create_engine(DATABASE_URL)

sales = pd.read_sql("select * from staging_sales", engine)
mappings = pd.read_sql("select * from vw_mdm_mapping_rule_active", engine)
groups = pd.read_sql("select * from vw_mdm_group_rule_active", engine)
parameters = pd.read_sql(
    "select * from vw_mdm_parameter_active where parameter_key = 'PVP_FACTOR'",
    engine,
)

sales = sales.merge(
    mappings[["source_value", "target_value"]],
    how="left",
    left_on="customer_name",
    right_on="source_value",
)

sales["customer_canonical"] = sales["target_value"].fillna(sales["customer_name"])
```

## Ejemplo de consumo dbt
```sql
with sales as (
    select * from {{ ref('stg_sales') }}
),

mappings as (
    select * from {{ source('mdm', 'vw_mdm_mapping_rule_active') }}
),

groups as (
    select * from {{ source('mdm', 'vw_mdm_group_rule_active') }}
)

select
    s.*,
    coalesce(m.target_value, s.customer_name) as customer_canonical,
    g.group_value as customer_group
from sales s
left join mappings m
  on m.entity_type_code = 'CLIENT'
 and m.source_key = 'customer_name'
 and m.source_value = s.customer_name
left join groups g
  on g.entity_type_code = 'CLIENT'
 and g.member_value = coalesce(m.target_value, s.customer_name)
```

## Criterio de aceptacion del release
La v0.1 se considera cerrada si se puede demostrar lo siguiente:

1. Alta manual simple en las tres entidades principales.
2. Edicion manual simple en las tres entidades principales.
3. Importacion demo funcional.
4. Lectura por vistas activas funcional.
5. Help funcional y tecnica disponible en la app.
6. Ejemplos claros de uso desde SQL, Python y dbt.

## Fuera de alcance para v0.1
1. Workflow formal de aprobacion.
2. Roles complejos y multiusuario real.
3. Multiempresa.
4. API publica con autenticacion.
5. MCP y acciones asistidas.
6. Auditoria avanzada visible en UI.
7. Baja logica compleja o versionado completo.

## Playbook de demo
1. Ejecutar `npm run db:apply`.
2. Ejecutar `npm run db:import-demo`.
3. Levantar la app con `npm run dev`.
4. Mostrar Help para explicar el modelo.
5. Mostrar altas y ediciones manuales.
6. Cerrar con ejemplos de consumo SQL, Python o dbt.