package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/adapter"
)

const queryExecutionTimeout = 30 * time.Second

type ExecuteQueryInput struct {
	SQL          string
	DatasourceID uuid.UUID
	MaxRows      int
	MessageID    *uuid.UUID
	Source       string
}

type QueryColumnResult struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type QueryExecutionResult struct {
	Columns         []QueryColumnResult `json:"columns"`
	Rows            [][]any             `json:"rows"`
	RowCount        int                 `json:"row_count"`
	ExecutionTimeMs int                 `json:"execution_time_ms"`
	Truncated       bool                `json:"truncated"`
}

type QueryUsecase struct {
	datasourceRepo repository.DatasourceRepository
	generatorRepo  repository.GeneratorRepository
	historyUsecase *QueryHistoryUsecase
	registry       *adapter.Registry
}

func NewQueryUsecase(
	datasourceRepo repository.DatasourceRepository,
	generatorRepo repository.GeneratorRepository,
	historyUsecase *QueryHistoryUsecase,
	registry *adapter.Registry,
) *QueryUsecase {
	return &QueryUsecase{
		datasourceRepo: datasourceRepo,
		generatorRepo:  generatorRepo,
		historyUsecase: historyUsecase,
		registry:       registry,
	}
}

func (u *QueryUsecase) Execute(ctx context.Context, input ExecuteQueryInput) (*QueryExecutionResult, error) {
	preparedSQL, maxRows, err := u.prepareSQL(input.SQL, input.MaxRows)
	if err != nil {
		return nil, TranslateQueryError(err)
	}

	ds, err := u.datasourceRepo.GetByID(ctx, input.DatasourceID)
	if err != nil {
		return nil, TranslateQueryError(err)
	}

	execCtx, cancel := context.WithTimeout(ctx, queryExecutionTimeout)
	defer cancel()

	start := time.Now()
	result, err := u.runQuery(execCtx, ds, preparedSQL, maxRows)
	elapsed := int(time.Since(start).Milliseconds())

	if err != nil {
		u.persistExecutionError(ctx, input.MessageID, preparedSQL, elapsed, err)
		u.recordHistory(ctx, input.DatasourceID, preparedSQL, input.MessageID, input.Source, nil, nil, entity.QueryHistoryStatusFailed, TranslateQueryError(err).Error(), elapsed)
		return nil, TranslateQueryError(err)
	}

	response := toQueryExecutionResult(result, elapsed)
	u.persistExecutionSuccess(ctx, input.MessageID, preparedSQL, response)
	u.recordHistory(ctx, input.DatasourceID, preparedSQL, input.MessageID, input.Source, &response.RowCount, &response.ExecutionTimeMs, entity.QueryHistoryStatusSuccess, "", elapsed)
	return response, nil
}

func (u *QueryUsecase) Explain(ctx context.Context, datasourceID uuid.UUID, sql string) (*QueryExecutionResult, error) {
	preparedSQL, _, err := u.prepareSQL(sql, defaultQueryRowLimit)
	if err != nil {
		return nil, TranslateQueryError(err)
	}

	ds, err := u.datasourceRepo.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, TranslateQueryError(err)
	}

	execCtx, cancel := context.WithTimeout(ctx, queryExecutionTimeout)
	defer cancel()

	start := time.Now()
	result, err := u.runExplain(execCtx, ds, preparedSQL)
	elapsed := int(time.Since(start).Milliseconds())
	if err != nil {
		return nil, TranslateQueryError(err)
	}

	return toQueryExecutionResult(result, elapsed), nil
}

func (u *QueryUsecase) prepareSQL(sql string, maxRows int) (string, int, error) {
	if err := ValidateQuerySQL(sql); err != nil {
		return "", 0, err
	}

	if maxRows <= 0 {
		maxRows = defaultQueryRowLimit
	}

	return InjectLimit(sql, maxRows), maxRows, nil
}

func (u *QueryUsecase) runQuery(ctx context.Context, ds *entity.Datasource, sql string, maxRows int) (*adapter.QueryResult, error) {
	conn, err := u.openConnection(ctx, ds)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	return conn.ExecuteQuery(ctx, sql, maxRows)
}

func (u *QueryUsecase) runExplain(ctx context.Context, ds *entity.Datasource, sql string) (*adapter.QueryResult, error) {
	conn, err := u.openConnection(ctx, ds)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	return conn.ExplainQuery(ctx, sql)
}

func (u *QueryUsecase) openConnection(ctx context.Context, ds *entity.Datasource) (adapter.Connection, error) {
	dbAdapter, err := u.registry.Get(ds.DBType)
	if err != nil {
		return nil, err
	}

	cfg := adapter.ConnectionConfigFromEntity(ds)
	return dbAdapter.Connect(ctx, cfg)
}

func (u *QueryUsecase) persistExecutionSuccess(ctx context.Context, messageID *uuid.UUID, sql string, result *QueryExecutionResult) {
	if messageID == nil {
		return
	}

	payload, err := json.Marshal(result)
	if err != nil {
		return
	}

	rowCount := result.RowCount
	elapsed := result.ExecutionTimeMs
	_, _ = u.generatorRepo.UpdateMessageExecution(ctx, &entity.GeneratorMessage{
		ID:              *messageID,
		EditedSQL:       sql,
		QueryResult:     payload,
		ExecutionTimeMs: &elapsed,
		RowCount:        &rowCount,
	})
}

func (u *QueryUsecase) persistExecutionError(ctx context.Context, messageID *uuid.UUID, sql string, elapsed int, execErr error) {
	if messageID == nil {
		return
	}

	translated := TranslateQueryError(execErr)
	message := translated.Error()
	_, _ = u.generatorRepo.UpdateMessageExecution(ctx, &entity.GeneratorMessage{
		ID:              *messageID,
		EditedSQL:       sql,
		ExecutionTimeMs: &elapsed,
		ErrorMessage:    message,
	})
}

func (u *QueryUsecase) recordHistory(
	ctx context.Context,
	datasourceID uuid.UUID,
	sql string,
	messageID *uuid.UUID,
	source string,
	rowCount *int,
	executionTimeMs *int,
	status string,
	errorMessage string,
	elapsed int,
) {
	if u.historyUsecase == nil {
		return
	}

	elapsedCopy := elapsed
	if executionTimeMs == nil {
		executionTimeMs = &elapsedCopy
	}

	if source == "" {
		source = entity.QueryHistorySourceGenerator
	}

	u.historyUsecase.RecordExecution(
		ctx,
		datasourceID,
		sql,
		u.resolveNaturalLanguagePrompt(ctx, messageID),
		source,
		executionTimeMs,
		rowCount,
		status,
		errorMessage,
	)
}

func (u *QueryUsecase) resolveNaturalLanguagePrompt(ctx context.Context, messageID *uuid.UUID) string {
	if messageID == nil {
		return ""
	}

	message, err := u.generatorRepo.GetMessageByID(ctx, *messageID)
	if err != nil {
		return ""
	}

	if message.Role == entity.MessageRoleUser {
		return message.Content
	}

	return ""
}

func toQueryExecutionResult(result *adapter.QueryResult, elapsed int) *QueryExecutionResult {
	columns := make([]QueryColumnResult, 0, len(result.Columns))
	for _, column := range result.Columns {
		columns = append(columns, QueryColumnResult{
			Name: column.Name,
			Type: column.Type,
		})
	}

	return &QueryExecutionResult{
		Columns:         columns,
		Rows:            result.Rows,
		RowCount:        result.RowCount,
		ExecutionTimeMs: elapsed,
		Truncated:       result.Truncated,
	}
}

