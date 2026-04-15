import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

export async function POST() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return unauthorizedResponse();
  }

  const scriptPath = path.join(process.cwd(), "scripts", "demo-reset-seed.mjs");
  const reportPath = path.join(process.cwd(), "reports", "demo-reset-latest.json");

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 1024 * 1024,
    });

    const reportRaw = await fs.readFile(reportPath, "utf8");
    const report = JSON.parse(reportRaw) as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      triggeredBy: identity.email,
      stdout,
      stderr,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown demo reset error" },
      { status: 500 },
    );
  }
}