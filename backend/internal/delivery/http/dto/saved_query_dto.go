package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type CreateSavedQueryRequest struct {
	Name               string     `json:"name"`
	Description        string     `json:"description"`
	SQLContent         string     `json:"sql_content"`
	DatasourceID       *uuid.UUID `json:"datasource_id"`
	Tags               []string   `json:"tags"`
	GeneratorMessageID *uuid.UUID `json:"generator_message_id"`
}

type UpdateSavedQueryRequest struct {
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	SQLContent   string     `json:"sql_content"`
	DatasourceID *uuid.UUID `json:"datasource_id"`
	Tags         []string   `json:"tags"`
}

type SavedQueryResponse struct {
	ID                 uuid.UUID  `json:"id"`
	Name               string     `json:"name"`
	Description        string     `json:"description"`
	SQLContent         string     `json:"sql_content"`
	DatasourceID       *uuid.UUID `json:"datasource_id"`
	Tags               []string   `json:"tags"`
	GeneratorMessageID *uuid.UUID `json:"generator_message_id,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func ToSavedQueryResponse(query *entity.SavedQuery) SavedQueryResponse {
	tags := query.Tags
	if tags == nil {
		tags = []string{}
	}

	return SavedQueryResponse{
		ID:                 query.ID,
		Name:               query.Name,
		Description:        query.Description,
		SQLContent:         query.SQLContent,
		DatasourceID:       query.DatasourceID,
		Tags:               tags,
		GeneratorMessageID: query.GeneratorMessageID,
		CreatedAt:          query.CreatedAt,
		UpdatedAt:          query.UpdatedAt,
	}
}

func ToSavedQueryResponses(items []*entity.SavedQuery) []SavedQueryResponse {
	result := make([]SavedQueryResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToSavedQueryResponse(item))
	}
	return result
}