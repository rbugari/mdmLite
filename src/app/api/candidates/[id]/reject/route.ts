import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

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
    // optional body
  }

  const candidateResult = await query<{ id: string; status: string }>(
    `select id::text, status from mdm_candidate where id = $1`,
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

  await query(
    `update mdm_candidate
     set status = 'rejected',
         reviewed_by = $2,
         reviewed_at = current_timestamp,
         review_comments = $3
     where id = $1`,
    [id, identity.userId, body.comments ?? "Rejected by reviewer"],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_candidate', $2, 'reject', $3::jsonb, $4, $5)`,
    [
      createId(),
      id,
      JSON.stringify({ comments: body.comments }),
      identity.userId,
      body.comments ?? "Rejected by reviewer",
    ],
  );

  return NextResponse.json({ ok: true });
}
