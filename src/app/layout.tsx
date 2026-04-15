import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { UiPreferencesProvider } from "@/components/ui-preferences-provider";
import { getRequestPreferences } from "@/lib/request-preferences";

import "./globals.css";

export const metadata: Metadata = {
  title: "MDM Lite",
  description: "Lightweight reference data manager MVP for commercial business rules.",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const preferences = await getRequestPreferences();

  return (
    <html lang={preferences.language} data-theme={preferences.theme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UiPreferencesProvider initialLanguage={preferences.language} initialTheme={preferences.theme}>
          <SiteHeader />
          {children}
        </UiPreferencesProvider>
      </body>
    </html>
  );
}
