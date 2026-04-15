"use client";

import { useState } from "react";

import { useUiPreferences } from "@/components/ui-preferences-provider";
import { getCopy } from "@/lib/copy";

type ImportResult = {
  ok: boolean;
  mode?: "preview" | "confirm";
  source?: string;
  target?: string;
  imported?: number;
  mappings?: number;
  groups?: number;
  parameters?: number;
  fileName?: string;
  token?: string;
  summary?: {
    totalRows: number;
    validRows: number;
    errors: number;
    duplicatesInFile: number;
    potentialInserts: number;
    potentialUpdates: number;
  };
  issues?: Array<{ rowNumber: number; code: string; message: string }>;
  canConfirm?: boolean;
  error?: string;
};

export function ImportsConsole() {
  const { language } = useUiPreferences();
  const t = getCopy(language).forms.importsConsole;
  const [target, setTarget] = useState("mappings");
  const [status, setStatus] = useState<ImportResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  async function handleDemoImport() {
    setIsBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/imports/demo", { method: "POST" });
      const payload = (await response.json()) as ImportResult;
      setStatus(payload);
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : t.error });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatus(null);
    setPreviewToken(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/imports/upload/preview", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ImportResult;
      setStatus(payload);

      if (response.ok && payload.ok && payload.token && payload.canConfirm) {
        setPreviewToken(payload.token);
      }
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : t.error });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirmImport() {
    if (!previewToken) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch("/api/imports/upload/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: previewToken }),
      });

      const payload = (await response.json()) as ImportResult;
      setStatus(payload);

      if (response.ok && payload.ok) {
        setPreviewToken(null);
      }
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : t.error });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="imports-grid">
      <section className="import-card">
        <span className="eyebrow">{t.demoEyebrow}</span>
        <h2>{t.demoTitle}</h2>
        <p>{t.demoDescription}</p>
        <button type="button" className="hero-link hero-link--primary" onClick={handleDemoImport} disabled={isBusy}>
          {isBusy ? t.processing : t.demoCta}
        </button>
      </section>

      <section className="import-card">
        <span className="eyebrow">{t.uploadEyebrow}</span>
        <h2>{t.uploadTitle}</h2>
        <p>{t.uploadDescription}</p>

        <form onSubmit={handleUpload} className="import-form">
          <label className="form-field">
            <span>{t.targetLabel}</span>
            <select name="target" value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="mappings">{t.targetOptions.mappings}</option>
              <option value="groups">{t.targetOptions.groups}</option>
              <option value="parameters">{t.targetOptions.parameters}</option>
            </select>
          </label>

          <label className="form-field">
            <span>{t.fileLabel}</span>
            <input name="file" type="file" accept=".csv,.xlsx,.xls" required />
          </label>

          <button type="submit" className="hero-link" disabled={isBusy}>
            {isBusy ? t.processing : "Preview import"}
          </button>
          <button
            type="button"
            className="hero-link hero-link--primary"
            disabled={isBusy || !previewToken}
            onClick={() => void handleConfirmImport()}
          >
            {isBusy ? t.processing : "Confirm import"}
          </button>
        </form>
      </section>

      <section className="import-card import-card--wide">
        <span className="eyebrow">{t.resultEyebrow}</span>
        <h2>{t.resultTitle}</h2>
        {!status ? (
          <p>{t.noResult}</p>
        ) : status.ok ? (
          <div className="result-ok">
            <p>{status.mode === "preview" ? "Preview generated." : t.success}</p>
            {status.summary ? (
              <div>
                <p>
                  rows={status.summary.totalRows} valid={status.summary.validRows} errors={status.summary.errors} duplicates={status.summary.duplicatesInFile}
                </p>
                <p>
                  potentialInserts={status.summary.potentialInserts} potentialUpdates={status.summary.potentialUpdates}
                </p>
              </div>
            ) : null}
            {status.issues && status.issues.length > 0 ? (
              <div>
                <p>Validation issues (up to 100):</p>
                <pre>{JSON.stringify(status.issues, null, 2)}</pre>
              </div>
            ) : null}
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        ) : (
          <div className="result-error">
            <p>{t.error}</p>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  );
}