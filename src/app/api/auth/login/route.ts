import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from "@/lib/auth";
import { query } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).optional(),
  email: z.string().trim().min(1).optional(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const hostHeader = request.headers.get("host");
    const effectiveHost = (forwardedHost ?? hostHeader ?? requestUrl.host).split(":")[0]?.trim().toLowerCase();
    const isHttps = forwardedProto === "https" || requestUrl.protocol === "https:";
    const isLocalHost = ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(effectiveHost || requestUrl.hostname);

    const payload = loginSchema.parse(await request.json());
    const identifier = payload.identifier ?? payload.email ?? "";
    const validIdentifier = identifier === env.APP_ADMIN_USERNAME || identifier === env.APP_ADMIN_EMAIL;

    if (!validIdentifier || payload.password !== env.APP_ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    const configuredAdminResult = await query<{ id: string; email: string }>(
      `
        select u.id, u.email
        from mdm_user u
        join mdm_role r on r.id = u.role_id
        where u.email = $1
          and u.is_active = true
          and r.code = 'ADMIN'
        limit 1
      `,
      [env.APP_ADMIN_EMAIL],
    );

    let resolvedAdmin = configuredAdminResult.rows[0];

    if (!resolvedAdmin) {
      const fallbackAdminResult = await query<{ id: string; email: string }>(
        `
          select u.id, u.email
          from mdm_user u
          join mdm_role r on r.id = u.role_id
          where u.is_active = true
            and r.code = 'ADMIN'
          order by u.created_at asc
          limit 1
        `,
      );

      resolvedAdmin = fallbackAdminResult.rows[0];
    }

    if (!resolvedAdmin) {
      return NextResponse.json({ ok: false, error: "Configured admin user was not found." }, { status: 400 });
    }

    const token = await createSessionToken(resolvedAdmin.email);
    const response = NextResponse.json({ ok: true });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: isHttps && !isLocalHost,
      sameSite: "lax",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown auth error" },
      { status: 500 },
    );
  }
}
