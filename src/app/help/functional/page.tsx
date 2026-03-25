import Link from "next/link";

import { HelpNav } from "@/components/help-nav";

const sqlExample = `select
  f.invoice_id,
  f.customer_name as customer_source,
  coalesce(m.target_value, f.customer_name) as customer_canonical,
  g.group_value as customer_group,
  cast(p.parameter_value as numeric) as pvp_factor
from staging_sales f
left join vw_mdm_mapping_rule_active m
  on m.entity_type_code = 'CLIENT'
 and m.source_key = 'customer_name'
 and m.source_value = f.customer_name
left join vw_mdm_group_rule_active g
  on g.entity_type_code = 'CLIENT'
 and g.member_value = coalesce(m.target_value, f.customer_name)
left join vw_mdm_parameter_active p
  on p.parameter_key = 'PVP_FACTOR'
 and p.domain = 'ventas_perseida'
 and p.parameter_scope_type = 'CLIENT'
 and p.parameter_scope_value = coalesce(m.target_value, f.customer_name);`;

const pythonExample = `import pandas as pd
import sqlalchemy as sa

engine = sa.create_engine(DATABASE_URL)

sales = pd.read_sql("select * from staging_sales", engine)
mappings = pd.read_sql("select * from vw_mdm_mapping_rule_active", engine)
groups = pd.read_sql("select * from vw_mdm_group_rule_active", engine)
parameters = pd.read_sql(
    "select * from vw_mdm_parameter_active where parameter_key = 'PVP_FACTOR'",
    engine,
)

sales = sales.merge(
    mappings[["source_value", "target_value"]],
    how="left",
    left_on="customer_name",
    right_on="source_value",
)

sales["customer_canonical"] = sales["target_value"].fillna(sales["customer_name"])

sales = sales.merge(
    groups[["member_value", "group_value"]],
    how="left",
    left_on="customer_canonical",
    right_on="member_value",
)

client_parameters = parameters[
    parameters["parameter_scope_type"] == "CLIENT"
][["parameter_scope_value", "parameter_value"]]

sales = sales.merge(
    client_parameters,
    how="left",
    left_on="customer_canonical",
    right_on="parameter_scope_value",
)

sales["pvp_factor"] = sales["parameter_value"].fillna("1.00").astype(float)
sales["adjusted_price"] = sales["net_price"] * sales["pvp_factor"]`;

const dbtExample = `with sales as (
    select * from {{ ref('stg_sales') }}
),

mappings as (
    select * from {{ source('mdm', 'vw_mdm_mapping_rule_active') }}
),

groups as (
    select * from {{ source('mdm', 'vw_mdm_group_rule_active') }}
),

parameters as (
    select * from {{ source('mdm', 'vw_mdm_parameter_active') }}
    where parameter_key = 'PVP_FACTOR'
      and domain = 'ventas_perseida'
),

final as (
    select
        s.*,
        coalesce(m.target_value, s.customer_name) as customer_canonical,
        g.group_value as customer_group,
        cast(p.parameter_value as numeric) as pvp_factor
    from sales s
    left join mappings m
      on m.entity_type_code = 'CLIENT'
     and m.source_key = 'customer_name'
     and m.source_value = s.customer_name
    left join groups g
      on g.entity_type_code = 'CLIENT'
     and g.member_value = coalesce(m.target_value, s.customer_name)
    left join parameters p
      on p.parameter_scope_type = 'CLIENT'
     and p.parameter_scope_value = coalesce(m.target_value, s.customer_name)
)

select * from final`;

const contractViews = [
  {
    name: "vw_mdm_mapping_rule_active",
    purpose: "Contrato de lectura para homologar valores origen hacia un canonico antes de consolidar o cargar.",
  },
  {
    name: "vw_mdm_group_rule_active",
    purpose: "Contrato de lectura para agrupar valores ya homologados dentro de una familia comercial o analitica.",
  },
  {
    name: "vw_mdm_parameter_active",
    purpose: "Contrato de lectura para aplicar factores, flags o configuraciones por dominio y alcance.",
  },
];

