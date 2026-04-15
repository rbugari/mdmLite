CREATE TABLE IF NOT EXISTS mdm_role (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mdm_user (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES mdm_role(id),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mdm_entity_type (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mdm_rule_set (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES mdm_user(id),
    updated_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rule_set_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE TABLE IF NOT EXISTS mdm_reference_list (
    id UUID PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    item_label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reference_list UNIQUE (list_name, item_code)
);

CREATE TABLE IF NOT EXISTS mdm_mapping_rule (
    id UUID PRIMARY KEY,
    rule_set_id UUID NOT NULL REFERENCES mdm_rule_set(id),
    entity_type_id UUID NOT NULL REFERENCES mdm_entity_type(id),
    source_key VARCHAR(100) NOT NULL,
    source_value VARCHAR(1000) NOT NULL,
    target_value VARCHAR(1000) NOT NULL,
    target_label VARCHAR(500),
    priority INTEGER NOT NULL DEFAULT 100,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    comments TEXT,
    created_by UUID REFERENCES mdm_user(id),
    updated_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mapping_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'inactive')),
    CONSTRAINT chk_mapping_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_mapping_rule UNIQUE (rule_set_id, entity_type_id, source_key, source_value, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_mapping_lookup
    ON mdm_mapping_rule (entity_type_id, source_key, source_value, valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_mapping_active
    ON mdm_mapping_rule (status, is_active, valid_from, valid_to);

CREATE TABLE IF NOT EXISTS mdm_group_rule (
    id UUID PRIMARY KEY,
    rule_set_id UUID NOT NULL REFERENCES mdm_rule_set(id),
    entity_type_id UUID NOT NULL REFERENCES mdm_entity_type(id),
    member_value VARCHAR(1000) NOT NULL,
    group_value VARCHAR(1000) NOT NULL,
    group_label VARCHAR(500),
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    comments TEXT,
    created_by UUID REFERENCES mdm_user(id),
    updated_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_group_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'inactive')),
    CONSTRAINT chk_group_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_group_rule UNIQUE (rule_set_id, entity_type_id, member_value, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_group_lookup
    ON mdm_group_rule (entity_type_id, member_value, valid_from, valid_to);

CREATE TABLE IF NOT EXISTS mdm_parameter (
    id UUID PRIMARY KEY,
    parameter_key VARCHAR(255) NOT NULL,
    parameter_value VARCHAR(2000) NOT NULL,
    data_type VARCHAR(30) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    parameter_scope_type VARCHAR(50),
    parameter_scope_value VARCHAR(1000),
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_by UUID REFERENCES mdm_user(id),
    updated_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_parameter_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'inactive')),
    CONSTRAINT chk_parameter_type CHECK (data_type IN ('string', 'numeric', 'boolean', 'json')),
    CONSTRAINT chk_parameter_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_parameter UNIQUE (parameter_key, domain, parameter_scope_type, parameter_scope_value, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_parameter_lookup
    ON mdm_parameter (parameter_key, domain, parameter_scope_type, parameter_scope_value, valid_from, valid_to);

CREATE TABLE IF NOT EXISTS mdm_import_batch (
    id UUID PRIMARY KEY,
    import_type VARCHAR(30) NOT NULL,
    source_file_name VARCHAR(255) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
    total_rows INTEGER NOT NULL DEFAULT 0,
    success_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    CONSTRAINT chk_import_type CHECK (import_type IN ('csv', 'xlsx', 'xls')),
    CONSTRAINT chk_import_status CHECK (status IN ('uploaded', 'validated', 'processed', 'failed'))
);

CREATE TABLE IF NOT EXISTS mdm_import_item (
    id UUID PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES mdm_import_batch(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    raw_payload JSONB NOT NULL,
    target_record_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_import_item_status CHECK (status IN ('pending', 'processed', 'error')),
    CONSTRAINT uq_import_item UNIQUE (batch_id, row_number)
);

CREATE TABLE IF NOT EXISTS mdm_change_log (
    id UUID PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    old_value_json JSONB,
    new_value_json JSONB,
    changed_by UUID REFERENCES mdm_user(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(30),
    approval_by UUID REFERENCES mdm_user(id),
    approval_at TIMESTAMPTZ,
    comments TEXT,
    CONSTRAINT chk_action_type CHECK (action_type IN ('create', 'update', 'submit', 'approve', 'reject', 'inactivate'))
);

CREATE INDEX IF NOT EXISTS idx_change_log_record
    ON mdm_change_log (table_name, record_id, changed_at DESC);

CREATE OR REPLACE VIEW vw_mdm_mapping_rule_active AS
SELECT
    r.id,
    rs.code AS rule_set_code,
    et.code AS entity_type_code,
    r.source_key,
    r.source_value,
    r.target_value,
    r.target_label,
    r.priority,
    r.valid_from,
    r.valid_to
FROM mdm_mapping_rule r
JOIN mdm_rule_set rs ON rs.id = r.rule_set_id
JOIN mdm_entity_type et ON et.id = r.entity_type_id
WHERE r.is_active = TRUE
  AND r.status = 'approved'
  AND CURRENT_DATE >= r.valid_from
  AND (r.valid_to IS NULL OR CURRENT_DATE <= r.valid_to);

CREATE OR REPLACE VIEW vw_mdm_group_rule_active AS
SELECT
    r.id,
    rs.code AS rule_set_code,
    et.code AS entity_type_code,
    r.member_value,
    r.group_value,
    r.group_label,
    r.valid_from,
    r.valid_to
FROM mdm_group_rule r
JOIN mdm_rule_set rs ON rs.id = r.rule_set_id
JOIN mdm_entity_type et ON et.id = r.entity_type_id
WHERE r.is_active = TRUE
  AND r.status = 'approved'
  AND CURRENT_DATE >= r.valid_from
  AND (r.valid_to IS NULL OR CURRENT_DATE <= r.valid_to);

CREATE OR REPLACE VIEW vw_mdm_parameter_active AS
SELECT
    p.id,
    p.parameter_key,
    p.parameter_value,
    p.data_type,
    p.domain,
    p.parameter_scope_type,
    p.parameter_scope_value,
    p.valid_from,
    p.valid_to
FROM mdm_parameter p
WHERE p.is_active = TRUE
  AND p.status = 'approved'
  AND CURRENT_DATE >= p.valid_from
  AND (p.valid_to IS NULL OR CURRENT_DATE <= p.valid_to);

INSERT INTO mdm_role (id, code, name, description)
VALUES
    ('00000000-0000-0000-0000-000000000101', 'ADMIN', 'Administrador', 'Gestion completa y aprobacion'),
    ('00000000-0000-0000-0000-000000000102', 'STEWARD', 'Data Steward', 'Mantenimiento y envio a aprobacion'),
    ('00000000-0000-0000-0000-000000000103', 'READ_ONLY', 'Solo Lectura', 'Consulta de informacion')
ON CONFLICT (code) DO NOTHING;

INSERT INTO mdm_entity_type (id, code, name, description)
VALUES
    ('00000000-0000-0000-0000-000000000201', 'CLIENT', 'Cliente', 'Entidad cliente'),
    ('00000000-0000-0000-0000-000000000202', 'PRODUCT', 'Producto', 'Entidad producto'),
    ('00000000-0000-0000-0000-000000000203', 'COMPANY', 'Compania', 'Entidad company o empresa'),
    ('00000000-0000-0000-0000-000000000204', 'COMMERCIAL', 'Comercial', 'Entidad comercial'),
    ('00000000-0000-0000-0000-000000000205', 'SOCIETY', 'Sociedad', 'Entidad sociedad')
ON CONFLICT (code) DO NOTHING;

INSERT INTO mdm_rule_set (id, code, name, domain, description)
VALUES
    ('00000000-0000-0000-0000-000000000301', 'ventas_perseida_clientes', 'Ventas Perseida Clientes', 'ventas_perseida', 'Homologacion de clientes'),
    ('00000000-0000-0000-0000-000000000302', 'ventas_perseida_tarifas', 'Ventas Perseida Tarifas', 'ventas_perseida', 'Parametros y factores comerciales'),
    ('00000000-0000-0000-0000-000000000303', 'ventas_perseida_sociedades', 'Ventas Perseida Sociedades', 'ventas_perseida', 'Mapeos societarios'),
    ('00000000-0000-0000-0000-000000000304', 'ventas_perseida_comerciales', 'Ventas Perseida Comerciales', 'ventas_perseida', 'Homologacion comercial')
ON CONFLICT (code) DO NOTHING;

INSERT INTO mdm_user (id, email, full_name, role_id, password_hash)
SELECT
    '00000000-0000-0000-0000-000000000401',
    'admin@mdmlite.local',
    'Administrador Inicial',
    id,
    'CHANGE_ME_WITH_A_REAL_PASSWORD_HASH'
FROM mdm_role
WHERE code = 'ADMIN'
ON CONFLICT (email) DO NOTHING;
