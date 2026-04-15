import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    {
      ok: false,
      error: "Direct upload is disabled. Use /api/imports/upload/preview and then /api/imports/upload/confirm.",
    },
    { status: 400 },
  );
}