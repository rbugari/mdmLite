import { NextResponse } from "next/server";

import { getAdminIdentity } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getAdminIdentity();

  if (!identity) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    email: identity.email,
  });
}
