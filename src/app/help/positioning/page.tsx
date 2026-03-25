import { HelpNav } from "@/components/help-nav";

const complementRows = [
  {
    tool: "Purview / Microsoft Purview",
    strength: "Catalogo, lineage, gobierno, clasificacion y visibilidad transversal.",
    gap: "No esta pensado para operar equivalencias, agrupaciones o parametros de negocio pequenos en el dia a dia.",
    mdmLiteRole: "MDM Lite vive abajo de ese nivel: administra reglas concretas que un ETL necesita consultar en tiempo de transformacion.",
  },
  {
    tool: "Unity Catalog",
    strength: "Gobierno de datos, permisos, catalogacion y control sobre activos de Databricks.",
    gap: "No resuelve por si solo el mantenimiento operativo de reglas funcionales tipo nombre canonico, grupo comercial o factor por cliente.",
    mdmLiteRole: "MDM Lite puede publicar tablas o vistas gobernadas dentro del ecosistema gobernado por Unity Catalog.",
  },
  {
    tool: "Collibra / Alation / catalogos similares",
    strength: "Definiciones de negocio, ownership, discovery y governance operating model.",
    gap: "Suelen estar mas orientados a metadata y gobierno que a una operacion simple de reglas con alta, edicion e integracion inmediata en pipelines.",
    mdmLiteRole: "MDM Lite cubre el hueco operativo entre la definicion conceptual y la aplicacion tecnica de la regla.",
  },
];

const competitorRows = [
  {
    type: "MDM enterprise clasico",
    examples: "Informatica MDM, Reltio, Semarchy xDM, Profisee, SAP MDG",
    fit: "Compiten en el espacio amplio de master data management, workflow, golden record, survivorship y gobierno avanzado.",
    difference: "MDM Lite no intenta cubrir ese ancho. Gana cuando el problema real es mas pequeno, puntual y orientado a consumo tecnico rapido.",
  },
  {
    type: "Reference data manager especifico",
    examples: "soluciones de RDM o implementaciones ligeras sobre tablas y APIs",
    fit: "Compiten mas directamente cuando el objetivo es mantener catalogos operativos y reglas simples.",
    difference: "MDM Lite busca ser mas claro, explicable y listo para ETL que una coleccion dispersa de tablas custom.",
  },
  {
    type: "Implementacion casera",
    examples: "Excel compartido, CSV versionados, tablas sueltas en un schema utilitario",
    fit: "Es la alternativa real mas comun en equipos pequenos o medianos.",
    difference: "Ahi la simplicidad es un valor enorme: MDM Lite ordena ese caos con una UI minima, vigencia y contratos de lectura estables.",
  },
];

const simplicityPoints = [
  "Menor costo de adopcion: un admin puede entenderlo y usarlo rapido.",
  "Menor complejidad tecnica: vistas SQL y formularios simples en lugar de plataformas pesadas.",
  "Menor friccion con data engineering: el consumo tecnico es obvio y directo.",
  "Mejor encaje en equipos que todavia no justifican un MDM enterprise.",
  "Valor alto para huecos pequenos pero recurrentes: homologaciones, grupos y parametros funcionales.",
];

const positioningMessages = [
  "No competimos con herramientas de catalogo y gobierno; las complementamos.",
  "No reemplazamos lineage, permisos, clasificacion, ownership ni discovery.",
  "Competimos de verdad contra soluciones demasiado pesadas o contra el caos de Excel + tablas sueltas.",
  "La propuesta de valor no es amplitud funcional, sino velocidad, claridad y simplicidad operativa.",
];

export default function PositioningHelpPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/positioning" />
      <section className="section-head">
        <div>
          <span className="eyebrow">Help / Posicionamiento</span>
          <h1>Como se posiciona frente a Purview, Unity Catalog y otras herramientas</h1>
          <p>
            Esta pagina deja claro donde encaja MDM Lite para que no se lea como competidor de plataformas de gobierno o catalogo.
          </p>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Mensaje central</span>
            <h2>Complemento, no reemplazo</h2>
            <ul className="help-list">
              {positioningMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Lectura recomendada</span>
            <h2>Como explicarlo rapido</h2>
            <p>
              Purview, Unity Catalog o Collibra gobiernan el ecosistema de datos. MDM Lite opera reglas chicas y criticas que el ETL necesita aplicar de verdad.
            </p>
          </div>
        </article>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">Mapa visual</span>
          <h2>Donde se ubica MDM Lite</h2>
        </div>
        <div className="positioning-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">Gobierno y catalogo</span>
            <h3>Purview, Unity Catalog, Collibra</h3>
            <p>Descubrimiento, ownership, permisos, lineage y visibilidad transversal.</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">Operacion de reglas</span>
            <h3>MDM Lite</h3>
            <p>Equivalencias, agrupaciones y parametros vigentes usados por transformaciones reales.</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">Consumo</span>
            <h3>SQL, dbt, Python, notebooks, pipelines</h3>
            <p>Aplicacion consistente de reglas en ETL, ELT, marts y semantic layers.</p>
          </article>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">Comparacion</span>
          <h2>Con que se complementa</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Herramienta</th>
                <th>Valor principal</th>
                <th>Hueco habitual</th>
                <th>Rol de MDM Lite</th>
              </tr>
            </thead>
            <tbody>
              {complementRows.map((row) => (
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
          <span className="eyebrow">Competencia</span>
          <h2>Con quien si competimos</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Ejemplos</th>
                <th>Donde compite</th>
                <th>Diferencia de MDM Lite</th>
              </tr>
            </thead>
            <tbody>
              {competitorRows.map((row) => (
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
            <span className="eyebrow">Valor</span>
            <h2>Por que la simplicidad importa</h2>
            <ul className="help-list">
              {simplicityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Frase corta</span>
            <h2>Como resumir el encaje</h2>
            <p>
              Purview o Unity Catalog te dicen que datos existen, quien los gobierna y como se controlan. MDM Lite te ayuda a decidir como transformar ciertos valores de negocio para que esos datos sean consumibles de manera consistente.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}