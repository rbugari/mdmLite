# MDM Lite Para Windows

Instalacion guiada para dejar la aplicacion funcionando en una PC Windows conectada a PostgreSQL.

## Haz solo esto

1. descomprime el paquete ZIP
2. ejecuta `scripts\windows\configure-production.bat`
3. ejecuta `scripts\windows\check-db-connection.bat`
4. ejecuta `scripts\windows\install-and-start.bat`
5. ejecuta `scripts\windows\smoke-test.bat`
6. abre `http://127.0.0.1:3003`

## Lo que necesitas antes de empezar

1. Node.js 22 LTS instalado
2. una base PostgreSQL ya creada
3. un usuario PostgreSQL con permisos
4. estos datos de conexion:
	`DATABASE_URL`
	`DATABASE_SSL_MODE`
5. un usuario y password administrador para la app

Para validar Node.js:

```bat
node -v
```

## Datos de PostgreSQL

Ejemplo de `DATABASE_URL`:

```text
postgresql://usuario:password@host:5432/mdm_lite?sslmode=verify-full
```

Uso recomendado de SSL:

1. `DATABASE_SSL_MODE=require` para PostgreSQL gestionado
2. `DATABASE_SSL_MODE=disable` solo si tu entorno no usa SSL
3. `DATABASE_SSL_MODE=no-verify` solo como excepcion temporal si el certificado no valida

## Que esperar en cada paso

`configure-production.bat`
Te pide los datos de base, usuario admin y puerto.

`check-db-connection.bat`
Debe responder con `ok: true`.

`install-and-start.bat`
Instala dependencias, valida PostgreSQL, aplica esquema, compila y arranca.

`smoke-test.bat`
Verifica que la web y la base respondan correctamente.

## Si algo falla

Repite en este orden:

1. `scripts\windows\configure-production.bat`
2. `scripts\windows\check-db-connection.bat`
3. `scripts\windows\install-and-start.bat`

Si necesitas el instructivo largo, abre `LEER-DETALLADO-INSTALACION.md`.