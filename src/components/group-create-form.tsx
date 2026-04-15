"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useUiPreferences } from "@/components/ui-preferences-provider";
import { getCopy } from "@/lib/copy";

type FormResult = {
  ok: boolean;
  error?: string;
};

export function GroupCreateForm() {
  const router = useRouter();
  const { language } = useUiPreferences();
  const t = getCopy(language).forms.groupCreate;
  const [status, setStatus] = useState<FormResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      memberValue: String(formData.get("memberValue") ?? "").trim(),
      groupValue: String(formData.get("groupValue") ?? "").trim(),
      validFrom: String(formData.get("validFrom") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/groups", {
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
          <span>{t.memberLabel}</span>
          <input name="memberValue" type="text" placeholder={t.memberPlaceholder} required />
        </label>

        <label className="form-field">
          <span>{t.groupLabel}</span>
          <input name="groupValue" type="text" placeholder={t.groupPlaceholder} required />
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