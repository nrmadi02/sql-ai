package ai

type TokenUsage struct {
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
}

func (u *TokenUsage) IsEmpty() bool {
	return u == nil || (u.PromptTokens == 0 && u.CompletionTokens == 0 && u.TotalTokens == 0)
}

func EstimatePromptTokens(input GenerateSQLInput) int {
	size := len(BuildSQLSystemPrompt(input))
	size += len(FormatContextSummaryMessage(input.ContextSummary))
	for _, message := range input.ConversationHistory {
		size += len(message.Role) + len(message.Content)
	}
	size += len(input.UserMessage)
	return tokenCountFromChars(size)
}

func tokenCountFromChars(charCount int) int {
	if charCount <= 0 {
		return 0
	}
	return (charCount + 3) / 4
}