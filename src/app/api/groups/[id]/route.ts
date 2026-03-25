import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import { getUiActorId } from "@/lib/mdm-write-context";

const updateGroupSchema = z.object({
  memberValue: z.string().min(1, "Member value is required."),
  groupValue: z.string().min(1, "Group value is required."),
  validFrom: z.string().min(1, "Valid from is required."),
  comments: z.string().optional().default(""),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = updateGroupSchema.parse(await request.json());
    const actorId = await getUiActorId();

    const result = await query<{ id: string }>(
      `
        update mdm_group_rule
        set
          member_value = $2,
          group_value = $3,
          group_label = $3,
          valid_from = $4,
          comments = $5,
          updated_by = $6,
          updated_at = current_timestamp
        where id = $1
        returning id
      `,
      [id, payload.memberValue, payload.groupValue, payload.validFrom, payload.comments || "Updated from UI", actorId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown groups update error" },
      { status: 500 },
    );
  }
}