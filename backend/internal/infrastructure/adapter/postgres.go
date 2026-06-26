package adapter

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nrmadi02/sql-ai/internal/domain"
)

type PostgresAdapter struct{}

func (a *PostgresAdapter) GetDialect() string {
	return "postgresql"
}

func (a *PostgresAdapter) Ping(ctx context.Context, cfg ConnectionConfig) error {
	connURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		url.QueryEscape(cfg.Username),
		url.QueryEscape(cfg.Password),
		cfg.Host,
		cfg.Port,
		cfg.DatabaseName,
		cfg.SSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(connURL)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	maxConns := int32(cfg.MaxConnections)
	if maxConns <= 0 {
		maxConns = 5
	}
	poolConfig.MaxConns = maxConns
	poolConfig.MinConns = 1
	poolConfig.MaxConnLifetime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	return nil
}