import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity, unauthorizedResponse } from "@/lib/auth-server";
import { query } from "@/lib/db";

const transitionSchema = z.object({
  entity: z.enum(["mapping", "group", "parameter"]),
  id: z.string().uuid(),
  action: z.enum(["submit", "approve", "reject", "inactivate"]),
  comments: z.string().optional().default(""),
});

const configByEntity = {
  mapping: { tableName: "mdm_mapping_rule", notesColumn: "comments" },
  group: { tableName: "mdm_group_rule", notesColumn: "comments" },
  parameter: { tableName: "mdm_parameter", notesColumn: "description" },
} as const;

const nextStatusByAction = {
  submit: "pending_approval",
  approve: "approved",
  reject: "rejected",
  inactivate: "inactive",
} as const;

const allowedCurrentByAction = {
  submit: ["draft", "rejected"],
  approve: ["pending_approval"],
  reject: ["pending_approval"],
  inactivate: ["draft", "pending_approval", "approved", "rejected"],
} as const;

async function closePreviousApprovedVersions(
  entity: "mapping" | "group" | "parameter",
  recordId: string,
  actorId: string,
  comment: string,
) {
  if (entity === "mapping") {
    const contextResult = await query<{
      rule_set_id: string;
      entity_type_id: string;
      source_key: string;
      source_value: string;
      valid_from: string;
    }>(
      `
        select
          rule_set_id::text,
          entity_type_id::text,
          source_key,
          source_value,
          valid_from::text
        from mdm_mapping_rule
        where id = $1
        limit 1
      `,
      [recordId],
    );

    const context = contextResult.rows[0];
    if (!context) {
      return 0;
    }

    const closedResult = await query<{ id: string }>(
      `
        update mdm_mapping_rule
        set
          status = 'inactive',
          is_active = false,
          valid_to = case
            when valid_to is null or valid_to >= $2::date then ($2::date - interval '1 day')::date
            else valid_to
          end,
          updated_by = $3,
          updated_at = current_timestamp,
          comments = case
            when comments is null or comments = '' then $4
            else comments || ' | ' || $4
          end
        where id <> $1
          and status = 'approved'
          and is_active = true
          and rule_set_id::text = $5
          and entity_type_id::text = $6
          and source_key = $7
          and source_value = $8
          and valid_from < $2::date
          and (valid_to is null or valid_to >= $2::date)
        returning id::text
      `,
      [
        recordId,
        context.valid_from,
        actorId,
        "Auto-inactivated by approval of newer version",
        context.rule_set_id,
        context.entity_type_id,
        context.source_key,
        context.source_value,
      ],
    );

    for (const closed of closedResult.rows) {
      await query(
        `
          insert into mdm_change_log (
            table_name,
            record_id,
            action_type,
            old_value_json,
            new_value_json,
            changed_by,
            approval_status,
            approval_by,
            approval_at,
            comments
          )
          values ('mdm_mapping_rule', $1, 'inactivate', $2::jsonb, $3::jsonb, $4, 'inactive', $4, current_timestamp, $5)
        `,
        [
          closed.id,
          JSON.stringify({ status: "approved" }),
          JSON.stringify({ status: "inactive", reason: "superseded" }),
          actorId,
          comment || "Auto-inactivated by approval of newer version",
        ],
      );
    }

    return closedResult.rowCount ?? closedResult.rows.length;
  }

  if (entity === "group") {
    const contextResult = await query<{
      rule_set_id: string;
      entity_type_id: string;
      member_value: string;
      valid_from: string;
    }>(
      `
        select
          rule_set_id::text,
          entity_type_id::text,
          member_value,
          valid_from::text
        from mdm_group_rule
        where id = $1
        limit 1
      `,
      [recordId],
    );

    const context = contextResult.rows[0];
    if (!context) {
      return 0;
    }

    const closedResult = await query<{ id: string }>(
      `
        update mdm_group_rule
        set
          status = 'inactive',
          is_active = false,
          valid_to = case
            when valid_to is null or valid_to >= $2::date then ($2::date - interval '1 day')::date
            else valid_to
          end,
          updated_by = $3,
          updated_at = current_timestamp,
          comments = case
            when comments is null or comments = '' then $4
            else comments || ' | ' || $4
          end
        where id <> $1
          and status = 'approved'
          and is_active = true
          and rule_set_id::text = $5
          and entity_type_id::text = $6
          and member_value = $7
          and valid_from < $2::date
          and (valid_to is null or valid_to >= $2::date)
        returning id::text
      `,
      [
        recordId,
        context.valid_from,
        actorId,
        "Auto-inactivated by approval of newer version",
        context.rule_set_id,
        context.entity_type_id,
        context.member_value,
      ],
    );

    for (const closed of closedResult.rows) {
      await query(
        `
          insert into mdm_change_log (
            table_name,
            record_id,
            action_type,
            old_value_json,
            new_value_json,
            changed_by,
            approval_status,
            approval_by,
            approval_at,
            comments
          )
          values ('mdm_group_rule', $1, 'inactivate', $2::jsonb, $3::jsonb, $4, 'inactive', $4, current_timestamp, $5)
        `,
        [
          closed.id,
          JSON.stringify({ status: "approved" }),
          JSON.stringify({ status: "inactive", reason: "superseded" }),
          actorId,
          comment || "Auto-inactivated by approval of newer version",
        ],
      );
    }

    return closedResult.rowCount ?? closedResult.rows.length;
  }

  const contextResult = await query<{
    parameter_key: string;
    domain: string;
    parameter_scope_type: string;
    parameter_scope_value: string;
    valid_from: string;
  }>(
    `
      select
        parameter_key,
        domain,
        coalesce(parameter_scope_type, '') as parameter_scope_type,
        coalesce(parameter_scope_value, '') as parameter_scope_value,
        valid_from::text
      from mdm_parameter
      where id = $1
      limit 1
    `,
    [recordId],
  );

  const context = contextResult.rows[0];
  if (!context) {
    return 0;
  }

  const closedResult = await query<{ id: string }>(
    `
      update mdm_parameter
      set
        status = 'inactive',
        is_active = false,
        valid_to = case
          when valid_to is null or valid_to >= $2::date then ($2::date - interval '1 day')::date
          else valid_to
        end,
        updated_by = $3,
        updated_at = current_timestamp,
        description = case
          when description is null or description = '' then $4
          else description || ' | ' || $4
        end
      where id <> $1
        and status = 'approved'
        and is_active = true
        and parameter_key = $5
        and domain = $6
        and coalesce(parameter_scope_type, '') = $7
        and coalesce(parameter_scope_value, '') = $8
        and valid_from < $2::date
        and (valid_to is null or valid_to >= $2::date)
      returning id::text
    `,
    [
      recordId,
      context.valid_from,
      actorId,
      "Auto-inactivated by approval of newer version",
      context.parameter_key,
      context.domain,
      context.parameter_scope_type,
      context.parameter_scope_value,
    ],
  );

  for (const closed of closedResult.rows) {
    await query(
      `
        insert into mdm_change_log (
          table_name,
          record_id,
          action_type,
          old_value_json,
          new_value_json,
          changed_by,
          approval_status,
          approval_by,
          approval_at,
          comments
        )
        values ('mdm_parameter', $1, 'inactivate', $2::jsonb, $3::jsonb, $4, 'inactive', $4, current_timestamp, $5)
      `,
      [
        closed.id,
        JSON.stringify({ status: "approved" }),
        JSON.stringify({ status: "inactive", reason: "superseded" }),
        actorId,
        comment || "Auto-inactivated by approval of newer version",
      ],
    );
  }

  return closedResult.rowCount ?? closedResult.rows.length;
}

