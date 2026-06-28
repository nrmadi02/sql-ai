package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

const openAIGenerateTimeout = 120 * time.Second

const openAIMaxTokens = 4096

var (
	openAIJSONBlockPattern = regexp.MustCompile("(?is)```(?:json)?\\s*([\\s\\S]*?)```")
	openAISQLBlockPattern  = regexp.MustCompile("(?is)```(?:sql)?\\s*([\\s\\S]*?)```")
	chartBlockPattern = regexp.MustCompile("(?is)```chart\\s*([\\s\\S]*?)```")
)

type OpenAICompat struct {
	httpClient *http.Client
}

func NewOpenAICompat() *OpenAICompat {
	return &OpenAICompat{
		httpClient: &http.Client{Timeout: openAIGenerateTimeout},
	}
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatRequest struct {
	Model       string              `json:"model"`
	Messages    []openAIChatMessage `json:"messages"`
	MaxTokens   int                 `json:"max_tokens"`
	Temperature float64             `json:"temperature"`
}

type openAIStreamOptions struct {
	IncludeUsage bool `json:"include_usage"`
}

type openAIStreamRequest struct {
	Model         string              `json:"model"`
	Messages      []openAIChatMessage `json:"messages"`
	MaxTokens     int                 `json:"max_tokens"`
	Temperature   float64             `json:"temperature"`
	Stream        bool                `json:"stream"`
	StreamOptions openAIStreamOptions `json:"stream_options"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type openAIStructuredReply struct {
	Content      string `json:"content"`
	SQL          string `json:"sql"`
	GeneratedSQL string `json:"generated_sql"`
}

func (c *OpenAICompat) GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error) {
	return c.GenerateSQLStream(ctx, input, nil)
}

func (c *OpenAICompat) GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error) {
	if input.Provider == nil {
		return nil, domain.ErrInvalidInput
	}

	endpoint, err := joinURL(input.Provider.BaseURL, openAIChatCompletionsPath(input.Provider.BaseURL))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	payload := openAIStreamRequest{
		Model:       input.Provider.Model,
		Messages:    buildOpenAIMessages(input),
		MaxTokens:   openAIMaxTokens,
		Temperature: 0,
		Stream:      true,
		StreamOptions: openAIStreamOptions{
			IncludeUsage: true,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	if strings.TrimSpace(input.Provider.APIKey) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(input.Provider.APIKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		rawBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		message, _ := readErrorMessage(bytes.NewReader(rawBody))
		if message == "" {
			message = resp.Status
		}
		return nil, fmt.Errorf("%w: %s", domain.ErrAIConnectionFailed, message)
	}

	assistantContent, usage, err := readOpenAIStream(resp.Body, onDelta)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(assistantContent) == "" {
		return nil, fmt.Errorf("%w: empty completion", domain.ErrAIConnectionFailed)
	}

	parsed, err := parseOpenAIAssistantContent(assistantContent)
	if err != nil {
		return nil, err
	}
	parsed.Usage = usage
	return parsed, nil
}

func readOpenAIStream(body io.Reader, onDelta StreamDeltaCallback) (string, *TokenUsage, error) {
	var builder strings.Builder
	var usage *TokenUsage

	err := forEachSSEDataLine(bufio.NewReader(body), func(data string) (bool, error) {
		if data == "[DONE]" {
			return true, nil
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
			Usage struct {
				PromptTokens     int `json:"prompt_tokens"`
				CompletionTokens int `json:"completion_tokens"`
				TotalTokens      int `json:"total_tokens"`
			} `json:"usage"`
		}
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			return false, nil
		}

		if chunk.Usage.TotalTokens > 0 || chunk.Usage.PromptTokens > 0 || chunk.Usage.CompletionTokens > 0 {
			usage = &TokenUsage{
				PromptTokens:     chunk.Usage.PromptTokens,
				CompletionTokens: chunk.Usage.CompletionTokens,
				TotalTokens:      chunk.Usage.TotalTokens,
			}
		}

		if len(chunk.Choices) == 0 {
			return false, nil
		}

		delta := chunk.Choices[0].Delta.Content
		if delta == "" {
			return false, nil
		}

		builder.WriteString(delta)
		if onDelta != nil {
			if err := onDelta(delta); err != nil {
				return true, err
			}
		}

		return false, nil
	})
	if err != nil {
		return "", nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	return builder.String(), usage, nil
}

func buildOpenAIMessages(input GenerateSQLInput) []openAIChatMessage {
	messages := []openAIChatMessage{
		{Role: "system", Content: BuildSQLSystemPrompt(input)},
	}

	if summaryContent := FormatContextSummaryMessage(input.ContextSummary); summaryContent != "" {
		messages = append(messages, openAIChatMessage{
			Role:    "system",
			Content: summaryContent,
		})
	}

	for _, message := range input.ConversationHistory {
		role := openAIRole(message.Role)
		if role == "" {
			continue
		}
		messages = append(messages, openAIChatMessage{
			Role:    role,
			Content: message.Content,
		})
	}

	messages = append(messages, openAIChatMessage{
		Role:    "user",
		Content: input.UserMessage,
	})

	return messages
}

func openAIRole(role string) string {
	switch strings.TrimSpace(role) {
	case entity.MessageRoleUser:
		return "user"
	case entity.MessageRoleAssistant:
		return "assistant"
	case entity.MessageRoleSystem:
		return "system"
	default:
		return ""
	}
}

func parseOpenAIAssistantContent(raw string) (*GenerateSQLResponse, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, fmt.Errorf("%w: empty assistant content", domain.ErrAIConnectionFailed)
	}

	if structured, ok := parseOpenAIStructuredReply(raw); ok {
		sql := strings.TrimSpace(structured.SQL)
		if sql == "" {
			sql = strings.TrimSpace(structured.GeneratedSQL)
		}
		return &GenerateSQLResponse{
			Content:      strings.TrimSpace(structured.Content),
			GeneratedSQL: sql,
		}, nil
	}

	sql := extractOpenAISQLBlock(raw)
	content := strings.TrimSpace(stripAssistantArtifacts(raw))
	if content == "" {
		content = raw
	}

	return &GenerateSQLResponse{
		Content:      content,
		GeneratedSQL: sql,
	}, nil
}

func parseOpenAIStructuredReply(raw string) (openAIStructuredReply, bool) {
	for _, candidate := range assistantJSONCandidates(raw) {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}

		var reply openAIStructuredReply
		if err := json.Unmarshal([]byte(candidate), &reply); err != nil {
			continue
		}

		if strings.TrimSpace(reply.Content) != "" ||
			strings.TrimSpace(reply.SQL) != "" ||
			strings.TrimSpace(reply.GeneratedSQL) != "" {
			return reply, true
		}
	}

	return openAIStructuredReply{}, false
}

func assistantJSONCandidates(raw string) []string {
	raw = strings.TrimSpace(raw)
	seen := make(map[string]struct{})
	result := make([]string, 0, 4)

	add := func(value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		if _, ok := seen[value]; ok {
			return
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}

	add(raw)
	add(normalizeAssistantRaw(raw))

	if match := openAIJSONBlockPattern.FindStringSubmatch(raw); len(match) > 1 {
		add(match[1])
	}

	if firstLine := firstAssistantJSONLine(raw); firstLine != "" {
		add(firstLine)
	}

	return result
}

func normalizeAssistantRaw(raw string) string {
	raw = strings.TrimSpace(raw)
	lower := strings.ToLower(raw)
	for _, prefix := range []string{"chart ", "json "} {
		if strings.HasPrefix(lower, prefix) {
			return strings.TrimSpace(raw[len(prefix):])
		}
	}
	return raw
}

func firstAssistantJSONLine(raw string) string {
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		line = normalizeAssistantRaw(line)
		if json.Valid([]byte(line)) {
			return line
		}
	}
	return ""
}

func stripAssistantArtifacts(raw string) string {
	if structured, ok := parseOpenAIStructuredReply(raw); ok {
		if content := strings.TrimSpace(structured.Content); content != "" {
			return content
		}
	}

	cleaned := chartBlockPattern.ReplaceAllString(raw, "")
	cleaned = openAISQLBlockPattern.ReplaceAllString(cleaned, "")

	kept := make([]string, 0, strings.Count(cleaned, "\n")+1)
	for _, line := range strings.Split(cleaned, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		if isLooseChartConfigLine(trimmed) {
			continue
		}
		if isStructuredAssistantJSONLine(trimmed) {
			continue
		}
		kept = append(kept, trimmed)
	}

	if len(kept) == 0 {
		return strings.TrimSpace(cleaned)
	}
	return strings.Join(kept, "\n")
}

func isLooseChartConfigLine(line string) bool {
	line = normalizeAssistantRaw(line)
	if !strings.Contains(line, `"chart_type"`) || !json.Valid([]byte(line)) {
		return false
	}

	var probe struct {
		ChartType string `json:"chart_type"`
	}
	if err := json.Unmarshal([]byte(line), &probe); err != nil {
		return false
	}

	switch strings.TrimSpace(probe.ChartType) {
	case "bar", "line", "pie", "area":
		return true
	default:
		return false
	}
}

func isStructuredAssistantJSONLine(line string) bool {
	line = normalizeAssistantRaw(line)
	if !json.Valid([]byte(line)) {
		return false
	}

	var probe struct {
		Content string `json:"content"`
		SQL     string `json:"sql"`
	}
	if err := json.Unmarshal([]byte(line), &probe); err != nil {
		return false
	}

	return strings.TrimSpace(probe.Content) != "" || strings.TrimSpace(probe.SQL) != ""
}

func extractOpenAISQLBlock(raw string) string {
	match := openAISQLBlockPattern.FindStringSubmatch(raw)
	if len(match) < 2 {
		return ""
	}
	return strings.TrimSpace(match[1])
}