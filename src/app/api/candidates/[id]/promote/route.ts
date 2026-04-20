import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createId } from "@/lib/ids";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  comments: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getAdminIdentity();
  if (!identity) return unauthorizedResponse();

  const { id } = await params;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await request.text();
    if (raw) body = bodySchema.parse(JSON.parse(raw));
  } catch {
    // optional body — ignore parse errors
  }

  const candidateResult = await query<{
    id: string;
    candidate_type: string;
    payload: Record<string, unknown>;
    status: string;
  }>(
    `select id::text, candidate_type, payload, status from mdm_candidate where id = $1`,
    [id],
  );

  const candidate = candidateResult.rows[0];
  if (!candidate) {
    return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
  }
  if (candidate.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: `Candidate is already ${candidate.status}.` },
      { status: 409 },
    );
  }

  const payload = candidate.payload;
  let promotedRecordId: string | null = null;

  try {
    if (candidate.candidate_type === "mapping") {
      promotedRecordId = await promoteMapping(payload, identity.userId);
    } else if (candidate.candidate_type === "group") {
      promotedRecordId = await promoteGroup(payload, identity.userId);
    } else if (candidate.candidate_type === "parameter") {
      promotedRecordId = await promoteParameter(payload, identity.userId);
    } else {
      return NextResponse.json(
        { ok: false, error: "Cannot promote a candidate of type 'unknown'." },
        { status: 400 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Promote failed." },
      { status: 422 },
    );
  }

  await query(
    `update mdm_candidate
     set status = 'promoted',
         promoted_record_id = $2,
         reviewed_by = $3,
         reviewed_at = current_timestamp,
         review_comments = $4
     where id = $1`,
    [id, promotedRecordId, identity.userId, body.comments ?? "Promoted to draft rule"],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_candidate', $2, 'promote', $3::jsonb, $4, $5)`,
    [
      createId(),
      id,
      JSON.stringify({ candidateType: candidate.candidate_type, promotedRecordId }),
      identity.userId,
      body.comments ?? "Promoted to draft rule",
    ],
  );

  return NextResponse.json({ ok: true, promotedRecordId });
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

  // Fall back to defaults if not found
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

async function promoteMapping(payload: Record<string, unknown>, actorId: string): Promise<string> {
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
      typeof payload.validFrom === "string" ? payload.validFrom : new Date().toISOString().slice(0, 10),
      actorId,
    ],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_mapping_rule', $2, 'create', $3::jsonb, $4, $5)`,
    [createId(), id, JSON.stringify(payload), actorId, "Created from candidate promotion"],
  );

  return id;
}

async function promoteGroup(payload: Record<string, unknown>, actorId: string): Promise<string> {
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
      typeof payload.validFrom === "string" ? payload.validFrom : new Date().toISOString().slice(0, 10),
      actorId,
    ],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_group_rule', $2, 'create', $3::jsonb, $4, $5)`,
    [createId(), id, JSON.stringify(payload), actorId, "Created from candidate promotion"],
  );

  return id;
}

async function promoteParameter(
  payload: Record<string, unknown>,
  actorId: string,
): Promise<string> {
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
      typeof payload.validFrom === "string" ? payload.validFrom : new Date().toISOString().slice(0, 10),
      actorId,
    ],
  );

  await query(
    `insert into mdm_change_log (id, table_name, record_id, action_type, new_value_json, changed_by, comments)
     values ($1, 'mdm_parameter', $2, 'create', $3::jsonb, $4, $5)`,
    [createId(), id, JSON.stringify(payload), actorId, "Created from candidate promotion"],
  );

  return id;
}
