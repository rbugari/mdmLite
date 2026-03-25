import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import { getUiActorId } from "@/lib/mdm-write-context";

const updateMappingSchema = z.object({
  sourceValue: z.string().min(1, "Source value is required."),
  targetValue: z.string().min(1, "Target value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = updateMappingSchema.parse(await request.json());
    const actorId = await getUiActorId();

    const result = await query<{ id: string }>(
      `
        update mdm_mapping_rule
        set
          source_value = $2,
          target_value = $3,
          target_label = $3,
          valid_from = $4,
          comments = $5,
          updated_by = $6,
          updated_at = current_timestamp
        where id = $1
        returning id
      `,
      [id, payload.sourceValue, payload.targetValue, payload.validFrom, payload.comments || "Updated from UI", actorId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Mapping not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown mappings update error" },
      { status: 500 },
    );
  }
}