package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type ListSavedQueriesFilter struct {
	Search string
	Tag    string
}

type SavedQueryRepository interface {
	Create(ctx context.Context, query *entity.SavedQuery) (*entity.SavedQuery, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SavedQuery, error)
	List(ctx context.Context, filter ListSavedQueriesFilter) ([]*entity.SavedQuery, error)
	Update(ctx context.Context, query *entity.SavedQuery) (*entity.SavedQuery, error)
	Delete(ctx context.Context, id uuid.UUID) error
}