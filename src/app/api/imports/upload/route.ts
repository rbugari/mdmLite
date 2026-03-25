import { NextResponse } from "next/server";

import { importUploadedFile } from "@/lib/imports";

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
    const result = await importUploadedFile(target, buffer);

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload import error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}