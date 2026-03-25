"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type FormResult = {
  ok: boolean;
  error?: string;
};

export function ParameterCreateForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      parameterKey: String(formData.get("parameterKey") ?? "").trim(),
      parameterValue: String(formData.get("parameterValue") ?? "").trim(),
      domain: String(formData.get("domain") ?? "").trim(),
      scopeType: String(formData.get("scopeType") ?? "").trim(),
      scopeValue: String(formData.get("scopeValue") ?? "").trim(),
      validFrom: String(formData.get("validFrom") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/parameters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as FormResult;
      setStatus(result);

      if (response.ok && result.ok) {
        form.reset();
        router.refresh();
      }
    } catch (error) {
      setStatus({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error creating parameter.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="table-panel table-panel--padded">
      <div className="form-header">
        <div>
          <span className="eyebrow">Alta Manual</span>
          <h2>Nuevo parametro</h2>
          <p>Formulario liviano para cargar parametros activos con alcance simple por cliente u otro contexto.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="inline-form-grid">
        <label className="form-field">
          <span>Clave</span>
          <input name="parameterKey" type="text" defaultValue="PVP_FACTOR" required />
        </label>

        <label className="form-field">
          <span>Valor</span>
          <input name="parameterValue" type="text" placeholder="1.05" required />
        </label>

        <label className="form-field">
          <span>Dominio</span>
          <input name="domain" type="text" defaultValue="ventas_perseida" required />
        </label>

        <label className="form-field">
          <span>Tipo de alcance</span>
          <input name="scopeType" type="text" defaultValue="CLIENT" required />
        </label>

        <label className="form-field form-field--full">
          <span>Valor de alcance</span>
          <input name="scopeValue" type="text" placeholder="MARJANE" required />
        </label>

        <label className="form-field">
          <span>Vigente desde</span>
          <input name="validFrom" type="date" defaultValue="2024-01-01" required />
        </label>

        <label className="form-field form-field--full">
          <span>Comentario</span>
          <input name="comments" type="text" placeholder="Carga manual desde UI" />
        </label>

        <div className="form-actions form-field--full">
          <button type="submit" className="hero-link hero-link--primary" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Crear parametro"}
          </button>

          {status ? (
            <span className={status.ok ? "form-status form-status--ok" : "form-status form-status--error"}>
              {status.ok ? "Parametro creado correctamente." : status.error}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}