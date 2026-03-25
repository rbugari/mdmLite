import { DataFilterForm } from "@/components/data-filter-form";
import { ParameterCreateForm } from "@/components/parameter-create-form";
import { ParameterEditTable } from "@/components/parameter-edit-table";
import { getActiveParameters } from "@/lib/mdm";

type ParametersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function ParametersPage({ searchParams }: ParametersPageProps) {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const items = await getActiveParameters(search);

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Vista Operativa</span>
          <h1>Parametros activos</h1>
          <p>
            Parametros vigentes expuestos con alcance funcional simple. El demo actual refleja factores PVP por
            cliente.
          </p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{items.length} registros</span>
          <span className="metric-pill">Fuente: vw_mdm_parameter_active</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <DataFilterForm placeholder="Buscar por clave, dominio o alcance" defaultValue={search} />
      </section>

      <ParameterCreateForm />

      <section className="table-panel">
        <ParameterEditTable items={items} />
      </section>
    </main>
  );
}