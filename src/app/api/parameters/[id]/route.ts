import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";

const updateParameterSchema = z.object({
  parameterKey: z.string().min(1, "Parameter key is required."),
  parameterValue: z.string().min(1, "Parameter value is required."),
  domain: z.string().min(1, "Domain is required."),
  scopeType: z.string().min(1, "Scope type is required."),
  scopeValue: z.string().min(1, "Scope value is required."),
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
    const payload = updateParameterSchema.parse(await request.json());

    const currentResult = await query<{
      id: string;
      parameter_key: string;
      parameter_value: string;
      data_type: string;
      domain: string;
      parameter_scope_type: string;
      parameter_scope_value: string;
      valid_from: string;
      status: string;
    }>(
      `
        select
          id::text,
          parameter_key,
          parameter_value,
          data_type,
          domain,
          coalesce(parameter_scope_type, '') as parameter_scope_type,
          coalesce(parameter_scope_value, '') as parameter_scope_value,
          valid_from::text,
          status
        from mdm_parameter
        where id = $1
        limit 1
      `,
      [id],
    );

    if (!currentResult.rowCount || !currentResult.rows[0]) {
      return NextResponse.json({ ok: false, error: "Parameter not found." }, { status: 404 });
    }

    const current = currentResult.rows[0];

    if (current.status === "approved") {
      const replacementResult = await query<{ id: string }>(
        `
          insert into mdm_parameter (
            parameter_key,
            parameter_value,
            data_type,
            domain,
            parameter_scope_type,
            parameter_scope_value,
            valid_from,
            status,
            is_active,
            description,
            created_by,
            updated_by
          )
          values ($1, $2, $3, $4, $5, $6, $7, 'pending_approval', true, $8, $9, $9)
          returning id::text
        `,
        [
          payload.parameterKey,
          payload.parameterValue,
          current.data_type,
          payload.domain,
          payload.scopeType,
          payload.scopeValue,
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
          values ('mdm_parameter', $1, 'update', $2::jsonb, $3::jsonb, $4, $5)
        `,
        [
          replacementId ?? id,
          JSON.stringify({
            replacedRecordId: current.id,
            status: current.status,
            parameterKey: current.parameter_key,
            parameterValue: current.parameter_value,
            domain: current.domain,
            scopeType: current.parameter_scope_type,
            scopeValue: current.parameter_scope_value,
            validFrom: current.valid_from,
          }),
          JSON.stringify({
            replacementId,
            status: "pending_approval",
            parameterKey: payload.parameterKey,
            parameterValue: payload.parameterValue,
            domain: payload.domain,
            scopeType: payload.scopeType,
            scopeValue: payload.scopeValue,
            validFrom: payload.validFrom,
            mode: "non_destructive_replacement",
          }),
          identity.userId,
          payload.comments || "Replacement from UI",
        ],
      );

      return NextResponse.json({ ok: true, mode: "non_destructive_replacement", replacementId });
    }

    const result = await query<{ id: string }>(
      `
        update mdm_parameter
        set
          parameter_key = $2,
          parameter_value = $3,
          domain = $4,
          parameter_scope_type = $5,
          parameter_scope_value = $6,
          valid_from = $7,
          status = 'pending_approval',
          description = $8,
          updated_by = $9,
          updated_at = current_timestamp
        where id = $1
        returning id
      `,
      [
        id,
        payload.parameterKey,
        payload.parameterValue,
        payload.domain,
        payload.scopeType,
        payload.scopeValue,
        payload.validFrom,
        payload.comments || "Updated from UI",
        identity.userId,
      ],
    );

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
        values ('mdm_parameter', $1, 'update', $2::jsonb, $3, $4)
      `,
      [
        id,
        JSON.stringify({
          previousStatus: current.status,
          parameterKey: payload.parameterKey,
          parameterValue: payload.parameterValue,
          domain: payload.domain,
          scopeType: payload.scopeType,
          scopeValue: payload.scopeValue,
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
            "A replacement with the same key, scope and validFrom already exists. For approved records, use a new effective date to create a non-destructive version.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown parameters update error" },
      { status: 500 },
    );
  }
}