package usecase

import (
	"context"
	"encoding/json"
	"net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
)

type CreateAIProviderInput struct {
	Name      string
	APIFormat string
	BaseURL   string
	APIKey    string
	Model     string
	IsDefault bool
	Config    json.RawMessage
}

type UpdateAIProviderInput struct {
	Name      string
	APIFormat string
	BaseURL   string
	APIKey    string
	Model     string
	IsDefault bool
	Config    json.RawMessage
}

type TestAIProviderResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type AIProviderUsecase struct {
	repo   repository.AIProviderRepository
	client *ai.Client
}

func NewAIProviderUsecase(repo repository.AIProviderRepository, client *ai.Client) *AIProviderUsecase {
	return &AIProviderUsecase{
		repo:   repo,
		client: client,
	}
}

func (u *AIProviderUsecase) Create(ctx context.Context, input CreateAIProviderInput) (*entity.AIProvider, error) {
	if err := validateAIProviderInput(input.Name, input.APIFormat, input.BaseURL, input.Model); err != nil {
		return nil, err
	}

	if input.IsDefault {
		if err := u.repo.ClearDefault(ctx); err != nil {
			return nil, err
		}
	}

	provider := &entity.AIProvider{
		Name:      strings.TrimSpace(input.Name),
		APIFormat: strings.TrimSpace(input.APIFormat),
		BaseURL:   strings.TrimRight(strings.TrimSpace(input.BaseURL), "/"),
		APIKey:    input.APIKey,
		Model:     strings.TrimSpace(input.Model),
		IsDefault: input.IsDefault,
		Config:    input.Config,
	}

	return u.repo.Create(ctx, provider)
}

func (u *AIProviderUsecase) GetByID(ctx context.Context, id uuid.UUID) (*entity.AIProvider, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *AIProviderUsecase) List(ctx context.Context) ([]*entity.AIProvider, error) {
	return u.repo.List(ctx)
}

func (u *AIProviderUsecase) Update(ctx context.Context, id uuid.UUID, input UpdateAIProviderInput) (*entity.AIProvider, error) {
	if err := validateAIProviderInput(input.Name, input.APIFormat, input.BaseURL, input.Model); err != nil {
		return nil, err
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.IsDefault {
		if err := u.repo.ClearDefault(ctx); err != nil {
			return nil, err
		}
	}

	existing.Name = strings.TrimSpace(input.Name)
	existing.APIFormat = strings.TrimSpace(input.APIFormat)
	existing.BaseURL = strings.TrimRight(strings.TrimSpace(input.BaseURL), "/")
	if strings.TrimSpace(input.APIKey) != "" {
		existing.APIKey = input.APIKey
	}
	existing.Model = strings.TrimSpace(input.Model)
	existing.IsDefault = input.IsDefault
	existing.Config = input.Config

	return u.repo.Update(ctx, existing)
}

func (u *AIProviderUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, id); err != nil {
		return err
	}
	return u.repo.Delete(ctx, id)
}

func (u *AIProviderUsecase) TestConnection(ctx context.Context, id uuid.UUID) (*TestAIProviderResult, error) {
	provider, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return u.testProvider(ctx, provider)
}

func (u *AIProviderUsecase) TestConnectionWithInput(ctx context.Context, input CreateAIProviderInput) (*TestAIProviderResult, error) {
	if err := validateAIProviderInput(input.Name, input.APIFormat, input.BaseURL, input.Model); err != nil {
		return nil, err
	}

	provider := &entity.AIProvider{
		APIFormat: strings.TrimSpace(input.APIFormat),
		BaseURL:   strings.TrimRight(strings.TrimSpace(input.BaseURL), "/"),
		APIKey:    input.APIKey,
		Model:     strings.TrimSpace(input.Model),
	}

	return u.testProvider(ctx, provider)
}

func (u *AIProviderUsecase) testProvider(ctx context.Context, provider *entity.AIProvider) (*TestAIProviderResult, error) {
	err := u.client.TestConnection(ctx, ai.TestInput{
		APIFormat: provider.APIFormat,
		BaseURL:   provider.BaseURL,
		APIKey:    provider.APIKey,
		Model:     provider.Model,
	})
	if err != nil {
		return &TestAIProviderResult{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return &TestAIProviderResult{
		Success: true,
		Message: "connected to " + provider.BaseURL,
	}, nil
}

func validateAIProviderInput(name, apiFormat, baseURL, model string) error {
	if strings.TrimSpace(name) == "" ||
		strings.TrimSpace(baseURL) == "" ||
		strings.TrimSpace(model) == "" {
		return domain.ErrInvalidInput
	}

	parsed, err := url.Parse(strings.TrimSpace(baseURL))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return domain.ErrInvalidInput
	}

	switch strings.TrimSpace(apiFormat) {
	case entity.APIFormatOpenAI, entity.APIFormatAnthropic:
		return nil
	default:
		return domain.ErrUnsupportedAPIFmt
	}
}