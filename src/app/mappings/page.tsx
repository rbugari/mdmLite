import { DataFilterForm } from "@/components/data-filter-form";
import { MappingCreateForm } from "@/components/mapping-create-form";
import { MappingEditTable } from "@/components/mapping-edit-table";
import { getActiveMappings } from "@/lib/mdm";

type MappingsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function MappingsPage({ searchParams }: MappingsPageProps) {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const items = await getActiveMappings(search);

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Vista Operativa</span>
          <h1>Equivalencias activas</h1>
          <p>
            Reglas aprobadas, activas y vigentes listas para consumo tecnico. Esta vista ya lee desde la base
            remota de Supabase.
          </p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{items.length} registros</span>
          <span className="metric-pill">Fuente: vw_mdm_mapping_rule_active</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <DataFilterForm placeholder="Buscar por origen, destino o rule set" defaultValue={search} />
      </section>

      <MappingCreateForm />

      <section className="table-panel">
        <MappingEditTable items={items} />
      </section>
    </main>
  );
}