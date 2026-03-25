import { HelpNav } from "@/components/help-nav";

const faqItems = [
  {
    question: "Que problema resuelve MDM Lite?",
    answer:
      "Resuelve un problema operativo muy comun: reglas pequenas pero criticas que suelen quedar dispersas entre Excel, tablas sueltas y codigo repetido. Centraliza equivalencias, agrupaciones y parametros con vigencia para que los pipelines consuman una version estable.",
  },
  {
    question: "Es un MDM enterprise?",
    answer:
      "No. No busca cubrir golden record, survivorship, workflow complejo, data stewardship extendido ni gobierno corporativo transversal. Cubre un caso mas acotado: reference data y reglas operativas listas para ser consumidas por ETL o ELT.",
  },
  {
    question: "Compite con Purview o Unity Catalog?",
    answer:
      "No de forma directa. Purview, Unity Catalog y herramientas similares gobiernan el ecosistema de datos. MDM Lite administra reglas concretas que ese ecosistema necesita aplicar cuando transforma datos de negocio.",
  },
  {
    question: "Con quien compite de verdad?",
    answer:
      "Compite con tres cosas: plataformas MDM demasiado grandes para el problema, soluciones RDM ligeras mas dispersas y la alternativa real mas comun que es Excel compartido mas tablas auxiliares sin contrato estable.",
  },
  {
    question: "Por que la simplicidad es una ventaja?",
    answer:
      "Porque reduce tiempo de adopcion, dependencia de especialistas y friccion con data engineering. Cuando el problema es puntual, una solucion acotada genera valor antes y con mucho menos costo operativo.",
  },
  {
    question: "Donde encaja en arquitecturas modernas?",
    answer:
      "Encaja en ETL clasico, en ELT, en medallion y en lakehouse. Normalmente se usa en la capa intermedia donde se homologan valores y se aplican reglas antes de publicar datasets curados o marts de negocio.",
  },
];

const executiveMessages = [
  "MDM Lite no busca gobernar todos los datos; busca ordenar las reglas que los pipelines usan todos los dias.",
  "Su valor aparece cuando el equipo necesita consistencia operativa sin montar una plataforma enterprise completa.",
  "El contrato tecnico esta en vistas SQL simples, aptas para SQL, dbt, notebooks, Python o pipelines modernos.",
];

export default function ExecutiveHelpPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <HelpNav currentPath="/help/executive" />
      <section className="section-head">
        <div>
          <span className="eyebrow">Help / FAQ ejecutiva</span>
          <h1>Preguntas ejecutivas para explicar que es MDM Lite y donde encaja</h1>
          <p>
            Esta pagina sirve para conversaciones cortas con sponsors, arquitectura, gobierno o liderazgo tecnico. Resume el producto sin caer en jerga innecesaria.
          </p>
        </div>
      </section>
      <section className="help-grid help-grid--two">
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Resumen</span>
            <h2>Tres ideas para abrir la conversacion</h2>
            <ul className="help-list">
              {executiveMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </article>
        <article className="help-card">
          <div className="help-card__section">
            <span className="eyebrow">Frase corta</span>
            <h2>Como resumirlo en una reunion</h2>
            <p>
              MDM Lite es una capa operativa de reglas maestras simples. No reemplaza catalogo ni gobierno; complementa esas capacidades con homologaciones, agrupaciones y parametros listos para consumo tecnico.
            </p>
          </div>
        </article>
      </section>
      <section className="help-faq">
        <div className="help-faq__list">
          {faqItems.map((item) => (
            <article key={item.question} className="help-card">
              <div className="help-card__section">
                <span className="eyebrow">Pregunta</span>
                <h2>{item.question}</h2>
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}