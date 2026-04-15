# Knowledge Model V1

## Objetivo

Definir un modelo minimo de conocimiento estructurado para Legacy2Lake que sirva como capa intermedia estable entre el repositorio fuente y los distintos downstreams del producto.

## Principio rector

No se debe generar directamente desde el codigo fuente. Se debe generar desde un modelo de conocimiento suficientemente detallado, trazable y agnostico del target.

## Metas del modelo

El modelo debe servir a la vez para:

1. explicacion humana profunda
2. triage y priorizacion
3. generacion target
4. export a catalogos y herramientas de gobierno
5. deteccion de reglas reutilizables
6. futura evolucion a vista cross-project

## Capas logicas del modelo

### 1. Hechos

Informacion detectada con alta confianza por parsers, conectores o reglas deterministas.

Ejemplos:

- existe un archivo
- existe un job
- un script llama a otro
- una tarea depende de otra
- una query hace join entre dos tablas
- un pipeline tiene un schedule

### 2. Inferencias

Interpretaciones construidas a partir de hechos, heuristicas y LLM.

Ejemplos:

- esto parece una carga silver
- esta tabla parece una entidad cliente
- esta secuencia parece una publicacion gold
- esto parece un mapping reusable

### 3. Recomendaciones o decisiones downstream

Conclusiones sobre que hacer con el conocimiento.

Ejemplos:

- exportar a catalogo
- promover como candidato a regla gobernable
- generar workflow target
- pedir confirmacion humana

## Entidades principales

### asset

Representa un artefacto o unidad identificable en el proyecto.

Campos sugeridos:

- asset_id
- asset_type
- source_path
- source_system_type
- technology
- format
- name
- logical_name
- role_hint
- confidence
- evidence_refs

Tipos posibles:

- sql_script
- notebook
- pipeline_definition
- orchestration_file
- config_file
- package
- job_definition
- dataset_definition
- manifest
- support_doc

### process

Representa una unidad operativa con comportamiento propio.

Campos sugeridos:

- process_id
- process_type
- name
- description
- source_assets
- trigger_type
- schedule_hint
- runtime_parameters
- error_handling_hint
- operational_importance
- evidence_refs

Tipos posibles:

- ingestion_process
- transform_process
- publish_process
- orchestration_process
- control_process
- validation_process

### orchestration_step

Representa un paso ejecutable o coordinado dentro de un flujo.

Campos sugeridos:

- step_id
- process_id
- step_type
- order_hint
- input_refs
- output_refs
- depends_on_steps
- branching_hint
- retry_policy_hint
- timeout_hint
- evidence_refs

### dataset

Representa un conjunto de datos, tabla, vista o salida materializable.

Campos sugeridos:

- dataset_id
- physical_name
- logical_name
- dataset_type
- layer_hint
- storage_hint
- schema_hint
- owner_hint
- evidence_refs

### transformation_unit

Representa una unidad de logica transformacional identificable.

Campos sugeridos:

- transformation_id
- process_id
- transformation_type
- source_datasets
- target_datasets
- key_columns
- filter_logic
- aggregation_logic
- join_logic
- mapping_logic_hint
- evidence_refs

### entity_candidate

Representa una entidad de negocio inferida.

Campos sugeridos:

- entity_id
- canonical_name
- source_labels
- confidence
- related_datasets
- related_processes
- business_domain_hint
- evidence_refs

### rule_signal

Representa una senal de regla reusable detectada, sin implicar todavia promocion a MDM.

Campos sugeridos:

- signal_id
- signal_type
- probable_scope
- probable_reusability
- source_field
- target_field
- literals_detected
- rationale
- confidence
- evidence_refs

Tipos posibles:

- mapping_signal
- grouping_signal
- parameter_signal
- default_signal
- exception_signal

### operational_constraint

Representa condiciones operativas relevantes.

Campos sugeridos:

- constraint_id
- process_id
- constraint_type
- value_hint
- severity
- confidence
- evidence_refs

Tipos posibles:

- schedule
- trigger
- retry
- timeout
- watermark
- incremental_boundary
- dependency_gate

### evidence_item

Representa la traza de origen de cualquier hecho o inferencia.

Campos sugeridos:

- evidence_id
- source_path
- source_block_type
- snippet
- line_start
- line_end
- parser_name
- extraction_method
- timestamp
- confidence

## Relaciones principales

1. asset produce process
2. process contiene orchestration_step
3. process lee dataset
4. process escribe dataset
5. transformation_unit usa dataset
6. entity_candidate se evidencia en dataset o process
7. rule_signal se evidencia en transformation_unit o asset
8. operational_constraint aplica a process o step
9. evidence_item sustenta cualquier entidad anterior

## Reglas de calidad del modelo

1. Toda inferencia debe enlazar a evidencia.
2. Toda recomendacion downstream debe enlazar a hechos o inferencias.
3. Los tipos deben ser controlados por catalogos finitos donde sea posible.
4. El modelo no debe depender de un target cloud concreto.
5. El modelo debe serializarse en JSON y almacenarse tambien en tablas normalizadas cuando convenga.

## Serializacion recomendada

Se recomiendan dos representaciones simultaneas:

1. JSON completo por proyecto o corrida.
2. Persistencia normalizada de entidades nucleares y evidencias.

## Usos downstream del modelo

### generacion

Consume:

- process
- orchestration_step
- transformation_unit
- operational_constraint
- dataset

### catalogo

Consume:

- dataset
- entity_candidate
- lineage derivado de process y transformation_unit
- owner_hint
- domain_hint

### MDM opcional

Consume:

- rule_signal seleccionados y revisados

### documentacion

Consume:

- process summaries
- entity_candidate
- risk signals
- evidence

## No objetivos del modelo v1

1. No sustituir un catalogo corporativo.
2. No sustituir un motor BPM u orquestador real.
3. No decidir automaticamente arquitectura enterprise completa.
4. No publicar reglas a MDM sin revision.

## Criterios de exito

1. Un proyecto puede explicarse usando solo el knowledge model y la evidencia asociada.
2. Un generador target puede consumirlo sin reparsear todo el repo.
3. Un exportador a catalogo puede poblar metadata util.
4. Un detector de reglas puede trabajar sobre señales ya estructuradas.
