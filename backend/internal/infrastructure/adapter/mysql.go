package adapter

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type MySQLAdapter struct{}

func (a *MySQLAdapter) GetDialect() string {
	return "mysql"
}

func (a *MySQLAdapter) Ping(ctx context.Context, cfg ConnectionConfig) error {
	conn, err := a.Connect(ctx, cfg)
	if err != nil {
		return err
	}
	conn.Close()
	return nil
}

func (a *MySQLAdapter) Connect(ctx context.Context, cfg ConnectionConfig) (Connection, error) {
	db, err := newMySQLDB(ctx, cfg)
	if err != nil {
		return nil, err
	}
	return &mysqlConnection{db: db}, nil
}

type mysqlConnection struct {
	db *sql.DB
}

func (c *mysqlConnection) Close() {
	_ = c.db.Close()
}

func (c *mysqlConnection) GetDialect() string {
	return "mysql"
}

func (c *mysqlConnection) ReadSchema(ctx context.Context) (*entity.SchemaCache, error) {
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

func (c *mysqlConnection) GetTables(ctx context.Context) ([]entity.TableSummary, error) {
	const query = `
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count,
    COALESCE(t.table_rows, 0) AS estimated_rows
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_schema = t.table_schema
    AND c.table_name = t.table_name
WHERE t.table_schema = DATABASE()
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, t.table_rows
ORDER BY t.table_name`

	rows, err := c.db.QueryContext(ctx, query)
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

func (c *mysqlConnection) GetTableDetail(ctx context.Context, tableName string) (*entity.TableDetail, error) {
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

func (c *mysqlConnection) getColumns(ctx context.Context, tableName string) ([]entity.Column, error) {
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
        THEN CONCAT(fk.referenced_table_name, '.', fk.referenced_column_name)
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
        AND tc.table_schema = DATABASE()
        AND tc.table_name = ?
) pk ON pk.column_name = c.column_name
LEFT JOIN (
    SELECT
        kcu.column_name,
        kcu.referenced_table_name,
        kcu.referenced_column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.table_schema = DATABASE()
        AND kcu.table_name = ?
) fk ON fk.column_name = c.column_name
WHERE c.table_schema = DATABASE()
    AND c.table_name = ?
ORDER BY c.ordinal_position`

	rows, err := c.db.QueryContext(ctx, query, tableName, tableName, tableName)
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

func (c *mysqlConnection) getRelations(ctx context.Context, tableName string) ([]entity.Relation, error) {
	const query = `
SELECT
    kcu.column_name,
    kcu.referenced_table_name,
    kcu.referenced_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.table_schema = DATABASE()
    AND kcu.table_name = ?
ORDER BY kcu.ordinal_position`

	rows, err := c.db.QueryContext(ctx, query, tableName)
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

func (c *mysqlConnection) PreviewTable(ctx context.Context, tableName string, limit int) (*QueryResult, error) {
	if err := ValidateIdentifier(tableName); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 50
	}

	query := fmt.Sprintf("SELECT * FROM `%s` LIMIT %d", tableName, limit)
	return c.queryResult(ctx, query, 0)
}

func (c *mysqlConnection) ExecuteQuery(ctx context.Context, sql string, maxRows int) (*QueryResult, error) {
	if maxRows <= 0 {
		maxRows = 1000
	}
	return c.queryResult(ctx, sql, maxRows+1)
}

func (c *mysqlConnection) ExplainQuery(ctx context.Context, sql string) (*QueryResult, error) {
	return c.queryResult(ctx, "EXPLAIN ANALYZE "+sql, 0)
}

func (c *mysqlConnection) queryResult(ctx context.Context, query string, maxRows int) (*QueryResult, error) {
	tx, err := c.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result, err := BuildQueryResultWithLimit(rows, maxRows)
	if err != nil {
		return nil, err
	}

	if maxRows > 0 && result.Truncated {
		result.RowCount = maxRows - 1
	} else {
		result.RowCount = len(result.Rows)
	}

	return result, nil
}

func newMySQLDB(ctx context.Context, cfg ConnectionConfig) (*sql.DB, error) {
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
		return nil, fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	db.SetConnMaxLifetime(5 * time.Minute)
	maxOpenConns := cfg.MaxConnections
	if maxOpenConns <= 0 {
		maxOpenConns = 5
	}
	db.SetMaxOpenConns(maxOpenConns)

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("%w: %v", domain.ErrConnectionFailed, err)
	}

	return db, nil
}