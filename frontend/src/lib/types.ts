// Domain types for SQL AI (mirrors the API contract in PRD.md section 6).

export type DatasourceType = "postgresql" | "mysql";

export type Datasource = {
  id: string;
  name: string;
  dbType: DatasourceType;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  active: boolean;
  tableCount: number;
  createdAt: string;
};

export type ApiFormat = "openai" | "anthropic";

export type AiProvider = {
  id: string;
  name: string;
  apiFormat: ApiFormat;
  baseUrl: string;
  model: string;
  isDefault: boolean;
  createdAt: string;
};

// Onboarding status derived from the data above.
export type SetupStatus = {
  hasDatasource: boolean;
  hasAiProvider: boolean;
};
