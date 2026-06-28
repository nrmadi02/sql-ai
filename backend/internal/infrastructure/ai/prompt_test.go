package ai

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestBuildSQLSystemPromptIncludesDialectSchemaAndIndonesian(t *testing.T) {
	t.Parallel()

	input := GenerateSQLInput{
		Dialect: "postgresql",
		ReferencedTables: []string{"orders"},
		TableSchemas: []entity.TableDetail{
			{
				Name: "orders",
				Columns: []entity.Column{
					{Name: "id", Type: "bigint", PrimaryKey: true},
					{Name: "customer_id", Type: "bigint", ForeignKey: "customers.id"},
				},
				Relations: []entity.Relation{
					{
						Column:           "customer_id",
						ReferencedTable:  "customers",
						ReferencedColumn: "id",
						Type:             "many-to-one",
					},
				},
			},
		},
	}

	prompt := BuildSQLSystemPrompt(input)

	if !strings.Contains(prompt, "postgresql") {
		t.Fatal("expected dialect in prompt")
	}
	if !strings.Contains(prompt, "Bahasa Indonesia") {
		t.Fatal("expected Indonesian instruction in prompt")
	}
	if !strings.Contains(prompt, `"orders"`) {
		t.Fatal("expected table name in prompt context")
	}
	if !strings.Contains(prompt, "orders.customer_id") {
		t.Fatal("expected relation in prompt context")
	}
}

func TestBuildPromptContextIncludesAvailableTables(t *testing.T) {
	t.Parallel()

	input := GenerateSQLInput{
		Dialect:          "postgresql",
		AvailableTables:  []string{"users", "orders"},
		ReferencedTables: []string{"users"},
		ContextTables:    []string{"users"},
		TableSchemas: []entity.TableDetail{
			{
				Name: "users",
				Columns: []entity.Column{
					{Name: "id", Type: "bigint", PrimaryKey: true},
				},
			},
		},
	}

	prompt := BuildSQLSystemPrompt(input)
	if !strings.Contains(prompt, `"available_tables"`) {
		t.Fatal("expected available_tables in prompt")
	}
	if !strings.Contains(prompt, `"users"`) {
		t.Fatal("expected users in prompt")
	}
	if !strings.Contains(prompt, "Jangan katakan tabel tidak ada") {
		t.Fatal("expected available table guidance in prompt")
	}
}

func TestBuildSQLSystemPromptIncludesVisualizationRules(t *testing.T) {
	t.Parallel()

	prompt := BuildSQLSystemPrompt(GenerateSQLInput{Dialect: "postgresql"})

	for _, snippet := range []string{
		"visualisasi",
		"daftar datar tanpa agregasi",
		"```chart",
		"suggested_aggregations",
		"suggested_filters",
	} {
		if !strings.Contains(prompt, snippet) {
			t.Fatalf("expected %q in prompt", snippet)
		}
	}
}

func TestBuildPromptContextShape(t *testing.T) {
	t.Parallel()

	input := GenerateSQLInput{
		Dialect:          "mysql",
		ReferencedTables: []string{"users"},
		TableSchemas: []entity.TableDetail{
			{
				Name: "users",
				Columns: []entity.Column{
					{Name: "id", Type: "int", PrimaryKey: true},
				},
			},
		},
	}

	contextPayload := buildPromptContext(input, "mysql")
	raw, err := json.Marshal(contextPayload)
	if err != nil {
		t.Fatalf("marshal context: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal context: %v", err)
	}

	if decoded["dialect"] != "mysql" {
		t.Fatalf("dialect = %v", decoded["dialect"])
	}

	tables, ok := decoded["tables"].([]any)
	if !ok || len(tables) != 1 {
		t.Fatalf("tables = %v", decoded["tables"])
	}
}