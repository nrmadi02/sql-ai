package adapter

import (
	"context"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type ConnectionConfig struct {
	DBType         string
	Host           string
	Port           int
	DatabaseName   string
	Username       string
	Password       string
	SSLMode        string
	MaxConnections int
}

func ConnectionConfigFromEntity(ds *entity.Datasource) ConnectionConfig {
	return ConnectionConfig{
		DBType:         ds.DBType,
		Host:           ds.Host,
		Port:           ds.Port,
		DatabaseName:   ds.DatabaseName,
		Username:       ds.Username,
		Password:       ds.Password,
		SSLMode:        ds.SSLMode,
		MaxConnections: ds.MaxConnections,
	}
}

type QueryColumn struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type QueryResult struct {
	Columns   []QueryColumn `json:"columns"`
	Rows      [][]any       `json:"rows"`
	RowCount  int           `json:"row_count"`
	Truncated bool          `json:"truncated"`
}

type Connection interface {
	Close()
	GetDialect() string
	ReadSchema(ctx context.Context) (*entity.SchemaCache, error)
	GetTables(ctx context.Context) ([]entity.TableSummary, error)
	GetTableDetail(ctx context.Context, tableName string) (*entity.TableDetail, error)
	PreviewTable(ctx context.Context, tableName string, limit int) (*QueryResult, error)
	ExecuteQuery(ctx context.Context, sql string, maxRows int) (*QueryResult, error)
	ExplainQuery(ctx context.Context, sql string) (*QueryResult, error)
}

type DatabaseAdapter interface {
	GetDialect() string
	Ping(ctx context.Context, cfg ConnectionConfig) error
	Connect(ctx context.Context, cfg ConnectionConfig) (Connection, error)
}