import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { toCsv, exportFilename } from "@/lib/csv";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

export const dynamic = "force-dynamic";

const HEADERS = [
  "parameter_key",
  "parameter_value",
  "data_type",
  "domain",
  "parameter_scope_type",
  "parameter_scope_value",
  "valid_from",
  "valid_to",
];

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const result = await query(`
    select
      parameter_key,
      parameter_value,
      data_type,
      domain,
      parameter_scope_type,
      parameter_scope_value,
      valid_from::text,
      valid_to::text
    from vw_mdm_parameter_active
    order by parameter_key, parameter_scope_type, parameter_scope_value nulls first
  `);

  const csv = toCsv(HEADERS, result.rows);
  const exportedAt = new Date().toISOString();

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_export', $2, 'export', $3::jsonb, $4, $5)`,
    [
      createId(),
      createId(),
      JSON.stringify({ kind: "parameters", count: result.rows.length, exportedAt }),
      identity.userId,
      "Exported parameters CSV",
    ],
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename("mdm-parameters")}"`,
      "X-Export-Count": String(result.rows.length),
      "X-Export-Timestamp": new Date().toISOString(),
    },
  });
}
