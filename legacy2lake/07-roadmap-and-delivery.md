# Roadmap And Delivery Plan

## Objetivo

Proponer una secuencia realista de evolucion para Legacy2Lake, endureciendo Discovery y Triage sin convertir el esfuerzo en una reescritura caotica.

## Principio de ejecucion

No intentar resolver de una vez:

- cross-project intelligence
- MDM downstream
- catalog integrations
- generacion target mas rica

Primero fortalecer el nucleo por proyecto.

## Fase 1: endurecer Discovery

### Objetivo

Pasar de intake a base factual reusable.

### Entregables

1. Tipado enriquecido de assets.
2. Process registry inicial.
3. Evidence registry.
4. Dependency graph inicial.
5. Orchestration graph inicial.
6. Knowledge package factual v1.

### Criterios de cierre

- un proyecto puede reusarse en Triage sin relectura completa
- la evidencia se puede navegar
- los procesos principales son visibles

## Fase 2: endurecer Triage

### Objetivo

Pasar de priorizacion de migracion a comprension estructurada y recomendacion downstream-aware.

### Entregables

1. Functional map.
2. Operational map.
3. Uncertainty report.
4. Rule candidate summary.
5. Downstream recommendation set.
6. Mesh enriquecido.

### Criterios de cierre

- un humano puede entender la solucion desde el output
- el sistema recomienda que downstreams activar
- el sistema marca reusable knowledge con evidencia

## Fase 3: contratos de export

### Objetivo

Desacoplar el core de los destinos concretos.

### Entregables

1. Export contract comun.
2. Export prototype para catalogo.
3. Export prototype para documentacion.
4. Export prototype para rule candidates.
5. Consumo mejorado por Agent C y Agent G.

### Criterios de cierre

- dos downstreams pueden operar sobre el mismo package
- la evidencia sigue trazable extremo a extremo

## Fase 4: mejora de generacion y orquestacion

### Objetivo

Usar el conocimiento mejor estructurado para mejorar salida target y reconstruccion operacional.

### Entregables

1. Mejor input contractual para Agent C.
2. Mejor interpretacion operacional para artefactos target.
3. Mejor scoring en Agent F.
4. Mejor runbook y audit en Agent G.

## Fase 5: landscape futuro

### Objetivo

Preparar la evolucion a analisis cross-project sin abordarlo antes de madurar el nivel proyecto.

### Entregables futuros

1. Entity overlap map.
2. Domain candidate map.
3. Rule overlap map.
4. Shared data product candidates.

## Estrategia de testing

### Capa 1: deterministica

- deteccion de tipos
- parsing
- relaciones
- serializacion
- exports

### Capa 2: contratos

- todo hallazgo relevante tiene evidencia
- toda inferencia tiene confidence
- todo export cumple schema

### Capa 3: fixtures reales curados

Seleccionar pocos casos representativos:

- SQL legacy
- SSIS
- PySpark
- mezcla de configs y scripts
- caso con orquestacion relevante

### Capa 4: e2e minima

Solo para cadenas criticas.

## Riesgos de implementacion

1. Mezclar demasiado pronto Discovery con generacion.
2. Intentar resolver enterprise landscape antes del nivel proyecto.
3. Dejar evidencia como texto libre en lugar de modelo tipado.
4. Acoplar exports a un vendor concreto.
5. Sobrecargar LLM donde deberian vivir parsers deterministas.

## Backlog inicial recomendado

1. Definir schema del knowledge model.
2. Definir schema de evidence item.
3. Redefinir outputs de Discovery.
4. Redefinir outputs de Triage.
5. Ajustar contratos de Agent QA, Agent S y Agent A.
6. Añadir vistas de UX para evidencia y mapas.
7. Crear fixtures de prueba por tipo de tecnologia.

## Criterio de exito global

Legacy2Lake debe pasar de ser una factoria que entiende lo justo para generar a ser una plataforma que construye conocimiento suficientemente profundo para:

- explicar
- modernizar
- exportar
- gobernar
- y mas adelante consolidar vista de landscape
