# Backlog MVP - MDM Lite

## Objetivo
Traducir la especificacion v2 en un backlog implementable para un MVP administrativo sobre PostgreSQL estandar, con app web ligera, workflow simple de aprobacion y vistas SQL activas.

## Supuestos base
1. Stack: Next.js + TypeScript.
2. Base de datos: PostgreSQL estandar.
3. Primer despliegue: Supabase para DB y Vercel o Railway para la app.
4. Reglas MVP: 1:1.
5. Workflow MVP: una sola aprobacion.
6. Consumo tecnico principal: vistas SQL activas.
7. Seguridad MVP: monoempresa con un unico usuario administrador inicial.
8. Entrada MVP: importacion `xlsx/csv` y alta manual simple.
9. UX MVP: tabla + formulario simple.

## Epica 1 - Fundacion tecnica
### Historia 1.1 - Inicializar proyecto web
Como equipo tecnico quiero una aplicacion base full-stack para poder desarrollar UI y API en un solo repositorio.

Criterios de aceptacion:
1. Existe una app Next.js con TypeScript.
2. Existe configuracion de variables de entorno para conexion a PostgreSQL.
3. Existe estructura inicial para app, componentes, servicios y acceso a datos.

### Historia 1.2 - Configurar acceso a base de datos
Como equipo tecnico quiero una capa de acceso a PostgreSQL desacoplada del proveedor para evitar lock-in.

Criterios de aceptacion:
1. La aplicacion se conecta a PostgreSQL mediante cadena estandar.
2. La logica de acceso no depende de SDK propietario.
3. Existe una forma reproducible de ejecutar migraciones.

### Historia 1.3 - Configurar observabilidad minima
Como equipo tecnico quiero logs basicos para diagnosticar errores funcionales del MVP.

Criterios de aceptacion:
1. Las operaciones de API relevantes quedan logadas.
2. Los errores se registran con contexto suficiente.
3. No se exponen secretos en logs.

## Epica 2 - Seguridad y acceso
### Historia 2.1 - Autenticacion de usuarios
Como usuario interno quiero iniciar sesion para acceder al sistema segun mi rol.

Criterios de aceptacion:
1. La app exige autenticacion para acceder a modulos internos.
2. El usuario autenticado queda disponible en backend.
3. Existe manejo de sesion valido para entorno MVP.
4. El primer acceso puede operar con un usuario administrador local.

### Historia 2.2 - Roles y permisos
Como administrador quiero que las acciones disponibles dependan del rol para evitar cambios no autorizados.

Criterios de aceptacion:
1. El MVP funciona con el rol Administrador como unico rol operativo inicial.
2. Solo Administrador puede aprobar o rechazar.
3. El modelo deja preparado el crecimiento futuro a mas roles sin bloquear el MVP.

## Epica 3 - Modelo maestro y catalogos
### Historia 3.1 - Gestion de tipos de entidad
Como administrador quiero mantener tipos de entidad para clasificar reglas.

Criterios de aceptacion:
1. Existen registros base para CLIENT, PRODUCT, COMPANY, COMMERCIAL y SOCIETY.
2. Los tipos pueden activarse o desactivarse.
3. No se permiten codigos duplicados.

### Historia 3.2 - Gestion de rule sets
Como administrador quiero definir rule sets por dominio para organizar reglas por caso de uso.

Criterios de aceptacion:
1. Un rule set tiene codigo unico.
2. Puede asociarse a dominio y descripcion.
3. Puede activarse o desactivarse.

## Epica 4 - Equivalencias
### Historia 4.1 - Crear regla de equivalencia en draft
Como Data Steward quiero crear una equivalencia en borrador para proponer una homologacion.

Criterios de aceptacion:
1. La regla guarda source_key, source_value, target_value y vigencia.
2. La regla nace en estado draft.
3. Se guarda creador, fecha y comentario.

### Historia 4.2 - Editar regla no aprobada
Como Data Steward quiero editar una regla no aprobada para corregir datos antes de enviarla.

Criterios de aceptacion:
1. Se permite editar registros draft y rejected.
2. Se valida consistencia de fechas.
3. Se evita duplicidad de clave de negocio.

