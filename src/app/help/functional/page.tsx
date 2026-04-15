import Link from "next/link";

import { HelpNav } from "@/components/help-nav";
import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

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

export default async function FunctionalHelpPage() {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpFunctional;

  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/functional" />
      <section className="section-head">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </section>
      <section className="help-grid">
        {t.optionCards.map((card) => (
          <article key={card.title} className="help-card">
            <div className="help-card__head">
              <div>
                <span className="eyebrow">{t.optionEyebrow}</span>
                <h2>{card.title}</h2>
              </div>
              <Link href={card.href} className="hero-link">
                {t.openOption}
              </Link>
            </div>
            <div className="help-card__section">
              <h3>{t.whatItIsTitle}</h3>
              <p>{card.whatItIs}</p>
            </div>
            <div className="help-card__section">
              <h3>{t.administrationTitle}</h3>
              <p>{card.administration}</p>
            </div>
            <div className="help-card__section">
              <h3>{t.fieldsTitle}</h3>
              <ul className="help-list">
                {card.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
            <div className="help-card__section">
              <h3>{t.realUseTitle}</h3>
              <p>{card.realUse}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="help-flow table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.practicalEyebrow}</span>
          <h2>{t.practicalTitle}</h2>
          <p>{t.practicalText}</p>
        </div>
        <ol className="help-steps">
          {t.etlSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section className="help-examples table-panel table-panel--padded">
        <div className="form-header">
          <span className="eyebrow">{t.exampleEyebrow}</span>
          <h2>{t.exampleTitle}</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table help-example-table">
            <thead>
              <tr>
                {t.tableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.exampleRows.map((row) => (
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
            <span className="eyebrow">{t.contractEyebrow}</span>
            <h1>{t.contractTitle}</h1>
            <p>{t.contractText}</p>
          </div>
        </div>
        <div className="help-faq__list">
          {t.contractViews.map((view) => (
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
            <span className="eyebrow">{t.sqlEyebrow}</span>
            <h2>{t.sqlTitle}</h2>
            <pre className="code-sample"><code>{sqlExample}</code></pre>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.pythonEyebrow}</span>
            <h2>{t.pythonTitle}</h2>
            <pre className="code-sample"><code>{pythonExample}</code></pre>
          </div>
        </article>
      </section>
      <section className="help-code-grid help-code-grid--single">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.dbtEyebrow}</span>
            <h2>{t.dbtTitle}</h2>
            <pre className="code-sample"><code>{dbtExample}</code></pre>
          </div>
        </article>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.practicesEyebrow}</span>
            <h2>{t.practicesTitle}</h2>
            <ul className="help-list">
              {t.operatingRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">{t.nextEyebrow}</span>
            <h2>{t.nextTitle}</h2>
            <p>{t.nextText}</p>
            <div className="hero-actions">
              <Link href="/help/platforms" className="hero-link hero-link--primary">{t.platformsCta}</Link>
              <Link href="/help/positioning" className="hero-link">{t.positioningCta}</Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}