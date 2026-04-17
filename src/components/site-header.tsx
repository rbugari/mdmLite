"use client";

import Link from "next/link";
import { Languages, Moon, Sun } from "lucide-react";

import { DbStatusIndicator } from "@/components/db-status-indicator";
import { getCopy } from "@/lib/copy";
import { useUiPreferences } from "@/components/ui-preferences-provider";

export function SiteHeader() {
  const { language, theme, setLanguage, toggleTheme } = useUiPreferences();
  const t = getCopy(language).header;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/auth/login");
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__mark">MDM</span>
          <span className="site-brand__text">Lite</span>
        </Link>

        <div className="site-header__actions">
          <nav className="site-nav" aria-label={t.navLabel}>
            {t.links.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav__link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-header__controls">
            <DbStatusIndicator copy={t.dbStatus} />

            <button type="button" className="site-control" onClick={toggleTheme} aria-label={t.themeToggle}>
              {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
              <span>{theme === "light" ? t.darkTheme : t.lightTheme}</span>
            </button>

            <div className="site-control-group" role="group" aria-label={t.languageToggle}>
              <span className="site-control-group__icon" aria-hidden="true">
                <Languages size={16} />
              </span>
              <button
                type="button"
                className={language === "en" ? "site-control site-control--active" : "site-control"}
                onClick={() => setLanguage("en")}
              >
                {t.english}
              </button>
              <button
                type="button"
                className={language === "es" ? "site-control site-control--active" : "site-control"}
                onClick={() => setLanguage("es")}
              >
                {t.spanish}
              </button>
            </div>

            <button type="button" className="site-control" onClick={() => void handleLogout()}>
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}