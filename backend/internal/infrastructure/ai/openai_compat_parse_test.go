package ai

import "testing"

func TestParseOpenAIAssistantContentChartPrefixedJSON(t *testing.T) {
	t.Parallel()

	raw := `chart {"content":"Query ini diubah dari daftar datar menjadi bentuk agregasi.","sql":"SELECT full_name, COUNT(*) AS total FROM users GROUP BY full_name ORDER BY total DESC LIMIT 10","suggested_aggregations":["Coba kelompokkan berdasarkan kolom lain"],"suggested_filters":["Tambahkan filter WHERE"]}
{"chart_type":"bar","x_axis_column":"full_name","y_axis_columns":["total"],"category_column":null}`

	got, err := parseOpenAIAssistantContent(raw)
	if err != nil {
		t.Fatalf("parseOpenAIAssistantContent() error = %v", err)
	}

	if got.Content != "Query ini diubah dari daftar datar menjadi bentuk agregasi." {
		t.Fatalf("content = %q", got.Content)
	}
	if got.GeneratedSQL != "SELECT full_name, COUNT(*) AS total FROM users GROUP BY full_name ORDER BY total DESC LIMIT 10" {
		t.Fatalf("sql = %q", got.GeneratedSQL)
	}
}