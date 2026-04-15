"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useUiPreferences } from "@/components/ui-preferences-provider";
import { getCopy } from "@/lib/copy";

type FormResult = {
  ok: boolean;
  error?: string;
};

export function ParameterCreateForm() {
  const router = useRouter();
  const { language } = useUiPreferences();
  const t = getCopy(language).forms.parameterCreate;
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
        error: error instanceof Error ? error.message : t.submit,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="table-panel table-panel--padded">
      <div className="form-header">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="inline-form-grid">
        <label className="form-field">
          <span>{t.parameterKeyLabel}</span>
          <input name="parameterKey" type="text" defaultValue="PVP_FACTOR" required />
        </label>

        <label className="form-field">
          <span>{t.parameterValueLabel}</span>
          <input name="parameterValue" type="text" placeholder={t.parameterValuePlaceholder} required />
        </label>

        <label className="form-field">
          <span>{t.domainLabel}</span>
          <input name="domain" type="text" defaultValue="ventas_perseida" required />
        </label>

        <label className="form-field">
          <span>{t.scopeTypeLabel}</span>
          <input name="scopeType" type="text" defaultValue="CLIENT" required />
        </label>

        <label className="form-field form-field--full">
          <span>{t.scopeValueLabel}</span>
          <input name="scopeValue" type="text" placeholder={t.scopeValuePlaceholder} required />
        </label>

        <label className="form-field">
          <span>{t.validFromLabel}</span>
          <input name="validFrom" type="date" defaultValue="2024-01-01" required />
        </label>

        <label className="form-field form-field--full">
          <span>{t.commentsLabel}</span>
          <input name="comments" type="text" placeholder={t.commentsPlaceholder} />
        </label>

        <div className="form-actions form-field--full">
          <button type="submit" className="hero-link hero-link--primary" disabled={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit}
          </button>

          {status ? (
            <span className={status.ok ? "form-status form-status--ok" : "form-status form-status--error"}>
              {status.ok ? t.success : status.error}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}