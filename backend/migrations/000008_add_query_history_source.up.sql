ALTER TABLE query_history
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'generator';

CREATE INDEX idx_query_history_source ON query_history(source, created_at DESC);