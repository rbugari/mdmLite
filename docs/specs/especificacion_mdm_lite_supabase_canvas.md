# Especificación funcional y técnica — MDM Lite / Reference Data Manager

## 1. Propósito

Se propone implementar un **MDM Lite / Reference Data Manager** como un componente ligero para gestionar reglas maestras de negocio que hoy suelen quedar dispersas entre transformaciones técnicas, reportes, ficheros auxiliares o mantenimiento manual.

El objetivo principal es **sacar del código y de la capa de reporting aquellas reglas variables de negocio** que necesitan mantenerse de forma controlada, trazable y reutilizable, sin entrar en la complejidad de un MDM corporativo completo.

Este componente se plantea como un habilitador directo del caso **Ventas–Perseida**, pero se diseña desde el inicio para poder ser reutilizado en otros datamarts, dominios o casos de uso posteriores.

---

## 2. Principios de diseño

El diseño del MDM Lite se apoya en los siguientes principios:

1. **Simplicidad funcional**: resolver bien los casos de negocio reales sin construir una solución sobredimensionada.
2. **Portabilidad tecnológica**: aunque inicialmente pueda desplegarse sobre Supabase, la solución debe apoyarse en **PostgreSQL estándar** y evitar dependencias innecesarias de funcionalidades exclusivas de Supabase.
3. **Sin hardcode**: las reglas de negocio variables no deben quedar incrustadas en pipelines, modelos dbt o dashboards.
4. **Gobierno ligero**: debe existir control de estado, vigencia, trazabilidad y validación mínima, pero con una operativa ágil.
5. **Compatibilidad con ecosistema analítico**: el componente debe poder convivir con dbt, Microsoft Fabric, Databricks, Purview, Unity Catalog o cualquier otra capa de transformación y gobierno.
6. **Reutilización**: una misma regla o tabla de referencia debe poder ser consumida desde distintos procesos sin replicar lógica.

---

## 3. Posicionamiento respecto a otros productos

Este componente **no compite** con dbt, Purview ni Unity Catalog. Cumple una función distinta y complementaria.

### 3.1 Relación con dbt

- **MDM Lite**: mantiene reglas y datos de referencia operativos.
- **dbt**: aplica esas reglas dentro de modelos y transformaciones.

En este esquema, el MDM Lite actúa como **repositorio operativo de reglas**, mientras que dbt actúa como **motor de aplicación y estandarización**.

### 3.2 Relación con Purview o Unity Catalog

- **MDM Lite**: permite administrar equivalencias, agrupaciones, parámetros y excepciones de negocio.
- **Purview / Unity Catalog**: documentan, catalogan, clasifican y trazan los activos de datos.

En consecuencia, el MDM Lite aporta una **capa operativa de gestión de reglas** que las herramientas de catálogo y gobierno no cubren de forma nativa.

### 3.3 Conclusión de posicionamiento

El MDM Lite se sitúa entre negocio y tecnología, cubriendo un hueco habitual:

- negocio necesita editar reglas sin tocar código;
- ingeniería necesita consumir reglas de forma estructurada;
- gobierno necesita trazabilidad y control.

---

## 4. Objetivos funcionales

La primera versión deberá permitir como mínimo:

- mantener equivalencias entre valores origen y destino;
- mantener agrupaciones para reporting o consolidación;
- administrar parámetros simples de negocio;
- controlar vigencias de reglas;
- incorporar un flujo ligero de aprobación;
- registrar trazabilidad de cambios;
- exponer la información para consumo técnico desde pipelines, SQL o dbt.

---

## 5. Alcance funcional propuesto

### 5.1 Administración de equivalencias

La solución permitirá mantener reglas del tipo:

- cliente origen → cliente homologado;
- producto origen → producto o familia destino;
- sociedad origen → entidad de reporting;
- comercial origen → comercial homogeneizado;
- valor operacional origen → valor canónico destino.

### 5.2 Administración de agrupaciones

La solución permitirá mantener agrupaciones para reporting o consolidación, por ejemplo:

- cliente → cliente agrupado;
- cliente → cadena comercial;
- producto → familia / subfamilia;
- solicitante → grupo de negocio;
- sociedad → división.

### 5.3 Administración de parámetros

La solución permitirá mantener configuraciones simples tales como:

- porcentajes;
- factores correctores;
- flags de activación;
- umbrales;
- códigos por defecto;
- periodos de validez.

### 5.4 Workflow simple de aprobación

