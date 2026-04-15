import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { getDefaultClientRuleContext } from "@/lib/mdm-write-context";

type MappingRow = {
  id: string;
  rule_set_code: string;
  entity_type_code: string;
  source_key: string;
  source_value: string;
  target_value: string;
  target_label: string | null;
  priority: number;
  valid_from: string;
  valid_to: string | null;
};

const createMappingSchema = z.object({
  sourceValue: z.string().min(1, "Source value is required."),
  targetValue: z.string().min(1, "Target value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function GET() {
  try {
    const result = await query<MappingRow>(`
      select
        id,
        rule_set_code,
        entity_type_code,
        source_key,
        source_value,
        target_value,
        target_label,
        priority,
        valid_from::text,
        valid_to::text
      from vw_mdm_mapping_rule_active
      order by entity_type_code, source_value
      limit 200
    `);

    return NextResponse.json({
      ok: true,
      items: result.rows,
      count: result.rowCount ?? result.rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mappings error";

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
    const payload = createMappingSchema.parse(body);
    const context = await getDefaultClientRuleContext();

    const writeResult = await query<{ id: string }>(
      `
        insert into mdm_mapping_rule (
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
        values ($1, $2, 'customer_name', $3, $4, $4, 100, $5, 'pending_approval', true, $6, $7, $7)
        on conflict (rule_set_id, entity_type_id, source_key, source_value, valid_from)
        do update set
          target_value = excluded.target_value,
          target_label = excluded.target_label,
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
        payload.sourceValue,
        payload.targetValue,
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
          values ('mdm_mapping_rule', $1, 'create', $2::jsonb, $3, $4)
        `,
        [
          writeResult.rows[0].id,
          JSON.stringify({ sourceValue: payload.sourceValue, targetValue: payload.targetValue, validFrom: payload.validFrom }),
          identity.userId,
          payload.comments || "Created from UI",
        ],
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message ?? "Invalid input.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown mappings write error",
      },
      { status: 500 },
    );
  }
}