package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type AIProviderRepository interface {
	Create(ctx context.Context, provider *entity.AIProvider) (*entity.AIProvider, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AIProvider, error)
	List(ctx context.Context) ([]*entity.AIProvider, error)
	Update(ctx context.Context, provider *entity.AIProvider) (*entity.AIProvider, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ClearDefault(ctx context.Context) error
}