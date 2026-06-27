package ai

import (
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

const testTimeout = 15 * time.Second

// versionedAPIBase matches base URLs that already include an API version segment,
// e.g. Z.ai (https://api.z.ai/api/paas/v4).
var versionedAPIBase = regexp.MustCompile(`/v\d+$`)

type TestInput struct {
	APIFormat string
	BaseURL   string
	APIKey    string
	Model     string
}

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: testTimeout},
	}
}

func (c *Client) TestConnection(ctx context.Context, input TestInput) error {
	switch strings.TrimSpace(input.APIFormat) {
	case entity.APIFormatOpenAI:
		return c.testOpenAI(ctx, input)
	case entity.APIFormatAnthropic:
		return c.testAnthropic(ctx, input)
	default:
		return domain.ErrUnsupportedAPIFmt
	}
}

func (c *Client) testOpenAI(ctx context.Context, input TestInput) error {
	endpoint, err := joinURL(input.BaseURL, openAIChatCompletionsPath(input.BaseURL))
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	payload := map[string]any{
		"model": input.Model,
		"messages": []map[string]string{
			{"role": "user", "content": "ping"},
		},
		"max_tokens": 5,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(input.APIKey) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(input.APIKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	message, _ := readErrorMessage(resp.Body)
	if message == "" {
		message = resp.Status
	}
	return fmt.Errorf("%w: %s", domain.ErrAIConnectionFailed, message)
}

func (c *Client) testAnthropic(ctx context.Context, input TestInput) error {
	endpoint, err := joinURL(input.BaseURL, "/v1/messages")
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	payload := map[string]any{
		"model":      input.Model,
		"max_tokens": 5,
		"messages": []map[string]string{
			{"role": "user", "content": "ping"},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("anthropic-version", "2023-06-01")
	if strings.TrimSpace(input.APIKey) != "" {
		req.Header.Set("x-api-key", strings.TrimSpace(input.APIKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrAIConnectionFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	message, _ := readErrorMessage(resp.Body)
	if message == "" {
		message = resp.Status
	}
	return fmt.Errorf("%w: %s", domain.ErrAIConnectionFailed, message)
}

func openAIChatCompletionsPath(baseURL string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if versionedAPIBase.MatchString(trimmed) {
		return "/chat/completions"
	}
	return "/v1/chat/completions"
}

func joinURL(baseURL, path string) (string, error) {
	trimmed := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if trimmed == "" {
		return "", fmt.Errorf("base url is required")
	}
	return trimmed + path, nil
}

func readErrorMessage(body io.Reader) (string, error) {
	raw, err := io.ReadAll(io.LimitReader(body, 4096))
	if err != nil {
		return "", err
	}

	var payload struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return strings.TrimSpace(string(raw)), nil
	}

	if payload.Error.Message != "" {
		return payload.Error.Message, nil
	}
	if payload.Message != "" {
		return payload.Message, nil
	}

	return strings.TrimSpace(string(raw)), nil
}