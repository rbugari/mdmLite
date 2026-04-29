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

type Params = { params: Promise<{ batchId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { batchId } = await params;

  const [batchRows, mappings, groups, parameters] = await Promise.all([
    query<{ candidate_type: string; status: string }>(
      `select candidate_type, status
       from mdm_candidate
       where extraction_batch_id = $1`,
      [batchId],
    ),
    query(
      `select
         et.code as entity_type_code,
         m.source_key,
         m.source_value,
         m.target_value,
         m.target_label,
         rs.code as rule_set_code,
         m.priority,
         m.valid_from::text,
         m.valid_to::text
       from mdm_candidate c
       join mdm_mapping_rule m on m.id = c.promoted_record_id
       join mdm_rule_set rs on rs.id = m.rule_set_id
       join mdm_entity_type et on et.id = m.entity_type_id
       where c.extraction_batch_id = $1
         and c.candidate_type = 'mapping'
         and c.status = 'promoted'
       order by et.code, m.source_value`,
      [batchId],
    ),
    query(
      `select
         et.code as entity_type_code,
         g.member_value,
         g.group_value,
         g.group_label,
         rs.code as rule_set_code,
         g.valid_from::text,
         g.valid_to::text
       from mdm_candidate c
       join mdm_group_rule g on g.id = c.promoted_record_id
       join mdm_rule_set rs on rs.id = g.rule_set_id
       join mdm_entity_type et on et.id = g.entity_type_id
       where c.extraction_batch_id = $1
         and c.candidate_type = 'group'
         and c.status = 'promoted'
       order by et.code, g.member_value`,
      [batchId],
    ),
    query(
      `select
         p.parameter_key,
         p.parameter_value,
         p.data_type,
         p.domain,
         p.parameter_scope_type,
         p.parameter_scope_value,
         p.valid_from::text,
         p.valid_to::text
       from mdm_candidate c
       join mdm_parameter p on p.id = c.promoted_record_id
       where c.extraction_batch_id = $1
         and c.candidate_type = 'parameter'
         and c.status = 'promoted'
       order by p.parameter_key, p.parameter_scope_type, p.parameter_scope_value nulls first`,
      [batchId],
    ),
  ]);

  if (batchRows.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Batch not found." }, { status: 404 });
  }

  const counts = {
    total: batchRows.rows.length,
    pending: batchRows.rows.filter((row) => row.status === "pending").length,
    promoted: batchRows.rows.filter((row) => row.status === "promoted").length,
    rejected: batchRows.rows.filter((row) => row.status === "rejected").length,
  };
  const exportedAt = new Date().toISOString();

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_export', $2, 'export', $3::jsonb, $4, $5)`,
    [
      createId(),
      batchId,
      JSON.stringify({
        kind: "batch-export",
        batchId,
        exportedAt,
        counts: {
          mappings: mappings.rows.length,
          groups: groups.rows.length,
          parameters: parameters.rows.length,
          candidates: counts,
        },
      }),
      identity.userId,
      `Exported promoted records for batch ${batchId}`,
    ],
  );

  return NextResponse.json({
    ok: true,
    batchId,
    exportedAt,
    exportedBy: identity.email,
    counts: {
      mappings: mappings.rows.length,
      groups: groups.rows.length,
      parameters: parameters.rows.length,
      candidates: counts,
    },
    files: {
      "mappings.csv": toCsv(MAPPING_HEADERS, mappings.rows),
      "groups.csv": toCsv(GROUP_HEADERS, groups.rows),
      "parameters.csv": toCsv(PARAMETER_HEADERS, parameters.rows),
    },
  });
}