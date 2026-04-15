import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { getDefaultClientRuleContext } from "@/lib/mdm-write-context";

type GroupRow = {
  id: string;
  rule_set_code: string;
  entity_type_code: string;
  member_value: string;
  group_value: string;
  group_label: string | null;
  valid_from: string;
  valid_to: string | null;
};

const createGroupSchema = z.object({
  memberValue: z.string().min(1, "Member value is required."),
  groupValue: z.string().min(1, "Group value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function GET() {
  try {
    const result = await query<GroupRow>(`
      select
        id,
        rule_set_code,
        entity_type_code,
        member_value,
        group_value,
        group_label,
        valid_from::text,
        valid_to::text
      from vw_mdm_group_rule_active
      order by entity_type_code, member_value
      limit 200
    `);

    return NextResponse.json({
      ok: true,
      items: result.rows,
      count: result.rowCount ?? result.rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown groups error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getAdminIdentity();
    if (!identity) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const payload = createGroupSchema.parse(body);
    const context = await getDefaultClientRuleContext();

    const writeResult = await query<{ id: string }>(
      `
        insert into mdm_group_rule (
          rule_set_id,
          entity_type_id,
          member_value,
          group_value,
          group_label,
          valid_from,
          status,
          is_active,
          comments,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $4, $5, 'pending_approval', true, $6, $7, $7)
        on conflict (rule_set_id, entity_type_id, member_value, valid_from)
        do update set
          group_value = excluded.group_value,
          group_label = excluded.group_label,
          status = 'pending_approval',
          is_active = excluded.is_active,
          comments = excluded.comments,
          updated_by = excluded.updated_by,
          updated_at = current_timestamp
        returning id
      `,
      [
        context.ruleSetId,
        context.entityTypeId,
        payload.memberValue,
        payload.groupValue,
        payload.validFrom,
        payload.comments || "Created from UI",
        identity.userId,
      ],
    );

    if (writeResult.rows[0]?.id) {
      await query(
        `
          insert into mdm_change_log (
            table_name,
            record_id,
            action_type,
            new_value_json,
            changed_by,
            comments
          )
          values ('mdm_group_rule', $1, 'create', $2::jsonb, $3, $4)
        `,
        [
          writeResult.rows[0].id,
          JSON.stringify({ memberValue: payload.memberValue, groupValue: payload.groupValue, validFrom: payload.validFrom }),
          identity.userId,
          payload.comments || "Created from UI",
        ],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown groups write error" },
      { status: 500 },
    );
  }
}