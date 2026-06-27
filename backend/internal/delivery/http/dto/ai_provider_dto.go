package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type CreateAIProviderRequest struct {
	Name      string          `json:"name"`
	APIFormat string          `json:"api_format"`
	BaseURL   string          `json:"base_url"`
	APIKey    string          `json:"api_key"`
	Model     string          `json:"model"`
	IsDefault bool            `json:"is_default"`
	Config    json.RawMessage `json:"config"`
}

type UpdateAIProviderRequest struct {
	Name      string          `json:"name"`
	APIFormat string          `json:"api_format"`
	BaseURL   string          `json:"base_url"`
	APIKey    string          `json:"api_key"`
	Model     string          `json:"model"`
	IsDefault bool            `json:"is_default"`
	Config    json.RawMessage `json:"config"`
}

type AIProviderResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	APIFormat string    `json:"api_format"`
	BaseURL   string    `json:"base_url"`
	Model     string    `json:"model"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

func ToAIProviderResponse(provider *entity.AIProvider) AIProviderResponse {
	return AIProviderResponse{
		ID:        provider.ID,
		Name:      provider.Name,
		APIFormat: provider.APIFormat,
		BaseURL:   provider.BaseURL,
		Model:     provider.Model,
		IsDefault: provider.IsDefault,
		CreatedAt: provider.CreatedAt,
		UpdatedAt: provider.UpdatedAt,
	}
}

func ToAIProviderResponses(items []*entity.AIProvider) []AIProviderResponse {
	result := make([]AIProviderResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToAIProviderResponse(item))
	}
	return result
}