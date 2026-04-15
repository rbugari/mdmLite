"use client";

import { useEffect, useState } from "react";

type PendingItem = {
  id: string;
  entity: "mapping" | "group" | "parameter";
  label: string;
  status: string;
  updated_at: string;
};

type PendingResponse = {
  ok: boolean;
  error?: string;
  items?: PendingItem[];
};

type TransitionAction = "approve" | "reject" | "inactivate";

export default function ApprovalsPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<"all" | PendingItem["entity"]>("all");
  const [search, setSearch] = useState("");

  async function loadPending() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workflow/pending", { cache: "no-store" });
      const result = (await response.json()) as PendingResponse;

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Cannot load pending items.");
        return;
      }

      setItems(result.items ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown pending fetch error.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(item: PendingItem, action: TransitionAction) {
    setProcessingId(item.id);
    setError(null);

    try {
      const response = await fetch("/api/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: item.entity,
          id: item.id,
          action,
          comments: `Queue action: ${action}`,
        }),
      });

      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error ?? `Cannot ${action} item.`);
        return;
      }

      await loadPending();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown transition error.");
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    void loadPending();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (entityFilter !== "all" && item.entity !== entityFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return item.label.toLowerCase().includes(normalizedSearch) || item.status.toLowerCase().includes(normalizedSearch);
  });

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Governance</span>
          <h1>Pending approvals</h1>
          <p>Review records in pending approval and apply final state transitions.</p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{filteredItems.length} pending</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <div className="form-actions" style={{ marginBottom: 12 }}>
          <button type="button" className="hero-link" onClick={() => void loadPending()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh queue"}
          </button>
          <select
            className="site-control"
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value as "all" | PendingItem["entity"])}
            disabled={loading}
            aria-label="Filter by rule type"
          >
            <option value="all">All types</option>
            <option value="mapping">Mappings</option>
            <option value="group">Groups</option>
            <option value="parameter">Parameters</option>
          </select>
          <input
            className="filter-form__input"
            type="text"
            placeholder="Search pending rule"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={loading}
          />
          {error ? <span className="form-status form-status--error">{error}</span> : null}
        </div>

        {loading ? (
          <p>Loading pending approvals...</p>
        ) : filteredItems.length === 0 ? (
          <p>No items in pending approval.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Rule</th>
                  <th>Status</th>
                  <th>Updated at</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isProcessing = processingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>{item.entity}</td>
                      <td>{item.label}</td>
                      <td>{item.status}</td>
                      <td>{item.updated_at}</td>
                      <td>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="table-action"
                            disabled={isProcessing}
                            onClick={() => void runAction(item, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="table-action"
                            disabled={isProcessing}
                            onClick={() => void runAction(item, "reject")}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="table-action"
                            disabled={isProcessing}
                            onClick={() => void runAction(item, "inactivate")}
                          >
                            Inactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
