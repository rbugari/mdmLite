"use client";

import { useEffect, useState } from "react";

type Candidate = {
  id: string;
  source_kind: string;
  candidate_type: string;
  payload: Record<string, unknown>;
  evidence: string | null;
  confidence: string | null;
  needs_human_review: boolean;
  status: string;
  source_document_name: string | null;
  created_by_email: string | null;
  created_at: string;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  promoted_record_id: string | null;
};

type ListResponse = {
  ok: boolean;
  error?: string;
  items?: Candidate[];
  llmConfigured?: boolean;
  count?: number;
};

type ActionResponse = {
  ok: boolean;
  error?: string;
  extracted?: number;
  batchId?: string;
  promotedRecordId?: string;
};

const TYPE_LABELS: Record<string, string> = {
  mapping: "Mapping",
  group: "Group",
  parameter: "Parameter",
  unknown: "Unknown",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  promoted: "Promoted",
  rejected: "Rejected",
};

function confidenceBar(raw: string | null) {
  if (!raw) return null;
  const val = parseFloat(raw);
  if (isNaN(val)) return null;
  const pct = Math.round(val * 100);
  const color = pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-error)";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          display: "inline-block",
          width: "60px",
          height: "6px",
          borderRadius: "3px",
          background: "var(--color-border)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${pct}%`,
            height: "100%",
            background: color,
          }}
        />
      </span>
      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{pct}%</span>
    </span>
  );
}

function payloadSummary(type: string, payload: Record<string, unknown>): string {
  if (type === "mapping") {
    return `${String(payload.sourceValue ?? "?")} → ${String(payload.targetValue ?? "?")}`;
  }
  if (type === "group") {
    return `${String(payload.memberValue ?? "?")} → ${String(payload.groupValue ?? "?")}`;
  }
  if (type === "parameter") {
    return `${String(payload.parameterKey ?? "?")} = ${String(payload.parameterValue ?? "?")}`;
  }
  return String(payload.description ?? JSON.stringify(payload).slice(0, 60));
}

