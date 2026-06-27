-- name: GetAIProvider :one
SELECT * FROM ai_providers WHERE id = $1;

-- name: ListAIProviders :many
SELECT * FROM ai_providers ORDER BY created_at DESC;

-- name: CreateAIProvider :one
INSERT INTO ai_providers (
    name, api_format, base_url, api_key_encrypted, model, is_default, config
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateAIProvider :one
UPDATE ai_providers SET
    name = $2,
    api_format = $3,
    base_url = $4,
    api_key_encrypted = $5,
    model = $6,
    is_default = $7,
    config = $8,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteAIProvider :exec
DELETE FROM ai_providers WHERE id = $1;

-- name: ClearDefaultAIProviders :exec
UPDATE ai_providers SET is_default = false, updated_at = NOW() WHERE is_default = true;