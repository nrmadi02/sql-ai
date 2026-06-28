package usecase

import (
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

func buildAIMetadata(input ai.GenerateSQLInput, usage *ai.TokenUsage) entity.AIMetadata {
	contextTables := input.ContextTables
	if contextTables == nil {
		contextTables = []string{}
	}

	historyCount := input.HistoryMessageCount
	if historyCount == 0 {
		historyCount = len(input.ConversationHistory)
	}

	metadata := entity.AIMetadata{
		Model:                  "",
		APIFormat:              "",
		Dialect:                input.Dialect,
		ContextTables:          contextTables,
		AvailableTablesCount:   len(input.AvailableTables),
		HistoryMessagesCount:   historyCount,
		ContextWindowed:        input.ContextWindowed,
		EstimatedContextTokens: ai.EstimatePromptTokens(input),
	}

	if input.Provider != nil {
		metadata.ProviderName = input.Provider.Name
		metadata.ProviderID = input.Provider.ID.String()
		metadata.Model = input.Provider.Model
		metadata.APIFormat = input.Provider.APIFormat
	}

	if usage != nil && !usage.IsEmpty() {
		promptTokens := usage.PromptTokens
		completionTokens := usage.CompletionTokens
		totalTokens := usage.TotalTokens
		if totalTokens == 0 {
			totalTokens = promptTokens + completionTokens
		}

		metadata.PromptTokens = &promptTokens
		metadata.CompletionTokens = &completionTokens
		metadata.TotalTokens = &totalTokens
	}

	return metadata
}