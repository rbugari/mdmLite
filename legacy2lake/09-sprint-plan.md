# Sprint Plan

## Objetivo

Traducir la evolucion futura de Legacy2Lake a una secuencia de sprints manejable, con entregables concretos y criterios claros de cierre.

## Supuesto operativo

- Sprint de 2 semanas.
- Un equipo pequeno con foco principal en backend, datos y orchestration del producto.
- Las mejoras de UX se construyen solo cuando el contrato de datos ya existe.

## Estructura general

### Tramo 1
Fundacion del conocimiento.

### Tramo 2
Operacionalizacion de Discovery y Triage.

### Tramo 3
Downstreams y endurecimiento.

### Tramo 4
Preparacion para capacidades futuras.

## Sprint 0 - Baseline y contratos

### Objetivo
Fijar el marco tecnico y evitar reescritura caotica.

### Entregables
1. Decision de arquitectura: knowledge-first.
2. Schema inicial del knowledge model.
3. Schema inicial de evidence item.
4. Lista priorizada de tecnologias fuente soportadas en la siguiente fase.
5. Matriz de testing por capas.

### Criterios de cierre
- existe contrato v1 del knowledge package
- existe tipado inicial de entidades nucleares
- existe decision clara de lo que no entra aun

## Sprint 1 - Discovery V2 foundation

### Objetivo
Llevar Discovery desde inventario a base factual tipada.

### Entregables
1. File inventory enriquecido.
2. Asset registry inicial.
3. Evidence registry inicial.
4. Clasificacion de assets mejorada.
5. Persistencia inicial del package factual.

### Criterios de cierre
- un proyecto genera asset registry y evidence registry persistentes
- el output ya no depende solo de texto libre

## Sprint 2 - Process and dependency reconstruction

### Objetivo
Reconstruir procesos y relaciones base.

### Entregables
1. Process registry inicial.
2. Dependency graph inicial.
3. Relacion asset -> process.
4. Relacion process -> dataset.
5. Fixtures basicos para validacion.

### Criterios de cierre
- el sistema identifica procesos principales en al menos los fixtures objetivo
- los grafos se pueden consultar y serializar

## Sprint 3 - Orchestration intelligence

### Objetivo
Meter comportamiento operacional minimo viable.

### Entregables
1. Orchestration step model.
2. Deteccion inicial de triggers y schedules.
3. Deteccion inicial de depends_on.
4. Operational constraint model.
5. Vista inicial de orquestacion.

### Criterios de cierre
- el proyecto ya puede describirse como flujo, no solo como inventario
- los casos representativos muestran secuencia reconocible

## Sprint 4 - Triage V2 foundation

### Objetivo
Convertir hechos en comprension util.

### Entregables
1. Project understanding summary.
2. Functional map inicial.
3. Risk and gap map inicial.
4. Uncertainty markers.
5. Ajuste de contratos para Agent QA, Agent S y Agent A.

### Criterios de cierre
- un humano puede entender el proyecto usando solo el output de Triage
- las incertidumbres quedan marcadas explicitamente

## Sprint 5 - Downstream recommendations

### Objetivo
Decidir que puede hacer el sistema con lo aprendido.

### Entregables
1. Downstream recommendation set.
2. Regla de activacion para generation, catalog, documentation y rule candidates.
3. Etiquetas downstream en el knowledge package.
4. Ajuste de mesh para incluir recomendaciones.

### Criterios de cierre
- Triage ya no fuerza salida unica a generacion
- el proyecto puede activar mas de un downstream

## Sprint 6 - Rule candidates and documentation exports

### Objetivo
Habilitar salidas reutilizables sin acoplarse a MDM aun.

### Entregables
1. Rule candidate summary.
2. Export contract para documentacion.
3. Export contract para candidate packs.
4. Evidencia asociada a candidatos.
5. Clasificacion reusable vs local logic.

### Criterios de cierre
- el sistema emite candidate packs revisables
- las explicaciones y evidencia son navegables

## Sprint 7 - Generation contract hardening

### Objetivo
Mejorar el input a generacion usando conocimiento estructurado.

### Entregables
1. Nuevo contrato para Agent C.
2. Mejor input a Agent F.
3. Mejor input a Agent G.
4. Trazabilidad knowledge -> output generado.

### Criterios de cierre
- los agentes downstream reciben menos contexto ambiguo y mas estructura reutilizable

## Sprint 8 - UX de conocimiento

### Objetivo
Hacer el sistema util para revision humana.

### Entregables
1. Vista de procesos.
2. Vista de dependencias.
3. Vista de orquestacion.
4. Vista de evidencia.
5. Vista de recomendaciones.

### Criterios de cierre
- el valor del sistema puede demostrarse sin abrir el codigo fuente completo

## Sprint 9 - Export adapters

### Objetivo
Preparar integraciones futuras sin vendor lock-in.

### Entregables
1. Export adapter para catalogo generico.
2. Export adapter para documentacion.
3. Export adapter para rule candidate pack.
4. Contrato listo para futuros adapters a Purview o Unity.

### Criterios de cierre
- al menos dos downstreams operan sobre el mismo package sin reanalisis

## Sprint 10 - Hardening y fixtures reales

### Objetivo
Cerrar la iteracion base con estabilidad.

### Entregables
1. Fixtures curados por tecnologia.
2. Mejora de cobertura de tests.
3. Ajuste de calidad sobre evidencia, confidence y errores.
4. Lista de deuda para siguiente release.

### Criterios de cierre
- los flujos principales son repetibles y auditables
- el producto aguanta una validacion con fixtures reales representativos

## Dependencias entre sprints

1. Sprint 0 desbloquea todo lo demas.
2. Sprint 1 y 2 son prerequisito de Sprint 4.
3. Sprint 3 es prerequisito fuerte para calidad de generacion y catalogo.
4. Sprint 5 es prerequisito para Sprint 6 y 9.
5. Sprint 7 debe consumir outputs estables de 4, 5 y 6.

## Criterios de priorizacion

Si el equipo se ve obligado a recortar alcance:

1. mantener Sprint 0 al 5
2. reducir UX antes que contratos
3. reducir adapters concretos antes que knowledge model
4. reducir tecnologias soportadas antes que reducir calidad del modelo

## Resultado de este plan

Al terminar esta secuencia, Legacy2Lake deberia haber dejado de ser una plataforma que entiende lo justo para generar y pasar a ser una plataforma que captura conocimiento estructurado suficiente para varios usos controlados.
