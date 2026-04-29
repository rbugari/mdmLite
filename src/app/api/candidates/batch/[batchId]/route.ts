import { NextResponse } from "next/server";

import { getAdminIdentity } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { validateIngestKey } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

type BatchStatusRow = {
  status: string;
  count: string;
  source_kind: string | null;
  source_document_name: string | null;
  created_at: string;
};

type BatchAuditRow = {
  new_value_json: {
    sourceKind?: string;
    sourceName?: string;
    sourceSystem?: string;
    accepted?: number;
    duplicates?: number;
    rejected?: number;
    batchId?: string;
  } | null;
  comments: string | null;
  changed_at: string;
};

async function canReadBatch(request: Request) {
  const identity = await getAdminIdentity();
  if (identity) {
    return { ok: true as const, mode: "admin" as const };
  }

  const ingest = validateIngestKey(request);
  if (ingest.ok) {
    return { ok: true as const, mode: "ingest" as const, sourceSystem: ingest.sourceSystem };
  }

  return { ok: false as const, status: ingest.status };
}

export async function GET(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const auth = await canReadBatch(request);
  if (!auth.ok) {
    if (auth.status === 503) {
      return NextResponse.json(
        { ok: false, error: "External ingest is not enabled. Set INGEST_API_KEY in .env to activate this endpoint." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { batchId } = await params;

  const [statusResult, auditResult] = await Promise.all([
    query<BatchStatusRow>(
      `select
         status,
         count(*)::text as count,
         min(source_kind)::text as source_kind,
         min(source_document_name)::text as source_document_name,
         min(created_at)::text as created_at
       from mdm_candidate
       where extraction_batch_id = $1
       group by status`,
      [batchId],
    ),
    query<BatchAuditRow>(
      `select new_value_json, comments, changed_at::text
       from mdm_change_log
       where table_name = 'mdm_candidate'
         and action_type = 'extract'
         and record_id = $1
       order by changed_at desc
       limit 1`,
      [batchId],
    ),
  ]);

  if (!auditResult.rows[0] && statusResult.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Batch not found." }, { status: 404 });
  }

  const counts = {
    pending: 0,
    promoted: 0,
    rejected: 0,
  };

  let sourceKind: string | null = null;
  let sourceName: string | null = null;
  let firstCreatedAt: string | null = null;

  for (const row of statusResult.rows) {
    if (row.status === "pending" || row.status === "promoted" || row.status === "rejected") {
      counts[row.status] = Number(row.count);
    }
    sourceKind ??= row.source_kind;
    sourceName ??= row.source_document_name;
    firstCreatedAt ??= row.created_at;
  }

  const audit = auditResult.rows[0];
  const auditMeta = audit?.new_value_json ?? null;

  return NextResponse.json({
    ok: true,
    batchId,
    sourceKind: auditMeta?.sourceKind ?? sourceKind,
    sourceName: auditMeta?.sourceName ?? sourceName,
    sourceSystem: auditMeta?.sourceSystem ?? (auth.mode === "ingest" ? auth.sourceSystem : null),
    accepted: Number(auditMeta?.accepted ?? counts.pending + counts.promoted + counts.rejected),
    duplicates: Number(auditMeta?.duplicates ?? 0),
    rejectedOnIngest: Number(auditMeta?.rejected ?? 0),
    counts,
    totalStored: counts.pending + counts.promoted + counts.rejected,
    createdAt: firstCreatedAt ?? audit?.changed_at ?? null,
    lastAuditAt: audit?.changed_at ?? null,
    auditComment: audit?.comments ?? null,
  });
}