Los registros deberán poder pasar por estados mínimos:

- borrador;
- pendiente de aprobación;
- aprobado;
- rechazado;
- inactivo.

### 5.5 Historial y auditoría

Todo cambio deberá registrar:

- usuario creador;
- usuario modificador;
- fecha/hora de creación;
- fecha/hora de modificación;
- valor anterior y nuevo valor;
- estado de aprobación;
- comentario o motivo del cambio.

### 5.6 Consumo técnico

El componente deberá exponer sus datos de manera sencilla para procesos técnicos mediante:

- tablas relacionales estándar;
- vistas SQL de consumo activo;
- lectura vía drivers PostgreSQL estándar;
- exposición opcional vía API del backend de la aplicación.

---

## 6. Casos de uso de ejemplo alineados con el cliente

### Caso de uso 1 — Homologación de clientes

Un mismo cliente puede existir con múltiples variantes en el origen.

**Ejemplo realista:**

- `ALDI SAN ISIDRO SUPERMERCADOS, S.L.` → `ALDI SUPERMERCADOS S.L.`
- `ALDI DOS HERMANAS SUPERMERCADOS, S.L.` → `ALDI SUPERMERCADOS S.L.`
- `ALDI MASQUEFA SUPERMERCADOS, S.L.` → `ALDI SUPERMERCADOS S.L.`

### Caso de uso 2 — Agrupación comercial de clientes

**Ejemplo:**

- `EROSKI S.COOP.` → grupo `EROSKY`
- `GRUPO EROSKI DISTRIBUCION, S.A.` → grupo `EROSKY`
- `PERFUMERIA DRUNI S.A.` → grupo `BEAUTY EMOTIONS, S.L.` o `PERFUMERIAS DRUNI`

### Caso de uso 3 — Parámetros o factores comerciales

**Ejemplo:**

- `PRIMOR INVESTMENT MANAGEMENT, S.L.` → factor `0.97`
- `PERSEIDA BELLEZA MAROC, S.A.R.L.` → factor `1.09`
- `MARJANE` → factor `1.09`

### Caso de uso 4 — Homologación de comerciales

**Ejemplo:**

- `ANTONIO J. MARTIN` → `Martin Gonzalez, Antonio Jesus`
- ubicación asociada → `Perseida Belleza`

### Caso de uso 5 — Mapeo de sociedad / división / empresa

**Ejemplo:**

- Mandante `20`
- Sociedad `12`
- Empresa `Perseida Belleza S.L.`
- Nombre corto `PER`
- División `BUTY`

---

## 7. Arquitectura lógica propuesta

La arquitectura lógica recomendada es la siguiente:

1. **Base de datos PostgreSQL estándar** como repositorio de reglas maestras.
2. **Aplicación web ligera** para mantenimiento operativo.
3. **Vistas SQL activas** para exponer reglas vigentes y aprobadas.
4. **Consumo desde pipelines o dbt** mediante lectura directa o réplica controlada.
5. **Catalogación y gobierno** opcional en Purview o Unity Catalog para trazabilidad adicional.

### 7.1 Requisito de portabilidad

La solución debe diseñarse para poder ejecutarse indistintamente sobre:

- Supabase;
- Azure Database for PostgreSQL;
- PostgreSQL autogestionado;
- una base PostgreSQL conectable desde una plataforma cloud;
- cualquier servicio compatible con PostgreSQL estándar.

### 7.2 Restricciones de diseño para garantizar portabilidad

Se deberá evitar, salvo en la capa opcional de despliegue, el uso obligatorio de:

- funciones exclusivas de Supabase;
- mecanismos de autenticación o políticas imposibles de replicar fuera de Supabase;
- tipos de datos no estándar;
- automatismos dependientes de un vendor concreto.

### 7.3 Qué sí se puede usar sin comprometer portabilidad

- PostgreSQL estándar;
- claves primarias / foráneas;
- índices;
- vistas;
- constraints estándar;
- timestamps;
- JSONB de PostgreSQL si aporta valor real y se mantiene razonable;
- API o backend propio para encapsular lógica de la aplicación.

### 7.4 Recomendación práctica

Supabase puede utilizarse como **entorno inicial de despliegue** por velocidad y comodidad, pero el modelo de datos y la aplicación deben construirse con el criterio de que, si mañana se desea mover a otra base PostgreSQL, el cambio sea viable con mínimo impacto.

---

## 8. Modelo de datos propuesto

### 8.1 Tabla `mdm_entity_type`

