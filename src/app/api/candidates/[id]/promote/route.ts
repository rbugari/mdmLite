import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { PromotionConflictError, promoteCandidateRecord } from "@/lib/candidate-promotion";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  comments: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { id } = await params;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await request.text();
    if (raw) body = bodySchema.parse(JSON.parse(raw));
  } catch {
    // optional body — ignore parse errors
  }

  const candidateResult = await query<{
    id: string;
    candidate_type: string;
    payload: Record<string, unknown>;
    status: string;
  }>(
    `select id::text, candidate_type, payload, status from mdm_candidate where id = $1`,
    [id],
  );

  const candidate = candidateResult.rows[0];
  if (!candidate) {
    return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
  }
  if (candidate.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: `Candidate is already ${candidate.status}.` },
      { status: 409 },
    );
  }

  const payload = candidate.payload;
  let promotedRecordId: string | null = null;

  try {
    promotedRecordId = (
      await promoteCandidateRecord({
        candidateId: id,
        candidateType: candidate.candidate_type as "mapping" | "group" | "parameter" | "unknown",
        payload,
        actorId: identity.userId,
        comments: body.comments ?? "Promoted to draft rule",
      })
    ).promotedRecordId;
  } catch (err) {
    if (err instanceof PromotionConflictError) {
      return NextResponse.json(
        { ok: false, error: err.message, conflictRecordId: err.conflictRecordId },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Promote failed." },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, promotedRecordId });
}
