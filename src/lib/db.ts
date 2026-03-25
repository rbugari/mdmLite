import { Pool, type QueryResultRow } from "pg";

import { env } from "@/lib/env";

declare global {
  var __mdmPool: Pool | undefined;
}

export function getDatabaseUrl(): string {
  return env.DATABASE_URL;
}

export function getPool(): Pool {
  if (!global.__mdmPool) {
    global.__mdmPool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
    });
  }

  return global.__mdmPool;
}

export async function query<T extends QueryResultRow>(text: string, values?: unknown[]) {
  return getPool().query<T>(text, values);
}

export async function checkDatabaseHealth() {
  const startedAt = Date.now();
  const result = await query<{ now: string }>("select now()::text as now");

  return {
    ok: true,
    latencyMs: Date.now() - startedAt,
    serverTime: result.rows[0]?.now ?? null,
  };
}
