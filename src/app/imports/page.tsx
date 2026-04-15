import { ImportsConsole } from "@/components/imports-console";
import { requireAdminPage } from "@/lib/auth-server";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

export default async function ImportsPage() {
  await requireAdminPage("/imports");
  const { language } = await getRequestPreferences();
  const t = getCopy(language).importsPage;

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </section>

      <ImportsConsole />
    </main>
  );
}