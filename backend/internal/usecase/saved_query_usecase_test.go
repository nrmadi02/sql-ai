package usecase

import (
	"strings"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

func TestValidateSavedQueryInput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		query   string
		sql     string
		wantErr error
	}{
		{
			name:  "valid",
			query: "Penjualan bulanan",
			sql:   "SELECT 1",
		},
		{
			name:    "empty name",
			query:   "   ",
			sql:     "SELECT 1",
			wantErr: domain.ErrInvalidInput,
		},
		{
			name:    "empty sql",
			query:   "Penjualan",
			sql:     " ",
			wantErr: domain.ErrInvalidInput,
		},
		{
			name:    "name too long",
			query:   strings.Repeat("a", savedQueryNameMaxLength+1),
			sql:     "SELECT 1",
			wantErr: domain.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateSavedQueryInput(tt.query, tt.sql)
			if tt.wantErr == nil && err != nil {
				t.Fatalf("expected nil, got %v", err)
			}
			if tt.wantErr != nil && err != tt.wantErr {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestNormalizeTags(t *testing.T) {
	t.Parallel()

	tags := normalizeTags([]string{" laporan ", "laporan", "", "  ", "Analitik"})
	if len(tags) != 2 {
		t.Fatalf("expected 2 tags, got %d", len(tags))
	}
	if tags[0] != "laporan" || tags[1] != "Analitik" {
		t.Fatalf("unexpected tags: %#v", tags)
	}
}