package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

type mockSqlEditorRepo struct {
	sessions map[uuid.UUID]*entity.SqlEditorSession
	tabs     map[uuid.UUID]*entity.SqlEditorTab
}

func newMockSqlEditorRepo() *mockSqlEditorRepo {
	return &mockSqlEditorRepo{
		sessions: make(map[uuid.UUID]*entity.SqlEditorSession),
		tabs:     make(map[uuid.UUID]*entity.SqlEditorTab),
	}
}

func (m *mockSqlEditorRepo) CreateSession(_ context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error) {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	copySession := *session
	m.sessions[copySession.ID] = &copySession
	return &copySession, nil
}

func (m *mockSqlEditorRepo) GetSessionByID(_ context.Context, id uuid.UUID) (*entity.SqlEditorSession, error) {
	session, ok := m.sessions[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	copySession := *session
	return &copySession, nil
}

func (m *mockSqlEditorRepo) ListSessions(_ context.Context) ([]*entity.SqlEditorSession, error) {
	result := make([]*entity.SqlEditorSession, 0, len(m.sessions))
	for _, session := range m.sessions {
		copySession := *session
		result = append(result, &copySession)
	}
	return result, nil
}

func (m *mockSqlEditorRepo) UpdateSession(_ context.Context, session *entity.SqlEditorSession) (*entity.SqlEditorSession, error) {
	if _, ok := m.sessions[session.ID]; !ok {
		return nil, domain.ErrNotFound
	}
	copySession := *session
	m.sessions[copySession.ID] = &copySession
	return &copySession, nil
}

func (m *mockSqlEditorRepo) DeleteSession(_ context.Context, id uuid.UUID) error {
	if _, ok := m.sessions[id]; !ok {
		return domain.ErrNotFound
	}
	delete(m.sessions, id)
	return nil
}

func (m *mockSqlEditorRepo) TouchSession(context.Context, uuid.UUID) error {
	return nil
}

func (m *mockSqlEditorRepo) CreateTab(_ context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	if tab.ID == uuid.Nil {
		tab.ID = uuid.New()
	}
	copyTab := *tab
	m.tabs[copyTab.ID] = &copyTab
	return &copyTab, nil
}

func (m *mockSqlEditorRepo) GetTabByID(_ context.Context, id uuid.UUID) (*entity.SqlEditorTab, error) {
	tab, ok := m.tabs[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	copyTab := *tab
	return &copyTab, nil
}

func (m *mockSqlEditorRepo) ListTabsBySessionID(_ context.Context, sessionID uuid.UUID) ([]*entity.SqlEditorTab, error) {
	result := make([]*entity.SqlEditorTab, 0)
	for _, tab := range m.tabs {
		if tab.SessionID == sessionID {
			copyTab := *tab
			result = append(result, &copyTab)
		}
	}
	return result, nil
}

func (m *mockSqlEditorRepo) CountTabsBySessionID(_ context.Context, sessionID uuid.UUID) (int64, error) {
	var count int64
	for _, tab := range m.tabs {
		if tab.SessionID == sessionID {
			count++
		}
	}
	return count, nil
}

func (m *mockSqlEditorRepo) NextTabSortOrder(_ context.Context, sessionID uuid.UUID) (int, error) {
	maxOrder := -1
	for _, tab := range m.tabs {
		if tab.SessionID == sessionID && tab.SortOrder > maxOrder {
			maxOrder = tab.SortOrder
		}
	}
	return maxOrder + 1, nil
}

func (m *mockSqlEditorRepo) UpdateTab(_ context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	if _, ok := m.tabs[tab.ID]; !ok {
		return nil, domain.ErrNotFound
	}
	copyTab := *tab
	m.tabs[copyTab.ID] = &copyTab
	return &copyTab, nil
}

func (m *mockSqlEditorRepo) UpdateTabExecution(_ context.Context, tab *entity.SqlEditorTab) (*entity.SqlEditorTab, error) {
	if _, ok := m.tabs[tab.ID]; !ok {
		return nil, domain.ErrNotFound
	}
	copyTab := *tab
	m.tabs[copyTab.ID] = &copyTab
	return &copyTab, nil
}

func (m *mockSqlEditorRepo) DeleteTab(_ context.Context, id uuid.UUID) error {
	if _, ok := m.tabs[id]; !ok {
		return domain.ErrNotFound
	}
	delete(m.tabs, id)
	return nil
}

type mockDatasourceRepo struct {
	items map[uuid.UUID]*entity.Datasource
}

func (m *mockDatasourceRepo) Create(context.Context, *entity.Datasource) (*entity.Datasource, error) {
	return nil, errors.New("not implemented")
}

func (m *mockDatasourceRepo) GetByID(_ context.Context, id uuid.UUID) (*entity.Datasource, error) {
	item, ok := m.items[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	copyItem := *item
	return &copyItem, nil
}

func (m *mockDatasourceRepo) List(context.Context) ([]*entity.Datasource, error) {
	return nil, errors.New("not implemented")
}

func (m *mockDatasourceRepo) Update(context.Context, *entity.Datasource) (*entity.Datasource, error) {
	return nil, errors.New("not implemented")
}

func (m *mockDatasourceRepo) Delete(context.Context, uuid.UUID) error {
	return errors.New("not implemented")
}

func (m *mockDatasourceRepo) UpdateSchemaCache(context.Context, uuid.UUID, json.RawMessage) error {
	return errors.New("not implemented")
}

func TestValidateSqlEditorName(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		value   string
		wantErr error
	}{
		{name: "valid", value: "Analisis Penjualan"},
		{name: "empty", value: "   ", wantErr: domain.ErrInvalidInput},
		{
			name:    "too long",
			value:   string(make([]rune, sqlEditorNameMaxLength+1)),
			wantErr: domain.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateSqlEditorName(tt.value)
			if tt.wantErr == nil && err != nil {
				t.Fatalf("expected nil, got %v", err)
			}
			if tt.wantErr != nil && err != tt.wantErr {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestDefaultTabName(t *testing.T) {
	t.Parallel()

	if got := defaultTabName(1); got != "Query 1" {
		t.Fatalf("expected Query 1, got %q", got)
	}
	if got := defaultTabName(3); got != "Query 3" {
		t.Fatalf("expected Query 3, got %q", got)
	}
}

func TestSqlEditorUsecaseCreateSessionCreatesDefaultTab(t *testing.T) {
	t.Parallel()

	repo := newMockSqlEditorRepo()
	uc := NewSqlEditorUsecase(repo, &mockDatasourceRepo{items: map[uuid.UUID]*entity.Datasource{}}, nil)

	detail, err := uc.CreateSession(context.Background(), CreateSqlEditorSessionInput{
		Name: "Analisis",
	})
	if err != nil {
		t.Fatalf("CreateSession() error = %v", err)
	}

	if detail.Session.Name != "Analisis" {
		t.Fatalf("unexpected session name: %q", detail.Session.Name)
	}
	if len(detail.Tabs) != 1 {
		t.Fatalf("expected 1 default tab, got %d", len(detail.Tabs))
	}
	if detail.Tabs[0].Name != entity.SqlEditorDefaultTabName {
		t.Fatalf("unexpected default tab name: %q", detail.Tabs[0].Name)
	}
}

func TestSqlEditorUsecaseGetSessionTabPairRejectsForeignTab(t *testing.T) {
	t.Parallel()

	repo := newMockSqlEditorRepo()
	sessionID := uuid.New()
	otherSessionID := uuid.New()
	tabID := uuid.New()

	repo.sessions[sessionID] = &entity.SqlEditorSession{ID: sessionID, Name: "Sesi"}
	repo.tabs[tabID] = &entity.SqlEditorTab{
		ID:        tabID,
		SessionID: otherSessionID,
		Name:      "Query 1",
	}

	uc := NewSqlEditorUsecase(repo, &mockDatasourceRepo{items: map[uuid.UUID]*entity.Datasource{}}, nil)

	_, err := uc.UpdateTab(context.Background(), sessionID, tabID, UpdateSqlEditorTabInput{
		Name:       "Updated",
		SQLContent: "SELECT 1",
	})
	if !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestSqlEditorUsecaseRunTabRequiresDatasource(t *testing.T) {
	t.Parallel()

	repo := newMockSqlEditorRepo()
	sessionID := uuid.New()
	tabID := uuid.New()

	repo.sessions[sessionID] = &entity.SqlEditorSession{ID: sessionID, Name: "Sesi"}
	repo.tabs[tabID] = &entity.SqlEditorTab{
		ID:         tabID,
		SessionID:  sessionID,
		Name:       "Query 1",
		SQLContent: "SELECT 1",
	}

	uc := NewSqlEditorUsecase(repo, &mockDatasourceRepo{items: map[uuid.UUID]*entity.Datasource{}}, nil)

	_, err := uc.RunTab(context.Background(), sessionID, tabID, RunSqlEditorTabInput{})
	if !errors.Is(err, domain.ErrInvalidInput) {
		t.Fatalf("expected ErrInvalidInput, got %v", err)
	}
}

func TestSqlEditorUsecaseGetAutocompleteRequiresCachedSchema(t *testing.T) {
	t.Parallel()

	datasourceID := uuid.New()
	repo := newMockSqlEditorRepo()
	dsRepo := &mockDatasourceRepo{
		items: map[uuid.UUID]*entity.Datasource{
			datasourceID: {
				ID:          datasourceID,
				Name:        "DB",
				SchemaCache: nil,
			},
		},
	}

	uc := NewSqlEditorUsecase(repo, dsRepo, nil)

	_, err := uc.GetAutocomplete(context.Background(), datasourceID)
	if !errors.Is(err, domain.ErrSchemaNotCached) {
		t.Fatalf("expected ErrSchemaNotCached, got %v", err)
	}
}

func TestSqlEditorUsecaseGetAutocompleteReturnsTables(t *testing.T) {
	t.Parallel()

	datasourceID := uuid.New()
	cache, err := json.Marshal(entity.SchemaCache{
		Dialect: "postgresql",
		Tables: []entity.CachedTable{
			{
				Name: "pesanan",
				Columns: []entity.Column{
					{Name: "id", Type: "bigint"},
					{Name: "total", Type: "decimal"},
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("marshal schema cache: %v", err)
	}

	repo := newMockSqlEditorRepo()
	dsRepo := &mockDatasourceRepo{
		items: map[uuid.UUID]*entity.Datasource{
			datasourceID: {
				ID:          datasourceID,
				Name:        "DB",
				SchemaCache: cache,
			},
		},
	}

	uc := NewSqlEditorUsecase(repo, dsRepo, nil)
	result, err := uc.GetAutocomplete(context.Background(), datasourceID)
	if err != nil {
		t.Fatalf("GetAutocomplete() error = %v", err)
	}

	if result.Dialect != "postgresql" {
		t.Fatalf("unexpected dialect: %q", result.Dialect)
	}
	if len(result.Tables) != 1 || result.Tables[0].Name != "pesanan" {
		t.Fatalf("unexpected tables: %#v", result.Tables)
	}
	if len(result.Tables[0].Columns) != 2 {
		t.Fatalf("expected 2 columns, got %d", len(result.Tables[0].Columns))
	}
}

