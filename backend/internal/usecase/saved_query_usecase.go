package usecase

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
)

const savedQueryNameMaxLength = 255

type CreateSavedQueryInput struct {
	Name               string
	Description        string
	SQLContent         string
	DatasourceID       *uuid.UUID
	Tags               []string
	GeneratorMessageID *uuid.UUID
}

type UpdateSavedQueryInput struct {
	Name         string
	Description  string
	SQLContent   string
	DatasourceID *uuid.UUID
	Tags         []string
}

type SavedQueryUsecase struct {
	repo repository.SavedQueryRepository
}

func NewSavedQueryUsecase(repo repository.SavedQueryRepository) *SavedQueryUsecase {
	return &SavedQueryUsecase{repo: repo}
}

func (u *SavedQueryUsecase) Create(ctx context.Context, input CreateSavedQueryInput) (*entity.SavedQuery, error) {
	if err := validateSavedQueryInput(input.Name, input.SQLContent); err != nil {
		return nil, err
	}

	return u.repo.Create(ctx, &entity.SavedQuery{
		Name:               strings.TrimSpace(input.Name),
		Description:        strings.TrimSpace(input.Description),
		SQLContent:         strings.TrimSpace(input.SQLContent),
		DatasourceID:       input.DatasourceID,
		Tags:               normalizeTags(input.Tags),
		GeneratorMessageID: input.GeneratorMessageID,
	})
}

func (u *SavedQueryUsecase) GetByID(ctx context.Context, id uuid.UUID) (*entity.SavedQuery, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *SavedQueryUsecase) List(ctx context.Context, search, tag string) ([]*entity.SavedQuery, error) {
	return u.repo.List(ctx, repository.ListSavedQueriesFilter{
		Search: strings.TrimSpace(search),
		Tag:    strings.TrimSpace(tag),
	})
}

func (u *SavedQueryUsecase) Update(ctx context.Context, id uuid.UUID, input UpdateSavedQueryInput) (*entity.SavedQuery, error) {
	if err := validateSavedQueryInput(input.Name, input.SQLContent); err != nil {
		return nil, err
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Name = strings.TrimSpace(input.Name)
	existing.Description = strings.TrimSpace(input.Description)
	existing.SQLContent = strings.TrimSpace(input.SQLContent)
	existing.DatasourceID = input.DatasourceID
	existing.Tags = normalizeTags(input.Tags)

	return u.repo.Update(ctx, existing)
}

func (u *SavedQueryUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, id); err != nil {
		return err
	}
	return u.repo.Delete(ctx, id)
}

func validateSavedQueryInput(name, sql string) error {
	name = strings.TrimSpace(name)
	sql = strings.TrimSpace(sql)

	if name == "" || len([]rune(name)) > savedQueryNameMaxLength {
		return domain.ErrInvalidInput
	}
	if sql == "" {
		return domain.ErrInvalidInput
	}
	return nil
}

func normalizeTags(tags []string) []string {
	if len(tags) == 0 {
		return []string{}
	}

	result := make([]string, 0, len(tags))
	seen := make(map[string]struct{}, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		key := strings.ToLower(tag)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, tag)
	}

	if result == nil {
		return []string{}
	}
	return result
}