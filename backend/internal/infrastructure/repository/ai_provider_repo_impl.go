package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	domainrepo "github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/encryption"
	sqlcgen "github.com/nrmadi02/sql-ai/internal/infrastructure/sqlc/generated"
)

type AIProviderRepository struct {
	queries    *sqlcgen.Queries
	encryption *encryption.Service
}

func NewAIProviderRepository(pool *pgxpool.Pool, enc *encryption.Service) domainrepo.AIProviderRepository {
	return &AIProviderRepository{
		queries:    sqlcgen.New(pool),
		encryption: enc,
	}
}

func (r *AIProviderRepository) Create(ctx context.Context, provider *entity.AIProvider) (*entity.AIProvider, error) {
	encryptedKey, err := r.encryptAPIKey(provider.APIKey)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.CreateAIProvider(ctx, sqlcgen.CreateAIProviderParams{
		Name:            provider.Name,
		ApiFormat:       provider.APIFormat,
		BaseUrl:         provider.BaseURL,
		ApiKeyEncrypted: encryptedKey,
		Model:           provider.Model,
		IsDefault:       pgtype.Bool{Bool: provider.IsDefault, Valid: true},
		Config:          provider.Config,
	})
	if err != nil {
		return nil, fmt.Errorf("create ai provider: %w", err)
	}

	return r.toEntity(row)
}

func (r *AIProviderRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AIProvider, error) {
	row, err := r.queries.GetAIProvider(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get ai provider: %w", err)
	}

	return r.toEntity(row)
}

func (r *AIProviderRepository) List(ctx context.Context) ([]*entity.AIProvider, error) {
	rows, err := r.queries.ListAIProviders(ctx)
	if err != nil {
		return nil, fmt.Errorf("list ai providers: %w", err)
	}

	result := make([]*entity.AIProvider, 0, len(rows))
	for _, row := range rows {
		provider, err := r.toEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, provider)
	}

	return result, nil
}

func (r *AIProviderRepository) Update(ctx context.Context, provider *entity.AIProvider) (*entity.AIProvider, error) {
	encryptedKey, err := r.encryptAPIKey(provider.APIKey)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.UpdateAIProvider(ctx, sqlcgen.UpdateAIProviderParams{
		ID:              pgUUIDFromUUID(provider.ID),
		Name:            provider.Name,
		ApiFormat:       provider.APIFormat,
		BaseUrl:         provider.BaseURL,
		ApiKeyEncrypted: encryptedKey,
		Model:           provider.Model,
		IsDefault:       pgtype.Bool{Bool: provider.IsDefault, Valid: true},
		Config:          provider.Config,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update ai provider: %w", err)
	}

	return r.toEntity(row)
}

func (r *AIProviderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteAIProvider(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete ai provider: %w", err)
	}
	return nil
}

func (r *AIProviderRepository) ClearDefault(ctx context.Context) error {
	if err := r.queries.ClearDefaultAIProviders(ctx); err != nil {
		return fmt.Errorf("clear default ai providers: %w", err)
	}
	return nil
}

func (r *AIProviderRepository) toEntity(row sqlcgen.AiProvider) (*entity.AIProvider, error) {
	apiKey, err := r.decryptAPIKey(row.ApiKeyEncrypted)
	if err != nil {
		return nil, err
	}

	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	return &entity.AIProvider{
		ID:        id,
		Name:      row.Name,
		APIFormat: row.ApiFormat,
		BaseURL:   row.BaseUrl,
		APIKey:    apiKey,
		Model:     row.Model,
		IsDefault: boolValue(row.IsDefault, false),
		Config:    row.Config,
		CreatedAt: timestampValue(row.CreatedAt),
		UpdatedAt: timestampValue(row.UpdatedAt),
	}, nil
}

func (r *AIProviderRepository) encryptAPIKey(apiKey string) (pgtype.Text, error) {
	if apiKey == "" {
		return pgtype.Text{}, nil
	}

	encrypted, err := r.encryption.Encrypt(apiKey)
	if err != nil {
		return pgtype.Text{}, fmt.Errorf("encrypt api key: %w", err)
	}

	return pgtype.Text{String: encrypted, Valid: true}, nil
}

func (r *AIProviderRepository) decryptAPIKey(value pgtype.Text) (string, error) {
	if !value.Valid || value.String == "" {
		return "", nil
	}

	decrypted, err := r.encryption.Decrypt(value.String)
	if err != nil {
		return "", fmt.Errorf("decrypt api key: %w", err)
	}

	return decrypted, nil
}