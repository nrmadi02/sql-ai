package usecase

import (
	"encoding/json"
	"fmt"
	"strings"
)

const largeDatasetRowThreshold = 100

var numericTypeHints = []string{
	"int",
	"float",
	"double",
	"decimal",
	"numeric",
	"bigint",
	"real",
	"money",
	"number",
}

var labelTypeHints = []string{
	"char",
	"text",
	"uuid",
	"json",
	"bool",
	"bytea",
	"blob",
	"string",
}

var temporalTypeHints = []string{
	"date",
	"time",
	"timestamp",
}

type ChartSuggestInput struct {
	Columns  []QueryColumnResult
	Rows     [][]any
	RowCount int
}

type ChartSuggestResult struct {
	Chartable             bool
	LargeDataset          bool
	NumericColumns        []string
	LabelColumns          []string
	SuggestedFilters      []string
	SuggestedAggregations []string
}

func analyzeChartDataset(input ChartSuggestInput) ChartSuggestResult {
	columns := input.Columns
	rowCount := input.RowCount
	if rowCount <= 0 {
		rowCount = len(input.Rows)
	}

	numericColumns := findNumericColumns(columns, input.Rows)
	labelColumns := findLabelColumns(columns, numericColumns)

	result := ChartSuggestResult{
		Chartable:      len(numericColumns) > 0,
		LargeDataset:   rowCount > largeDatasetRowThreshold,
		NumericColumns: numericColumns,
		LabelColumns:   labelColumns,
	}

	if !result.Chartable {
		result.SuggestedAggregations = buildSuggestedAggregations(columns, labelColumns, numericColumns)
	}

	if result.LargeDataset {
		result.SuggestedFilters = buildSuggestedFilters(columns, labelColumns, numericColumns, rowCount)
	}

	return result
}

func isNumericColumnType(columnType string) bool {
	normalized := strings.ToLower(strings.TrimSpace(columnType))
	for _, hint := range numericTypeHints {
		if strings.Contains(normalized, hint) {
			return true
		}
	}
	return false
}

func isLabelColumnType(columnType string) bool {
	normalized := strings.ToLower(strings.TrimSpace(columnType))
	if normalized == "" {
		return false
	}
	for _, hint := range labelTypeHints {
		if strings.Contains(normalized, hint) {
			return true
		}
	}
	return false
}

func isTemporalColumnType(columnType string) bool {
	normalized := strings.ToLower(strings.TrimSpace(columnType))
	for _, hint := range temporalTypeHints {
		if strings.Contains(normalized, hint) {
			return true
		}
	}
	return false
}

func findNumericColumns(columns []QueryColumnResult, rows [][]any) []string {
	result := make([]string, 0, len(columns))
	for index, column := range columns {
		if !isChartableNumericColumn(column, rows, index) {
			continue
		}
		result = append(result, column.Name)
	}
	return result
}

func isChartableNumericColumn(column QueryColumnResult, rows [][]any, columnIndex int) bool {
	if looksLikeIDColumn(column.Name) {
		return false
	}
	if isTemporalColumnType(column.Type) {
		return false
	}
	if !columnHasChartableNumericValues(rows, columnIndex) {
		return false
	}
	if isNumericColumnType(column.Type) {
		return true
	}
	if isLabelColumnType(column.Type) {
		return false
	}
	return true
}

func findLabelColumns(columns []QueryColumnResult, numericColumns []string) []string {
	numericSet := make(map[string]struct{}, len(numericColumns))
	for _, column := range numericColumns {
		numericSet[strings.ToLower(column)] = struct{}{}
	}

	result := make([]string, 0, len(columns))
	for _, column := range columns {
		if _, isNumeric := numericSet[strings.ToLower(column.Name)]; isNumeric {
			continue
		}
		result = append(result, column.Name)
	}
	return result
}

func columnHasChartableNumericValues(rows [][]any, columnIndex int) bool {
	if len(rows) == 0 {
		return true
	}

	sampleSize := len(rows)
	if sampleSize > 20 {
		sampleSize = 20
	}

	validCount := 0
	for rowIndex := 0; rowIndex < sampleSize; rowIndex++ {
		row := rows[rowIndex]
		if columnIndex >= len(row) {
			continue
		}
		if _, ok := coerceNumericValue(row[columnIndex]); ok {
			validCount++
		}
	}

	return validCount > 0
}

