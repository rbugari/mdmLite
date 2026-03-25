"use client";

import { useState } from "react";

type ImportResult = {
  ok: boolean;
  source?: string;
  target?: string;
  imported?: number;
  mappings?: number;
  groups?: number;
  parameters?: number;
  fileName?: string;
  error?: string;
};

export function ImportsConsole() {
  const [target, setTarget] = useState("mappings");
  const [status, setStatus] = useState<ImportResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleDemoImport() {
    setIsBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/imports/demo", { method: "POST" });
      const payload = (await response.json()) as ImportResult;
      setStatus(payload);
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ImportResult;
      setStatus(payload);
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="imports-grid">
      <section className="import-card">
        <span className="eyebrow">Dataset Demo</span>
        <h2>Reimportar workbook del proyecto</h2>
        <p>
          Ejecuta la carga del Excel demo guardado en `data/demo/` para reponer equivalencias, agrupaciones y
          parametros base.
        </p>
        <button type="button" className="hero-link hero-link--primary" onClick={handleDemoImport} disabled={isBusy}>
          {isBusy ? "Procesando..." : "Importar demo del servidor"}
        </button>
      </section>

      <section className="import-card">
        <span className="eyebrow">Carga Manual</span>
        <h2>Subir CSV o XLSX</h2>
        <p>
          Importa un archivo para equivalencias, agrupaciones o parametros. Se usa la primera hoja del archivo.
        </p>

        <form onSubmit={handleUpload} className="import-form">
          <label className="form-field">
            <span>Tipo de importacion</span>
            <select name="target" value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="mappings">Equivalencias</option>
              <option value="groups">Agrupaciones</option>
              <option value="parameters">Parametros</option>
            </select>
          </label>

          <label className="form-field">
            <span>Archivo</span>
            <input name="file" type="file" accept=".csv,.xlsx,.xls" required />
          </label>

          <button type="submit" className="hero-link" disabled={isBusy}>
            {isBusy ? "Procesando..." : "Subir e importar"}
          </button>
        </form>
      </section>

      <section className="import-card import-card--wide">
        <span className="eyebrow">Resultado</span>
        <h2>Estado de la ultima ejecucion</h2>
        {!status ? (
          <p>No hay ejecuciones recientes en esta sesion.</p>
        ) : status.ok ? (
          <div className="result-ok">
            <p>Importacion completada correctamente.</p>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        ) : (
          <div className="result-error">
            <p>La importacion fallo.</p>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  );
}