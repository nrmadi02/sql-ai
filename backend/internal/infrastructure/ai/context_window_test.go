package ai

import (
	"strings"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestFilterConversationMessages(t *testing.T) {
	t.Parallel()

	messages := []*entity.GeneratorMessage{
		{Role: entity.MessageRoleUser, Content: "halo"},
		{Role: entity.MessageRoleAssistant, Content: "sql 1"},
		{Role: entity.MessageRoleSystem, Content: "ignored"},
		nil,
	}

	filtered := FilterConversationMessages(messages)
	if len(filtered) != 2 {
		t.Fatalf("filtered len = %d", len(filtered))
	}
}

func TestBuildConversationSummaryPromptIncludesExistingSummary(t *testing.T) {
	t.Parallel()

	prompt := BuildConversationSummaryPrompt("sudah bahas penjualan", []ChatMessage{
		{Role: entity.MessageRoleUser, Content: "tambah filter status"},
	})

	if !strings.Contains(prompt, "Ringkasan sebelumnya") {
		t.Fatal("expected previous summary section")
	}
	if !strings.Contains(prompt, "sudah bahas penjualan") {
		t.Fatal("expected previous summary content")
	}
	if !strings.Contains(prompt, "tambah filter status") {
		t.Fatal("expected batch message content")
	}
}

func TestFormatContextSummaryMessage(t *testing.T) {
	t.Parallel()

	if FormatContextSummaryMessage("") != "" {
		t.Fatal("expected empty summary message")
	}

	formatted := FormatContextSummaryMessage("diskusi tabel pesanan")
	if !strings.Contains(formatted, "Ringkasan percakapan sebelumnya") {
		t.Fatal("expected summary prefix")
	}
	if !strings.Contains(formatted, "diskusi tabel pesanan") {
		t.Fatal("expected summary body")
	}
}