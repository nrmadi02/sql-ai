package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type ListQueryHistoryFilter struct {
	DatasourceID *uuid.UUID
	Status       string
	FromDate     *time.Time
	ToDate       *time.Time
	Limit        int
	Offset       int
}

type QueryHistoryRepository interface {
	Create(ctx context.Context, entry *entity.QueryHistory) (*entity.QueryHistory, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.QueryHistory, error)
	List(ctx context.Context, filter ListQueryHistoryFilter) ([]*entity.QueryHistory, error)
	Count(ctx context.Context, filter ListQueryHistoryFilter) (int64, error)
}