export async function POST(request: Request) {
  try {
    const identity = await getAdminIdentity();
    if (!identity) {
      return unauthorizedResponse();
    }

    const payload = transitionSchema.parse(await request.json());
    const tableName = configByEntity[payload.entity].tableName;
    const notesColumn = configByEntity[payload.entity].notesColumn;

    const currentResult = await query<{ status: string }>(`select status from ${tableName} where id = $1`, [payload.id]);

    if (!currentResult.rowCount || !currentResult.rows[0]) {
      return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    }

    const currentStatus = currentResult.rows[0].status;
    const allowed = allowedCurrentByAction[payload.action];

    if (!(allowed as readonly string[]).includes(currentStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid transition from ${currentStatus} using ${payload.action}.`,
        },
        { status: 400 },
      );
    }

    const nextStatus = nextStatusByAction[payload.action];

    const updateResult = await query<{ id: string }>(
      `
        update ${tableName}
        set
          status = $2,
          updated_by = $3,
          updated_at = current_timestamp,
          ${notesColumn} = case when $4 = '' then ${notesColumn} else $4 end
        where id = $1
        returning id
      `,
      [payload.id, nextStatus, identity.userId, payload.comments],
    );

    if (!updateResult.rowCount) {
      return NextResponse.json({ ok: false, error: "Transition failed." }, { status: 400 });
    }

    let closedCount = 0;
    if (payload.action === "approve") {
      closedCount = await closePreviousApprovedVersions(payload.entity, payload.id, identity.userId, payload.comments);
    }

    await query(
      `
        insert into mdm_change_log (
          table_name,
          record_id,
          action_type,
          old_value_json,
          new_value_json,
          changed_by,
          approval_status,
          approval_by,
          approval_at,
          comments
        )
        values ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, current_timestamp, $9)
      `,
      [
        tableName,
        payload.id,
        payload.action,
        JSON.stringify({ status: currentStatus }),
        JSON.stringify({ status: nextStatus }),
        identity.userId,
        nextStatus,
        identity.userId,
        payload.comments || `${payload.action} from workflow queue`,
      ],
    );

    return NextResponse.json({ ok: true, status: nextStatus, autoInactivatedPrevious: closedCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown workflow transition error" },
      { status: 500 },
    );
  }
}
