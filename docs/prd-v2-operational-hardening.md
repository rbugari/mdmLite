# PRD V2 - Operational Hardening (Scope Cerrado)

## 1. Objetivo

Entregar una v2 de MDM Lite robusta para operacion diaria, manteniendo simplicidad (monoempresa) y mejorando control de cambios, aprobacion y trazabilidad sin romper el contrato de consumo tecnico actual.

## 2. Decisiones Cerradas

1. Aprobacion con un solo rol aprobador: `ADMIN`.
2. v2 incluye solo Governance Hardening.
3. Legacy2Lake queda en v2 solo como contrato futuro definido (sin integracion operativa).
4. Se mantiene contrato de lectura por vistas activas:
   - `vw_mdm_mapping_rule_active`
   - `vw_mdm_group_rule_active`
   - `vw_mdm_parameter_active`
5. Se mantiene enfoque monoempresa/caso actual para no sobredisenar la UI.

## 3. Alcance Funcional v2

Incluye:

1. Login admin (flujo autenticado).
2. Permisos minimos por rol para separar aprobacion de edicion.
3. Workflow visible de estados:
   - `draft -> pending_approval -> approved/rejected/inactive`
4. Cola de pendientes para aprobacion.
5. Auditoria visible por registro/entidad.
6. Estrategia de actualizacion no destructiva para registros aprobados.
7. Import preview con validacion antes de confirmar.
8. Filtros operativos y paginacion en listas.

No incluye:

1. Candidate review layer operativa.
2. Document discovery (LLM extraction) operativa.
3. Integracion real con Legacy2Lake.
4. Multiempresa o scope enterprise MDM.

## 4. Requisitos No Funcionales

1. Preservar compatibilidad hacia consumidores actuales SQL.
2. Trazabilidad completa de acciones de negocio relevantes.
3. UX simple para operador administrativo.
4. Implementacion incremental sin redisenar todo el modelo de datos.

## 5. Fases De Ejecucion (listas para largar)

## Fase 1 - Seguridad y Workflow

Objetivo:
dejar operativa la gobernanza minima con acceso autenticado y circuito de aprobacion visible.

Entregables:

1. Login admin funcional.
2. Resolucion de actor real (sin depender de fallback opaco).
3. Permisos minimos por accion:
   - crear/editar
   - enviar a aprobacion
   - aprobar/rechazar/inactivar (solo ADMIN)
4. Cola de pendientes con filtros basicos.
5. Transiciones de estado controladas por backend.

Criterios de salida (go/no-go):

1. No se puede aprobar sin estar autenticado como ADMIN.
2. Todas las transiciones quedan registradas en auditoria.
3. El usuario ve claramente que registros estan pendientes.
4. No hay cambios en el contrato de vistas activas.

Dependencias:

1. Tablas `mdm_user`, `mdm_role`, estados de reglas y `mdm_change_log` ya presentes en schema.

## Fase 2 - Integridad de Datos y Auditoria Visible

Objetivo:
evitar edicion destructiva de reglas aprobadas y exponer historial util para operacion.

Entregables:

1. Estrategia no destructiva:
   - al cambiar una regla aprobada, se crea reemplazo controlado
   - el historial queda auditable
2. Vista de auditoria por registro y por entidad.
3. Detalle minimo mostrado:
   - actor
   - fecha
   - accion
   - estado previo
   - estado nuevo
   - comentario

Criterios de salida (go/no-go):

1. Ningun registro aprobado se sobrescribe en forma destructiva.
2. Se puede reconstruir el historial de decisiones de una regla.
3. Operacion puede responder quien cambio que y cuando.

Dependencias:

1. `mdm_change_log` disponible.
2. Definicion de flujo de cambios de backend cerrada en Fase 1.

## Fase 3 - Import Preview + Operacion de Listas

Objetivo:
reducir riesgo en cargas y mejorar experiencia operativa de gestion diaria.

Entregables:

1. Preview de import antes de confirmar.
2. Validacion de columnas y formato por target (`mappings`, `groups`, `parameters`).
3. Resultado previo con conteo:
   - inserts
   - updates
   - errores
   - conflictos
4. Confirmacion explicita de ejecucion.
5. Filtros ricos y paginacion para listas principales.

Criterios de salida (go/no-go):

1. No se ejecuta import final sin paso de preview.
2. Usuario entiende impacto antes de confirmar.
3. Los errores por fila son visibles y accionables.
4. Las listas mantienen performance operativa con paginacion.

Dependencias:

1. Endpoints de import existentes.
2. Uso efectivo de `mdm_import_batch` y `mdm_import_item`.

## Fase 4 - Cierre de v2 y Handoff Futuro

Objetivo:
cerrar v2 estable y dejar definido el puente hacia entradas externas sin implementarlas.

Entregables:

1. Documento de contrato futuro de candidate pack (source-agnostic).
2. Schema minimo acordado para candidatos:
   - `candidateType`
   - `payload`
   - `evidence`
   - `confidence`
   - `sourceKind`
   - `needsHumanReview`
3. Ejemplo de payload valido para futura integracion.
4. Checklist de no-regresion del contrato SQL activo.

Criterios de salida (go/no-go):

1. Contrato futuro queda claro sin afectar v2 operativa.
2. No hay integracion externa activa en esta version.
3. Se preserva frontera: analisis afuera, governance adentro.

## 6. Backlog Priorizado (resumen)

Prioridad alta:

