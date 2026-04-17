import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { UiPreferencesProvider } from "@/components/ui-preferences-provider";
import { getRequestPreferences } from "@/lib/request-preferences";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

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
      <body className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
        <UiPreferencesProvider initialLanguage={preferences.language} initialTheme={preferences.theme}>
          <SiteHeader />
          {children}
        </UiPreferencesProvider>
      </body>
    </html>
  );
}
