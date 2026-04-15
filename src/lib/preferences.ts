export type AppLanguage = "en" | "es";
export type AppTheme = "light" | "dark";

export const DEFAULT_LANGUAGE: AppLanguage = "en";
export const DEFAULT_THEME: AppTheme = "light";

export const preferenceCookieNames = {
  language: "mdm_language",
  theme: "mdm_theme",
} as const;

export function normalizeLanguage(value?: string | null): AppLanguage {
  return value === "es" ? "es" : DEFAULT_LANGUAGE;
}

export function normalizeTheme(value?: string | null): AppTheme {
  return value === "dark" ? "dark" : DEFAULT_THEME;
}