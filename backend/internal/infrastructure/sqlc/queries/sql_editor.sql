-- name: GetSqlEditorSession :one
SELECT * FROM sql_editor_sessions WHERE id = $1;

-- name: ListSqlEditorSessions :many
SELECT * FROM sql_editor_sessions ORDER BY updated_at DESC;

-- name: CreateSqlEditorSession :one
INSERT INTO sql_editor_sessions (name, datasource_id)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateSqlEditorSession :one
UPDATE sql_editor_sessions SET
    name = $2,
    datasource_id = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSqlEditorSession :exec
DELETE FROM sql_editor_sessions WHERE id = $1;

-- name: GetSqlEditorTab :one
SELECT * FROM sql_editor_tabs WHERE id = $1;

-- name: ListSqlEditorTabsBySession :many
SELECT * FROM sql_editor_tabs
WHERE session_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: CountSqlEditorTabsBySession :one
SELECT COUNT(*) FROM sql_editor_tabs WHERE session_id = $1;

-- name: MaxSqlEditorTabSortOrder :one
SELECT COALESCE(MAX(sort_order), -1)::integer AS max_sort_order
FROM sql_editor_tabs
WHERE session_id = $1;

-- name: CreateSqlEditorTab :one
INSERT INTO sql_editor_tabs (
    session_id,
    name,
    sql_content,
    sort_order
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateSqlEditorTab :one
UPDATE sql_editor_tabs SET
    name = $2,
    sql_content = $3,
    sort_order = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSqlEditorTabExecution :one
UPDATE sql_editor_tabs SET
    last_result = $2,
    execution_time_ms = $3,
    row_count = $4,
    last_status = $5,
    error_message = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSqlEditorTab :exec
DELETE FROM sql_editor_tabs WHERE id = $1;

-- name: TouchSqlEditorSession :exec
UPDATE sql_editor_sessions SET updated_at = NOW() WHERE id = $1;