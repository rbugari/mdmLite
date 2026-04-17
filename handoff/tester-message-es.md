# Mensaje Para Tester

Asunto: Paquete de prueba MDM Lite y pasos de primera ejecución

Hola,

Te comparto el paquete actual de trial controlado de MDM Lite.

Esta versión está pensada para una instalación Windows con PostgreSQL provisto por el cliente o por el entorno de prueba.

Antes de empezar necesitás:

1. una máquina Windows con Node.js 22 LTS instalado
2. los datos de conexión a PostgreSQL
3. acceso de red al host de PostgreSQL

Desde la raíz del proyecto ejecutá:

```bat
scripts\windows\install-and-start.bat
```

Ese script:

1. guía la configuración si falta `.env`
2. instala dependencias
3. aplica el esquema en la base
4. genera el build productivo
5. arranca la aplicación

Después ejecutá:

```bat
scripts\windows\smoke-test.bat
```

Luego abrí en navegador:

```text
http://127.0.0.1:3003
```

E ingresá con las credenciales de admin definidas durante la configuración.

Si algo falla, por favor mandame:

1. el script exacto que corriste
2. la salida de consola completa
3. los valores relevantes de `.env` con secretos tapados
4. el resultado de `npm run env:check`
5. el resultado de `scripts\windows\smoke-test.bat`

Si necesitás validar la base directamente, usá `docs/trial-install-access-and-db-guide.md`.