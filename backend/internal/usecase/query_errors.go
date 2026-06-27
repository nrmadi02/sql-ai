package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain"
)

const (
	msgQueryForbidden = "Query mengandung perintah yang tidak diizinkan (misal DELETE, DROP, atau UPDATE). SQL AI hanya menjalankan query baca."
	msgQueryTimeout   = "Query berjalan terlalu lama dan dibatalkan setelah 30 detik. Coba persempit rentang tanggal atau batasi jumlah baris."
	msgMultipleSQL    = "Hanya satu pernyataan SQL yang boleh dijalankan dalam satu kali eksekusi."
	msgSyntaxError    = "Query mengandung kesalahan sintaks SQL. Periksa kembali query Anda."
	msgTableNotFound  = "Tabel atau view yang dirujuk tidak ditemukan di database."
	msgColumnNotFound = "Kolom yang dirujuk tidak ditemukan di tabel."
	msgPermission     = "Akun database tidak memiliki izin untuk menjalankan query ini."
	msgConnection     = "Tidak bisa menyambung ke database. Periksa host, port, dan kredensial di pengaturan datasource."
	msgGenericQuery   = "Query gagal dijalankan. Periksa kembali SQL Anda atau coba lagi."
)

type QueryUserError struct {
	Message string
	Cause   error
}

func (e *QueryUserError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	if e.Cause != nil {
		return e.Cause.Error()
	}
	return msgGenericQuery
}

func (e *QueryUserError) Unwrap() error {
	return e.Cause
}

func TranslateQueryError(err error) error {
	if err == nil {
		return nil
	}

	switch {
	case errors.Is(err, domain.ErrQueryForbidden):
		return &QueryUserError{Message: msgQueryForbidden, Cause: err}
	case errors.Is(err, domain.ErrQueryTimeout), errors.Is(err, context.DeadlineExceeded):
		return &QueryUserError{Message: msgQueryTimeout, Cause: err}
	case errors.Is(err, domain.ErrMultipleStatements):
		return &QueryUserError{Message: msgMultipleSQL, Cause: err}
	case errors.Is(err, domain.ErrInvalidInput):
		return &QueryUserError{Message: "Query SQL tidak boleh kosong.", Cause: err}
	case errors.Is(err, domain.ErrConnectionFailed):
		return &QueryUserError{Message: msgConnection, Cause: err}
	}

	var userErr *QueryUserError
	if errors.As(err, &userErr) {
		return err
	}

	lower := strings.ToLower(err.Error())
	switch {
	case strings.Contains(lower, "syntax error"), strings.Contains(lower, "parse error"):
		return &QueryUserError{Message: msgSyntaxError, Cause: err}
	case strings.Contains(lower, "does not exist"), strings.Contains(lower, "unknown table"):
		return &QueryUserError{Message: msgTableNotFound, Cause: err}
	case strings.Contains(lower, "column"), strings.Contains(lower, "unknown column"):
		return &QueryUserError{Message: msgColumnNotFound, Cause: err}
	case strings.Contains(lower, "permission denied"), strings.Contains(lower, "access denied"):
		return &QueryUserError{Message: msgPermission, Cause: err}
	default:
		return &QueryUserError{Message: msgGenericQuery, Cause: err}
	}
}