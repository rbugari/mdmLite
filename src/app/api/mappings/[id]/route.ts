import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

const updateMappingSchema = z.object({
  sourceValue: z.string().min(1, "Source value is required."),
  targetValue: z.string().min(1, "Target value is required."),
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
    const payload = updateMappingSchema.parse(await request.json());

    const currentResult = await query<{
      id: string;
      rule_set_id: string;
      entity_type_id: string;
      source_key: string;
      source_value: string;
      target_value: string;
      valid_from: string;
      status: string;
    }>(
      `
        select
          id::text,
          rule_set_id::text,
          entity_type_id::text,
          source_key,
          source_value,
          target_value,
          valid_from::text,
          status
        from mdm_mapping_rule
        where id = $1
        limit 1
      `,
      [id],
    );

    if (!currentResult.rowCount || !currentResult.rows[0]) {
      return NextResponse.json({ ok: false, error: "Mapping not found." }, { status: 404 });
    }

    const current = currentResult.rows[0];

    if (current.status === "approved") {
      const replacementRecordId = createId();
      const replacementResult = await query<{ id: string }>(
        `
          insert into mdm_mapping_rule (
            id,
            rule_set_id,
            entity_type_id,
            source_key,
            source_value,
            target_value,
            target_label,
            priority,
            valid_from,
            status,
            is_active,
            comments,
            created_by,
            updated_by
          )
          values ($1, $2, $3, $4, $5, $6, $6, 100, $7, 'pending_approval', true, $8, $9, $9)
          returning id::text
        `,
        [
          replacementRecordId,
          current.rule_set_id,
          current.entity_type_id,
          current.source_key,
          payload.sourceValue,
          payload.targetValue,
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
          values ($1, 'mdm_mapping_rule', $2, 'update', $3::jsonb, $4::jsonb, $5, $6)
        `,
        [
          createId(),
          replacementId ?? id,
          JSON.stringify({
            replacedRecordId: current.id,
            status: current.status,
            sourceValue: current.source_value,
            targetValue: current.target_value,
            validFrom: current.valid_from,
          }),
          JSON.stringify({
            replacementId,
            status: "pending_approval",
            sourceValue: payload.sourceValue,
            targetValue: payload.targetValue,
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
        update mdm_mapping_rule
        set
          source_value = $2,
          target_value = $3,
          target_label = $3,
          valid_from = $4,
          status = 'pending_approval',
          comments = $5,
          updated_by = $6,
          updated_at = current_timestamp
        where id = $1
        returning id
      `,
      [
        id,
        payload.sourceValue,
        payload.targetValue,
        payload.validFrom,
        payload.comments || "Updated from UI",
        identity.userId,
      ],
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
        values ($1, 'mdm_mapping_rule', $2, 'update', $3::jsonb, $4, $5)
      `,
      [
        createId(),
        id,
        JSON.stringify({
          previousStatus: current.status,
          sourceValue: payload.sourceValue,
          targetValue: payload.targetValue,
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
            "A replacement with the same source and validFrom already exists. For approved records, use a new effective date to create a non-destructive version.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown mappings update error" },
      { status: 500 },
    );
  }
}