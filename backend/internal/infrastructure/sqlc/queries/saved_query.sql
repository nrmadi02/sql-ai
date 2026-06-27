-- name: GetSavedQuery :one
SELECT * FROM saved_queries WHERE id = $1;

-- name: ListSavedQueries :many
SELECT * FROM saved_queries
WHERE (
    sqlc.narg('search')::text IS NULL
    OR sqlc.narg('search')::text = ''
    OR name ILIKE '%' || sqlc.narg('search') || '%'
    OR description ILIKE '%' || sqlc.narg('search') || '%'
)
AND (
    sqlc.narg('tag')::text IS NULL
    OR sqlc.narg('tag')::text = ''
    OR sqlc.narg('tag') = ANY(tags)
)
ORDER BY updated_at DESC;

-- name: CreateSavedQuery :one
INSERT INTO saved_queries (
    name,
    description,
    sql_content,
    datasource_id,
    tags,
    generator_message_id
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateSavedQuery :one
UPDATE saved_queries SET
    name = $2,
    description = $3,
    sql_content = $4,
    datasource_id = $5,
    tags = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSavedQuery :exec
DELETE FROM saved_queries WHERE id = $1;