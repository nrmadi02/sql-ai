package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

const (
	StreamEventUserMessage = "user_message"
	StreamEventMeta        = "meta"
	StreamEventDelta       = "delta"
	StreamEventDone        = "done"
	StreamEventError       = "error"
)

type StreamWriter func(event string, data any) error

type preparedSendMessage struct {
	sessionID   uuid.UUID
	userMessage *entity.GeneratorMessage
	aiInput     ai.GenerateSQLInput
}

func (u *GeneratorUsecase) SendMessageStream(
	ctx context.Context,
	sessionID uuid.UUID,
	input SendMessageInput,
	write StreamWriter,
) error {
	prepared, err := u.prepareSendMessage(ctx, sessionID, input)
	if err != nil {
		return err
	}

	if err := write(StreamEventUserMessage, prepared.userMessage); err != nil {
		return err
	}

	if err := write(StreamEventMeta, buildAIMetadata(prepared.aiInput, nil)); err != nil {
		return err
	}

	aiResponse, err := u.aiGateway.GenerateSQLStream(ctx, prepared.aiInput, func(delta string) error {
		if delta == "" {
			return nil
		}
		return write(StreamEventDelta, map[string]string{"content": delta})
	})
	if err != nil {
		return fmt.Errorf("generate sql: %w", err)
	}

	aiMetadata := buildAIMetadata(prepared.aiInput, aiResponse.Usage)

	assistantMessage, err := u.generatorRepo.CreateMessage(ctx, &entity.GeneratorMessage{
		SessionID:    prepared.sessionID,
		Role:         entity.MessageRoleAssistant,
		Content:      aiResponse.Content,
		GeneratedSQL: aiResponse.GeneratedSQL,
		AIMetadata:   &aiMetadata,
	})
	if err != nil {
		return err
	}

	if err := u.generatorRepo.TouchSession(ctx, prepared.sessionID); err != nil {
		return err
	}

	return write(StreamEventDone, assistantMessage)
}

func (u *GeneratorUsecase) prepareSendMessage(
	ctx context.Context,
	sessionID uuid.UUID,
	input SendMessageInput,
) (*preparedSendMessage, error) {
	content := strings.TrimSpace(input.Content)
	if content == "" {
		return nil, domain.ErrInvalidInput
	}

	session, err := u.generatorRepo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	datasourceID, err := resolveDatasourceID(session, input.DatasourceID)
	if err != nil {
		return nil, err
	}

	datasource, err := u.datasourceRepo.GetByID(ctx, *datasourceID)
	if err != nil {
		return nil, err
	}

	referencedTables := ParseReferencedTables(content, input.Tables)

	schemaCache, err := parseSchemaCache(datasource.SchemaCache)
	if err != nil {
		return nil, err
	}

	if len(referencedTables) > 0 {
		if schemaCache == nil {
			return nil, domain.ErrSchemaNotCached
		}
		if err := validateReferencedTables(schemaCache, referencedTables); err != nil {
			return nil, err
		}
	}

	provider, err := u.resolveAIProvider(ctx, session)
	if err != nil {
		return nil, err
	}

	previousMessages, err := u.generatorRepo.ListMessagesBySession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	contextTables := resolveContextTables(schemaCache, content, referencedTables, previousMessages)

	userMessage, err := u.generatorRepo.CreateMessage(ctx, &entity.GeneratorMessage{
		SessionID:        sessionID,
		Role:             entity.MessageRoleUser,
		Content:          content,
		ReferencedTables: referencedTables,
	})
	if err != nil {
		return nil, err
	}

	if err := u.syncSessionAfterMessage(ctx, session, datasourceID, content, len(previousMessages) == 0); err != nil {
		return nil, err
	}

	return &preparedSendMessage{
		sessionID:   sessionID,
		userMessage: userMessage,
		aiInput: ai.GenerateSQLInput{
			Provider:            provider,
			Dialect:             dialectFromDatasource(datasource, schemaCache),
			UserMessage:         content,
			AvailableTables:     listTableNames(schemaCache),
			ReferencedTables:    referencedTables,
			ContextTables:       contextTables,
			TableSchemas:        buildTableSchemas(schemaCache, contextTables),
			ConversationHistory: buildConversationHistory(previousMessages),
		},
	}, nil
}