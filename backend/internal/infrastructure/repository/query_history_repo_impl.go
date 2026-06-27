package repository

import (
	"context"
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

type QueryHistoryRepository struct {
	queries *sqlcgen.Queries
}

func NewQueryHistoryRepository(pool *pgxpool.Pool) domainrepo.QueryHistoryRepository {
	return &QueryHistoryRepository{
		queries: sqlcgen.New(pool),
	}
}

func (r *QueryHistoryRepository) Create(ctx context.Context, entry *entity.QueryHistory) (*entity.QueryHistory, error) {
	row, err := r.queries.CreateQueryHistory(ctx, sqlcgen.CreateQueryHistoryParams{
		DatasourceID:          pgUUIDFromOptional(entry.DatasourceID),
		SqlContent:            entry.SQLContent,
		NaturalLanguagePrompt: pgTextFromString(entry.NaturalLanguagePrompt),
		ExecutionTimeMs:       pgInt4FromOptionalInt(entry.ExecutionTimeMs),
		RowCount:              pgInt4FromOptionalInt(entry.RowCount),
		Status:                entry.Status,
		ErrorMessage:          pgTextFromString(entry.ErrorMessage),
	})
	if err != nil {
		return nil, fmt.Errorf("create query history: %w", err)
	}

	return r.toEntity(row)
}

func (r *QueryHistoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.QueryHistory, error) {
	row, err := r.queries.GetQueryHistory(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get query history: %w", err)
	}

	return r.toEntity(row)
}

func (r *QueryHistoryRepository) List(ctx context.Context, filter domainrepo.ListQueryHistoryFilter) ([]*entity.QueryHistory, error) {
	rows, err := r.queries.ListQueryHistory(ctx, r.toListParams(filter))
	if err != nil {
		return nil, fmt.Errorf("list query history: %w", err)
	}

	result := make([]*entity.QueryHistory, 0, len(rows))
	for _, row := range rows {
		item, err := r.toEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, nil
}

func (r *QueryHistoryRepository) Count(ctx context.Context, filter domainrepo.ListQueryHistoryFilter) (int64, error) {
	count, err := r.queries.CountQueryHistory(ctx, r.toCountParams(filter))
	if err != nil {
		return 0, fmt.Errorf("count query history: %w", err)
	}
	return count, nil
}

func (r *QueryHistoryRepository) toListParams(filter domainrepo.ListQueryHistoryFilter) sqlcgen.ListQueryHistoryParams {
	return sqlcgen.ListQueryHistoryParams{
		Limit:        int32(filter.Limit),
		Offset:       int32(filter.Offset),
		DatasourceID: pgUUIDFromOptional(filter.DatasourceID),
		Status:       pgTextFromString(filter.Status),
		FromDate:     pgTimestampFromOptional(filter.FromDate),
		ToDate:       pgTimestampFromOptional(filter.ToDate),
	}
}

func (r *QueryHistoryRepository) toCountParams(filter domainrepo.ListQueryHistoryFilter) sqlcgen.CountQueryHistoryParams {
	return sqlcgen.CountQueryHistoryParams{
		DatasourceID: pgUUIDFromOptional(filter.DatasourceID),
		Status:       pgTextFromString(filter.Status),
		FromDate:     pgTimestampFromOptional(filter.FromDate),
		ToDate:       pgTimestampFromOptional(filter.ToDate),
	}
}

func (r *QueryHistoryRepository) toEntity(row sqlcgen.QueryHistory) (*entity.QueryHistory, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	datasourceID, err := optionalUUIDFromPG(row.DatasourceID)
	if err != nil {
		return nil, err
	}

	return &entity.QueryHistory{
		ID:                    id,
		DatasourceID:          datasourceID,
		SQLContent:            row.SqlContent,
		NaturalLanguagePrompt: textValue(row.NaturalLanguagePrompt, ""),
		ExecutionTimeMs:       optionalIntFromPG(row.ExecutionTimeMs),
		RowCount:              optionalIntFromPG(row.RowCount),
		Status:                row.Status,
		ErrorMessage:          textValue(row.ErrorMessage, ""),
		CreatedAt:             timestampValue(row.CreatedAt),
	}, nil
}