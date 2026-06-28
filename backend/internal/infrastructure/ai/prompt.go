package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/nrmadi02/sql-ai/internal/domain/entity"
)

const (
	MaxHistoryMessages = 20
	SummarizeBatchSize = 5
)

type promptTableColumn struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Nullable bool   `json:"nullable,omitempty"`
	PK       bool   `json:"pk,omitempty"`
	FK       string `json:"fk,omitempty"`
}

type promptTable struct {
	Name    string              `json:"name"`
	Columns []promptTableColumn `json:"columns"`
}

type promptRelation struct {
	From string `json:"from"`
	To   string `json:"to"`
	Type string `json:"type"`
}

type promptContext struct {
	Dialect          string           `json:"dialect"`
	AvailableTables  []string         `json:"available_tables,omitempty"`
	ReferencedTables []string         `json:"referenced_tables,omitempty"`
	ContextTables    []string         `json:"context_tables,omitempty"`
	Tables           []promptTable    `json:"tables"`
	Relations        []promptRelation `json:"relations,omitempty"`
}

func BuildSQLSystemPrompt(input GenerateSQLInput) string {
	dialect := normalizeDialect(input.Dialect)
	contextJSON := marshalPromptContext(input, dialect)

	return fmt.Sprintf(`Kamu adalah ahli SQL untuk aplikasi SQL AI. Tugasmu menghasilkan query %s berdasarkan permintaan user.

Konteks database:
%s

Aturan:
- Hanya hasilkan query SELECT (read-only). Dilarang INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, dan perintah DDL/DML lainnya.
- Gunakan dialek %s secara konsisten.
- Gunakan nama tabel dan kolom persis seperti pada konteks schema di atas.
- Semua tabel yang tersedia ada di available_tables. Jangan katakan tabel tidak ada jika namanya ada di daftar itu.
- Detail kolom hanya tersedia untuk tabel di context_tables / tables. Cocokkan permintaan user ke tabel yang relevan dari available_tables.
- Jika user menyebut tabel lewat /{nama_tabel}, prioritaskan tabel yang direferensi.
- Berikan penjelasan singkat dalam Bahasa Indonesia pada field "content".
- Letakkan query SQL pada field "sql".
- Jawab dengan JSON valid tanpa markdown untuk respons utama, format:
{"content":"penjelasan dalam Bahasa Indonesia","sql":"SELECT ..."}
- Jangan awali respons dengan label seperti "chart" atau "json". Langsung mulai dari karakter { pada JSON utama.
- Jika permintaan tidak memerlukan SQL, set "sql" ke string kosong.
- Jika user meminta visualisasi (grafik, chart), tulis ulang query agar sesuai format grafik:
  - Pie: kategori + agregasi (COUNT/SUM)
  - Line/Area: kolom temporal di sumbu X + nilai numerik di sumbu Y
  - Bar: kategori atau temporal di sumbu X + nilai numerik di sumbu Y
  Jika query awal menghasilkan daftar datar tanpa agregasi (misal SELECT * FROM users), tulis ulang query dengan GROUP BY dan agregasi agar data bisa divisualisasikan, lalu jelaskan perubahan di "content".
- Setelah JSON utama (baris terpisah), sertakan konfigurasi grafik di blok kode chart:
`+"```chart\n"+`{"chart_type":"bar","x_axis_column":"bulan","y_axis_columns":["total"],"category_column":null}
`+"```"+`
  Blok chart hanya berisi chart_type, x_axis_column, y_axis_columns, dan category_column. Jangan ulangi content, sql, suggested_aggregations, atau suggested_filters di blok chart.
  Gunakan chart_type: bar, line, pie, atau area. Field category_column boleh null.
- Jika data sulit divisualisasikan atau terlalu banyak baris, sertakan field opsional di JSON utama:
  "suggested_aggregations":["saran agregasi dalam Bahasa Indonesia"],
  "suggested_filters":["saran filter dalam Bahasa Indonesia"]`,
		dialect,
		contextJSON,
		dialect,
	)
}

func marshalPromptContext(input GenerateSQLInput, dialect string) string {
	contextPayload := buildPromptContext(input, dialect)

	contextJSON, err := json.MarshalIndent(contextPayload, "", "  ")
	if err != nil {
		return "{}"
	}

	return string(contextJSON)
}

func buildPromptContext(input GenerateSQLInput, dialect string) promptContext {
	tables := make([]promptTable, 0, len(input.TableSchemas))
	relations := make([]promptRelation, 0)

	for _, table := range input.TableSchemas {
		columns := make([]promptTableColumn, 0, len(table.Columns))
		for _, column := range table.Columns {
			columns = append(columns, promptTableColumn{
				Name:     column.Name,
				Type:     column.Type,
				Nullable: column.Nullable,
				PK:       column.PrimaryKey,
				FK:       column.ForeignKey,
			})
		}

		tables = append(tables, promptTable{
			Name:    table.Name,
			Columns: columns,
		})

		for _, relation := range table.Relations {
			relations = append(relations, promptRelation{
				From: table.Name + "." + relation.Column,
				To:   relation.ReferencedTable + "." + relation.ReferencedColumn,
				Type: relation.Type,
			})
		}
	}

	return promptContext{
		Dialect:          dialect,
		AvailableTables:  input.AvailableTables,
		ReferencedTables: input.ReferencedTables,
		ContextTables:    input.ContextTables,
		Tables:           tables,
		Relations:        relations,
	}
}

func FilterConversationMessages(messages []*entity.GeneratorMessage) []*entity.GeneratorMessage {
	filtered := make([]*entity.GeneratorMessage, 0, len(messages))
	for _, message := range messages {
		if message == nil {
			continue
		}
		switch message.Role {
		case entity.MessageRoleUser, entity.MessageRoleAssistant:
			filtered = append(filtered, message)
		}
	}
	return filtered
}

func BuildConversationSummaryPrompt(existingSummary string, messages []ChatMessage) string {
	var builder strings.Builder

	builder.WriteString(`Ringkas percakapan berikut tentang pembuatan query SQL dalam Bahasa Indonesia.
Fokus pada: tabel yang dibahas, filter/aggregate yang diminta, dan perubahan iteratif antar pesan.
Maksimal 3 kalimat. Jangan sertakan SQL mentah.

`)

	existingSummary = strings.TrimSpace(existingSummary)
	if existingSummary != "" {
		builder.WriteString("Ringkasan sebelumnya:\n")
		builder.WriteString(existingSummary)
		builder.WriteString("\n\n")
	}

	builder.WriteString("Pesan yang perlu digabungkan:\n")
	for _, message := range messages {
		role := strings.TrimSpace(message.Role)
		content := strings.TrimSpace(message.Content)
		if role == "" || content == "" {
			continue
		}
		builder.WriteString(role)
		builder.WriteString(": ")
		builder.WriteString(content)
		builder.WriteString("\n")
	}

	builder.WriteString("\nJawab HANYA dengan teks ringkasan tanpa format tambahan.")
	return builder.String()
}

func FormatContextSummaryMessage(summary string) string {
	summary = strings.TrimSpace(summary)
	if summary == "" {
		return ""
	}
	return fmt.Sprintf("Ringkasan percakapan sebelumnya:\n%s", summary)
}

func normalizeDialect(dialect string) string {
	dialect = strings.TrimSpace(strings.ToLower(dialect))
	if dialect == "" {
		return "sql"
	}
	return dialect
}