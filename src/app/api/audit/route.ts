import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  table_name: string;
  record_id: string;
  action_type: string;
  changed_at: string;
  approval_status: string | null;
  comments: string | null;
  changed_by_email: string | null;
};

export async function GET(request: Request) {
  try {
    const identity = await getAdminIdentity();
    if (!identity) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table")?.trim() ?? "";
    const action = searchParams.get("action")?.trim() ?? "";
    const recordId = searchParams.get("recordId")?.trim() ?? "";
    const parsedLimit = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (tableName) {
      values.push(tableName);
      conditions.push(`l.table_name = $${values.length}`);
    }

    if (action) {
      values.push(action);
      conditions.push(`l.action_type = $${values.length}`);
    }

    if (recordId) {
      values.push(recordId);
      conditions.push(`l.record_id::text = $${values.length}`);
    }

    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
    const limitPlaceholder = `$${values.length + 1}`;

    const result = await query<AuditRow>(
      `
        select
          l.id::text,
          l.table_name,
          l.record_id::text,
          l.action_type,
          l.changed_at::text,
          l.approval_status,
          l.comments,
          u.email as changed_by_email
        from mdm_change_log l
        left join mdm_user u on u.id = l.changed_by
        ${whereClause}
        order by l.changed_at desc
        limit ${limitPlaceholder}
      `,
      [...values, limit],
    );

    return NextResponse.json({
      ok: true,
      count: result.rowCount ?? result.rows.length,
      items: result.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown audit error" },
      { status: 500 },
    );
  }
}
