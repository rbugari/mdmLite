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
    autoPromoted?: number;
    duplicates?: number;
    rejected?: number;
    batchId?: string;
    autoPromoteDeferred?: Array<{
      index: number;
      candidateId: string;
      reason: string;
    }>;
  } | null;
  comments: string | null;
  changed_at: string;
};

type BatchTypeCountRow = {
  candidate_type: string;
  count: string;
};

type BatchConfidenceRow = {
  avg_confidence: string | null;
  min_confidence: string | null;
  max_confidence: string | null;
};

type BatchConflictRow = {
  id: string;
  candidate_type: string;
  payload: Record<string, unknown>;
  conflict_record_id: string;
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

  const [statusResult, auditResult, typeResult, confidenceResult, conflictResult] = await Promise.all([
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
    query<BatchTypeCountRow>(
      `select candidate_type, count(*)::text as count
       from mdm_candidate
       where extraction_batch_id = $1
       group by candidate_type`,
      [batchId],
    ),
    query<BatchConfidenceRow>(
      `select
         avg(confidence)::text as avg_confidence,
         min(confidence)::text as min_confidence,
         max(confidence)::text as max_confidence
       from mdm_candidate
       where extraction_batch_id = $1
         and confidence is not null`,
      [batchId],
    ),
    query<BatchConflictRow>(
      `select
         c.id::text as id,
         c.candidate_type,
         c.payload,
         coalesce(
           case
             when c.candidate_type = 'mapping' then (
               select vm.id::text
               from vw_mdm_mapping_rule_active vm
               where vm.rule_set_code = coalesce(nullif(c.payload->>'ruleSetCode', ''), 'ventas_perseida_clientes')
                 and vm.entity_type_code = coalesce(nullif(c.payload->>'entityTypeCode', ''), 'CLIENT')
                 and vm.source_key = coalesce(nullif(c.payload->>'sourceKey', ''), 'extracted')
                 and vm.source_value = coalesce(c.payload->>'sourceValue', '')
                 and vm.target_value = coalesce(c.payload->>'targetValue', '')
               limit 1
             )
             when c.candidate_type = 'group' then (
               select vg.id::text
               from vw_mdm_group_rule_active vg
               where vg.rule_set_code = coalesce(nullif(c.payload->>'ruleSetCode', ''), 'ventas_perseida_clientes')
                 and vg.entity_type_code = coalesce(nullif(c.payload->>'entityTypeCode', ''), 'CLIENT')
                 and vg.member_value = coalesce(c.payload->>'memberValue', '')
                 and vg.group_value = coalesce(c.payload->>'groupValue', '')
               limit 1
             )
             when c.candidate_type = 'parameter' then (
               select vp.id::text
               from vw_mdm_parameter_active vp
               where vp.parameter_key = coalesce(nullif(c.payload->>'parameterKey', ''), 'extracted_param')
                 and vp.parameter_value = coalesce(c.payload->>'parameterValue', '')
                 and vp.domain = coalesce(nullif(c.payload->>'domain', ''), 'ventas_perseida')
                 and coalesce(vp.parameter_scope_type, '') = coalesce(c.payload->>'parameterScopeType', '')
                 and coalesce(vp.parameter_scope_value, '') = coalesce(c.payload->>'parameterScopeValue', '')
               limit 1
             )
             else null
           end,
           ''
         ) as conflict_record_id
       from mdm_candidate c
       where c.extraction_batch_id = $1
         and c.status = 'pending'
         and c.candidate_type in ('mapping', 'group', 'parameter')`,
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
  const typeCounts = {
    mapping: 0,
    group: 0,
    parameter: 0,
    unknown: 0,
  };
  for (const row of typeResult.rows) {
    if (row.candidate_type === "mapping" || row.candidate_type === "group" || row.candidate_type === "parameter" || row.candidate_type === "unknown") {
      typeCounts[row.candidate_type] = Number(row.count);
    }
  }

  const confidence = confidenceResult.rows[0] ?? {
    avg_confidence: null,
    min_confidence: null,
    max_confidence: null,
  };
  const reviewedCount = counts.promoted + counts.rejected;
  const elapsedMs = firstCreatedAt ? Math.max(Date.now() - new Date(firstCreatedAt).getTime(), 1) : 1;
  const reviewThroughputPerHour = Number(((reviewedCount * 3600000) / elapsedMs).toFixed(2));
  const deferredReasons = auditMeta?.autoPromoteDeferred ?? [];
  const conflictItems = conflictResult.rows
    .filter((row) => row.conflict_record_id)
    .map((row) => ({
      candidateId: row.id,
      candidateType: row.candidate_type,
      conflictRecordId: row.conflict_record_id,
      summary:
        row.candidate_type === "mapping"
          ? `${String(row.payload.sourceValue ?? "?")} -> ${String(row.payload.targetValue ?? "?")}`
          : row.candidate_type === "group"
            ? `${String(row.payload.memberValue ?? "?")} -> ${String(row.payload.groupValue ?? "?")}`
            : `${String(row.payload.parameterKey ?? "?")} = ${String(row.payload.parameterValue ?? "?")}`,
    }));

  return NextResponse.json({
    ok: true,
    batchId,
    sourceKind: auditMeta?.sourceKind ?? sourceKind,
    sourceName: auditMeta?.sourceName ?? sourceName,
    sourceSystem: auditMeta?.sourceSystem ?? (auth.mode === "ingest" ? auth.sourceSystem : null),
    accepted: Number(auditMeta?.accepted ?? counts.pending + counts.promoted + counts.rejected),
    autoPromoted: Number(auditMeta?.autoPromoted ?? 0),
    duplicates: Number(auditMeta?.duplicates ?? 0),
    rejectedOnIngest: Number(auditMeta?.rejected ?? 0),
    counts,
    totalStored: counts.pending + counts.promoted + counts.rejected,
    createdAt: firstCreatedAt ?? audit?.changed_at ?? null,
    lastAuditAt: audit?.changed_at ?? null,
    auditComment: audit?.comments ?? null,
    analytics: {
      reviewCompletionRate: Number((((reviewedCount / Math.max(counts.pending + reviewedCount, 1)) * 100)).toFixed(1)),
      manualPromoted: Math.max(counts.promoted - Number(auditMeta?.autoPromoted ?? 0), 0),
      reviewThroughputPerHour,
      typeCounts,
      confidence: {
        average: confidence.avg_confidence ? Number(Number(confidence.avg_confidence).toFixed(3)) : null,
        min: confidence.min_confidence ? Number(Number(confidence.min_confidence).toFixed(3)) : null,
        max: confidence.max_confidence ? Number(Number(confidence.max_confidence).toFixed(3)) : null,
      },
      conflictCount: conflictItems.length,
      conflictItems: conflictItems.slice(0, 5),
      autoPromoteDeferredCount: deferredReasons.length,
      autoPromoteDeferred: deferredReasons.slice(0, 5),
    },
  });
}
