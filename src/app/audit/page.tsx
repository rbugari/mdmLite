import { requireAdminPage } from "@/lib/auth-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams?: Promise<{
    table?: string;
    action?: string;
    recordId?: string;
  }>;
};

type AuditItem = {
  id: string;
  table_name: string;
  record_id: string;
  action_type: string;
  changed_at: string;
  approval_status: string | null;
  comments: string | null;
  changed_by_email: string | null;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAdminPage("/audit");
  const params = (await searchParams) ?? {};
  const table = params.table?.trim() ?? "";
  const action = params.action?.trim() ?? "";
  const recordId = params.recordId?.trim() ?? "";

  const conditions: string[] = [];
  const values: string[] = [];

  if (table) {
    values.push(table);
    conditions.push(`l.table_name = $${values.length}`);
  }

  if (action) {
    values.push(action);
    conditions.push(`l.action_type = $${values.length}`);
  }

  if (recordId) {
    values.push(recordId);
    conditions.push(`l.record_id::text = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const result = await query<AuditItem>(
    `
      select
        l.id::text,
        l.table_name,
        l.record_id::text,
        l.action_type,
        l.changed_at::text,
        l.approval_status,
        l.comments,
        u.email as changed_by_email
      from mdm_change_log l
      left join mdm_user u on u.id = l.changed_by
      ${whereClause}
      order by l.changed_at desc
      limit 300
    `,
    values,
  );

  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-head">
        <div>
          <span className="eyebrow">Governance</span>
          <h1>Audit trail</h1>
          <p>Track who changed what, when, and with which workflow status.</p>
        </div>
        <div className="section-meta">
          <span className="metric-pill">{result.rows.length} events</span>
        </div>
      </section>

      <section className="table-panel table-panel--padded">
        <form className="inline-form-grid inline-form-grid--tight" method="get">
          <label className="form-field">
            <span>Table</span>
            <select name="table" defaultValue={table}>
              <option value="">All</option>
              <option value="mdm_mapping_rule">mdm_mapping_rule</option>
              <option value="mdm_group_rule">mdm_group_rule</option>
              <option value="mdm_parameter">mdm_parameter</option>
            </select>
          </label>

          <label className="form-field">
            <span>Action</span>
            <select name="action" defaultValue={action}>
              <option value="">All</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="submit">submit</option>
              <option value="approve">approve</option>
              <option value="reject">reject</option>
              <option value="inactivate">inactivate</option>
            </select>
          </label>

          <label className="form-field">
            <span>Record ID</span>
            <input name="recordId" type="text" defaultValue={recordId} placeholder="UUID" />
          </label>

          <div className="form-actions form-field--full">
            <button type="submit" className="hero-link hero-link--primary">Apply filters</button>
          </div>
        </form>
      </section>

      <section className="table-panel">
        {result.rows.length === 0 ? (
          <div className="empty-state">No audit events for the current filter.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Table</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>By</th>
                  <th>Status</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.changed_at}</td>
                    <td>{item.table_name}</td>
                    <td>{item.action_type}</td>
                    <td>{item.record_id}</td>
                    <td>{item.changed_by_email ?? "-"}</td>
                    <td>{item.approval_status ?? "-"}</td>
                    <td>{item.comments ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
