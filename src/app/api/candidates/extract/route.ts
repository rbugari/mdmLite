import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";
import { extractCandidatesFromText, isLlmConfigured } from "@/lib/llm";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  text: z.string().min(20, "Text must be at least 20 characters.").max(50000),
  documentName: z.string().min(1).max(500).default("pasted-text"),
});

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  if (!isLlmConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "LLM not configured. Set LLM_PROVIDER and LLM_API_KEY in .env to enable document extraction.",
        llmConfigured: false,
      },
      { status: 503 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const candidates = await extractCandidatesFromText(body.text, body.documentName);

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, extracted: 0, batchId: null, candidates: [] });
  }

  const batchId = createId();

  for (const candidate of candidates) {
    await query(
      `insert into mdm_candidate
         (id, source_kind, candidate_type, payload, evidence, confidence, needs_human_review,
          status, source_document_name, extraction_batch_id, created_by)
       values ($1, 'document', $2, $3::jsonb, $4, $5, $6, 'pending', $7, $8, $9)`,
      [
        createId(),
        candidate.candidateType,
        JSON.stringify(candidate.payload),
        candidate.evidence ?? null,
        candidate.confidence ?? null,
        candidate.needsHumanReview ?? true,
        body.documentName,
        batchId,
        identity.userId,
      ],
    );
  }

  // Audit
  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_candidate', $2, 'extract', $3::jsonb, $4, $5)`,
    [
      createId(),
      batchId,
      JSON.stringify({ documentName: body.documentName, extracted: candidates.length, batchId }),
      identity.userId,
      `Extracted ${candidates.length} candidates from "${body.documentName}"`,
    ],
  );

  return NextResponse.json({
    ok: true,
    extracted: candidates.length,
    batchId,
  });
}
