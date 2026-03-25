# Release Notes v0.1 - MDM Lite

## Resumen ejecutivo
MDM Lite v0.1 cierra un MVP operativo para administrar reglas maestras simples sin hardcode en procesos de integracion. La version permite cargar, editar, consultar y explicar equivalencias, agrupaciones y parametros, con un contrato tecnico claro para consumo desde SQL, Python o dbt.

## Que resuelve esta version
1. Evita que reglas de negocio variables queden embebidas en ETL, scripts o modelos analiticos.
2. Centraliza homologaciones, agrupaciones y parametros con vigencia.
3. Permite operar el demo sin depender de desarrollos adicionales de backend o UI pesada.
4. Deja una base clara para crecimiento posterior sin abrir mas alcance en este release.

## Capacidades entregadas
1. Alta manual simple de equivalencias, agrupaciones y parametros.
2. Edicion manual simple desde cada vista operativa.
3. Importacion demo y carga por archivo.
4. Lectura tecnica desde vistas SQL activas.
5. Healthcheck de base de datos.
6. Help funcional y tecnica dentro de la app.
7. Ejemplos de consumo desde SQL, Python y dbt.

## Modulos incluidos
1. Inicio
2. Equivalencias
3. Agrupaciones
4. Parametros
5. Importacion
6. Help
7. DB Health

## Perfil de usuario objetivo
1. Admin funcional o data steward del MVP.
2. Equipo tecnico que necesita consumir reglas desde ETL.
3. Analista o arquitecto que necesita explicar el patron de normalizacion.

## Contrato tecnico recomendado
Los procesos tecnicos deben consumir estas vistas:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

## Estado del release
La v0.1 queda lista para demo funcional y tecnica.

## Demo sugerida
1. Mostrar Help para explicar el problema que resuelve MDM Lite.
2. Mostrar Equivalencias, Agrupaciones y Parametros con datos reales.
3. Crear o editar un registro manualmente.
4. Mostrar Importacion demo.
5. Cerrar con un ejemplo de consumo SQL, Python o dbt.

## Fuera de alcance en esta version
1. Workflow formal de aprobacion.
2. Multiusuario real y roles avanzados.
3. API publica autenticada.
4. MCP.
5. Multiempresa.
6. Auditoria avanzada visible por pantalla.

## Mensaje de cierre
MDM Lite v0.1 no busca resolver toda la gobernanza maestra. Busca demostrar, con una implementacion real y explicable, que las reglas de normalizacion pueden salir del codigo y pasar a una capa administrable, consultable y util para cargas tecnicas.