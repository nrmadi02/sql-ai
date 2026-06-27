package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

func TestTranslateQueryError_ForbiddenKeyword(t *testing.T) {
	translated := TranslateQueryError(domain.ErrQueryForbidden)
	if translated.Error() != msgQueryForbidden {
		t.Fatalf("got %q", translated.Error())
	}
}

func TestTranslateQueryError_Timeout(t *testing.T) {
	translated := TranslateQueryError(context.DeadlineExceeded)
	if translated.Error() != msgQueryTimeout {
		t.Fatalf("got %q", translated.Error())
	}
}

func TestTranslateQueryError_SyntaxError(t *testing.T) {
	translated := TranslateQueryError(errors.New(`ERROR: syntax error at or near "SELCT"`))
	if translated.Error() != msgSyntaxError {
		t.Fatalf("got %q", translated.Error())
	}
}