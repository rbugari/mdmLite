import { HelpNav } from "@/components/help-nav";

const medallionRows = [
  {
    layer: "Bronze / Raw",
    role: "Conservar el dato tal como llega desde la fuente.",
    mdmUsage: "Normalmente MDM Lite no modifica Bronze. A lo sumo sirve para detectar valores nuevos que todavia no estan mapeados.",
  },
  {
    layer: "Silver / Cleansed",
    role: "Normalizar, enriquecer y dejar el dato usable para modelos posteriores.",
    mdmUsage: "Este es el lugar natural para aplicar equivalencias, agrupaciones y parametros. Aca MDM Lite agrega mas valor.",
  },
  {
    layer: "Gold / Business-ready",
    role: "Publicar datasets curados para BI, semantic layer o consumo de negocio.",
    mdmUsage: "Gold recibe el dato ya homologado desde Silver. MDM Lite no suele operar directo aca, pero su efecto se ve clarisimo en dashboards y metricas.",
  },
];

const platformPatterns = [
  {
    platform: "Databricks",
    pattern: "Tablas o vistas curadas en Unity Catalog, notebooks o jobs que leen reglas desde PostgreSQL o desde una replica controlada.",
  },
  {
    platform: "Microsoft Fabric",
    pattern: "Dataflows, notebooks o pipelines que consultan vistas activas para enriquecer capas Silver y Gold.",
  },
  {
    platform: "Snowflake",
    pattern: "ELT en SQL o dbt consumiendo vistas activas para normalizacion antes de marts o semantic models.",
  },
];

const eltMessages = [
  "En ELT, la transformacion vive dentro del engine analitico, pero igual necesita una fuente de reglas estable.",
  "MDM Lite no impone un runtime: puede alimentar SQL, dbt, notebooks, stored procedures o pipelines orquestados.",
  "El patron correcto es exponer reglas simples como datos consultables, no como codigo repetido en cada modelo.",
  "En lakehouse y warehouse modernos, el problema sigue existiendo: nombres distintos, grupos comerciales y factores funcionales siguen apareciendo.",
];

const recommendedPatterns = [
  "Tratar MDM Lite como reference dataset externo y estable.",
  "Aplicar equivalencias primero, luego agrupaciones y al final parametros.",
  "Resolver transformaciones en Silver o en la capa intermedia equivalente.",
  "Publicar Gold o marts ya con datos canonicos y reglas aplicadas.",
  "Mantener el contrato tecnico en vistas para no acoplar pipelines a tablas internas.",
];

const antiPatterns = [
  "Aplicar reglas distintas en cada notebook o modelo sin una fuente comun.",
  "Mantener homologaciones en hojas sueltas fuera del pipeline controlado.",
  "Usar Gold como lugar para corregir nombres que debieron resolverse antes.",
  "Embeber listas de equivalencias en codigo Python, SQL o YAML disperso.",
  "Acoplarse a tablas internas en lugar de vistas activas.",
];

export default function PlatformsHelpPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/platforms" />
      <section className="section-head">
        <div>
          <span className="eyebrow">Help / Medallion y ELT</span>
          <h1>Como encaja en Databricks, Fabric, Snowflake y arquitecturas modernas</h1>
          <p>
            Esta pagina traduce el MVP a lenguajes mas actuales: medallion, ELT, lakehouse, semantic layer y pipelines modernos.
          </p>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Mensaje central</span>
            <h2>Medallion no elimina la necesidad de reglas maestras</h2>
            <p>
              Aunque cambie el stack, siguen llegando nombres inconsistentes, codigos externos, agrupaciones de negocio y parametros que cambian en el tiempo.
            </p>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">ELT</span>
            <h2>Que cambia frente al ETL clasico</h2>
            <ul className="help-list">
              {eltMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">Mapa visual</span>
          <h2>Ubicacion tipica en arquitectura medallion</h2>
        </div>
        <div className="medallion-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">Bronze</span>
            <h3>Raw ingest</h3>
            <p>Entrada casi intacta desde ERP, CRM, archivos o APIs.</p>
          </article>
          <div className="diagram-arrow">→</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">Silver</span>
            <h3>Normalizacion con MDM Lite</h3>
            <p>Homologacion, agrupacion y parametros antes de publicar datasets curados.</p>
          </article>
          <div className="diagram-arrow">→</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">Gold</span>
            <h3>Consumo de negocio</h3>
            <p>Dashboards, marts, semantic models y analitica sobre valores canonicos.</p>
          </article>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">Medallion</span>
          <h2>En que capa vive el valor de MDM Lite</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Rol</th>
                <th>Uso recomendado de MDM Lite</th>
              </tr>
            </thead>
            <tbody>
              {medallionRows.map((row) => (
                <tr key={row.layer}>
                  <td>{row.layer}</td>
                  <td>{row.role}</td>
                  <td>{row.mdmUsage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">Plataformas</span>
          <h2>Patrones tipicos por ecosistema</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plataforma</th>
                <th>Patron de integracion</th>
              </tr>
            </thead>
            <tbody>
              {platformPatterns.map((row) => (
                <tr key={row.platform}>
                  <td>{row.platform}</td>
                  <td>{row.pattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Patron recomendado</span>
            <h2>Como integrarlo bien</h2>
            <ul className="help-list">
              {recommendedPatterns.map((pattern) => (
                <li key={pattern}>{pattern}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Anti-patrones</span>
            <h2>Que conviene evitar</h2>
            <ul className="help-list">
              {antiPatterns.map((pattern) => (
                <li key={pattern}>{pattern}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
      <section className="help-diagram help-diagram-card">
        <div className="form-header">
          <span className="eyebrow">Lectura rapida</span>
          <h2>Patron moderno resumido</h2>
        </div>
        <div className="positioning-diagram">
          <article className="diagram-block">
            <span className="diagram-block__kicker">Fuente de reglas</span>
            <h3>PostgreSQL con vistas activas</h3>
            <p>Contrato estable y desacoplado de tablas internas.</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block diagram-block--accent">
            <span className="diagram-block__kicker">Motor de transformacion</span>
            <h3>dbt, SQL, notebooks o pipelines</h3>
            <p>Aplicacion centralizada de reglas en la capa intermedia.</p>
          </article>
          <div className="diagram-arrow">↓</div>
          <article className="diagram-block">
            <span className="diagram-block__kicker">Salida</span>
            <h3>Marts, semantic layer, BI</h3>
            <p>Consumo uniforme sobre datos ya homologados.</p>
          </article>
        </div>
      </section>
    </main>
  );
}