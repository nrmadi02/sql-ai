package ai

import (
	"encoding/json"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestExtractAnthropicAssistantText(t *testing.T) {
	t.Parallel()

	response := anthropicMessagesResponse{
		Content: []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		}{
			{Type: "text", Text: `{"content":"Halo","sql":"SELECT 1"}`},
		},
	}

	got := extractAnthropicAssistantText(response)
	if got == "" {
		t.Fatal("expected assistant text")
	}

	parsed, err := parseOpenAIAssistantContent(got)
	if err != nil {
		t.Fatalf("parse content: %v", err)
	}
	if parsed.GeneratedSQL != "SELECT 1" {
		t.Fatalf("sql = %q", parsed.GeneratedSQL)
	}
}

func TestBuildAnthropicMessages(t *testing.T) {
	t.Parallel()

	input := GenerateSQLInput{
		Provider: &entity.AIProvider{Model: "claude-sonnet-4-20250514"},
		Dialect:  "postgresql",
		UserMessage: "tampilkan semua user",
		ConversationHistory: []ChatMessage{
			{Role: entity.MessageRoleUser, Content: "halo"},
			{Role: entity.MessageRoleAssistant, Content: "halo juga"},
			{Role: entity.MessageRoleSystem, Content: "ignored"},
		},
	}

	messages, system := buildAnthropicMessages(input)
	if system == "" {
		t.Fatal("expected system prompt")
	}
	if len(messages) != 3 {
		t.Fatalf("len(messages) = %d, want 3", len(messages))
	}
	if messages[0].Role != "user" || messages[1].Role != "assistant" {
		t.Fatalf("unexpected history roles: %+v", messages[:2])
	}
	if messages[2].Role != "user" || messages[2].Content != input.UserMessage {
		t.Fatalf("unexpected final message: %+v", messages[2])
	}

	payload, err := json.Marshal(anthropicMessagesRequest{
		Model:     input.Provider.Model,
		MaxTokens: anthropicMaxTokens,
		System:    system,
		Messages:  messages,
	})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatalf("unmarshal request: %v", err)
	}
	if decoded["model"] != input.Provider.Model {
		t.Fatalf("model = %v", decoded["model"])
	}
	if decoded["system"] == "" {
		t.Fatal("expected system field in anthropic payload")
	}
}

func TestAnthropicRoleMapping(t *testing.T) {
	t.Parallel()

	if anthropicRole(entity.MessageRoleUser) != "user" {
		t.Fatal("expected user role")
	}
	if anthropicRole(entity.MessageRoleAssistant) != "assistant" {
		t.Fatal("expected assistant role")
	}
	if anthropicRole(entity.MessageRoleSystem) != "" {
		t.Fatal("system role should not be included in anthropic messages")
	}
}