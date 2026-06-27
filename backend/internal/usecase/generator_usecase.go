package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

const sessionTitleMaxRunes = 80

type CreateSessionInput struct {
	Title        string
	DatasourceID *uuid.UUID
	AIProviderID *uuid.UUID
}

type SendMessageInput struct {
	Content      string
	Tables       []string
	DatasourceID *uuid.UUID
}

type SendMessageResult struct {
	UserMessage      *entity.GeneratorMessage
	AssistantMessage *entity.GeneratorMessage
}

type SessionDetail struct {
	Session  *entity.GeneratorSession
	Messages []*entity.GeneratorMessage
}

type GeneratorUsecase struct {
	generatorRepo  repository.GeneratorRepository
	datasourceRepo repository.DatasourceRepository
	aiProviderRepo repository.AIProviderRepository
	aiGateway      ai.Gateway
}

func NewGeneratorUsecase(
	generatorRepo repository.GeneratorRepository,
	datasourceRepo repository.DatasourceRepository,
	aiProviderRepo repository.AIProviderRepository,
	aiGateway ai.Gateway,
) *GeneratorUsecase {
	return &GeneratorUsecase{
		generatorRepo:  generatorRepo,
		datasourceRepo: datasourceRepo,
		aiProviderRepo: aiProviderRepo,
		aiGateway:      aiGateway,
	}
}

func (u *GeneratorUsecase) CreateSession(ctx context.Context, input CreateSessionInput) (*entity.GeneratorSession, error) {
	if input.DatasourceID != nil {
		if _, err := u.datasourceRepo.GetByID(ctx, *input.DatasourceID); err != nil {
			return nil, err
		}
	}

	if input.AIProviderID != nil {
		if _, err := u.aiProviderRepo.GetByID(ctx, *input.AIProviderID); err != nil {
			return nil, err
		}
	}

	session := &entity.GeneratorSession{
		Title:        strings.TrimSpace(input.Title),
		DatasourceID: input.DatasourceID,
		AIProviderID: input.AIProviderID,
	}

	return u.generatorRepo.CreateSession(ctx, session)
}

func (u *GeneratorUsecase) ListSessions(ctx context.Context) ([]*entity.GeneratorSession, error) {
	return u.generatorRepo.ListSessions(ctx)
}

func (u *GeneratorUsecase) GetSessionDetail(ctx context.Context, id uuid.UUID) (*SessionDetail, error) {
	session, err := u.generatorRepo.GetSessionByID(ctx, id)
	if err != nil {
		return nil, err
	}

	messages, err := u.generatorRepo.ListMessagesBySession(ctx, id)
	if err != nil {
		return nil, err
	}

	return &SessionDetail{
		Session:  session,
		Messages: messages,
	}, nil
}

func (u *GeneratorUsecase) DeleteSession(ctx context.Context, id uuid.UUID) error {
	if _, err := u.generatorRepo.GetSessionByID(ctx, id); err != nil {
		return err
	}
	return u.generatorRepo.DeleteSession(ctx, id)
}

func (u *GeneratorUsecase) SendMessage(ctx context.Context, sessionID uuid.UUID, input SendMessageInput) (*SendMessageResult, error) {
	prepared, err := u.prepareSendMessage(ctx, sessionID, input)
	if err != nil {
		return nil, err
	}

	aiResponse, err := u.aiGateway.GenerateSQL(ctx, prepared.aiInput)
	if err != nil {
		return nil, fmt.Errorf("generate sql: %w", err)
	}

	assistantMessage, err := u.generatorRepo.CreateMessage(ctx, &entity.GeneratorMessage{
		SessionID:    prepared.sessionID,
		Role:         entity.MessageRoleAssistant,
		Content:      aiResponse.Content,
		GeneratedSQL: aiResponse.GeneratedSQL,
	})
	if err != nil {
		return nil, err
	}

	if err := u.generatorRepo.TouchSession(ctx, prepared.sessionID); err != nil {
		return nil, err
	}

	return &SendMessageResult{
		UserMessage:      prepared.userMessage,
		AssistantMessage: assistantMessage,
	}, nil
}

