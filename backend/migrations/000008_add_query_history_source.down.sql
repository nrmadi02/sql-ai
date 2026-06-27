DROP INDEX IF EXISTS idx_query_history_source;

ALTER TABLE query_history
    DROP COLUMN IF EXISTS source;