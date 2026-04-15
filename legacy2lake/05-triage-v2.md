# Triage V2

## Objetivo

Convertir el output factual de Discovery V2 en conocimiento explicativo, priorizado y accionable para varios downstreams, no solo para generacion target.

## Nueva definicion

Triage V2 es la fase que interpreta el conocimiento factual del proyecto para decidir:

- que hace la solucion
- como esta organizada funcional y operacionalmente
- que riesgos y gaps existen
- que downstreams conviene activar
- que partes requieren revision humana

## Principios

1. Understanding-first, generation-second.
2. Cada inferencia debe tener evidencia.
3. Cada recomendacion debe declarar su incertidumbre.
4. No todo proyecto desemboca solo en generacion.
5. MDM y catalogo son downstreams opcionales pero previstos.

## Inputs

- knowledge package factual de Discovery V2
- contexto de proyecto
- reglas opcionales de negocio si existen
- metadata complementaria disponible

## Outputs obligatorios

1. project understanding summary
2. functional map
3. risk and gap map
4. downstream recommendation set
5. rule candidate summary
6. orchestration interpretation summary
7. uncertainty report
8. updated modernization mesh

## Bloques de Triage V2

### 1. Triage tecnico

Responde:

- que tecnologias conviven
- que parte es migrable
- que parte tiene huecos
- que dependencias generan riesgo

### 2. Triage funcional

Responde:

- que capacidades de negocio implementa la solucion
- que entidades parecen centrales
- que datasets son de paso y cuales son de negocio
- que procesos son core

### 3. Triage operacional

Responde:

- como corre el sistema
- donde estan triggers, gating y retries
- donde hay fragilidad operacional
- que partes deben mapearse a orquestacion target

### 4. Triage de conocimiento reusable

Responde:

- donde hay mappings
- donde hay grupos
- donde hay parametros
- donde hay listas de dominio o defaults
- que hallazgos no son aptos para externalizacion

### 5. Triage de downstreams

Responde:

- que debe pasar a generacion
- que debe pasar a catalogo
- que debe pasar a documentacion enriquecida
- que debe pasar a revisiones humanas
- que podria pasar a MDM o Rule Hub

## Contratos de salida

### project_understanding_summary

Debe incluir:

- objetivo probable del proyecto
- flujo funcional principal
- procesos centrales
- entidades centrales
- salidas principales
- dependencias relevantes
- zonas de riesgo

### functional_map

Debe incluir:

- capacidades detectadas
- procesos por capacidad
- datasets por capacidad
- entidades por capacidad

### risk_and_gap_map

Debe incluir:

- gap documental
- gap tecnico
- gap semantico
- gap operacional
- riesgo de generacion
- riesgo de interpretacion

### downstream_recommendation_set

Tipos posibles:

- generation_primary
- generation_with_review
- catalog_export
- governance_export
- rule_review
- architecture_review
- human_blocker

### rule_candidate_summary

Debe resumir señales del knowledge model y clasificarlas por:

- mapping probable
- grouping probable
- parameter probable
- default local
- tecnica no reusable

### uncertainty_report

Debe listar:

- hallazgos con alta certeza
- inferencias con certeza media
- huecos criticos
- preguntas a resolver con humano

## Recomendaciones de agentes

### Agent QA

Debe evaluar no solo viabilidad tecnica, sino tambien completitud minima del conocimiento factual recibido.

### Agent S

Debe enfatizar:

- huecos documentales
- activos huérfanos
- zonas oscuras
- piezas de soporte con impacto oculto

### Agent A

Debe evolucionar desde modernization mesh hacia:

- mapa funcional
- mapa operacional
- razonamiento downstream-aware
- clasificacion de conocimiento reusable

## Reglas operativas

1. Triage no publica automaticamente a MDM.
2. Triage no debe forzar toda salida a Agent C.
3. Triage debe producir conocimiento util aunque no se genere nada aun.
4. Triage debe poder terminar con `human review required` de forma controlada.
5. Triage debe separar hechos, inferencias y recomendaciones.

## Vistas o UX recomendadas

1. Summary funcional del proyecto.
2. Mapa operacional.
3. Reglas y señales reutilizables.
4. Riesgos y huecos.
5. Recomendacion de siguientes pasos.
6. Evidencia navegable.

## Criterios de aceptacion

1. Un revisor puede explicar el proyecto sin reabrir todo el codigo.
2. El sistema recomienda downstreams con justificacion.
3. El sistema separa reusable knowledge de logica local.
4. El mesh sigue existiendo, pero enriquecido por conocimiento funcional y operacional.
5. El output sirve tanto para generacion como para gobierno y documentacion.
