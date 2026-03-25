import { ImportsConsole } from "@/components/imports-console";

export default function ImportsPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Operacion</span>
          <h1>Importacion de datos</h1>
          <p>
            Consola inicial para reimportar el dataset demo del proyecto o cargar archivos manuales `csv/xlsx`
            hacia equivalencias, agrupaciones y parametros.
          </p>
        </div>
      </section>

      <ImportsConsole />
    </main>
  );
}