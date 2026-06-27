package usecase

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
)

const sqlEditorNameMaxLength = 255

type SqlEditorSessionDetail struct {
	Session *entity.SqlEditorSession
	Tabs    []*entity.SqlEditorTab
}

type CreateSqlEditorSessionInput struct {
	Name         string
	DatasourceID *uuid.UUID
}

type UpdateSqlEditorSessionInput struct {
	Name         string
	DatasourceID *uuid.UUID
}

type CreateSqlEditorTabInput struct {
	Name       string
	SQLContent string
}

type UpdateSqlEditorTabInput struct {
	Name       string
	SQLContent string
	SortOrder  *int
}

type RunSqlEditorTabInput struct {
	MaxRows int
	SQL     string
}

type AutocompleteColumn struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type AutocompleteTable struct {
	Name    string               `json:"name"`
	Columns []AutocompleteColumn `json:"columns"`
}

type AutocompleteResult struct {
	Dialect string              `json:"dialect"`
	Tables  []AutocompleteTable `json:"tables"`
}

type SqlEditorUsecase struct {
	repo           repository.SqlEditorRepository
	datasourceRepo repository.DatasourceRepository
	queryUsecase   *QueryUsecase
}

func NewSqlEditorUsecase(
	repo repository.SqlEditorRepository,
	datasourceRepo repository.DatasourceRepository,
	queryUsecase *QueryUsecase,
) *SqlEditorUsecase {
	return &SqlEditorUsecase{
		repo:           repo,
		datasourceRepo: datasourceRepo,
		queryUsecase:   queryUsecase,
	}
}

func (u *SqlEditorUsecase) CreateSession(ctx context.Context, input CreateSqlEditorSessionInput) (*SqlEditorSessionDetail, error) {
	name := normalizeSqlEditorName(input.Name, entity.SqlEditorDefaultSessionName)
	if err := validateSqlEditorName(name); err != nil {
		return nil, err
	}

	session, err := u.repo.CreateSession(ctx, &entity.SqlEditorSession{
		Name:         name,
		DatasourceID: input.DatasourceID,
	})
	if err != nil {
		return nil, err
	}

	tab, err := u.repo.CreateTab(ctx, &entity.SqlEditorTab{
		SessionID:  session.ID,
		Name:       entity.SqlEditorDefaultTabName,
		SQLContent: "",
		SortOrder:  0,
	})
	if err != nil {
		return nil, err
	}

	return &SqlEditorSessionDetail{
		Session: session,
		Tabs:    []*entity.SqlEditorTab{tab},
	}, nil
}

func (u *SqlEditorUsecase) ListSessions(ctx context.Context) ([]*entity.SqlEditorSession, error) {
	return u.repo.ListSessions(ctx)
}

func (u *SqlEditorUsecase) GetSessionByID(ctx context.Context, id uuid.UUID) (*SqlEditorSessionDetail, error) {
	session, err := u.repo.GetSessionByID(ctx, id)
	if err != nil {
		return nil, err
	}

	tabs, err := u.repo.ListTabsBySessionID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &SqlEditorSessionDetail{
		Session: session,
		Tabs:    tabs,
	}, nil
}

func (u *SqlEditorUsecase) UpdateSession(ctx context.Context, id uuid.UUID, input UpdateSqlEditorSessionInput) (*entity.SqlEditorSession, error) {
	name := normalizeSqlEditorName(input.Name, "")
	if name != "" {
		if err := validateSqlEditorName(name); err != nil {
			return nil, err
		}
	}

	session, err := u.repo.GetSessionByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if name != "" {
		session.Name = name
	}
	session.DatasourceID = input.DatasourceID

	return u.repo.UpdateSession(ctx, session)
}

func (u *SqlEditorUsecase) DeleteSession(ctx context.Context, id uuid.UUID) error {
	if _, err := u.repo.GetSessionByID(ctx, id); err != nil {
		return err
	}
	return u.repo.DeleteSession(ctx, id)
}

