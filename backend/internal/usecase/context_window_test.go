package usecase

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

type stubSummarizeGateway struct {
	ai.Gateway
	summaries []string
}

func (s *stubSummarizeGateway) GenerateSQL(ctx context.Context, input ai.GenerateSQLInput) (*ai.GenerateSQLResponse, error) {
	return &ai.GenerateSQLResponse{}, nil
}

func (s *stubSummarizeGateway) GenerateSQLStream(ctx context.Context, input ai.GenerateSQLInput, onDelta ai.StreamDeltaCallback) (*ai.GenerateSQLResponse, error) {
	return &ai.GenerateSQLResponse{}, nil
}

func (s *stubSummarizeGateway) SummarizeConversation(ctx context.Context, input ai.SummarizeConversationInput) (string, error) {
	summary := "ringkasan-" + input.ExistingSummary
	s.summaries = append(s.summaries, summary)
	return summary, nil
}

type stubContextGeneratorRepo struct {
	summary string
}

func (s *stubContextGeneratorRepo) CreateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorSession, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) ListSessions(ctx context.Context) ([]*entity.GeneratorSession, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) UpdateSession(ctx context.Context, session *entity.GeneratorSession) (*entity.GeneratorSession, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) GetSessionWithSummary(ctx context.Context, id uuid.UUID) (string, error) {
	return s.summary, nil
}

func (s *stubContextGeneratorRepo) UpdateSessionSummary(ctx context.Context, id uuid.UUID, summary string) error {
	s.summary = summary
	return nil
}

func (s *stubContextGeneratorRepo) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return nil
}

func (s *stubContextGeneratorRepo) TouchSession(ctx context.Context, id uuid.UUID) error {
	return nil
}

func (s *stubContextGeneratorRepo) CreateMessage(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) GetMessageByID(ctx context.Context, id uuid.UUID) (*entity.GeneratorMessage, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) ListMessagesBySession(ctx context.Context, sessionID uuid.UUID) ([]*entity.GeneratorMessage, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) UpdateMessageAIResponse(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	return nil, nil
}

func (s *stubContextGeneratorRepo) UpdateMessageExecution(ctx context.Context, message *entity.GeneratorMessage) (*entity.GeneratorMessage, error) {
	return nil, nil
}

func makeConversationMessages(count int) []*entity.GeneratorMessage {
	messages := make([]*entity.GeneratorMessage, 0, count)
	for i := 0; i < count; i++ {
		role := entity.MessageRoleUser
		if i%2 == 1 {
			role = entity.MessageRoleAssistant
		}
		messages = append(messages, &entity.GeneratorMessage{
			Role:    role,
			Content: "pesan",
		})
	}
	return messages
}

func TestBuildConversationContextWindowsWhenExceedingLimit(t *testing.T) {
	t.Parallel()

	repo := &stubContextGeneratorRepo{}
	gateway := &stubSummarizeGateway{}
	usecase := &GeneratorUsecase{
		generatorRepo: repo,
		aiGateway:     gateway,
	}

	result, err := usecase.buildConversationContext(
		context.Background(),
		uuid.New(),
		&entity.AIProvider{APIFormat: entity.APIFormatOpenAI},
		"",
		makeConversationMessages(ai.MaxHistoryMessages+1),
	)
	if err != nil {
		t.Fatalf("buildConversationContext error: %v", err)
	}

	if !result.ContextWindowed {
		t.Fatal("expected context_windowed true")
	}
	expectedHistory := ai.MaxHistoryMessages + 1 - ai.SummarizeBatchSize
	if result.HistoryMessageCount != expectedHistory {
		t.Fatalf("history count = %d, want %d", result.HistoryMessageCount, expectedHistory)
	}
	if result.ContextSummary == "" {
		t.Fatal("expected persisted summary")
	}
	if repo.summary == "" {
		t.Fatal("expected summary saved to repository")
	}
	if len(gateway.summaries) != 1 {
		t.Fatalf("summarize calls = %d, want 1", len(gateway.summaries))
	}
}

func TestBuildConversationContextKeepsFullHistoryWithinLimit(t *testing.T) {
	t.Parallel()

	usecase := &GeneratorUsecase{
		generatorRepo: &stubContextGeneratorRepo{},
		aiGateway:     &stubSummarizeGateway{},
	}

	result, err := usecase.buildConversationContext(
		context.Background(),
		uuid.New(),
		&entity.AIProvider{APIFormat: entity.APIFormatOpenAI},
		"",
		makeConversationMessages(4),
	)
	if err != nil {
		t.Fatalf("buildConversationContext error: %v", err)
	}

	if result.ContextWindowed {
		t.Fatal("expected context_windowed false")
	}
	if result.HistoryMessageCount != 4 {
		t.Fatalf("history count = %d, want 4", result.HistoryMessageCount)
	}
}