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

type DatabaseAdapter interface {
	GetDialect() string
	Ping(ctx context.Context, cfg ConnectionConfig) error
}