# Discovery V2

## Objetivo

Redefinir Discovery como el proceso que construye la base factual y estructural del proyecto, no solo el intake necesario para correr Triage.

## Nueva definicion

Discovery V2 es la fase responsable de transformar una solucion fuente heterogenea en un conjunto estructurado de hechos, activos, procesos, relaciones y evidencias sobre el proyecto.

## Principios

1. Knowledge-first, no inventory-first.
2. Target-agnostic.
3. Evidence-backed.
4. Deterministic-first, LLM-assisted-second.
5. Reusable por multiples downstreams.

## Inputs

- repositorios o carpetas fuente
- SQL, DDL, scripts, notebooks, configs, XML, manifests, paquetes, docs
- parametros de proyecto
- contexto minimo provisto por usuario si existe

## Outputs obligatorios

1. file inventory enriquecido
2. asset registry
3. process registry
4. dependency graph inicial
5. orchestration graph inicial
6. evidence registry
7. knowledge package factual v1

## Subfases propuestas

### Discovery 1: intake fisico

Responsable de:

- recibir artefactos
- detectar tipos de archivo
- calcular fingerprints
- identificar tecnologias principales
- normalizar rutas y metadatos

### Discovery 2: parsing estructural

Responsable de:

- extraer objetos de SQL
- extraer estructuras de notebooks y scripts
- extraer nodos de orquestacion
- extraer referencias a datasets, jobs, tablas y parametros

### Discovery 3: reconstruccion operacional inicial

Responsable de:

- detectar secuencias
- dependencias de ejecucion
- triggers y schedules
- entrada y salida de procesos
- dependencias entre servicios o motores

### Discovery 4: deteccion de señales semanticas

Responsable de:

- detectar entidades candidatas
- detectar bloques de transformacion
- detectar senales de reglas
- detectar restricciones operativas
- detectar activos criticos o centrales

### Discovery 5: empaquetado factual

Responsable de:

- persistir hechos detectados
- persistir evidencia
- serializar knowledge package factual
- dejar el output listo para Triage V2

## Artefactos de salida

### 1. file_inventory_enriched

Campos minimos:

- path
- file_type
- technology
- size
- hash
- classification_hint
- parse_status

### 2. asset_registry

Lista de assets con tipado, tecnologia, nombre logico y referencias de evidencia.

### 3. process_registry

Lista de procesos identificados, con sus assets fuente, entradas, salidas y posibles constraints.

### 4. dependency_graph

Grafo de dependencias inicial entre assets, datasets y procesos.

### 5. orchestration_graph

Grafo inicial de ejecucion o coordinacion, incluso si algunas relaciones quedan como probables.

### 6. evidence_registry

Repositorio de snippets, bloques o referencias que sostienen cada hecho.

### 7. discovery_summary

Resumen de:

- tecnologias detectadas
- activos criticos
- zonas de incertidumbre
- huecos documentales
- zonas que requieren Triage semantico fuerte

## Roles de agentes y motores

### Deterministic engines

Deben llevar el peso de:

- deteccion de formatos
- parsing basico
- extraccion de referencias
- construccion de grafos iniciales
- captura de evidencia

### LLM support

Debe usarse solo para:

- clasificar bloques ambiguos
- inferir nombres logicos
- sugerir rol de un activo cuando los hechos no alcanzan
- resumir areas de incertidumbre

## Reglas operativas

1. Discovery no decide aun la estrategia de modernizacion final.
2. Discovery no publica reglas a MDM.
3. Discovery no genera codigo target.
4. Discovery puede marcar huecos e incertidumbres sin intentar resolverlos todos.
5. Discovery debe dejar salidas suficientemente estables para que Triage no reescanee todo.

## Cambios de producto requeridos

1. Ampliar contratos de salida de Discovery.
2. Incorporar storage para evidence y knowledge package.
3. Añadir tipado de process y orchestration_step.
4. Exponer la fase con vistas nuevas, no solo inventario.

## Vistas o UX recomendadas

1. Inventory enriquecido.
2. Mapa de procesos.
3. Mapa de dependencias.
4. Mapa inicial de orquestacion.
5. Hallazgos con evidencia.
6. Zonas inciertas o incompletas.

## Criterios de aceptacion

1. Discovery deja un package factual reutilizable.
2. Los principales procesos del proyecto quedan identificados.
3. La evidencia es navegable desde cada hallazgo.
4. Los downstreams pueden consumir el output sin releer todo el proyecto.
5. Las incertidumbres quedan marcadas explicitamente.
