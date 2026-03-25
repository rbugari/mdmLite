import Link from "next/link";
import { Database, FileSpreadsheet, Network, ShieldCheck } from "lucide-react";

import { appConfig } from "@/lib/app-config";
import { getDashboardStats } from "@/lib/mdm";

const cards = [
  {
    title: "Datos Maestros",
    text: "Equivalencias, agrupaciones y parametros con vigencia y auditoria.",
    icon: Database,
  },
  {
    title: "Importacion Demo",
    text: "Carga por CSV o XLSX con revision previa y correccion manual simple.",
    icon: FileSpreadsheet,
  },
  {
    title: "Consumo Tecnico",
    text: "Contrato inicial por vistas SQL, preparado para API o MCP en fases futuras.",
    icon: Network,
  },
  {
    title: "Operacion Simple",
    text: "MVP monoempresa con un admin inicial y flujo liviano de aprobacion.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  const stats = await getDashboardStats();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">MDM Lite / Reference Data Manager</span>
          <h1>Base inicial del proyecto para gobernar reglas de negocio sin hardcode.</h1>
          <p>
            El repositorio ya esta organizado con documentacion, esquema SQL, dataset demo y scaffold de
            aplicacion para arrancar el MVP sobre PostgreSQL estandar.
          </p>

          <div className="hero-actions">
            <Link href="/mappings" className="hero-link hero-link--primary">
              Ver equivalencias
            </Link>
            <Link href="/parameters" className="hero-link">
              Ver parametros
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <h2>Estado del arranque</h2>
          <ul>
            <li>Documentacion organizada en docs/</li>
            <li>Dataset demo ubicado en data/demo/</li>
            <li>Esquema inicial en db/schema/</li>
            <li>Stack base definido para Next.js + TypeScript</li>
            <li>Puerto local web configurado en {appConfig.appPort}</li>
            <li>Healthcheck DB disponible en /api/health/db</li>
          </ul>

          <div className="stat-strip">
            <div>
              <strong>{stats.mappings}</strong>
              <span>equivalencias</span>
            </div>
            <div>
              <strong>{stats.groups}</strong>
              <span>agrupaciones</span>
            </div>
            <div>
              <strong>{stats.parameters}</strong>
              <span>parametros</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="feature-card">
              <Icon className="feature-icon" aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