### Historia 4.3 - Versionar regla aprobada
Como Data Steward quiero reemplazar una regla aprobada sin perder historial.

Criterios de aceptacion:
1. No se modifica destructivamente la regla aprobada vigente.
2. El cambio crea una nueva version.
3. La version anterior puede cerrarse con valid_to.

### Historia 4.4 - Desactivar regla
Como Administrador quiero inactivar una regla para que deje de consumirse.

Criterios de aceptacion:
1. La desactivacion no elimina el historico.
2. Una regla inactiva no aparece en vistas activas.
3. La accion queda auditada.

## Epica 5 - Agrupaciones
### Historia 5.1 - Crear agrupacion
Como Data Steward quiero definir agrupaciones para reporting y consolidacion.

Criterios de aceptacion:
1. La regla guarda member_value, group_value y vigencia.
2. La regla puede enviarse a aprobacion.
3. Se aplican validaciones equivalentes a las de mapping.

### Historia 5.2 - Consultar agrupaciones activas
Como usuario tecnico quiero consultar agrupaciones vigentes para usarlas en procesos.

Criterios de aceptacion:
1. Existe vista SQL activa de agrupaciones.
2. Solo devuelve registros approved, activos y vigentes.
3. La consulta responde con indices adecuados.

## Epica 6 - Parametros
### Historia 6.1 - Crear parametro de negocio
Como Data Steward quiero registrar un parametro de negocio para que pueda ser consumido sin hardcode.

Criterios de aceptacion:
1. El parametro guarda clave, valor, tipo de dato y alcance funcional minimo.
2. Tiene vigencia y estado.
3. Se auditan altas y cambios.

### Historia 6.3 - Asociar parametro a un cliente u otro alcance simple
Como administrador quiero registrar parametros asociados a un cliente para soportar factores comerciales del demo.

Criterios de aceptacion:
1. El parametro soporta `parameter_scope_type`.
2. El parametro soporta `parameter_scope_value`.
3. El Excel demo `mdm_parametros_pvp` puede importarse sin perder semantica.

### Historia 6.2 - Validar tipo de dato de parametro
Como sistema quiero validar el tipo de dato para evitar parametros inconsistentes.

Criterios de aceptacion:
1. Numeric solo acepta valores numericos.
2. Boolean solo acepta valores booleanos.
3. Json solo acepta contenido valido.

## Epica 7 - Workflow de aprobacion
### Historia 7.1 - Enviar a aprobacion
Como Data Steward quiero enviar una regla a aprobacion para que un administrador la revise.

Criterios de aceptacion:
1. Solo registros en draft pueden pasar a pending_approval.
2. La transicion queda auditada.
3. El registro ya no puede editarse libremente salvo devolucion o rechazo.

### Historia 7.2 - Aprobar regla
Como Administrador quiero aprobar una regla para que quede disponible para consumo tecnico.

Criterios de aceptacion:
1. Solo registros pending_approval pueden aprobarse.
2. El estado pasa a approved.
3. El registro aparece en la vista activa si esta vigente y activo.

### Historia 7.3 - Rechazar regla
Como Administrador quiero rechazar una regla indicando motivo para devolverla a correccion.

Criterios de aceptacion:
1. El rechazo requiere comentario.
2. El estado pasa a rejected.
3. El rechazo queda auditado.

## Epica 8 - Auditoria
### Historia 8.1 - Registrar cambios
Como auditor funcional quiero disponer de historial de cambios por registro para poder trazar decisiones.

Criterios de aceptacion:
1. Se registra accion, usuario, fecha, valor previo y valor nuevo.
2. Se registra estado de aprobacion asociado cuando aplique.
3. El historial puede consultarse por entidad y por fecha.

### Historia 8.2 - Consultar auditoria
Como Administrador quiero filtrar auditoria para revisar cambios recientes o conflictivos.

Criterios de aceptacion:
1. Se puede filtrar por tabla, usuario, fecha y accion.
2. Se puede navegar desde un registro al historial asociado.
3. La respuesta es paginada.

