"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useUiPreferences } from "@/components/ui-preferences-provider";
import { getCopy } from "@/lib/copy";
import type { ActiveParameter } from "@/lib/mdm";

type Props = {
  items: ActiveParameter[];
};

type FormResult = {
  ok: boolean;
  error?: string;
};

export function ParameterEditTable({ items }: Props) {
  const router = useRouter();
  const { language } = useUiPreferences();
  const t = getCopy(language).forms.parameterTable;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, FormResult | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSavingId(id);
    setStatus((current) => ({ ...current, [id]: null }));

    const formData = new FormData(event.currentTarget);
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
      const response = await fetch(`/api/parameters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as FormResult;
      setStatus((current) => ({ ...current, [id]: result }));

      if (response.ok && result.ok) {
        setEditingId(null);
        router.refresh();
      }
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [id]: { ok: false, error: error instanceof Error ? error.message : "Unknown error updating parameter." },
      }));
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return <div className="empty-state">{t.empty}</div>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {t.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <FragmentRow
              key={item.id}
              item={item}
              editingId={editingId}
              savingId={savingId}
              language={language}
              status={status[item.id] ?? null}
              onStartEdit={() => setEditingId(item.id)}
              onCancelEdit={() => setEditingId(null)}
              onSubmit={handleSubmit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FragmentRowProps = {
  item: ActiveParameter;
  editingId: string | null;
  savingId: string | null;
  language: "en" | "es";
  status: FormResult | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => Promise<void>;
};

function FragmentRow({ item, editingId, savingId, language, status, onStartEdit, onCancelEdit, onSubmit }: FragmentRowProps) {
  const isEditing = editingId === item.id;
  const isSaving = savingId === item.id;
  const t = getCopy(language).forms.parameterTable;

  return (
    <>
      <tr>
        <td>{item.parameter_key}</td>
        <td>{item.parameter_value}</td>
        <td>{item.data_type}</td>
        <td>{item.domain}</td>
        <td>
          {item.parameter_scope_type && item.parameter_scope_value
            ? `${item.parameter_scope_type}: ${item.parameter_scope_value}`
            : t.global}
        </td>
        <td>{item.valid_from}</td>
        <td>
          <a className="table-action" href={`/audit?recordId=${item.id}`}>
            History
          </a>
          <button type="button" className="table-action" onClick={isEditing ? onCancelEdit : onStartEdit}>
            {isEditing ? t.close : t.edit}
          </button>
        </td>
      </tr>
      {isEditing ? (
        <tr className="edit-row">
          <td colSpan={7}>
            <form onSubmit={(event) => void onSubmit(event, item.id)} className="inline-form-grid inline-form-grid--tight">
              <label className="form-field">
                <span>{t.parameterKeyLabel}</span>
                <input name="parameterKey" type="text" defaultValue={item.parameter_key} required />
              </label>
              <label className="form-field">
                <span>{t.parameterValueLabel}</span>
                <input name="parameterValue" type="text" defaultValue={item.parameter_value} required />
              </label>
              <label className="form-field">
                <span>{t.domainLabel}</span>
                <input name="domain" type="text" defaultValue={item.domain} required />
              </label>
              <label className="form-field">
                <span>{t.scopeTypeLabel}</span>
                <input name="scopeType" type="text" defaultValue={item.parameter_scope_type ?? "CLIENT"} required />
              </label>
              <label className="form-field form-field--full">
                <span>{t.scopeValueLabel}</span>
                <input name="scopeValue" type="text" defaultValue={item.parameter_scope_value ?? ""} required />
              </label>
              <label className="form-field">
                <span>{t.validFromLabel}</span>
                <input name="validFrom" type="date" defaultValue={item.valid_from} required />
              </label>
              <label className="form-field form-field--full">
                <span>{t.commentsLabel}</span>
                <input name="comments" type="text" placeholder={t.commentsPlaceholder} />
              </label>
              <div className="form-actions form-field--full">
                <button type="submit" className="hero-link hero-link--primary" disabled={isSaving}>
                  {isSaving ? t.saving : t.save}
                </button>
                <button type="button" className="hero-link" onClick={onCancelEdit} disabled={isSaving}>
                  {t.cancel}
                </button>
                {status ? (
                  <span className={status.ok ? "form-status form-status--ok" : "form-status form-status--error"}>
                    {status.ok ? t.success : status.error}
                  </span>
                ) : null}
              </div>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}