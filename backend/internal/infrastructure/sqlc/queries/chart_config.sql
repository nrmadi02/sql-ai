-- name: GetChartConfig :one
SELECT * FROM chart_configs WHERE id = $1;

-- name: ListChartConfigs :many
SELECT * FROM chart_configs
WHERE (
    sqlc.narg('saved_query_id')::uuid IS NULL
    OR saved_query_id = sqlc.narg('saved_query_id')
)
AND (
    sqlc.narg('generator_message_id')::uuid IS NULL
    OR generator_message_id = sqlc.narg('generator_message_id')
)
AND (
    sqlc.narg('sql_editor_tab_id')::uuid IS NULL
    OR sql_editor_tab_id = sqlc.narg('sql_editor_tab_id')
)
ORDER BY updated_at DESC;

-- name: CreateChartConfig :one
INSERT INTO chart_configs (
    saved_query_id,
    generator_message_id,
    sql_editor_tab_id,
    chart_type,
    x_axis_column,
    y_axis_columns,
    category_column,
    config
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateChartConfig :one
UPDATE chart_configs SET
    chart_type = $2,
    x_axis_column = $3,
    y_axis_columns = $4,
    category_column = $5,
    config = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteChartConfig :exec
DELETE FROM chart_configs WHERE id = $1;