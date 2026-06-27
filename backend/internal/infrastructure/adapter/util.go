package adapter

import (
	"database/sql"
	"fmt"
	"strings"
	"unicode"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

func ValidateIdentifier(name string) error {
	if name == "" || len(name) > 128 {
		return domain.ErrInvalidInput
	}

	for _, r := range name {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '_' {
			return domain.ErrInvalidInput
		}
	}

	return nil
}

func FormatColumnType(dataType string, charMax sql.NullInt64, numPrecision, numScale sql.NullInt64) string {
	base := strings.ToLower(strings.TrimSpace(dataType))
	switch base {
	case "character varying", "varchar":
		if charMax.Valid {
			return fmt.Sprintf("varchar(%d)", charMax.Int64)
		}
		return "varchar"
	case "character", "char":
		if charMax.Valid {
			return fmt.Sprintf("char(%d)", charMax.Int64)
		}
		return "char"
	case "numeric", "decimal":
		if numPrecision.Valid && numScale.Valid {
			return fmt.Sprintf("decimal(%d,%d)", numPrecision.Int64, numScale.Int64)
		}
		return "decimal"
	default:
		return base
	}
}

func NullableFromString(value string) bool {
	return strings.EqualFold(value, "YES")
}

func NormalizeValue(value any) any {
	switch v := value.(type) {
	case nil:
		return nil
	case []byte:
		return string(v)
	default:
		return v
	}
}

func BuildQueryResultWithLimit(rows *sql.Rows, maxRows int) (*QueryResult, error) {
	result, err := scanSQLRows(rows, maxRows)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func BuildQueryResult(rows *sql.Rows) (*QueryResult, error) {
	return scanSQLRows(rows, 0)
}

func scanSQLRows(rows *sql.Rows, maxRows int) (*QueryResult, error) {
	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}

	columns := make([]QueryColumn, len(columnTypes))
	for i, ct := range columnTypes {
		columns[i] = QueryColumn{
			Name: ct.Name(),
			Type: ct.DatabaseTypeName(),
		}
	}

	result := &QueryResult{Columns: columns}
	for rows.Next() {
		values := make([]any, len(columnTypes))
		scanTargets := make([]any, len(columnTypes))
		for i := range values {
			scanTargets[i] = &values[i]
		}

		if err := rows.Scan(scanTargets...); err != nil {
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

	result.RowCount = len(result.Rows)
	return result, nil
}