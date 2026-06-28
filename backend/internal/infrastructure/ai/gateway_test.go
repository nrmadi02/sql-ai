package ai

import (
	"context"
	"errors"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type stubSQLGenerator struct {
	format string
	err    error
}

func (s *stubSQLGenerator) GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error) {
	return s.GenerateSQLStream(ctx, input, nil)
}

func (s *stubSQLGenerator) GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error) {
	if s.err != nil {
		return nil, s.err
	}
	if onDelta != nil {
		_ = onDelta("ok-")
		_ = onDelta(s.format)
	}
	return &GenerateSQLResponse{
		Content:      "ok-" + s.format,
		GeneratedSQL: "SELECT 1",
	}, nil
}

func (s *stubSQLGenerator) SummarizeConversation(ctx context.Context, input SummarizeConversationInput) (string, error) {
	if s.err != nil {
		return "", s.err
	}
	return "ringkasan percakapan", nil
}

func TestGatewayRoutesByAPIFormat(t *testing.T) {
	t.Parallel()

	openAI := &stubSQLGenerator{format: entity.APIFormatOpenAI}
	anthropic := &stubSQLGenerator{format: entity.APIFormatAnthropic}
	gw := NewGatewayWithClients(openAI, anthropic)

	openAIResult, err := gw.GenerateSQL(context.Background(), GenerateSQLInput{
		Provider: &entity.AIProvider{APIFormat: entity.APIFormatOpenAI},
	})
	if err != nil {
		t.Fatalf("openai route error: %v", err)
	}
	if openAIResult.Content != "ok-openai" {
		t.Fatalf("openai content = %q", openAIResult.Content)
	}

	anthropicResult, err := gw.GenerateSQL(context.Background(), GenerateSQLInput{
		Provider: &entity.AIProvider{APIFormat: entity.APIFormatAnthropic},
	})
	if err != nil {
		t.Fatalf("anthropic route error: %v", err)
	}
	if anthropicResult.Content != "ok-anthropic" {
		t.Fatalf("anthropic content = %q", anthropicResult.Content)
	}
}

func TestGatewayNilProvider(t *testing.T) {
	t.Parallel()

	gw := NewGatewayWithClients(&stubSQLGenerator{}, &stubSQLGenerator{})
	_, err := gw.GenerateSQL(context.Background(), GenerateSQLInput{})
	if !errors.Is(err, domain.ErrInvalidInput) {
		t.Fatalf("expected ErrInvalidInput, got %v", err)
	}
}

func TestGatewayUnsupportedFormat(t *testing.T) {
	t.Parallel()

	gw := NewGatewayWithClients(&stubSQLGenerator{}, &stubSQLGenerator{})
	_, err := gw.GenerateSQL(context.Background(), GenerateSQLInput{
		Provider: &entity.AIProvider{APIFormat: "gemini"},
	})
	if !errors.Is(err, domain.ErrUnsupportedAPIFmt) {
		t.Fatalf("expected ErrUnsupportedAPIFmt, got %v", err)
	}
}