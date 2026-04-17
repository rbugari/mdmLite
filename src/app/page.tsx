import Link from "next/link";
import { Database, FileSpreadsheet, Network, ShieldCheck } from "lucide-react";

import { DemoResetButton } from "@/components/demo-reset-button";
import { requireAdminPage } from "@/lib/auth-server";
import { appConfig } from "@/lib/app-config";
import { getCopy } from "@/lib/copy";
import { getDashboardStats } from "@/lib/mdm";
import { getRequestPreferences } from "@/lib/request-preferences";

const cardIcons = [Database, FileSpreadsheet, Network, ShieldCheck];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireAdminPage("/");
  const stats = await getDashboardStats();
  const { language } = await getRequestPreferences();
  const t = getCopy(language).home;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>

          <div className="hero-actions">
            <Link href="/mappings" className="hero-link hero-link--primary">
              {t.primaryCta}
            </Link>
            <Link href="/parameters" className="hero-link">
              {t.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <h2>{t.panelTitle}</h2>
          <ul>
            <li>{t.panelItems[0]}</li>
            <li>{t.panelItems[1]}</li>
            <li>{t.panelItems[2]}</li>
            <li>{t.panelItems[3]}</li>
            <li>
              {t.panelItems[4]} {appConfig.appPort}
            </li>
            <li>{t.panelItems[5]}</li>
          </ul>

          <div className="stat-strip">
            <div>
              <strong>{stats.mappings}</strong>
              <span>{t.statLabels.mappings}</span>
            </div>
            <div>
              <strong>{stats.groups}</strong>
              <span>{t.statLabels.groups}</span>
            </div>
            <div>
              <strong>{stats.parameters}</strong>
              <span>{t.statLabels.parameters}</span>
            </div>
          </div>

          <DemoResetButton />
        </div>
      </section>

      <section className="card-grid">
        {t.cards.map((card, index) => {
          const Icon = cardIcons[index];
          return (
            <article key={card.title} className="feature-card">
              <Icon className="feature-icon" aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