Define el tipo de entidad administrada.

Campos sugeridos:

- `id` (PK)
- `code`
- `name`
- `description`
- `is_active`
- `created_at`
- `updated_at`

Ejemplos:

- `CLIENT`
- `PRODUCT`
- `MATERIAL`
- `COMPANY`
- `COMMERCIAL`
- `CHANNEL`
- `SOCIETY`

### 8.2 Tabla `mdm_rule_set`

Agrupa reglas por dominio o caso de uso.

Campos sugeridos:

- `id` (PK)
- `code`
- `name`
- `domain`
- `description`
- `status`
- `is_active`
- `created_at`
- `updated_at`

Ejemplos:

- `ventas_perseida_clientes`
- `ventas_perseida_tarifas`
- `ventas_perseida_sociedades`
- `ventas_perseida_comerciales`

### 8.3 Tabla `mdm_mapping_rule`

Tabla principal de equivalencias.

Campos sugeridos:

- `id` (PK)
- `rule_set_id` (FK)
- `entity_type_id` (FK)
- `source_key`
- `source_value`
- `target_value`
- `target_label`
- `priority`
- `valid_from`
- `valid_to`
- `status`
- `is_active`
- `comments`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 8.4 Tabla `mdm_group_rule`

Tabla de agrupaciones.

Campos sugeridos:

- `id` (PK)
- `rule_set_id` (FK)
- `entity_type_id` (FK)
- `member_value`
- `group_value`
- `group_label`
- `valid_from`
- `valid_to`
- `status`
- `is_active`
- `comments`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 8.5 Tabla `mdm_parameter`

Tabla de parámetros simples.

Campos sugeridos:

- `id` (PK)
- `parameter_key`
- `parameter_value`
- `data_type`
- `domain`
- `valid_from`
- `valid_to`
- `status`
- `is_active`
- `description`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 8.6 Tabla `mdm_reference_list`

Tabla para listas maestras o catálogos simples.

Campos sugeridos:

- `id` (PK)
- `list_name`
- `item_code`
- `item_label`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### 8.7 Tabla `mdm_change_log`

Historial de cambios.

Campos sugeridos:

- `id` (PK)
- `table_name`
- `record_id`
- `action_type`
- `old_value_json`
- `new_value_json`
- `changed_by`
- `changed_at`
- `approval_status`
- `approval_by`
- `approval_at`
- `comments`

---

## 9. Vistas de consumo recomendadas

Para facilitar el uso desde dbt, SQL o pipelines, se recomienda exponer vistas estándar.

### Ejemplos de vistas

- `vw_mdm_mapping_rule_active`
- `vw_mdm_group_rule_active`
- `vw_mdm_parameter_active`
- `vw_mdm_client_equivalences_active`
- `vw_mdm_product_groupings_active`

### Regla de filtrado recomendada

Las vistas deberán devolver únicamente registros que cumplan:

- `is_active = true`
- `status = 'approved'`
- fecha actual dentro de `valid_from` / `valid_to`

De esta forma, los consumidores técnicos no necesitan reimplementar la lógica de activación.

---

## 10. Aplicación web propuesta

La aplicación se plantea como una web administrativa ligera, no como un producto complejo.

### 10.1 Pantallas mínimas

#### Dashboard

- número de reglas activas
- pendientes de aprobación
- cambios recientes
- registros vencidos o próximos a vencer

#### Gestión de equivalencias

- listado
- filtros
- alta / edición / duplicado / baja lógica
- envío a aprobación

#### Gestión de agrupaciones

- listado y mantenimiento
- filtros por dominio / entidad / estado

#### Gestión de parámetros

- CRUD simple
- control de tipo de dato y vigencia

#### Aprobaciones

- revisión de cambios pendientes
- aprobar / rechazar
- comentario de revisión

#### Auditoría

- consulta de cambios por fecha, usuario, entidad o estado

### 10.2 Roles de usuario

#### Administrador

- configura catálogos
- administra reglas
- aprueba cambios
- consulta auditoría completa

#### Data Steward

- crea y modifica reglas
- envía a aprobación
- consulta historial

#### Usuario de negocio

- consulta reglas
- puede proponer cambios si se habilita

#### Usuario técnico / solo lectura

- consulta o exporta reglas activas

---

## 11. Compatibilidad con dbt

La solución debe diseñarse para ser consumida fácilmente desde dbt.

### 11.1 Patrón recomendado