func coerceNumericValue(value any) (float64, bool) {
	switch typed := value.(type) {
	case nil:
		return 0, false
	case float32:
		return float64(typed), true
	case float64:
		return typed, true
	case int:
		return float64(typed), true
	case int32:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case uint:
		return float64(typed), true
	case uint32:
		return float64(typed), true
	case uint64:
		return float64(typed), true
	case json.Number:
		parsed, err := typed.Float64()
		return parsed, err == nil
	case string:
		text := strings.TrimSpace(typed)
		if text == "" {
			return 0, false
		}
		var parsed float64
		if _, err := fmt.Sscanf(text, "%f", &parsed); err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}

func buildSuggestedAggregations(columns []QueryColumnResult, labelColumns, numericColumns []string) []string {
	suggestions := make([]string, 0, 3)
	seen := make(map[string]struct{})

	addSuggestion := func(text string) {
		text = strings.TrimSpace(text)
		if text == "" {
			return
		}
		key := strings.ToLower(text)
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		suggestions = append(suggestions, text)
	}

	primaryLabel := firstNonIDColumn(labelColumns)
	if primaryLabel == "" && len(columns) > 0 {
		primaryLabel = columns[0].Name
	}

	temporalColumn := findTemporalColumn(columns)
	if temporalColumn != "" {
		addSuggestion(fmt.Sprintf("Hitung jumlah baris per %s", temporalColumn))
	}

	if primaryLabel != "" {
		addSuggestion(fmt.Sprintf("Hitung jumlah baris per %s", primaryLabel))
	}

	primaryNumeric := firstMeaningfulNumericColumn(numericColumns)
	if primaryLabel != "" && primaryNumeric != "" {
		addSuggestion(fmt.Sprintf("Hitung total %s per %s", primaryNumeric, primaryLabel))
	}

	if len(suggestions) == 0 {
		addSuggestion("Kelompokkan data dengan GROUP BY dan fungsi agregasi COUNT/SUM")
	}

	return suggestions
}

func buildSuggestedFilters(columns []QueryColumnResult, labelColumns, numericColumns []string, rowCount int) []string {
	suggestions := make([]string, 0, 3)
	seen := make(map[string]struct{})

	addSuggestion := func(text string) {
		text = strings.TrimSpace(text)
		if text == "" {
			return
		}
		key := strings.ToLower(text)
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		suggestions = append(suggestions, text)
	}

	primaryNumeric := firstMeaningfulNumericColumn(numericColumns)
	if primaryNumeric != "" {
		addSuggestion(fmt.Sprintf("Tampilkan Top 10 berdasarkan %s", primaryNumeric))
	}

	temporalColumn := findTemporalColumn(columns)
	if temporalColumn != "" {
		addSuggestion(fmt.Sprintf("Kelompokkan data per %s", temporalColumn))
	}

	addSuggestion(fmt.Sprintf("Batasi hasil ke 50 baris dari %d baris", rowCount))

	return suggestions
}

func findTemporalColumn(columns []QueryColumnResult) string {
	for _, column := range columns {
		if isTemporalColumnType(column.Type) {
			return column.Name
		}
	}

	for _, column := range columns {
		name := strings.ToLower(column.Name)
		if strings.Contains(name, "date") ||
			strings.Contains(name, "time") ||
			strings.Contains(name, "tanggal") ||
			strings.Contains(name, "bulan") ||
			strings.Contains(name, "tahun") {
			return column.Name
		}
	}

	return ""
}

func firstNonIDColumn(columns []string) string {
	for _, column := range columns {
		if !looksLikeIDColumn(column) {
			return column
		}
	}
	return ""
}

func firstMeaningfulNumericColumn(columns []string) string {
	for _, column := range columns {
		if !looksLikeIDColumn(column) {
			return column
		}
	}
	if len(columns) > 0 {
		return columns[0]
	}
	return ""
}

func looksLikeIDColumn(name string) bool {
	normalized := strings.ToLower(strings.TrimSpace(name))
	return normalized == "id" || strings.HasSuffix(normalized, "_id")
}