# Workstreams And Build Sequence

## Objetivo

Definir como construir la evolucion futura de Legacy2Lake sin mezclar capas, sin perder foco y sin depender de un unico frente de trabajo.

## Regla base

La evolucion debe estructurarse por workstreams coordinados, no por una lista plana de tareas. Cada workstream tiene un objetivo claro, entregables y dependencias.

## Workstream 1 - Core Knowledge Model

### Mision
Definir y estabilizar el contrato central del conocimiento.

### Alcance
- asset
- process
- orchestration_step
- dataset
- transformation_unit
- entity_candidate
- rule_signal
- operational_constraint
- evidence_item

### Entregables
1. schemas
2. serializacion JSON
3. persistencia minima
4. versionado del package

### Riesgos
- modelar demasiado pronto enterprise landscape
- incluir demasiadas decisiones downstream en el core

### Exito
- todos los demas workstreams pueden apoyarse en este contrato

## Workstream 2 - Discovery Engines

### Mision
Convertir fuentes heterogeneas en hechos estructurados.

### Alcance
- detection de tipos
- parsing
- extraction de referencias
- evidence capture
- asset typing
- process hints

### Entregables
1. inventory enriquecido
2. asset registry
3. evidence registry
4. package factual

### Riesgos
- usar LLM donde hacen falta parsers
- dejar evidencia como texto no estructurado

### Exito
- Discovery produce hechos confiables y reutilizables

## Workstream 3 - Dependency And Orchestration Reconstruction

### Mision
Reconstruir el comportamiento operativo del proyecto.

### Alcance
- depends_on
- execution order hints
- triggers
- schedules
- retries
- branching
- data flow edges

### Entregables
1. dependency graph
2. orchestration graph
3. operational constraints

### Riesgos
- quedarse solo en relaciones de archivo
- no distinguir coordinacion de transformacion

### Exito
- la solucion puede explicarse como sistema y no solo como conjunto de piezas

## Workstream 4 - Triage Intelligence

### Mision
Transformar hechos en comprension, riesgo e intencion downstream.

### Alcance
- functional understanding
- risk and gap mapping
- uncertainty handling
- downstream recommendation
- reusable knowledge classification

### Entregables
1. functional map
2. risk map
3. uncertainty report
4. recommendation set
5. enriched mesh

### Riesgos
- seguir pensando Triage solo como pre-generacion
- mezclar hechos con recomendaciones sin trazabilidad

### Exito
- el producto puede ayudar a decidir, no solo a generar

## Workstream 5 - Downstream Contracts

### Mision
Desacoplar el nucleo de cada destino concreto.

### Alcance
- generation contract
- documentation export
- catalog export
- candidate export

### Entregables
1. contract comun
2. export interfaces
3. adapter skeletons

### Riesgos
- acoplarse a vendors concretos demasiado pronto
- crear exports ad hoc sin contrato comun

### Exito
- el mismo package puede alimentar varios outputs

## Workstream 6 - Human Review UX

### Mision
Hacer visible el conocimiento construido y facilitar supervision.

### Alcance
- inventory enriched view
- process map
- dependency map
- orchestration map
- evidence inspection
- recommendations view

### Entregables
1. vistas navegables
2. filtros
3. drill-down a evidencia
4. estado de incertidumbre visible

### Riesgos
- hacer UX bonita antes de tener contratos estables
- esconder incertidumbre por simplificar pantalla

### Exito
- un revisor humano puede validar el sistema sin abrir el repo completo

## Workstream 7 - Quality And Test Architecture

### Mision
Sostener el crecimiento del producto sin colapsar por complejidad.

### Alcance
- tests deterministas
- tests de contrato
- fixtures
- e2e minimos
- scorecards de calidad

### Entregables
1. matriz de pruebas por capa
2. fixtures por tecnologia
3. contrato de evidence y confidence testable
4. pipeline de validacion

### Riesgos
- depender de juicio subjetivo del LLM como unica validacion
- inflar los E2E y perder velocidad

### Exito
- el sistema crece sin perder repetibilidad

## Secuencia recomendada de construccion

1. Workstream 1
2. Workstream 2
3. Workstream 3
4. Workstream 4
5. Workstream 5
6. Workstream 7 en paralelo desde temprano
7. Workstream 6 despues de tener contratos estables

## Matriz de dependencias

- W1 desbloquea W2, W3, W4 y W5.
- W2 alimenta W3 y W4.
- W3 mejora sustancialmente W4 y W5.
- W4 define buena parte de los contracts de W5.
- W7 acompana desde Sprint 0.
- W6 debe consumir outputs ya relativamente estables.

## Regla para construir cada pieza

Cada workstream debe construirse en este orden:

1. contrato
2. persistencia
3. motor o logica
4. tests deterministas
5. fixtures reales
6. exposicion en UX o export

## Integracion futura con MDM

No forma parte del build sequence inicial. Cuando llegue el momento:

1. W4 produce rule candidate summary.
2. W5 exporta candidate pack.
3. MDM consume y revisa.

## Criterio de exito global

La evolucion sera correcta si Legacy2Lake logra sostener estas cuatro funciones a la vez:

1. entender con profundidad
2. explicar con evidencia
3. recomendar con criterio
4. generar o exportar sin reanalisis completo
