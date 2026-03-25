"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { ActiveMapping } from "@/lib/mdm";

type Props = {
  items: ActiveMapping[];
};

type FormResult = {
  ok: boolean;
  error?: string;
};

export function MappingEditTable({ items }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, FormResult | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSavingId(id);
    setStatus((current) => ({ ...current, [id]: null }));

    const formData = new FormData(event.currentTarget);
    const payload = {
      sourceValue: String(formData.get("sourceValue") ?? "").trim(),
      targetValue: String(formData.get("targetValue") ?? "").trim(),
      validFrom: String(formData.get("validFrom") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
    };

    try {
      const response = await fetch(`/api/mappings/${id}`, {
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
        [id]: { ok: false, error: error instanceof Error ? error.message : "Unknown error updating mapping." },
      }));
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return <div className="empty-state">No hay equivalencias activas para el filtro actual.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Entidad</th>
            <th>Clave origen</th>
            <th>Valor origen</th>
            <th>Valor destino</th>
            <th>Rule set</th>
            <th>Vigencia</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <FragmentRow
              key={item.id}
              item={item}
              editingId={editingId}
              savingId={savingId}
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
  item: ActiveMapping;
  editingId: string | null;
  savingId: string | null;
  status: FormResult | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => Promise<void>;
};

function FragmentRow({ item, editingId, savingId, status, onStartEdit, onCancelEdit, onSubmit }: FragmentRowProps) {
  const isEditing = editingId === item.id;
  const isSaving = savingId === item.id;

  return (
    <>
      <tr>
        <td>{item.entity_type_code}</td>
        <td>{item.source_key}</td>
        <td>{item.source_value}</td>
        <td>{item.target_value}</td>
        <td>{item.rule_set_code}</td>
        <td>{item.valid_from}</td>
        <td>
          <button type="button" className="table-action" onClick={isEditing ? onCancelEdit : onStartEdit}>
            {isEditing ? "Cerrar" : "Editar"}
          </button>
        </td>
      </tr>
      {isEditing ? (
        <tr className="edit-row">
          <td colSpan={7}>
            <form onSubmit={(event) => void onSubmit(event, item.id)} className="inline-form-grid inline-form-grid--tight">
              <label className="form-field">
                <span>Valor origen</span>
                <input name="sourceValue" type="text" defaultValue={item.source_value} required />
              </label>
              <label className="form-field">
                <span>Valor destino</span>
                <input name="targetValue" type="text" defaultValue={item.target_value} required />
              </label>
              <label className="form-field">
                <span>Vigente desde</span>
                <input name="validFrom" type="date" defaultValue={item.valid_from} required />
              </label>
              <label className="form-field form-field--full">
                <span>Comentario</span>
                <input name="comments" type="text" placeholder="Actualizacion manual desde UI" />
              </label>
              <div className="form-actions form-field--full">
                <button type="submit" className="hero-link hero-link--primary" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button type="button" className="hero-link" onClick={onCancelEdit} disabled={isSaving}>
                  Cancelar
                </button>
                {status ? (
                  <span className={status.ok ? "form-status form-status--ok" : "form-status form-status--error"}>
                    {status.ok ? "Equivalencia actualizada." : status.error}
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