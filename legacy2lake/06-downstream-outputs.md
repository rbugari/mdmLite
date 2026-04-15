# Downstream Outputs Model

## Objetivo

Definir como el conocimiento generado por Discovery V2 y Triage V2 alimenta distintos destinos sin acoplar el nucleo del sistema a una sola herramienta o a una sola salida.

## Principio rector

Legacy2Lake no reemplaza herramientas externas. Produce activos estructurados y trazables para que cada organizacion los cargue o sincronice donde corresponda.

## Downstreams previstos

1. Generacion target.
2. Catalogos y herramientas de gobierno.
3. Rule Governance o MDM opcional.
4. Documentacion tecnica y funcional.
5. Arquitectura y orquestacion target.

## 1. Generacion target

### Objetivo

Usar el knowledge model para producir:

- SQL target
- PySpark
- dbt
- notebooks
- workflows
- artefactos de despliegue

### Entradas minimas

- process
- orchestration_step
- transformation_unit
- operational_constraint
- dataset
- uncertainty markers

### Reglas

1. Si la incertidumbre es alta, la generacion debe bajar el nivel de automatizacion o requerir revision.
2. No se debe generar suponiendo hechos no evidenciados.
3. Debe existir trazabilidad entre output generado y conocimiento fuente.

## 2. Catalogos y gobierno externo

### Ejemplos de destino

- Unity Catalog
- Microsoft Purview
- catalogos internos

### Objetivo

Producir metadata preparada para ingesta o sincronizacion.

### Tipos de artefacto exportable

- dataset metadata
- lineage edges
- entity descriptions
- ownership hints
- domain hints
- glossary candidates
- process summaries

### Reglas

1. Legacy2Lake no sustituye el catalogo.
2. El export debe ser consumible aunque la organizacion use otra herramienta.
3. Debe priorizarse un contrato intermedio interno antes que integraciones ad hoc.

## 3. Rule Governance / MDM opcional

### Objetivo

Enviar solo el subconjunto de conocimiento que merece externalizacion gobernada.

### Tipos de salida

- mapping candidates
- grouping candidates
- parameter candidates
- evidence bundles
- rationale y confidence

### Reglas

1. No toda regla detectada debe promocionarse.
2. Toda promocion debe pasar por revision humana.
3. El output debe distinguir reusable vs local logic.

## 4. Documentacion y explicacion

### Objetivo

Generar explicacion de la solucion para humanos, auditoria y handover.

### Tipos de salida

- project summary
- functional narrative
- operational narrative
- dependency summary
- risk summary
- review questions

### Reglas

1. La documentacion debe derivarse del knowledge model y no solo de texto libre generado.
2. Toda explicacion relevante debe poder trazarse a evidencia.

## 5. Arquitectura y orquestacion target

### Objetivo

Traducir la intencion operacional a definiciones target de pipeline, jobs o coordinacion.

### Tipos de salida

- workflow recommendations
- orchestration specs
- target scheduling hints
- dependency mapping

### Reglas

1. La orquestacion target no se debe inferir solo desde scripts de transformacion.
2. Debe consumir process, orchestration_step y operational_constraint.
3. Puede requerir confirmacion humana cuando el origen sea ambiguo.

## Contrato intermedio recomendado

Antes de cualquier export especifico, debe existir un contrato comun de salida basado en el knowledge model.

Campos base sugeridos para export:

- object_type
- object_id
- logical_name
- source_refs
- confidence
- evidence_refs
- downstream_tags
- review_required

## Etiquetas de downstream recomendadas

- target_generation
- orchestration_generation
- catalog_export
- governance_export
- rule_governance_candidate
- documentation_export
- architecture_review

## Beneficios de este enfoque

1. Desacopla Discovery/Triage de una herramienta concreta.
2. Permite introducir nuevos exports sin reescribir el core.
3. Reduce el riesgo de alucinacion porque el LLM consume estructura, no caos bruto.
4. Hace posible que una misma corrida active varios downstreams.

## Criterios de aceptacion

1. El output del sistema puede alimentar al menos dos downstreams distintos sin reanalizar el repo.
2. Los exports tienen trazabilidad de evidencia.
3. Los exports no dependen de un vendor unico.
4. Los candidatos a MDM se entregan como sugerencia revisable, no como verdad publicada.
