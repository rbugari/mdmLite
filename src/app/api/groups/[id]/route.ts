import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

const updateGroupSchema = z.object({
  memberValue: z.string().min(1, "Member value is required."),
  groupValue: z.string().min(1, "Group value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getAdminIdentity();
    if (!identity) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;
    const payload = updateGroupSchema.parse(await request.json());

    const currentResult = await query<{
      id: string;
      rule_set_id: string;
      entity_type_id: string;
      member_value: string;
      group_value: string;
      valid_from: string;
      status: string;
    }>(
      `
        select
          id::text,
          rule_set_id::text,
          entity_type_id::text,
          member_value,
          group_value,
          valid_from::text,
          status
        from mdm_group_rule
        where id = $1
        limit 1
      `,
      [id],
    );

    if (!currentResult.rowCount || !currentResult.rows[0]) {
      return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
    }

    const current = currentResult.rows[0];

    if (current.status === "approved") {
      const replacementRecordId = createId();
      const replacementResult = await query<{ id: string }>(
        `
          insert into mdm_group_rule (
            id,
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
          values ($1, $2, $3, $4, $5, $5, $6, 'pending_approval', true, $7, $8, $8)
          returning id::text
        `,
        [
          replacementRecordId,
          current.rule_set_id,
          current.entity_type_id,
          payload.memberValue,
          payload.groupValue,
          payload.validFrom,
          payload.comments || "Replacement from UI",
          identity.userId,
        ],
      );

      const replacementId = replacementResult.rows[0]?.id;

      await query(
        `
          insert into mdm_change_log (
            table_name,
            record_id,
            action_type,
            old_value_json,
            new_value_json,
            changed_by,
            comments
          )
          values ($1, 'mdm_group_rule', $2, 'update', $3::jsonb, $4::jsonb, $5, $6)
        `,
        [
          createId(),
          replacementId ?? id,
          JSON.stringify({
            replacedRecordId: current.id,
            status: current.status,
            memberValue: current.member_value,
            groupValue: current.group_value,
            validFrom: current.valid_from,
          }),
          JSON.stringify({
            replacementId,
            status: "pending_approval",
            memberValue: payload.memberValue,
            groupValue: payload.groupValue,
            validFrom: payload.validFrom,
            mode: "non_destructive_replacement",
          }),
          identity.userId,
          payload.comments || "Replacement from UI",
        ],
      );

      return NextResponse.json({ ok: true, mode: "non_destructive_replacement", replacementId });
    }

      await query<{ id: string }>(
      `
        update mdm_group_rule
        set
          member_value = $2,
          group_value = $3,
          group_label = $3,
          valid_from = $4,
          status = 'pending_approval',
          comments = $5,
          updated_by = $6,
          updated_at = current_timestamp
        where id = $1
        returning id
      `,
      [id, payload.memberValue, payload.groupValue, payload.validFrom, payload.comments || "Updated from UI", identity.userId],
    );

    await query(
      `
        insert into mdm_change_log (
          id,
          table_name,
          record_id,
          action_type,
          new_value_json,
          changed_by,
          comments
        )
        values ($1, 'mdm_group_rule', $2, 'update', $3::jsonb, $4, $5)
      `,
      [
        createId(),
        id,
        JSON.stringify({
          previousStatus: current.status,
          memberValue: payload.memberValue,
          groupValue: payload.groupValue,
          validFrom: payload.validFrom,
        }),
        identity.userId,
        payload.comments || "Updated from UI",
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const dbError = error as { code?: string };
    if (dbError.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A replacement with the same member and validFrom already exists. For approved records, use a new effective date to create a non-destructive version.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown groups update error" },
      { status: 500 },
    );
  }
}