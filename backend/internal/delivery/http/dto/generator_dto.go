package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type CreateSessionRequest struct {
	Title        string     `json:"title"`
	DatasourceID *uuid.UUID `json:"datasource_id"`
	AIProviderID *uuid.UUID `json:"ai_provider_id"`
}

type GeneratorSessionResponse struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title,omitempty"`
	DatasourceID *uuid.UUID `json:"datasource_id,omitempty"`
	AIProviderID *uuid.UUID `json:"ai_provider_id,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type SessionDetailResponse struct {
	Session  GeneratorSessionResponse   `json:"session"`
	Messages []GeneratorMessageResponse `json:"messages"`
}

type SendMessageRequest struct {
	Content      string     `json:"content"`
	Tables       []string   `json:"tables"`
	DatasourceID *uuid.UUID `json:"datasource_id"`
}

type AIMetadataResponse struct {
	ProviderName           string   `json:"provider_name"`
	ProviderID             string   `json:"provider_id,omitempty"`
	Model                  string   `json:"model"`
	APIFormat              string   `json:"api_format"`
	Dialect                string   `json:"dialect"`
	ContextTables          []string `json:"context_tables"`
	AvailableTablesCount   int      `json:"available_tables_count"`
	HistoryMessagesCount   int      `json:"history_messages_count"`
	EstimatedContextTokens int      `json:"estimated_context_tokens"`
	PromptTokens           *int     `json:"prompt_tokens,omitempty"`
	CompletionTokens       *int     `json:"completion_tokens,omitempty"`
	TotalTokens            *int     `json:"total_tokens,omitempty"`
}

type GeneratorMessageResponse struct {
	ID               uuid.UUID           `json:"id"`
	SessionID        uuid.UUID           `json:"session_id"`
	Role             string              `json:"role"`
	Content          string              `json:"content"`
	GeneratedSQL     string              `json:"generated_sql,omitempty"`
	EditedSQL        string              `json:"edited_sql,omitempty"`
	QueryResult      json.RawMessage     `json:"query_result,omitempty"`
	ExecutionTimeMs  *int                `json:"execution_time_ms,omitempty"`
	RowCount         *int                `json:"row_count,omitempty"`
	ErrorMessage     string              `json:"error_message,omitempty"`
	ReferencedTables []string            `json:"referenced_tables,omitempty"`
	AIMetadata       *AIMetadataResponse `json:"ai_metadata,omitempty"`
	CreatedAt        time.Time           `json:"created_at"`
}

type StreamDeltaResponse struct {
	Content string `json:"content"`
}

type StreamErrorResponse struct {
	Message string `json:"message"`
}

func ToGeneratorSessionResponse(session *entity.GeneratorSession) GeneratorSessionResponse {
	return GeneratorSessionResponse{
		ID:           session.ID,
		Title:        session.Title,
		DatasourceID: session.DatasourceID,
		AIProviderID: session.AIProviderID,
		CreatedAt:    session.CreatedAt,
		UpdatedAt:    session.UpdatedAt,
	}
}

func ToGeneratorSessionResponses(sessions []*entity.GeneratorSession) []GeneratorSessionResponse {
	result := make([]GeneratorSessionResponse, 0, len(sessions))
	for _, session := range sessions {
		result = append(result, ToGeneratorSessionResponse(session))
	}
	return result
}

func ToSessionDetailResponse(session *entity.GeneratorSession, messages []*entity.GeneratorMessage) SessionDetailResponse {
	return SessionDetailResponse{
		Session:  ToGeneratorSessionResponse(session),
		Messages: ToGeneratorMessageResponses(messages),
	}
}

func ToGeneratorMessageResponses(messages []*entity.GeneratorMessage) []GeneratorMessageResponse {
	result := make([]GeneratorMessageResponse, 0, len(messages))
	for _, message := range messages {
		result = append(result, ToGeneratorMessageResponse(message))
	}
	return result
}

func ToAIMetadataResponse(metadata *entity.AIMetadata) *AIMetadataResponse {
	if metadata == nil {
		return nil
	}

	contextTables := metadata.ContextTables
	if contextTables == nil {
		contextTables = []string{}
	}

	return &AIMetadataResponse{
		ProviderName:           metadata.ProviderName,
		ProviderID:             metadata.ProviderID,
		Model:                  metadata.Model,
		APIFormat:              metadata.APIFormat,
		Dialect:                metadata.Dialect,
		ContextTables:          contextTables,
		AvailableTablesCount:   metadata.AvailableTablesCount,
		HistoryMessagesCount:   metadata.HistoryMessagesCount,
		EstimatedContextTokens: metadata.EstimatedContextTokens,
		PromptTokens:           metadata.PromptTokens,
		CompletionTokens:       metadata.CompletionTokens,
		TotalTokens:            metadata.TotalTokens,
	}
}

func ToGeneratorMessageResponse(message *entity.GeneratorMessage) GeneratorMessageResponse {
	referencedTables := message.ReferencedTables
	if referencedTables == nil {
		referencedTables = []string{}
	}

	return GeneratorMessageResponse{
		ID:               message.ID,
		SessionID:        message.SessionID,
		Role:             message.Role,
		Content:          message.Content,
		GeneratedSQL:     message.GeneratedSQL,
		EditedSQL:        message.EditedSQL,
		QueryResult:      message.QueryResult,
		ExecutionTimeMs:  message.ExecutionTimeMs,
		RowCount:         message.RowCount,
		ErrorMessage:     message.ErrorMessage,
		ReferencedTables: referencedTables,
		AIMetadata:       ToAIMetadataResponse(message.AIMetadata),
		CreatedAt:        message.CreatedAt,
	}
}