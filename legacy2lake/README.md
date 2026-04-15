# Legacy2Lake Design Pack

Este directorio agrupa documentos de trabajo para evolucionar Legacy2Lake en la parte de analisis, discovery y triage sin mezclarlo con el trabajo de MDM Lite.

## Objetivo

Dejar una base documental suficientemente detallada para que otro agente o equipo pueda usarla como punto de partida de implementacion en el repo de Legacy2Lake.

## Contenido

1. `01-gap-analysis-discovery.md`
   Analisis del gap entre el Discovery actual y un Discovery orientado a conocimiento profundo.
2. `02-gap-analysis-triage.md`
   Analisis del gap entre el Triage actual y un Triage orientado a comprension profunda y downstreams multiples.
3. `03-knowledge-model-v1.md`
   Modelo minimo de conocimiento estructurado para soportar explicacion, catalogo, MDM y generacion.
4. `04-discovery-v2.md`
   Definicion funcional y tecnica propuesta para Discovery V2.
5. `05-triage-v2.md`
   Definicion funcional y tecnica propuesta para Triage V2.
6. `06-downstream-outputs.md`
   Contratos de salida y criterios para exportar a generacion, catalogos, gobierno y MDM.
7. `07-roadmap-and-delivery.md`
   Roadmap por fases, criterios de validacion y estrategia de implementacion.
8. `08-future-requirements-master-plan.md`
   Requerimientos futuros consolidados, prioridades, dependencias y no objetivos inmediatos.
9. `09-sprint-plan.md`
   Plan de evolucion por sprints con entregables y criterios de cierre.
10. `10-workstreams-and-build-sequence.md`
   Workstreams de construccion, orden recomendado y dependencias entre frentes.

## Regla de uso

Estos documentos asumen:

- Legacy2Lake sigue siendo el producto base de analisis y modernizacion.
- MDM es un downstream opcional para reglas reusable, no un requisito obligatorio de cada proyecto.
- El foco de estos docs esta en proyecto/solucion individual, dejando preparada una evolucion posterior a vista cross-project o landscape.

## Resultado esperado

Tras implementar lo aqui descrito, Discovery y Triage deben dejar de ser solo preparacion de generacion y convertirse en el nucleo de conocimiento estructurado de Legacy2Lake.
