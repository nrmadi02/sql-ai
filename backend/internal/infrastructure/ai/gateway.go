package ai

import (
	"context"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type ChatMessage struct {
	Role    string
	Content string
}

type GenerateSQLInput struct {
	Provider            *entity.AIProvider
	Dialect             string
	UserMessage         string
	AvailableTables     []string
	ReferencedTables    []string
	ContextTables       []string
	TableSchemas        []entity.TableDetail
	ConversationHistory []ChatMessage
}

type GenerateSQLResponse struct {
	Content      string
	GeneratedSQL string
	Usage        *TokenUsage
}

type Gateway interface {
	GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error)
	GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error)
}

type sqlGeneratorClient interface {
	GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error)
	GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error)
}

type gateway struct {
	openAI    sqlGeneratorClient
	anthropic sqlGeneratorClient
}

func NewGateway() Gateway {
	return NewGatewayWithClients(NewOpenAICompat(), NewAnthropicCompat())
}

func NewGatewayWithClients(openAI, anthropic sqlGeneratorClient) Gateway {
	return &gateway{
		openAI:    openAI,
		anthropic: anthropic,
	}
}

func (g *gateway) GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error) {
	return g.GenerateSQLStream(ctx, input, nil)
}

func (g *gateway) GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error) {
	if input.Provider == nil {
		return nil, domain.ErrInvalidInput
	}

	switch strings.TrimSpace(input.Provider.APIFormat) {
	case entity.APIFormatOpenAI:
		return g.openAI.GenerateSQLStream(ctx, input, onDelta)
	case entity.APIFormatAnthropic:
		return g.anthropic.GenerateSQLStream(ctx, input, onDelta)
	default:
		return nil, domain.ErrUnsupportedAPIFmt
	}
}