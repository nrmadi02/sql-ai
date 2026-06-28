package usecase

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
)

var validChartTypes = map[string]struct{}{
	entity.ChartTypeBar:  {},
	entity.ChartTypeLine: {},
	entity.ChartTypePie:  {},
	entity.ChartTypeArea: {},
}

type CreateChartConfigInput struct {
	SavedQueryID       *uuid.UUID
	GeneratorMessageID *uuid.UUID
	SqlEditorTabID     *uuid.UUID
	ChartType          string
	XAxisColumn        string
	YAxisColumns       []string
	CategoryColumn     string
	Config             json.RawMessage
}

type UpdateChartConfigInput struct {
	ChartType      string
	XAxisColumn    string
	YAxisColumns   []string
	CategoryColumn string
	Config         json.RawMessage
}

type ChartUsecase struct {
	repo repository.ChartConfigRepository
}

func NewChartUsecase(repo repository.ChartConfigRepository) *ChartUsecase {
	return &ChartUsecase{repo: repo}
}

func (u *ChartUsecase) Create(ctx context.Context, input CreateChartConfigInput) (*entity.ChartConfig, error) {
	if err := validateChartReference(input.SavedQueryID, input.GeneratorMessageID, input.SqlEditorTabID); err != nil {
		return nil, err
	}
	if err := validateChartConfigFields(input.ChartType, input.XAxisColumn, input.YAxisColumns, input.Config); err != nil {
		return nil, err
	}

	return u.repo.Create(ctx, &entity.ChartConfig{
		SavedQueryID:       input.SavedQueryID,
		GeneratorMessageID: input.GeneratorMessageID,
		SqlEditorTabID:     input.SqlEditorTabID,
		ChartType:          strings.ToLower(strings.TrimSpace(input.ChartType)),
		XAxisColumn:        strings.TrimSpace(input.XAxisColumn),
		YAxisColumns:       normalizeYAxisColumns(input.YAxisColumns),
		CategoryColumn:     strings.TrimSpace(input.CategoryColumn),
		Config:             normalizeChartConfig(input.Config),
	})
}

func (u *ChartUsecase) GetByID(ctx context.Context, id uuid.UUID) (*entity.ChartConfig, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *ChartUsecase) List(ctx context.Context, filter repository.ListChartConfigsFilter) ([]*entity.ChartConfig, error) {
	return u.repo.List(ctx, filter)
}

func (u *ChartUsecase) Update(ctx context.Context, id uuid.UUID, input UpdateChartConfigInput) (*entity.ChartConfig, error) {
	if err := validateChartConfigFields(input.ChartType, input.XAxisColumn, input.YAxisColumns, input.Config); err != nil {
		return nil, err
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.ChartType = strings.ToLower(strings.TrimSpace(input.ChartType))
	existing.XAxisColumn = strings.TrimSpace(input.XAxisColumn)
	existing.YAxisColumns = normalizeYAxisColumns(input.YAxisColumns)
	existing.CategoryColumn = strings.TrimSpace(input.CategoryColumn)
	existing.Config = normalizeChartConfig(input.Config)

	return u.repo.Update(ctx, existing)
}

func (u *ChartUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, id); err != nil {
		return err
	}
	return u.repo.Delete(ctx, id)
}

func validateChartReference(savedQueryID, generatorMessageID, sqlEditorTabID *uuid.UUID) error {
	if savedQueryID == nil && generatorMessageID == nil && sqlEditorTabID == nil {
		return domain.ErrInvalidInput
	}
	return nil
}

func validateChartConfigFields(chartType, xAxisColumn string, yAxisColumns []string, config json.RawMessage) error {
	chartType = strings.ToLower(strings.TrimSpace(chartType))
	if _, ok := validChartTypes[chartType]; !ok {
		return domain.ErrInvalidInput
	}

	if strings.TrimSpace(xAxisColumn) == "" {
		return domain.ErrInvalidInput
	}

	normalized := normalizeYAxisColumns(yAxisColumns)
	if len(normalized) == 0 {
		return domain.ErrInvalidInput
	}

	if len(config) > 0 && !json.Valid(config) {
		return domain.ErrInvalidInput
	}

	return nil
}

func normalizeYAxisColumns(columns []string) []string {
	if len(columns) == 0 {
		return []string{}
	}

	result := make([]string, 0, len(columns))
	seen := make(map[string]struct{}, len(columns))
	for _, column := range columns {
		column = strings.TrimSpace(column)
		if column == "" {
			continue
		}
		key := strings.ToLower(column)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, column)
	}

	if result == nil {
		return []string{}
	}
	return result
}

func normalizeChartConfig(config json.RawMessage) json.RawMessage {
	if len(config) == 0 {
		return json.RawMessage("{}")
	}
	return config
}