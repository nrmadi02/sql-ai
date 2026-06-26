package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	DatasourceTypePostgreSQL = "postgresql"
	DatasourceTypeMySQL      = "mysql"
)

type Datasource struct {
	ID              uuid.UUID
	Name            string
	DBType          string
	Host            string
	Port            int
	DatabaseName    string
	Username        string
	Password        string
	SSLMode         string
	MaxConnections  int
	IsActive        bool
	SchemaCache     json.RawMessage
	SchemaCachedAt  *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (d *Datasource) TableCount() int {
	if len(d.SchemaCache) == 0 {
		return 0
	}

	var schema struct {
		Tables []struct{} `json:"tables"`
	}
	if err := json.Unmarshal(d.SchemaCache, &schema); err != nil {
		return 0
	}

	return len(schema.Tables)
}