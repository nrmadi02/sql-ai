package adapter

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/nrmadi02/sql-ai/internal/domain"
)

type MySQLAdapter struct{}

func (a *MySQLAdapter) GetDialect() string {
	return "mysql"
}

func (a *MySQLAdapter) Ping(ctx context.Context, cfg ConnectionConfig) error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?parseTime=true&timeout=10s",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DatabaseName,
	)

	if cfg.SSLMode == "require" || cfg.SSLMode == "verify-full" {
		dsn += "&tls=true"
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}
	defer db.Close()

	db.SetConnMaxLifetime(5 * time.Minute)
	maxOpenConns := cfg.MaxConnections
	if maxOpenConns <= 0 {
		maxOpenConns = 5
	}
	db.SetMaxOpenConns(maxOpenConns)

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		return fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	return nil
}