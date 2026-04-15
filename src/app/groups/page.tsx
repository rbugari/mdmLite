import { DataFilterForm } from "@/components/data-filter-form";
import { GroupCreateForm } from "@/components/group-create-form";
import { GroupEditTable } from "@/components/group-edit-table";
import { PaginationControls } from "@/components/pagination-controls";
import { getCopy } from "@/lib/copy";
import { getActiveGroups } from "@/lib/mdm";
import { getRequestPreferences } from "@/lib/request-preferences";

type GroupsPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    entity?: string;
    ruleSet?: string;
  }>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const page = Number(params.page ?? "1");
  const pageSize = Number(params.pageSize ?? "25");
  const entity = params.entity?.trim() ?? "";
  const ruleSet = params.ruleSet?.trim() ?? "";

  const result = await getActiveGroups(search, {
    page,
    pageSize,
    entityTypeCode: entity || undefined,
    ruleSetCode: ruleSet || undefined,
  });
  const { language } = await getRequestPreferences();
  const t = getCopy(language).groupsPage;
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
            <span>Entity</span>
            <input name="entity" defaultValue={entity} placeholder="CLIENT" />
          </label>
          <label className="form-field">
            <span>Rule set</span>
            <input name="ruleSet" defaultValue={ruleSet} placeholder="ventas_perseida_clientes" />
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
          pathname="/groups"
          query={{ q: search, entity, ruleSet }}
        />
      </section>

      <GroupCreateForm />

      <section className="table-panel">
        <GroupEditTable items={result.items} />
      </section>
    </main>
  );
}