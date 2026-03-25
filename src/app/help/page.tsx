import Link from "next/link";

import { HelpNav } from "@/components/help-nav";

const sections = [
  {
    title: "FAQ ejecutiva",
    href: "/help/executive",
    text: "Resume en lenguaje ejecutivo que problema resuelve MDM Lite, con quien compite de verdad y por que no reemplaza Purview, Unity Catalog o catalogos corporativos.",
  },
  {
    title: "Guia funcional",
    href: "/help/functional",
    text: "Explica que hace cada modulo, como se carga la informacion y como entra MDM Lite en una corrida ETL tradicional.",
  },
  {
    title: "Posicionamiento",
    href: "/help/positioning",
    text: "Aclara que MDM Lite no compite con Purview, Unity Catalog u otras herramientas de catalogo y gobierno. Se posiciona como complemento operativo.",
  },
  {
    title: "Medallion y ELT",
    href: "/help/platforms",
    text: "Baja el uso del producto a contextos modernos como Databricks, Fabric o Snowflake con enfoque medallion, lakehouse y ELT.",
  },
];

const keyIdeas = [
  {
    message: "MDM Lite cubre un hueco operativo entre el dato crudo y el modelo consumible: homologaciones, agrupaciones y parametros con vigencia.",
  },
  {
    message: "No reemplaza catalogo, gobierno, lineage, permisos ni descubrimiento de datos; eso sigue viviendo en plataformas como Purview, Unity Catalog o Collibra.",
  },
  {
    message: "Su valor esta en la simplicidad: una capa pequena, entendible y operable por negocio o data stewardship sin abrir una plataforma MDM enterprise.",
  },
  {
    message: "La integracion tecnica se apoya en contratos estables por vistas SQL, utiles para SQL clasico, Python, dbt, notebooks o pipelines ELT.",
  },
];

const audienceRoutes = [
  {
    audience: "Negocio y sponsors",
    title: "Entrar por valor y alcance",
    text: "Ideal para explicar rapido que problema resuelve, por que no es un MDM enterprise y con quien compite de verdad.",
    href: "/help/executive",
    cta: "Abrir FAQ ejecutiva",
  },
  {
    audience: "Arquitectura y gobierno",
    title: "Entrar por posicionamiento",
    text: "Aclara la relacion con Purview, Unity Catalog, Collibra y otras piezas de catalogo, metadata o gobierno.",
    href: "/help/positioning",
    cta: "Ver posicionamiento",
  },
  {
    audience: "Data engineering",
    title: "Entrar por integracion tecnica",
    text: "Baja el producto a ETL, ELT, medallion, dbt, notebooks, Databricks, Fabric y Snowflake.",
    href: "/help/platforms",
    cta: "Ver medallion y ELT",
  },
];

const quickStart = [
  "Entender el producto en 3 minutos: FAQ ejecutiva.",
  "Responder si compite o complementa a Purview o Unity Catalog: Posicionamiento.",
  "Mostrar encaje en pipelines modernos: Medallion y ELT.",
  "Entender pantallas, altas, ediciones y uso funcional: Guia funcional.",
];

export default function HelpOverviewPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help" />
      <section className="section-head">
        <div>
          <span className="eyebrow">Help / Centro de Conocimiento</span>
          <h1>Como entender MDM Lite desde negocio, data engineering y arquitectura</h1>
          <p>
            Esta seccion ya no es solo una ayuda de pantalla. Pasa a ser una explicacion de producto: que problema resuelve, donde encaja frente a otras herramientas y como se integra en entornos clasicos de DW y en modelos modernos tipo medallion, ELT o lakehouse.
          </p>
        </div>
      </section>
      <section className="help-hero">
        <article className="help-summary-card">
          <span className="eyebrow">Producto</span>
          <h2>Que es MDM Lite</h2>
          <p>
            Una capa liviana para administrar reglas maestras simples que los procesos tecnicos necesitan consultar todo el tiempo: equivalencias, agrupaciones y parametros vigentes.
          </p>
        </article>
        <article className="help-summary-card">
          <span className="eyebrow">Limite</span>
          <h2>Que no es</h2>
          <p>
            No es un catalogo corporativo, no es una plataforma de gobierno transversal y no es un MDM enterprise completo. Es un complemento simple que resuelve un hueco muy concreto y muy frecuente.
          </p>
        </article>
      </section>
      <section className="help-diagram-card help-portal-intro">
        <div className="help-card__head">
          <div>
            <span className="eyebrow">Entrada rapida</span>
            <h2>Elegir segun la audiencia</h2>
          </div>
        </div>
        <div className="help-audience-grid">
          {audienceRoutes.map((route) => (
            <article key={route.href} className="help-audience-card">
              <span className="eyebrow">{route.audience}</span>
              <h3>{route.title}</h3>
              <p>{route.text}</p>
              <Link href={route.href} className="hero-link hero-link--primary">
                {route.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Atajo</span>
            <h2>Si tienes una reunion y poco tiempo</h2>
            <ul className="help-list">
              {quickStart.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card help-card--accent">
          <div className="help-card__section">
            <span className="eyebrow">Lectura recomendada</span>
            <h2>Recorrido corto del portal</h2>
            <p>
              Empieza por FAQ ejecutiva para explicar el producto. Sigue por Posicionamiento si aparece la comparacion con catalogo o gobierno. Cierra con Medallion y ELT si la conversacion entra en arquitectura moderna.
            </p>
            <div className="hero-actions">
              <Link href="/help/executive" className="hero-link">
                FAQ ejecutiva
              </Link>
              <Link href="/help/platforms" className="hero-link">
                Medallion y ELT
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="help-faq">
        <div className="help-faq__list">
          {sections.map((section) => (
            <article key={section.href} className="help-card">
              <div className="help-card__head">
                <div>
                  <span className="eyebrow">Seccion</span>
                  <h2>{section.title}</h2>
                </div>
                <Link href={section.href} className="hero-link hero-link--primary">
                  Abrir
                </Link>
              </div>
              <div className="help-card__section">
                <p>{section.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Ideas clave</span>
            <h2>Mensajes que conviene dejar claros</h2>
            <ul className="help-list">
              {keyIdeas.map((idea) => (
                <li key={idea.message}>{idea.message}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Recomendacion</span>
            <h2>Como usar esta Help</h2>
            <p>
              Si la audiencia es funcional, empieza por Guia funcional. Si es arquitectura o gobierno, empieza por Posicionamiento. Si la audiencia es Databricks, Fabric o Snowflake, empieza por Medallion y ELT.
            </p>
            <div className="hero-actions">
              <Link href="/help/executive" className="hero-link">
                Ver FAQ ejecutiva
              </Link>
              <Link href="/help/functional" className="hero-link">
                Ver guia funcional
              </Link>
              <Link href="/help/positioning" className="hero-link">
                Ver posicionamiento
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}