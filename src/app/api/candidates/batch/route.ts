import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeCandidatePayload, PromotionConflictError, promoteCandidateRecord } from "@/lib/candidate-promotion";
import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { createId } from "@/lib/ids";
import { validateIngestKey } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

const VALID_SOURCE_KINDS = [
  "document",
  "external",
  "manual",
  "legacy2lake",
  "sql",
  "notebook",
  "orchestration",
] as const;

const VALID_CANDIDATE_TYPES = ["mapping", "group", "parameter", "unknown"] as const;

const candidateSchema = z.object({
  candidateType: z.enum(VALID_CANDIDATE_TYPES),
  payload: z.record(z.unknown()),
  evidence: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  needsHumanReview: z.boolean().default(true),
  sourceDocumentName: z.string().max(500).optional(),
});

const batchBodySchema = z.object({
  sourceKind: z.enum(VALID_SOURCE_KINDS),
  sourceName: z.string().min(1).max(500).default("external-batch"),
  candidates: z
    .array(candidateSchema)
    .min(1, "At least one candidate is required.")
    .max(500, "Maximum 500 candidates per batch."),
});

type BatchHistoryRow = {
  batch_id: string;
  source_kind: string | null;
  source_name: string | null;
  source_system: string | null;
  accepted: number | null;
  auto_promoted: number | null;
  duplicates: number | null;
  rejected_on_ingest: number | null;
  pending_count: string;
  promoted_count: string;
  rejected_count: string;
  first_created_at: string;
  last_reviewed_at: string | null;
};

