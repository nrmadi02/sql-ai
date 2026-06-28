package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	domainrepo "github.com/nrmadi02/sql-ai/internal/domain/repository"
	sqlcgen "github.com/nrmadi02/sql-ai/internal/infrastructure/sqlc/generated"
)

type ChartConfigRepository struct {
	queries *sqlcgen.Queries
}

func NewChartConfigRepository(pool *pgxpool.Pool) domainrepo.ChartConfigRepository {
	return &ChartConfigRepository{
		queries: sqlcgen.New(pool),
	}
}

func (r *ChartConfigRepository) Create(ctx context.Context, config *entity.ChartConfig) (*entity.ChartConfig, error) {
	row, err := r.queries.CreateChartConfig(ctx, sqlcgen.CreateChartConfigParams{
		SavedQueryID:       pgUUIDFromOptional(config.SavedQueryID),
		GeneratorMessageID: pgUUIDFromOptional(config.GeneratorMessageID),
		SqlEditorTabID:     pgUUIDFromOptional(config.SqlEditorTabID),
		ChartType:          config.ChartType,
		XAxisColumn:        config.XAxisColumn,
		YAxisColumns:       config.YAxisColumns,
		CategoryColumn:     pgTextFromString(config.CategoryColumn),
		Config:             chartConfigBytes(config.Config),
	})
	if err != nil {
		return nil, fmt.Errorf("create chart config: %w", err)
	}

	return r.toEntity(row)
}

func (r *ChartConfigRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.ChartConfig, error) {
	row, err := r.queries.GetChartConfig(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get chart config: %w", err)
	}

	return r.toEntity(row)
}

func (r *ChartConfigRepository) List(ctx context.Context, filter domainrepo.ListChartConfigsFilter) ([]*entity.ChartConfig, error) {
	rows, err := r.queries.ListChartConfigs(ctx, sqlcgen.ListChartConfigsParams{
		SavedQueryID:       pgUUIDFromOptional(filter.SavedQueryID),
		GeneratorMessageID: pgUUIDFromOptional(filter.GeneratorMessageID),
		SqlEditorTabID:     pgUUIDFromOptional(filter.SqlEditorTabID),
	})
	if err != nil {
		return nil, fmt.Errorf("list chart configs: %w", err)
	}

	result := make([]*entity.ChartConfig, 0, len(rows))
	for _, row := range rows {
		item, err := r.toEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, nil
}

func (r *ChartConfigRepository) Update(ctx context.Context, config *entity.ChartConfig) (*entity.ChartConfig, error) {
	row, err := r.queries.UpdateChartConfig(ctx, sqlcgen.UpdateChartConfigParams{
		ID:             pgUUIDFromUUID(config.ID),
		ChartType:      config.ChartType,
		XAxisColumn:    config.XAxisColumn,
		YAxisColumns:   config.YAxisColumns,
		CategoryColumn: pgTextFromString(config.CategoryColumn),
		Config:         chartConfigBytes(config.Config),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update chart config: %w", err)
	}

	return r.toEntity(row)
}

func (r *ChartConfigRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteChartConfig(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete chart config: %w", err)
	}
	return nil
}

func (r *ChartConfigRepository) toEntity(row sqlcgen.ChartConfig) (*entity.ChartConfig, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	savedQueryID, err := optionalUUIDFromPG(row.SavedQueryID)
	if err != nil {
		return nil, err
	}

	generatorMessageID, err := optionalUUIDFromPG(row.GeneratorMessageID)
	if err != nil {
		return nil, err
	}

	sqlEditorTabID, err := optionalUUIDFromPG(row.SqlEditorTabID)
	if err != nil {
		return nil, err
	}

	yAxisColumns := row.YAxisColumns
	if yAxisColumns == nil {
		yAxisColumns = []string{}
	}

	var config json.RawMessage
	if len(row.Config) > 0 {
		config = json.RawMessage(row.Config)
	} else {
		config = json.RawMessage("{}")
	}

	return &entity.ChartConfig{
		ID:                 id,
		SavedQueryID:       savedQueryID,
		GeneratorMessageID: generatorMessageID,
		SqlEditorTabID:     sqlEditorTabID,
		ChartType:          row.ChartType,
		XAxisColumn:        row.XAxisColumn,
		YAxisColumns:       yAxisColumns,
		CategoryColumn:     textValue(row.CategoryColumn, ""),
		Config:             config,
		CreatedAt:          timestampValue(row.CreatedAt),
		UpdatedAt:          timestampValue(row.UpdatedAt),
	}, nil
}

func chartConfigBytes(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("{}")
	}
	return []byte(raw)
}