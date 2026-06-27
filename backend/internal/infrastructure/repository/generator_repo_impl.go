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

type GeneratorRepository struct {
	queries *sqlcgen.Queries
}

func NewGeneratorRepository(pool *pgxpool.Pool) domainrepo.GeneratorRepository {
	return &GeneratorRepository{
		queries: sqlcgen.New(pool),
	}
}

func (r *GeneratorRepository) CreateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error) {
	row, err := r.queries.CreateGeneratorSession(ctx, sqlcgen.CreateGeneratorSessionParams{
		Title:        pgTextFromString(session.Title),
		DatasourceID: pgUUIDFromOptional(session.DatasourceID),
		AiProviderID: pgUUIDFromOptional(session.AIProviderID),
	})
	if err != nil {
		return nil, fmt.Errorf("create generator session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *GeneratorRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorSession, error) {
	row, err := r.queries.GetGeneratorSession(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get generator session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *GeneratorRepository) ListSessions(ctx context.Context) ([]*entity.GeneratorSession, error) {
	rows, err := r.queries.ListGeneratorSessions(ctx)
	if err != nil {
		return nil, fmt.Errorf("list generator sessions: %w", err)
	}

	result := make([]*entity.GeneratorSession, 0, len(rows))
	for _, row := range rows {
		session, err := r.sessionToEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, session)
	}

	return result, nil
}

func (r *GeneratorRepository) UpdateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error) {
	row, err := r.queries.UpdateGeneratorSession(ctx, sqlcgen.UpdateGeneratorSessionParams{
		ID:           pgUUIDFromUUID(session.ID),
		Title:        pgTextFromString(session.Title),
		DatasourceID: pgUUIDFromOptional(session.DatasourceID),
		AiProviderID: pgUUIDFromOptional(session.AIProviderID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update generator session: %w", err)
	}

	return r.sessionToEntity(row)
}

func (r *GeneratorRepository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteGeneratorSession(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("delete generator session: %w", err)
	}
	return nil
}

func (r *GeneratorRepository) TouchSession(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.TouchGeneratorSession(ctx, pgUUIDFromUUID(id)); err != nil {
		return fmt.Errorf("touch generator session: %w", err)
	}
	return nil
}

func (r *GeneratorRepository) CreateMessage(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	aiMetadata, err := marshalAIMetadata(message.AIMetadata)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.CreateGeneratorMessage(ctx, sqlcgen.CreateGeneratorMessageParams{
		SessionID:        pgUUIDFromUUID(message.SessionID),
		Role:             message.Role,
		Content:          message.Content,
		GeneratedSql:     pgTextFromString(message.GeneratedSQL),
		EditedSql:        pgTextFromString(message.EditedSQL),
		QueryResult:      message.QueryResult,
		ExecutionTimeMs:  pgInt4FromOptionalInt(message.ExecutionTimeMs),
		RowCount:         pgInt4FromOptionalInt(message.RowCount),
		ErrorMessage:     pgTextFromString(message.ErrorMessage),
		ReferencedTables: message.ReferencedTables,
		AiMetadata:       aiMetadata,
	})
	if err != nil {
		return nil, fmt.Errorf("create generator message: %w", err)
	}

	return r.messageToEntity(row)
}

func (r *GeneratorRepository) GetMessageByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorMessage, error) {
	row, err := r.queries.GetGeneratorMessage(ctx, pgUUIDFromUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get generator message: %w", err)
	}

	return r.messageToEntity(row)
}

func (r *GeneratorRepository) ListMessagesBySession(ctx context.Context, sessionID uuid.UUID) ([]*entity.GeneratorMessage, error) {
	rows, err := r.queries.ListGeneratorMessagesBySession(ctx, pgUUIDFromUUID(sessionID))
	if err != nil {
		return nil, fmt.Errorf("list generator messages: %w", err)
	}

	result := make([]*entity.GeneratorMessage, 0, len(rows))
	for _, row := range rows {
		message, err := r.messageToEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, message)
	}

	return result, nil
}

func (r *GeneratorRepository) UpdateMessageAIResponse(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	row, err := r.queries.UpdateGeneratorMessageAIResponse(ctx, sqlcgen.UpdateGeneratorMessageAIResponseParams{
		ID:               pgUUIDFromUUID(message.ID),
		Content:          message.Content,
		GeneratedSql:     pgTextFromString(message.GeneratedSQL),
		ReferencedTables: message.ReferencedTables,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update generator message ai response: %w", err)
	}

	return r.messageToEntity(row)
}

func (r *GeneratorRepository) UpdateMessageExecution(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	row, err := r.queries.UpdateGeneratorMessageExecution(ctx, sqlcgen.UpdateGeneratorMessageExecutionParams{
		ID:              pgUUIDFromUUID(message.ID),
		EditedSql:       pgTextFromString(message.EditedSQL),
		QueryResult:     message.QueryResult,
		ExecutionTimeMs: pgInt4FromOptionalInt(message.ExecutionTimeMs),
		RowCount:        pgInt4FromOptionalInt(message.RowCount),
		ErrorMessage:    pgTextFromString(message.ErrorMessage),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update generator message execution: %w", err)
	}

	return r.messageToEntity(row)
}

func (r *GeneratorRepository) sessionToEntity(row sqlcgen.GeneratorSession) (*entity.GeneratorSession, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	datasourceID, err := optionalUUIDFromPG(row.DatasourceID)
	if err != nil {
		return nil, err
	}

	aiProviderID, err := optionalUUIDFromPG(row.AiProviderID)
	if err != nil {
		return nil, err
	}

	return &entity.GeneratorSession{
		ID:           id,
		Title:        textValue(row.Title, ""),
		DatasourceID: datasourceID,
		AIProviderID: aiProviderID,
		CreatedAt:    timestampValue(row.CreatedAt),
		UpdatedAt:    timestampValue(row.UpdatedAt),
	}, nil
}

func (r *GeneratorRepository) messageToEntity(row sqlcgen.GeneratorMessage) (*entity.GeneratorMessage, error) {
	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	sessionID, err := uuidFromPG(row.SessionID)
	if err != nil {
		return nil, err
	}

	referencedTables := row.ReferencedTables
	if referencedTables == nil {
		referencedTables = []string{}
	}

	var queryResult json.RawMessage
	if len(row.QueryResult) > 0 {
		queryResult = json.RawMessage(row.QueryResult)
	}

	aiMetadata, err := unmarshalAIMetadata(row.AiMetadata)
	if err != nil {
		return nil, err
	}

	return &entity.GeneratorMessage{
		ID:               id,
		SessionID:        sessionID,
		Role:             row.Role,
		Content:          row.Content,
		GeneratedSQL:     textValue(row.GeneratedSql, ""),
		EditedSQL:        textValue(row.EditedSql, ""),
		QueryResult:      queryResult,
		ExecutionTimeMs:  optionalIntFromPG(row.ExecutionTimeMs),
		RowCount:         optionalIntFromPG(row.RowCount),
		ErrorMessage:     textValue(row.ErrorMessage, ""),
		ReferencedTables: referencedTables,
		AIMetadata:       aiMetadata,
		CreatedAt:        timestampValue(row.CreatedAt),
	}, nil
}

func marshalAIMetadata(metadata *entity.AIMetadata) ([]byte, error) {
	if metadata == nil {
		return nil, nil
	}

	encoded, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("marshal ai metadata: %w", err)
	}

	return encoded, nil
}

func unmarshalAIMetadata(raw []byte) (*entity.AIMetadata, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	var metadata entity.AIMetadata
	if err := json.Unmarshal(raw, &metadata); err != nil {
		return nil, fmt.Errorf("unmarshal ai metadata: %w", err)
	}

	return &metadata, nil
}