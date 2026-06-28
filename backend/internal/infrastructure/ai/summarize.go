package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

const summarizeMaxTokens = 512

func (c *OpenAICompat) SummarizeConversation(ctx context.Context, input SummarizeConversationInput) (string, error) {
	if input.Provider == nil {
		return "", fmt.Errorf("provider is required")
	}

	endpoint, err := joinURL(input.Provider.BaseURL, openAIChatCompletionsPath(input.Provider.BaseURL))
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	payload := openAIChatRequest{
		Model: input.Provider.Model,
		Messages: []openAIChatMessage{
			{Role: "user", Content: BuildConversationSummaryPrompt(input.ExistingSummary, input.Messages)},
		},
		MaxTokens:   summarizeMaxTokens,
		Temperature: 0,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(input.Provider.APIKey) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(input.Provider.APIKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := readErrorMessage(resp.Body)
		if message == "" {
			message = resp.Status
		}
		return "", fmt.Errorf("%w: %s", domain.ErrAIConnectionFailed, message)
	}

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	var response openAIChatResponse
	if err := json.Unmarshal(raw, &response); err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("%w: empty summary response", domain.ErrAIConnectionFailed)
	}

	summary := strings.TrimSpace(response.Choices[0].Message.Content)
	if summary == "" {
		return "", fmt.Errorf("%w: empty summary content", domain.ErrAIConnectionFailed)
	}

	return summary, nil
}

func (c *AnthropicCompat) SummarizeConversation(ctx context.Context, input SummarizeConversationInput) (string, error) {
	if input.Provider == nil {
		return "", fmt.Errorf("provider is required")
	}

	endpoint, err := joinURL(input.Provider.BaseURL, "/v1/messages")
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	payload := anthropicMessagesRequest{
		Model:     input.Provider.Model,
		MaxTokens: summarizeMaxTokens,
		Messages: []anthropicMessage{
			{Role: "user", Content: BuildConversationSummaryPrompt(input.ExistingSummary, input.Messages)},
		},
		Temperature: 0,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("anthropic-version", anthropicAPIVersion)
	if strings.TrimSpace(input.Provider.APIKey) != "" {
		req.Header.Set("x-api-key", strings.TrimSpace(input.Provider.APIKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := readErrorMessage(resp.Body)
		if message == "" {
			message = resp.Status
		}
		return "", fmt.Errorf("%w: %s", domain.ErrAIConnectionFailed, message)
	}

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	var response anthropicMessagesResponse
	if err := json.Unmarshal(raw, &response); err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	summary := strings.TrimSpace(extractAnthropicAssistantText(response))
	if summary == "" {
		return "", fmt.Errorf("%w: empty summary content", domain.ErrAIConnectionFailed)
	}

	return summary, nil
}