-- Migration 001: v0.4 candidate table and constraint fixes
-- Run this on existing databases that were initialized before v0.4
-- Safe to run multiple times (all operations use IF NOT EXISTS or are idempotent)

-- Fix mdm_change_log action_type constraint to include 'export', 'extract', 'promote'
-- Required for v0.3.1 export audit logging and v0.4 candidate operations
ALTER TABLE mdm_change_log DROP CONSTRAINT IF EXISTS chk_action_type;
ALTER TABLE mdm_change_log ADD CONSTRAINT chk_action_type
    CHECK (action_type IN ('create', 'update', 'submit', 'approve', 'reject', 'inactivate', 'export', 'extract', 'promote'));

-- Candidate storage table for v0.4 document discovery
CREATE TABLE IF NOT EXISTS mdm_candidate (
    id UUID PRIMARY KEY,
    source_kind VARCHAR(50) NOT NULL,
    candidate_type VARCHAR(30) NOT NULL,
    payload JSONB NOT NULL,
    evidence TEXT,
    confidence NUMERIC(3,2),
    needs_human_review BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    source_document_name VARCHAR(500),
    extraction_batch_id UUID,
    promoted_record_id UUID,
    reviewed_by UUID REFERENCES mdm_user(id),
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    created_by UUID REFERENCES mdm_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_candidate_type CHECK (candidate_type IN ('mapping', 'group', 'parameter', 'unknown')),
    CONSTRAINT chk_candidate_status CHECK (status IN ('pending', 'promoted', 'rejected')),
    CONSTRAINT chk_candidate_source CHECK (source_kind IN ('document', 'external', 'manual')),
    CONSTRAINT chk_candidate_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_candidate_status
    ON mdm_candidate (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_type_status
    ON mdm_candidate (candidate_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_batch
    ON mdm_candidate (extraction_batch_id) WHERE extraction_batch_id IS NOT NULL;
