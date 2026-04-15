"use client";

import { startTransition, useContext, useEffect, useState, createContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  normalizeLanguage,
  normalizeTheme,
  preferenceCookieNames,
  type AppLanguage,
  type AppTheme,
} from "@/lib/preferences";

type UiPreferencesContextValue = {
  language: AppLanguage;
  theme: AppTheme;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

type UiPreferencesProviderProps = {
  initialLanguage: AppLanguage;
  initialTheme: AppTheme;
  children: ReactNode;
};

function persistPreference(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function UiPreferencesProvider({ initialLanguage, initialTheme, children }: UiPreferencesProviderProps) {
  const router = useRouter();
  const [language, setLanguageState] = useState<AppLanguage>(normalizeLanguage(initialLanguage));
  const [theme, setThemeState] = useState<AppTheme>(normalizeTheme(initialTheme));

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function setLanguage(nextLanguage: AppLanguage) {
    const normalizedLanguage = normalizeLanguage(nextLanguage);
    setLanguageState(normalizedLanguage);
    persistPreference(preferenceCookieNames.language, normalizedLanguage);
    document.documentElement.lang = normalizedLanguage;
    startTransition(() => {
      router.refresh();
    });
  }

  function setTheme(nextTheme: AppTheme) {
    const normalizedTheme = normalizeTheme(nextTheme);
    setThemeState(normalizedTheme);
    persistPreference(preferenceCookieNames.theme, normalizedTheme);
    document.documentElement.dataset.theme = normalizedTheme;
  }

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <UiPreferencesContext.Provider value={{ language, theme, setLanguage, setTheme, toggleTheme }}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);

  if (!context) {
    throw new Error("useUiPreferences must be used within UiPreferencesProvider.");
  }

  return context;
}