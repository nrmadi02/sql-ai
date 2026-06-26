package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	domainrepo "github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/encryption"
	sqlcgen "github.com/nrmadi02/sql-ai/internal/infrastructure/sqlc/generated"
)

type DatasourceRepository struct {
	queries    *sqlcgen.Queries
	encryption *encryption.Service
}

func NewDatasourceRepository(pool *pgxpool.Pool, enc *encryption.Service) domainrepo.DatasourceRepository {
	return &DatasourceRepository{
		queries:    sqlcgen.New(pool),
		encryption: enc,
	}
}

func (r *DatasourceRepository) Create(ctx context.Context, ds *entity.Datasource) (*entity.Datasource, error) {
	encryptedPassword, err := r.encryption.Encrypt(ds.Password)
	if err != nil {
		return nil, fmt.Errorf("encrypt password: %w", err)
	}

	row, err := r.queries.CreateDatasource(ctx, sqlcgen.CreateDatasourceParams{
		Name:              ds.Name,
		DbType:            ds.DBType,
		Host:              ds.Host,
		Port:              int32(ds.Port),
		DatabaseName:      ds.DatabaseName,
		Username:          ds.Username,
		PasswordEncrypted: encryptedPassword,
		SslMode:           pgtype.Text{String: ds.SSLMode, Valid: true},
		MaxConnections:    pgtype.Int4{Int32: int32(ds.MaxConnections), Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create datasource: %w", err)
	}

	return r.toEntity(row)
}

func (r *DatasourceRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Datasource, error) {
	row, err := r.queries.GetDatasource(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get datasource: %w", err)
	}

	return r.toEntity(row)
}

func (r *DatasourceRepository) List(ctx context.Context) ([]*entity.Datasource, error) {
	rows, err := r.queries.ListDatasources(ctx)
	if err != nil {
		return nil, fmt.Errorf("list datasources: %w", err)
	}

	result := make([]*entity.Datasource, 0, len(rows))
	for _, row := range rows {
		ds, err := r.toEntity(row)
		if err != nil {
			return nil, err
		}
		result = append(result, ds)
	}

	return result, nil
}

func (r *DatasourceRepository) Update(ctx context.Context, ds *entity.Datasource) (*entity.Datasource, error) {
	encryptedPassword, err := r.encryption.Encrypt(ds.Password)
	if err != nil {
		return nil, fmt.Errorf("encrypt password: %w", err)
	}

	row, err := r.queries.UpdateDatasource(ctx, sqlcgen.UpdateDatasourceParams{
		ID:                pgtype.UUID{Bytes: ds.ID, Valid: true},
		Name:              ds.Name,
		DbType:            ds.DBType,
		Host:              ds.Host,
		Port:              int32(ds.Port),
		DatabaseName:      ds.DatabaseName,
		Username:          ds.Username,
		PasswordEncrypted: encryptedPassword,
		SslMode:           pgtype.Text{String: ds.SSLMode, Valid: true},
		MaxConnections:    pgtype.Int4{Int32: int32(ds.MaxConnections), Valid: true},
		IsActive:          pgtype.Bool{Bool: ds.IsActive, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("update datasource: %w", err)
	}

	return r.toEntity(row)
}

func (r *DatasourceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.queries.DeleteDatasource(ctx, pgtype.UUID{Bytes: id, Valid: true}); err != nil {
		return fmt.Errorf("delete datasource: %w", err)
	}
	return nil
}

func (r *DatasourceRepository) UpdateSchemaCache(ctx context.Context, id uuid.UUID, schema json.RawMessage) error {
	if err := r.queries.UpdateSchemaCache(ctx, sqlcgen.UpdateSchemaCacheParams{
		ID:          pgtype.UUID{Bytes: id, Valid: true},
		SchemaCache: schema,
	}); err != nil {
		return fmt.Errorf("update schema cache: %w", err)
	}
	return nil
}

func (r *DatasourceRepository) toEntity(row sqlcgen.Datasource) (*entity.Datasource, error) {
	password, err := r.encryption.Decrypt(row.PasswordEncrypted)
	if err != nil {
		return nil, fmt.Errorf("decrypt password: %w", err)
	}

	id, err := uuidFromPG(row.ID)
	if err != nil {
		return nil, err
	}

	ds := &entity.Datasource{
		ID:             id,
		Name:           row.Name,
		DBType:         row.DbType,
		Host:           row.Host,
		Port:           int(row.Port),
		DatabaseName:   row.DatabaseName,
		Username:       row.Username,
		Password:       password,
		SSLMode:        textValue(row.SslMode, "disable"),
		MaxConnections: int(int32Value(row.MaxConnections, 5)),
		IsActive:       boolValue(row.IsActive, true),
		SchemaCache:    row.SchemaCache,
		CreatedAt:      timestampValue(row.CreatedAt),
		UpdatedAt:      timestampValue(row.UpdatedAt),
	}

	if row.SchemaCachedAt.Valid {
		t := row.SchemaCachedAt.Time
		ds.SchemaCachedAt = &t
	}

	return ds, nil
}

func uuidFromPG(value pgtype.UUID) (uuid.UUID, error) {
	if !value.Valid {
		return uuid.Nil, fmt.Errorf("invalid uuid")
	}
	return uuid.FromBytes(value.Bytes[:])
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