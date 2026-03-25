import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { importDemoWorkbook } from "@/lib/imports";

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "data", "demo", "input_mvp_ventas_perseida_v2.xlsx");
    const buffer = await fs.readFile(filePath);
    const result = await importDemoWorkbook(buffer);

    return NextResponse.json({
      ok: true,
      source: "demo-workbook",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}