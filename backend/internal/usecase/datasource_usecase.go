package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/adapter"
)

type CreateDatasourceInput struct {
	Name           string
	DBType         string
	Host           string
	Port           int
	DatabaseName   string
	Username       string
	Password       string
	SSLMode        string
	MaxConnections int
}

type UpdateDatasourceInput struct {
	Name           string
	DBType         string
	Host           string
	Port           int
	DatabaseName   string
	Username       string
	Password       string
	SSLMode        string
	MaxConnections int
	IsActive       bool
}

type TestConnectionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type DatasourceUsecase struct {
	repo     repository.DatasourceRepository
	registry *adapter.Registry
}

func NewDatasourceUsecase(repo repository.DatasourceRepository, registry *adapter.Registry) *DatasourceUsecase {
	return &DatasourceUsecase{
		repo:     repo,
		registry: registry,
	}
}

func (u *DatasourceUsecase) Create(ctx context.Context, input CreateDatasourceInput) (*entity.Datasource, error) {
	if err := validateDatasourceInput(input.Name, input.DBType, input.Host, input.Port, input.DatabaseName, input.Username, input.Password); err != nil {
		return nil, err
	}

	ds := &entity.Datasource{
		Name:           strings.TrimSpace(input.Name),
		DBType:         strings.TrimSpace(input.DBType),
		Host:           strings.TrimSpace(input.Host),
		Port:           input.Port,
		DatabaseName:   strings.TrimSpace(input.DatabaseName),
		Username:       strings.TrimSpace(input.Username),
		Password:       input.Password,
		SSLMode:        normalizeSSLMode(input.SSLMode),
		MaxConnections: normalizeMaxConnections(input.MaxConnections),
		IsActive:       true,
	}

	return u.repo.Create(ctx, ds)
}

func (u *DatasourceUsecase) GetByID(ctx context.Context, id uuid.UUID) (*entity.Datasource, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *DatasourceUsecase) List(ctx context.Context) ([]*entity.Datasource, error) {
	return u.repo.List(ctx)
}

func (u *DatasourceUsecase) Update(ctx context.Context, id uuid.UUID, input UpdateDatasourceInput) (*entity.Datasource, error) {
	if err := validateDatasourceInput(input.Name, input.DBType, input.Host, input.Port, input.DatabaseName, input.Username, input.Password); err != nil {
		return nil, err
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Name = strings.TrimSpace(input.Name)
	existing.DBType = strings.TrimSpace(input.DBType)
	existing.Host = strings.TrimSpace(input.Host)
	existing.Port = input.Port
	existing.DatabaseName = strings.TrimSpace(input.DatabaseName)
	existing.Username = strings.TrimSpace(input.Username)
	existing.Password = input.Password
	existing.SSLMode = normalizeSSLMode(input.SSLMode)
	existing.MaxConnections = normalizeMaxConnections(input.MaxConnections)
	existing.IsActive = input.IsActive

	return u.repo.Update(ctx, existing)
}

func (u *DatasourceUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, id); err != nil {
		return err
	}
	return u.repo.Delete(ctx, id)
}

func (u *DatasourceUsecase) TestConnection(ctx context.Context, id uuid.UUID) (*TestConnectionResult, error) {
	ds, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return u.testDatasourceConnection(ctx, ds)
}

func (u *DatasourceUsecase) TestConnectionWithInput(ctx context.Context, input CreateDatasourceInput) (*TestConnectionResult, error) {
	if err := validateDatasourceInput(input.Name, input.DBType, input.Host, input.Port, input.DatabaseName, input.Username, input.Password); err != nil {
		return nil, err
	}

	ds := &entity.Datasource{
		DBType:         strings.TrimSpace(input.DBType),
		Host:           strings.TrimSpace(input.Host),
		Port:           input.Port,
		DatabaseName:   strings.TrimSpace(input.DatabaseName),
		Username:       strings.TrimSpace(input.Username),
		Password:       input.Password,
		SSLMode:        normalizeSSLMode(input.SSLMode),
		MaxConnections: normalizeMaxConnections(input.MaxConnections),
	}

	return u.testDatasourceConnection(ctx, ds)
}

func (u *DatasourceUsecase) testDatasourceConnection(ctx context.Context, ds *entity.Datasource) (*TestConnectionResult, error) {
	dbAdapter, err := u.registry.Get(ds.DBType)
	if err != nil {
		return nil, err
	}

	cfg := adapter.ConnectionConfigFromEntity(ds)
	if err := dbAdapter.Ping(ctx, cfg); err != nil {
		return &TestConnectionResult{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return &TestConnectionResult{
		Success: true,
		Message: fmt.Sprintf("connected to %s:%d/%s", ds.Host, ds.Port, ds.DatabaseName),
	}, nil
}

func validateDatasourceInput(name, dbType, host string, port int, databaseName, username, password string) error {
	if strings.TrimSpace(name) == "" ||
		strings.TrimSpace(host) == "" ||
		strings.TrimSpace(databaseName) == "" ||
		strings.TrimSpace(username) == "" ||
		strings.TrimSpace(password) == "" {
		return domain.ErrInvalidInput
	}

	if port < 1 || port > 65535 {
		return domain.ErrInvalidInput
	}

	switch strings.TrimSpace(dbType) {
	case entity.DatasourceTypePostgreSQL, entity.DatasourceTypeMySQL:
		return nil
	default:
		return domain.ErrUnsupportedDBType
	}
}

func normalizeSSLMode(sslMode string) string {
	if strings.TrimSpace(sslMode) == "" {
		return "disable"
	}
	return strings.TrimSpace(sslMode)
}

func normalizeMaxConnections(maxConnections int) int {
	if maxConnections <= 0 {
		return 5
	}
	return maxConnections
}