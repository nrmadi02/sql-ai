package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type CreateDatasourceRequest struct {
	Name           string `json:"name"`
	DBType         string `json:"db_type"`
	Host           string `json:"host"`
	Port           int    `json:"port"`
	DatabaseName   string `json:"database_name"`
	Username       string `json:"username"`
	Password       string `json:"password"`
	SSLMode        string `json:"ssl_mode"`
	MaxConnections int    `json:"max_connections"`
}

type UpdateDatasourceRequest struct {
	Name           string `json:"name"`
	DBType         string `json:"db_type"`
	Host           string `json:"host"`
	Port           int    `json:"port"`
	DatabaseName   string `json:"database_name"`
	Username       string `json:"username"`
	Password       string `json:"password"`
	SSLMode        string `json:"ssl_mode"`
	MaxConnections int    `json:"max_connections"`
	IsActive       bool   `json:"is_active"`
}

type DatasourceResponse struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	DBType         string    `json:"db_type"`
	Host           string    `json:"host"`
	Port           int       `json:"port"`
	DatabaseName   string    `json:"database_name"`
	Username       string    `json:"username"`
	IsActive       bool      `json:"is_active"`
	TableCount     int       `json:"table_count"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at,omitempty"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func ToDatasourceResponse(ds *entity.Datasource) DatasourceResponse {
	return DatasourceResponse{
		ID:           ds.ID,
		Name:         ds.Name,
		DBType:       ds.DBType,
		Host:         ds.Host,
		Port:         ds.Port,
		DatabaseName: ds.DatabaseName,
		Username:     ds.Username,
		IsActive:     ds.IsActive,
		TableCount:   ds.TableCount(),
		CreatedAt:    ds.CreatedAt,
		UpdatedAt:    ds.UpdatedAt,
	}
}

func ToDatasourceResponses(items []*entity.Datasource) []DatasourceResponse {
	result := make([]DatasourceResponse, 0, len(items))
	for _, item := range items {
		result = append(result, ToDatasourceResponse(item))
	}
	return result
}