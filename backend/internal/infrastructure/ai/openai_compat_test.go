package ai

import (
	"encoding/json"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestParseOpenAIAssistantContentJSON(t *testing.T) {
	t.Parallel()

	raw := `{"content":"Berikut query penjualan per bulan.","sql":"SELECT 1"}`
	got, err := parseOpenAIAssistantContent(raw)
	if err != nil {
		t.Fatalf("parseOpenAIAssistantContent() error = %v", err)
	}

	if got.Content != "Berikut query penjualan per bulan." {
		t.Fatalf("content = %q", got.Content)
	}
	if got.GeneratedSQL != "SELECT 1" {
		t.Fatalf("sql = %q", got.GeneratedSQL)
	}
}

func TestParseOpenAIAssistantContentJSONCodeBlock(t *testing.T) {
	t.Parallel()

	raw := "```json\n{\"content\":\"Halo\",\"sql\":\"SELECT * FROM orders\"}\n```"
	got, err := parseOpenAIAssistantContent(raw)
	if err != nil {
		t.Fatalf("parseOpenAIAssistantContent() error = %v", err)
	}

	if got.Content != "Halo" {
		t.Fatalf("content = %q", got.Content)
	}
	if got.GeneratedSQL != "SELECT * FROM orders" {
		t.Fatalf("sql = %q", got.GeneratedSQL)
	}
}

func TestParseOpenAIAssistantContentSQLCodeBlock(t *testing.T) {
	t.Parallel()

	raw := "Berikut query-nya:\n```sql\nSELECT id FROM users;\n```"
	got, err := parseOpenAIAssistantContent(raw)
	if err != nil {
		t.Fatalf("parseOpenAIAssistantContent() error = %v", err)
	}

	if got.GeneratedSQL != "SELECT id FROM users;" {
		t.Fatalf("sql = %q", got.GeneratedSQL)
	}
}

func TestBuildOpenAIMessages(t *testing.T) {
	t.Parallel()

	input := GenerateSQLInput{
		Provider: &entity.AIProvider{Model: "gpt-4o"},
		Dialect:  "postgresql",
		UserMessage: "tampilkan semua user",
		ConversationHistory: []ChatMessage{
			{Role: entity.MessageRoleUser, Content: "halo"},
			{Role: entity.MessageRoleAssistant, Content: "halo juga"},
		},
		TableSchemas: []entity.TableDetail{
			{Name: "users", Columns: []entity.Column{{Name: "id", Type: "bigint"}}},
		},
	}

	messages := buildOpenAIMessages(input)
	if len(messages) != 4 {
		t.Fatalf("len(messages) = %d, want 4", len(messages))
	}
	if messages[0].Role != "system" {
		t.Fatalf("first role = %q, want system", messages[0].Role)
	}
	if messages[len(messages)-1].Content != input.UserMessage {
		t.Fatalf("last message = %q", messages[len(messages)-1].Content)
	}

	payload, err := json.Marshal(openAIChatRequest{
		Model:    input.Provider.Model,
		Messages: messages,
	})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatalf("unmarshal request: %v", err)
	}
	if decoded["model"] != "gpt-4o" {
		t.Fatalf("model = %v", decoded["model"])
	}
}

func TestOpenAIRoleMapping(t *testing.T) {
	t.Parallel()

	if openAIRole(entity.MessageRoleUser) != "user" {
		t.Fatal("expected user role")
	}
	if openAIRole(entity.MessageRoleAssistant) != "assistant" {
		t.Fatal("expected assistant role")
	}
	if openAIRole("unknown") != "" {
		t.Fatal("expected empty role for unknown")
	}
}