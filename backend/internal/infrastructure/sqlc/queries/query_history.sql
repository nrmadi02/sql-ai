-- name: GetQueryHistory :one
SELECT * FROM query_history WHERE id = $1;

-- name: CreateQueryHistory :one
INSERT INTO query_history (
    datasource_id,
    sql_content,
    natural_language_prompt,
    source,
    execution_time_ms,
    row_count,
    status,
    error_message
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListQueryHistory :many
SELECT * FROM query_history
WHERE (
    sqlc.narg('datasource_id')::uuid IS NULL
    OR datasource_id = sqlc.narg('datasource_id')
)
AND (
    sqlc.narg('status')::text IS NULL
    OR sqlc.narg('status')::text = ''
    OR status = sqlc.narg('status')
)
AND (
    sqlc.narg('from_date')::timestamp IS NULL
    OR created_at >= sqlc.narg('from_date')
)
AND (
    sqlc.narg('to_date')::timestamp IS NULL
    OR created_at <= sqlc.narg('to_date')
)
AND (
    sqlc.narg('source')::text IS NULL
    OR sqlc.narg('source')::text = ''
    OR source = sqlc.narg('source')
)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountQueryHistory :one
SELECT COUNT(*) FROM query_history
WHERE (
    sqlc.narg('datasource_id')::uuid IS NULL
    OR datasource_id = sqlc.narg('datasource_id')
)
AND (
    sqlc.narg('status')::text IS NULL
    OR sqlc.narg('status')::text = ''
    OR status = sqlc.narg('status')
)
AND (
    sqlc.narg('from_date')::timestamp IS NULL
    OR created_at >= sqlc.narg('from_date')
)
AND (
    sqlc.narg('to_date')::timestamp IS NULL
    OR created_at <= sqlc.narg('to_date')
)
AND (
    sqlc.narg('source')::text IS NULL
    OR sqlc.narg('source')::text = ''
    OR source = sqlc.narg('source')
);