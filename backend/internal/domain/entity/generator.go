package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	MessageRoleUser      = "user"
	MessageRoleAssistant   = "assistant"
	MessageRoleSystem    = "system"
)

type GeneratorSession struct {
	ID             uuid.UUID
	Title          string
	DatasourceID   *uuid.UUID
	AIProviderID   *uuid.UUID
	ContextSummary string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type GeneratorMessage struct {
	ID               uuid.UUID
	SessionID        uuid.UUID
	Role             string
	Content          string
	GeneratedSQL     string
	EditedSQL        string
	QueryResult      json.RawMessage
	ExecutionTimeMs  *int
	RowCount         *int
	ErrorMessage     string
	ReferencedTables []string
	AIMetadata       *AIMetadata
	CreatedAt        time.Time
}

func (m *GeneratorMessage) IsUser() bool {
	return m.Role == MessageRoleUser
}

func (m *GeneratorMessage) IsAssistant() bool {
	return m.Role == MessageRoleAssistant
}