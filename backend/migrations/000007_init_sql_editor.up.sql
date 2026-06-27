CREATE TABLE sql_editor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'New Session',
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sql_editor_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sql_editor_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Query 1',
    sql_content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    last_result JSONB,
    execution_time_ms INTEGER,
    row_count INTEGER,
    last_status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sql_editor_tabs_session ON sql_editor_tabs(session_id, sort_order);
CREATE INDEX idx_sql_editor_sessions_datasource ON sql_editor_sessions(datasource_id);