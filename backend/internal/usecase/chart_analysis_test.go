package usecase

import "testing"

func TestAnalyzeChartDatasetNonChartable(t *testing.T) {
	t.Parallel()

	result := analyzeChartDataset(ChartSuggestInput{
		Columns: []QueryColumnResult{
			{Name: "id", Type: "bigint"},
			{Name: "name", Type: "varchar"},
			{Name: "email", Type: "text"},
		},
		Rows: [][]any{
			{1, "Alice", "alice@example.com"},
			{2, "Bob", "bob@example.com"},
		},
	})

	if result.Chartable {
		t.Fatal("expected non-chartable dataset")
	}
	if len(result.SuggestedAggregations) == 0 {
		t.Fatal("expected aggregation suggestions")
	}
}

func TestAnalyzeChartDatasetChartable(t *testing.T) {
	t.Parallel()

	result := analyzeChartDataset(ChartSuggestInput{
		Columns: []QueryColumnResult{
			{Name: "bulan", Type: "date"},
			{Name: "total_penjualan", Type: "numeric"},
		},
		Rows: [][]any{
			{"2024-01-01", 1500000.0},
			{"2024-02-01", 2200000.0},
		},
	})

	if !result.Chartable {
		t.Fatal("expected chartable dataset")
	}
	if result.NumericColumns[0] != "total_penjualan" {
		t.Fatalf("numeric columns = %v", result.NumericColumns)
	}
}

func TestAnalyzeChartDatasetAggregateWithUnknownType(t *testing.T) {
	t.Parallel()

	result := analyzeChartDataset(ChartSuggestInput{
		Columns: []QueryColumnResult{
			{Name: "full_name", Type: "varchar"},
			{Name: "total", Type: ""},
		},
		Rows: [][]any{
			{"Alice", int64(12)},
			{"Bob", int64(8)},
		},
	})

	if !result.Chartable {
		t.Fatal("expected chartable aggregate dataset")
	}
	if result.NumericColumns[0] != "total" {
		t.Fatalf("numeric columns = %v", result.NumericColumns)
	}
	if len(result.SuggestedAggregations) != 0 {
		t.Fatalf("aggregations = %v", result.SuggestedAggregations)
	}
}

func TestAnalyzeChartDatasetLarge(t *testing.T) {
	t.Parallel()

	result := analyzeChartDataset(ChartSuggestInput{
		Columns: []QueryColumnResult{
			{Name: "kategori", Type: "varchar"},
			{Name: "total", Type: "bigint"},
		},
		Rows:     [][]any{{"A", 10}},
		RowCount: 250,
	})

	if !result.LargeDataset {
		t.Fatal("expected large dataset flag")
	}
	if len(result.SuggestedFilters) == 0 {
		t.Fatal("expected filter suggestions")
	}
}

func TestChartUsecaseSuggestInvalidInput(t *testing.T) {
	t.Parallel()

	uc := NewChartUsecase(nil)
	if _, err := uc.Suggest(ChartSuggestInput{}); err == nil {
		t.Fatal("expected invalid input error")
	}
}