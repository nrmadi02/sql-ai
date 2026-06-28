package usecase

import (
	"encoding/json"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestParseAIVisualizationHintsChartBlock(t *testing.T) {
	t.Parallel()

	raw := `{"content":"Berikut query grafik","sql":"SELECT kategori, COUNT(*) AS total FROM users GROUP BY kategori"}
` + "```chart\n" + `{"chart_type":"pie","x_axis_column":"kategori","y_axis_columns":["total"],"category_column":null}` + "\n```"

	hints := parseAIVisualizationHints(raw)
	if len(hints.SuggestedChart) == 0 {
		t.Fatal("expected suggested chart payload")
	}

	var chart map[string]any
	if err := json.Unmarshal(hints.SuggestedChart, &chart); err != nil {
		t.Fatalf("unmarshal chart: %v", err)
	}
	if chart["chart_type"] != "pie" {
		t.Fatalf("chart_type = %v", chart["chart_type"])
	}
}

func TestParseAIVisualizationHintsLooseChartLine(t *testing.T) {
	t.Parallel()

	raw := `chart {"content":"Berikut query grafik","sql":"SELECT full_name, COUNT(*) AS total FROM users GROUP BY full_name"}
{"chart_type":"bar","x_axis_column":"full_name","y_axis_columns":["total"],"category_column":null}`

	hints := parseAIVisualizationHints(raw)
	if len(hints.SuggestedChart) == 0 {
		t.Fatal("expected loose chart payload")
	}

	var chart map[string]any
	if err := json.Unmarshal(hints.SuggestedChart, &chart); err != nil {
		t.Fatalf("unmarshal chart: %v", err)
	}
	if chart["chart_type"] != "bar" {
		t.Fatalf("chart_type = %v", chart["chart_type"])
	}
}

func TestParseAIVisualizationHintsStructuredFields(t *testing.T) {
	t.Parallel()

	raw := `{"content":"Data terlalu besar","sql":"SELECT * FROM users","suggested_filters":["Tampilkan Top 10"],"suggested_aggregations":["Hitung total user per bulan"]}`

	hints := parseAIVisualizationHints(raw)
	if len(hints.SuggestedFilters) != 1 {
		t.Fatalf("filters = %v", hints.SuggestedFilters)
	}
	if len(hints.SuggestedAggregations) != 1 {
		t.Fatalf("aggregations = %v", hints.SuggestedAggregations)
	}
}

func TestApplyVisualizationHints(t *testing.T) {
	t.Parallel()

	metadata := entity.AIMetadata{}
	applyVisualizationHints(&metadata, aiVisualizationHints{
		SuggestedChart:        json.RawMessage(`{"chart_type":"bar"}`),
		SuggestedFilters:      []string{"Top 10"},
		SuggestedAggregations: []string{"Per bulan"},
	})

	if len(metadata.SuggestedChart) == 0 {
		t.Fatal("expected suggested chart on metadata")
	}
	if len(metadata.SuggestedFilters) != 1 {
		t.Fatalf("filters = %v", metadata.SuggestedFilters)
	}
	if len(metadata.SuggestedAggregations) != 1 {
		t.Fatalf("aggregations = %v", metadata.SuggestedAggregations)
	}
}