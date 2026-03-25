# Arquitectura MVP - MDM Lite

## Objetivo
Definir una arquitectura tecnica minima, portable y desplegable rapido para el MVP de MDM Lite.

## Principios
1. PostgreSQL estandar como contrato de persistencia.
2. Logica de negocio en la aplicacion, no en servicios propietarios.
3. Despliegue simple en pocas piezas.
4. Separacion clara entre administracion y consumo tecnico.
5. Historial y trazabilidad desde el primer release.
6. Entrada de datos combinando importacion y mantenimiento manual simple.
7. Preparar contratos de lectura reutilizables por futuros consumidores LLM.

## Stack recomendado
### Opcion base
1. Next.js con TypeScript para UI y backend.
2. PostgreSQL estandar como base de datos.
3. ORM o query builder portable. Recomendacion: Prisma o Drizzle.
4. Autenticacion local simple en la aplicacion para el MVP.
5. Vercel para despliegue de la app y Supabase para PostgreSQL.

### Opcion alternativa
1. Next.js con TypeScript.
2. PostgreSQL en Railway.
3. Despliegue de app en Railway.

## Razon de la recomendacion
1. Una sola codebase reduce coste de arranque.
2. Next.js permite UI y API sin separar repositorios.
3. PostgreSQL estandar mantiene portabilidad.
4. El consumo tecnico por vistas SQL evita acoplar pipelines a la API.

## Contexto de alto nivel
1. Usuarios internos usan la web administrativa.
2. La web consume endpoints internos del backend.
3. El backend persiste reglas, workflow y auditoria en PostgreSQL.
4. Los consumidores tecnicos leen vistas SQL activas.
5. En el futuro, un LLM podra consultar el conocimiento MDM a traves de SQL, API o MCP sobre contratos controlados.

## Componentes
### 1. Frontend administrativo
Responsabilidades:
1. Dashboard operativo.
2. Listados, filtros y formularios.
3. Bandeja de aprobaciones.
4. Consulta de auditoria.
5. Importacion de archivos y previsualizacion.

Modulos sugeridos:
1. app/(private)/dashboard
2. app/(private)/mappings
3. app/(private)/groups
4. app/(private)/parameters
5. app/(private)/approvals
6. app/(private)/audit
7. app/(private)/imports

### 2. Backend de aplicacion
Responsabilidades:
1. CRUD de reglas.
2. Validacion de negocio.
3. Transiciones de estado.
4. Control de permisos.
5. Escritura de auditoria.
6. Procesamiento de importaciones `csv/xlsx`.

Capas sugeridas:
1. Route handlers o API routes.
2. Services de dominio.
3. Repositories o data access.
4. Validadores de entrada.

### 3. Base de datos PostgreSQL
Responsabilidades:
1. Persistencia de entidades maestras.
2. Integridad referencial.
3. Vistas activas para consumo tecnico.
4. Indices para consultas operativas.
5. Trazabilidad de lotes de importacion.

Objetos base:
1. Tablas maestras.
2. Tablas operativas.
3. Vistas SQL activas.
4. Indices.
5. Constraints.
6. Tablas de batch de importacion.

## Limites de responsabilidad
### La app administra
1. Altas y cambios.
2. Aprobacion y rechazo.
3. Auditoria funcional.
4. Seguridad por rol.

### La base garantiza
1. Integridad referencial.
2. Persistencia.
3. Restricciones basicas.
4. Rendimiento de lectura.

### Los procesos tecnicos consumen
1. Vistas activas.
2. Tablas maestras si hace falta soporte interno.
3. Conexion PostgreSQL estandar.

### Los futuros consumidores LLM deberian consumir
1. Vistas activas o vistas derivadas de lectura.
2. API de consulta estable, si se incorpora.
3. Servidor MCP basado en contratos existentes, no en queries libres a cualquier tabla.

## Preparacion futura para LLM, API y MCP
### Objetivo
Permitir que el conocimiento MDM pueda ser consultado y, en una fase posterior, utilizado por un LLM de forma segura, trazable y desacoplada.

