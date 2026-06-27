package domain

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrInvalidInput       = errors.New("invalid input")
	ErrConnectionFailed   = errors.New("database connection failed")
	ErrUnsupportedDBType  = errors.New("unsupported database type")
	ErrSchemaNotCached    = errors.New("schema not cached, sync required")
	ErrTableNotFound      = errors.New("table not found")
	ErrAIConnectionFailed = errors.New("ai provider connection failed")
	ErrUnsupportedAPIFmt  = errors.New("unsupported api format")
	ErrQueryForbidden     = errors.New("query contains forbidden statement")
	ErrQueryTimeout       = errors.New("query execution timed out")
	ErrMultipleStatements = errors.New("only single sql statement is allowed")
)