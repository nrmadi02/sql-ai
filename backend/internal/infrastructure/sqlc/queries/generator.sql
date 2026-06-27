-- Generator Sessions

-- name: GetGeneratorSession :one
SELECT * FROM generator_sessions WHERE id = $1;

-- name: ListGeneratorSessions :many
SELECT * FROM generator_sessions ORDER BY updated_at DESC;

-- name: CreateGeneratorSession :one
INSERT INTO generator_sessions (
    title, datasource_id, ai_provider_id
) VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateGeneratorSession :one
UPDATE generator_sessions SET
    title = $2,
    datasource_id = $3,
    ai_provider_id = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: TouchGeneratorSession :exec
UPDATE generator_sessions SET updated_at = NOW() WHERE id = $1;

-- name: DeleteGeneratorSession :exec
DELETE FROM generator_sessions WHERE id = $1;

-- Generator Messages

-- name: GetGeneratorMessage :one
SELECT * FROM generator_messages WHERE id = $1;

-- name: ListGeneratorMessagesBySession :many
SELECT * FROM generator_messages
WHERE session_id = $1
ORDER BY created_at ASC;

-- name: CreateGeneratorMessage :one
INSERT INTO generator_messages (
    session_id,
    role,
    content,
    generated_sql,
    edited_sql,
    query_result,
    execution_time_ms,
    row_count,
    error_message,
    referenced_tables,
    ai_metadata
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateGeneratorMessageAIResponse :one
UPDATE generator_messages SET
    content = $2,
    generated_sql = $3,
    referenced_tables = $4
WHERE id = $1
RETURNING *;

-- name: UpdateGeneratorMessageExecution :one
UPDATE generator_messages SET
    edited_sql = $2,
    query_result = $3,
    execution_time_ms = $4,
    row_count = $5,
    error_message = $6
WHERE id = $1
RETURNING *;