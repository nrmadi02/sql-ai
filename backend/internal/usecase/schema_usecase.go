package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/adapter"
)

const previewRowLimit = 50

type ListTablesResult struct {
	DatasourceID uuid.UUID             `json:"datasource_id"`
	Tables       []entity.TableSummary `json:"tables"`
}

type SyncSchemaResult struct {
	DatasourceID  uuid.UUID `json:"datasource_id"`
	TableCount    int       `json:"table_count"`
	SchemaCachedAt string   `json:"schema_cached_at"`
}

type SchemaUsecase struct {
	datasourceRepo repository.DatasourceRepository
	registry       *adapter.Registry
}

func NewSchemaUsecase(datasourceRepo repository.DatasourceRepository, registry *adapter.Registry) *SchemaUsecase {
	return &SchemaUsecase{
		datasourceRepo: datasourceRepo,
		registry:       registry,
	}
}

func (u *SchemaUsecase) SyncSchema(ctx context.Context, id uuid.UUID) (*SyncSchemaResult, error) {
	ds, err := u.datasourceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	schema, err := u.readLiveSchema(ctx, ds)
	if err != nil {
		return nil, err
	}

	cacheJSON, err := json.Marshal(schema)
	if err != nil {
		return nil, fmt.Errorf("marshal schema cache: %w", err)
	}

	if err := u.datasourceRepo.UpdateSchemaCache(ctx, id, cacheJSON); err != nil {
		return nil, err
	}

	updated, err := u.datasourceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	result := &SyncSchemaResult{
		DatasourceID: id,
		TableCount:   len(schema.Tables),
	}
	if updated.SchemaCachedAt != nil {
		result.SchemaCachedAt = updated.SchemaCachedAt.UTC().Format("2006-01-02T15:04:05Z")
	}

	return result, nil
}

func (u *SchemaUsecase) ListTables(ctx context.Context, id uuid.UUID) (*ListTablesResult, error) {
	ds, err := u.datasourceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	cache, err := parseSchemaCache(ds.SchemaCache)
	if err != nil {
		return nil, err
	}
	if cache == nil {
		return nil, domain.ErrSchemaNotCached
	}

	tables := make([]entity.TableSummary, 0, len(cache.Tables))
	for _, table := range cache.Tables {
		tables = append(tables, table.ToSummary())
	}

	return &ListTablesResult{
		DatasourceID: id,
		Tables:       tables,
	}, nil
}

func (u *SchemaUsecase) GetTableDetail(ctx context.Context, id uuid.UUID, tableName string) (*entity.TableDetail, error) {
	if err := adapter.ValidateIdentifier(tableName); err != nil {
		return nil, err
	}

	ds, err := u.datasourceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	cache, err := parseSchemaCache(ds.SchemaCache)
	if err != nil {
		return nil, err
	}

	if cache != nil {
		for _, table := range cache.Tables {
			if strings.EqualFold(table.Name, tableName) {
				detail := table.ToDetail()
				return &detail, nil
			}
		}
	}

	conn, err := u.openConnection(ctx, ds)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	return conn.GetTableDetail(ctx, tableName)
}

func (u *SchemaUsecase) PreviewTable(ctx context.Context, id uuid.UUID, tableName string) (*adapter.QueryResult, error) {
	if err := adapter.ValidateIdentifier(tableName); err != nil {
		return nil, err
	}

	ds, err := u.datasourceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	conn, err := u.openConnection(ctx, ds)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	return conn.PreviewTable(ctx, tableName, previewRowLimit)
}

func (u *SchemaUsecase) readLiveSchema(ctx context.Context, ds *entity.Datasource) (*entity.SchemaCache, error) {
	conn, err := u.openConnection(ctx, ds)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	return conn.ReadSchema(ctx)
}

func (u *SchemaUsecase) openConnection(ctx context.Context, ds *entity.Datasource) (adapter.Connection, error) {
	dbAdapter, err := u.registry.Get(ds.DBType)
	if err != nil {
		return nil, err
	}

	cfg := adapter.ConnectionConfigFromEntity(ds)
	return dbAdapter.Connect(ctx, cfg)
}

func parseSchemaCache(raw json.RawMessage) (*entity.SchemaCache, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	var cache entity.SchemaCache
	if err := json.Unmarshal(raw, &cache); err != nil {
		return nil, fmt.Errorf("parse schema cache: %w", err)
	}

	return &cache, nil
}