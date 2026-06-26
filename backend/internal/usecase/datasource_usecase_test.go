package usecase

import (
	"testing"

	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

func TestValidateDatasourceInput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		input   CreateDatasourceInput
		wantErr error
	}{
		{
			name: "valid postgresql",
			input: CreateDatasourceInput{
				Name: "DB", DBType: entity.DatasourceTypePostgreSQL,
				Host: "localhost", Port: 5432, DatabaseName: "app",
				Username: "user", Password: "pass",
			},
		},
		{
			name: "invalid type",
			input: CreateDatasourceInput{
				Name: "DB", DBType: "sqlite",
				Host: "localhost", Port: 5432, DatabaseName: "app",
				Username: "user", Password: "pass",
			},
			wantErr: domain.ErrUnsupportedDBType,
		},
		{
			name: "missing password",
			input: CreateDatasourceInput{
				Name: "DB", DBType: entity.DatasourceTypePostgreSQL,
				Host: "localhost", Port: 5432, DatabaseName: "app",
				Username: "user",
			},
			wantErr: domain.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateDatasourceInput(
				tt.input.Name, tt.input.DBType, tt.input.Host, tt.input.Port,
				tt.input.DatabaseName, tt.input.Username, tt.input.Password,
			)
			if tt.wantErr == nil && err != nil {
				t.Fatalf("expected nil, got %v", err)
			}
			if tt.wantErr != nil && err != tt.wantErr {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}