# MDM Lite

Repositorio base del MVP de MDM Lite / Reference Data Manager.

## Objetivo
Centralizar equivalencias, agrupaciones y parametros de negocio para el caso Ventas-Perseida, con vigencia, auditoria, aprobacion simple e integracion tecnica por vistas SQL.

## Estado actual
1. Documentacion funcional y tecnica organizada en `docs/`.
2. Dataset demo en `data/demo/`.
3. Esquema SQL inicial en `db/schema/`.
4. Scaffold base de aplicacion en `src/`.
5. Arranque local preparado por `.env` y launcher `.bat`.

## Estructura
- `docs/` documentacion funcional, tecnica y de decisiones.
- `data/demo/` archivos demo de entrada.
- `db/schema/` esquema SQL y objetos de base de datos.
- `src/` aplicacion Next.js.

## Documentacion principal
- `docs/specs/especificacion_mdm_lite_supabase_canvas.md`
- `docs/planning/plan-mdmLite.prompt.md`
- `docs/product/backlog-mvp-mdmLite.md`
- `docs/product/faq-ejecutiva-mdmLite.md`
- `docs/product/release-v0.1-mdmLite.md`
- `docs/product/release-notes-v0.1-mdmLite.md`
- `docs/product/post-v0.1-candidates-mdmLite.md`
- `docs/architecture/arquitectura-mvp-mdmLite.md`
- `docs/architecture/integracion-plataformas-y-posicionamiento-mdmLite.md`
- `docs/decisions/matriz-decisiones-mdmLite.md`
- `docs/analysis/analisis-input-demo-mdmLite.md`

## Decisiones base del MVP
1. Next.js + TypeScript.
2. PostgreSQL estandar.
3. Seguridad monoempresa con un ADMIN inicial.
4. Carga por `csv/xlsx` y alta manual simple.
5. UI de tabla + formulario simple.
6. Consumo tecnico por vistas SQL.
7. Preparacion futura para LLM por SQL, API o MCP.

## Siguientes pasos sugeridos
1. Instalar dependencias.
2. Implementar capa de acceso a PostgreSQL.
3. Construir modulo de importacion demo.
4. Implementar listado y formulario de equivalencias.

## Conexion actual a base de datos
1. La app ya esta preparada para usar `DATABASE_URL` desde `.env`.
2. Existe un healthcheck de DB en `/api/health/db`.
3. El pool PostgreSQL se comparte entre requests para evitar crear conexiones repetidas en desarrollo.
4. Existe un endpoint funcional inicial en `/api/mappings`.
5. El esquema puede aplicarse con `npm run db:apply`.
6. La demo inicial puede cargarse con `npm run db:import-demo`.

## Carga inicial de demo
1. Aplicar esquema: `npm run db:apply`
2. Importar Excel demo: `npm run db:import-demo`
3. Verificar endpoints:
	1. `/api/health/db`
	2. `/api/mappings`
	3. `/api/parameters`

## Puertos locales
Todos los servicios locales deben usar puertos terminados en `3`.

Configuracion actual prevista:
1. App web: `3003`
2. MCP futuro: `3103`
3. Worker futuro: `3203`

## Ejecucion local
1. Configurar variables en `.env`.
2. Ejecutar `scripts\start-all.bat`.
3. El launcher valida puertos ocupados y abre cada servicio habilitado en una ventana CMD independiente.

## Base de datos
La base PostgreSQL actual es remota en Supabase, por lo que no se levanta una instancia local desde el launcher.

## Nota
Existe una copia bloqueada temporalmente del archivo `input_mvp_ventas_perseida_v2.xlsx` en la raiz porque otro proceso la mantiene abierta. El dataset correcto ya fue copiado a `data/demo/`.
