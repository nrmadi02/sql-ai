package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	SqlEditorDefaultSessionName = "New Session"
	SqlEditorDefaultTabName     = "Query 1"

	SqlEditorTabStatusSuccess = "success"
	SqlEditorTabStatusFailed  = "failed"
)

type SqlEditorSession struct {
	ID           uuid.UUID
	Name         string
	DatasourceID *uuid.UUID
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type SqlEditorTab struct {
	ID              uuid.UUID
	SessionID       uuid.UUID
	Name            string
	SQLContent      string
	SortOrder       int
	LastResult      json.RawMessage
	ExecutionTimeMs *int
	RowCount        *int
	LastStatus      string
	ErrorMessage    string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}