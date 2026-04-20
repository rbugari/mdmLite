import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { toCsv } from "@/lib/csv";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

export const dynamic = "force-dynamic";

const MAPPING_HEADERS = [
  "entity_type_code",
  "source_key",
  "source_value",
  "target_value",
  "target_label",
  "rule_set_code",
  "priority",
  "valid_from",
  "valid_to",
];

const GROUP_HEADERS = [
  "entity_type_code",
  "member_value",
  "group_value",
  "group_label",
  "rule_set_code",
  "valid_from",
  "valid_to",
];

const PARAMETER_HEADERS = [
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

  const [mappings, groups, parameters] = await Promise.all([
    query(`
      select entity_type_code, source_key, source_value, target_value, target_label,
             rule_set_code, priority, valid_from::text, valid_to::text
      from vw_mdm_mapping_rule_active
      order by entity_type_code, source_value
    `),
    query(`
      select entity_type_code, member_value, group_value, group_label,
             rule_set_code, valid_from::text, valid_to::text
      from vw_mdm_group_rule_active
      order by entity_type_code, member_value
    `),
    query(`
      select parameter_key, parameter_value, data_type, domain,
             parameter_scope_type, parameter_scope_value, valid_from::text, valid_to::text
      from vw_mdm_parameter_active
      order by parameter_key, parameter_scope_type, parameter_scope_value nulls first
    `),
  ]);

  const exportedAt = new Date().toISOString();

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_export', $2, 'export', $3::jsonb, $4, $5)`,
    [
      createId(),
      createId(),
      JSON.stringify({ kind: "snapshot", counts: { mappings: mappings.rows.length, groups: groups.rows.length, parameters: parameters.rows.length }, exportedAt }),
      identity.userId,
      "Exported snapshot (all active views)",
    ],
  );

  return NextResponse.json({
    ok: true,
    exportedAt,
    exportedBy: identity.email,
    counts: {
      mappings: mappings.rows.length,
      groups: groups.rows.length,
      parameters: parameters.rows.length,
    },
    files: {
      "mappings.csv": toCsv(MAPPING_HEADERS, mappings.rows),
      "groups.csv": toCsv(GROUP_HEADERS, groups.rows),
      "parameters.csv": toCsv(PARAMETER_HEADERS, parameters.rows),
    },
  });
}
