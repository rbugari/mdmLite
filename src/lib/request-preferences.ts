import "server-only";

import { cookies } from "next/headers";

import { normalizeLanguage, normalizeTheme, preferenceCookieNames } from "@/lib/preferences";

export async function getRequestPreferences() {
  const cookieStore = await cookies();

  return {
    language: normalizeLanguage(cookieStore.get(preferenceCookieNames.language)?.value),
    theme: normalizeTheme(cookieStore.get(preferenceCookieNames.theme)?.value),
  };
}