const exampleRows = [
  {
    stage: "Entrada cruda",
    clientSource: "ALDI PORTUGAL",
    groupSource: "ALDI PORTUGAL",
    factorSource: "sin resolver",
    priceSource: "100.00",
    outcome: "Todavia no sirve para reporting porque depende del nombre tal como viene del origen.",
  },
  {
    stage: "Tras equivalencia",
    clientSource: "ALDI",
    groupSource: "ALDI",
    factorSource: "sin resolver",
    priceSource: "100.00",
    outcome: "El cliente ya queda homologado al nombre canonico esperado por el modelo analitico.",
  },
  {
    stage: "Tras agrupacion",
    clientSource: "ALDI",
    groupSource: "GRUPO ALDI",
    factorSource: "sin resolver",
    priceSource: "100.00",
    outcome: "Ahora puede consolidarse en dashboards por grupo comercial y no solo por cliente individual.",
  },
  {
    stage: "Tras parametro",
    clientSource: "ALDI",
    groupSource: "GRUPO ALDI",
    factorSource: "1.08",
    priceSource: "108.00",
    outcome: "El ETL aplica el factor vigente y deja el dato listo para carga analitica o downstream.",
  },
];

const optionCards = [
  {
    title: "Equivalencias",
    href: "/mappings",
    whatItIs: "Relaciona un valor origen con un valor canonico o destino para evitar hardcode en procesos y reportes.",
    administration: "Se carga cuando un codigo o descripcion externa no coincide con el estandar interno. El admin define desde cuando vale la regla y cual es el valor homologado.",
    fields: ["Entidad", "Clave origen", "Valor origen", "Valor destino", "Vigencia"],
    realUse: "En un ETL de ventas, si el ERP manda 'ALDI PORTUGAL' y el modelo analitico espera 'ALDI', la equivalencia resuelve la traduccion antes de cargar el fact table.",
  },
  {
    title: "Agrupaciones",
    href: "/groups",
    whatItIs: "Agrupa multiples valores operativos dentro de una familia comercial o analitica comun.",
    administration: "Se usa cuando varios clientes, materiales o codigos deben consolidarse bajo una misma vista de negocio. El admin indica miembro, grupo y vigencia.",
    fields: ["Miembro", "Grupo", "Etiqueta de grupo", "Rule set", "Vigencia"],
    realUse: "En un ETL de clientes, 'EROSKI S.COOP.' y otras variantes pueden terminar en el grupo 'EROSKY' para reporting regional o acuerdos comerciales.",
  },
  {
    title: "Parametros",
    href: "/parameters",
    whatItIs: "Guarda valores de configuracion de negocio que cambian con el tiempo o por contexto, sin tocar codigo.",
    administration: "Se mantiene cuando una regla depende de un factor, porcentaje o flag por cliente, canal, pais o dominio. El admin define clave, valor, alcance y vigencia.",
    fields: ["Clave", "Valor", "Dominio", "Tipo de alcance", "Valor de alcance", "Vigencia"],
    realUse: "En un ETL de pricing, un parametro como 'PVP_FACTOR' puede valer 1.09 para MARJANE y 0.97 para PRIMOR, y el proceso lo consulta al transformar precios.",
  },
  {
    title: "Importacion",
    href: "/imports",
    whatItIs: "Permite cargar lotes demo o archivos manuales csv/xlsx para poblar reglas sin entrar una por una.",
    administration: "Se usa cuando llega un archivo del negocio o cuando se quiere reponer un set base. El admin elige tipo de dato, sube el archivo y revisa el resultado.",
    fields: ["Tipo de carga", "Archivo", "Resultado", "Cantidad insertada o actualizada"],
    realUse: "En un proceso ETL operativo, negocio entrega un Excel con nuevas homologaciones y el admin lo importa antes de la corrida nocturna.",
  },
];

const etlSteps = [
  "El sistema fuente entrega datos crudos con codigos y descripciones no normalizadas.",
  "El ETL extrae esos datos y consulta MDM Lite para buscar equivalencias, agrupaciones y parametros vigentes.",
  "Durante la transformacion, el ETL reemplaza valores origen, consolida grupos y aplica parametros por alcance.",
  "El resultado ya normalizado se carga en tablas analiticas, marts o modelos de reporting.",
  "Si aparece un valor nuevo no contemplado, el admin lo carga en MDM Lite y la siguiente corrida ya lo resuelve sin cambiar codigo.",
];

