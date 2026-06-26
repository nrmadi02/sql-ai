package domain

import "errors"

var (
	ErrNotFound          = errors.New("not found")
	ErrInvalidInput      = errors.New("invalid input")
	ErrConnectionFailed  = errors.New("database connection failed")
	ErrUnsupportedDBType = errors.New("unsupported database type")
)