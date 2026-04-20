import type { QueryResultRow } from "pg";

import { query } from "@/lib/db";

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type PageOptions = {
  page?: number;
  pageSize?: number;
};

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

function normalizePagination(options?: PageOptions) {
  const rawPage = options?.page ?? 1;
  const rawPageSize = options?.pageSize ?? 25;
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const pageSize = Number.isFinite(rawPageSize) ? Math.min(100, Math.max(5, Math.floor(rawPageSize))) : 25;
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

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

export async function getActiveMappings(
  search?: string,
  options?: PageOptions & {
    entityTypeCode?: string;
    ruleSetCode?: string;
  },
) {
  const searchClause = buildSearchClause(search, [
    "entity_type_code",
    "source_key",
    "source_value",
    "target_value",
    "rule_set_code",
  ]);

  const conditions: string[] = [];
  const values: unknown[] = [...searchClause.values];

  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace(/^where\s+/i, ""));
  }

  const entityTypeCode = options?.entityTypeCode?.trim();
  if (entityTypeCode) {
    values.push(entityTypeCode);
    conditions.push(`entity_type_code = $${values.length}`);
  }

  const ruleSetCode = options?.ruleSetCode?.trim();
  if (ruleSetCode) {
    values.push(ruleSetCode);
    conditions.push(`rule_set_code = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const pagination = normalizePagination(options);

  const countResult = await query<CountRow>(
    `
      select count(*)::text as count
      from vw_mdm_mapping_rule_active
      ${whereClause}
    `,
    values,
  );

  const listValues: unknown[] = [...values, pagination.pageSize, pagination.offset];

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
    ${whereClause}
    order by entity_type_code, source_value
    limit $${listValues.length - 1}
    offset $${listValues.length}
  `, listValues);

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return {
    items: result.rows,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  } as PageResult<ActiveMapping>;
}

export async function getActiveParameters(
  search?: string,
  options?: PageOptions & {
    domain?: string;
    scopeType?: string;
  },
) {
  const searchClause = buildSearchClause(search, [
    "parameter_key",
    "parameter_value",
    "domain",
    "coalesce(parameter_scope_type, '')",
    "coalesce(parameter_scope_value, '')",
  ]);

  const conditions: string[] = [];
  const values: unknown[] = [...searchClause.values];

  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace(/^where\s+/i, ""));
  }

  const domain = options?.domain?.trim();
  if (domain) {
    values.push(domain);
    conditions.push(`domain = $${values.length}`);
  }

  const scopeType = options?.scopeType?.trim();
  if (scopeType) {
    values.push(scopeType);
    conditions.push(`coalesce(parameter_scope_type, '') = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const pagination = normalizePagination(options);

  const countResult = await query<CountRow>(
    `
      select count(*)::text as count
      from vw_mdm_parameter_active
      ${whereClause}
    `,
    values,
  );

  const listValues: unknown[] = [...values, pagination.pageSize, pagination.offset];

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
    ${whereClause}
    order by parameter_key, parameter_scope_value nulls first
    limit $${listValues.length - 1}
    offset $${listValues.length}
  `, listValues);

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return {
    items: result.rows,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  } as PageResult<ActiveParameter>;
}

export async function getActiveGroups(
  search?: string,
  options?: PageOptions & {
    entityTypeCode?: string;
    ruleSetCode?: string;
  },
) {
  const searchClause = buildSearchClause(search, [
    "entity_type_code",
    "member_value",
    "group_value",
    "coalesce(group_label, '')",
    "rule_set_code",
  ]);

  const conditions: string[] = [];
  const values: unknown[] = [...searchClause.values];

  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace(/^where\s+/i, ""));
  }

  const entityTypeCode = options?.entityTypeCode?.trim();
  if (entityTypeCode) {
    values.push(entityTypeCode);
    conditions.push(`entity_type_code = $${values.length}`);
  }

  const ruleSetCode = options?.ruleSetCode?.trim();
  if (ruleSetCode) {
    values.push(ruleSetCode);
    conditions.push(`rule_set_code = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const pagination = normalizePagination(options);

  const countResult = await query<CountRow>(
    `
      select count(*)::text as count
      from vw_mdm_group_rule_active
      ${whereClause}
    `,
    values,
  );

  const listValues: unknown[] = [...values, pagination.pageSize, pagination.offset];

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
    ${whereClause}
    order by entity_type_code, member_value
    limit $${listValues.length - 1}
    offset $${listValues.length}
  `, listValues);

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return {
    items: result.rows,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  } as PageResult<ActiveGroup>;
}

export async function getDashboardStats() {
  const [mappingCount, groupCount, parameterCount, pendingApprovals, pendingCandidates] = await Promise.all([
    query<CountRow>("select count(*)::text as count from vw_mdm_mapping_rule_active"),
    query<CountRow>("select count(*)::text as count from vw_mdm_group_rule_active"),
    query<CountRow>("select count(*)::text as count from vw_mdm_parameter_active"),
    query<CountRow>(`
      select count(*)::text as count from (
        select id from mdm_mapping_rule where is_active = true and status = 'pending_approval'
        union all
        select id from mdm_group_rule where is_active = true and status = 'pending_approval'
        union all
        select id from mdm_parameter where is_active = true and status = 'pending_approval'
      ) t
    `),
    query<CountRow>("select count(*)::text as count from mdm_candidate where status = 'pending'"),
  ]);

  return {
    mappings: Number(mappingCount.rows[0]?.count ?? 0),
    groups: Number(groupCount.rows[0]?.count ?? 0),
    parameters: Number(parameterCount.rows[0]?.count ?? 0),
    pendingApprovals: Number(pendingApprovals.rows[0]?.count ?? 0),
    pendingCandidates: Number(pendingCandidates.rows[0]?.count ?? 0),
  };
}