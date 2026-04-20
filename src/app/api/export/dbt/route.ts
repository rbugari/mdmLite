import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { toCsv } from "@/lib/csv";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

export const dynamic = "force-dynamic";

// Minimal YAML serialiser — no npm deps needed for this structure
function buildDbtYaml(
  exportedAt: string,
  mappingsCsv: string,
  groupsCsv: string,
  parametersCsv: string,
  counts: { mappings: number; groups: number; parameters: number },
): string {
  const lines: string[] = [];
  lines.push("# MDM Lite — dbt seeds export");
  lines.push(`# Generated: ${exportedAt}`);
  lines.push(`# Counts: mappings=${counts.mappings}, groups=${counts.groups}, parameters=${counts.parameters}`);
  lines.push("");
  lines.push("version: 2");
  lines.push("");
  lines.push("seeds:");

  // mdm_mappings
  lines.push("  - name: mdm_mappings");
  lines.push(`    description: "MDM Lite active mapping rules — ${exportedAt}"`);
  lines.push("    config:");
  lines.push("      column_types:");
  lines.push("        priority: integer");
  lines.push("        valid_from: date");
  lines.push("        valid_to: date");
  lines.push("    columns:");
  lines.push("      - name: entity_type_code");
  lines.push('        description: "Entity type code (e.g. CLIENT, PRODUCT)"');
  lines.push("      - name: source_key");
  lines.push('        description: "Source field name"');
  lines.push("      - name: source_value");
  lines.push('        description: "Raw value in the source system"');
  lines.push("      - name: target_value");
  lines.push('        description: "Canonical master data value"');
  lines.push("      - name: target_label");
  lines.push('        description: "Human-readable label for the canonical value"');
  lines.push("      - name: rule_set_code");
  lines.push('        description: "Rule set the mapping belongs to"');
  lines.push("      - name: priority");
  lines.push('        description: "Priority (lower = higher precedence)"');
  lines.push("      - name: valid_from");
  lines.push('        description: "Effective date (inclusive)"');
  lines.push("      - name: valid_to");
  lines.push('        description: "Expiry date (null = open-ended)"');

  // mdm_groups
  lines.push("  - name: mdm_groups");
  lines.push(`    description: "MDM Lite active group rules — ${exportedAt}"`);
  lines.push("    config:");
  lines.push("      column_types:");
  lines.push("        valid_from: date");
  lines.push("        valid_to: date");
  lines.push("    columns:");
  lines.push("      - name: entity_type_code");
  lines.push('        description: "Entity type code"');
  lines.push("      - name: member_value");
  lines.push('        description: "Individual member value"');
  lines.push("      - name: group_value");
  lines.push('        description: "Parent group value"');
  lines.push("      - name: group_label");
  lines.push('        description: "Human-readable group label"');
  lines.push("      - name: rule_set_code");
  lines.push('        description: "Rule set code"');
  lines.push("      - name: valid_from");
  lines.push('        description: "Effective date (inclusive)"');
  lines.push("      - name: valid_to");
  lines.push('        description: "Expiry date (null = open-ended)"');

  // mdm_parameters
  lines.push("  - name: mdm_parameters");
  lines.push(`    description: "MDM Lite active parameters — ${exportedAt}"`);
  lines.push("    config:");
  lines.push("      column_types:");
  lines.push("        valid_from: date");
  lines.push("        valid_to: date");
  lines.push("    columns:");
  lines.push("      - name: parameter_key");
  lines.push('        description: "Parameter identifier"');
  lines.push("      - name: parameter_value");
  lines.push('        description: "Parameter value"');
  lines.push("      - name: data_type");
  lines.push('        description: "Value data type (string, number, boolean, date)"');
  lines.push("      - name: domain");
  lines.push('        description: "Business domain"');
  lines.push("      - name: parameter_scope_type");
  lines.push('        description: "Scope dimension (e.g. customer_segment)"');
  lines.push("      - name: parameter_scope_value");
  lines.push('        description: "Scope value (null = global)"');
  lines.push("      - name: valid_from");
  lines.push('        description: "Effective date (inclusive)"');
  lines.push("      - name: valid_to");
  lines.push('        description: "Expiry date (null = open-ended)"');

  lines.push("");
  lines.push("# --- embedded CSV data (copy each block to seeds/<name>.csv) ---");
  lines.push("");
  lines.push("# seeds/mdm_mappings.csv");
  lines.push("# |");
  mappingsCsv.split("\n").forEach((l) => lines.push(`# ${l}`));
  lines.push("");
  lines.push("# seeds/mdm_groups.csv");
  lines.push("# |");
  groupsCsv.split("\n").forEach((l) => lines.push(`# ${l}`));
  lines.push("");
  lines.push("# seeds/mdm_parameters.csv");
  lines.push("# |");
  parametersCsv.split("\n").forEach((l) => lines.push(`# ${l}`));

  return lines.join("\n");
}

const MAPPING_HEADERS = [
  "entity_type_code", "source_key", "source_value", "target_value",
  "target_label", "rule_set_code", "priority", "valid_from", "valid_to",
];
const GROUP_HEADERS = [
  "entity_type_code", "member_value", "group_value", "group_label",
  "rule_set_code", "valid_from", "valid_to",
];
const PARAMETER_HEADERS = [
  "parameter_key", "parameter_value", "data_type", "domain",
  "parameter_scope_type", "parameter_scope_value", "valid_from", "valid_to",
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
  const counts = {
    mappings: mappings.rows.length,
    groups: groups.rows.length,
    parameters: parameters.rows.length,
  };

  const yaml = buildDbtYaml(
    exportedAt,
    toCsv(MAPPING_HEADERS, mappings.rows),
    toCsv(GROUP_HEADERS, groups.rows),
    toCsv(PARAMETER_HEADERS, parameters.rows),
    counts,
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_export', $2, 'export', $3::jsonb, $4, $5)`,
    [
      createId(),
      createId(),
      JSON.stringify({ kind: "dbt-yaml", counts, exportedAt }),
      identity.userId,
      "Exported dbt seeds YAML",
    ],
  );

  return new NextResponse(yaml, {
    status: 200,
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename="mdm_seeds_${exportedAt.slice(0, 10)}.yaml"`,
      "Cache-Control": "no-store",
    },
  });
}
