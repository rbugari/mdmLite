import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { id } = await params;

  const result = await query(
    `
      select
        c.id::text,
        c.source_kind,
        c.candidate_type,
        c.payload,
        c.evidence,
        c.confidence::text,
        c.needs_human_review,
        c.status,
        c.source_document_name,
        c.extraction_batch_id::text,
        c.promoted_record_id::text,
        c.review_comments,
        c.reviewed_at::text,
        reviewer.email as reviewed_by_email,
        creator.email as created_by_email,
        c.created_at::text
      from mdm_candidate c
      left join mdm_user reviewer on reviewer.id = c.reviewed_by
      left join mdm_user creator on creator.id = c.created_by
      where c.id = $1
    `,
    [id],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: result.rows[0] });
}
