# Correo De Entrega Sugerido

Asunto sugerido:

Invitacion a probar MDM Lite

Texto sugerido:

Hola,

Les compartimos MDM Lite para que puedan probarlo en Windows.

Adjunto encontrarán el paquete de instalación:

`mdm-lite-windows-trial.zip`

La idea es que puedan instalarlo de forma simple, conectarlo a su PostgreSQL y empezar a recorrer la aplicación.

Si quieren ver una referencia general del producto antes de instalarlo, aquí pueden encontrar más información:

https://over55it.com/mdm-lite.html

Para dejarlo funcionando, por favor sigan este orden:

1. descomprimir el ZIP en una carpeta local
2. abrir `LEER-PRIMERO-INSTALACION.md`
3. ejecutar `scripts\windows\configure-production.bat`
4. ejecutar `scripts\windows\check-db-connection.bat`
5. ejecutar `scripts\windows\install-and-start.bat`
6. validar con `scripts\windows\smoke-test.bat`

Datos que deben tener preparados antes de empezar:

1. Node.js 22 LTS instalado en la PC
2. acceso a PostgreSQL
3. `DATABASE_URL`
4. `DATABASE_SSL_MODE`
5. usuario y password administrador de la app

Si durante la instalación aparece algún problema, nos pueden compartir:

1. el paso exacto que fallo
2. captura o texto completo de la consola
3. resultado de `scripts\windows\check-db-connection.bat`

Esperamos que les sirva y que puedan probar MDM Lite sin fricción.

Quedo atento a cualquier consulta o comentario.