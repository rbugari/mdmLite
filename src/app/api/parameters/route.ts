import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import { getUiActorId } from "@/lib/mdm-write-context";

type ParameterRow = {
  id: string;
  parameter_key: string;
  parameter_value: string;
  data_type: string;
  domain: string;
  parameter_scope_type: string | null;
  parameter_scope_value: string | null;
  valid_from: string;
  valid_to: string | null;
};

const createParameterSchema = z.object({
  parameterKey: z.string().min(1, "Parameter key is required."),
  parameterValue: z.string().min(1, "Parameter value is required."),
  domain: z.string().min(1, "Domain is required."),
  scopeType: z.string().min(1, "Scope type is required."),
  scopeValue: z.string().min(1, "Scope value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function GET() {
  try {
    const result = await query<ParameterRow>(`
      select
        id,
        parameter_key,
        parameter_value,
        data_type,
        domain,
        parameter_scope_type,
        parameter_scope_value,
        valid_from::text,
        valid_to::text
      from vw_mdm_parameter_active
      order by parameter_key, parameter_scope_value nulls first
      limit 200
    `);

    return NextResponse.json({
      ok: true,
      items: result.rows,
      count: result.rowCount ?? result.rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parameters error";

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
    const body = await request.json();
    const payload = createParameterSchema.parse(body);
    const actorId = await getUiActorId();

    await query(
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
        values ($1, $2, 'numeric', $3, $4, $5, $6, 'approved', true, $7, $8, $8)
        on conflict (parameter_key, domain, parameter_scope_type, parameter_scope_value, valid_from)
        do update set
          parameter_value = excluded.parameter_value,
          status = excluded.status,
          is_active = excluded.is_active,
          description = excluded.description,
          updated_by = excluded.updated_by,
          updated_at = current_timestamp
      `,
      [
        payload.parameterKey,
        payload.parameterValue,
        payload.domain,
        payload.scopeType,
        payload.scopeValue,
        payload.validFrom,
        payload.comments || "Created from UI",
        actorId,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown parameters write error" },
      { status: 500 },
    );
  }
}
