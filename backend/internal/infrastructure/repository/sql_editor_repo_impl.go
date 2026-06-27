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

type SqlEditorRepository struct {
	queries *sqlcgen.Queries
}

func NewSqlEditorRepository(pool *pgxpool.Pool) domainrepo.SqlEditorRepository {
	return &SqlEditorRepository{
		queries: sqlcgen.New(pool),
	}
}

func (r *SqlEditorRepository) CreateSession(ctx context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error) {
	row, err := r.queries.CreateSqlEditorSession(ctx, sqlcgen.CreateSqlEditorSessionParams{
		Name:         session.Name,
		DatasourceID: pgUUIDFromOptional(session.DatasourceID),
	})
	if err != nil {
		return nil, fmt.Errorf("create sql editor session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *SqlEditorRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.SqlEditorSession, error) {
	row, err := r.queries.GetSqlEditorSession(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get sql editor session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *SqlEditorRepository) ListSessions(ctx context.Context) ([]*entity.SqlEditorSession, error) {
	rows, err := r.queries.ListSqlEditorSessions(ctx)
	if err != nil {
		return nil, fmt.Errorf("list sql editor sessions: %w", err)
	}

	result := make([]*entity.SqlEditorSession, 0, len(rows))
	for _, row := range rows {
		item, err := r.sessionToEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, nil
}

func (r *SqlEditorRepository) UpdateSession(ctx context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error) {
	row, err := r.queries.UpdateSqlEditorSession(ctx, sqlcgen.UpdateSqlEditorSessionParams{
		ID:           pgUUIDFromUUID(session.ID),
		Name:         session.Name,
		DatasourceID: pgUUIDFromOptional(session.DatasourceID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update sql editor session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *SqlEditorRepository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteSqlEditorSession(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete sql editor session: %w", err)
	}
	return nil
}

func (r *SqlEditorRepository) TouchSession(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.TouchSqlEditorSession(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("touch sql editor session: %w", err)
	}
	return nil
}

func (r *SqlEditorRepository) CreateTab(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	row, err := r.queries.CreateSqlEditorTab(ctx, sqlcgen.CreateSqlEditorTabParams{
		SessionID:  pgUUIDFromUUID(tab.SessionID),
		Name:       tab.Name,
		SqlContent: tab.SQLContent,
		SortOrder:  int32(tab.SortOrder),
	})
	if err != nil {
		return nil, fmt.Errorf("create sql editor tab: %w", err)
	}

	return r.tabToEntity(row)
}

func (r *SqlEditorRepository) GetTabByID(ctx context.Context, id uuid.UUID) (*entity.SqlEditorTab, error) {
	row, err := r.queries.GetSqlEditorTab(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get sql editor tab: %w", err)
	}

	return r.tabToEntity(row)
}

func (r *SqlEditorRepository) ListTabsBySessionID(ctx context.Context, sessionID uuid.UUID) ([]*entity.SqlEditorTab, error) {
	rows, err := r.queries.ListSqlEditorTabsBySession(ctx, pgUUIDFromUUID(sessionID))
	if err != nil {
		return nil, fmt.Errorf("list sql editor tabs: %w", err)
	}

	result := make([]*entity.SqlEditorTab, 0, len(rows))
	for _, row := range rows {
		item, err := r.tabToEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, nil
}

func (r *SqlEditorRepository) CountTabsBySessionID(ctx context.Context, sessionID uuid.UUID) (int64, error) {
	count, err := r.queries.CountSqlEditorTabsBySession(ctx, pgUUIDFromUUID(sessionID))
	if err != nil {
		return 0, fmt.Errorf("count sql editor tabs: %w", err)
	}
	return count, nil
}

func (r *SqlEditorRepository) NextTabSortOrder(ctx context.Context, sessionID uuid.UUID) (int, error) {
	maxOrder, err := r.queries.MaxSqlEditorTabSortOrder(ctx, pgUUIDFromUUID(sessionID))
	if err != nil {
		return 0, fmt.Errorf("max sql editor tab sort order: %w", err)
	}
	return int(maxOrder) + 1, nil
}

func (r *SqlEditorRepository) UpdateTab(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	row, err := r.queries.UpdateSqlEditorTab(ctx, sqlcgen.UpdateSqlEditorTabParams{
		ID:         pgUUIDFromUUID(tab.ID),
		Name:       tab.Name,
		SqlContent: tab.SQLContent,
		SortOrder:  int32(tab.SortOrder),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update sql editor tab: %w", err)
	}

	return r.tabToEntity(row)
}

func (r *SqlEditorRepository) UpdateTabExecution(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	row, err := r.queries.UpdateSqlEditorTabExecution(ctx, sqlcgen.UpdateSqlEditorTabExecutionParams{
		ID:              pgUUIDFromUUID(tab.ID),
		LastResult:      tab.LastResult,
		ExecutionTimeMs: pgInt4FromOptionalInt(tab.ExecutionTimeMs),
		RowCount:        pgInt4FromOptionalInt(tab.RowCount),
		LastStatus:      pgTextFromString(tab.LastStatus),
		ErrorMessage:    pgTextFromString(tab.ErrorMessage),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update sql editor tab execution: %w", err)
	}

	return r.tabToEntity(row)
}

func (r *SqlEditorRepository) DeleteTab(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteSqlEditorTab(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete sql editor tab: %w", err)
	}
	return nil
}

func (r *SqlEditorRepository) sessionToEntity(row sqlcgen.SqlEditorSession) (*entity.SqlEditorSession, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	datasourceID, err := optionalUUIDFromPG(row.DatasourceID)
	if err != nil {
		return nil, err
	}

	return &entity.SqlEditorSession{
		ID:           id,
		Name:         row.Name,
		DatasourceID: datasourceID,
		CreatedAt:    timestampValue(row.CreatedAt),
		UpdatedAt:    timestampValue(row.UpdatedAt),
	}, nil
}

func (r *SqlEditorRepository) tabToEntity(row sqlcgen.SqlEditorTab) (*entity.SqlEditorTab, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	sessionID, err := uuidFromPG(row.SessionID)
	if err != nil {
		return nil, err
	}

	lastResult := row.LastResult
	if lastResult == nil {
		lastResult = []byte{}
	}

	return &entity.SqlEditorTab{
		ID:              id,
		SessionID:       sessionID,
		Name:            row.Name,
		SQLContent:      row.SqlContent,
		SortOrder:       int(row.SortOrder),
		LastResult:      lastResult,
		ExecutionTimeMs: optionalIntFromPG(row.ExecutionTimeMs),
		RowCount:        optionalIntFromPG(row.RowCount),
		LastStatus:      textValue(row.LastStatus, ""),
		ErrorMessage:    textValue(row.ErrorMessage, ""),
		CreatedAt:       timestampValue(row.CreatedAt),
		UpdatedAt:       timestampValue(row.UpdatedAt),
	}, nil
}