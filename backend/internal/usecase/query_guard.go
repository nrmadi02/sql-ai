package usecase

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

const defaultQueryRowLimit = 1000

var (
	forbiddenKeywords = []string{
		"DELETE", "UPDATE", "INSERT", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE",
	}
	keywordPattern = regexp.MustCompile(`\b[A-Z]+\b`)
	limitPattern   = regexp.MustCompile(`(?i)\bLIMIT\b`)
)

func ValidateQuerySQL(sql string) error {
	trimmed := strings.TrimSpace(sql)
	if trimmed == "" {
		return domain.ErrInvalidInput
	}

	if hasMultipleStatements(trimmed) {
		return domain.ErrMultipleStatements
	}

	cleaned := stripSQLComments(trimmed)
	upper := strings.ToUpper(cleaned)

	for _, keyword := range forbiddenKeywords {
		if containsKeyword(upper, keyword) {
			return domain.ErrQueryForbidden
		}
	}

	return nil
}

func InjectLimit(sql string, limit int) string {
	if limit <= 0 {
		limit = defaultQueryRowLimit
	}

	cleaned := strings.TrimSpace(sql)
	cleaned = strings.TrimSuffix(cleaned, ";")

	if limitPattern.MatchString(cleaned) {
		return cleaned
	}

	return fmt.Sprintf("%s LIMIT %d", cleaned, limit)
}

func hasMultipleStatements(sql string) bool {
	withoutTrailing := strings.TrimSuffix(strings.TrimSpace(sql), ";")
	return strings.Contains(withoutTrailing, ";")
}

func stripSQLComments(sql string) string {
	result := regexp.MustCompile(`(?s)/\*.*?\*/`).ReplaceAllString(sql, " ")
	lines := strings.Split(result, "\n")
	for i, line := range lines {
		if idx := strings.Index(line, "--"); idx >= 0 {
			lines[i] = line[:idx]
		}
	}
	return strings.Join(lines, "\n")
}

func containsKeyword(upperSQL, keyword string) bool {
	for _, token := range keywordPattern.FindAllString(upperSQL, -1) {
		if token == keyword {
			return true
		}
	}
	return false
}