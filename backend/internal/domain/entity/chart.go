package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	ChartTypeBar  = "bar"
	ChartTypeLine = "line"
	ChartTypePie  = "pie"
	ChartTypeArea = "area"
)

type ChartConfig struct {
	ID                 uuid.UUID
	SavedQueryID       *uuid.UUID
	GeneratorMessageID *uuid.UUID
	SqlEditorTabID     *uuid.UUID
	ChartType          string
	XAxisColumn        string
	YAxisColumns       []string
	CategoryColumn     string
	Config             json.RawMessage
	CreatedAt          time.Time
	UpdatedAt          time.Time
}