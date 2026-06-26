-- name: GetDatasource :one
SELECT * FROM datasources WHERE id = $1;

-- name: ListDatasources :many
SELECT * FROM datasources ORDER BY created_at DESC;

-- name: CreateDatasource :one
INSERT INTO datasources (
    name, db_type, host, port, database_name,
    username, password_encrypted, ssl_mode, max_connections
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateDatasource :one
UPDATE datasources SET
    name = $2,
    db_type = $3,
    host = $4,
    port = $5,
    database_name = $6,
    username = $7,
    password_encrypted = $8,
    ssl_mode = $9,
    max_connections = $10,
    is_active = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteDatasource :exec
DELETE FROM datasources WHERE id = $1;

-- name: UpdateSchemaCache :exec
UPDATE datasources SET
    schema_cache = $2,
    schema_cached_at = NOW(),
    updated_at = NOW()
WHERE id = $1;