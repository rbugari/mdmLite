# Client Asset Pack (ENTITY = CLIENT)

Este paquete cubre los casos de uso principales que hoy soporta MDM Lite para la entidad CLIENT.

## Objetivo

Tener un set de datos y validaciones repetibles para:

1. explicar el producto en demos y capacitaciones
2. validar regresiones funcionales
3. mostrar combinaciones reales de operacion manual y carga por archivo

## Matriz de casos cubierta por el runner

1. create + approve (mapping/group/parameter)
2. non-destructive replacement + approve (mapping/group/parameter)
3. reject de pending (mapping/group/parameter)
4. inactivate de approved (mapping/group/parameter)
5. valid_from futuro aprobado no visible en active view (mapping/group/parameter)
6. import preview valido + confirm + token one-time (mappings/groups/parameters)
7. import preview invalido (missing_required + duplicate_in_file) (mappings/groups/parameters)

## Archivos de import incluidos

1. mappings_valid.csv
2. mappings_invalid.csv
3. groups_valid.csv
4. groups_invalid.csv
5. parameters_valid.csv
6. parameters_invalid.csv

## Ejecucion

Comando recomendado:

npm run e2e:client-asset

Requisitos:

1. app corriendo (ejemplo: npm run dev)
2. APP_ADMIN_EMAIL y APP_ADMIN_PASSWORD en .env

## Limpieza

El runner limpia automaticamente los registros de prueba con prefijo CAS_.
