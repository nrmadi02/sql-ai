package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type CreateChartConfigRequest struct {
	SavedQueryID       *uuid.UUID      `json:"saved_query_id"`
	GeneratorMessageID *uuid.UUID      `json:"generator_message_id"`
	SqlEditorTabID     *uuid.UUID      `json:"sql_editor_tab_id"`
	ChartType          string          `json:"chart_type"`
	XAxisColumn        string          `json:"x_axis_column"`
	YAxisColumns       []string        `json:"y_axis_columns"`
	CategoryColumn     string          `json:"category_column"`
	Config             json.RawMessage `json:"config"`
}

type UpdateChartConfigRequest struct {
	ChartType      string          `json:"chart_type"`
	XAxisColumn    string          `json:"x_axis_column"`
	YAxisColumns   []string        `json:"y_axis_columns"`
	CategoryColumn string          `json:"category_column"`
	Config         json.RawMessage `json:"config"`
}

type ChartConfigResponse struct {
	ID                 uuid.UUID       `json:"id"`
	SavedQueryID       *uuid.UUID      `json:"saved_query_id,omitempty"`
	GeneratorMessageID *uuid.UUID      `json:"generator_message_id,omitempty"`
	SqlEditorTabID     *uuid.UUID      `json:"sql_editor_tab_id,omitempty"`
	ChartType          string          `json:"chart_type"`
	XAxisColumn        string          `json:"x_axis_column"`
	YAxisColumns       []string        `json:"y_axis_columns"`
	CategoryColumn     string          `json:"category_column,omitempty"`
	Config             json.RawMessage `json:"config"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

func ToChartConfigResponse(config *entity.ChartConfig) ChartConfigResponse {
	yAxisColumns := config.YAxisColumns
	if yAxisColumns == nil {
		yAxisColumns = []string{}
	}

	configJSON := config.Config
	if len(configJSON) == 0 {
		configJSON = json.RawMessage("{}")
	}

	return ChartConfigResponse{
		ID:                 config.ID,
		SavedQueryID:       config.SavedQueryID,
		GeneratorMessageID: config.GeneratorMessageID,
		SqlEditorTabID:     config.SqlEditorTabID,
		ChartType:          config.ChartType,
		XAxisColumn:        config.XAxisColumn,
		YAxisColumns:       yAxisColumns,
		CategoryColumn:     config.CategoryColumn,
		Config:             configJSON,
		CreatedAt:          config.CreatedAt,
		UpdatedAt:          config.UpdatedAt,
	}
}

func ToChartConfigResponses(items []*entity.ChartConfig) []ChartConfigResponse {
	result := make([]ChartConfigResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToChartConfigResponse(item))
	}
	return result
}