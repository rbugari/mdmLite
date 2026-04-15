# Scripts

## Archivos
- `start-all.bat`: valida puertos, cierra procesos que esten ocupando los puertos requeridos y abre servicios habilitados en ventanas CMD separadas.
- `run-next.mjs`: ejecuta Next.js leyendo el puerto desde `.env`.
- `e2e-nondestructive.mjs`: valida end-to-end el flujo no destructivo (create -> approve -> replace -> approve) para mappings, groups y parameters.
- `e2e-client-asset-suite.mjs`: suite completa para la entidad CLIENT (workflow + import preview/confirm + rechazo + inactivate + vigencia futura).
- `test-scanner.mjs`: escaner integral go/no-go (typecheck + e2e:nondestructive + e2e:client-asset) con reporte consolidado.

## Servicios actuales
1. Web app en `APP_PORT`.
2. MCP futuro en `MCP_PORT`.
3. Worker futuro en `WORKER_PORT`.

## Nota
La base de datos es remota y no se arranca desde el launcher.

## Validacion rapida
- `npm run e2e:nondestructive`
	Requiere la web corriendo y credenciales admin en `.env`.
- `npm run e2e:client-asset`
	Requiere la web corriendo, credenciales admin y `DATABASE_URL` en `.env`.
- `npm run test:scan`
	Requiere la web corriendo; genera reporte en `reports/test-scan-latest.json`.
