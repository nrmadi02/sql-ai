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

type SavedQueryRepository struct {
	queries *sqlcgen.Queries
}

func NewSavedQueryRepository(pool *pgxpool.Pool) domainrepo.SavedQueryRepository {
	return &SavedQueryRepository{
		queries: sqlcgen.New(pool),
	}
}

func (r *SavedQueryRepository) Create(ctx context.Context, query *entity.SavedQuery) (*entity.SavedQuery, error) {
	row, err := r.queries.CreateSavedQuery(ctx, sqlcgen.CreateSavedQueryParams{
		Name:               query.Name,
		Description:        pgTextFromString(query.Description),
		SqlContent:         query.SQLContent,
		DatasourceID:       pgUUIDFromOptional(query.DatasourceID),
		Tags:               query.Tags,
		GeneratorMessageID: pgUUIDFromOptional(query.GeneratorMessageID),
	})
	if err != nil {
		return nil, fmt.Errorf("create saved query: %w", err)
	}

	return r.toEntity(row)
}

func (r *SavedQueryRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SavedQuery, error) {
	row, err := r.queries.GetSavedQuery(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get saved query: %w", err)
	}

	return r.toEntity(row)
}

func (r *SavedQueryRepository) List(ctx context.Context, filter domainrepo.ListSavedQueriesFilter) ([]*entity.SavedQuery, error) {
	rows, err := r.queries.ListSavedQueries(ctx, sqlcgen.ListSavedQueriesParams{
		Search: pgTextFromString(filter.Search),
		Tag:    pgTextFromString(filter.Tag),
	})
	if err != nil {
		return nil, fmt.Errorf("list saved queries: %w", err)
	}

	result := make([]*entity.SavedQuery, 0, len(rows))
	for _, row := range rows {
		item, err := r.toEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, nil
}

func (r *SavedQueryRepository) Update(ctx context.Context, query *entity.SavedQuery) (*entity.SavedQuery, error) {
	row, err := r.queries.UpdateSavedQuery(ctx, sqlcgen.UpdateSavedQueryParams{
		ID:           pgUUIDFromUUID(query.ID),
		Name:         query.Name,
		Description:  pgTextFromString(query.Description),
		SqlContent:   query.SQLContent,
		DatasourceID: pgUUIDFromOptional(query.DatasourceID),
		Tags:         query.Tags,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update saved query: %w", err)
	}

	return r.toEntity(row)
}

func (r *SavedQueryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteSavedQuery(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete saved query: %w", err)
	}
	return nil
}

func (r *SavedQueryRepository) toEntity(row sqlcgen.SavedQuery) (*entity.SavedQuery, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	datasourceID, err := optionalUUIDFromPG(row.DatasourceID)
	if err != nil {
		return nil, err
	}

	generatorMessageID, err := optionalUUIDFromPG(row.GeneratorMessageID)
	if err != nil {
		return nil, err
	}

	tags := row.Tags
	if tags == nil {
		tags = []string{}
	}

	return &entity.SavedQuery{
		ID:                 id,
		Name:               row.Name,
		Description:        textValue(row.Description, ""),
		SQLContent:         row.SqlContent,
		DatasourceID:       datasourceID,
		Tags:               tags,
		GeneratorMessageID: generatorMessageID,
		CreatedAt:          timestampValue(row.CreatedAt),
		UpdatedAt:          timestampValue(row.UpdatedAt),
	}, nil
}