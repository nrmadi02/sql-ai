CREATE TABLE saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sql_content TEXT NOT NULL,
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    tags TEXT[],
    generator_message_id UUID REFERENCES generator_messages(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_queries_datasource ON saved_queries(datasource_id);
CREATE INDEX idx_saved_queries_tags ON saved_queries USING GIN(tags);