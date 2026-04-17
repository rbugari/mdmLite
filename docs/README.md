# Docs

## Canonical Set (v2)

La documentacion vigente de MDM Lite queda consolidada en estos documentos:

### Product & Requirements
1. **product-definition.md** - Definicion del producto, alcance, posicionamiento y limite funcional.
2. **current-state-and-contracts.md** - Estado real implementado hoy, contrato tecnico SQL y API.
3. **prd-v2-operational-hardening.md** - PRD v2 cerrado, fases completadas y sign-off (2026-04-15).
4. **future-roadmap.md** - Plan futuro consolidado, releases v3+, direccion de evolucion.

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