1. Login admin y actor real.
2. Transiciones de estado con permisos.
3. Cola de pendientes.
4. No-destructive update.
5. Auditoria visible.

Prioridad media:

1. Import preview y validacion previa.
2. Errores por fila y conflictos.
3. Filtros avanzados y paginacion.

Prioridad baja (documental en v2):

1. Contrato future candidate pack.

## 7. Riesgos y Mitigaciones

1. Riesgo: complejidad innecesaria por abrir multi-dominio en UI.
   Mitigacion: mantener monoempresa en v2 y no expandir contexto.
2. Riesgo: romper consumidores actuales por cambios de lectura.
   Mitigacion: contrato estricto de vistas activas sin cambios de interfaz.
3. Riesgo: imports con errores silenciosos.
   Mitigacion: preview obligatorio y reporte por fila.

## 8. Condicion de Exito v2

MDM Lite v2 queda lista para uso operativo controlado cuando:

1. El circuito crear -> revisar -> aprobar -> consumir funciona con autenticacion admin.
2. Las reglas aprobadas no se editan destructivamente.
3. La auditoria permite explicar decisiones.
4. Los imports son previsibles antes de ejecutar.
5. Los consumidores tecnicos siguen leyendo las vistas activas sin cambios.

---

## 9. Estado de Implementacion (as of 2026-04-15)

### Fase 1 ✅ COMPLETADA
- Login admin funcional y actor resolution
- Permisos minimos: crear/editar/enviar a aprobacion/aprobar/rechazar/inactivar
- Cola de pendientes visible
- Transiciones de estado registradas en auditoria
- **Validacion:** Todas las acciones requieren autenticacion ADMIN

### Fase 2 ✅ COMPLETADA
- Estrategia no destructiva implementada:
  - Cambios a reglas aprobadas crean nuevos registros
  - Auto-inactivate del anterior en aprobacion
  - Historial auditable preservado
- Vista de auditoria por registro con History links desde tablas operativas
- Cambios visibles: actor, fecha, accion, estado previo/nuevo
- **Validacion:** `npm run e2e:nondestructive` pasa (create -> approve -> replace -> approve -> verify inactivation)

### Fase 3 ✅ COMPLETADA
- Import preview con validacion previa (preview URL: `/api/imports/upload/preview`)
- Confirmacion con token one-time-use (confirm URL: `/api/imports/upload/confirm`)
- Validacion por target: mappings, groups, parameters
- Reporte: inserts, updates, errores, conflictos
- Filtros operativos y paginacion en listas (5-100 rows, default 25)
- **Validacion:** `npm run e2e:client-asset` (21 workflows + 3 import scenarios, auto-cleanup)

### Fase 4 🔄 EN PREPARACION
- Contrato futuro candidate pack documentado en schema
- Ready para v3 sin implementacion operativa en v2

### Test Infrastructure ✅ COMPLETA
- **E2E Non-Destructive:** [scripts/e2e-nondestructive.mjs](scripts/e2e-nondestructive.mjs) → 3 workflows (create/approve/replace)
- **Client Asset Pack:** [data/demo/client-asset-pack/](data/demo/client-asset-pack/) + [scripts/e2e-client-asset-suite.mjs](scripts/e2e-client-asset-suite.mjs) → 21 workflows + 3 import scenarios
- **Global Scanner:** [scripts/test-scanner.mjs](scripts/test-scanner.mjs) → Aggregates typecheck + e2e:nondestructive + e2e:client-asset
- **Report:** `npm run test:scan` → GO/NO_GO status + JSON report to `reports/test-scan-latest.json`

### Criterio Go/No-Go
Ejecutar: `npm run test:scan`
- Resultado esperado: **GO** (todos los steps pasan)
- Duracion: ~24s
- Report guardado: `reports/test-scan-latest.json`

---

## 10. Sign-Off v2 (2026-04-15)

**Status: ✅ READY FOR PRODUCTION**

| Componente | Status | Evidencia |
|---|---|---|
| TypeScript Build | ✅ PASS | typecheck 2.6s, 0 errors |
| Non-Destructive E2E | ✅ PASS | 3/3 workflows (mapping/group/parameter) |
| Client Asset Suite | ✅ PASS | 21 workflows + 3 import scenarios |
| Import Preview/Confirm | ✅ PASS | Token one-time-use validated |
| Audit Trail | ✅ PASS | History links functional |
| Pagination & Filters | ✅ PASS | 5-100 rows, default 25 |
| Database Contracts | ✅ PASS | No breaking changes to active views |

**Last Test Run:** 2026-04-15T06:44:30Z
**Total Suite Duration:** 30.5s
**Overall Result:** GO

**Deployment Readiness:**
1. Operacion daily use: READY
2. Consumidores actuales (SQL) compatible: YES (vistas activas sin cambios)
3. Demo listo: YES (data/demo/client-asset-pack con 6 escenarios validos)
4. Handoff documentado: YES (future roadmap en [docs/future-roadmap.md](docs/future-roadmap.md))

**Known Limitations (v2):**
- Single role (ADMIN) for approval
- No candidate layer (post-v2)
- No multitenancy (monoempresa por diseño)
- Session hardening pending (v2.1 posible)

**Next Steps Post-v2:**
1. CI/CD automation (GitHub Actions)
2. Test reporting trends (historical tracking)
3. Extended asset packs (PRODUCT, COMPANY, COMMERCIAL, SOCIETY)
4. Production hardening (session TTL, RBAC refinement)
5. Candidate layer (v3)
