CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE datasources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    db_type VARCHAR(50) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    ssl_mode VARCHAR(50) DEFAULT 'disable',
    max_connections INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    schema_cache JSONB,
    schema_cached_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);