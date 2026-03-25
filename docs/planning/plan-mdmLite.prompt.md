## Plan: Especificación V2 MDM Lite

Convertir el concepto actual en un MVP implementable como aplicación administrativa ligera para reglas maestras de negocio. La recomendación es un MVP full-stack con Next.js + TypeScript, PostgreSQL estándar y despliegue inicial simple sobre Supabase + Vercel o Railway, manteniendo el núcleo portable y evitando lock-in.

**Artefactos generados**
1. `backlog-mvp-mdmLite.md` - backlog MVP con épicas, historias y criterios de aceptación.
2. `arquitectura-mvp-mdmLite.md` - arquitectura técnica recomendada para el MVP.
3. `matriz-decisiones-mdmLite.md` - matriz de decisiones abiertas y recomendaciones de cierre.
4. `schema-mvp-mdmLite.sql` - primer esquema SQL portable para PostgreSQL.
5. `analisis-input-demo-mdmLite.md` - análisis del Excel demo y conclusiones de modelado.

**Estado actual**
1. La definición funcional ya está bajada a backlog.
2. La arquitectura del MVP ya tiene una propuesta concreta.
3. Existe un esquema SQL inicial para arrancar diseño e implementación.
4. El Excel demo validó que el MVP puede arrancar con claves simples en equivalencias y agrupaciones.
5. La importación `xlsx/csv` pasa a ser requisito funcional del MVP.
6. La UI inicial se orienta a tabla + formulario simple, no a un ABM pesado.

**Steps**
1. Cerrar decisiones base del MVP.
La v2 asume estas decisiones por defecto:
app full-stack TypeScript, una sola aprobación, consumo técnico principal por vistas SQL, reglas 1:1, sin matching fuzzy ni workflows multinivel.

2. Definir el alcance funcional exacto.
Incluye:
equivalencias, agrupaciones, parámetros, vigencias, activación/desactivación, aprobación simple, auditoría, vistas activas e importación `xlsx/csv`.
Excluye:
golden record, matching inteligente, jerarquías complejas, integración de escritura con SAP, multinivel de aprobación.

3. Cerrar el modelo de reglas.
Cada regla del MVP debe ser temporal, trazable y aprobable.
Recomendación:
no editar histórico aprobado; al cambiar una regla se crea nueva versión con nueva vigencia y se cierra la anterior.

4. Diseñar el modelo de datos lógico.
Entidades mínimas:
tipos de entidad, conjuntos de reglas, reglas de equivalencia, reglas de agrupación, parámetros, catálogos, usuarios/roles y log de cambios.
Todas las tablas operativas deben incluir:
estado, vigencia, activación, creador, modificador, timestamps y comentario.

5. Definir la arquitectura del MVP.
Recomendación:
Next.js para frontend y backend, capa de acceso a datos desacoplada, PostgreSQL estándar como contrato real, API solo para administración y vistas SQL para consumo técnico.

6. Diseñar seguridad y roles.
Autenticación simple y portable.
Autorización desde aplicación, no dependiente del proveedor de base de datos.
Roles iniciales:
Administrador, Data Steward, Solo Lectura.

7. Diseñar UX mínima.
Pantallas:
dashboard, equivalencias, agrupaciones, parámetros, aprobaciones, auditoría e importación.
La prioridad es operación clara con tabla + formulario simple, no una UI sofisticada ni un ABM pesado.

8. Definir contrato técnico de salida.
Vistas activas que devuelven solo registros aprobados, activos y vigentes.
Ése debe ser el punto de integración para dbt, SQL o pipelines.

9. Definir validación y criterios de aceptación.
Cada flujo debe poder probarse de extremo a extremo con datos de ejemplo del caso Ventas-Perseida.

**Relevant files**
- especificacion_mdm_lite_supabase_canvas.md — documento base que se transforma en v2 ejecutable.

**Verification**
1. Validar que cada tipo de regla tiene clave única de negocio definida.
2. Validar que no existan vigencias solapadas ambiguas.
3. Validar que el flujo draft -> pending -> approved/rejected -> inactive esté cerrado.
4. Validar que las vistas activas cubren el consumo técnico del MVP.
5. Validar que la solución pueda migrarse fuera de Supabase con impacto bajo.

**Decisions**
- Stack recomendado: Next.js + TypeScript.
- Base de datos: PostgreSQL estándar.
- Hosting inicial recomendado: Supabase para DB.
- Despliegue app: Vercel si priorizas velocidad; Railway si priorizas centralizar más.
- Contrato técnico inicial: vistas SQL.
- Workflow: aprobación simple de una persona.
- Seguridad MVP: monoempresa con un único usuario administrador inicial.
- Autenticación MVP: login local simple en la propia aplicación.
- Importación MVP: carga por archivo `xlsx/csv` y carga manual simple.
- UX MVP: tabla filtrable + formulario simple.
- Estrategia futura: mantener el conocimiento MDM accesible para LLMs por SQL, API o MCP, sin incluirlo aún en el MVP.
- Política de cambio recomendada: versionado por vigencia, no edición destructiva del histórico.