export async function GET(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const sourceKind = searchParams.get("sourceKind")?.trim() ?? "";
  const reviewState = searchParams.get("reviewState")?.trim() ?? "all";
  const parsedLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;

  const values: unknown[] = [];
  const whereClauses: string[] = [];

  if (sourceKind) {
    values.push(sourceKind);
    whereClauses.push(`coalesce(a.source_kind, c.source_kind) = $${values.length}`);
  }

  if (reviewState === "open") {
    whereClauses.push(`c.pending_count::int > 0`);
  } else if (reviewState === "completed") {
    whereClauses.push(`c.pending_count::int = 0`);
  }

  values.push(limit);

  const result = await query<BatchHistoryRow>(
    `with candidate_counts as (
       select
         extraction_batch_id::text as batch_id,
         min(source_kind)::text as source_kind,
         min(source_document_name)::text as source_name,
         count(*) filter (where status = 'pending')::text as pending_count,
         count(*) filter (where status = 'promoted')::text as promoted_count,
         count(*) filter (where status = 'rejected')::text as rejected_count,
         min(created_at)::text as first_created_at,
         max(reviewed_at)::text as last_reviewed_at
       from mdm_candidate
       where extraction_batch_id is not null
       group by extraction_batch_id
     ), audit_extract as (
       select
         record_id::text as batch_id,
         coalesce(new_value_json->>'sourceKind', 'document') as source_kind,
         new_value_json->>'sourceName' as source_name,
         new_value_json->>'sourceSystem' as source_system,
         (new_value_json->>'accepted')::int as accepted,
         (new_value_json->>'autoPromoted')::int as auto_promoted,
         (new_value_json->>'duplicates')::int as duplicates,
         (new_value_json->>'rejected')::int as rejected_on_ingest
       from mdm_change_log
       where table_name = 'mdm_candidate'
         and action_type = 'extract'
     )
     select
       c.batch_id,
       coalesce(a.source_kind, c.source_kind) as source_kind,
       coalesce(a.source_name, c.source_name) as source_name,
       a.source_system,
       a.accepted,
       a.auto_promoted,
       a.duplicates,
       a.rejected_on_ingest,
       c.pending_count,
       c.promoted_count,
       c.rejected_count,
       c.first_created_at,
       c.last_reviewed_at
     from candidate_counts c
     left join audit_extract a on a.batch_id = c.batch_id
     ${whereClauses.length ? `where ${whereClauses.join(" and ")}` : ""}
     order by c.first_created_at desc
     limit $${values.length}`,
    values,
  );

  return NextResponse.json({
    ok: true,
    items: result.rows.map((row) => {
      const counts = {
        pending: Number(row.pending_count),
        promoted: Number(row.promoted_count),
        rejected: Number(row.rejected_count),
      };
      const totalStored = counts.pending + counts.promoted + counts.rejected;

      return {
        batchId: row.batch_id,
        sourceKind: row.source_kind,
        sourceName: row.source_name,
        sourceSystem: row.source_system,
        accepted: row.accepted ?? totalStored,
        autoPromoted: row.auto_promoted ?? 0,
        duplicates: row.duplicates ?? 0,
        rejectedOnIngest: row.rejected_on_ingest ?? 0,
        counts,
        totalStored,
        reviewState: counts.pending > 0 ? "open" : "completed",
        firstCreatedAt: row.first_created_at,
        lastReviewedAt: row.last_reviewed_at,
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = validateIngestKey(request);

  if (!auth.ok) {
    if (auth.status === 503) {
      return NextResponse.json(
        {
          ok: false,
          error: "External ingest is not enabled. Set INGEST_API_KEY in .env to activate this endpoint.",
          ingestEnabled: false,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: z.infer<typeof batchBodySchema>;
  try {
    body = batchBodySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.errors[0]?.message, details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const batchId = createId();
  const accepted: string[] = [];
  const rejected: { index: number; reason: string }[] = [];
  const duplicates: { index: number; candidateId: string }[] = [];
  const autoPromoted: string[] = [];
  const autoPromoteDeferred: { index: number; candidateId: string; reason: string }[] = [];

  const autoPromoteThreshold = env.INGEST_MIN_CONFIDENCE_AUTOPROMOTE;

  for (let i = 0; i < body.candidates.length; i++) {
    const c = body.candidates[i]!;
    try {
      const normalizedPayload = normalizeCandidatePayload(c.candidateType, c.payload);

      const existingCandidate = await query<{ id: string }>(
        `select id::text
         from mdm_candidate
         where candidate_type = $1
           and payload = $2::jsonb
           and status = 'pending'
         limit 1`,
        [c.candidateType, JSON.stringify(normalizedPayload)],
      );

      if (existingCandidate.rows[0]?.id) {
        duplicates.push({ index: i, candidateId: existingCandidate.rows[0].id });
        continue;
      }

      const id = createId();
      await query(
        `insert into mdm_candidate
           (id, source_kind, candidate_type, payload, evidence, confidence,
            needs_human_review, status, source_document_name, extraction_batch_id)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7, 'pending', $8, $9)`,
        [
          id,
          body.sourceKind,
          c.candidateType,
          JSON.stringify(normalizedPayload),
          c.evidence ?? null,
          c.confidence ?? null,
          c.needsHumanReview,
          c.sourceDocumentName ?? body.sourceName,
          batchId,
        ],
      );
      accepted.push(id);

      const canAutoPromote =
        autoPromoteThreshold !== undefined &&
        c.candidateType !== "unknown" &&
        c.needsHumanReview === false &&
        typeof c.confidence === "number" &&
        c.confidence >= autoPromoteThreshold;

      if (canAutoPromote) {
        try {
          await promoteCandidateRecord({
            candidateId: id,
            candidateType: c.candidateType,
            payload: normalizedPayload,
            actorId: null,
            comments: `Auto-promoted from ${auth.sourceSystem} batch ingest`,
          });
          autoPromoted.push(id);
        } catch (autoPromoteError) {
          autoPromoteDeferred.push({
            index: i,
            candidateId: id,
            reason:
              autoPromoteError instanceof PromotionConflictError
                ? autoPromoteError.message
                : autoPromoteError instanceof Error
                  ? autoPromoteError.message
                  : "Auto-promote failed.",
          });
        }
      }
    } catch (rowErr) {
      rejected.push({
        index: i,
        reason: rowErr instanceof Error ? rowErr.message : "Insert failed.",
      });
    }
  }

  // Audit the batch as a single entry
  await query(
    `insert into mdm_change_log
       (id, table_name, record_id, action_type, new_value_json, comments)
     values ($1, 'mdm_candidate', $2, 'extract', $3::jsonb, $4)`,
    [
      createId(),
      batchId,
      JSON.stringify({
        sourceKind: body.sourceKind,
        sourceName: body.sourceName,
        sourceSystem: auth.sourceSystem,
        accepted: accepted.length,
        autoPromoted: autoPromoted.length,
        duplicates: duplicates.length,
        rejected: rejected.length,
        batchId,
        ...(autoPromoteDeferred.length > 0 && { autoPromoteDeferred }),
      }),
      `External batch from ${auth.sourceSystem}: ${accepted.length} accepted, ${autoPromoted.length} auto-promoted, ${duplicates.length} duplicates, ${rejected.length} rejected`,
    ],
  );

  const status = rejected.length > 0 && accepted.length === 0 ? 422 : 200;

  return NextResponse.json(
    {
      ok: accepted.length > 0,
      batchId,
      accepted: accepted.length,
      autoPromoted: autoPromoted.length,
      duplicates: duplicates.length,
      rejected: rejected.length,
      ...(autoPromoteDeferred.length > 0 && { autoPromoteDeferred }),
      ...(duplicates.length > 0 && { duplicateItems: duplicates }),
      ...(rejected.length > 0 && { rejectedItems: rejected }),
    },
    { status },
  );
}
