# Gap Analysis: Discovery Actual vs Discovery V2

## Objetivo

Identificar el gap entre el Discovery actual de Legacy2Lake y un Discovery orientado a construir conocimiento profundo, estructurado y reutilizable de una solucion analitica.

## Resumen ejecutivo

El Discovery actual parece adecuado para intake y pre-triage, pero no alcanza todavia el nivel de detalle necesario para soportar con fiabilidad:

- explicacion profunda de la solucion
- alimentacion segura a LLMs posteriores
- export a catalogos o herramientas de gobierno
- deteccion de reglas reutilizables
- reconstruccion de orquestacion target
- evoluciones futuras hacia vista de landscape

En su estado actual, Discovery responde bien a la pregunta `que entro al sistema`, pero no suficientemente a `como funciona realmente la solucion`.

## Discovery actual: fortalezas detectadas

1. Ingesta de artefactos heterogeneos.
2. Inventario inicial de archivos.
3. Clasificacion inicial core/support/noise.
4. Preparacion de la solucion para Quick Assessment y Triage.
5. Buen encaje con un workflow de modernizacion por proyecto.

## Discovery actual: limitaciones estructurales

### 1. Demasiado centrado en archivo y demasiado poco en unidad operativa

El sistema identifica artefactos, pero todavia no queda claro que construya una representacion fuerte de:

- procesos
- jobs
- pipelines
- notebooks ejecutables
- unidades de carga
- unidades de publicacion
- pasos de orquestacion

Riesgo:
Se conoce el inventario, pero no el sistema operativo real.

### 2. Cobertura insuficiente de comportamiento operacional

No parece capturarse con suficiente profundidad:

- triggers
- schedules
- dependencias de ejecucion
- retries
- manejo de errores
- branching
- ventanas temporales
- paso de parametros
- secuencias entre motores o servicios

Riesgo:
Lo que luego se genera o documenta puede ser tecnicamente correcto a nivel de transformacion, pero incompleto a nivel de operacion.

### 3. Escasa representacion de entradas, salidas y contratos

Falta explicitar mejor:

- inputs consumidos por cada proceso
- outputs producidos por cada proceso
- contratos implicitos entre procesos
- activos temporales vs activos publicados
- fronteras entre staging, curacion y consumo

Riesgo:
Sin contratos, la dependencia queda superficial y la trazabilidad funcional es debil.

### 4. Deteccion limitada de conocimiento de negocio incrustado

El Discovery actual no parece orientado todavia a extraer de forma sistematica:

- mappings candidatos
- grupos candidatos
- parametros de negocio
- listas de dominio implicitas
- defaults y excepciones
- canonicalizaciones

Riesgo:
El sistema prepara para generar, pero no prepara para preservar o externalizar conocimiento reusable.

### 5. Evidencia insuficientemente formalizada

Cada hallazgo deberia venir con:

- fuente
- tipo de evidencia
- snippet
- offset o bloque
- confianza
- parser o agente que lo detecto

Riesgo:
Sin evidencia fuerte, la explicacion y la auditoria se vuelven blandas.

### 6. Falta de separacion entre hechos y primeras inferencias

Discovery deberia producir sobre todo hechos detectados y señales estructuradas.

Hoy existe el riesgo de mezclar:

- deteccion dura
- interpretacion temprana
- decisiones de downstream

Riesgo:
Se vuelve mas dificil testear, versionar y mejorar el pipeline.

## Gap funcional

### Lo que Discovery actual hace

- descubre
- clasifica a alto nivel
- prepara el contexto

### Lo que Discovery V2 deberia hacer ademas

- reconstruir activos operativos
- modelar flujos y contratos
- identificar unidades funcionales y tecnicas
- extraer señales semanticas reutilizables
- construir evidencia estructurada
- alimentar varios downstreams sin reanalisis completo

## Gap de datos

El Discovery actual parece orientado a inventario y manifest.

Discovery V2 necesita producir entidades mas ricas, por ejemplo:

- asset
- process
- orchestration_step
- transformation_unit
- data_contract
- operational_constraint
- entity_candidate
- rule_signal
- evidence_item

## Gap de testing

Discovery actual puede validarse con casos simples de inventario.

Discovery V2 necesitara pruebas por capas:

1. deteccion de archivos y tipos
2. extraccion de estructuras
3. reconstruccion de relaciones
4. captura de evidencia
5. serializacion al modelo intermedio

## Resultado esperado de Discovery V2

Discovery debe terminar dejando una base de conocimiento del proyecto que permita:

- explicarlo a un humano con profundidad
- dar contexto fiable a Triage
- servir como input a catalogos y gobierno
- alimentar generacion target
- alimentar deteccion de reglas reutilizables

## Criterios de exito

1. A partir del output de Discovery, un revisor puede entender que procesos existen y como se conectan.
2. El sistema separa claramente artefactos, procesos, dependencias y evidencia.
3. El output es reusable por Triage sin volver a leer el repositorio completo.
4. El output no esta acoplado a un target concreto.
5. El output permite crecer luego a analisis cross-project.
