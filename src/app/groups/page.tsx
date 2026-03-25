import { DataFilterForm } from "@/components/data-filter-form";
import { GroupCreateForm } from "@/components/group-create-form";
import { GroupEditTable } from "@/components/group-edit-table";
import { getActiveGroups } from "@/lib/mdm";

type GroupsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const items = await getActiveGroups(search);

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Vista Operativa</span>
          <h1>Agrupaciones activas</h1>
          <p>
            Reglas de agrupacion aprobadas, activas y vigentes listas para reporting o consolidacion.
          </p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{items.length} registros</span>
          <span className="metric-pill">Fuente: vw_mdm_group_rule_active</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <DataFilterForm placeholder="Buscar por miembro, grupo o rule set" defaultValue={search} />
      </section>

      <GroupCreateForm />

      <section className="table-panel">
        <GroupEditTable items={items} />
      </section>
    </main>
  );
}