package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

type conversationContext struct {
	History             []ai.ChatMessage
	ContextSummary      string
	ContextWindowed     bool
	HistoryMessageCount int
}

func (u *GeneratorUsecase) buildConversationContext(
	ctx context.Context,
	sessionID uuid.UUID,
	provider *entity.AIProvider,
	existingSummary string,
	previousMessages []*entity.GeneratorMessage,
) (*conversationContext, error) {
	conversation := ai.FilterConversationMessages(previousMessages)
	summary := strings.TrimSpace(existingSummary)
	windowed := summary != "" || len(conversation) > ai.MaxHistoryMessages
	updatedSummary := summary

	for len(conversation) > ai.MaxHistoryMessages {
		batch := conversation[:ai.SummarizeBatchSize]
		conversation = conversation[ai.SummarizeBatchSize:]

		newSummary, err := u.aiGateway.SummarizeConversation(ctx, ai.SummarizeConversationInput{
			Provider:        provider,
			ExistingSummary: updatedSummary,
			Messages:        buildConversationHistory(batch),
		})
		if err != nil {
			return nil, fmt.Errorf("summarize conversation: %w", err)
		}

		updatedSummary = strings.TrimSpace(newSummary)
		windowed = true
	}

	if updatedSummary != summary {
		if err := u.generatorRepo.UpdateSessionSummary(ctx, sessionID, updatedSummary); err != nil {
			return nil, err
		}
	}

	return &conversationContext{
		History:             buildConversationHistory(conversation),
		ContextSummary:      updatedSummary,
		ContextWindowed:     windowed,
		HistoryMessageCount: len(conversation),
	}, nil
}