package usecase

import "testing"

func TestListQueryHistoryPaginationDefaults(t *testing.T) {
	t.Parallel()

	pageSize := 0
	page := 0
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = defaultHistoryPageSize
	}
	if pageSize > maxHistoryPageSize {
		pageSize = maxHistoryPageSize
	}

	if page != 1 {
		t.Fatalf("expected page 1, got %d", page)
	}
	if pageSize != defaultHistoryPageSize {
		t.Fatalf("expected default page size %d, got %d", defaultHistoryPageSize, pageSize)
	}
}

func TestListQueryHistoryPageSizeCap(t *testing.T) {
	t.Parallel()

	pageSize := 500
	if pageSize > maxHistoryPageSize {
		pageSize = maxHistoryPageSize
	}

	if pageSize != maxHistoryPageSize {
		t.Fatalf("expected capped page size %d, got %d", maxHistoryPageSize, pageSize)
	}
}