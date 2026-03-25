# Scripts

## Archivos
- `start-all.bat`: valida puertos, cierra procesos que esten ocupando los puertos requeridos y abre servicios habilitados en ventanas CMD separadas.
- `run-next.mjs`: ejecuta Next.js leyendo el puerto desde `.env`.

## Servicios actuales
1. Web app en `APP_PORT`.
2. MCP futuro en `MCP_PORT`.
3. Worker futuro en `WORKER_PORT`.

## Nota
La base de datos es remota y no se arranca desde el launcher.
