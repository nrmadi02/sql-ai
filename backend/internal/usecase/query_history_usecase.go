package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
)

const (
	defaultHistoryPageSize = 20
	maxHistoryPageSize     = 100
)

type ListQueryHistoryInput struct {
	DatasourceID *uuid.UUID
	Status       string
	FromDate     *time.Time
	ToDate       *time.Time
	Page         int
	PageSize     int
}

type QueryHistoryPage struct {
	Items      []*entity.QueryHistory
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

type QueryHistoryUsecase struct {
	repo repository.QueryHistoryRepository
}

func NewQueryHistoryUsecase(repo repository.QueryHistoryRepository) *QueryHistoryUsecase {
	return &QueryHistoryUsecase{repo: repo}
}

func (u *QueryHistoryUsecase) GetByID(ctx context.Context, id uuid.UUID) (*entity.QueryHistory, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *QueryHistoryUsecase) List(ctx context.Context, input ListQueryHistoryInput) (*QueryHistoryPage, error) {
	page := input.Page
	if page < 1 {
		page = 1
	}

	pageSize := input.PageSize
	if pageSize <= 0 {
		pageSize = defaultHistoryPageSize
	}
	if pageSize > maxHistoryPageSize {
		pageSize = maxHistoryPageSize
	}

	filter := repository.ListQueryHistoryFilter{
		DatasourceID: input.DatasourceID,
		Status:       input.Status,
		FromDate:     input.FromDate,
		ToDate:       input.ToDate,
		Limit:        pageSize,
		Offset:       (page - 1) * pageSize,
	}

	items, err := u.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	total, err := u.repo.Count(ctx, filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	return &QueryHistoryPage{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (u *QueryHistoryUsecase) RecordExecution(
	ctx context.Context,
	datasourceID uuid.UUID,
	sql string,
	naturalLanguagePrompt string,
	executionTimeMs *int,
	rowCount *int,
	status string,
	errorMessage string,
) {
	entry := &entity.QueryHistory{
		DatasourceID:          &datasourceID,
		SQLContent:            sql,
		NaturalLanguagePrompt: naturalLanguagePrompt,
		ExecutionTimeMs:       executionTimeMs,
		RowCount:              rowCount,
		Status:                status,
		ErrorMessage:          errorMessage,
	}

	_, _ = u.repo.Create(ctx, entry)
}