export function CandidatesPageClient() {
  const [tab, setTab] = useState<"list" | "extract">("list");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Extract form state
  const [extractText, setExtractText] = useState("");
  const [extractDocName, setExtractDocName] = useState("");
  const [extractBusy, setExtractBusy] = useState(false);
  const [extractResult, setExtractResult] = useState<ActionResponse | null>(null);

  async function loadCandidates() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/candidates?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ListResponse;
      if (!data.ok) {
        setError(data.error ?? "Cannot load candidates.");
        return;
      }
      setItems(data.items ?? []);
      setLlmConfigured(data.llmConfigured ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  async function handlePromote(id: string) {
    setProcessingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${id}/promote`, { method: "POST" });
      const data = (await res.json()) as ActionResponse;
      if (!data.ok) {
        setError(data.error ?? "Promote failed.");
        return;
      }
      await loadCandidates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${id}/reject`, { method: "POST" });
      const data = (await res.json()) as ActionResponse;
      if (!data.ok) {
        setError(data.error ?? "Reject failed.");
        return;
      }
      await loadCandidates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setExtractBusy(true);
    setExtractResult(null);
    try {
      const res = await fetch("/api/candidates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractText,
          documentName: extractDocName || "pasted-text",
        }),
      });
      const data = (await res.json()) as ActionResponse;
      setExtractResult(data);
      if (data.ok && (data.extracted ?? 0) > 0) {
        setExtractText("");
        setExtractDocName("");
        setStatusFilter("pending");
        setTab("list");
        await loadCandidates();
      }
    } catch (e) {
      setExtractResult({ ok: false, error: e instanceof Error ? e.message : "Unknown error." });
    } finally {
      setExtractBusy(false);
    }
  }

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Candidates</span>
          <h1>Candidate Review</h1>
          <p>
            Review rule candidates extracted from documents. Promote to create a draft rule, or
            reject to discard.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          className={`tab-btn${tab === "list" ? " tab-btn--active" : ""}`}
          onClick={() => setTab("list")}
        >
          Candidate list
        </button>
        <button
          type="button"
          className={`tab-btn${tab === "extract" ? " tab-btn--active" : ""}`}
          onClick={() => setTab("extract")}
        >
          Extract from document
        </button>
      </div>

      {/* Extract tab */}
      {tab === "extract" && (
        <section className="table-panel table-panel--padded">
          {!llmConfigured && (
            <div className="status-banner status-banner--warn" style={{ marginBottom: "1rem" }}>
              <strong>LLM not configured.</strong> Set <code>LLM_PROVIDER</code> and{" "}
              <code>LLM_API_KEY</code> in <code>.env</code> to enable automatic extraction.
            </div>
          )}
          <form onSubmit={(e) => void handleExtract(e)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-field">
              <label className="form-label" htmlFor="docName">
                Document name
              </label>
              <input
                id="docName"
                className="form-input"
                type="text"
                placeholder="e.g. sales-rules-v2.md"
                value={extractDocName}
                onChange={(e) => setExtractDocName(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="docText">
                Document text
              </label>
              <textarea
                id="docText"
                className="form-input"
                rows={14}
                placeholder="Paste the document content here. Markdown, plain text, or business notes."
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                maxLength={50000}
                required
                minLength={20}
                style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
              />
              <span className="form-hint">{extractText.length} / 50,000 characters</span>
            </div>
            {extractResult && !extractResult.ok && (
              <div className="status-banner status-banner--error">{extractResult.error}</div>
            )}
            {extractResult && extractResult.ok && extractResult.extracted === 0 && (
              <div className="status-banner status-banner--warn">
                No candidates found in this document.
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={extractBusy || !llmConfigured || extractText.length < 20}
              >
                {extractBusy ? "Extracting…" : "Extract candidates"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* List tab */}
      {tab === "list" && (
        <>
          {/* Filters */}
          <div className="filter-bar" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              className="form-input form-input--inline"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="promoted">Promoted</option>
              <option value="rejected">Rejected</option>
              <option value="all">All statuses</option>
            </select>
            <select
              className="form-input form-input--inline"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="mapping">Mapping</option>
              <option value="group">Group</option>
              <option value="parameter">Parameter</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {error && <div className="status-banner status-banner--error">{error}</div>}

          {loading ? (
            <p className="muted-text">Loading…</p>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>No {statusFilter !== "all" ? statusFilter : ""} candidates.</p>
              {statusFilter === "pending" && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setTab("extract")}
                >
                  Extract from document
                </button>
              )}
            </div>
          ) : (
            <div className="table-panel">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Summary</th>
                      <th>Confidence</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <>
                        <tr
                          key={item.id}
                          className={processingId === item.id ? "row--busy" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        >
                          <td>
                            <span className={`badge badge--${item.candidate_type}`}>
                              {TYPE_LABELS[item.candidate_type] ?? item.candidate_type}
                            </span>
                          </td>
                          <td>{payloadSummary(item.candidate_type, item.payload)}</td>
                          <td>{confidenceBar(item.confidence)}</td>
                          <td className="muted-text" style={{ fontSize: "0.8rem" }}>
                            {item.source_document_name ?? "—"}
                          </td>
                          <td>
                            <span className={`badge badge--status-${item.status}`}>
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </td>
                          <td>
                            {item.status === "pending" && (
                              <span style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  type="button"
                                  className="btn btn--primary btn--sm"
                                  disabled={processingId === item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handlePromote(item.id);
                                  }}
                                >
                                  Promote
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--danger btn--sm"
                                  disabled={processingId === item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleReject(item.id);
                                  }}
                                >
                                  Reject
                                </button>
                              </span>
                            )}
                            {item.status === "promoted" && item.promoted_record_id && (
                              <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                                Draft created
                              </span>
                            )}
                          </td>
                        </tr>
                        {expandedId === item.id && (
                          <tr key={`${item.id}-detail`} className="row--expanded">
                            <td colSpan={6}>
                              <div
                                style={{
                                  padding: "0.75rem 1rem",
                                  background: "var(--color-surface-alt)",
                                  borderRadius: "4px",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                {item.evidence && (
                                  <div>
                                    <strong>Evidence:</strong>{" "}
                                    <em style={{ color: "var(--color-muted)" }}>{item.evidence}</em>
                                  </div>
                                )}
                                <div>
                                  <strong>Payload:</strong>{" "}
                                  <code style={{ whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(item.payload, null, 2)}
                                  </code>
                                </div>
                                {item.needs_human_review && (
                                  <div className="badge badge--warn">Requires human review</div>
                                )}
                                {item.review_comments && (
                                  <div>
                                    <strong>Review note:</strong> {item.review_comments}
                                  </div>
                                )}
                                <div className="muted-text">
                                  Extracted {item.created_at?.slice(0, 10)} by{" "}
                                  {item.created_by_email ?? "system"}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
