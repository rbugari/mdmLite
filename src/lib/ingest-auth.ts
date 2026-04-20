import { env } from "@/lib/env";

/**
 * Validates the ingest API key from the Authorization header.
 * External pipelines must send: Authorization: Bearer <INGEST_API_KEY>
 *
 * Returns the resolved source system label (from X-Source-System header if present)
 * or null if auth fails.
 */
export function validateIngestKey(request: Request): { ok: true; sourceSystem: string } | { ok: false; status: 401 | 503 } {
  if (!env.INGEST_API_KEY) {
    return { ok: false, status: 503 };
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const providedKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!providedKey || providedKey !== env.INGEST_API_KEY) {
    return { ok: false, status: 401 };
  }

  const sourceSystem = request.headers.get("X-Source-System")?.trim().slice(0, 100) ?? "external-pipeline";

  return { ok: true, sourceSystem };
}
