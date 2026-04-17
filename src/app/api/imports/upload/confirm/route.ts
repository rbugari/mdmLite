import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmUploadedPreview } from "@/lib/imports";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  token: z.string().min(1, "Preview token is required."),
});

export async function POST(request: Request) {
  try {
    const payload = confirmSchema.parse(await request.json());
    const result = await confirmUploadedPreview(payload.token);

    return NextResponse.json({
      ok: true,
      mode: "confirm",
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown upload confirmation error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