func (u *GeneratorUsecase) syncSessionAfterMessage(
	ctx context.Context,
	session *entity.GeneratorSession,
	datasourceID *uuid.UUID,
	content string,
	isFirstMessage bool,
) error {
	needsUpdate := false

	updated := *session
	if datasourceID != nil && !optionalUUIDEqual(session.DatasourceID, datasourceID) {
		updated.DatasourceID = datasourceID
		needsUpdate = true
	}

	if isFirstMessage && strings.TrimSpace(session.Title) == "" {
		updated.Title = sessionTitleFromContent(content)
		needsUpdate = true
	}

	if needsUpdate {
		if _, err := u.generatorRepo.UpdateSession(ctx, &updated); err != nil {
			return err
		}
	}

	return u.generatorRepo.TouchSession(ctx, session.ID)
}

func (u *GeneratorUsecase) resolveAIProvider(ctx context.Context, session *entity.GeneratorSession) (*entity.AIProvider, error) {
	if session.AIProviderID != nil {
		return u.aiProviderRepo.GetByID(ctx, *session.AIProviderID)
	}

	providers, err := u.aiProviderRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	for _, provider := range providers {
		if provider.IsDefault {
			return provider, nil
		}
	}

	return nil, domain.ErrInvalidInput
}

func resolveDatasourceID(session *entity.GeneratorSession, override *uuid.UUID) (*uuid.UUID, error) {
	if override != nil {
		return override, nil
	}
	if session.DatasourceID != nil {
		return session.DatasourceID, nil
	}
	return nil, domain.ErrInvalidInput
}

func sessionTitleFromContent(content string) string {
	content = strings.TrimSpace(content)
	content = strings.ReplaceAll(content, "\n", " ")
	runes := []rune(content)
	if len(runes) > sessionTitleMaxRunes {
		return string(runes[:sessionTitleMaxRunes]) + "..."
	}
	return content
}

func buildConversationHistory(messages []*entity.GeneratorMessage) []ai.ChatMessage {
	history := make([]ai.ChatMessage, 0, len(messages))
	for _, message := range messages {
		switch message.Role {
		case entity.MessageRoleUser, entity.MessageRoleAssistant:
			history = append(history, ai.ChatMessage{
				Role:    message.Role,
				Content: message.Content,
			})
		}
	}
	return history
}

func buildTableSchemas(cache *entity.SchemaCache, tableNames []string) []entity.TableDetail {
	if cache == nil || len(tableNames) == 0 {
		return nil
	}

	wanted := make(map[string]struct{}, len(tableNames))
	for _, name := range tableNames {
		wanted[strings.ToLower(name)] = struct{}{}
	}

	schemas := make([]entity.TableDetail, 0, len(tableNames))
	for _, table := range cache.Tables {
		if _, ok := wanted[strings.ToLower(table.Name)]; ok {
			schemas = append(schemas, table.ToDetail())
		}
	}

	return schemas
}

func validateReferencedTables(cache *entity.SchemaCache, tableNames []string) error {
	for _, name := range tableNames {
		if !tableExistsInCache(cache, name) {
			return domain.ErrTableNotFound
		}
	}
	return nil
}

func tableExistsInCache(cache *entity.SchemaCache, tableName string) bool {
	for _, table := range cache.Tables {
		if strings.EqualFold(table.Name, tableName) {
			return true
		}
	}
	return false
}

func dialectFromDatasource(ds *entity.Datasource, cache *entity.SchemaCache) string {
	if cache != nil && strings.TrimSpace(cache.Dialect) != "" {
		return cache.Dialect
	}

	switch ds.DBType {
	case entity.DatasourceTypePostgreSQL:
		return entity.DatasourceTypePostgreSQL
	case entity.DatasourceTypeMySQL:
		return entity.DatasourceTypeMySQL
	default:
		return ds.DBType
	}
}

func optionalUUIDEqual(a, b *uuid.UUID) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}