**Further Considerations**
1. Confirmar si alguna regla real del caso Ventas-Perseida exige contexto como sociedad o canal.
2. Confirmar autenticación final.
3. Confirmar alcance exacto de la importación `csv/xlsx` en el MVP.
4. Diseñar desde ahora contratos estables de lectura para futura exposición a LLMs.

**Borrador De Contenido V2**
Puedes tomar esto como base directa del documento funcional-técnico.

**1. Objetivo del sistema**
El sistema MDM Lite será una aplicación web administrativa para gestionar reglas maestras de negocio reutilizables por procesos analíticos y operativos ligeros. El objetivo es centralizar equivalencias, agrupaciones y parámetros que hoy están dispersos en transformaciones, reportes o mantenimiento manual.

**2. Objetivo del MVP**
El MVP debe permitir:
1. Crear y mantener reglas de equivalencia.
2. Crear y mantener agrupaciones.
3. Crear y mantener parámetros simples.
4. Controlar vigencia de cada registro.
5. Aprobar o rechazar cambios con flujo simple.
6. Consultar auditoría básica.
7. Exponer vistas SQL activas para consumo técnico.

**3. Alcance funcional cerrado**
Incluye:
1. CRUD de equivalencias.
2. CRUD de agrupaciones.
3. CRUD de parámetros.
4. Estados de workflow.
5. Vigencia desde/hasta.
6. Baja lógica.
7. Auditoría de cambios.
8. Dashboard operativo básico.

No incluye:
1. Fuzzy matching.
2. Golden record.
3. Matching automático.
4. Sincronización de escritura con ERP.
5. Workflow multinivel.
6. Jerarquías complejas de múltiples niveles.

**4. Decisiones funcionales recomendadas**
1. Las reglas del MVP serán 1:1.
2. El histórico aprobado no se sobrescribe.
3. Un cambio sobre una regla vigente crea una nueva versión.
4. Solo reglas aprobadas, activas y vigentes son consumibles técnicamente.
5. La app administra reglas; los procesos analíticos las consumen, no las editan.
6. La entrada de datos del MVP combina importación por archivo y alta manual simple.

**5. Tipos de usuarios**
Administrador:
configura catálogos, gestiona reglas, aprueba y consulta auditoría.

Para el MVP se implementará inicialmente un único usuario administrador. Los perfiles Data Steward y Solo Lectura quedan como extensión futura del modelo, pero no bloquean la primera versión.

**6. Estados y transiciones**
Estados:
draft, pending_approval, approved, rejected, inactive.

Transiciones recomendadas:
1. draft -> pending_approval
2. pending_approval -> approved
3. pending_approval -> rejected
4. approved -> inactive
5. rejected -> draft

No se recomienda permitir edición libre directa sobre registros approved sin crear nueva versión.

**7. Reglas de vigencia**
1. Toda regla tendrá valid_from.
2. valid_to será opcional.
3. No debe haber solapamientos para la misma clave de negocio cuando dos reglas aprobadas compiten sobre el mismo periodo.
4. Si una regla se reemplaza, la anterior se cierra con valid_to.
5. Las vistas activas deben aplicar filtro temporal automáticamente.

**8. Modelo lógico mínimo**
Entidades mínimas recomendadas:
1. mdm_entity_type
2. mdm_rule_set
3. mdm_mapping_rule
4. mdm_group_rule
5. mdm_parameter
6. mdm_reference_list
7. mdm_user
8. mdm_role
9. mdm_change_log
10. mdm_import_batch
11. mdm_import_item

**9. Claves de negocio a definir**
Aquí sigue habiendo una definición pendiente importante.

Equivalencias:
recomendación base
rule_set + entity_type + source_key + source_value + valid_from

Agrupaciones:
rule_set + entity_type + member_value + valid_from

Parámetros:
parameter_key + parameter_scope_value + valid_from

El Excel demo permite arrancar simple. Si el caso real necesita contexto adicional como sociedad, canal o país, entonces habrá que extender la clave y el formulario en una siguiente iteración.

**10. Arquitectura técnica recomendada**
Frontend:
Next.js + TypeScript

Backend:
route handlers o API routes en Next.js

Base de datos:
PostgreSQL estándar

Despliegue recomendado:
1. Supabase como PostgreSQL gestionado
2. Vercel para frontend/backend serverless
3. Alternativa: Railway si quieres concentrar más la operación

Criterio principal:
el sistema debe poder moverse a otro PostgreSQL sin rediseñar modelo, seguridad funcional ni API.

