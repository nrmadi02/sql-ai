package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type ListChartConfigsFilter struct {
	SavedQueryID       *uuid.UUID
	GeneratorMessageID *uuid.UUID
	SqlEditorTabID     *uuid.UUID
}

type ChartConfigRepository interface {
	Create(ctx context.Context, config *entity.ChartConfig) (*entity.ChartConfig, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.ChartConfig, error)
	List(ctx context.Context, filter ListChartConfigsFilter) ([]*entity.ChartConfig, error)
	Update(ctx context.Context, config *entity.ChartConfig) (*entity.ChartConfig, error)
	Delete(ctx context.Context, id uuid.UUID) error
}