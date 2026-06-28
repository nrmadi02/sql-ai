package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type GeneratorRepository interface {
	CreateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error)
	GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorSession, error)
	ListSessions(ctx context.Context) ([]*entity.GeneratorSession, error)
	UpdateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error)
	GetSessionWithSummary(ctx context.Context, id uuid.UUID) (string, error)
	UpdateSessionSummary(ctx context.Context, id uuid.UUID, summary string) error
	DeleteSession(ctx context.Context, id uuid.UUID) error
	TouchSession(ctx context.Context, id uuid.UUID) error

	CreateMessage(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error)
	GetMessageByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorMessage, error)
	ListMessagesBySession(ctx context.Context, sessionID uuid.UUID) ([]*entity.GeneratorMessage, error)
	UpdateMessageAIResponse(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error)
	UpdateMessageExecution(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error)
}