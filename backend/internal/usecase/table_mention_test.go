package usecase

import (
	"testing"
)

func TestParseReferencedTables(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("/pesanan tampilkan total per bulan", []string{"pelanggan"})
	want := []string{"pelanggan", "pesanan"}

	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}

	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}

func TestParseReferencedTablesDeduplicates(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("/orders and /orders again", []string{"orders"})
	if len(got) != 1 || got[0] != "orders" {
		t.Fatalf("got %v, want [orders]", got)
	}
}

func TestParseReferencedTablesMultipleMentions(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("gunakan /pesanan, /pelanggan untuk laporan", nil)
	want := []string{"pesanan", "pelanggan"}

	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}

func TestParseReferencedTablesSchemaQualified(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("join dengan /public.orders", nil)
	if len(got) != 1 || got[0] != "public.orders" {
		t.Fatalf("got %v, want [public.orders]", got)
	}
}

func TestParseReferencedTablesIgnoresURLs(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("docs ada di https://api.example/docs", nil)
	if len(got) != 0 {
		t.Fatalf("expected no table mentions, got %v", got)
	}
}

func TestParseReferencedTablesPreservesFirstCasing(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("/Orders dari /orders", []string{"ORDERS"})
	if len(got) != 1 || got[0] != "ORDERS" {
		t.Fatalf("got %v, want [ORDERS]", got)
	}
}

func TestParseReferencedTablesTrimsPunctuation(t *testing.T) {
	t.Parallel()

	got := ParseReferencedTables("lihat /pesanan.", nil)
	if len(got) != 1 || got[0] != "pesanan" {
		t.Fatalf("got %v, want [pesanan]", got)
	}
}