package entity

import (
	"time"

	"github.com/google/uuid"
)

const (
	QueryHistoryStatusSuccess = "success"
	QueryHistoryStatusFailed  = "failed"

	QueryHistorySourceGenerator = "generator"
	QueryHistorySourceEditor    = "editor"
)

type SavedQuery struct {
	ID                 uuid.UUID
	Name               string
	Description        string
	SQLContent         string
	DatasourceID       *uuid.UUID
	Tags               []string
	GeneratorMessageID *uuid.UUID
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type QueryHistory struct {
	ID                    uuid.UUID
	DatasourceID          *uuid.UUID
	SQLContent            string
	NaturalLanguagePrompt string
	Source                string
	ExecutionTimeMs       *int
	RowCount              *int
	Status                string
	ErrorMessage          string
	CreatedAt             time.Time
}