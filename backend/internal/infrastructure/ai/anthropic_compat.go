package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

const (
	anthropicGenerateTimeout = 120 * time.Second
	anthropicMaxTokens       = 4096
	anthropicAPIVersion      = "2023-06-01"
)

type AnthropicCompat struct {
	httpClient *http.Client
}

func NewAnthropicCompat() *AnthropicCompat {
	return &AnthropicCompat{
		httpClient: &http.Client{Timeout: anthropicGenerateTimeout},
	}
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicMessagesRequest struct {
	Model       string             `json:"model"`
	MaxTokens   int                `json:"max_tokens"`
	System      string             `json:"system"`
	Messages    []anthropicMessage `json:"messages"`
	Temperature float64            `json:"temperature"`
}

type anthropicStreamRequest struct {
	Model       string             `json:"model"`
	MaxTokens   int                `json:"max_tokens"`
	System      string             `json:"system"`
	Messages    []anthropicMessage `json:"messages"`
	Temperature float64            `json:"temperature"`
	Stream      bool               `json:"stream"`
}

type anthropicMessagesResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

func (c *AnthropicCompat) GenerateSQL(ctx context.Context, input GenerateSQLInput) (*GenerateSQLResponse, error) {
	return c.GenerateSQLStream(ctx, input, nil)
}

func (c *AnthropicCompat) GenerateSQLStream(ctx context.Context, input GenerateSQLInput, onDelta StreamDeltaCallback) (*GenerateSQLResponse, error) {
	if input.Provider == nil {
		return nil, domain.ErrInvalidInput
	}

	endpoint, err := joinURL(input.Provider.BaseURL, "/v1/messages")
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	messages, system := buildAnthropicMessages(input)
	payload := anthropicStreamRequest{
		Model:       input.Provider.Model,
		MaxTokens:   anthropicMaxTokens,
		System:      system,
		Messages:    messages,
		Temperature: 0,
		Stream:      true,
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
	req.Header.Set("anthropic-version", anthropicAPIVersion)
	if strings.TrimSpace(input.Provider.APIKey) != "" {
		req.Header.Set("x-api-key", strings.TrimSpace(input.Provider.APIKey))
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

	assistantContent, usage, err := readAnthropicStream(resp.Body, onDelta)
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

func readAnthropicStream(body io.Reader, onDelta StreamDeltaCallback) (string, *TokenUsage, error) {
	var builder strings.Builder
	var usage TokenUsage

	err := forEachSSEDataLine(bufio.NewReader(body), func(data string) (bool, error) {
		var event struct {
			Type    string `json:"type"`
			Message struct {
				Usage struct {
					InputTokens int `json:"input_tokens"`
				} `json:"usage"`
			} `json:"message"`
			Delta struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"delta"`
			Usage struct {
				OutputTokens int `json:"output_tokens"`
			} `json:"usage"`
		}
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			return false, nil
		}

		switch event.Type {
		case "message_stop":
			return true, nil
		case "message_start":
			if event.Message.Usage.InputTokens > 0 {
				usage.PromptTokens = event.Message.Usage.InputTokens
			}
		case "message_delta":
			if event.Usage.OutputTokens > 0 {
				usage.CompletionTokens = event.Usage.OutputTokens
			}
		case "content_block_delta":
			if event.Delta.Type != "text_delta" {
				return false, nil
			}
			delta := event.Delta.Text
			if delta == "" {
				return false, nil
			}
			builder.WriteString(delta)
			if onDelta != nil {
				if err := onDelta(delta); err != nil {
					return true, err
				}
			}
		}

		return false, nil
	})
	if err != nil {
		return "", nil, fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	if usage.PromptTokens > 0 || usage.CompletionTokens > 0 {
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
		return builder.String(), &usage, nil
	}

	return builder.String(), nil, nil
}

func buildAnthropicMessages(input GenerateSQLInput) ([]anthropicMessage, string) {
	messages := make([]anthropicMessage, 0, len(input.ConversationHistory)+1)

	for _, message := range input.ConversationHistory {
		role := anthropicRole(message.Role)
		if role == "" {
			continue
		}
		messages = append(messages, anthropicMessage{
			Role:    role,
			Content: message.Content,
		})
	}

	messages = append(messages, anthropicMessage{
		Role:    "user",
		Content: input.UserMessage,
	})

	return messages, BuildSQLSystemPrompt(input)
}

func anthropicRole(role string) string {
	switch strings.TrimSpace(role) {
	case entity.MessageRoleUser:
		return "user"
	case entity.MessageRoleAssistant:
		return "assistant"
	default:
		return ""
	}
}

func extractAnthropicAssistantText(response anthropicMessagesResponse) string {
	parts := make([]string, 0, len(response.Content))
	for _, block := range response.Content {
		if block.Type != "text" {
			continue
		}
		text := strings.TrimSpace(block.Text)
		if text != "" {
			parts = append(parts, text)
		}
	}
	return strings.TrimSpace(strings.Join(parts, "\n"))
}