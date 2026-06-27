package usecase

import (
	"strings"
	"unicode"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

const (
	maxDetailedTablesInPrompt = 8
	smallSchemaTableThreshold = 15
	minTableInferenceRunes    = 3
)

func listTableNames(cache *entity.SchemaCache) []string {
	if cache == nil {
		return nil
	}

	names := make([]string, 0, len(cache.Tables))
	for _, table := range cache.Tables {
		names = append(names, table.Name)
	}
	return names
}

func collectReferencedTablesFromHistory(messages []*entity.GeneratorMessage) []string {
	result := make([]string, 0)
	for _, message := range messages {
		if message.Role != entity.MessageRoleUser {
			continue
		}
		result = append(result, message.ReferencedTables...)
	}
	return result
}

func inferTablesFromMessage(content string, available []string) []string {
	if len(available) == 0 {
		return nil
	}

	words := tokenizeMessage(content)
	if len(words) == 0 {
		return nil
	}

	matched := make([]string, 0)
	for _, tableName := range available {
		if tableMatchesMessage(tableName, words) {
			matched = append(matched, tableName)
		}
	}
	return matched
}

func resolveContextTables(
	cache *entity.SchemaCache,
	content string,
	explicit []string,
	previousMessages []*entity.GeneratorMessage,
) []string {
	if cache == nil {
		return dedupeTableNames(explicit)
	}

	available := listTableNames(cache)
	explicit = dedupeTableNames(explicit)
	inferred := inferTablesFromMessage(content, available)
	historical := dedupeTableNames(collectReferencedTablesFromHistory(previousMessages))

	contextTables := mergeTableNamesWithLimit(
		maxDetailedTablesInPrompt,
		explicit,
		inferred,
		historical,
	)

	if len(contextTables) == 0 && len(cache.Tables) <= smallSchemaTableThreshold {
		return available
	}

	return contextTables
}

func mergeTableNamesWithLimit(limit int, groups ...[]string) []string {
	if limit <= 0 {
		return nil
	}

	seen := make(map[string]struct{})
	result := make([]string, 0, limit)

	for _, group := range groups {
		for _, name := range group {
			key := strings.ToLower(strings.TrimSpace(name))
			if key == "" {
				continue
			}
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			result = append(result, name)
			if len(result) >= limit {
				return result
			}
		}
	}

	return result
}

func dedupeTableNames(names []string) []string {
	return mergeTableNamesWithLimit(len(names)+1, names)
}

func tableMatchesMessage(tableName string, words []string) bool {
	candidates := tableNameCandidates(tableName)
	for _, word := range words {
		for _, candidate := range candidates {
			if word == candidate {
				return true
			}
			if len(word) < minTableInferenceRunes || len(candidate) < minTableInferenceRunes {
				continue
			}
			if strings.HasPrefix(candidate, word) || strings.HasPrefix(word, candidate) {
				return true
			}
		}
	}
	return false
}

func tableNameCandidates(tableName string) []string {
	lower := strings.ToLower(strings.TrimSpace(tableName))
	if lower == "" {
		return nil
	}

	shortName := lower
	if idx := strings.LastIndex(lower, "."); idx >= 0 {
		shortName = lower[idx+1:]
	}

	candidates := []string{lower, shortName}
	if strings.HasSuffix(shortName, "s") && len(shortName) > minTableInferenceRunes {
		candidates = append(candidates, strings.TrimSuffix(shortName, "s"))
	} else {
		candidates = append(candidates, shortName+"s")
	}

	return candidates
}

func tokenizeMessage(content string) []string {
	content = strings.ToLower(content)
	var (
		words   []string
		current strings.Builder
	)

	flush := func() {
		if current.Len() == 0 {
			return
		}
		words = append(words, current.String())
		current.Reset()
	}

	for _, r := range content {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' {
			current.WriteRune(r)
			continue
		}
		flush()
	}
	flush()

	return words
}