package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type DatasourceRepository interface {
	Create(ctx context.Context, ds *entity.Datasource) (*entity.Datasource, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Datasource, error)
	List(ctx context.Context) ([]*entity.Datasource, error)
	Update(ctx context.Context, ds *entity.Datasource) (*entity.Datasource, error)
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateSchemaCache(ctx context.Context, id uuid.UUID, schema json.RawMessage) error
}