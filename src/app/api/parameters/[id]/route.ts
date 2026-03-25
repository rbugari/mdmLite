import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import { getUiActorId } from "@/lib/mdm-write-context";

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
    const { id } = await context.params;
    const payload = updateParameterSchema.parse(await request.json());
    const actorId = await getUiActorId();

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
        actorId,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Parameter not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown parameters update error" },
      { status: 500 },
    );
  }
}