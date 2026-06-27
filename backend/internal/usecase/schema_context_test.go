package usecase

import (
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestInferTablesFromMessageMatchesSingularToPlural(t *testing.T) {
	t.Parallel()

	got := inferTablesFromMessage(
		"buatkan query untuk mendapatkan 10 user teratas",
		[]string{"users", "orders", "products"},
	)

	if len(got) != 1 || got[0] != "users" {
		t.Fatalf("got %v, want [users]", got)
	}
}

func TestInferTablesFromMessageExactName(t *testing.T) {
	t.Parallel()

	got := inferTablesFromMessage(
		"tampilkan data dari tabel orders bulan ini",
		[]string{"orders", "customers"},
	)

	if len(got) != 1 || got[0] != "orders" {
		t.Fatalf("got %v, want [orders]", got)
	}
}

func TestInferTablesFromMessageSchemaQualified(t *testing.T) {
	t.Parallel()

	got := inferTablesFromMessage(
		"join public.orders dengan customers",
		[]string{"public.orders", "customers"},
	)

	want := []string{"public.orders", "customers"}
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestResolveContextTablesPrioritizesExplicitMentions(t *testing.T) {
	t.Parallel()

	cache := &entity.SchemaCache{
		Tables: []entity.CachedTable{
			{Name: "users"},
			{Name: "orders"},
			{Name: "products"},
		},
	}

	got := resolveContextTables(
		cache,
		"/orders tampilkan total",
		[]string{"orders"},
		nil,
	)

	if len(got) != 1 || got[0] != "orders" {
		t.Fatalf("got %v, want [orders]", got)
	}
}

func TestResolveContextTablesIncludesHistoricalReferences(t *testing.T) {
	t.Parallel()

	cache := &entity.SchemaCache{
		Tables: []entity.CachedTable{
			{Name: "users"},
			{Name: "orders"},
		},
	}

	got := resolveContextTables(
		cache,
		"tampilkan 10 teratas",
		nil,
		[]*entity.GeneratorMessage{
			{
				Role:             entity.MessageRoleUser,
				ReferencedTables: []string{"users"},
			},
		},
	)

	if len(got) != 1 || got[0] != "users" {
		t.Fatalf("got %v, want [users]", got)
	}
}

func TestResolveContextTablesFallsBackToAllTablesForSmallSchema(t *testing.T) {
	t.Parallel()

	cache := &entity.SchemaCache{
		Tables: []entity.CachedTable{
			{Name: "users"},
			{Name: "orders"},
		},
	}

	got := resolveContextTables(cache, "berapa total penjualan?", nil, nil)
	if len(got) != 2 {
		t.Fatalf("got %v, want all tables for small schema", got)
	}
}

func TestResolveContextTablesInfersWithoutExplicitMention(t *testing.T) {
	t.Parallel()

	cache := &entity.SchemaCache{
		Tables: []entity.CachedTable{
			{Name: "users"},
			{Name: "orders"},
			{Name: "products"},
			{Name: "customers"},
			{Name: "payments"},
			{Name: "shipments"},
		},
	}

	got := resolveContextTables(
		cache,
		"buatkan query untuk mendapatkan 10 user teratas",
		nil,
		nil,
	)

	if len(got) != 1 || got[0] != "users" {
		t.Fatalf("got %v, want [users]", got)
	}
}