package entity

type Column struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	Nullable   bool   `json:"nullable"`
	PrimaryKey bool   `json:"primary_key,omitempty"`
	ForeignKey string `json:"foreign_key,omitempty"`
}

type Relation struct {
	Column           string `json:"column"`
	ReferencedTable  string `json:"referenced_table"`
	ReferencedColumn string `json:"referenced_column"`
	Type             string `json:"type"`
}

type TableSummary struct {
	Name          string `json:"name"`
	ColumnCount   int    `json:"column_count"`
	EstimatedRows *int64 `json:"estimated_rows,omitempty"`
}

type TableDetail struct {
	Name      string     `json:"name"`
	Columns   []Column   `json:"columns"`
	Relations []Relation `json:"relations"`
}

type SchemaCache struct {
	Dialect string        `json:"dialect"`
	Tables  []CachedTable `json:"tables"`
}

type CachedTable struct {
	Name          string     `json:"name"`
	ColumnCount   int        `json:"column_count"`
	EstimatedRows *int64     `json:"estimated_rows,omitempty"`
	Columns       []Column   `json:"columns"`
	Relations     []Relation `json:"relations"`
}

func (t CachedTable) ToDetail() TableDetail {
	return TableDetail{
		Name:      t.Name,
		Columns:   t.Columns,
		Relations: t.Relations,
	}
}

func (t CachedTable) ToSummary() TableSummary {
	return TableSummary{
		Name:          t.Name,
		ColumnCount:   t.ColumnCount,
		EstimatedRows: t.EstimatedRows,
	}
}