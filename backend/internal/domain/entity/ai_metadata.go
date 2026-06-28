package entity

type AIMetadata struct {
	ProviderName           string   `json:"provider_name"`
	ProviderID             string   `json:"provider_id,omitempty"`
	Model                  string   `json:"model"`
	APIFormat              string   `json:"api_format"`
	Dialect                string   `json:"dialect"`
	ContextTables          []string `json:"context_tables"`
	AvailableTablesCount   int      `json:"available_tables_count"`
	HistoryMessagesCount   int      `json:"history_messages_count"`
	ContextWindowed        bool     `json:"context_windowed"`
	EstimatedContextTokens int      `json:"estimated_context_tokens"`
	PromptTokens           *int     `json:"prompt_tokens,omitempty"`
	CompletionTokens       *int     `json:"completion_tokens,omitempty"`
	TotalTokens            *int     `json:"total_tokens,omitempty"`
}