## Epica 9 - Consumo tecnico
### Historia 9.1 - Exponer vista activa de equivalencias
Como usuario tecnico quiero leer equivalencias activas sin implementar logica de estado ni vigencia.

Criterios de aceptacion:
1. Existe vw_mdm_mapping_rule_active.
2. Filtra approved, activo y vigente.
3. Expone columnas necesarias para joins operativos.

### Historia 9.2 - Exponer vista activa de parametros
Como usuario tecnico quiero leer parametros activos para procesos o modelos.

Criterios de aceptacion:
1. Existe vw_mdm_parameter_active.
2. Devuelve solo valores vigentes.
3. Es consumible por clientes PostgreSQL estandar.

## Epica 10 - UX administrativa
### Historia 10.1 - Dashboard operativo
Como usuario interno quiero una vista inicial con indicadores para priorizar trabajo.

Criterios de aceptacion:
1. Muestra reglas activas.
2. Muestra pendientes de aprobacion.
3. Muestra cambios recientes y vencimientos proximos.

### Historia 10.2 - Listados y filtros
Como usuario quiero filtrar reglas para encontrar rapidamente un registro.

Criterios de aceptacion:
1. Existen filtros por dominio, entidad, estado y vigencia.
2. Existe busqueda por valores clave.
3. Los listados tienen paginacion.

### Historia 10.3 - Edicion ligera por tabla y formulario
Como administrador quiero una experiencia simple de tabla + formulario para operar sin construir un ABM pesado.

Criterios de aceptacion:
1. Cada modulo tiene un listado principal.
2. Crear o editar abre un formulario simple.
3. No se requiere interfaz compleja ni configurador avanzado.

## Epica 11 - Importacion y datos iniciales
### Historia 11.1 - Importar archivo CSV o XLSX
Como administrador quiero cargar reglas desde un archivo para acelerar el alta inicial.

Criterios de aceptacion:
1. La app acepta `csv` y `xlsx`.
2. La importacion detecta columnas requeridas.
3. La app muestra previsualizacion y errores basicos antes de confirmar.
4. La importacion registra lote y resultado.

### Historia 11.2 - Alta manual simple
Como administrador quiero poder cargar o corregir registros manualmente desde formulario.

Criterios de aceptacion:
1. Se puede crear un registro sin archivo.
2. Se puede corregir un registro importado.
3. Toda accion queda auditada.

## Epica 12 - Datos iniciales y validacion
### Historia 12.1 - Cargar semillas de catalogos
Como equipo tecnico quiero contar con datos semilla para probar el MVP desde el inicio.

Criterios de aceptacion:
1. Existen semillas de roles.
2. Existen semillas de entity types.
3. Existen semillas de rule sets del dominio Ventas-Perseida.

### Historia 12.2 - Validar casos reales
Como sponsor funcional quiero validar el MVP con casos representativos del dominio para confirmar utilidad.

Criterios de aceptacion:
1. Se prueban homologaciones de clientes.
2. Se prueban agrupaciones comerciales.
3. Se prueban parametros o factores comerciales.

## Dependencias principales
1. Seguridad depende de fundacion tecnica.
2. CRUD de reglas depende de modelo de datos.
3. Workflow depende de seguridad y CRUD.
4. Vistas activas dependen de modelo de datos cerrado.
5. Importacion depende de modelo de datos y validaciones basicas.
6. Validacion funcional depende de semillas, importacion y UI minima.

## Consideracion futura fuera de MVP
El backlog del MVP no incluye integracion LLM, pero la primera version debe dejar listos contratos de lectura suficientemente limpios para una futura exposicion por SQL, API o MCP. Cualquier accion futura asistida por LLM debera quedar auditada y, preferiblemente, pasar por aprobacion humana.

## Definition of Done del MVP
1. Usuarios autenticados pueden operar segun rol.
2. Se pueden crear, editar, aprobar y rechazar reglas.
3. Todo cambio queda auditado.
4. Existen vistas SQL activas para equivalencias, agrupaciones y parametros.
5. El despliegue puede ejecutarse con PostgreSQL estandar sin lock-in critico.
6. El sistema puede operar de punta a punta con un unico usuario administrador inicial.
