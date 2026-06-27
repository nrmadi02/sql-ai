package adapter

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type PostgresAdapter struct{}

func (a *PostgresAdapter) GetDialect() string {
	return "postgresql"
}

func (a *PostgresAdapter) Ping(ctx context.Context, cfg ConnectionConfig) error {
	conn, err := a.Connect(ctx, cfg)
	if err != nil {
		return err
	}
	conn.Close()
	return nil
}

func (a *PostgresAdapter) Connect(ctx context.Context, cfg ConnectionConfig) (Connection, error) {
	pool, err := newPostgresPool(ctx, cfg)
	if err != nil {
		return nil, err
	}
	return &postgresConnection{pool: pool, schema: "public"}, nil
}

type postgresConnection struct {
	pool   *pgxpool.Pool
	schema string
}

func (c *postgresConnection) Close() {
	c.pool.Close()
}

func (c *postgresConnection) GetDialect() string {
	return "postgresql"
}

func (c *postgresConnection) ReadSchema(ctx context.Context) (*entity.SchemaCache, error) {
	summaries, err := c.GetTables(ctx)
	if err != nil {
		return nil, err
	}

	tables := make([]entity.CachedTable, 0, len(summaries))
	for _, summary := range summaries {
		detail, err := c.GetTableDetail(ctx, summary.Name)
		if err != nil {
			return nil, err
		}

		tables = append(tables, entity.CachedTable{
			Name:          summary.Name,
			ColumnCount:   summary.ColumnCount,
			EstimatedRows: summary.EstimatedRows,
			Columns:       detail.Columns,
			Relations:     detail.Relations,
		})
	}

	return &entity.SchemaCache{
		Dialect: c.GetDialect(),
		Tables:  tables,
	}, nil
}

func (c *postgresConnection) GetTables(ctx context.Context) ([]entity.TableSummary, error) {
	const query = `
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count,
    COALESCE(s.n_live_tup, 0) AS estimated_rows
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_schema = t.table_schema
    AND c.table_name = t.table_name
LEFT JOIN pg_stat_user_tables s
    ON s.schemaname = t.table_schema
    AND s.relname = t.table_name
WHERE t.table_schema = $1
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, s.n_live_tup
ORDER BY t.table_name`

	rows, err := c.pool.Query(ctx, query, c.schema)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}
	defer rows.Close()

	var tables []entity.TableSummary
	for rows.Next() {
		var (
			name        string
			columnCount int
			estimated   int64
		)
		if err := rows.Scan(&name, &columnCount, &estimated); err != nil {
			return nil, err
		}

		tables = append(tables, entity.TableSummary{
			Name:          name,
			ColumnCount:   columnCount,
			EstimatedRows: &estimated,
		})
	}

	return tables, rows.Err()
}

func (c *postgresConnection) GetTableDetail(ctx context.Context, tableName string) (*entity.TableDetail, error) {
	if err := ValidateIdentifier(tableName); err != nil {
		return nil, err
	}

	columns, err := c.getColumns(ctx, tableName)
	if err != nil {
		return nil, err
	}

	relations, err := c.getRelations(ctx, tableName)
	if err != nil {
		return nil, err
	}

	return &entity.TableDetail{
		Name:      tableName,
		Columns:   columns,
		Relations: relations,
	}, nil
}

func (c *postgresConnection) getColumns(ctx context.Context, tableName string) ([]entity.Column, error) {
	const query = `
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
    CASE
        WHEN fk.referenced_table_name IS NOT NULL
        THEN fk.referenced_table_name || '.' || fk.referenced_column_name
        ELSE ''
    END AS foreign_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
) pk ON pk.column_name = c.column_name
LEFT JOIN (
    SELECT
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
) fk ON fk.column_name = c.column_name
WHERE c.table_schema = $1
    AND c.table_name = $2
ORDER BY c.ordinal_position`

	rows, err := c.pool.Query(ctx, query, c.schema, tableName)
	if err != nil {
		return nil, fmt.Errorf("list columns: %w", err)
	}
	defer rows.Close()

	var columns []entity.Column
	for rows.Next() {
		var (
			name       string
			dataType   string
			nullable   string
			charMax    sql.NullInt64
			numPrec    sql.NullInt64
			numScale   sql.NullInt64
			primaryKey bool
			foreignKey string
		)
		if err := rows.Scan(&name, &dataType, &nullable, &charMax, &numPrec, &numScale, &primaryKey, &foreignKey); err != nil {
			return nil, err
		}

		column := entity.Column{
			Name:       name,
			Type:       FormatColumnType(dataType, charMax, numPrec, numScale),
			Nullable:   NullableFromString(nullable),
			PrimaryKey: primaryKey,
		}
		if foreignKey != "" {
			column.ForeignKey = foreignKey
		}
		columns = append(columns, column)
	}

	if len(columns) == 0 {
		return nil, domain.ErrTableNotFound
	}

	return columns, rows.Err()
}

func (c *postgresConnection) getRelations(ctx context.Context, tableName string) ([]entity.Relation, error) {
	const query = `
SELECT
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = $1
    AND tc.table_name = $2
ORDER BY kcu.ordinal_position`

	rows, err := c.pool.Query(ctx, query, c.schema, tableName)
	if err != nil {
		return nil, fmt.Errorf("list relations: %w", err)
	}
	defer rows.Close()

	var relations []entity.Relation
	for rows.Next() {
		var column, refTable, refColumn string
		if err := rows.Scan(&column, &refTable, &refColumn); err != nil {
			return nil, err
		}
		relations = append(relations, entity.Relation{
			Column:           column,
			ReferencedTable:  refTable,
			ReferencedColumn: refColumn,
			Type:             "many-to-one",
		})
	}

	return relations, rows.Err()
}

func (c *postgresConnection) PreviewTable(ctx context.Context, tableName string, limit int) (*QueryResult, error) {
	if err := ValidateIdentifier(tableName); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 50
	}

	query := fmt.Sprintf(`SELECT * FROM %q LIMIT %d`, tableName, limit)
	return c.queryResult(ctx, query, 0)
}

func (c *postgresConnection) ExecuteQuery(ctx context.Context, sql string, maxRows int) (*QueryResult, error) {
	if maxRows <= 0 {
		maxRows = 1000
	}
	return c.queryResult(ctx, sql, maxRows+1)
}

func (c *postgresConnection) ExplainQuery(ctx context.Context, sql string) (*QueryResult, error) {
	return c.queryResult(ctx, "EXPLAIN (ANALYZE, FORMAT TEXT) "+sql, 0)
}

func (c *postgresConnection) queryResult(ctx context.Context, query string, maxRows int) (*QueryResult, error) {
	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fieldDescriptions := rows.FieldDescriptions()
	columns := make([]QueryColumn, len(fieldDescriptions))
	for i, fd := range fieldDescriptions {
		columns[i] = QueryColumn{Name: string(fd.Name)}
	}

	result := &QueryResult{Columns: columns}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, err
		}

		row := make([]any, len(values))
		for i, value := range values {
			row[i] = NormalizeValue(value)
		}

		if maxRows > 0 && len(result.Rows) >= maxRows {
			result.Truncated = true
			break
		}

		result.Rows = append(result.Rows, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if maxRows > 0 && result.Truncated {
		result.RowCount = maxRows - 1
	} else {
		result.RowCount = len(result.Rows)
	}

	return result, nil
}

func newPostgresPool(ctx context.Context, cfg ConnectionConfig) (*pgxpool.Pool, error) {
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
		return nil, fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
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
		return nil, fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	return pool, nil
}