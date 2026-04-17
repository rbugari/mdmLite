import { DataFilterForm } from "@/components/data-filter-form";
import { PaginationControls } from "@/components/pagination-controls";
import { ParameterCreateForm } from "@/components/parameter-create-form";
import { ParameterEditTable } from "@/components/parameter-edit-table";
import { requireAdminPage } from "@/lib/auth-server";
import { getCopy } from "@/lib/copy";
import { getActiveParameters } from "@/lib/mdm";
import { getRequestPreferences } from "@/lib/request-preferences";

export const dynamic = "force-dynamic";

type ParametersPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    domain?: string;
    scopeType?: string;
  }>;
};

export default async function ParametersPage({ searchParams }: ParametersPageProps) {
  await requireAdminPage("/parameters");
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const page = Number(params.page ?? "1");
  const pageSize = Number(params.pageSize ?? "25");
  const domain = params.domain?.trim() ?? "";
  const scopeType = params.scopeType?.trim() ?? "";

  const result = await getActiveParameters(search, {
    page,
    pageSize,
    domain: domain || undefined,
    scopeType: scopeType || undefined,
  });
  const { language } = await getRequestPreferences();
  const t = getCopy(language).parametersPage;
  const filterCopy = getCopy(language).forms;

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{result.total} {t.recordsLabel}</span>
          <span className="metric-pill">{t.sourceLabel}</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <DataFilterForm
          placeholder={t.filterPlaceholder}
          defaultValue={search}
          submitLabel={filterCopy.filterSubmit}
        />
        <form method="get" className="inline-form-grid inline-form-grid--tight" style={{ marginTop: 10 }}>
          <input type="hidden" name="q" value={search} />
          <label className="form-field">
            <span>Domain</span>
            <input name="domain" defaultValue={domain} placeholder="ventas_perseida" />
          </label>
          <label className="form-field">
            <span>Scope type</span>
            <input name="scopeType" defaultValue={scopeType} placeholder="CLIENT" />
          </label>
          <label className="form-field">
            <span>Page size</span>
            <select name="pageSize" defaultValue={String(result.pageSize)}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <div className="form-actions form-field--full">
            <button type="submit" className="hero-link">Apply</button>
          </div>
        </form>
        <PaginationControls
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
          pathname="/parameters"
          query={{ q: search, domain, scopeType }}
        />
      </section>

      <ParameterCreateForm />

      <section className="table-panel">
        <ParameterEditTable items={result.items} />
      </section>
    </main>
  );
}