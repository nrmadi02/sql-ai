package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type SqlEditorRepository interface {
	CreateSession(ctx context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error)
	GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.SqlEditorSession, error)
	ListSessions(ctx context.Context) ([]*entity.SqlEditorSession, error)
	UpdateSession(ctx context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
	TouchSession(ctx context.Context, id uuid.UUID) error

	CreateTab(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error)
	GetTabByID(ctx context.Context, id uuid.UUID) (*entity.SqlEditorTab, error)
	ListTabsBySessionID(ctx context.Context, sessionID uuid.UUID) ([]*entity.SqlEditorTab, error)
	CountTabsBySessionID(ctx context.Context, sessionID uuid.UUID) (int64, error)
	NextTabSortOrder(ctx context.Context, sessionID uuid.UUID) (int, error)
	UpdateTab(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error)
	UpdateTabExecution(ctx context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error)
	DeleteTab(ctx context.Context, id uuid.UUID) error
}