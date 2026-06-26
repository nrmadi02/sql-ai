package adapter

import (
	"fmt"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type Registry struct {
	adapters map[string]DatabaseAdapter
}

func NewRegistry() *Registry {
	return &Registry{
		adapters: map[string]DatabaseAdapter{
			entity.DatasourceTypePostgreSQL: &PostgresAdapter{},
			entity.DatasourceTypeMySQL:      &MySQLAdapter{},
		},
	}
}

func (r *Registry) Get(dbType string) (DatabaseAdapter, error) {
	adapter, ok := r.adapters[dbType]
	if !ok {
		return nil, fmt.Errorf("%w: %s", domain.ErrUnsupportedDBType, dbType)
	}
	return adapter, nil
}