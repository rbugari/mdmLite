# Matriz de decisiones pendientes - MDM Lite

## Objetivo
Cerrar rapidamente las decisiones que bloquean o condicionan el desarrollo del MVP.

## Como usar esta matriz
1. Si una decision afecta modelo de datos, debe cerrarse antes de migraciones.
2. Si una decision afecta seguridad o despliegue, debe cerrarse antes de iniciar implementacion base.
3. Si una decision afecta solo experiencia operativa, puede cerrarse durante UX detallada.

| Decision | Estado recomendado | Impacto | Urgencia | Recomendacion | Consecuencia si se pospone |
| --- | --- | --- | --- | --- | --- |
| Stack del MVP | Cerrar | Alto | Alta | Next.js + TypeScript | Se retrasa arquitectura y bootstrap |
| Hosting app | Cerrar | Medio | Media | Vercel si priorizas velocidad; Railway si priorizas menos piezas | Se retrasa pipeline de despliegue |
| Hosting DB | Cerrar | Medio | Media | Supabase PostgreSQL inicial | Se retrasa provisionado y pruebas |
| Claves simples o compuestas | Cerrar | Muy alto | Alta | Empezar simple solo si el caso real no requiere contexto extra | Riesgo de rehacer schema temprano |
| Reglas 1:1 o 1:N | Cerrar | Alto | Alta | MVP 1:1 | Cambia modelo y validaciones |
| Politica de versionado | Cerrar | Muy alto | Alta | Nueva version por vigencia, sin editar historico approved | Riesgo de auditoria inconsistente |
| Cambios retroactivos | Cerrar | Alto | Alta | No modificar historico; crear nueva vigencia | Riesgo analitico y de reconciliacion |
| Autenticacion | Cerrada para MVP | Alto | Alta | Login local simple en la aplicacion | Se puede refinar mas adelante sin rehacer dominio |
| Permisos por rol | Cerrada para MVP | Medio | Alta | Solo ADMIN operativo en primera fase | Se difiere segregacion real de funciones |
| Consumo tecnico inicial | Cerrar | Alto | Alta | Vistas SQL como contrato principal | Cambian prioridades de backend |
| API de lectura externa | Dejar abierto | Medio | Media | Posponer salvo necesidad clara | Puede evitar trabajo innecesario |
| Importacion CSV/Excel | Cerrada para MVP | Medio | Media | Incluir `csv/xlsx` mas alta manual simple | Acelera carga inicial y demo |
| Exposicion futura a LLM | Dejar abierta pero considerada | Medio | Media | Preparar contratos de lectura estables por SQL, API o MCP | Evita rediseño futuro |
| Comentario obligatorio al rechazar | Cerrar | Bajo | Baja | Si, obligatorio | Menor impacto tecnico |
| Comentario obligatorio al aprobar | Cerrar | Bajo | Baja | No, opcional | Menor impacto tecnico |
| Multiidioma | Posponer | Bajo | Baja | No en MVP | Evita complejidad prematura |
| Entornos dev/test/prod | Cerrar | Medio | Media | Al menos dev y prod | Mejora control de despliegues |
| Semillas del caso Ventas-Perseida | Cerrar | Medio | Alta | Preparar dataset representativo cuanto antes | Se debilita validacion funcional |

## Decisiones que recomiendo dar por cerradas ya
1. Stack: Next.js + TypeScript.
2. DB: PostgreSQL estandar.
3. Hosting DB inicial: Supabase.
4. Consumo tecnico MVP: vistas SQL.
5. Workflow MVP: una sola aprobacion.
6. Reglas MVP: 1:1.
7. Politica de cambio: nueva version por vigencia.
8. Seguridad: login local simple y un unico ADMIN inicial.
9. Entrada de datos: importacion `csv/xlsx` y alta manual simple.

## Decisiones que requieren confirmacion funcional real
1. Si las claves de negocio son simples o compuestas.
2. Si parametros se definen por dominio, entidad o ambos.
3. Si los ejemplos de cliente requieren contexto como sociedad, pais o canal.
4. Si un registro approved puede inactivarse sin reemplazo.
5. Si el login local sera por email + password o por acceso cerrado aun mas simple.
6. Si la futura exposicion a LLM sera por SQL controlado, API, MCP o una combinacion.

## Preguntas concretas para una reunion de cierre
1. Un mismo source_value puede mapear a mas de un target segun contexto?
2. Las homologaciones dependen de sociedad, pais, canal o fecha?
3. Quien aprueba en el proceso real y con que criterio?
4. El rechazo debe devolver la regla editable o dejarla cerrada?
5. Cuales son los primeros 20 casos reales que deben estar en la demo?
6. La carga inicial combinara importacion y ajustes manuales; que columnas minimas deben exigirse por archivo?
7. La API externa es necesaria en MVP o basta SQL para integracion?
8. Para LLM futuro, prefieres exposicion por API, MCP o lectura SQL controlada?

## Orden recomendado para cerrar decisiones
1. Modelo de regla y clave de negocio.
2. Politica de vigencia e historico.
3. Detalle fino del login local.
4. Contrato de consumo tecnico.
5. Despliegue.
6. Importacion masiva.
