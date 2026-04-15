import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

export default async function PositioningHelpPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpPositioning;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/positioning" />
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
            <ul className="help-list">
              {t.positioningMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.readingEyebrow}</span>
            <h2>{t.readingTitle}</h2>
            <p>{t.readingText}</p>
          </div>
        </article>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">{t.visualEyebrow}</span>
          <h2>{t.visualTitle}</h2>
        </div>
        <div className="positioning-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">{t.governanceKicker}</span>
            <h3>Purview, Unity Catalog, Collibra</h3>
            <p>{t.governanceText}</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">{t.operationsKicker}</span>
            <h3>MDM Lite</h3>
            <p>{t.operationsText}</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">{t.consumptionKicker}</span>
            <h3>SQL, dbt, Python, notebooks, pipelines</h3>
            <p>{t.consumptionText}</p>
          </article>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.complementEyebrow}</span>
          <h2>{t.complementTitle}</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {t.complementHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.complementRows.map((row) => (
                <tr key={row.tool}>
                  <td>{row.tool}</td>
                  <td>{row.strength}</td>
                  <td>{row.gap}</td>
                  <td>{row.mdmLiteRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.competitorsEyebrow}</span>
          <h2>{t.competitorsTitle}</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {t.competitorHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.competitorRows.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.examples}</td>
                  <td>{row.fit}</td>
                  <td>{row.difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.valueEyebrow}</span>
            <h2>{t.valueTitle}</h2>
            <ul className="help-list">
              {t.simplicityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.shortEyebrow}</span>
            <h2>{t.shortTitle}</h2>
            <p>{t.shortText}</p>
          </div>
        </article>
      </section>
    </main>
  );
}