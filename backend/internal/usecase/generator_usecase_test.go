package usecase

import (
	"strings"
	"testing"
)

func TestSessionTitleFromContent(t *testing.T) {
	t.Parallel()

	short := sessionTitleFromContent("tampilkan penjualan")
	if short != "tampilkan penjualan" {
		t.Fatalf("unexpected short title: %q", short)
	}

	longInput := strings.Repeat("a", sessionTitleMaxRunes+10)
	long := sessionTitleFromContent(longInput)
	if len([]rune(long)) != sessionTitleMaxRunes+3 {
		t.Fatalf("expected truncated title with ellipsis, got len %d", len([]rune(long)))
	}
	if !strings.HasSuffix(long, "...") {
		t.Fatalf("expected ellipsis suffix, got %q", long)
	}
}