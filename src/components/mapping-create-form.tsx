"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type FormResult = {
  ok: boolean;
  error?: string;
};

export function MappingCreateForm() {
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
      sourceValue: String(formData.get("sourceValue") ?? "").trim(),
      targetValue: String(formData.get("targetValue") ?? "").trim(),
      validFrom: String(formData.get("validFrom") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/mappings", {
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
        error: error instanceof Error ? error.message : "Unknown error creating mapping.",
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
          <h2>Nueva equivalencia</h2>
          <p>Formulario liviano para cargar una homologacion sin pasar por importacion de archivo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="inline-form-grid">
        <label className="form-field">
          <span>Valor origen</span>
          <input name="sourceValue" type="text" placeholder="ALDI SAN ISIDRO SUPERMERCADOS, S.L." required />
        </label>

        <label className="form-field">
          <span>Valor destino</span>
          <input name="targetValue" type="text" placeholder="ALDI SUPERMERCADOS" required />
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
            {isSubmitting ? "Guardando..." : "Crear equivalencia"}
          </button>

          {status ? (
            <span className={status.ok ? "form-status form-status--ok" : "form-status form-status--error"}>
              {status.ok ? "Equivalencia creada correctamente." : status.error}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}