**11. Seguridad**
1. Autenticación local simple y portable.
2. El MVP arranca con un único usuario administrador.
3. Los roles quedan modelados para evolución futura, pero inicialmente solo se usa ADMIN.
4. Permisos aplicados en backend.
5. Evitar dependencia de RLS como base del modelo de seguridad del MVP.
6. Trazar quién crea, modifica, envía, aprueba o rechaza.

**12. Contrato de consumo técnico**
El consumo técnico del MVP será por vistas SQL.

Vistas mínimas:
1. vw_mdm_mapping_rule_active
2. vw_mdm_group_rule_active
3. vw_mdm_parameter_active

Regla de filtrado:
1. is_active = true
2. status = approved
3. hoy dentro de vigencia

Estas vistas deben diseñarse como contrato estable no solo para dbt o pipelines, sino también como base futura para exposición controlada a LLMs, ya sea por lectura SQL, API de consulta o un servidor MCP.

**12.1 Preparación futura para LLM / API / MCP**
No forma parte del MVP, pero debe preservarse como dirección de diseño:

1. El conocimiento aprobado y vigente debe poder consultarse de forma segura y estable.
2. Las vistas activas deben ser legibles por humanos y máquinas, con nombres y campos consistentes.
3. La futura API debe exponer consultas, no lógica de edición automática sin control.
4. Si en el futuro un LLM participa en acciones, sus cambios deberán quedar auditados como actor identificado.
5. La integración MCP futura debería apoyarse en los mismos contratos de lectura y escritura auditada, no en accesos ad hoc.

**13. Pantallas mínimas**
1. Dashboard
2. Gestión de equivalencias
3. Gestión de agrupaciones
4. Gestión de parámetros
5. Aprobaciones
6. Auditoría
7. Importación de archivos y revisión previa

En una fase posterior, el sistema podrá añadir una capa de consulta asistida por LLM sobre estos mismos datos, sin alterar la operativa administrativa base.

**14. Validaciones de negocio mínimas**
1. No duplicar reglas con misma clave y misma vigencia.
2. No permitir vigencias inválidas.
3. No permitir aprobar registros incompletos.
4. No permitir que una regla activa aprobada entre en conflicto temporal con otra equivalente.
5. Registrar motivo de rechazo.
6. Registrar comentario opcional de aprobación.

**15. Auditoría mínima**
Cada cambio debe registrar:
1. tabla afectada
2. registro afectado
3. acción
4. valor previo
5. valor nuevo
6. usuario
7. timestamp
8. estado de aprobación
9. comentario

**16. Datos iniciales recomendados**
El MVP debería incluir semilla inicial de:
1. tipos de entidad
2. rule sets del dominio Ventas-Perseida
3. estados
4. roles
5. ejemplos reales de homologación de clientes
6. ejemplos de agrupaciones
7. ejemplos de factores/parámetros
8. dataset demo importado desde Excel

**17. Criterios de aceptación del MVP**
1. Un steward puede crear una regla en draft.
2. Puede enviarla a aprobación.
3. Un admin puede aprobarla o rechazarla.
4. Una regla aprobada aparece en la vista activa si está vigente.
5. Una regla rechazada no aparece en consumo activo.
6. Todo cambio queda auditado.
7. La app puede desplegarse sin depender de mecanismos no portables del proveedor.

**Qué Falta Definir Todavía**
Éstas son las definiciones que siguen abiertas y sí conviene cerrar antes de construir:

1. Si las claves de negocio serán simples o compuestas.
2. Si el login local usará email + password o un acceso aún más simple para entorno interno.
3. Si el consumo técnico del MVP será solo SQL o también lectura API.
4. Si habrá comentarios obligatorios al aprobar/rechazar.
5. Si una regla aprobada puede desactivarse sin reemplazo.
6. Si los parámetros serán globales o por dominio/entidad.
7. Cuál será el primer dataset real de Ventas-Perseida para validación.
8. Si necesitas multiidioma o no.
9. Si habrá entornos separados desde el arranque: dev, test, prod.

**Nota sobre seguridad MVP**
La decisión de arrancar con un solo administrador simplifica mucho la primera entrega, pero elimina la segregación real de funciones. En la práctica, el mismo usuario podrá crear, enviar y aprobar. El workflow sigue siendo útil para dejar trazabilidad y preparar la evolución futura, aunque en esta fase no aporta control dual.

**Mi Cierre Pragmático**
Con lo que ya tienes, el documento puede pasar de “propuesta” a “especificación ejecutable” si cierras sobre todo estas tres cosas:

1. Clave de negocio y vigencias.
2. Seguridad y roles reales.
3. Contrato técnico de consumo.

Si quieres, el siguiente paso más útil es uno de estos:

1. Te convierto esta v2 en backlog MVP con épicas e historias.
2. Te preparo la arquitectura concreta de carpetas, módulos, tablas y endpoints.
3. Te dejo una matriz de decisiones pendientes para cerrar con negocio en una sola reunión.
