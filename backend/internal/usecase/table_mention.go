package usecase

import (
	"regexp"
	"strings"
)

// tableMentionPattern matches /{table} mentions in user messages.
// A mention must start at the beginning of the message or follow whitespace
// so values like "https://api.example" are not treated as table references.
var tableMentionPattern = regexp.MustCompile(`(?:^|[\s(,])\/([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)`)

// ParseReferencedTables merges explicit table names from the request with /{table}
// mentions found in the message content. Names are deduplicated case-insensitively
// while preserving the first seen casing.
func ParseReferencedTables(content string, explicit []string) []string {
	seen := make(map[string]struct{})
	result := make([]string, 0)

	add := func(name string) {
		name = normalizeTableName(name)
		if name == "" {
			return
		}
		key := strings.ToLower(name)
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		result = append(result, name)
	}

	for _, table := range explicit {
		add(table)
	}

	for _, match := range tableMentionPattern.FindAllStringSubmatch(content, -1) {
		if len(match) > 1 {
			add(match[1])
		}
	}

	return result
}

func normalizeTableName(name string) string {
	name = strings.TrimSpace(name)
	name = strings.Trim(name, `"'`+"`")
	name = strings.TrimRight(name, ".,;:!?")
	return name
}