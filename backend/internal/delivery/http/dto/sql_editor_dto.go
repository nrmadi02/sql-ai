package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type CreateSqlEditorSessionRequest struct {
	Name         string     `json:"name"`
	DatasourceID *uuid.UUID `json:"datasource_id"`
}

type UpdateSqlEditorSessionRequest struct {
	Name         string     `json:"name"`
	DatasourceID *uuid.UUID `json:"datasource_id"`
}

type CreateSqlEditorTabRequest struct {
	Name       string `json:"name"`
	SQLContent string `json:"sql_content"`
}

type UpdateSqlEditorTabRequest struct {
	Name       string `json:"name"`
	SQLContent string `json:"sql_content"`
	SortOrder  *int   `json:"sort_order"`
}

type RunSqlEditorTabRequest struct {
	MaxRows int    `json:"max_rows"`
	SQL     string `json:"sql"`
}

type SqlEditorSessionResponse struct {
	ID           uuid.UUID             `json:"id"`
	Name         string                `json:"name"`
	DatasourceID *uuid.UUID            `json:"datasource_id"`
	Tabs         []SqlEditorTabResponse `json:"tabs,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at,omitempty"`
}

type SqlEditorTabResponse struct {
	ID              uuid.UUID       `json:"id"`
	SessionID       uuid.UUID       `json:"session_id,omitempty"`
	Name            string          `json:"name"`
	SQLContent      string          `json:"sql_content"`
	SortOrder       int             `json:"sort_order"`
	LastResult      json.RawMessage `json:"last_result,omitempty"`
	ExecutionTimeMs *int            `json:"execution_time_ms,omitempty"`
	RowCount        *int            `json:"row_count,omitempty"`
	LastStatus      string          `json:"last_status,omitempty"`
	ErrorMessage    string          `json:"error_message,omitempty"`
	CreatedAt       time.Time       `json:"created_at,omitempty"`
	UpdatedAt       time.Time       `json:"updated_at,omitempty"`
}

type AutocompleteColumnResponse struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type AutocompleteTableResponse struct {
	Name    string                       `json:"name"`
	Columns []AutocompleteColumnResponse `json:"columns"`
}

type AutocompleteResponse struct {
	Dialect string                      `json:"dialect"`
	Tables  []AutocompleteTableResponse `json:"tables"`
}

func ToSqlEditorSessionResponse(session *entity.SqlEditorSession) SqlEditorSessionResponse {
	return SqlEditorSessionResponse{
		ID:           session.ID,
		Name:         session.Name,
		DatasourceID: session.DatasourceID,
		CreatedAt:    session.CreatedAt,
		UpdatedAt:    session.UpdatedAt,
	}
}

func ToSqlEditorSessionDetailResponse(detail *usecase.SqlEditorSessionDetail) SqlEditorSessionResponse {
	response := ToSqlEditorSessionResponse(detail.Session)
	response.Tabs = ToSqlEditorTabResponses(detail.Tabs)
	return response
}

func ToSqlEditorSessionResponses(sessions []*entity.SqlEditorSession) []SqlEditorSessionResponse {
	result := make([]SqlEditorSessionResponse, 0, len(sessions))
	for _, session := range sessions {
		result = append(result, ToSqlEditorSessionResponse(session))
	}
	return result
}

func ToSqlEditorTabResponse(tab *entity.SqlEditorTab) SqlEditorTabResponse {
	lastResult := tab.LastResult
	if len(lastResult) == 0 {
		lastResult = nil
	}

	return SqlEditorTabResponse{
		ID:              tab.ID,
		SessionID:       tab.SessionID,
		Name:            tab.Name,
		SQLContent:      tab.SQLContent,
		SortOrder:       tab.SortOrder,
		LastResult:      lastResult,
		ExecutionTimeMs: tab.ExecutionTimeMs,
		RowCount:        tab.RowCount,
		LastStatus:      tab.LastStatus,
		ErrorMessage:    tab.ErrorMessage,
		CreatedAt:       tab.CreatedAt,
		UpdatedAt:       tab.UpdatedAt,
	}
}

func ToSqlEditorTabResponses(tabs []*entity.SqlEditorTab) []SqlEditorTabResponse {
	result := make([]SqlEditorTabResponse, 0, len(tabs))
	for _, tab := range tabs {
		result = append(result, ToSqlEditorTabResponse(tab))
	}
	return result
}

func ToAutocompleteResponse(result *usecase.AutocompleteResult) AutocompleteResponse {
	tables := make([]AutocompleteTableResponse, 0, len(result.Tables))
	for _, table := range result.Tables {
		columns := make([]AutocompleteColumnResponse, 0, len(table.Columns))
		for _, column := range table.Columns {
			columns = append(columns, AutocompleteColumnResponse{
				Name: column.Name,
				Type: column.Type,
			})
		}

		tables = append(tables, AutocompleteTableResponse{
			Name:    table.Name,
			Columns: columns,
		})
	}

	return AutocompleteResponse{
		Dialect: result.Dialect,
		Tables:  tables,
	}
}