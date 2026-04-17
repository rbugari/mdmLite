import { NextResponse } from "next/server";

import { previewUploadedFile } from "@/lib/imports";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const target = formData.get("target");
    const file = formData.get("file");

    if (target !== "mappings" && target !== "groups" && target !== "parameters") {
      return NextResponse.json({ ok: false, error: "Invalid target." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "File is required." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      return NextResponse.json({ ok: false, error: "Only csv, xlsx or xls files are supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await previewUploadedFile(target, buffer, file.name);

    return NextResponse.json({
      ok: true,
      mode: "preview",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload preview error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
