// Domain types for SQL AI (mirrors backend DTOs in datasource_dto.go).

export type DatasourceType = "postgresql" | "mysql";

export type SslMode = "disable" | "require" | "verify-full";

export type Datasource = {
  id: string;
  name: string;
  db_type: DatasourceType;
  host: string;
  port: number;
  database_name: string;
  username: string;
  is_active: boolean;
  table_count: number;
  created_at: string;
  updated_at?: string;
};

export type CreateDatasourceInput = {
  name: string;
  db_type: DatasourceType;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode: SslMode;
  max_connections?: number;
};

export type UpdateDatasourceInput = CreateDatasourceInput & {
  is_active: boolean;
};

export type TestConnectionResult = {
  success: boolean;
  message: string;
};

export type ApiFormat = "openai" | "anthropic";

export type AiProvider = {
  id: string;
  name: string;
  api_format: ApiFormat;
  base_url: string;
  model: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
};

export type CreateAiProviderInput = {
  name: string;
  api_format: ApiFormat;
  base_url: string;
  api_key: string;
  model: string;
  is_default?: boolean;
};

export type UpdateAiProviderInput = CreateAiProviderInput & {
  is_default: boolean;
};

export type TableSummary = {
  name: string;
  column_count: number;
  estimated_rows?: number;
};

export type SchemaColumn = {
  name: string;
  type: string;
  nullable: boolean;
  primary_key?: boolean;
  foreign_key?: string;
};

export type SchemaRelation = {
  column: string;
  referenced_table: string;
  referenced_column: string;
  type: string;
};

export type TableDetail = {
  name: string;
  columns: SchemaColumn[];
  relations: SchemaRelation[];
};

export type ListTablesResult = {
  datasource_id: string;
  tables: TableSummary[];
};

export type QueryColumn = {
  name: string;
  type: string;
};

export type QueryResult = {
  columns: QueryColumn[];
  rows: unknown[][];
  row_count: number;
};

export type QueryExecutionResponse = {
  columns: QueryColumn[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
  truncated: boolean;
};

export type ExecuteQueryInput = {
  sql: string;
  datasource_id: string;
  max_rows?: number;
  message_id?: string;
};

// Onboarding status derived from the data above.
export type SetupStatus = {
  hasDatasource: boolean;
  hasAiProvider: boolean;
};

export type MessageRole = "user" | "assistant" | "system";

export type GeneratorSession = {
  id: string;
  title?: string;
  datasource_id?: string;
  ai_provider_id?: string;
  created_at: string;
  updated_at: string;
};

export type AIMetadata = {
  provider_name: string;
  provider_id?: string;
  model: string;
  api_format: ApiFormat;
  dialect: string;
  context_tables: string[];
  available_tables_count: number;
  history_messages_count: number;
  context_windowed?: boolean;
  estimated_context_tokens: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type GeneratorMessage = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  generated_sql?: string;
  edited_sql?: string;
  query_result?: unknown;
  execution_time_ms?: number;
  row_count?: number;
  error_message?: string;
  referenced_tables?: string[];
  ai_metadata?: AIMetadata;
  created_at: string;
};

export type SessionDetail = {
  session: GeneratorSession;
  messages: GeneratorMessage[];
};

export type CreateSessionInput = {
  title?: string;
  datasource_id?: string;
  ai_provider_id?: string;
};

export type SendMessageInput = {
  content: string;
  tables?: string[];
  datasource_id?: string;
};

export type StreamDeltaEvent = {
  content: string;
};

export type StreamErrorEvent = {
  message: string;
};

export type QueryHistoryStatus = "success" | "failed";

export type SavedQuery = {
  id: string;
  name: string;
  description: string;
  sql_content: string;
  datasource_id?: string;
  tags: string[];
  generator_message_id?: string;
  created_at: string;
  updated_at: string;
};

export type CreateSavedQueryInput = {
  name: string;
  description?: string;
  sql_content: string;
  datasource_id?: string;
  tags?: string[];
  generator_message_id?: string;
};

export type UpdateSavedQueryInput = {
  name: string;
  description?: string;
  sql_content: string;
  datasource_id?: string;
  tags?: string[];
};

export type QueryHistorySource = "generator" | "editor";

export type QueryHistoryEntry = {
  id: string;
  datasource_id?: string;
  sql_content: string;
  natural_language_prompt?: string;
  execution_time_ms?: number;
  row_count?: number;
  status: QueryHistoryStatus;
  source?: QueryHistorySource;
  error_message?: string;
  created_at: string;
};

export type SqlEditorTabStatus = "success" | "failed" | "";

export type SqlEditorTab = {
  id: string;
  session_id?: string;
  name: string;
  sql_content: string;
  sort_order: number;
  last_result?: unknown;
  execution_time_ms?: number;
  row_count?: number;
  last_status?: SqlEditorTabStatus;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
};

export type SqlEditorSession = {
  id: string;
  name: string;
  datasource_id?: string;
  tabs?: SqlEditorTab[];
  created_at: string;
  updated_at?: string;
};

export type CreateSqlEditorSessionInput = {
  name?: string;
  datasource_id?: string;
};

export type UpdateSqlEditorSessionInput = {
  name?: string;
  datasource_id?: string;
};

export type CreateSqlEditorTabInput = {
  name?: string;
  sql_content?: string;
};

export type UpdateSqlEditorTabInput = {
  name: string;
  sql_content: string;
  sort_order?: number;
};

export type RunSqlEditorTabInput = {
  max_rows?: number;
  sql?: string;
};

export type SqlEditorAutocompleteColumn = {
  name: string;
  type: string;
};

export type SqlEditorAutocompleteTable = {
  name: string;
  columns: SqlEditorAutocompleteColumn[];
};

export type SqlEditorAutocomplete = {
  dialect: string;
  tables: SqlEditorAutocompleteTable[];
};

export type QueryHistoryPage = {
  items: QueryHistoryEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ChartType = "bar" | "line" | "pie" | "area";

export type ChartColorPalette = "default" | "warm" | "cool" | "mono";

export type ChartVisualConfig = {
  color_palette?: ChartColorPalette;
  colors?: Record<string, string>;
};

export type ChartConfigRecord = {
  id: string;
  saved_query_id?: string;
  generator_message_id?: string;
  sql_editor_tab_id?: string;
  chart_type: ChartType;
  x_axis_column: string;
  y_axis_columns: string[];
  category_column?: string;
  config: ChartVisualConfig;
  created_at: string;
  updated_at: string;
};

export type CreateChartConfigInput = {
  saved_query_id?: string;
  generator_message_id?: string;
  sql_editor_tab_id?: string;
  chart_type: ChartType;
  x_axis_column: string;
  y_axis_columns: string[];
  category_column?: string;
  config?: ChartVisualConfig;
};

export type UpdateChartConfigInput = {
  chart_type: ChartType;
  x_axis_column: string;
  y_axis_columns: string[];
  category_column?: string;
  config?: ChartVisualConfig;
};

export type ChartReferenceFilter = {
  saved_query_id?: string;
  generator_message_id?: string;
  sql_editor_tab_id?: string;
};
