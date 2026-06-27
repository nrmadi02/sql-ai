package dto

import (
	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type ExecuteQueryRequest struct {
	SQL          string     `json:"sql"`
	DatasourceID uuid.UUID  `json:"datasource_id"`
	MaxRows      int        `json:"max_rows"`
	MessageID    *uuid.UUID `json:"message_id"`
}

type ExplainQueryRequest struct {
	SQL          string    `json:"sql"`
	DatasourceID uuid.UUID `json:"datasource_id"`
}

type QueryColumnResponse struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type QueryExecutionResponse struct {
	Columns         []QueryColumnResponse `json:"columns"`
	Rows            [][]any               `json:"rows"`
	RowCount        int                   `json:"row_count"`
	ExecutionTimeMs int                   `json:"execution_time_ms"`
	Truncated       bool                  `json:"truncated"`
}

func ToQueryExecutionResponse(result *usecase.QueryExecutionResult) QueryExecutionResponse {
	columns := make([]QueryColumnResponse, 0, len(result.Columns))
	for _, column := range result.Columns {
		columns = append(columns, QueryColumnResponse{
			Name: column.Name,
			Type: column.Type,
		})
	}

	rows := result.Rows
	if rows == nil {
		rows = [][]any{}
	}

	return QueryExecutionResponse{
		Columns:         columns,
		Rows:            rows,
		RowCount:        result.RowCount,
		ExecutionTimeMs: result.ExecutionTimeMs,
		Truncated:       result.Truncated,
	}
}