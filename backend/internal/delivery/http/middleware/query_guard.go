package middleware

import "github.com/nrmadi02/sql-ai/internal/usecase"

// ValidateQuerySQL delegates to usecase guard rules for dangerous SQL keywords.
func ValidateQuerySQL(sql string) error {
	return usecase.ValidateQuerySQL(sql)
}