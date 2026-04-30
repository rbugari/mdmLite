# Instalacion Paso A Paso En Windows

Este instructivo es para el usuario operador que recibe el paquete de MDM Lite en Windows.

## 1. Que vas a recibir

Debes recibir:

1. el archivo `mdm-lite-windows-trial.zip`
2. los datos de conexion a PostgreSQL
3. el usuario y password administrador que quieras configurar

## 2. Requisitos previos

Antes de instalar, confirma esto:

1. Windows 10 o superior
2. Node.js 22 LTS instalado
3. acceso de red al servidor PostgreSQL
4. una base PostgreSQL ya creada para la aplicacion
5. un usuario PostgreSQL con permisos sobre esa base

Para validar Node.js:

1. abre `cmd`
2. ejecuta `node -v`
3. si no responde con una version, instala Node.js 22 LTS y vuelve a probar

## 3. Descomprimir el paquete

1. copia `mdm-lite-windows-trial.zip` a una carpeta local, por ejemplo `C:\apps\mdm-lite`
2. haz clic derecho
3. elige `Extraer todo`
4. abre la carpeta descomprimida `mdm-lite-trial`

## 4. Ejecutar la instalacion inicial

1. entra a la carpeta `scripts\windows`
2. ejecuta `install-and-start.bat`
3. si Windows pregunta permisos, acepta

Ese script hace todo el flujo inicial:

1. crear o reparar `.env`
2. instalar dependencias
3. verificar conectividad PostgreSQL
4. aplicar esquema en PostgreSQL
5. compilar la app
6. arrancar el servidor

## 5. Datos que te pedira el configurador

Ten a mano estos valores:

1. `DATABASE_URL`
2. `DATABASE_SSL_MODE`
3. `APP_ADMIN_USERNAME`
4. `APP_ADMIN_EMAIL`
5. `APP_ADMIN_PASSWORD`
6. `APP_AUTH_SECRET`
7. `APP_PORT`

Ejemplo de `DATABASE_URL`:

```text
postgresql://usuario:password@servidor:5432/mdm_lite?sslmode=verify-full
```

Valores recomendados:

1. `APP_PORT=3003`
2. `DATABASE_SSL_MODE=require` para PostgreSQL gestionado con certificado valido
3. `DATABASE_SSL_MODE=disable` solo en entornos controlados sin SSL

## 6. Como abrir la aplicacion

Cuando el script termine, abre en el navegador:

```text
http://127.0.0.1:3003
```

Si configuraste otro puerto, usa ese valor.

Luego inicia sesion con:

1. `APP_ADMIN_USERNAME`
2. `APP_ADMIN_PASSWORD`

## 6.1 Validacion recomendada de PostgreSQL antes de instalar por fases

Si quieres validar primero la conexion a la base antes del build, ejecuta:

```bat
scripts\windows\check-db-connection.bat
```

Debe devolver un JSON con:

1. `ok: true`
2. `databaseHost`
3. `databasePort`
4. `databaseName`
5. `databaseUser`
6. `databaseSslMode`

Si este chequeo falla, corrige `.env` antes de seguir.

## 7. Validacion rapida

Con la app corriendo, ejecuta:

```bat
scripts\windows\smoke-test.bat
```

Debe validar:

1. que la home responde
2. que `/api/health/db` devuelve `ok: true`

## 8. Problemas comunes

### Node.js no encontrado

Instala Node.js 22 LTS y vuelve a correr `install-and-start.bat`.

### Error de conexion a PostgreSQL

Revisa:

1. host
2. puerto
3. usuario
4. password
5. nombre de base
6. modo SSL

Luego vuelve a ejecutar:

```bat
scripts\windows\check-db-connection.bat
```

### Error de certificado SSL

Si aparece `self-signed certificate in certificate chain`, revisa con tu equipo tecnico si deben usar temporalmente `DATABASE_SSL_MODE=no-verify`.

### La app no abre

Revisa:

1. que el script haya terminado sin error
2. que el puerto configurado sea el correcto
3. que `scripts\windows\smoke-test.bat` responda bien

## 9. Arranques posteriores

Despues de la primera instalacion, para volver a levantar la app usa:

```bat
scripts\windows\start-production.bat
```

## 10. Que no incluye esta version

Esta entrega todavia no incluye:

1. instalador MSI
2. servicio de Windows
3. runtime Node.js embebido
4. actualizacion automatica