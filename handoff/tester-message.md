# Tester Message

Subject: MDM Lite trial package and first-run steps

Hi,

I am sharing the current controlled-trial package for MDM Lite.

This version is intended for a Windows-first installation with a customer-owned PostgreSQL database.

What you need before starting:

1. Windows machine with Node.js 22 LTS installed
2. PostgreSQL connection details
3. network access to the PostgreSQL host

Please use this first-run command from the project root:

```bat
scripts\windows\install-and-start.bat
```

That script will:

1. guide the runtime configuration if `.env` is missing
2. install dependencies
3. apply the database schema
4. build the production app
5. start the app

After startup, please run:

```bat
scripts\windows\smoke-test.bat
```

Then open the application in the browser:

```text
http://127.0.0.1:3003
```

Use the admin credentials defined during setup.

If you need to validate the database directly, use the guide in `docs/trial-install-access-and-db-guide.md`.

If anything fails, please send back:

1. the exact script you ran
2. the console output
3. masked `.env` values relevant to the failure
4. the result of `npm run env:check`
5. the result of `scripts\windows\smoke-test.bat`

Thanks.