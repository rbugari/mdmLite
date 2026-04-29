import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

type CandidateType = "mapping" | "group" | "parameter" | "unknown";

type PromoteCandidateParams = {
  candidateId: string;
  candidateType: CandidateType;
  payload: Record<string, unknown>;
  actorId?: string | null;
  comments?: string;
};

export class PromotionConflictError extends Error {
  conflictRecordId: string;

  constructor(message: string, conflictRecordId: string) {
    super(message);
    this.name = "PromotionConflictError";
    this.conflictRecordId = conflictRecordId;
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeValidFromValue(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    return todayIsoDate();
  }

  const trimmed = raw.trim();
  const normalized = trimmed.toLowerCase();

  if (["today", "current_date", "current date", "now"].includes(normalized)) {
    return todayIsoDate();
  }

  if (normalized === "tomorrow") {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return value.toISOString().slice(0, 10);
  }

  if (normalized === "yesterday") {
    const value = new Date();
    value.setDate(value.getDate() - 1);
    return value.toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  throw new Error(`Invalid validFrom value: ${trimmed}`);
}

export function normalizeCandidatePayload(
  candidateType: CandidateType,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (candidateType === "unknown") {
    return payload;
  }

  return {
    ...payload,
    validFrom: normalizeValidFromValue(payload.validFrom),
  };
}

async function resolveRuleSetAndEntityType(
  ruleSetCode: unknown,
  entityTypeCode: unknown,
): Promise<{ ruleSetId: string; entityTypeId: string }> {
  const defaultRuleSetCode = "ventas_perseida_clientes";
  const defaultEntityTypeCode = "CLIENT";

  const rsCode = typeof ruleSetCode === "string" && ruleSetCode ? ruleSetCode : defaultRuleSetCode;
  const etCode =
    typeof entityTypeCode === "string" && entityTypeCode ? entityTypeCode : defaultEntityTypeCode;

  const rs = await query<{ id: string }>(
    `select id::text from mdm_rule_set where code = $1 and is_active = true limit 1`,
    [rsCode],
  );
  const et = await query<{ id: string }>(
    `select id::text from mdm_entity_type where code = $1 and is_active = true limit 1`,
    [etCode],
  );

  const ruleSetId =
    rs.rows[0]?.id ??
    (
      await query<{ id: string }>(
        `select id::text from mdm_rule_set where code = $1 limit 1`,
        [defaultRuleSetCode],
      )
    ).rows[0]?.id;
  const entityTypeId =
    et.rows[0]?.id ??
    (
      await query<{ id: string }>(
        `select id::text from mdm_entity_type where code = $1 limit 1`,
        [defaultEntityTypeCode],
      )
    ).rows[0]?.id;

  if (!ruleSetId || !entityTypeId) {
    throw new Error("Cannot resolve rule_set or entity_type. Check demo data is loaded.");
  }

  return { ruleSetId, entityTypeId };
}

async function assertNoActiveMappingConflict(payload: Record<string, unknown>) {
  const result = await query<{ id: string }>(
    `select id::text
     from vw_mdm_mapping_rule_active
     where rule_set_code = $1
       and entity_type_code = $2
       and source_key = $3
       and source_value = $4
       and target_value = $5
     limit 1`,
    [
      typeof payload.ruleSetCode === "string" && payload.ruleSetCode
        ? payload.ruleSetCode
        : "ventas_perseida_clientes",
      typeof payload.entityTypeCode === "string" && payload.entityTypeCode
        ? payload.entityTypeCode
        : "CLIENT",
      typeof payload.sourceKey === "string" ? payload.sourceKey : "extracted",
      typeof payload.sourceValue === "string" ? payload.sourceValue : "",
      typeof payload.targetValue === "string" ? payload.targetValue : "",
    ],
  );

  if (result.rows[0]?.id) {
    throw new PromotionConflictError(
      "An active mapping rule with the same source and target already exists.",
      result.rows[0].id,
    );
  }
}

async function assertNoActiveGroupConflict(payload: Record<string, unknown>) {
  const result = await query<{ id: string }>(
    `select id::text
     from vw_mdm_group_rule_active
     where rule_set_code = $1
       and entity_type_code = $2
       and member_value = $3
       and group_value = $4
     limit 1`,
    [
      typeof payload.ruleSetCode === "string" && payload.ruleSetCode
        ? payload.ruleSetCode
        : "ventas_perseida_clientes",
      typeof payload.entityTypeCode === "string" && payload.entityTypeCode
        ? payload.entityTypeCode
        : "CLIENT",
      typeof payload.memberValue === "string" ? payload.memberValue : "",
      typeof payload.groupValue === "string" ? payload.groupValue : "",
    ],
  );

  if (result.rows[0]?.id) {
    throw new PromotionConflictError(
      "An active group rule with the same member and group already exists.",
      result.rows[0].id,
    );
  }
}

async function assertNoActiveParameterConflict(payload: Record<string, unknown>) {
  const result = await query<{ id: string }>(
    `select id::text
     from vw_mdm_parameter_active
     where parameter_key = $1
       and parameter_value = $2
       and domain = $3
       and coalesce(parameter_scope_type, '') = coalesce($4, '')
       and coalesce(parameter_scope_value, '') = coalesce($5, '')
     limit 1`,
    [
      typeof payload.parameterKey === "string" ? payload.parameterKey : "extracted_param",
      typeof payload.parameterValue === "string" ? payload.parameterValue : "",
      typeof payload.domain === "string" ? payload.domain : "ventas_perseida",
      typeof payload.parameterScopeType === "string" ? payload.parameterScopeType : null,
      typeof payload.parameterScopeValue === "string" ? payload.parameterScopeValue : null,
    ],
  );

  if (result.rows[0]?.id) {
    throw new PromotionConflictError(
      "An active parameter with the same key, value, and scope already exists.",
      result.rows[0].id,
    );
  }
}

async function createMappingDraft(payload: Record<string, unknown>, actorId: string | null) {
  await assertNoActiveMappingConflict(payload);

  const { ruleSetId, entityTypeId } = await resolveRuleSetAndEntityType(
    payload.ruleSetCode,
    payload.entityTypeCode,
  );

  const id = createId();
  await query(
    `insert into mdm_mapping_rule
       (id, rule_set_id, entity_type_id, source_key, source_value, target_value, target_label,
        priority, valid_from, status, is_active, comments, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', true, 'Promoted from candidate', $10)`,
    [
      id,
      ruleSetId,
      entityTypeId,
      typeof payload.sourceKey === "string" ? payload.sourceKey : "extracted",
      typeof payload.sourceValue === "string" ? payload.sourceValue : "",
      typeof payload.targetValue === "string" ? payload.targetValue : "",
      typeof payload.targetLabel === "string" ? payload.targetLabel : null,
      typeof payload.priority === "number" ? payload.priority : 100,
      String(payload.validFrom),
      actorId,
    ],
  );

  return id;
}

async function createGroupDraft(payload: Record<string, unknown>, actorId: string | null) {
  await assertNoActiveGroupConflict(payload);

  const { ruleSetId, entityTypeId } = await resolveRuleSetAndEntityType(
    payload.ruleSetCode,
    payload.entityTypeCode,
  );

  const id = createId();
  await query(
    `insert into mdm_group_rule
       (id, rule_set_id, entity_type_id, member_value, group_value, group_label,
        valid_from, status, is_active, comments, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, 'draft', true, 'Promoted from candidate', $8)`,
    [
      id,
      ruleSetId,
      entityTypeId,
      typeof payload.memberValue === "string" ? payload.memberValue : "",
      typeof payload.groupValue === "string" ? payload.groupValue : "",
      typeof payload.groupLabel === "string" ? payload.groupLabel : null,
      String(payload.validFrom),
      actorId,
    ],
  );

  return id;
}

async function createParameterDraft(payload: Record<string, unknown>, actorId: string | null) {
  await assertNoActiveParameterConflict(payload);

  const id = createId();
  await query(
    `insert into mdm_parameter
       (id, parameter_key, parameter_value, data_type, domain, parameter_scope_type,
        parameter_scope_value, valid_from, status, is_active, description, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', true, 'Promoted from candidate', $9)`,
    [
      id,
      typeof payload.parameterKey === "string" ? payload.parameterKey : "extracted_param",
      typeof payload.parameterValue === "string" ? payload.parameterValue : "",
      ["string", "numeric", "boolean", "json"].includes(String(payload.dataType))
        ? String(payload.dataType)
        : "string",
      typeof payload.domain === "string" ? payload.domain : "ventas_perseida",
      typeof payload.parameterScopeType === "string" ? payload.parameterScopeType : null,
      typeof payload.parameterScopeValue === "string" ? payload.parameterScopeValue : null,
      String(payload.validFrom),
      actorId,
    ],
  );

  return id;
}

export async function promoteCandidateRecord({
  candidateId,
  candidateType,
  payload,
  actorId = null,
  comments,
}: PromoteCandidateParams): Promise<{ promotedRecordId: string; normalizedPayload: Record<string, unknown> }> {
  const normalizedPayload = normalizeCandidatePayload(candidateType, payload);

  let promotedRecordId: string;
  if (candidateType === "mapping") {
    promotedRecordId = await createMappingDraft(normalizedPayload, actorId);
  } else if (candidateType === "group") {
    promotedRecordId = await createGroupDraft(normalizedPayload, actorId);
  } else if (candidateType === "parameter") {
    promotedRecordId = await createParameterDraft(normalizedPayload, actorId);
  } else {
    throw new Error("Cannot promote a candidate of type 'unknown'.");
  }

  await query(
    `update mdm_candidate
     set status = 'promoted',
         promoted_record_id = $2,
         reviewed_by = $3,
         reviewed_at = current_timestamp,
         review_comments = $4,
         payload = $5::jsonb
     where id = $1`,
    [
      candidateId,
      promotedRecordId,
      actorId,
      comments ?? "Promoted to draft rule",
      JSON.stringify(normalizedPayload),
    ],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_candidate', $2, 'promote', $3::jsonb, $4, $5)`,
    [
      createId(),
      candidateId,
      JSON.stringify({ candidateType, promotedRecordId, normalizedPayload }),
      actorId,
      comments ?? "Promoted to draft rule",
    ],
  );

  return { promotedRecordId, normalizedPayload };
}