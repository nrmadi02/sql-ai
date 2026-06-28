package usecase

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

var (
	chartBlockPattern = regexp.MustCompile("(?is)```chart\\s*([\\s\\S]*?)```")
	jsonBlockPattern  = regexp.MustCompile("(?is)```(?:json)?\\s*([\\s\\S]*?)```")
)

type aiVisualizationHints struct {
	SuggestedChart        json.RawMessage
	SuggestedFilters      []string
	SuggestedAggregations []string
}

type aiStructuredHints struct {
	SuggestedFilters      []string `json:"suggested_filters"`
	SuggestedAggregations []string `json:"suggested_aggregations"`
}

func parseAIVisualizationHints(raw string) aiVisualizationHints {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return aiVisualizationHints{}
	}

	hints := aiVisualizationHints{}
	hints.SuggestedChart = extractChartBlock(raw)
	structured := extractStructuredHints(raw)

	if len(structured.SuggestedFilters) > 0 {
		hints.SuggestedFilters = normalizeHintStrings(structured.SuggestedFilters)
	}
	if len(structured.SuggestedAggregations) > 0 {
		hints.SuggestedAggregations = normalizeHintStrings(structured.SuggestedAggregations)
	}

	return hints
}

func extractChartBlock(raw string) json.RawMessage {
	match := chartBlockPattern.FindStringSubmatch(raw)
	if len(match) >= 2 {
		payload := strings.TrimSpace(match[1])
		if payload != "" && json.Valid([]byte(payload)) {
			return json.RawMessage(payload)
		}
	}

	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || !strings.Contains(line, `"chart_type"`) {
			continue
		}
		if !json.Valid([]byte(line)) {
			continue
		}

		var chart struct {
			ChartType string `json:"chart_type"`
		}
		if err := json.Unmarshal([]byte(line), &chart); err != nil {
			continue
		}

		switch strings.TrimSpace(chart.ChartType) {
		case "bar", "line", "pie", "area":
			return json.RawMessage(line)
		}
	}

	return nil
}

func extractStructuredHints(raw string) aiStructuredHints {
	candidates := []string{raw, normalizeHintJSONPrefix(raw)}
	if match := jsonBlockPattern.FindStringSubmatch(raw); len(match) > 1 {
		candidates = append([]string{strings.TrimSpace(match[1])}, candidates...)
	}
	if firstLine := firstHintJSONLine(raw); firstLine != "" {
		candidates = append(candidates, firstLine)
	}

	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}

		var hints aiStructuredHints
		if err := json.Unmarshal([]byte(candidate), &hints); err != nil {
			continue
		}

		if len(hints.SuggestedFilters) > 0 || len(hints.SuggestedAggregations) > 0 {
			return hints
		}
	}

	return aiStructuredHints{}
}

func normalizeHintJSONPrefix(raw string) string {
	raw = strings.TrimSpace(raw)
	lower := strings.ToLower(raw)
	for _, prefix := range []string{"chart ", "json "} {
		if strings.HasPrefix(lower, prefix) {
			return strings.TrimSpace(raw[len(prefix):])
		}
	}
	return raw
}

func firstHintJSONLine(raw string) string {
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		line = normalizeHintJSONPrefix(line)
		if json.Valid([]byte(line)) {
			return line
		}
	}
	return ""
}

func normalizeHintStrings(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}

	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		key := strings.ToLower(value)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, value)
	}

	if result == nil {
		return []string{}
	}
	return result
}

func applyVisualizationHints(metadata *entity.AIMetadata, hints aiVisualizationHints) {
	if metadata == nil {
		return
	}

	if len(hints.SuggestedChart) > 0 {
		metadata.SuggestedChart = hints.SuggestedChart
	}
	if len(hints.SuggestedFilters) > 0 {
		metadata.SuggestedFilters = hints.SuggestedFilters
	}
	if len(hints.SuggestedAggregations) > 0 {
		metadata.SuggestedAggregations = hints.SuggestedAggregations
	}
}