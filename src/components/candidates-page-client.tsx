"use client";

import { Download, Eye, FolderOpen, Check, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { TableActionButton, TableActionGroup } from "@/components/table-action-control";

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
  extraction_batch_id: string | null;
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

type BatchHistoryItem = {
  batchId: string;
  sourceKind: string | null;
  sourceName: string | null;
  sourceSystem: string | null;
  accepted: number;
  autoPromoted: number;
  duplicates: number;
  rejectedOnIngest: number;
  counts: {
    pending: number;
    promoted: number;
    rejected: number;
  };
  totalStored: number;
  reviewState: "open" | "completed";
  firstCreatedAt: string;
  lastReviewedAt: string | null;
};

type BatchHistoryResponse = {
  ok: boolean;
  error?: string;
  items?: BatchHistoryItem[];
};

type BatchConflictItem = {
  candidateId: string;
  candidateType: string;
  conflictRecordId: string;
  summary: string;
};

type AutoPromoteDeferredItem = {
  index: number;
  candidateId: string;
  reason: string;
};

type BatchDetailResponse = {
  ok: boolean;
  error?: string;
  batchId?: string;
  sourceKind?: string | null;
  sourceName?: string | null;
  sourceSystem?: string | null;
  accepted?: number;
  autoPromoted?: number;
  duplicates?: number;
  rejectedOnIngest?: number;
  counts?: {
    pending: number;
    promoted: number;
    rejected: number;
  };
  totalStored?: number;
  createdAt?: string | null;
  lastAuditAt?: string | null;
  auditComment?: string | null;
  analytics?: {
    reviewCompletionRate: number;
    manualPromoted: number;
    reviewThroughputPerHour: number;
    typeCounts: {
      mapping: number;
      group: number;
      parameter: number;
      unknown: number;
    };
    confidence: {
      average: number | null;
      min: number | null;
      max: number | null;
    };
    conflictCount: number;
    conflictItems: BatchConflictItem[];
    autoPromoteDeferredCount: number;
    autoPromoteDeferred: AutoPromoteDeferredItem[];
  };
};

type BatchExportResponse = {
  ok: boolean;
  error?: string;
  batchId?: string;
  exportedAt?: string;
  exportedBy?: string;
  counts?: {
    mappings: number;
    groups: number;
    parameters: number;
    candidates: {
      total: number;
      pending: number;
      promoted: number;
      rejected: number;
    };
  };
  files?: Record<string, string>;
};

type BulkActionResult = {
  action: "promote" | "reject";
  requested: number;
  succeeded: number;
  failed: number;
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
  const [tab, setTab] = useState<"list" | "extract" | "history">("list");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [items, setItems] = useState<Candidate[]>([]);
  const [historyItems, setHistoryItems] = useState<BatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySourceKind, setHistorySourceKind] = useState("");
  const [historyReviewState, setHistoryReviewState] = useState("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetailResponse | null>(null);
  const [batchDetailLoading, setBatchDetailLoading] = useState(false);
  const [batchDetailError, setBatchDetailError] = useState<string | null>(null);
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkActionResult | null>(null);

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
      if (batchFilter) params.set("batchId", batchFilter);
      const res = await fetch(`/api/candidates?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ListResponse;
      if (!data.ok) {
        setError(data.error ?? "Cannot load candidates.");
        return;
      }
      setItems(data.items ?? []);
      setSelectedIds([]);
      setLlmConfigured(data.llmConfigured ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchHistory() {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (historySourceKind) params.set("sourceKind", historySourceKind);
      if (historyReviewState !== "all") params.set("reviewState", historyReviewState);

      const res = await fetch(`/api/candidates/batch?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as BatchHistoryResponse;

      if (!data.ok) {
        setHistoryError(data.error ?? "Cannot load batch history.");
        return;
      }

      setHistoryItems(data.items ?? []);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadBatchDetail(batchId: string) {
    setBatchDetailLoading(true);
    setBatchDetailError(null);

    try {
      const res = await fetch(`/api/candidates/batch/${batchId}`, { cache: "no-store" });
      const data = (await res.json()) as BatchDetailResponse;

      if (!data.ok) {
        setBatchDetailError(data.error ?? "Cannot load batch detail.");
        return;
      }

      setBatchDetail(data);
    } catch (e) {
      setBatchDetailError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setBatchDetailLoading(false);
    }
  }

  async function handleExportBatch(batchId: string) {
    setExportingBatchId(batchId);
    setHistoryError(null);

    try {
      const res = await fetch(`/api/export/batch/${batchId}`, { cache: "no-store" });
      const data = (await res.json()) as BatchExportResponse;

      if (!data.ok) {
        setHistoryError(data.error ?? "Cannot export batch.");
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mdm-batch-${batchId.slice(0, 8)}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setExportingBatchId(null);
    }
  }

  useEffect(() => {
    void loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, batchFilter]);

  useEffect(() => {
    if (tab === "history") {
      void loadBatchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, historySourceKind, historyReviewState]);

  useEffect(() => {
    if (tab === "history" && selectedBatchId) {
      void loadBatchDetail(selectedBatchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedBatchId]);

  async function handlePromote(id: string) {
    setProcessingId(id);
    setError(null);
    setBulkResult(null);
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
    setBulkResult(null);
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
        setBatchFilter(data.batchId ?? "");
        setTab("list");
        await loadCandidates();
      }
    } catch (e) {
      setExtractResult({ ok: false, error: e instanceof Error ? e.message : "Unknown error." });
    } finally {
      setExtractBusy(false);
    }
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((candidateId) => candidateId !== id);
    });
  }

  async function handleBulkAction(action: "promote" | "reject") {
    if (selectedIds.length === 0) return;

    setBulkBusy(true);
    setError(null);
    setBulkResult(null);

    let succeeded = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/candidates/${id}/${action}`, { method: "POST" });
        const data = (await res.json()) as ActionResponse;
        if (data.ok) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    setBulkResult({
      action,
      requested: selectedIds.length,
      succeeded,
      failed,
    });

    await loadCandidates();
    setBulkBusy(false);
  }

  const pendingItemIds = items.filter((item) => item.status === "pending").map((item) => item.id);
  const allPendingSelected = pendingItemIds.length > 0 && pendingItemIds.every((id) => selectedIds.includes(id));

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
        <button
          type="button"
          className={`tab-btn${tab === "history" ? " tab-btn--active" : ""}`}
          onClick={() => setTab("history")}
        >
          Batch history
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

      {tab === "history" && (
        <section className="table-panel table-panel--padded">
          <div className="filter-bar" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              className="form-input form-input--inline"
              value={historySourceKind}
              onChange={(e) => setHistorySourceKind(e.target.value)}
            >
              <option value="">All sources</option>
              <option value="document">Document</option>
              <option value="external">External</option>
              <option value="manual">Manual</option>
              <option value="legacy2lake">Legacy2Lake</option>
              <option value="sql">SQL</option>
              <option value="notebook">Notebook</option>
              <option value="orchestration">Orchestration</option>
            </select>
            <select
              className="form-input form-input--inline"
              value={historyReviewState}
              onChange={(e) => setHistoryReviewState(e.target.value)}
            >
              <option value="all">All review states</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {historyError && <div className="status-banner status-banner--error">{historyError}</div>}

          {historyLoading ? (
            <p className="muted-text">Loading batch history…</p>
          ) : historyItems.length === 0 ? (
            <div className="empty-state">
              <p>No batches found for the current filters.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Source</th>
                    <th>Stored</th>
                    <th>Review progress</th>
                    <th>Ingest result</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((batch) => (
                    <tr key={batch.batchId}>
                      <td>
                        <strong>{batch.batchId.slice(0, 8)}</strong>
                        <div className="muted-text">{batch.firstCreatedAt.slice(0, 10)}</div>
                      </td>
                      <td>
                        <div>{batch.sourceName ?? "—"}</div>
                        <div className="muted-text">
                          {(batch.sourceKind ?? "unknown").toUpperCase()}
                          {batch.sourceSystem ? ` · ${batch.sourceSystem}` : ""}
                        </div>
                      </td>
                      <td>
                        <strong>{batch.totalStored}</strong>
                        <div className="muted-text">accepted {batch.accepted}</div>
                      </td>
                      <td>
                        <div>Pending {batch.counts.pending}</div>
                        <div className="muted-text">
                          Promoted {batch.counts.promoted} · Rejected {batch.counts.rejected}
                        </div>
                      </td>
                      <td>
                        <div>Auto {batch.autoPromoted}</div>
                        <div className="muted-text">
                          Duplicates {batch.duplicates} · Rejected {batch.rejectedOnIngest}
                        </div>
                      </td>
                      <td>
                        <TableActionGroup>
                          <TableActionButton label="View details" icon={Eye} onClick={() => setSelectedBatchId(batch.batchId)} />
                          <TableActionButton
                            label={exportingBatchId === batch.batchId ? "Exporting batch" : "Export batch"}
                            icon={Download}
                            busy={exportingBatchId === batch.batchId}
                            disabled={exportingBatchId === batch.batchId}
                            onClick={() => void handleExportBatch(batch.batchId)}
                          />
                          <TableActionButton
                            label="Open batch"
                            icon={FolderOpen}
                            tone="success"
                            onClick={() => {
                              setBatchFilter(batch.batchId);
                              setStatusFilter(batch.reviewState === "completed" ? "all" : "pending");
                              setTab("list");
                            }}
                          />
                        </TableActionGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedBatchId && (
            <section className="table-panel table-panel--padded" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <span className="eyebrow">Batch analytics</span>
                  <h2 style={{ margin: "0.25rem 0 0" }}>{selectedBatchId}</h2>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => {
                    setSelectedBatchId(null);
                    setBatchDetail(null);
                    setBatchDetailError(null);
                  }}
                >
                  Close details
                </button>
              </div>

              {batchDetailError && <div className="status-banner status-banner--error">{batchDetailError}</div>}

              {batchDetailLoading || !batchDetail ? (
                <p className="muted-text">Loading batch analytics…</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="table-panel table-panel--padded">
                      <strong>{batchDetail.analytics?.reviewCompletionRate ?? 0}%</strong>
                      <div className="muted-text">review completion</div>
                    </div>
                    <div className="table-panel table-panel--padded">
                      <strong>{batchDetail.analytics?.reviewThroughputPerHour ?? 0}/h</strong>
                      <div className="muted-text">review throughput</div>
                    </div>
                    <div className="table-panel table-panel--padded">
                      <strong>{batchDetail.analytics?.manualPromoted ?? 0}</strong>
                      <div className="muted-text">manual promotes</div>
                    </div>
                    <div className="table-panel table-panel--padded">
                      <strong>{batchDetail.analytics?.conflictCount ?? 0}</strong>
                      <div className="muted-text">pending conflicts</div>
                    </div>
                  </div>

                  <div className="table-panel table-panel--padded">
                    <strong>Type mix</strong>
                    <div className="muted-text" style={{ marginTop: "0.35rem" }}>
                      Mapping {batchDetail.analytics?.typeCounts.mapping ?? 0} · Group {batchDetail.analytics?.typeCounts.group ?? 0} · Parameter {batchDetail.analytics?.typeCounts.parameter ?? 0} · Unknown {batchDetail.analytics?.typeCounts.unknown ?? 0}
                    </div>
                    <div className="muted-text" style={{ marginTop: "0.35rem" }}>
                      Confidence avg {batchDetail.analytics?.confidence.average ?? "—"} · min {batchDetail.analytics?.confidence.min ?? "—"} · max {batchDetail.analytics?.confidence.max ?? "—"}
                    </div>
                    <div className="muted-text" style={{ marginTop: "0.35rem" }}>
                      Ingest: accepted {batchDetail.accepted ?? 0} · auto {batchDetail.autoPromoted ?? 0} · duplicates {batchDetail.duplicates ?? 0} · rejected {batchDetail.rejectedOnIngest ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <div className="table-panel table-panel--padded">
                      <strong>Conflict samples</strong>
                      {batchDetail.analytics?.conflictItems.length ? (
                        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                          {batchDetail.analytics.conflictItems.map((item) => (
                            <div key={item.candidateId} style={{ fontSize: "0.85rem" }}>
                              <strong>{item.candidateType}</strong> · {item.summary}
                              <div className="muted-text">Active record {item.conflictRecordId.slice(0, 8)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-text" style={{ marginTop: "0.75rem" }}>No active conflicts detected for pending candidates.</p>
                      )}
                    </div>

                    <div className="table-panel table-panel--padded">
                      <strong>Deferred auto-promote</strong>
                      {batchDetail.analytics?.autoPromoteDeferred.length ? (
                        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                          {batchDetail.analytics.autoPromoteDeferred.map((item) => (
                            <div key={`${item.candidateId}-${item.index}`} style={{ fontSize: "0.85rem" }}>
                              <strong>#{item.index + 1}</strong> · {item.reason}
                              <div className="muted-text">Candidate {item.candidateId.slice(0, 8)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-text" style={{ marginTop: "0.75rem" }}>No deferred auto-promote reasons recorded for this batch.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
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
            <input
              className="form-input form-input--inline"
              type="text"
              placeholder="Filter by batch ID"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value.trim())}
              style={{ minWidth: "220px" }}
            />
            {batchFilter && (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setBatchFilter("")}
              >
                Clear batch filter
              </button>
            )}
          </div>

          {batchFilter && (
            <div className="status-banner status-banner--info" style={{ marginBottom: "1rem" }}>
              Showing only candidates from batch <strong>{batchFilter}</strong>.
            </div>
          )}

          {selectedIds.length > 0 && (
            <div
              className="table-panel table-panel--padded"
              style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}
            >
              <strong>{selectedIds.length} selected</strong>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={bulkBusy}
                onClick={() => void handleBulkAction("promote")}
              >
                {bulkBusy ? "Processing…" : "Promote selected"}
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                disabled={bulkBusy}
                onClick={() => void handleBulkAction("reject")}
              >
                {bulkBusy ? "Processing…" : "Reject selected"}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={bulkBusy}
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </button>
            </div>
          )}

          {error && <div className="status-banner status-banner--error">{error}</div>}
          {bulkResult && (
            <div className={`status-banner ${bulkResult.failed > 0 ? "status-banner--warn" : "status-banner--success"}`}>
              Bulk {bulkResult.action}: {bulkResult.succeeded} succeeded, {bulkResult.failed} failed, out of {bulkResult.requested} selected candidates.
            </div>
          )}

          {loading ? (
            <p className="muted-text">Loading…</p>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>
                No {statusFilter !== "all" ? statusFilter : ""} candidates
                {batchFilter ? ` for batch ${batchFilter}` : ""}.
              </p>
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
                      <th>
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          aria-label="Select all pending candidates on page"
                          onChange={(e) => setSelectedIds(e.target.checked ? pendingItemIds : [])}
                        />
                      </th>
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
                      <Fragment key={item.id}>
                        <tr
                          className={processingId === item.id || bulkBusy ? "row--busy" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            {item.status === "pending" ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                aria-label={`Select candidate ${item.id}`}
                                onChange={(e) => toggleSelected(item.id, e.target.checked)}
                              />
                            ) : null}
                          </td>
                          <td>
                            <span className={`badge badge--${item.candidate_type}`}>
                              {TYPE_LABELS[item.candidate_type] ?? item.candidate_type}
                            </span>
                          </td>
                          <td>{payloadSummary(item.candidate_type, item.payload)}</td>
                          <td>{confidenceBar(item.confidence)}</td>
                          <td className="muted-text" style={{ fontSize: "0.8rem" }}>
                            {item.source_document_name ?? "—"}
                            {item.extraction_batch_id && (
                              <div>
                                <button
                                  type="button"
                                  className="btn btn--secondary btn--sm"
                                  style={{ marginTop: "0.35rem" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBatchFilter(item.extraction_batch_id ?? "");
                                  }}
                                >
                                  Batch {item.extraction_batch_id.slice(0, 8)}
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge--status-${item.status}`}>
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </td>
                          <td>
                            {item.status === "pending" && (
                              <TableActionGroup>
                                <TableActionButton
                                  label="Promote"
                                  icon={Check}
                                  tone="success"
                                  disabled={processingId === item.id || bulkBusy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handlePromote(item.id);
                                  }}
                                />
                                <TableActionButton
                                  label="Reject"
                                  icon={X}
                                  tone="danger"
                                  disabled={processingId === item.id || bulkBusy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleReject(item.id);
                                  }}
                                />
                              </TableActionGroup>
                            )}
                            {item.status === "promoted" && item.promoted_record_id && (
                              <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                                Draft created
                              </span>
                            )}
                          </td>
                        </tr>
                        {expandedId === item.id && (
                          <tr className="row--expanded">
                            <td colSpan={7}>
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
                                {item.extraction_batch_id && (
                                  <div className="muted-text">Batch ID: {item.extraction_batch_id}</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
