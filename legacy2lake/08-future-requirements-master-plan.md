# Future Requirements Master Plan

## Objetivo

Consolidar los requerimientos futuros de Legacy2Lake en una vista unica y accionable, separando claramente:

- objetivo de producto
- capacidades requeridas
- prioridades
- dependencias
- no objetivos inmediatos
- relacion futura con MDM y catalogos externos

## Vision de producto

Legacy2Lake debe evolucionar desde una factoria de modernizacion por proyecto hacia una plataforma de conocimiento operativo capaz de:

1. entender soluciones analiticas heterogeneas con profundidad
2. representar ese conocimiento de forma estructurada y trazable
3. habilitar multiples downstreams con el mismo paquete de conocimiento
4. seguir soportando modernizacion target sin perder rigor semantico

## Principios rectores

1. Knowledge-first.
2. Deterministic-first, LLM-assisted-second.
3. Evidencia obligatoria para todo hallazgo relevante.
4. Target-agnostic en el nucleo.
5. Downstream-specific en los adaptadores.
6. Nada se publica a gobierno o MDM sin revision humana.
7. Cross-project queda diferido hasta madurar el nivel proyecto.

## Capacidades futuras requeridas

### A. Discovery V2

#### Objetivo
Construir una base factual reutilizable del proyecto.

#### Requerimientos
1. Inventario enriquecido de archivos y artefactos.
2. Tipado de assets.
3. Identificacion de procesos.
4. Reconstruccion de dependencias.
5. Reconstruccion inicial de orquestacion.
6. Registro de evidencia navegable.
7. Serializacion a knowledge package factual.

#### Prioridad
Critica.

#### Dependencias
- parsers y clasificadores
- modelo de evidencia
- storage de knowledge package

### B. Triage V2

#### Objetivo
Interpretar el package factual y producir comprension, riesgo y recomendaciones downstream-aware.

#### Requerimientos
1. Functional map.
2. Operational map.
3. Risk and gap map.
4. Uncertainty report.
5. Downstream recommendation set.
6. Rule candidate summary.
7. Mesh enriquecido.

#### Prioridad
Critica.

#### Dependencias
- Discovery V2 usable
- knowledge model v1
- contratos claros para Agent QA, Agent S y Agent A

### C. Knowledge Model V1

#### Objetivo
Definir el contrato comun entre ingestion y downstreams.

#### Requerimientos
1. Modelar hechos.
2. Modelar inferencias.
3. Modelar evidencia.
4. Modelar procesos, datasets, transformaciones y constraints.
5. Modelar rule signals sin promocion automatica.
6. Permitir serializacion JSON y persistencia normalizada.

#### Prioridad
Critica.

#### Dependencias
- alineacion de Discovery y Triage

### D. Evidence And Confidence Model

#### Objetivo
Evitar outputs opacos o no auditables.

#### Requerimientos
1. Cada hallazgo relevante referencia evidencia.
2. Cada inferencia declara confianza.
3. Cada recomendacion downstream enlaza a hechos o inferencias.
4. La UX permite navegar desde hallazgo a snippet o bloque fuente.

#### Prioridad
Muy alta.

### E. Downstream Export Contracts

#### Objetivo
Permitir que el conocimiento sirva a multiples destinos.

#### Requerimientos
1. Contrato comun interno para export.
2. Export a generacion.
3. Export a documentacion.
4. Export a catalogo.
5. Export a candidatos de reglas.
6. Preparar futuros exports a Purview o Unity sin vendor lock-in.

#### Prioridad
Alta.

### F. Orchestration Intelligence

#### Objetivo
Capturar suficientemente bien secuencia y control operacional.

#### Requerimientos
1. Detectar triggers, schedules y retries.
2. Detectar pasos y dependencias de ejecucion.
3. Distinguir transformacion de coordinacion.
4. Representar orquestacion de forma target-agnostic.

#### Prioridad
Alta.

### G. Rule Candidate Extraction

#### Objetivo
Detectar conocimiento reusable sin obligar a usar MDM.

#### Requerimientos
1. Mapping signals.
2. Grouping signals.
3. Parameter signals.
4. Evidence y rationale.
5. Distincion reusable vs local logic.
6. Export como candidate pack revisable.

#### Prioridad
Alta, pero despues de Discovery/Triage V2.

### H. UX de conocimiento

#### Objetivo
Hacer util el output para humanos, no solo para agentes.

#### Requerimientos
1. Vista de inventario enriquecido.
2. Vista de procesos.
3. Vista de dependencias.
4. Vista de orquestacion.
5. Vista de evidencia.
6. Vista de riesgo e incertidumbre.
7. Vista de recomendaciones downstream.

#### Prioridad
Alta.

### I. Testing Architecture

#### Objetivo
Evitar que el crecimiento del producto rompa estabilidad y confianza.

#### Requerimientos
1. Tests deterministas para parsers y grafos.
2. Tests de contrato para outputs.
3. Fixtures reales curados.
4. E2E minimos por cadena critica.
5. Separacion de pruebas por capa y no por percepcion general del sistema.

#### Prioridad
Critica.

## No objetivos inmediatos

1. Resolver enterprise landscape completo.
2. Sustituir Purview, Unity o catalogos corporativos.
3. Publicar automaticamente reglas en MDM.
4. Hacer modernizacion totalmente autonoma sin revision humana.
5. Cubrir todas las tecnologias del mercado desde la primera iteracion.

## Requisitos de arquitectura

1. El knowledge model no puede depender de un solo target.
2. Los exports deben estar desacoplados del core.
3. Los agentes deben consumir contratos mas ricos y menos contexto ad hoc.
4. Debe existir almacenamiento versionado del knowledge package.
5. Los conectores tecnologicos deben ser extensibles por adaptadores.

## Requisitos de proceso

1. Discovery y Triage deben ser tratadas como capacidades nucleares, no como pre-work.
2. Cada fase debe producir artefactos persistentes y versionables.
3. Todo hallazgo relevante debe poder revisarse.
4. Cada sprint debe cerrar con artefactos demostrables.

## Requisitos de integracion futura con MDM

1. Legacy2Lake debe exportar candidatos, no reglas aprobadas.
2. El contrato minimo futuro debe soportar:
   - candidateType
   - payload
   - evidence
   - confidence
   - sourceKind
3. MDM decide revision, aprobacion y promocion.

## Secuencia recomendada

1. Knowledge model y evidence model.
2. Discovery V2.
3. Triage V2.
4. UX basica de conocimiento.
5. Export contracts.
6. Rule candidates.
7. Mejoras de generacion y orquestacion.
8. Cross-project posterior.

## Criterio de exito global

Legacy2Lake debe quedar en una posicion donde un proyecto pueda:

- ser explicado con profundidad
- ser evaluado con evidencia
- alimentar generacion target
- alimentar documentacion
- alimentar catalogos
- y, si aplica, alimentar gobierno de reglas

sin reanalisis completo en cada downstream.
