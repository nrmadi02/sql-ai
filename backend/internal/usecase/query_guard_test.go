package usecase

import (
	"errors"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

func TestValidateQuerySQL_AllowsSelect(t *testing.T) {
	err := ValidateQuerySQL("SELECT id, nama FROM pengguna WHERE aktif = true;")
	if err != nil {
		t.Fatalf("expected select to pass, got %v", err)
	}
}

func TestValidateQuerySQL_RejectsForbiddenKeywords(t *testing.T) {
	tests := []string{
		"DELETE FROM pengguna",
		"UPDATE pengguna SET nama = 'x'",
		"INSERT INTO pengguna (nama) VALUES ('x')",
		"DROP TABLE pengguna",
		"ALTER TABLE pengguna ADD COLUMN x INT",
		"TRUNCATE TABLE pengguna",
		"CREATE TABLE tmp (id INT)",
		"GRANT SELECT ON pengguna TO public",
		"REVOKE SELECT ON pengguna FROM public",
	}

	for _, sql := range tests {
		err := ValidateQuerySQL(sql)
		if !errors.Is(err, domain.ErrQueryForbidden) {
			t.Fatalf("expected forbidden for %q, got %v", sql, err)
		}
	}
}

func TestValidateQuerySQL_RejectsMultipleStatements(t *testing.T) {
	err := ValidateQuerySQL("SELECT 1; SELECT 2")
	if !errors.Is(err, domain.ErrMultipleStatements) {
		t.Fatalf("expected multiple statements error, got %v", err)
	}
}

func TestValidateQuerySQL_IgnoresKeywordsInComments(t *testing.T) {
	sql := `
-- DELETE FROM pengguna
SELECT id FROM pengguna /* UPDATE blocked */
`
	if err := ValidateQuerySQL(sql); err != nil {
		t.Fatalf("expected comment keywords to be ignored, got %v", err)
	}
}

func TestInjectLimit_AppendsWhenMissing(t *testing.T) {
	got := InjectLimit("SELECT * FROM pesanan", 1000)
	want := "SELECT * FROM pesanan LIMIT 1000"
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestInjectLimit_PreservesExistingLimit(t *testing.T) {
	sql := "SELECT * FROM pesanan LIMIT 50"
	if got := InjectLimit(sql, 1000); got != sql {
		t.Fatalf("got %q, want %q", got, sql)
	}
}