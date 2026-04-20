import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

export default async function PlatformsHelpPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpPlatforms;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/platforms" />
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.centralEyebrow}</span>
            <h2>{t.centralTitle}</h2>
            <p>{t.centralText}</p>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.eltEyebrow}</span>
            <h2>{t.eltTitle}</h2>
            <ul className="help-list">
              {t.eltMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">{t.visualEyebrow}</span>
          <h2>{t.visualTitle}</h2>
        </div>
        <div className="medallion-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">Bronze</span>
            <h3>Raw ingest</h3>
            <p>{t.bronzeText}</p>
          </article>
          <div className="diagram-arrow">→</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">Silver</span>
            <h3>Normalizacion con MDM Lite</h3>
            <p>{t.silverText}</p>
          </article>
          <div className="diagram-arrow">→</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">Gold</span>
            <h3>Consumo de negocio</h3>
            <p>{t.goldText}</p>
          </article>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.medallionEyebrow}</span>
          <h2>{t.medallionTitle}</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {t.medallionHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.medallionRows.map((row) => (
                <tr key={row.layer}>
                  <td>{row.layer}</td>
                  <td>{row.role}</td>
                  <td>{row.mdmUsage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.platformsEyebrow}</span>
          <h2>{t.platformsTitle}</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {t.platformHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.platformPatterns.map((row) => (
                <tr key={row.platform}>
                  <td>{row.platform}</td>
                  <td>{row.pattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.recommendedEyebrow}</span>
            <h2>{t.recommendedTitle}</h2>
            <ul className="help-list">
              {t.recommendedPatterns.map((pattern) => (
                <li key={pattern}>{pattern}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.antiEyebrow}</span>
            <h2>{t.antiTitle}</h2>
            <ul className="help-list">
              {t.antiPatterns.map((pattern) => (
                <li key={pattern}>{pattern}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.connectionGuidesEyebrow}</span>
          <h2>{t.connectionGuidesTitle}</h2>
        </div>
        <div className="help-grid help-grid--three">
          <article className="help-card">
            <div className="help-card__section">
              <h3>{t.databricksGuideTitle}</h3>
              <ol className="help-list help-list--ordered">
                {t.databricksGuideSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </article>
          <article className="help-card">
            <div className="help-card__section">
              <h3>{t.fabricGuideTitle}</h3>
              <ol className="help-list help-list--ordered">
                {t.fabricGuideSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </article>
          <article className="help-card">
            <div className="help-card__section">
              <h3>{t.snapshotGuideTitle}</h3>
              <ol className="help-list help-list--ordered">
                {t.snapshotGuideSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </article>
        </div>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">{t.quickEyebrow}</span>
          <h2>{t.quickTitle}</h2>
        </div>
        <div className="positioning-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">{t.rulesKicker}</span>
            <h3>PostgreSQL con vistas activas</h3>
            <p>{t.rulesText}</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">{t.engineKicker}</span>
            <h3>dbt, SQL, notebooks o pipelines</h3>
            <p>{t.engineText}</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">{t.outputKicker}</span>
            <h3>Marts, semantic layer, BI</h3>
            <p>{t.outputText}</p>
          </article>
        </div>
      </section>
    </main>
  );
}