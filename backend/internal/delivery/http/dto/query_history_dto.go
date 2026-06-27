package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type QueryHistoryResponse struct {
	ID                    uuid.UUID  `json:"id"`
	DatasourceID          *uuid.UUID `json:"datasource_id"`
	SQLContent            string     `json:"sql_content"`
	NaturalLanguagePrompt string     `json:"natural_language_prompt,omitempty"`
	ExecutionTimeMs       *int       `json:"execution_time_ms,omitempty"`
	RowCount              *int       `json:"row_count,omitempty"`
	Status                string     `json:"status"`
	ErrorMessage          string     `json:"error_message,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
}

type QueryHistoryPageResponse struct {
	Items      []QueryHistoryResponse `json:"items"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"page_size"`
	TotalPages int                    `json:"total_pages"`
}

func ToQueryHistoryResponse(entry *entity.QueryHistory) QueryHistoryResponse {
	return QueryHistoryResponse{
		ID:                    entry.ID,
		DatasourceID:          entry.DatasourceID,
		SQLContent:            entry.SQLContent,
		NaturalLanguagePrompt: entry.NaturalLanguagePrompt,
		ExecutionTimeMs:       entry.ExecutionTimeMs,
		RowCount:              entry.RowCount,
		Status:                entry.Status,
		ErrorMessage:          entry.ErrorMessage,
		CreatedAt:             entry.CreatedAt,
	}
}

func ToQueryHistoryPageResponse(page *usecase.QueryHistoryPage) QueryHistoryPageResponse {
	items := make([]QueryHistoryResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, ToQueryHistoryResponse(item))
	}

	return QueryHistoryPageResponse{
		Items:      items,
		Total:      page.Total,
		Page:       page.Page,
		PageSize:   page.PageSize,
		TotalPages: page.TotalPages,
	}
}