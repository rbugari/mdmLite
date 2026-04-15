import Link from "next/link";

import { DemoResetButton } from "@/components/demo-reset-button";
import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

export default async function DemoHelpPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpDemo;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/demo" />
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </section>

      <section className="help-grid help-grid--two">
        <article className="help-card help-card--accent">
          <div className="help-card__section">
            <span className="eyebrow">{t.resetEyebrow}</span>
            <h2>{t.resetTitle}</h2>
            <p>{t.resetText}</p>
            <DemoResetButton secondaryHref="/approvals" secondaryLabel={t.secondaryCta} />
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.goalEyebrow}</span>
            <h2>{t.goalTitle}</h2>
            <ul className="help-list">
              {t.goalBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="help-faq">
        <div className="help-faq__list">
          {t.steps.map((step) => (
            <article key={step.title} className="help-card">
              <div className="help-card__head">
                <div>
                  <span className="eyebrow">{step.kicker}</span>
                  <h2>{step.title}</h2>
                </div>
                <Link href={step.href} className="hero-link hero-link--primary">
                  {step.cta}
                </Link>
              </div>
              <div className="help-card__section">
                <p>{step.text}</p>
              </div>
              <div className="help-card__section">
                <h3>{t.doTitle}</h3>
                <ul className="help-list">
                  {step.doItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="help-card__section">
                <h3>{t.lookTitle}</h3>
                <ul className="help-list">
                  {step.lookFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.storyEyebrow}</span>
            <h2>{t.storyTitle}</h2>
            <ul className="help-list">
              {t.storyBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.sqlEyebrow}</span>
            <h2>{t.sqlTitle}</h2>
            <p>{t.sqlText}</p>
            <pre className="code-sample"><code>{t.sqlExample}</code></pre>
          </div>
        </article>
      </section>
    </main>
  );
}