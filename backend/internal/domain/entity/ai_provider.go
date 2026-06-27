package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	APIFormatOpenAI     = "openai"
	APIFormatAnthropic  = "anthropic"
)

type AIProvider struct {
	ID        uuid.UUID
	Name      string
	APIFormat string
	BaseURL   string
	APIKey    string
	Model     string
	IsDefault bool
	Config    json.RawMessage
	CreatedAt time.Time
	UpdatedAt time.Time
}