- el MDM Lite mantiene reglas operativas;
- dbt consume vistas activas o una réplica de esas tablas;
- dbt aplica esas reglas en modelos Silver / Gold;
- dbt testea coherencia de claves, duplicados y vigencias.

### 11.2 Modalidades de consumo posibles

#### Opción A — lectura directa desde PostgreSQL

dbt se conecta a la base PostgreSQL donde vive el MDM Lite.

Ventaja:
- simplicidad en MVP.

#### Opción B — ingestión o réplica hacia la plataforma analítica

Las tablas MDM se copian periódicamente a la plataforma de datos y dbt trabaja sobre esa copia.

Ventajas:
- desacoplamiento;
- mayor robustez;
- mejor integración con el ecosistema analítico.

### 11.3 Recomendación

Para una primera versión, la lectura directa puede ser válida. Para un escenario más industrializado, se recomienda una réplica o ingestión controlada hacia la plataforma principal.

---

## 12. Compatibilidad con Purview o Unity Catalog

El MDM Lite debe coexistir con herramientas de gobierno como Purview o Unity Catalog.

### 12.1 Qué aporta el MDM Lite

- edición de reglas;
- operativa de negocio;
- equivalencias y agrupaciones activas;
- vigencias y aprobaciones.

### 12.2 Qué aportan Purview / Unity Catalog

- catálogo de activos;
- clasificación;
- ownership;
- linaje;
- trazabilidad y gobierno técnico.

### 12.3 Conclusión

No existe solapamiento real de propósito. El MDM Lite administra el contenido operativo; Purview o Unity Catalog documentan y gobiernan los activos resultantes.

---

## 13. Flujo operativo propuesto

1. Un steward o usuario de negocio detecta necesidad de nueva regla.
2. La regla se registra en la aplicación en estado borrador.
3. Se revisa y se envía a aprobación.
4. Un usuario autorizado la aprueba o rechaza.
5. La regla aprobada pasa a estado activo.
6. Los pipelines o modelos consumen únicamente reglas activas y vigentes.
7. Todo cambio queda registrado en el historial.

---

## 14. Alcance MVP recomendado

### Incluye

- modelo de datos PostgreSQL estándar;
- aplicación web ligera con login;
- CRUD de equivalencias;
- CRUD de agrupaciones;
- CRUD de parámetros;
- vigencias y activación/desactivación;
- flujo simple de aprobación;
- auditoría básica;
- vistas SQL activas para consumo técnico.

### No incluye en primera versión

- golden record avanzado;
- matching inteligente o fuzzy;
- sincronización de escritura hacia SAP;
- workflow de aprobación complejo multinivel;
- motor de reglas complejo;
- jerarquías maestras multinivel;
- interfaz analítica avanzada.

---

## 15. Relación con la propuesta principal del proyecto

### Fase 1 — Assessment y diseño objetivo

- definición del modelo MDM Lite;
- identificación de reglas y tablas prioritarias;
- diseño funcional y técnico;
- definición de roles y proceso operativo.

### Fase 2 — Habilitación de plataforma

- creación de tablas en PostgreSQL;
- implementación de la app mínima;
- carga inicial de datos de referencia;
- validación de estructura y acceso.

### Fase 3 — Implementación del caso PoC

- integración del MDM Lite en pipelines Silver;
- consumo de reglas en el caso Ventas–Perseida;
- pruebas, reconciliación y validación de resultados.

---

## 16. Valor para el cliente

Este componente aporta un valor muy concreto y práctico:

- reduce dependencia de lógica embebida en procesos técnicos;
- mejora mantenibilidad;
- permite que negocio participe sin tocar código;
- aporta trazabilidad y auditoría;
- facilita reutilización de reglas entre procesos;
- evita repetir equivalencias y excepciones en múltiples sitios;
- deja una base pragmática y escalable para futuros datamarts.

---

## 17. Resumen ejecutivo corto para usar en propuesta

Se propone implementar un componente **MDM Lite / Reference Data Manager** soportado sobre una base **PostgreSQL estándar** y administrado mediante una aplicación web ligera. Este componente permitirá gestionar de forma gobernada equivalencias, agrupaciones, parámetros y reglas simples de negocio, con control de vigencia, aprobación básica e historial de cambios, evitando el hardcode en pipelines y facilitando la reutilización y trazabilidad de la lógica de negocio. La solución podrá desplegarse inicialmente sobre Supabase, pero se diseñará con criterios de portabilidad para poder operar sobre cualquier entorno PostgreSQL compatible.