### Recomendaciones de diseño desde ahora
1. Mantener nombres de tablas y vistas semanticos y estables.
2. Evitar esconder reglas criticas dentro de codigo no visible para consumidores externos.
3. Exponer primero lectura controlada; no habilitar escritura automatica por LLM en el MVP.
4. Preparar la auditoria para distinguir entre actor humano y actor de sistema.
5. Diseñar una futura capa API o MCP como adaptador sobre servicios ya existentes.

### Modalidades futuras posibles
1. SQL de solo lectura contra vistas activas.
2. API REST o GraphQL de consulta.
3. Servidor MCP para herramientas asistidas por LLM.

### Orden recomendado de evolucion
1. MVP con vistas SQL y operativa humana.
2. API de consulta estable.
3. Integracion LLM de lectura.
4. Acciones asistidas por LLM con aprobacion humana y auditoria reforzada.

## Modelo de despliegue recomendado
### Opcion A - Rapida para MVP
1. App: Vercel.
2. DB: Supabase PostgreSQL.
3. Variables en entorno gestionado.

Ventajas:
1. Arranque rapido.
2. Baja friccion operativa.
3. Buen fit para Next.js.

Riesgos:
1. Dos piezas operativas.
2. Hay que disciplinar el uso de features propietarias.

### Opcion B - Una plataforma mas compacta
1. App: Railway.
2. DB: Railway PostgreSQL o PostgreSQL externo.

Ventajas:
1. Menos dispersion operativa.
2. Flujo de despliegue sencillo.

Riesgos:
1. Menor comodidad si luego la app vive mejor en Vercel.
2. Requiere vigilar costes y limites igual que en cualquier managed service.

## Seguridad recomendada
1. Autenticacion en la aplicacion.
2. MVP monoempresa con un unico usuario administrador inicial.
3. Roles guardados en tablas propias para evolucion futura, aunque inicialmente solo se use ADMIN.
4. Autorizacion en backend por endpoint y accion.
5. No usar RLS como pilar central del MVP.
6. Registrar actor de cada cambio.

## Modelo de permisos inicial
### Administrador
1. CRUD completo.
2. Aprobar y rechazar.
3. Ver auditoria completa.

Los perfiles Data Steward y Solo Lectura quedan diferidos a una fase posterior. El modelo se conserva extensible, pero no forman parte del primer corte operativo.

## Flujo de datos
### Escritura administrativa
1. Usuario abre formulario.
2. Frontend valida campos basicos.
3. Backend valida reglas de dominio.
4. Backend persiste en PostgreSQL.
5. Backend registra auditoria.

### Aprobacion
1. Data Steward envia a aprobacion.
2. Administrador revisa.
3. Backend cambia estado.
4. La regla pasa a consumo activo si cumple vigencia y activo.

### Lectura tecnica
1. dbt o pipeline consulta vista activa.
2. La vista filtra por estado, activo y vigencia.
3. El consumidor no replica logica funcional.

## Estructura de codigo sugerida
1. src/app
2. src/components
3. src/features/mappings
4. src/features/groups
5. src/features/parameters
6. src/features/approvals
7. src/features/audit
8. src/features/imports
9. src/lib/auth
10. src/lib/db
11. src/lib/validation
12. src/lib/permissions
13. src/lib/imports

## Riesgos principales
1. Definir tarde las claves de negocio puede romper migraciones tempranas.
2. Mezclar seguridad de aplicacion con seguridad del proveedor genera lock-in.
3. Permitir edicion destructiva de reglas aprobadas debilita auditoria.
4. No cerrar criterios de vigencia produce conflictos en consumo tecnico.
5. Dejar importacion masiva fuera del diseno puede retrasar adopcion.
6. Operar con un unico administrador elimina segregacion de funciones en el MVP.
7. Exponer la base completa a un LLM sin contratos ni permisos claros seria un riesgo funcional y de gobierno.

## Decisiones tecnicas pendientes
1. Elegir ORM o query builder.
2. Definir si el login local sera email + password o acceso interno aun mas simple.
3. Confirmar hosting final del MVP.
4. Confirmar si habra importacion CSV en primera entrega.
5. Confirmar si se modelan claves compuestas desde el inicio.