const operatingRules = [
  "Alta manual simple: util para correcciones puntuales o pruebas controladas.",
  "Importacion por archivo: util para volumen, onboarding inicial o mantenimiento periodico.",
  "Vigencia: cada regla debe tener una fecha desde la cual aplica; eso evita sobreescribir historia sin control.",
  "Consumo tecnico: el ETL deberia leer siempre desde las vistas activas para no depender de tablas internas.",
  "Cambio controlado: cuando cambie una regla, conviene crear nueva vigencia antes que editar historia pasada.",
];

export default function FunctionalHelpPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/functional" />
      <section className="section-head">
        <div>
          <span className="eyebrow">Help / Guia Funcional</span>
          <h1>Que hace cada opcion y como usarla en un caso real de ETL</h1>
          <p>
            Esta guia mantiene el foco original: explicar el sentido funcional de cada modulo, que datos se
            cargan, como se administran y como se consumen desde procesos tecnicos clasicos.
          </p>
        </div>
      </section>
      <section className="help-grid">
        {optionCards.map((card) => (
          <article key={card.title} className="help-card">
            <div className="help-card__head">
              <div>
                <span className="eyebrow">Opcion del menu</span>
                <h2>{card.title}</h2>
              </div>
              <Link href={card.href} className="hero-link">
                Abrir opcion
              </Link>
            </div>
            <div className="help-card__section">
              <h3>Que es</h3>
              <p>{card.whatItIs}</p>
            </div>
            <div className="help-card__section">
              <h3>Como se administra</h3>
              <p>{card.administration}</p>
            </div>
            <div className="help-card__section">
              <h3>Que se pone</h3>
              <ul className="help-list">
                {card.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
            <div className="help-card__section">
              <h3>Uso real en ETL</h3>
              <p>{card.realUse}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="help-flow table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">Flujo Practico</span>
          <h2>Como entraria en un ETL real</h2>
          <p>Este sigue siendo el recorrido base del MVP cuando lo consumes desde un DW clasico o un proceso batch tradicional.</p>
        </div>
        <ol className="help-steps">
          {etlSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">Ejemplo Detallado</span>
          <h2>Antes y despues en una corrida ETL</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table help-example-table">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Cliente canonico</th>
                <th>Grupo comercial</th>
                <th>Factor aplicado</th>
                <th>Precio resultante</th>
                <th>Lectura funcional</th>
              </tr>
            </thead>
            <tbody>
              {exampleRows.map((row) => (
                <tr key={row.stage}>
                  <td>{row.stage}</td>
                  <td>{row.clientSource}</td>
                  <td>{row.groupSource}</td>
                  <td>{row.factorSource}</td>
                  <td>{row.priceSource}</td>
                  <td>{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="help-contracts">
        <div className="section-head">
          <div>
            <span className="eyebrow">Contrato Tecnico</span>
            <h1>Vistas que deberia consumir un proceso</h1>
            <p>El contrato recomendado para v0.1 se apoya en vistas activas y no en tablas internas.</p>
          </div>
        </div>
        <div className="help-faq__list">
          {contractViews.map((view) => (
            <article key={view.name} className="help-card">
              <div className="help-card__section">
                <h2>{view.name}</h2>
                <p>{view.purpose}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="help-code-grid">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Uso desde SQL</span>
            <h2>Consulta relacional</h2>
            <pre className="code-sample"><code>{sqlExample}</code></pre>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Uso desde Python</span>
            <h2>Script batch o notebook</h2>
            <pre className="code-sample"><code>{pythonExample}</code></pre>
          </div>
        </article>
      </section>
      <section className="help-code-grid help-code-grid--single">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Uso desde dbt</span>
            <h2>Modelo enriquecido</h2>
            <pre className="code-sample"><code>{dbtExample}</code></pre>
          </div>
        </article>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Buenas practicas</span>
            <h2>Como administrarlo bien</h2>
            <ul className="help-list">
              {operatingRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Siguiente lectura</span>
            <h2>Para audiencias modernas de data platform</h2>
            <p>
              Si la conversacion gira hacia Databricks, Fabric, Snowflake, medallion o ELT, conviene seguir con la pagina dedicada a esos patrones.
            </p>
            <div className="hero-actions">
              <Link href="/help/platforms" className="hero-link hero-link--primary">Ver medallion y ELT</Link>
              <Link href="/help/positioning" className="hero-link">Ver posicionamiento</Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}