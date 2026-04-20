-- v0.5: Expand source_kind constraint to support external pipeline source types
-- Adds: legacy2lake, sql, notebook, orchestration

ALTER TABLE mdm_candidate
  DROP CONSTRAINT IF EXISTS chk_candidate_source;

ALTER TABLE mdm_candidate
  ADD CONSTRAINT chk_candidate_source
    CHECK (source_kind IN (
      'document',
      'external',
      'manual',
      'legacy2lake',
      'sql',
      'notebook',
      'orchestration'
    ));
