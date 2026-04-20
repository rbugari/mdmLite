import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { isLlmConfigured } from "@/lib/llm";

export const dynamic = "force-dynamic";

type CandidateRow = {
  id: string;
  source_kind: string;
  candidate_type: string;
  payload: Record<string, unknown>;
  evidence: string | null;
  confidence: string | null;
  needs_human_review: boolean;
  status: string;
  source_document_name: string | null;
  extraction_batch_id: string | null;
  promoted_record_id: string | null;
  review_comments: string | null;
  reviewed_at: string | null;
  reviewed_by_email: string | null;
  created_by_email: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() ?? "pending";
  const candidateType = searchParams.get("type")?.trim() ?? "";
  const parsedLimit = Number(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100;

  const conditions: string[] = [];
  const values: unknown[] = [];

  const validStatuses = ["pending", "promoted", "rejected", "all"];
  if (status !== "all" && validStatuses.includes(status)) {
    values.push(status);
    conditions.push(`c.status = $${values.length}`);
  }

  if (candidateType) {
    values.push(candidateType);
    conditions.push(`c.candidate_type = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
  values.push(limit);

  const result = await query<CandidateRow>(
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
      ${whereClause}
      order by c.created_at desc
      limit $${values.length}
    `,
    values,
  );

  return NextResponse.json({
    ok: true,
    count: result.rows.length,
    llmConfigured: isLlmConfigured(),
    items: result.rows,
  });
}
