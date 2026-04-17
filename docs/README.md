# Docs

## Canonical Set (v2)

La documentacion vigente de MDM Lite queda consolidada en estos documentos:

### Product & Requirements
1. **product-definition.md** - Definicion del producto, alcance, posicionamiento y limite funcional.
2. **current-state-and-contracts.md** - Estado real implementado hoy, contrato tecnico SQL y API.
3. **prd-v2-operational-hardening.md** - PRD v2 cerrado, fases completadas y sign-off (2026-04-15).
4. **future-roadmap.md** - Plan futuro consolidado, releases v3+, direccion de evolucion.
5. **release-trial-readiness-plan.md** - Plan ejecutable para cerrar la primera release instalable y operable.
6. **product-trial-scope.md** - Alcance y narrativa del primer trial controlado.
7. **v0.3-candidate-review-draft.md** - Borrador de la siguiente fase funcional despues de release readiness.
8. **release-candidate-checklist.md** - Checklist de go/no-go para declarar trial readiness.
9. **trial-support-baseline.md** - Frontera de soporte y diagnostico minimo para el primer trial.
10. **trial-readiness-status.md** - Estado actual del baseline trial y resultado de la ultima validacion.
11. **trial-known-limitations.md** - Registro de limitaciones aceptadas y bloqueos no aceptados.

### Testing & Operations
5. **testing/README.md** - Guia completa de testing con cuatro suites (typecheck, e2e:nondestructive, e2e:client-asset, test:scan).
6. **testing/README.md / Remote Foundation Validation** - Flujo para validar DB PostgreSQL remota efimera y smoke operativo.

## Orden de lectura recomendado

### Para entender el producto
1. product-definition.md
2. current-state-and-contracts.md
3. prd-v2-operational-hardening.md

### Para operar/mantener
1. [../README.md](../README.md) - Quick start y overview
2. testing/README.md - Testing guide
3. [../data/demo/client-asset-pack/README.md](../data/demo/client-asset-pack/README.md) - Test scenarios
4. current-state-and-contracts.md - API reference

### Para planificar futuro
1. future-roadmap.md
2. prd-v2-operational-hardening.md (section "Sign-Off v2")
3. release-trial-readiness-plan.md
4. product-trial-scope.md
5. v0.3-candidate-review-draft.md
6. release-candidate-checklist.md
7. trial-support-baseline.md
8. trial-readiness-status.md
9. trial-known-limitations.md

## Criterio editorial

Este set reemplaza a la documentacion anterior dispersa entre `specs/`, `planning/`, `product/`, `architecture/`, `decisions/` y `analysis/`.

El objetivo es dejar:

1. una **definicion clara** de producto
2. un **estado actual alineado** con la implementacion real
3. un **roadmap futuro corto** y priorizado
4. una **guia de testing** operativa

Todo lo demas se considera material reemplazado por esta consolidacion.

## v2 Status (2026-04-15)

✅ **PRODUCTION READY**
- Fases 1-3 completadas
- Todos los tests: GO
- Sign-off documentado en prd-v2-operational-hardening.md

**CI/CD:** Enabled en .github/workflows/test.yml

**Last verification:** `npm run test:scan` → GO (30.5s)