func (u *SqlEditorUsecase) CreateTab(ctx context.Context, sessionID uuid.UUID, input CreateSqlEditorTabInput) (*entity.SqlEditorTab, error) {
	if _, err := u.repo.GetSessionByID(ctx, sessionID); err != nil {
		return nil, err
	}

	name := normalizeSqlEditorName(input.Name, "")
	if name == "" {
		count, err := u.repo.CountTabsBySessionID(ctx, sessionID)
		if err != nil {
			return nil, err
		}
		name = defaultTabName(int(count) + 1)
	}
	if err := validateSqlEditorName(name); err != nil {
		return nil, err
	}

	sortOrder, err := u.repo.NextTabSortOrder(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	tab, err := u.repo.CreateTab(ctx, &entity.SqlEditorTab{
		SessionID:  sessionID,
		Name:       name,
		SQLContent: strings.TrimSpace(input.SQLContent),
		SortOrder:  sortOrder,
	})
	if err != nil {
		return nil, err
	}

	_ = u.repo.TouchSession(ctx, sessionID)
	return tab, nil
}

func (u *SqlEditorUsecase) UpdateTab(ctx context.Context, sessionID, tabID uuid.UUID, input UpdateSqlEditorTabInput) (*entity.SqlEditorTab, error) {
	tab, err := u.getTabInSession(ctx, sessionID, tabID)
	if err != nil {
		return nil, err
	}

	name := normalizeSqlEditorName(input.Name, tab.Name)
	if err := validateSqlEditorName(name); err != nil {
		return nil, err
	}

	tab.Name = name
	tab.SQLContent = strings.TrimSpace(input.SQLContent)
	if input.SortOrder != nil {
		tab.SortOrder = *input.SortOrder
	}

	updated, err := u.repo.UpdateTab(ctx, tab)
	if err != nil {
		return nil, err
	}

	_ = u.repo.TouchSession(ctx, sessionID)
	return updated, nil
}

func (u *SqlEditorUsecase) DeleteTab(ctx context.Context, sessionID, tabID uuid.UUID) error {
	if _, err := u.getTabInSession(ctx, sessionID, tabID); err != nil {
		return err
	}

	if err := u.repo.DeleteTab(ctx, tabID); err != nil {
		return err
	}

	_ = u.repo.TouchSession(ctx, sessionID)
	return nil
}

func (u *SqlEditorUsecase) RunTab(
	ctx context.Context,
	sessionID, tabID uuid.UUID,
	input RunSqlEditorTabInput,
) (*QueryExecutionResult, error) {
	session, tab, err := u.getSessionTabPair(ctx, sessionID, tabID)
	if err != nil {
		return nil, err
	}

	if session.DatasourceID == nil {
		return nil, domain.ErrInvalidInput
	}

	sql := strings.TrimSpace(input.SQL)
	if sql == "" {
		sql = strings.TrimSpace(tab.SQLContent)
	}
	if sql == "" {
		return nil, domain.ErrInvalidInput
	}

	start := time.Now()
	result, execErr := u.queryUsecase.Execute(ctx, ExecuteQueryInput{
		SQL:          sql,
		DatasourceID: *session.DatasourceID,
		MaxRows:      input.MaxRows,
		Source:       entity.QueryHistorySourceEditor,
	})
	elapsed := int(time.Since(start).Milliseconds())

	if execErr != nil {
		u.persistTabExecution(ctx, tab, nil, elapsed, entity.SqlEditorTabStatusFailed, TranslateQueryError(execErr).Error())
		return nil, execErr
	}

	u.persistTabExecution(ctx, tab, result, elapsed, entity.SqlEditorTabStatusSuccess, "")
	_ = u.repo.TouchSession(ctx, sessionID)
	return result, nil
}

func (u *SqlEditorUsecase) GetAutocomplete(ctx context.Context, datasourceID uuid.UUID) (*AutocompleteResult, error) {
	ds, err := u.datasourceRepo.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, err
	}

	cache, err := parseSchemaCache(ds.SchemaCache)
	if err != nil {
		return nil, err
	}
	if cache == nil {
		return nil, domain.ErrSchemaNotCached
	}

	tables := make([]AutocompleteTable, 0, len(cache.Tables))
	for _, table := range cache.Tables {
		columns := make([]AutocompleteColumn, 0, len(table.Columns))
		for _, column := range table.Columns {
			columns = append(columns, AutocompleteColumn{
				Name: column.Name,
				Type: column.Type,
			})
		}

		tables = append(tables, AutocompleteTable{
			Name:    table.Name,
			Columns: columns,
		})
	}

	return &AutocompleteResult{
		Dialect: cache.Dialect,
		Tables:  tables,
	}, nil
}

func (u *SqlEditorUsecase) getTabInSession(ctx context.Context, sessionID, tabID uuid.UUID) (*entity.SqlEditorTab, error) {
	_, tab, err := u.getSessionTabPair(ctx, sessionID, tabID)
	return tab, err
}

func (u *SqlEditorUsecase) getSessionTabPair(ctx context.Context, sessionID, tabID uuid.UUID) (*entity.SqlEditorSession, *entity.SqlEditorTab, error) {
	session, err := u.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, nil, err
	}

	tab, err := u.repo.GetTabByID(ctx, tabID)
	if err != nil {
		return nil, nil, err
	}

	if tab.SessionID != sessionID {
		return nil, nil, domain.ErrNotFound
	}

	return session, tab, nil
}

func (u *SqlEditorUsecase) persistTabExecution(
	ctx context.Context,
	tab *entity.SqlEditorTab,
	result *QueryExecutionResult,
	elapsed int,
	status string,
	errorMessage string,
) {
	tab.ExecutionTimeMs = &elapsed
	tab.LastStatus = status
	tab.ErrorMessage = errorMessage
	tab.RowCount = nil
	tab.LastResult = nil

	if result != nil {
		payload, err := json.Marshal(result)
		if err == nil {
			tab.LastResult = payload
		}
		rowCount := result.RowCount
		tab.RowCount = &rowCount
	}

	_, _ = u.repo.UpdateTabExecution(ctx, tab)
}

func normalizeSqlEditorName(name, fallback string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return fallback
	}
	return name
}

func validateSqlEditorName(name string) error {
	if strings.TrimSpace(name) == "" || len([]rune(name)) > sqlEditorNameMaxLength {
		return domain.ErrInvalidInput
	}
	return nil
}

func defaultTabName(index int) string {
	if index < 1 {
		index = 1
	}
	return "Query " + strconv.Itoa(index)
}