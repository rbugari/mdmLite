import type { QueryResultRow } from "pg";

import { query } from "@/lib/db";

export type ActiveMapping = {
  id: string;
  rule_set_code: string;
  entity_type_code: string;
  source_key: string;
  source_value: string;
  target_value: string;
  target_label: string | null;
  priority: number;
  valid_from: string;
  valid_to: string | null;
};

export type ActiveParameter = {
  id: string;
  parameter_key: string;
  parameter_value: string;
  data_type: string;
  domain: string;
  parameter_scope_type: string | null;
  parameter_scope_value: string | null;
  valid_from: string;
  valid_to: string | null;
};

export type ActiveGroup = {
  id: string;
  rule_set_code: string;
  entity_type_code: string;
  member_value: string;
  group_value: string;
  group_label: string | null;
  valid_from: string;
  valid_to: string | null;
};

type CountRow = QueryResultRow & {
  count: string;
};

function buildSearchClause(search: string | undefined, fields: string[]) {
  const term = search?.trim();

  if (!term) {
    return {
      clause: "",
      values: [] as string[],
    };
  }

  const predicate = fields.map((field) => `${field} ilike $1`).join(" or ");

  return {
    clause: `where ${predicate}`,
    values: [`%${term}%`],
  };
}

export async function getActiveMappings(search?: string) {
  const searchClause = buildSearchClause(search, [
    "entity_type_code",
    "source_key",
    "source_value",
    "target_value",
    "rule_set_code",
  ]);

  const result = await query<ActiveMapping>(`
    select
      id,
      rule_set_code,
      entity_type_code,
      source_key,
      source_value,
      target_value,
      target_label,
      priority,
      valid_from::text,
      valid_to::text
    from vw_mdm_mapping_rule_active
    ${searchClause.clause}
    order by entity_type_code, source_value
  `, searchClause.values);

  return result.rows;
}

export async function getActiveParameters(search?: string) {
  const searchClause = buildSearchClause(search, [
    "parameter_key",
    "parameter_value",
    "domain",
    "coalesce(parameter_scope_type, '')",
    "coalesce(parameter_scope_value, '')",
  ]);

  const result = await query<ActiveParameter>(`
    select
      id,
      parameter_key,
      parameter_value,
      data_type,
      domain,
      parameter_scope_type,
      parameter_scope_value,
      valid_from::text,
      valid_to::text
    from vw_mdm_parameter_active
    ${searchClause.clause}
    order by parameter_key, parameter_scope_value nulls first
  `, searchClause.values);

  return result.rows;
}

export async function getActiveGroups(search?: string) {
  const searchClause = buildSearchClause(search, [
    "entity_type_code",
    "member_value",
    "group_value",
    "coalesce(group_label, '')",
    "rule_set_code",
  ]);

  const result = await query<ActiveGroup>(`
    select
      id,
      rule_set_code,
      entity_type_code,
      member_value,
      group_value,
      group_label,
      valid_from::text,
      valid_to::text
    from vw_mdm_group_rule_active
    ${searchClause.clause}
    order by entity_type_code, member_value
  `, searchClause.values);

  return result.rows;
}

export async function getDashboardStats() {
  const [mappingCount, groupCount, parameterCount] = await Promise.all([
    query<CountRow>("select count(*)::text as count from vw_mdm_mapping_rule_active"),
    query<CountRow>("select count(*)::text as count from vw_mdm_group_rule_active"),
    query<CountRow>("select count(*)::text as count from vw_mdm_parameter_active"),
  ]);

  return {
    mappings: Number(mappingCount.rows[0]?.count ?? 0),
    groups: Number(groupCount.rows[0]?.count ?? 0),
    parameters: Number(parameterCount.rows[0]?.count ?? 0),
  };
}