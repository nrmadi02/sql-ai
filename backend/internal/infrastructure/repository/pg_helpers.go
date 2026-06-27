package repository

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func uuidFromPG(value pgtype.UUID) (uuid.UUID, error) {
	if !value.Valid {
		return uuid.Nil, fmt.Errorf("invalid uuid")
	}
	return uuid.FromBytes(value.Bytes[:])
}

func pgUUIDFromUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func textValue(value pgtype.Text, fallback string) string {
	if value.Valid {
		return value.String
	}
	return fallback
}

func int32Value(value pgtype.Int4, fallback int32) int32 {
	if value.Valid {
		return value.Int32
	}
	return fallback
}

func boolValue(value pgtype.Bool, fallback bool) bool {
	if value.Valid {
		return value.Bool
	}
	return fallback
}

func timestampValue(value pgtype.Timestamp) time.Time {
	if value.Valid {
		return value.Time
	}
	return time.Time{}
}

func pgTextFromString(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func pgUUIDFromOptional(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return pgUUIDFromUUID(*id)
}

func optionalUUIDFromPG(value pgtype.UUID) (*uuid.UUID, error) {
	if !value.Valid {
		return nil, nil
	}
	id, err := uuidFromPG(value)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func pgInt4FromOptionalInt(v *int) pgtype.Int4 {
	if v == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: int32(*v), Valid: true}
}

func optionalIntFromPG(value pgtype.Int4) *int {
	if !value.Valid {
		return nil
	}
	v := int(value.Int32)
	return &v
}

func pgTimestampFromOptional(value *time.Time) pgtype.Timestamp {
	if value == nil {
		return pgtype.Timestamp{}
	}
	return pgtype.Timestamp{Time: *value, Valid: true}
}