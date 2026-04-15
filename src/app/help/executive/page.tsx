import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

export default async function ExecutiveHelpPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpExecutive;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/executive" />
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
            <span className="eyebrow">{t.summaryEyebrow}</span>
            <h2>{t.summaryTitle}</h2>
            <ul className="help-list">
              {t.executiveMessages.map((message) => (
                <li key={message}>{message}</li>
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
      <section className="help-faq">
        <div className="help-faq__list">
          {t.faqItems.map((item) => (
            <article key={item.question} className="help-card">
              <div className="help-card__section">
                <span className="eyebrow">{t.questionEyebrow}</span>
                <h2>{item.question}</h2>
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}