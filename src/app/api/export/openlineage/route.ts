import { NextResponse } from "next/server";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

export const dynamic = "force-dynamic";

// OpenLineage spec: https://openlineage.io/spec/1-0-5/OpenLineage.json
// Emits a COMPLETE RunEvent with an mdmRules custom facet and output dataset schemas.

const PRODUCER = "https://github.com/mdm-lite";
const OL_SCHEMA = "https://openlineage.io/spec/1-0-5/OpenLineage.json#/definitions/RunEvent";
const CUSTOM_FACET_SCHEMA = "https://openlineage.io/spec/facets/1-0-0/CustomFacet.json";

function makeField(name: string, type: string, description: string) {
  return { name, type, description };
}

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const [mappingCount, groupCount, parameterCount, pendingCandidates] = await Promise.all([
    query<{ count: string }>("select count(*)::text as count from vw_mdm_mapping_rule_active"),
    query<{ count: string }>("select count(*)::text as count from vw_mdm_group_rule_active"),
    query<{ count: string }>("select count(*)::text as count from vw_mdm_parameter_active"),
    query<{ count: string }>("select count(*)::text as count from mdm_candidate where status = 'pending'"),
  ]);

  const eventTime = new Date().toISOString();
  const runId = createId();

  const counts = {
    mappingRulesCount: Number(mappingCount.rows[0]?.count ?? 0),
    groupRulesCount: Number(groupCount.rows[0]?.count ?? 0),
    parameterRulesCount: Number(parameterCount.rows[0]?.count ?? 0),
    pendingCandidatesCount: Number(pendingCandidates.rows[0]?.count ?? 0),
  };

  const event = {
    $schema: OL_SCHEMA,
    eventType: "COMPLETE",
    eventTime,
    producer: PRODUCER,
    run: {
      runId,
      facets: {
        mdmRules: {
          _producer: PRODUCER,
          _schemaURL: CUSTOM_FACET_SCHEMA,
          ...counts,
          exportedAt: eventTime,
        },
      },
    },
    job: {
      namespace: "mdm-lite",
      name: "mdm-rules-snapshot",
      facets: {
        documentation: {
          _producer: PRODUCER,
          _schemaURL: CUSTOM_FACET_SCHEMA,
          description:
            "MDM Lite governance rules snapshot. Consumed by data catalogues (Purview, Unity Catalog, OpenMetadata) to trace lineage of MDM-governed datasets.",
        },
      },
    },
    inputs: [],
    outputs: [
      {
        namespace: "mdm-lite",
        name: "mdm_mappings",
        facets: {
          dataSource: {
            _producer: PRODUCER,
            _schemaURL: CUSTOM_FACET_SCHEMA,
            name: "mdm-lite",
            uri: "mdm-lite://mappings",
          },
          schema: {
            _producer: PRODUCER,
            _schemaURL: "https://openlineage.io/spec/facets/1-0-0/SchemaDatasetFacet.json",
            fields: [
              makeField("entity_type_code", "STRING", "Entity type code"),
              makeField("source_key", "STRING", "Source field name"),
              makeField("source_value", "STRING", "Raw value in source system"),
              makeField("target_value", "STRING", "Canonical master data value"),
              makeField("target_label", "STRING", "Human-readable canonical label"),
              makeField("rule_set_code", "STRING", "Rule set"),
              makeField("priority", "INTEGER", "Priority (lower = higher precedence)"),
              makeField("valid_from", "DATE", "Effective date inclusive"),
              makeField("valid_to", "DATE", "Expiry date null = open-ended"),
            ],
          },
        },
      },
      {
        namespace: "mdm-lite",
        name: "mdm_groups",
        facets: {
          dataSource: {
            _producer: PRODUCER,
            _schemaURL: CUSTOM_FACET_SCHEMA,
            name: "mdm-lite",
            uri: "mdm-lite://groups",
          },
          schema: {
            _producer: PRODUCER,
            _schemaURL: "https://openlineage.io/spec/facets/1-0-0/SchemaDatasetFacet.json",
            fields: [
              makeField("entity_type_code", "STRING", "Entity type code"),
              makeField("member_value", "STRING", "Individual member value"),
              makeField("group_value", "STRING", "Parent group value"),
              makeField("group_label", "STRING", "Human-readable group label"),
              makeField("rule_set_code", "STRING", "Rule set"),
              makeField("valid_from", "DATE", "Effective date inclusive"),
              makeField("valid_to", "DATE", "Expiry date null = open-ended"),
            ],
          },
        },
      },
      {
        namespace: "mdm-lite",
        name: "mdm_parameters",
        facets: {
          dataSource: {
            _producer: PRODUCER,
            _schemaURL: CUSTOM_FACET_SCHEMA,
            name: "mdm-lite",
            uri: "mdm-lite://parameters",
          },
          schema: {
            _producer: PRODUCER,
            _schemaURL: "https://openlineage.io/spec/facets/1-0-0/SchemaDatasetFacet.json",
            fields: [
              makeField("parameter_key", "STRING", "Parameter identifier"),
              makeField("parameter_value", "STRING", "Parameter value"),
              makeField("data_type", "STRING", "Value data type"),
              makeField("domain", "STRING", "Business domain"),
              makeField("parameter_scope_type", "STRING", "Scope dimension"),
              makeField("parameter_scope_value", "STRING", "Scope value null = global"),
              makeField("valid_from", "DATE", "Effective date inclusive"),
              makeField("valid_to", "DATE", "Expiry date null = open-ended"),
            ],
          },
        },
      },
    ],
  };

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_export', $2, 'export', $3::jsonb, $4, $5)`,
    [
      createId(),
      runId,
      JSON.stringify({ kind: "openlineage", runId, counts, exportedAt: eventTime }),
      identity.userId,
      "Exported OpenLineage RunEvent facets",
    ],
  );

  return NextResponse.json(event, {
    headers: {
      "Content-Disposition": `attachment; filename="mdm_openlineage_${eventTime.slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
