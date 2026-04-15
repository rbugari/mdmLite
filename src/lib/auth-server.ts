import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { query } from "@/lib/db";

type AdminIdentity = {
  userId: string;
  email: string;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const result = await query<{ id: string; email: string }>(
    `
      select u.id, u.email
      from mdm_user u
      join mdm_role r on r.id = u.role_id
      where u.email = $1
        and u.is_active = true
        and r.code = 'ADMIN'
      limit 1
    `,
    [session.email],
  );

  if (!result.rowCount || !result.rows[0]) {
    return null;
  }

  return {
    userId: result.rows[0].id,
    email: result.rows[0].email,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

export async function requireAdminPage(nextPath: string) {
  const identity = await getAdminIdentity();

  if (!identity) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return identity;
}
