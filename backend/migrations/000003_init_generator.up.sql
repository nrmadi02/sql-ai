CREATE TABLE generator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500),
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE generator_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES generator_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    generated_sql TEXT,
    edited_sql TEXT,
    query_result JSONB,
    execution_time_ms INTEGER,
    row_count INTEGER,
    error_message TEXT,
    referenced_tables TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generator_messages_session ON generator_messages(session_id, created_at);