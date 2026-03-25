import { query } from "@/lib/db";

export async function getUiActorId() {
  const configuredEmail = process.env.APP_ADMIN_EMAIL?.trim();

  if (configuredEmail) {
    const configuredUser = await query<{ id: string }>("select id from mdm_user where email = $1 limit 1", [
      configuredEmail,
    ]);

    if (configuredUser.rowCount && configuredUser.rows[0]) {
      return configuredUser.rows[0].id;
    }
  }

  const fallbackUser = await query<{ id: string }>("select id from mdm_user order by created_at asc limit 1");

  if (fallbackUser.rowCount && fallbackUser.rows[0]) {
    return fallbackUser.rows[0].id;
  }

  throw new Error("Base MDM not initialized correctly.");
}

export async function getDefaultClientRuleContext() {
  const entityTypeResult = await query<{ id: string }>("select id from mdm_entity_type where code = 'CLIENT' limit 1");
  const ruleSetResult = await query<{ id: string }>(
    "select id from mdm_rule_set where code = 'ventas_perseida_clientes' limit 1",
  );

  if (!entityTypeResult.rowCount || !entityTypeResult.rows[0] || !ruleSetResult.rowCount || !ruleSetResult.rows[0]) {
    throw new Error("Base MDM not initialized correctly.");
  }

  return {
    entityTypeId: entityTypeResult.rows[0].id,
    ruleSetId: ruleSetResult.rows[0].id,
  };
}