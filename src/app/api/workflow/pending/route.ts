import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type PendingItem = {
  id: string;
  entity: "mapping" | "group" | "parameter";
  label: string;
  status: string;
  updated_at: string;
};

export async function GET() {
  try {
    const identity = await getAdminIdentity();
    if (!identity) {
      return unauthorizedResponse();
    }

    const result = await query<PendingItem>(`
      select
        id,
        'mapping'::text as entity,
        concat(source_key, ' = ', source_value, ' -> ', target_value) as label,
        status,
        updated_at::text
      from mdm_mapping_rule
      where is_active = true and status = 'pending_approval'

      union all

      select
        id,
        'group'::text as entity,
        concat(member_value, ' -> ', group_value) as label,
        status,
        updated_at::text
      from mdm_group_rule
      where is_active = true and status = 'pending_approval'

      union all

      select
        id,
        'parameter'::text as entity,
        concat(parameter_key, ' = ', parameter_value) as label,
        status,
        updated_at::text
      from mdm_parameter
      where is_active = true and status = 'pending_approval'

      order by updated_at desc
      limit 300
    `);

    return NextResponse.json({
      ok: true,
      items: result.rows,
      count: result.rowCount ?? result.rows.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown pending workflow error" },
      { status: 500 },
    );
  }
}
