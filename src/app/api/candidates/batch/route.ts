import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeCandidatePayload, PromotionConflictError, promoteCandidateRecord } from "@/lib/candidate-promotion";
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
