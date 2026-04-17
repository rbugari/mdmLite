import { NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.delete(getSessionCookieName());

  return response;
}
