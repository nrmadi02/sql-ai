package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/usecase"
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

type ChartSuggestRequest struct {
	Columns  []QueryColumnResponse `json:"columns"`
	Rows     [][]any               `json:"rows"`
	RowCount int                   `json:"row_count"`
}

type ChartSuggestResponse struct {
	Chartable             bool     `json:"chartable"`
	LargeDataset          bool     `json:"large_dataset"`
	NumericColumns        []string `json:"numeric_columns"`
	LabelColumns          []string `json:"label_columns"`
	SuggestedFilters      []string `json:"suggested_filters"`
	SuggestedAggregations []string `json:"suggested_aggregations"`
}

func ToChartSuggestResponse(result *usecase.ChartSuggestResult) ChartSuggestResponse {
	numericColumns := result.NumericColumns
	if numericColumns == nil {
		numericColumns = []string{}
	}

	labelColumns := result.LabelColumns
	if labelColumns == nil {
		labelColumns = []string{}
	}

	suggestedFilters := result.SuggestedFilters
	if suggestedFilters == nil {
		suggestedFilters = []string{}
	}

	suggestedAggregations := result.SuggestedAggregations
	if suggestedAggregations == nil {
		suggestedAggregations = []string{}
	}

	return ChartSuggestResponse{
		Chartable:             result.Chartable,
		LargeDataset:          result.LargeDataset,
		NumericColumns:        numericColumns,
		LabelColumns:          labelColumns,
		SuggestedFilters:      suggestedFilters,
		SuggestedAggregations: suggestedAggregations,
	}
}

func ToChartConfigResponses(items []*entity.ChartConfig) []ChartConfigResponse {
	result := make([]ChartConfigResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToChartConfigResponse(item))
	}
	return result
}