import Link from "next/link";

import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";
export default async function HelpOverviewPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpOverview;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help" />
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.heroEyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </section>
      <section className="help-hero">
        <article className="help-summary-card">
          <span className="eyebrow">{t.productEyebrow}</span>
          <h2>{t.productTitle}</h2>
          <p>{t.productText}</p>
        </article>
        <article className="help-summary-card">
          <span className="eyebrow">{t.limitEyebrow}</span>
          <h2>{t.limitTitle}</h2>
          <p>{t.limitText}</p>
        </article>
      </section>
      <section className="help-diagram-card help-portal-intro">
        <div className="help-card__head">
          <div>
            <span className="eyebrow">{t.audienceEyebrow}</span>
            <h2>{t.audienceTitle}</h2>
          </div>
        </div>
        <div className="help-audience-grid">
          {t.audienceRoutes.map((route) => (
            <article key={route.href} className="help-audience-card">
              <span className="eyebrow">{route.audience}</span>
              <h3>{route.title}</h3>
              <p>{route.text}</p>
              <Link href={route.href} className="hero-link hero-link--primary">
                {route.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.shortcutEyebrow}</span>
            <h2>{t.shortcutTitle}</h2>
            <ul className="help-list">
              {t.quickStart.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card help-card--accent">
          <div className="help-card__section">
            <span className="eyebrow">{t.recommendedEyebrow}</span>
            <h2>{t.recommendedTitle}</h2>
            <p>{t.recommendedText}</p>
            <div className="hero-actions">
              <Link href="/help/executive" className="hero-link">
                {t.executiveCta}
              </Link>
              <Link href="/help/platforms" className="hero-link">
                {t.platformsCta}
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="help-faq">
        <div className="help-faq__list">
          {t.sections.map((section) => (
            <article key={section.href} className="help-card">
              <div className="help-card__head">
                <div>
                  <span className="eyebrow">{t.sectionEyebrow}</span>
                  <h2>{section.title}</h2>
                </div>
                <Link href={section.href} className="hero-link hero-link--primary">
                  {t.openCta}
                </Link>
              </div>
              <div className="help-card__section">
                <p>{section.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.ideasEyebrow}</span>
            <h2>{t.ideasTitle}</h2>
            <ul className="help-list">
              {t.keyIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.recommendationEyebrow}</span>
            <h2>{t.recommendationTitle}</h2>
            <p>{t.recommendationText}</p>
            <div className="hero-actions">
              <Link href="/help/executive" className="hero-link">
                {t.executiveLink}
              </Link>
              <Link href="/help/functional" className="hero-link">
                {t.functionalLink}
              </Link>
              <Link href="/help/positioning" className="hero-link">
                {t.positioningLink}
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}