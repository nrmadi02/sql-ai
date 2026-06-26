CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    sql_content TEXT NOT NULL,
    natural_language_prompt TEXT,
    execution_time_ms INTEGER,
    row_count INTEGER,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_query_history_datasource ON query_history(datasource_id, created_at DESC);