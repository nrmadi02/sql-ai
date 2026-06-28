# PRD MVP: SQL AI Tools

> **Produk**: SQL AI — Natural Language to SQL untuk Stakeholder Non-Teknis
> **Stack**: Go (Backend) + Next.js (Frontend)
> **Target User**: Stakeholder bisnis yang tidak memahami SQL
> **Versi**: MVP v0.1 — Core Loop
> **Tanggal**: 26 Juni 2026

---

## 1. Ringkasan Produk

### 1.1 Problem Statement

Stakeholder bisnis sering membutuhkan data dari database tetapi bergantung pada tim engineering untuk menulis query. Proses ini lambat, menjadi bottleneck, dan tidak scalable. Dibutuhkan tools yang memungkinkan siapapun "berbicara" dengan database menggunakan bahasa natural, tanpa harus memahami SQL.

### 1.2 Solusi

**SQL AI** adalah tools berbasis chat yang memungkinkan user mengetikkan pertanyaan dalam bahasa Indonesia, lalu AI akan generate query SQL yang sesuai. User dapat melihat, mengedit, menjalankan, dan menyimpan query tersebut — semua dalam satu antarmuka yang sederhana.

### 1.3 Core Loop MVP

```
Connect DB → Baca Schema → Generator + /{tabel} → AI Generate SQL → Edit → Jalankan → Lihat Hasil → Simpan/Salin
```

---



## 2. Keputusan Teknis


| Keputusan          | Pilihan                                              | Alasan                                                                |
| ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------- |
| App Database       | PostgreSQL lokal via `DATABASE_URL`                  | Sudah tersedia di mesin developer, satu env variable cukup            |
| Arsitektur Backend | **Clean Architecture**                               | Separation of concerns yang jelas, mudah di-test, mudah di-extend     |
| Database Query     | **sqlc** (type-safe SQL → Go code)                   | Compile-time safety, tidak ada runtime reflection, performa optimal   |
| Database Migration | **golang-migrate** + **Makefile**                    | Migrasi versi-based, semua command via `make`                         |
| Frontend Framework | **Next.js 15** (latest, App Router)                  | SSR/SSG, routing bawaan, ecosystem besar                              |
| UI Components      | **shadcn/ui** + **Tailwind CSS**                     | Komponen berkualitas tinggi, customizable, accessible                 |
| Form & Validasi    | **React Hook Form** + **Zod**                        | Performa tinggi, validasi type-safe, integrasi shadcn/ui native       |
| Data Fetching      | **@tanstack/react-query**                            | Cache otomatis, refetch, optimistic update, SSE support               |
| Tabel Data         | **@tanstack/react-table**                            | Headless, sorting, filtering, pagination, column resize               |
| SQL Editor         | **@codemirror/lang-sql** + **@uiw/react-codemirror** | Syntax highlighting SQL, autocomplete, multi-dialect, ringan          |
| Autentikasi        | Tidak ada (single user)                              | MVP fokus ke fungsionalitas, auth ditambahkan di fase berikutnya      |
| Deployment         | Lokal (`go run` + `npm run dev`)                     | Belum perlu Docker, development speed lebih penting                   |
| AI Provider        | Custom input (nama, base URL, API key, model)        | Fleksibel — support format OpenAI-compatible dan Anthropic-compatible |
| Bahasa UI          | Full Bahasa Indonesia                                | Target user adalah stakeholder Indonesia                              |


---



## 3. Fitur MVP


| #    | Fitur                               | Prioritas   | Deskripsi                                                                                                                          |
| ---- | ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| F1   | **Multi-Database Connector**        | 🔴 Critical | Connect ke PostgreSQL dan MySQL. User input connection string/detail via form.                                                     |
| F2   | **Pembaca Schema**                  | 🔴 Critical | Baca semua tabel, kolom, tipe data, dan relasi dari datasource yang terhubung                                                      |
| F3   | **Callable Table (**`/{tabel}`**)** | 🔴 Critical | Di generator, user ketik `/{nama_tabel}` untuk menyertakan konteks tabel ke AI                                                     |
| F4   | **AI Generate Query**               | 🔴 Critical | Bahasa natural → SQL. AI memahami dialek database yang aktif                                                                       |
| F4a  | **Transparansi Konteks AI**         | 🟡 High     | Tampilkan provider, model, tabel konteks, dan penggunaan token per respons AI di generator                                         |
| F5   | **Custom AI Provider**              | 🔴 Critical | User mendaftarkan provider AI sendiri: nama, base URL, API key, model. Mendukung format OpenAI-compatible dan Anthropic-compatible |
| F6   | **Edit Query**                      | 🔴 Critical | User bisa mengedit SQL yang di-generate sebelum dijalankan                                                                         |
| F7   | **Jalankan Query**                  | 🔴 Critical | Eksekusi query ke datasource, tampilkan hasil sebagai tabel                                                                        |
| F8   | **Simpan Query**                    | 🟡 High     | Simpan query dengan nama, deskripsi, dan tag                                                                                       |
| F9   | **Salin Query**                     | 🟡 High     | Salin SQL ke clipboard dengan satu klik                                                                                            |
| F10  | **Riwayat Query**                   | 🟡 High     | Daftar semua query yang pernah dijalankan, lengkap dengan timestamp dan status                                                     |
| F11  | **SQL Editor Manual**               | 🟡 High     | Editor SQL standalone (tanpa AI) dengan autocomplete nama tabel, kolom, dan keyword SQL. Mendukung multi-tab, riwayat, dan simpan. |
| F11a | **Rename Sesi SQL Editor**          | 🟡 High     | User bisa mengganti nama sesi editor (bukan hanya "Sesi editor baru"). Inline di workspace + daftar sesi.                          |


---



## 4. Arsitektur



### 4.1 Clean Architecture

Backend menggunakan **Clean Architecture** dengan 4 layer konsentris. Dependency rule: layer dalam **tidak boleh** tahu tentang layer luar.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DELIVERY LAYER                           │
│            (HTTP Handler, Middleware, Router)                    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     USECASE LAYER                       │   │
│   │              (Business Logic / Service)                  │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │                DOMAIN LAYER                     │   │   │
│   │   │         (Entity, Repository Interface)          │   │   │
│   │   │                                                 │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│     (Repository Implementation, AI Client, DB Adapter,          │
│      sqlc Generated Code, External Services)                    │
└─────────────────────────────────────────────────────────────────┘
```

**Penjelasan setiap layer:**


| Layer              | Tanggung Jawab                                                | Contoh                                                               |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Domain**         | Entity (struct), Repository interface, error domain           | `Datasource`, `GeneratorSession`, `DatasourceRepository` (interface) |
| **Usecase**        | Business logic, orkestrasi antar repository                   | `DatasourceUsecase.Create()`, `GeneratorUsecase.SendMessage()`       |
| **Delivery**       | HTTP handler, request/response DTO, routing, middleware       | `DatasourceHandler.Create()`, CORS, logger                           |
| **Infrastructure** | Implementasi konkret repository (sqlc), AI client, DB adapter | `datasourceRepoImpl`, `OpenAIClient`, `PostgresAdapter`              |


**Dependency Rule:**

```
Domain       ← tidak depend ke siapapun
Usecase      ← depend ke Domain (interface)
Delivery     ← depend ke Usecase
Infrastructure ← depend ke Domain (implement interface)
```



### 4.2 Diagram Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  ┌───────────┐  │
│  │Generator │  │ Editor   │  │ Hasil  │  │ Pengaturan│  │SQL Editor │  │
│  │ + /{tabel}│  │ Query    │  │ Tabel  │  │ Datasource│  │ Manual    │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  │ & AI      │  │(tanpa AI) │  │
│       │              │            │       └─────┬─────┘  └─────┬─────┘  │
└───────┼──────────────┼────────────┼─────────────┼──────────────┼────────┘
        │              │            │             │              │
        ▼              ▼            ▼             ▼
┌──────────────────────────────────────────────────────────┐
│              Go Backend (Clean Architecture)              │
│                                                          │
│  Delivery:   [Handler] → [Middleware] → [Router]         │
│       │                                                  │
│  Usecase:    [DatasourceSvc] [GeneratorSvc] [QuerySvc] [AISvc]│
│       │                                                  │
│  Domain:     [Entity] [Repository Interface]              │
│       │                                                  │
│  Infra:      [sqlc Repo] [AI Client] [DB Adapter]        │
│                                                          │
└──────────┬─────────────────┬───────────────┬─────────────┘
           │                 │               │
           ▼                 ▼               ▼
    ┌──────────┐     ┌──────────────┐  ┌──────────────┐
    │ App DB   │     │ AI Provider  │  │ Target DB    │
    │ (PG via  │     │ (OpenAI/     │  │ (PG, MySQL,  │
    │ DATABASE │     │  Anthropic   │  │  dll)        │
    │ _URL)    │     │  compatible) │  │              │
    └──────────┘     └──────────────┘  └──────────────┘
```



### 4.3 Multi-Database Connector — Adapter Pattern

Setiap jenis database memiliki adapter sendiri yang mengimplementasi interface yang sama.

```
                    ┌─────────────────────┐
                    │  DatabaseAdapter     │
                    │  (interface)         │
                    │                     │
                    │  Connect()          │
                    │  Disconnect()       │
                    │  GetTables()        │
                    │  GetColumns()       │
                    │  GetRelations()     │
                    │  ExecuteQuery()     │
                    │  GetDialect()       │
                    │  Ping()             │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
           ┌────────┴───────┐   ┌────────┴───────┐
           │ PostgresAdapter│   │  MySQLAdapter   │
           │                │   │                 │
           │ dialect:       │   │ dialect:        │
           │ "postgresql"   │   │ "mysql"         │
           └────────────────┘   └─────────────────┘
```

**Cara kerja:**

1. Setiap jenis database punya adapter sendiri yang mengimplementasi interface `DatabaseAdapter`
2. `AdapterRegistry` menyimpan semua adapter yang terdaftar
3. Saat user menambahkan datasource baru, sistem memilih adapter berdasarkan `type` (postgres/mysql)
4. Pembacaan schema menggunakan `information_schema` (standard SQL) dengan penyesuaian per dialek jika perlu
5. **Extensible**: Untuk menambah database baru (misal SQLite, ClickHouse), cukup buat adapter baru

**Strategi Pembacaan Schema:**

```sql
-- PostgreSQL: information_schema + pg_catalog
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public';

-- MySQL: information_schema
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE();

-- Relasi (Foreign Keys) — kedua DB mendukung:
SELECT constraint_name, table_name, column_name,
       referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE referenced_table_name IS NOT NULL;
```



### 4.4 Custom AI Provider — Gateway Pattern

User mendaftarkan provider AI mereka sendiri melalui form pengaturan. Sistem mendukung dua format API:

**Format yang didukung:**


| Format               | Contoh Provider                                                            | Endpoint Pattern                 |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| OpenAI-compatible    | OpenAI, Groq, Together AI, LM Studio, Ollama (openai mode), vLLM, DeepSeek | `{base_url}/v1/chat/completions` |
| Anthropic-compatible | Anthropic, AWS Bedrock (Anthropic mode)                                    | `{base_url}/v1/messages`         |


**Alur pendaftaran provider:**

```
User mengisi form:
  ├── Nama Provider     : "OpenAI GPT-4o" (bebas, untuk display)
  ├── Format API        : "openai" atau "anthropic"
  ├── Base URL          : "https://api.openai.com" 
  ├── API Key           : "sk-xxxx..."
  └── Model             : "gpt-4o"

Sistem:
  1. Validasi format URL
  2. Enkripsi API key sebelum simpan
  3. Test koneksi ke provider
  4. Simpan ke database jika berhasil
```

**Contoh konfigurasi untuk berbagai provider:**

```
# OpenAI langsung
Nama     : OpenAI GPT-4o
Format   : openai
Base URL : https://api.openai.com
API Key  : sk-xxxx
Model    : gpt-4o

# Anthropic langsung
Nama     : Claude Sonnet
Format   : anthropic
Base URL : https://api.anthropic.com
API Key  : sk-ant-xxxx
Model    : claude-sonnet-4-20250514

# Ollama lokal (tanpa API key)
Nama     : Ollama Lokal
Format   : openai
Base URL : http://localhost:11434
API Key  : (kosong)
Model    : llama3

# Groq
Nama     : Groq Llama
Format   : openai
Base URL : https://api.groq.com/openai
API Key  : gsk_xxxx
Model    : llama-3.1-70b-versatile
```

**Context yang dikirim ke AI setiap request:**

```json
{
  "system_prompt": "Kamu adalah ahli SQL. Generate query {dialect} berdasarkan permintaan user. Jawab dalam Bahasa Indonesia...",
  "context": {
    "dialect": "postgresql",
    "tables": [
      {
        "name": "pesanan",
        "columns": [
          {"name": "id", "type": "bigint", "pk": true},
          {"name": "pelanggan_id", "type": "bigint", "fk": "pelanggan.id"},
          {"name": "total", "type": "decimal(10,2)"},
          {"name": "status", "type": "varchar(50)"},
          {"name": "dibuat_pada", "type": "timestamp"}
        ]
      }
    ],
    "relations": [
      {"from": "pesanan.pelanggan_id", "to": "pelanggan.id", "type": "many-to-one"}
    ]
  },
  "user_message": "tampilkan total penjualan per bulan tahun 2024",
  "conversation_history": ["..."]
}
```

---



## 5. Skema Database (App Database)

App database menggunakan **PostgreSQL lokal** via `DATABASE_URL` di file `.env`.

```
DATABASE_URL=postgres://user:password@localhost:5432/sqlai?sslmode=disable
```



### 5.0 Tooling: sqlc + golang-migrate

**golang-migrate** mengelola versi skema database (up/down migration).
**sqlc** membaca file `.sql` (query) dan menghasilkan **Go code yang type-safe** — tidak perlu tulis boilerplate `rows.Scan()` manual.

**Alur kerja:**

```
1. Tulis migration SQL       → backend/migrations/001_init.up.sql
2. Jalankan migrasi           → make migrate-up
3. Tulis query SQL            → backend/internal/infrastructure/sqlc/queries/*.sql
4. Generate Go code           → make sqlc-generate
5. Gunakan di repository impl → repo := sqlc.New(db)
```

**Contoh file query sqlc** (`datasource.sql`):

```sql
-- name: GetDatasource :one
SELECT * FROM datasources WHERE id = $1;

-- name: ListDatasources :many
SELECT * FROM datasources WHERE aktif = true ORDER BY dibuat_pada DESC;

-- name: CreateDatasource :one
INSERT INTO datasources (
    nama, tipe, host, port, nama_database,
    username, password_encrypted, ssl_mode, max_koneksi
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateDatasource :one
UPDATE datasources SET
    nama = $2, tipe = $3, host = $4, port = $5,
    nama_database = $6, username = $7, password_encrypted = $8,
    ssl_mode = $9, diperbarui_pada = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteDatasource :exec
DELETE FROM datasources WHERE id = $1;

-- name: UpdateSchemaCache :exec
UPDATE datasources SET
    cache_schema = $2, cache_schema_pada = NOW()
WHERE id = $1;
```

**Hasil generate sqlc** (otomatis, jangan diedit manual):

```go
// Auto-generated oleh sqlc — JANGAN EDIT
type Datasource struct {
    ID                pgtype.UUID
    Nama              string
    Tipe              string
    Host              string
    Port              int32
    NamaDatabase      string
    Username          string
    PasswordEncrypted string
    SslMode           pgtype.Text
    MaxKoneksi        pgtype.Int4
    Aktif             pgtype.Bool
    CacheSchema       []byte
    CacheSchemaPada   pgtype.Timestamp
    DibuatPada        pgtype.Timestamp
    DiperbaruiPada    pgtype.Timestamp
}

func (q *Queries) GetDatasource(ctx context.Context, id pgtype.UUID) (Datasource, error) { ... }
func (q *Queries) ListDatasources(ctx context.Context) ([]Datasource, error) { ... }
func (q *Queries) CreateDatasource(ctx context.Context, arg CreateDatasourceParams) (Datasource, error) { ... }
```

**Konfigurasi sqlc** (`sqlc.yaml`):

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "internal/infrastructure/sqlc/queries/"
    schema: "migrations/"
    gen:
      go:
        package: "sqlcgen"
        out: "internal/infrastructure/sqlc/generated"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_empty_slices: true
```



### 5.1 Tabel: datasources

Menyimpan koneksi ke database target user.

```sql
CREATE TABLE datasources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    tipe VARCHAR(50) NOT NULL,           -- 'postgresql', 'mysql'
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    nama_database VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,     -- dienkripsi sebelum disimpan
    ssl_mode VARCHAR(50) DEFAULT 'disable',
    max_koneksi INTEGER DEFAULT 5,
    aktif BOOLEAN DEFAULT true,
    cache_schema JSONB,                  -- cache schema untuk akses cepat
    cache_schema_pada TIMESTAMP,
    dibuat_pada TIMESTAMP DEFAULT NOW(),
    diperbarui_pada TIMESTAMP DEFAULT NOW()
);
```



### 5.2 Tabel: ai_providers

Menyimpan konfigurasi provider AI yang didaftarkan user.

```sql
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,            -- "OpenAI GPT-4o", "Claude Sonnet", dll
    format_api VARCHAR(50) NOT NULL,       -- 'openai' atau 'anthropic'
    base_url VARCHAR(500) NOT NULL,        -- "https://api.openai.com"
    api_key_encrypted TEXT,                -- null jika tidak perlu (misal Ollama lokal)
    model VARCHAR(255) NOT NULL,           -- "gpt-4o", "claude-sonnet-4-20250514"
    adalah_default BOOLEAN DEFAULT false,
    konfigurasi JSONB,                     -- config tambahan per provider
    dibuat_pada TIMESTAMP DEFAULT NOW(),
    diperbarui_pada TIMESTAMP DEFAULT NOW()
);
```



### 5.3 Tabel: generator_sessions

Menyimpan sesi generator (workspace pertanyaan ke SQL).

```sql
CREATE TABLE generator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(500),
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    dibuat_pada TIMESTAMP DEFAULT NOW(),
    diperbarui_pada TIMESTAMP DEFAULT NOW()
);
```



### 5.4 Tabel: generator_messages

Menyimpan pesan dalam sesi generator (user + AI).

```sql
CREATE TABLE generator_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES generator_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,            -- 'user', 'assistant', 'system'
    konten TEXT NOT NULL,                 -- pesan user atau respons AI
    sql_dihasilkan TEXT,                  -- SQL yang di-generate (null jika bukan respons query)
    sql_diedit TEXT,                      -- SQL setelah user edit (null jika tidak diedit)
    hasil_query JSONB,                   -- hasil query (max 1000 baris disimpan)
    waktu_eksekusi_ms INTEGER,           -- waktu eksekusi dalam milidetik
    jumlah_baris INTEGER,                -- jumlah baris hasil
    pesan_error TEXT,                    -- pesan error jika query gagal
    tabel_direferensi TEXT[],            -- tabel yang direferensi via /{tabel}
    ai_metadata JSONB,                   -- provider, model, konteks, token usage
    dibuat_pada TIMESTAMP DEFAULT NOW()
);
```



### 5.5 Tabel: saved_queries

Menyimpan query yang disimpan user.

```sql
CREATE TABLE saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    konten_sql TEXT NOT NULL,
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    tag TEXT[],
    generator_message_id UUID REFERENCES generator_messages(id),
    dibuat_pada TIMESTAMP DEFAULT NOW(),
    diperbarui_pada TIMESTAMP DEFAULT NOW()
);
```



### 5.6 Tabel: query_history

Riwayat semua query yang pernah dijalankan.

> **Implementasi:** Kolom DB dan field JSON API memakai penamaan Inggris (konsisten dengan sprint 1–5). Nilai `source`: `'generator'` (dari AI generator) atau `'editor'` (dari SQL Editor manual). Nilai `status`: `'success'` atau `'failed'`.

```sql
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    sql_content TEXT NOT NULL,
    natural_language_prompt TEXT,         -- prompt asli user (null dari editor)
    source VARCHAR(20) NOT NULL DEFAULT 'generator',  -- 'generator' atau 'editor'
    execution_time_ms INTEGER,
    row_count INTEGER,
    status VARCHAR(20) NOT NULL,          -- 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_query_history_datasource ON query_history(datasource_id, created_at DESC);
CREATE INDEX idx_query_history_source ON query_history(source, created_at DESC);
```

> **Migrasi:** Tabel awal di `000005_init_query_history`; kolom `source` ditambahkan di `000008_add_query_history_source`.



### 5.7 Tabel: sql_editor_sessions

Menyimpan sesi SQL Editor manual (tanpa AI). Setiap sesi berisi satu atau lebih tab editor.

> **Implementasi:** Migrasi `000007_init_sql_editor`. Saat `POST /sql-editor/sessions`, backend otomatis membuat satu tab default (`Query 1`).

```sql
CREATE TABLE sql_editor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'New Session',
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```



### 5.8 Tabel: sql_editor_tabs

Menyimpan tab individu dalam sesi SQL Editor. Setiap tab berisi konten SQL, hasil terakhir, dan metadata eksekusi.

```sql
CREATE TABLE sql_editor_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sql_editor_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Query 1',
    sql_content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,     -- urutan tab dalam sesi
    last_result JSONB,                         -- hasil eksekusi terakhir (kolom + baris)
    execution_time_ms INTEGER,                 -- waktu eksekusi terakhir
    row_count INTEGER,                         -- jumlah baris hasil terakhir
    last_status VARCHAR(20),                   -- 'success', 'failed', null (belum dijalankan)
    error_message TEXT,                        -- pesan error terakhir
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```



### 5.9 Index

```sql
CREATE INDEX idx_generator_messages_session ON generator_messages(session_id, created_at);
CREATE INDEX idx_query_history_datasource ON query_history(datasource_id, created_at DESC);
CREATE INDEX idx_query_history_source ON query_history(source, created_at DESC);
CREATE INDEX idx_saved_queries_datasource ON saved_queries(datasource_id);
CREATE INDEX idx_saved_queries_tag ON saved_queries USING GIN(tags);
CREATE INDEX idx_sql_editor_tabs_session ON sql_editor_tabs(session_id, sort_order);
CREATE INDEX idx_sql_editor_sessions_datasource ON sql_editor_sessions(datasource_id);
```

---



## 6. Kontrak API



### 6.1 Manajemen Datasource


| Method   | Endpoint                       | Deskripsi               |
| -------- | ------------------------------ | ----------------------- |
| `POST`   | `/api/v1/datasources`          | Tambah datasource baru  |
| `GET`    | `/api/v1/datasources`          | Daftar semua datasource |
| `GET`    | `/api/v1/datasources/:id`      | Detail datasource       |
| `PUT`    | `/api/v1/datasources/:id`      | Perbarui datasource     |
| `DELETE` | `/api/v1/datasources/:id`      | Hapus datasource        |
| `POST`   | `/api/v1/datasources/:id/test` | Tes koneksi             |
| `POST`   | `/api/v1/datasources/:id/sync` | Refresh cache schema    |


**Contoh Request — Tambah Datasource:**

```json
POST /api/v1/datasources
{
  "nama": "Database Produksi",
  "tipe": "postgresql",
  "host": "localhost",
  "port": 5432,
  "nama_database": "toko_online",
  "username": "readonly_user",
  "password": "rahasia123",
  "ssl_mode": "disable"
}
```

**Contoh Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nama": "Database Produksi",
  "tipe": "postgresql",
  "host": "localhost",
  "port": 5432,
  "nama_database": "toko_online",
  "aktif": true,
  "tabel_count": 15,
  "dibuat_pada": "2026-06-26T21:00:00Z"
}
```



### 6.2 Schema


| Method | Endpoint                                       | Deskripsi                    |
| ------ | ---------------------------------------------- | ---------------------------- |
| `GET`  | `/api/v1/datasources/:id/tables`               | Daftar semua tabel           |
| `GET`  | `/api/v1/datasources/:id/tables/:nama`         | Detail tabel (kolom, relasi) |
| `GET`  | `/api/v1/datasources/:id/tables/:nama/preview` | Preview data (LIMIT 50)      |


**Contoh Response — Daftar Tabel:**

```json
{
  "datasource_id": "550e8400-...",
  "tabel": [
    {
      "nama": "pesanan",
      "jumlah_kolom": 8,
      "estimasi_baris": 15000
    },
    {
      "nama": "pelanggan",
      "jumlah_kolom": 6,
      "estimasi_baris": 3200
    }
  ]
}
```

**Contoh Response — Detail Tabel:**

```json
{
  "nama": "pesanan",
  "kolom": [
    {"nama": "id", "tipe": "bigint", "nullable": false, "primary_key": true},
    {"nama": "pelanggan_id", "tipe": "bigint", "nullable": false, "foreign_key": "pelanggan.id"},
    {"nama": "total", "tipe": "decimal(10,2)", "nullable": false},
    {"nama": "status", "tipe": "varchar(50)", "nullable": false},
    {"nama": "dibuat_pada", "tipe": "timestamp", "nullable": false}
  ],
  "relasi": [
    {"kolom": "pelanggan_id", "tabel_referensi": "pelanggan", "kolom_referensi": "id", "tipe": "many-to-one"}
  ]
}
```



### 6.3 AI Provider


| Method   | Endpoint                        | Deskripsi          |
| -------- | ------------------------------- | ------------------ |
| `POST`   | `/api/v1/ai-providers`          | Tambah provider AI |
| `GET`    | `/api/v1/ai-providers`          | Daftar provider    |
| `PUT`    | `/api/v1/ai-providers/:id`      | Perbarui provider  |
| `DELETE` | `/api/v1/ai-providers/:id`      | Hapus provider     |
| `POST`   | `/api/v1/ai-providers/:id/test` | Tes koneksi AI     |


**Contoh Request — Tambah Provider:**

```json
POST /api/v1/ai-providers
{
  "nama": "OpenAI GPT-4o",
  "format_api": "openai",
  "base_url": "https://api.openai.com",
  "api_key": "sk-xxxx...",
  "model": "gpt-4o"
}
```



### 6.4 Generator & Query


| Method   | Endpoint                                  | Deskripsi                |
| -------- | ----------------------------------------- | ------------------------ |
| `POST`   | `/api/v1/generator/sessions`              | Buat sesi generator baru |
| `GET`    | `/api/v1/generator/sessions`              | Daftar sesi              |
| `GET`    | `/api/v1/generator/sessions/:id`          | Detail sesi dengan pesan |
| `DELETE` | `/api/v1/generator/sessions/:id`          | Hapus sesi               |
| `POST`   | `/api/v1/generator/sessions/:id/messages` | Kirim pesan (trigger AI) |


**Contoh Request — Kirim Pesan:**

```json
POST /api/v1/generator/sessions/:id/messages
{
  "konten": "tampilkan total penjualan per bulan tahun 2024",
  "tabel": ["pesanan", "pelanggan"],
  "datasource_id": "550e8400-..."
}
```

**SSE Events (urutan):**


| Event          | Deskripsi                                                                             |
| -------------- | ------------------------------------------------------------------------------------- |
| `user_message` | Pesan user tersimpan                                                                  |
| `meta`         | Metadata AI sebelum streaming: provider, model, dialek, tabel konteks, estimasi token |
| `delta`        | Potongan teks respons AI                                                              |
| `done`         | Pesan assistant final lengkap dengan `ai_metadata` (termasuk token aktual)            |
| `error`        | Gagal generate                                                                        |


**Contoh Event** `meta`**:**

```json
{
  "provider_name": "OpenAI GPT-4o",
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "model": "gpt-4o",
  "api_format": "openai",
  "dialect": "postgresql",
  "context_tables": ["pesanan", "pelanggan"],
  "available_tables_count": 15,
  "history_messages_count": 2,
  "estimated_context_tokens": 1840
}
```

**Contoh Event** `done`**:**

```json
{
  "id": "msg-uuid",
  "role": "assistant",
  "konten": "Berikut query untuk menampilkan total penjualan per bulan di tahun 2024:",
  "sql_dihasilkan": "SELECT DATE_TRUNC('month', dibuat_pada) AS bulan, SUM(total) AS total_penjualan FROM pesanan WHERE EXTRACT(YEAR FROM dibuat_pada) = 2024 GROUP BY bulan ORDER BY bulan;",
  "tabel_direferensi": ["pesanan"],
  "ai_metadata": {
    "provider_name": "OpenAI GPT-4o",
    "model": "gpt-4o",
    "api_format": "openai",
    "dialect": "postgresql",
    "context_tables": ["pesanan", "pelanggan"],
    "available_tables_count": 15,
    "history_messages_count": 2,
    "estimated_context_tokens": 1840,
    "prompt_tokens": 1820,
    "completion_tokens": 96,
    "total_tokens": 1916
  }
}
```



### 6.5 Eksekusi Query


| Method | Endpoint                | Deskripsi                       |
| ------ | ----------------------- | ------------------------------- |
| `POST` | `/api/v1/query/execute` | Jalankan query                  |
| `POST` | `/api/v1/query/explain` | Explain query (EXPLAIN ANALYZE) |


**Contoh Request — Jalankan Query:**

```json
POST /api/v1/query/execute
{
  "sql": "SELECT DATE_TRUNC('month', dibuat_pada) AS bulan, SUM(total) AS total_penjualan FROM pesanan WHERE EXTRACT(YEAR FROM dibuat_pada) = 2024 GROUP BY bulan ORDER BY bulan;",
  "datasource_id": "550e8400-...",
  "maks_baris": 1000
}
```

**Contoh Response:**

```json
{
  "kolom": [
    {"nama": "bulan", "tipe": "timestamp"},
    {"nama": "total_penjualan", "tipe": "numeric"}
  ],
  "baris": [
    ["2024-01-01T00:00:00Z", 15000000],
    ["2024-02-01T00:00:00Z", 18500000],
    ["2024-03-01T00:00:00Z", 22000000]
  ],
  "jumlah_baris": 12,
  "waktu_eksekusi_ms": 45,
  "terpotong": false
}
```



### 6.6 Simpan & Riwayat


| Method   | Endpoint                    | Deskripsi                  |
| -------- | --------------------------- | -------------------------- |
| `POST`   | `/api/v1/saved-queries`     | Simpan query               |
| `GET`    | `/api/v1/saved-queries`     | Daftar query tersimpan     |
| `GET`    | `/api/v1/saved-queries/:id` | Detail query tersimpan     |
| `PUT`    | `/api/v1/saved-queries/:id` | Perbarui query tersimpan   |
| `DELETE` | `/api/v1/saved-queries/:id` | Hapus query tersimpan      |
| `GET`    | `/api/v1/query-history`     | Daftar riwayat (berpagina) |
| `GET`    | `/api/v1/query-history/:id` | Detail riwayat             |




### 6.7 SQL Editor Manual

Endpoint untuk mengelola sesi SQL Editor manual (tanpa AI). Editor ini memungkinkan user menulis SQL secara langsung dengan bantuan autocomplete.


| Method   | Endpoint                                                 | Deskripsi                                     |
| -------- | -------------------------------------------------------- | --------------------------------------------- |
| `POST`   | `/api/v1/sql-editor/sessions`                            | Buat sesi editor baru                         |
| `GET`    | `/api/v1/sql-editor/sessions`                            | Daftar semua sesi editor                      |
| `GET`    | `/api/v1/sql-editor/sessions/:id`                        | Detail sesi editor (termasuk semua tab)       |
| `PUT`    | `/api/v1/sql-editor/sessions/:id`                        | Perbarui sesi (nama, datasource)              |
| `DELETE` | `/api/v1/sql-editor/sessions/:id`                        | Hapus sesi editor                             |
| `POST`   | `/api/v1/sql-editor/sessions/:id/tabs`                   | Tambah tab baru                               |
| `PUT`    | `/api/v1/sql-editor/sessions/:sessionId/tabs/:tabId`     | Perbarui tab (nama, konten SQL)               |
| `DELETE` | `/api/v1/sql-editor/sessions/:sessionId/tabs/:tabId`     | Hapus tab                                     |
| `POST`   | `/api/v1/sql-editor/sessions/:sessionId/tabs/:tabId/run` | Jalankan query dari tab (POST /query/execute) |
| `GET`    | `/api/v1/sql-editor/autocomplete/:datasourceId`          | Data autocomplete (tabel, kolom, keyword)     |


**Contoh Request — Buat Sesi Editor:**

```json
POST /api/v1/sql-editor/sessions
{
  "name": "Analisis Penjualan",
  "datasource_id": "550e8400-..."
}
```

**Contoh Response — Detail Sesi (dengan tab):**

```json
{
  "id": "660e8400-...",
  "name": "Analisis Penjualan",
  "datasource_id": "550e8400-...",
  "tabs": [
    {
      "id": "770e8400-...",
      "name": "Query 1",
      "sql_content": "SELECT * FROM pesanan LIMIT 10;",
      "sort_order": 0,
      "last_status": "success",
      "execution_time_ms": 23,
      "row_count": 10
    },
    {
      "id": "880e8400-...",
      "name": "Query 2",
      "sql_content": "",
      "sort_order": 1,
      "last_status": null
    }
  ],
  "created_at": "2026-06-27T10:00:00Z"
}
```

**Contoh Request — Jalankan Query dari Tab:**

```json
POST /api/v1/sql-editor/sessions/:sessionId/tabs/:tabId/run
{
  "max_rows": 1000
}
```

> **Catatan:** Endpoint `run` secara internal memanggil logika yang sama dengan `POST /query/execute` (termasuk read-only enforcement, query guard, timeout). Hasil eksekusi otomatis tersimpan ke `query_history` dengan `source = 'editor'` dan ke `sql_editor_tabs` (`last_result`, `execution_time_ms`, `last_status`). Filter riwayat editor: `GET /query-history?source=editor`.

**Contoh Response — Autocomplete Data:**

```json
GET /api/v1/sql-editor/autocomplete/550e8400-...
{
  "dialect": "postgresql",
  "tables": [
    {
      "name": "pesanan",
      "columns": [
        {"name": "id", "type": "bigint"},
        {"name": "pelanggan_id", "type": "bigint"},
        {"name": "total", "type": "decimal(10,2)"},
        {"name": "status", "type": "varchar(50)"},
        {"name": "created_at", "type": "timestamp"}
      ]
    },
    {
      "name": "pelanggan",
      "columns": [
        {"name": "id", "type": "bigint"},
        {"name": "name", "type": "varchar(255)"},
        {"name": "email", "type": "varchar(255)"}
      ]
    }
  ]
}
```

> **Catatan:** Autocomplete memerlukan schema cache datasource (`POST /datasources/:id/sync`). Keyword dan fungsi SQL ditangani di frontend (CodeMirror), bukan endpoint ini.

---



## 7. Alur Pengguna — Core Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALUR PENGGUNA MVP                           │
└─────────────────────────────────────────────────────────────────────┘

 Pengguna                Frontend                Backend              AI Provider         Database Target
    │                       │                       │                      │                    │
    │  1. Buka Pengaturan   │                       │                      │                    │
    │──────────────────────>│                       │                      │                    │
    │                       │                       │                      │                    │
    │  2. Isi detail DB     │                       │                      │                    │
    │  (host, port, dll)    │  POST /datasources    │                      │                    │
    │──────────────────────>│──────────────────────>│                      │                    │
    │                       │                       │   Tes koneksi        │                    │
    │                       │                       │─────────────────────────────────────────-->│
    │                       │                       │   Baca schema        │                    │
    │                       │                       │─────────────────────────────────────────-->│
    │                       │                       │<──────────────────────────────────────────│
    │                       │<──────────────────────│   Schema ter-cache   │                    │
    │  Datasource tersimpan │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
    │                       │                       │                      │                    │
    │  3. Daftarkan AI      │                       │                      │                    │
    │  (nama, URL, key,     │  POST /ai-providers   │                      │                    │
    │   model)              │──────────────────────>│   Tes koneksi AI     │                    │
    │──────────────────────>│                       │─────────────────────>│                    │
    │                       │                       │<─────────────────────│                    │
    │                       │<──────────────────────│                      │                    │
    │  Provider tersimpan   │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
    │                       │                       │                      │                    │
    │  4. Buka Generator    │                       │                      │                    │
    │──────────────────────>│  POST /generator/sessions│                     │                    │
    │                       │──────────────────────>│                      │                    │
    │                       │<──────────────────────│                      │                    │
    │                       │                       │                      │                    │
    │  5. Ketik:            │                       │                      │                    │
    │  "/pesanan tampilkan  │                       │                      │                    │
    │   total per bulan"    │                       │                      │                    │
    │──────────────────────>│  Parse /{tabel}       │                      │                    │
    │                       │  → "pesanan"          │                      │                    │
    │                       │                       │                      │                    │
    │                       │  POST /messages       │                      │                    │
    │                       │──────────────────────>│  Muat schema         │                    │
    │                       │                       │  "pesanan"           │                    │
    │                       │                       │                      │                    │
    │                       │                       │  Kirim prompt +      │                    │
    │                       │                       │  schema + dialek     │                    │
    │                       │                       │─────────────────────>│                    │
    │                       │   SSE streaming       │<─────────────────────│                    │
    │                       │<──────────────────────│  SQL ter-generate    │                    │
    │  6. Lihat SQL         │                       │                      │                    │
    │  di editor            │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
    │                       │                       │                      │                    │
    │  7. (Opsional)        │                       │                      │                    │
    │  Edit SQL             │                       │                      │                    │
    │──────────────────────>│                       │                      │                    │
    │                       │                       │                      │                    │
    │  8. Klik "Jalankan"   │  POST /query/execute  │                      │                    │
    │──────────────────────>│──────────────────────>│  Eksekusi SQL        │                    │
    │                       │                       │  (READ-ONLY tx)      │                    │
    │                       │                       │─────────────────────────────────────────-->│
    │                       │                       │<──────────────────────────────────────────│
    │                       │<──────────────────────│  Simpan ke riwayat   │                    │
    │  9. Lihat hasil       │                       │                      │                    │
    │  dalam tabel          │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
    │                       │                       │                      │                    │
    │  10. Klik "Simpan"    │  POST /saved-queries  │                      │                    │
    │  (isi nama + tag)     │──────────────────────>│                      │                    │
    │──────────────────────>│<──────────────────────│                      │                    │
    │  Tersimpan ✅          │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
    │                       │                       │                      │                    │
    │  11. Klik "Salin"     │                       │                      │                    │
    │──────────────────────>│  Copy ke clipboard    │                      │                    │
    │  SQL tersalin ✅       │                       │                      │                    │
    │<──────────────────────│                       │                      │                    │
```

---



## 8. Keamanan Query



### 8.1 Read-Only Enforcement

Semua query yang dijalankan oleh user akan di-wrap dalam **read-only transaction**:

```go
tx, _ := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
defer tx.Rollback()
rows, err := tx.QueryContext(ctx, userSQL)
```



### 8.2 SQL Injection Prevention

Selain read-only transaction, ada validasi di level middleware **sebelum** query dikirim ke database:

```
Daftar keyword yang DITOLAK:
- DELETE
- UPDATE
- INSERT
- DROP
- ALTER
- TRUNCATE
- CREATE
- GRANT
- REVOKE
```

Jika query mengandung keyword di atas, sistem menolak dengan pesan error yang jelas dalam Bahasa Indonesia.

### 8.3 Batas Baris

Semua query otomatis mendapat `LIMIT 1000` jika user tidak menentukan limit sendiri.

### 8.4 Timeout Query

Default timeout: **30 detik**. Jika query melebihi timeout, koneksi di-cancel dan user mendapat pesan error.

### 8.5 Enkripsi Password

Password datasource dan API key dienkripsi menggunakan **AES-256-GCM** sebelum disimpan ke database. Encryption key disimpan di environment variable `ENCRYPTION_KEY`.

---



## 9. Struktur Proyek (Clean Architecture)

```
sql-ai/
├── docs/
│   └── PRD.md                            ← Dokumen ini
│
├── backend/                               # Go Backend (Clean Architecture)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go                    # Entry point + dependency injection
│   │
│   ├── internal/
│   │   ├── domain/                        # ══ LAYER 1: DOMAIN (terdalam) ══
│   │   │   │                              # Entity + Repository Interface
│   │   │   │                              # TIDAK depend ke layer manapun
│   │   │   │
│   │   │   ├── entity/                    # Struct entity bisnis
│   │   │   │   ├── datasource.go          # Datasource entity
│   │   │   │   ├── ai_provider.go         # AIProvider entity
│   │   │   │   ├── generator.go           # GeneratorSession, GeneratorMessage entity
│   │   │   │   ├── query.go               # SavedQuery, QueryHistory entity
│   │   │   │   ├── schema.go              # Table, Column, Relation entity
│   │   │   │   └── sql_editor.go          # SqlEditorSession, SqlEditorTab entity
│   │   │   │
│   │   │   └── repository/                # Interface repository (kontrak)
│   │   │       ├── datasource_repo.go     # DatasourceRepository interface
│   │   │       ├── ai_provider_repo.go    # AIProviderRepository interface
│   │   │       ├── generator_repo.go      # GeneratorRepository interface
│   │   │       ├── query_repo.go          # SavedQueryRepository interface
│   │   │       ├── history_repo.go        # QueryHistoryRepository interface
│   │   │       └── sql_editor_repo.go     # SqlEditorRepository interface
│   │   │
│   │   ├── usecase/                       # ══ LAYER 2: USECASE ══
│   │   │   │                              # Business logic / orchestration
│   │   │   │                              # Depend ke: domain
│   │   │   │
│   │   │   ├── datasource_usecase.go      # CRUD datasource + test koneksi
│   │   │   ├── schema_usecase.go          # Baca schema dari target DB
│   │   │   ├── ai_provider_usecase.go     # CRUD AI provider + test koneksi
│   │   │   ├── generator_usecase.go       # Kirim pesan, generate SQL via AI
│   │   │   ├── query_usecase.go           # Eksekusi query, simpan, salin
│   │   │   ├── history_usecase.go         # Riwayat query
│   │   │   └── sql_editor_usecase.go      # CRUD sesi editor, tab, eksekusi query manual
│   │   │
│   │   ├── delivery/                      # ══ LAYER 3: DELIVERY ══
│   │   │   │                              # HTTP handler, request/response DTO
│   │   │   │                              # Depend ke: usecase
│   │   │   │
│   │   │   └── http/
│   │   │       ├── router.go              # Setup semua route
│   │   │       ├── middleware/
│   │   │       │   ├── cors.go
│   │   │       │   ├── logger.go
│   │   │       │   ├── error_handler.go
│   │   │       │   └── query_guard.go     # Validasi keyword berbahaya
│   │   │       ├── handler/
│   │   │       │   ├── datasource_handler.go
│   │   │       │   ├── schema_handler.go
│   │   │       │   ├── ai_provider_handler.go
│   │   │       │   ├── generator_handler.go
│   │   │       │   ├── query_handler.go
│   │   │       │   ├── history_handler.go
│   │   │       │   └── sql_editor_handler.go
│   │   │       └── dto/                   # Request/Response struct (DTO)
│   │   │           ├── datasource_dto.go
│   │   │           ├── ai_provider_dto.go
│   │   │           ├── generator_dto.go
│   │   │           ├── query_dto.go
│   │   │           └── sql_editor_dto.go
│   │   │
│   │   └── infrastructure/                # ══ LAYER 4: INFRASTRUCTURE ══
│   │       │                              # Implementasi konkret
│   │       │                              # Depend ke: domain (implement interface)
│   │       │
│   │       ├── config/
│   │       │   └── config.go              # Baca env, konfigurasi app
│   │       │
│   │       ├── database/
│   │       │   └── postgres.go            # Koneksi pgx pool ke app DB
│   │       │
│   │       ├── sqlc/                      # ── sqlc type-safe queries ──
│   │       │   ├── queries/               # File .sql yang ditulis manual
│   │       │   │   ├── datasource.sql
│   │       │   │   ├── ai_provider.sql
│   │       │   │   ├── generator.sql
│   │       │   │   ├── saved_query.sql
│   │       │   │   ├── query_history.sql
│   │       │   │   └── sql_editor.sql
│   │       │   └── generated/             # Auto-generated oleh sqlc (JANGAN EDIT)
│   │       │       ├── db.go
│   │       │       ├── models.go
│   │       │       ├── datasource.sql.go
│   │       │       ├── ai_provider.sql.go
│   │       │       ├── generator.sql.go
│   │       │       ├── saved_query.sql.go
│   │       │       ├── query_history.sql.go
│   │       │       └── sql_editor.sql.go
│   │       │
│   │       ├── repository/                # Implementasi domain repository
│   │       │   ├── datasource_repo_impl.go    # implements DatasourceRepository
│   │       │   ├── ai_provider_repo_impl.go   # implements AIProviderRepository
│   │       │   ├── generator_repo_impl.go     # implements GeneratorRepository
│   │       │   ├── query_repo_impl.go         # implements SavedQueryRepository
│   │       │   ├── history_repo_impl.go       # implements QueryHistoryRepository
│   │       │   └── sql_editor_repo_impl.go    # implements SqlEditorRepository
│   │       │
│   │       ├── adapter/                   # Adapter untuk target database user
│   │       │   ├── adapter.go             # DatabaseAdapter interface
│   │       │   ├── registry.go            # AdapterRegistry
│   │       │   ├── postgres.go            # PostgresAdapter
│   │       │   └── mysql.go               # MySQLAdapter
│   │       │
│   │       ├── ai/                        # AI provider client
│   │       │   ├── gateway.go             # AIGateway (pilih provider)
│   │       │   ├── openai_compat.go       # Client format OpenAI-compatible
│   │       │   ├── anthropic_compat.go    # Client format Anthropic-compatible
│   │       │   └── prompt.go              # Template prompt SQL
│   │       │
│   │       └── encryption/
│   │           └── aes.go                 # AES-256-GCM encrypt/decrypt
│   │
│   ├── migrations/                        # golang-migrate SQL files
│   │   ├── 000001_init_datasources.up.sql
│   │   ├── 000001_init_datasources.down.sql
│   │   ├── 000002_init_ai_providers.up.sql
│   │   ├── 000002_init_ai_providers.down.sql
│   │   ├── 000003_init_generator.up.sql
│   │   ├── 000003_init_generator.down.sql
│   │   ├── 000004_init_saved_queries.up.sql
│   │   ├── 000004_init_saved_queries.down.sql
│   │   ├── 000005_init_query_history.up.sql
│   │   ├── 000005_init_query_history.down.sql
│   │   ├── 000006_generator_message_ai_metadata.up.sql
│   │   ├── 000006_generator_message_ai_metadata.down.sql
│   │   ├── 000007_init_sql_editor.up.sql
│   │   ├── 000007_init_sql_editor.down.sql
│   │   ├── 000008_add_query_history_source.up.sql
│   │   └── 000008_add_query_history_source.down.sql
│   │
│   │
│   ├── sqlc.yaml                          # Konfigurasi sqlc
│   ├── go.mod
│   ├── go.sum
│   └── Makefile                           # Semua command development
│
├── frontend/                              # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                   # Landing page marketing
│   │   │   ├── (app)/
│   │   │   │   ├── generator/
│   │   │   │   │   ├── page.tsx           # Entry point app (/generator)
│   │   │   │   │   └── [sessionId]/
│   │   │   │   │       └── page.tsx       # Sesi generator aktif
│   │   │   │   ├── sql-editor/
│   │   │   │   │   ├── page.tsx           # Entry point SQL Editor (/sql-editor)
│   │   │   │   │   └── [sessionId]/
│   │   │   │   │       └── page.tsx       # Sesi editor aktif
│   │   │   │   ├── settings/
│   │   │   │   │   ├── datasources/
│   │   │   │   │   │   └── page.tsx       # Kelola datasource
│   │   │   │   │   └── ai-providers/
│   │   │   │   │       └── page.tsx       # Kelola AI provider
│   │   │   ├── riwayat/
│   │   │   │   └── page.tsx               # Riwayat query
│   │   │   └── tersimpan/
│   │   │       └── page.tsx               # Query tersimpan
│   │   ├── components/
│   │   │   ├── generator/
│   │   │   │   ├── GeneratorInput.tsx      # Input dengan /{tabel} autocomplete
│   │   │   │   ├── GeneratorMessage.tsx    # Komponen pesan
│   │   │   │   ├── GeneratorWindow.tsx     # Jendela generator
│   │   │   │   └── TableMention.tsx        # Komponen chip /{tabel}
│   │   │   ├── query/
│   │   │   │   ├── QueryEditor.tsx         # Editor SQL (Monaco/CodeMirror)
│   │   │   │   ├── QueryResult.tsx         # Tabel hasil
│   │   │   │   └── QueryActions.tsx        # Tombol Jalankan, Simpan, Salin
│   │   │   ├── sql-editor/
│   │   │   │   ├── SqlEditorWorkspace.tsx  # Workspace utama editor (multi-tab)
│   │   │   │   ├── SqlEditorTabBar.tsx     # Tab bar (buat, tutup, rename tab)
│   │   │   │   ├── SqlEditorPane.tsx       # Panel editor + hasil per tab
│   │   │   │   ├── SqlEditorToolbar.tsx    # Toolbar (Jalankan, Simpan, Salin, Format)
│   │   │   │   ├── SqlEditorSidebar.tsx    # Sidebar schema browser (tabel + kolom)
│   │   │   │   └── SqlEditorHistory.tsx    # Panel riwayat query editor
│   │   │   ├── datasource/
│   │   │   │   ├── DatasourceForm.tsx      # Form tambah/edit datasource
│   │   │   │   └── DatasourceList.tsx      # Daftar datasource
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx             # Navigasi samping
│   │   │   │   ├── Header.tsx              # Header atas
│   │   │   │   └── MainLayout.tsx          # Layout utama
│   │   │   └── ui/                        # Komponen UI bersama (shadcn/ui)
│   │   ├── lib/
│   │   │   ├── api.ts                     # Klien API
│   │   │   ├── types.ts                   # Tipe TypeScript
│   │   │   └── utils.ts                   # Utilitas
│   │   └── hooks/
│   │       ├── useGenerator.ts            # Hook generator
│   │       ├── useDatasource.ts           # Hook datasource
│   │       ├── useQuery.ts                # Hook query
│   │       └── useSqlEditor.ts            # Hook SQL editor (sesi, tab, autocomplete)
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── .env.example                           # Template environment variable
├── .gitignore
└── README.md
```



### 9.1 Alur Data dalam Clean Architecture

Contoh: User membuat datasource baru

```
HTTP Request
    │
    ▼
[delivery/http/handler/datasource_handler.go]
    │  Parse request body → DTO
    │  Validasi input
    │
    ▼
[usecase/datasource_usecase.go]
    │  Business logic:
    │  - Enkripsi password
    │  - Test koneksi ke target DB
    │  - Baca schema
    │  - Simpan via repository interface
    │
    ▼
[domain/repository/datasource_repo.go]        ← Interface
    │
    ▼
[infrastructure/repository/datasource_repo_impl.go]  ← Implementasi
    │  Panggil sqlc generated code
    │
    ▼
[infrastructure/sqlc/generated/datasource.sql.go]    ← Auto-generated
    │
    ▼
 PostgreSQL (App DB)
```



### 9.2 Makefile

Semua command development dijalankan via `make`:

```makefile
# ============================================================
#  SQL AI — Backend Makefile
# ============================================================

include .env
export

# ── Variabel ─────────────────────────────────────────────────
BINARY_NAME=sqlai-server
MIGRATION_DIR=migrations
DATABASE_URL?=postgres://user:password@localhost:5432/sqlai?sslmode=disable

# ── Aplikasi ─────────────────────────────────────────────────

## run: Jalankan server development
run:
	go run cmd/server/main.go

## build: Build binary production
build:
	go build -o bin/$(BINARY_NAME) cmd/server/main.go

## test: Jalankan semua unit test
test:
	go test ./... -v -count=1

## test-coverage: Jalankan test dengan coverage report
test-coverage:
	go test ./... -v -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html

## lint: Jalankan linter
lint:
	golangci-lint run ./...

# ── Database Migration ───────────────────────────────────────

## migrate-up: Jalankan semua migrasi yang belum dijalankan
migrate-up:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" up

## migrate-down: Rollback migrasi terakhir
migrate-down:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" down 1

## migrate-down-all: Rollback semua migrasi
migrate-down-all:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" down

## migrate-status: Cek versi migrasi saat ini
migrate-status:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" version

## migrate-create: Buat file migrasi baru (usage: make migrate-create name=nama_migrasi)
migrate-create:
	migrate create -ext sql -dir $(MIGRATION_DIR) -seq $(name)

## migrate-force: Force set versi migrasi (usage: make migrate-force version=1)
migrate-force:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" force $(version)

# ── SQLC ─────────────────────────────────────────────────────

## sqlc-generate: Generate Go code dari SQL queries
sqlc-generate:
	sqlc generate

## sqlc-verify: Verifikasi query SQL valid tanpa generate
sqlc-verify:
	sqlc vet

## sqlc-diff: Lihat perubahan yang akan di-generate
sqlc-diff:
	sqlc diff

# ── Kombinasi ────────────────────────────────────────────────

## setup: Setup awal proyek (install tools + migrasi + generate)
setup: install-tools migrate-up sqlc-generate

## reset-db: Reset database (drop semua + migrasi ulang + generate ulang)
reset-db: migrate-down-all migrate-up sqlc-generate

## generate: Jalankan migrasi + generate sqlc (workflow harian)
generate: migrate-up sqlc-generate

# ── Tools ────────────────────────────────────────────────────

## install-tools: Install CLI tools yang dibutuhkan
install-tools:
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

## tidy: Rapikan Go modules
tidy:
	go mod tidy

# ── Help ─────────────────────────────────────────────────────

## help: Tampilkan daftar command yang tersedia
help:
	@echo "Perintah yang tersedia:"
	@echo ""
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':'

.PHONY: run build test test-coverage lint \
        migrate-up migrate-down migrate-down-all migrate-status \
        migrate-create migrate-force \
        sqlc-generate sqlc-verify sqlc-diff \
        setup reset-db generate install-tools tidy help

.DEFAULT_GOAL := help
```

**Penggunaan sehari-hari:**

```bash
# Pertama kali setup
make setup

# Buat migrasi baru
make migrate-create name=tambah_tabel_dashboard

# Setelah edit file migrasi atau query SQL
make generate

# Reset database dari awal
make reset-db

# Jalankan server
make run

# Jalankan test
make test
```

---



## 10. Environment Variables

```env
# App Database
DATABASE_URL=postgres://user:password@localhost:5432/sqlai?sslmode=disable

# Enkripsi
ENCRYPTION_KEY=kunci-enkripsi-32-karakter-random

# Server
BACKEND_PORT=8080
FRONTEND_PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3000
```

---



## 11. Dependensi



### 11.1 Go Backend


| Package                                | Fungsi                                         |
| -------------------------------------- | ---------------------------------------------- |
| `github.com/gofiber/fiber/v2`          | HTTP framework                                 |
| `github.com/jackc/pgx/v5`              | Driver PostgreSQL (app DB + target DB)         |
| `github.com/go-sql-driver/mysql`       | Driver MySQL (target DB)                       |
| `github.com/golang-migrate/migrate/v4` | Migrasi database (CLI tool)                    |
| `github.com/sqlc-dev/sqlc`             | Generate type-safe Go code dari SQL (CLI tool) |
| `github.com/google/uuid`               | Pembuatan UUID                                 |
| `github.com/joho/godotenv`             | Baca environment variable                      |
| `golang.org/x/crypto`                  | Utilitas enkripsi                              |
| `net/http` (stdlib)                    | HTTP client untuk AI provider                  |


> **Catatan tentang sqlc:** `sqlc` dan `migrate` adalah **CLI tools** yang di-install via `make install-tools`. Mereka bukan dependency di `go.mod` — hanya hasil generate sqlc (`internal/infrastructure/sqlc/generated/`) yang masuk ke source code.

> **Catatan tentang AI:** Tidak perlu SDK spesifik per AI provider. Karena kita menggunakan format OpenAI-compatible dan Anthropic-compatible, cukup gunakan `net/http` standar untuk memanggil API. Ini menjaga dependensi tetap minimal.



### 11.2 Next.js Frontend



#### 🔹 Core Framework


| Package               | Versi             | Fungsi                                                      |
| --------------------- | ----------------- | ----------------------------------------------------------- |
| `next`                | **15.x** (latest) | Framework React — App Router, Server Components, API Routes |
| `react` + `react-dom` | **19.x**          | Library UI                                                  |
| `typescript`          | **5.x**           | Type safety                                                 |




#### 🔹 UI & Styling


| Package                    | Fungsi                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `shadcn/ui`                | Komponen UI berkualitas tinggi (Button, Dialog, Sheet, Select, Tabs, dll) |
| `tailwindcss`              | Utility-first CSS framework                                               |
| `@radix-ui/*`              | Primitive komponen headless (otomatis via shadcn/ui)                      |
| `lucide-react`             | Icon library (otomatis via shadcn/ui)                                     |
| `class-variance-authority` | Variant styling untuk komponen                                            |
| `clsx` + `tailwind-merge`  | Utility class merging                                                     |
| `sonner`                   | Notifikasi toast yang elegan                                              |
| `next-themes`              | Dark/light mode toggle                                                    |




#### 🔹 Form & Validasi


| Package               | Fungsi                                                    |
| --------------------- | --------------------------------------------------------- |
| `react-hook-form`     | Manajemen form — performa tinggi, uncontrolled by default |
| `zod`                 | Schema validasi — type-safe, composable                   |
| `@hookform/resolvers` | Bridge antara react-hook-form dan zod                     |


**Contoh penggunaan (Form Tambah Datasource):**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const datasourceSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  tipe: z.enum(["postgresql", "mysql"]),
  host: z.string().min(1, "Host wajib diisi"),
  port: z.coerce.number().min(1).max(65535),
  nama_database: z.string().min(1, "Nama database wajib diisi"),
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  ssl_mode: z.enum(["disable", "require", "verify-full"]).default("disable"),
});

type DatasourceForm = z.infer<typeof datasourceSchema>;

// Di komponen:
const form = useForm<DatasourceForm>({
  resolver: zodResolver(datasourceSchema),
  defaultValues: { tipe: "postgresql", port: 5432, ssl_mode: "disable" },
});
```

> **Catatan:** shadcn/ui menyediakan komponen `<Form>` yang sudah terintegrasi native dengan react-hook-form + zod. Gunakan `<FormField>`, `<FormItem>`, `<FormMessage>` untuk rendering otomatis error validasi.



#### 🔹 Data Fetching & State


| Package                 | Fungsi                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| `@tanstack/react-query` | Server state management — cache, refetch, polling, optimistic update |
| `zustand`               | Client state management — ringan, tanpa boilerplate                  |


**Contoh penggunaan React Query:**

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch daftar datasource
const { data, isLoading } = useQuery({
  queryKey: ["datasources"],
  queryFn: () => api.get("/api/v1/datasources"),
});

// Tambah datasource baru
const queryClient = useQueryClient();
const createMutation = useMutation({
  mutationFn: (data: DatasourceForm) => api.post("/api/v1/datasources", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["datasources"] });
    toast.success("Datasource berhasil ditambahkan");
  },
});
```



#### 🔹 Tabel Data


| Package                 | Fungsi                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| `@tanstack/react-table` | Headless table — sorting, filtering, pagination, column visibility, column resize |


**Fitur tabel hasil query:**

- Sorting per kolom (klik header)
- Pencarian/filter per kolom
- Pagination (navigasi halaman)
- Column resize (drag lebar kolom)
- Column visibility toggle (sembunyikan/tampilkan kolom)
- Export ke CSV (dari data yang ditampilkan)
- Row count dan waktu eksekusi di footer

**Contoh penggunaan:**

```tsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel } from "@tanstack/react-table";

const table = useReactTable({
  data: queryResult.baris,
  columns: queryResult.kolom.map((col) => ({
    accessorKey: col.nama,
    header: col.nama,
    meta: { tipe: col.tipe },
  })),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableColumnResizing: true,
  columnResizeMode: "onChange",
});
```



#### 🔹 SQL Editor


| Package                      | Fungsi                                                                   |
| ---------------------------- | ------------------------------------------------------------------------ |
| `@uiw/react-codemirror`      | React wrapper untuk CodeMirror 6                                         |
| `@codemirror/lang-sql`       | Syntax highlighting SQL — mendukung **PostgreSQL** dan **MySQL** dialect |
| `@codemirror/autocomplete`   | Autocomplete SQL keywords + nama tabel/kolom                             |
| `@codemirror/theme-one-dark` | Tema dark mode untuk editor                                              |


> **Kenapa CodeMirror, bukan Monaco?**
> Monaco Editor (dari VS Code) berukuran ~~2-4 MB dan berat untuk dimuat. CodeMirror 6 jauh lebih ringan (~~200KB), modular, dan memiliki dukungan SQL dialect yang lebih baik (`PostgreSQL`, `MySQL`, `SQLite`, dll). Untuk use case SQL editor saja, CodeMirror lebih tepat.

**Fitur SQL Editor:**

- Syntax highlighting per dialect (otomatis sesuai datasource yang aktif)
- Autocomplete keyword SQL (`SELECT`, `FROM`, `WHERE`, dll)
- Autocomplete nama tabel dan kolom (dari schema cache)
- Line number
- Bracket matching
- Error highlighting (jika query gagal, highlight baris error)
- Dark/light mode
- Read-only mode (untuk menampilkan SQL yang di-generate AI sebelum edit)

**Contoh penggunaan:**

```tsx
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL, MySQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

const dialect = datasource.tipe === "postgresql" ? PostgreSQL : MySQL;

<CodeMirror
  value={sqlQuery}
  height="200px"
  theme={oneDark}
  extensions={[
    sql({
      dialect: dialect,
      schema: schemaCompletions, // { tabel: [kolom1, kolom2, ...] }
      upperCaseKeywords: true,
    }),
  ]}
  onChange={(value) => setSqlQuery(value)}
/>
```



#### 🔹 Utilitas Lainnya


| Package    | Fungsi                                                             |
| ---------- | ------------------------------------------------------------------ |
| `cmdk`     | Command palette — untuk `/{tabel}` autocomplete di generator input |
| `date-fns` | Format tanggal/waktu (riwayat, timestamp)                          |
| `nuqs`     | Type-safe URL search params (filter, pagination state di URL)      |


---



## 12. Rencana Sprint (MVP)



### Legenda

```
🔴 P0 — Critical path, harus selesai dulu sebelum task lain bisa jalan
🟡 P1 — Penting, tapi bisa paralel dengan task lain
🟢 P2 — Pelengkap, bisa dikerjakan terakhir di sprint

[BE] — Backend (Go)
[FE] — Frontend (Next.js)

⚠️  Urutan eksekusi: BE dulu → baru FE (karena FE butuh API dari BE)
```

---



### Sprint 1 — Fondasi + Tooling (1 minggu)

> **Tujuan:** Project setup kedua sisi, database siap, Datasource CRUD berjalan end-to-end.



#### Backend (kerjakan dulu)

```
🔴 [BE] [x] Setup proyek Go (go mod init, clean architecture folder structure)
🔴 [BE] [x] Setup sqlc.yaml + Makefile
🔴 [BE] [x] Install tools (make install-tools)
🔴 [BE] [x] Tulis migration SQL (000001 - 000005)
🔴 [BE] [x] Jalankan migrasi (make migrate-up)
🔴 [BE] [x] Tulis sqlc queries untuk datasource
🔴 [BE] [x] Generate code (make sqlc-generate)
🔴 [BE] [x] Implementasi domain layer — entity Datasource + repository interface
🔴 [BE] [x] Implementasi infrastructure — repo impl Datasource (menggunakan sqlc)
🔴 [BE] [x] Implementasi infrastructure — config, database connection, encryption (AES)
🟡 [BE] [x] Implementasi usecase — DatasourceUsecase (CRUD + test koneksi + enkripsi password)
🟡 [BE] [x] Implementasi delivery — DatasourceHandler + router + middleware (CORS, logger)
🟡 [BE] [x] Endpoint POST /datasources/:id/test — tes koneksi ke target DB
```



#### Frontend (setelah API BE siap)

```
🔴 [FE] [x] Setup proyek Next.js 16 (create-next-app --typescript)
🔴 [FE] [x] Install & setup shadcn/ui + Tailwind CSS + next-themes
🔴 [FE] [x] Install react-hook-form + zod + @hookform/resolvers
🔴 [FE] [x] Install @tanstack/react-query + setup QueryClientProvider
🔴 [FE] [x] Setup API client (lib/api.ts) — base URL, fetch wrapper
🟡 [FE] [x] Layout utama — Sidebar + Header + MainLayout
🟡 [FE] [x] Halaman pengaturan datasource — DatasourceForm (zod schema + react-hook-form)
🟡 [FE] [x] Halaman pengaturan datasource — DatasourceList (react-query fetch)
🟡 [FE] [x] Tombol "Tes Koneksi" di form datasource
🟢 [FE] [x] Toast notifikasi (sonner) untuk feedback aksi
```

---



### Sprint 2 — Schema Reader & AI Provider (1 minggu)

> **Tujuan:** Sistem bisa baca schema dari PG/MySQL, AI provider terdaftar dan tertes.



#### Backend (kerjakan dulu)

```
🔴 [BE] [x] Implementasi adapter PostgreSQL (infrastructure/adapter/postgres.go)
🔴 [BE] [x] Implementasi adapter MySQL (infrastructure/adapter/mysql.go)
🔴 [BE] [x] AdapterRegistry — register + resolve adapter berdasarkan tipe
🔴 [BE] [x] Schema Reader — baca tabel, kolom, relasi via information_schema
🔴 [BE] [x] Cache schema ke JSONB (via sqlc query UpdateSchemaCache)
🟡 [BE] [x] Endpoint GET /datasources/:id/tables — daftar tabel
🟡 [BE] [x] Endpoint GET /datasources/:id/tables/:nama — detail tabel (kolom, relasi)
🟡 [BE] [x] Endpoint GET /datasources/:id/tables/:nama/preview — preview 50 baris
🟡 [BE] [x] Endpoint POST /datasources/:id/sync — refresh cache schema
🟡 [BE] [x] Tulis sqlc queries untuk ai_providers
🟡 [BE] [x] Generate code (make sqlc-generate)
🟡 [BE] [x] Implementasi domain + repo + usecase + delivery AI Provider CRUD
🟢 [BE] [x] Endpoint POST /ai-providers/:id/test — tes koneksi ke AI provider
```



#### Frontend (setelah API BE siap)

```
🟡 [FE] [x] Halaman pengaturan AI provider — form (nama, format, base URL, API key, model)
🟡 [FE] [x] Halaman pengaturan AI provider — daftar provider + set default
🟡 [FE] [x] Tombol "Tes Koneksi" di form AI provider
🟡 [FE] [x] Tampilan daftar tabel di sidebar (setelah pilih datasource)
🟢 [FE] [x] Preview tabel — klik tabel → lihat kolom + 50 baris pertama (dialog/sheet)
```

---



### Sprint 3 — Generator & AI Generate (1.5 minggu)

> **Tujuan:** Core loop berjalan — user bisa bertanya di generator, AI generate SQL, tampil di editor.



#### Backend (kerjakan dulu)

```
🔴 [BE] [x] Tulis sqlc queries untuk generator_sessions + generator_messages
🔴 [BE] [x] Generate code (make sqlc-generate)
🔴 [BE] [x] Implementasi domain — entity GeneratorSession, GeneratorMessage + repository interface
🔴 [BE] [x] Implementasi infrastructure repo — generator_repo_impl.go
🔴 [BE] [x] Implementasi usecase — GeneratorUsecase (buat sesi, kirim pesan, simpan respons)
🔴 [BE] [x] AI Gateway — openai_compat.go (request/response format OpenAI)
🔴 [BE] [x] AI Gateway — anthropic_compat.go (request/response format Anthropic)
🔴 [BE] [x] AI Gateway — gateway.go (pilih client berdasarkan format_api provider)
🔴 [BE] [x] Template prompt — injeksi schema + dialek + bahasa Indonesia (prompt.go)
🟡 [BE] [x] SSE streaming — handler kirim respons AI secara stream ke frontend
🟡 [BE] [x] Delivery — GeneratorHandler (POST /generator/sessions, GET /generator/sessions, POST /messages)
🟢 [BE] [x] Parse tabel_direferensi dari pesan user (deteksi /{tabel})
🟡 [BE] [x] SSE event `meta` + simpan `ai_metadata` (provider, model, konteks, token) per respons assistant
```



#### Frontend (setelah API BE siap)

```
🔴 [FE] [x] Install @uiw/react-codemirror + @codemirror/lang-sql + tema
🔴 [FE] [x] GeneratorWindow — container utama (daftar pesan + input)
🔴 [FE] [x] GeneratorInput — input pesan dengan /{tabel} autocomplete (cmdk)
🔴 [FE] [x] GeneratorMessage — komponen pesan (user + assistant)
🔴 [FE] [x] SSE client — terima streaming respons AI secara real-time
🟡 [FE] [x] TableMention — chip/tag visual saat user ketik /{tabel}
🟡 [FE] [x] QueryEditor — CodeMirror SQL editor (read-only mode untuk tampilkan SQL AI)
🟡 [FE] [x] Daftar sesi generator di sidebar (buat baru, pilih, hapus)
🟢 [FE] [x] Loading state saat AI sedang generate (skeleton/spinner)
🟡 [FE] [x] Panel transparansi AI: provider, model, tabel konteks, token usage per respons
```

---



### Sprint 4 — Eksekusi Query & Edit (1 minggu)

> **Tujuan:** User bisa edit SQL, jalankan query, dan lihat hasil di tabel interaktif.



#### Backend (kerjakan dulu)

```
🔴 [BE] [x] Endpoint POST /query/execute — eksekusi query ke target DB
🔴 [BE] [x] Read-only transaction enforcement (sql.TxOptions{ReadOnly: true})
🔴 [BE] [x] Query guard middleware — tolak DELETE, DROP, UPDATE, INSERT, ALTER, dll
🔴 [BE] [x] Limit otomatis — inject LIMIT 1000 jika tidak ada
🔴 [BE] [x] Timeout query — context with timeout 30 detik
🟡 [BE] [x] Format hasil query — kolom (nama + tipe) + baris (array)
🟡 [BE] [x] Simpan hasil eksekusi ke generator_messages (sql_diedit, hasil_query, waktu_eksekusi_ms)
🟢 [BE] [x] Endpoint POST /query/explain — EXPLAIN ANALYZE untuk estimasi
🟢 [BE] [x] Penanganan error database — translate ke pesan Bahasa Indonesia
```



#### Frontend (setelah API BE siap)

```
🔴 [FE] [x] QueryEditor — edit mode (CodeMirror, editable, syntax per dialect)
🔴 [FE] [x] QueryEditor — autocomplete tabel/kolom dari schema cache
🔴 [FE] [x] Install @tanstack/react-table
🔴 [FE] [x] QueryResult — tabel hasil (render kolom + baris dari API response)
🟡 [FE] [x] QueryResult — sorting per kolom (klik header)
🟡 [FE] [x] QueryResult — pagination
🟡 [FE] [x] QueryResult — column resize (drag)
🟡 [FE] [x] QueryActions — tombol "Jalankan" (POST /query/execute)
🟡 [FE] [x] QueryActions — tampilkan waktu eksekusi + jumlah baris di footer
🟢 [FE] [x] QueryResult — column visibility toggle
🟢 [FE] [x] QueryResult — filter per kolom
🟢 [FE] [x] Penanganan error — tampilkan pesan error di bawah editor
```

---



### Sprint 5 — Simpan, Salin, Riwayat, Polish (1 minggu)

> **Tujuan:** Fitur pendukung lengkap, UI dipoles, testing end-to-end.



#### Backend (kerjakan dulu)

```
🔴 [BE] [x] Tulis sqlc queries untuk saved_queries + query_history
🔴 [BE] [x] Generate code (make sqlc-generate)
🔴 [BE] [x] Implementasi domain + repo + usecase untuk SavedQuery + QueryHistory
🟡 [BE] [x] Delivery — SavedQueryHandler (CRUD /saved-queries)
🟡 [BE] [x] Delivery — HistoryHandler (GET /query-history, paginasi)
🟡 [BE] [x] Auto-simpan ke query_history setiap kali query dieksekusi
🟢 [BE] [x] Filter riwayat berdasarkan datasource, status, tanggal
🟢 [BE] [x] Unit test semua usecase (make test)
```



#### Frontend (setelah API BE siap)

```
🟡 [FE] [x] QueryActions — tombol "Simpan" → dialog (nama, deskripsi, tag) + zod validasi
🟡 [FE] [x] QueryActions — tombol "Salin" → copy SQL ke clipboard
🟡 [FE] [x] Halaman query tersimpan — daftar + pencarian + filter tag
🟡 [FE] [x] Halaman query tersimpan — klik → muat ke editor + jalankan ulang
🟡 [FE] [x] Halaman riwayat — daftar (tanggal, SQL, status, durasi) + paginasi (nuqs)
🟡 [FE] [x] Halaman riwayat — klik → muat ke editor
🟢 [FE] [x] Install date-fns — format timestamp di riwayat
🟢 [FE] [x] Polish UI — loading skeleton, transisi halaman, responsif
🟢 [FE] [x] Polish UI — dark/light mode toggle (next-themes)
🟢 [FE] [x] Polish UI — empty state di setiap halaman
🟢 [FE] [x] Testing end-to-end semua alur (npm run lint && npm run type-check)
```

---



### Sprint 6 — SQL Editor Manual (1.5 minggu)

> **Status:** ✅ Backend selesai (13/13 task) · Frontend belum dimulai (0/26 task)
>
> **Tujuan:** User bisa menulis dan menjalankan query SQL secara manual tanpa AI, dengan editor yang mendukung autocomplete nama tabel, kolom, dan keyword SQL. Mendukung multi-tab, riwayat, dan simpan query.



#### Deskripsi Fitur

**SQL Editor Manual** adalah fitur standalone yang memungkinkan user teknis (atau stakeholder yang sudah familiar dengan SQL) untuk menulis query secara langsung tanpa memerlukan AI. Editor ini menyediakan pengalaman seperti SQL client modern (mirip DBeaver, DataGrip, pgAdmin) tetapi terintegrasi dalam satu platform.

**Fitur utama:**

1. **Editor SQL dengan Autocomplete Cerdas**
  - Autocomplete **nama tabel** dari schema yang terhubung
  - Autocomplete **nama kolom/field** saat mengetik setelah nama tabel (misal: `pesanan.` → muncul `id`, `total`, `status`)
  - Autocomplete **keyword SQL** (`SELECT`, `FROM`, `WHERE`, `JOIN`, `GROUP BY`, `ORDER BY`, `HAVING`, `LIMIT`, dll)
  - Autocomplete **fungsi SQL** per dialect (`DATE_TRUNC`, `COALESCE`, `COUNT`, `SUM`, `AVG`, dll)
  - Autocomplete **tipe JOIN** (`INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`)
  - Snippet/template SQL umum (misal: ketik `sel` → expand ke `SELECT * FROM |`)
2. **Multi-Tab Editor**
  - Buka beberapa query sekaligus dalam tab terpisah
  - Setiap tab memiliki nama, konten SQL, dan hasil eksekusi sendiri
  - Tab bisa di-rename, tutup, dan reorder (drag & drop)
  - Tab auto-save (debounce 1 detik setelah user berhenti mengetik)
  - Keyboard shortcut: `Ctrl+T` (tab baru), `Ctrl+W` (tutup tab), `Ctrl+Tab` (ganti tab)

2a. **Penamaan Sesi Editor**

- Setiap sesi SQL Editor memiliki nama yang bisa disesuaikan user (mis. "Analisis users", "Laporan harian")
- Default saat dibuat: "Sesi editor baru" — user dapat mengganti kapan saja
- Rename inline di workspace (double-click atau ikon edit di header sesi)
- Rename juga tersedia di panel daftar sesi (ikon edit saat hover)
- Nama tersimpan via `PUT /api/v1/sql-editor/sessions/:id` dan tampil di daftar sesi

1. **Schema Browser Sidebar**
  - Navigasi schema database dalam tree view: Database → Tabel → Kolom
  - Klik nama tabel → insert ke editor di posisi kursor
  - Klik nama kolom → insert ke editor di posisi kursor
  - Icon per tipe data (🔑 PK, 🔗 FK, 📝 varchar, 🔢 integer, 📅 timestamp, dll)
  - Pencarian cepat tabel/kolom
2. **Eksekusi & Hasil**
  - Tombol "Jalankan" atau `Ctrl+Enter` / `Cmd+Enter`
  - Jalankan seleksi (highlight sebagian SQL → jalankan hanya bagian yang dipilih)
  - Hasil ditampilkan dalam tabel interaktif (sorting, pagination, resize kolom)
  - Status bar: waktu eksekusi, jumlah baris, status
  - Error ditampilkan inline di bawah editor dengan highlight baris error
3. **Integrasi Riwayat**
  - Semua query yang dijalankan dari editor tersimpan di `query_history` dengan `source = 'editor'`
  - Panel riwayat di samping editor — klik untuk muat ulang ke tab aktif
  - Filter riwayat: berdasarkan waktu, status (berhasil/gagal), pencarian teks
4. **Integrasi Simpan Query**
  - Tombol "Simpan" → dialog (nama, deskripsi, tag) — menggunakan sistem `saved_queries` yang sama
  - Query yang disimpan dari editor bisa diakses di halaman Tersimpan global
  - Dari halaman Tersimpan, bisa "Buka di Editor" → membuka di tab baru SQL Editor
5. **Fitur Editor Tambahan**
  - Syntax highlighting per dialect (PostgreSQL/MySQL)
  - Line number + line wrap toggle
  - Bracket matching & auto-close
  - Format SQL otomatis (prettify) — tombol atau `Ctrl+Shift+F`
  - Find & replace (`Ctrl+F`, `Ctrl+H`)
  - Undo/redo unlimited
  - Dark/light mode (mengikuti tema app)
  - Shortcut `Ctrl+/` untuk toggle comment (-- single line)



#### Backend (kerjakan dulu) ✅ Selesai

```
🔴 [BE] [x] Tulis migration SQL (000007_init_sql_editor + 000008_add_query_history_source)
🔴 [BE] [x] Jalankan migrasi (make migrate-up)
🔴 [BE] [x] Tulis sqlc queries untuk sql_editor_sessions + sql_editor_tabs
🔴 [BE] [x] Generate code (make sqlc-generate)
🔴 [BE] [x] Implementasi domain — entity SqlEditorSession, SqlEditorTab + repository interface
🔴 [BE] [x] Implementasi infrastructure — sql_editor_repo_impl.go (menggunakan sqlc)
🟡 [BE] [x] Implementasi usecase — SqlEditorUsecase (CRUD sesi, CRUD tab, eksekusi query)
🟡 [BE] [x] Delivery — SqlEditorHandler (CRUD sessions, CRUD tabs, run)
🟡 [BE] [x] Endpoint GET /sql-editor/autocomplete/:datasourceId — ambil data schema untuk autocomplete
🟡 [BE] [x] Tambah field `source` ke query_history (migrasi 000008 + update sqlc query)
🟡 [BE] [x] Auto-save hasil eksekusi ke sql_editor_tabs (last_result, execution_time_ms, last_status)
🟢 [BE] [x] Auto-simpan ke query_history dengan source='editor' saat query dijalankan dari editor
🟢 [BE] [x] Unit test SqlEditorUsecase (make test)
```

> **Catatan migrasi:** `000006` sudah dipakai `generator_message_ai_metadata`. SQL Editor memakai `000007`; kolom `source` di `query_history` memakai `000008`.



#### Frontend (setelah API BE siap)

```
🔴 [FE] [x] Halaman SQL Editor — routing /sql-editor dan /sql-editor/[sessionId]
🔴 [FE] [x] SqlEditorWorkspace — container utama (sidebar + tabs + editor + hasil)
🔴 [FE] [x] SqlEditorTabBar — multi-tab UI (buat, tutup, rename, reorder)
🔴 [FE] [x] SqlEditorPane — CodeMirror editor dalam mode editable (bukan read-only)
🔴 [FE] [x] Autocomplete setup — konfigurasi @codemirror/lang-sql dengan schema dari API
🔴 [FE] [x] Autocomplete — nama tabel dari datasource yang aktif
🔴 [FE] [x] Autocomplete — nama kolom/field saat mengetik setelah nama tabel (tabel.kolom)
🔴 [FE] [x] Autocomplete — keyword SQL (SELECT, FROM, WHERE, JOIN, GROUP BY, dll)
🔴 [FE] [x] Autocomplete — fungsi SQL per dialect (DATE_TRUNC, COALESCE, COUNT, dll)
🟡 [FE] [x] SqlEditorToolbar — tombol Jalankan (Ctrl+Enter), Simpan, Salin, Format
🟡 [FE] [x] Eksekusi query — kirim ke API, tampilkan hasil di QueryResult (reuse komponen Sprint 4)
🟡 [FE] [x] Eksekusi parsial — jalankan hanya bagian SQL yang di-highlight/seleksi
🟡 [FE] [x] SqlEditorSidebar — schema browser tree view (tabel → kolom) dengan ikon tipe data
🟡 [FE] [x] SqlEditorSidebar — klik nama tabel/kolom → insert di posisi kursor
🟡 [FE] [x] SqlEditorSidebar — pencarian cepat tabel/kolom
🟡 [FE] [x] SqlEditorHistory — panel riwayat query dari editor (filter `?source=editor`)
🟡 [FE] [x] SqlEditorHistory — klik riwayat → muat ke tab aktif
🟡 [FE] [x] Integrasi simpan query — dialog simpan (nama, deskripsi, tag) → POST /saved-queries
🟡 [FE] [x] Tab auto-save — debounce PUT /tabs setiap 1 detik setelah user berhenti mengetik
🟡 [FE] [x] Daftar sesi editor di sidebar navigasi (buat baru, pilih, hapus)
🟡 [FE] [x] Rename sesi editor — inline di workspace (double-click / ikon edit) + daftar sesi
🟢 [FE] [x] Format SQL otomatis (prettify) — tombol + Ctrl+Shift+F
🟢 [FE] [x] Keyboard shortcuts — Ctrl+T (tab baru), Ctrl+W (tutup), Ctrl+Tab (ganti tab)
🟢 [FE] [x] Error handling — highlight baris error di editor + pesan error inline
🟢 [FE] [x] Snippet/template SQL — ketik shortcut → expand ke template SQL umum
🟢 [FE] [x] Status bar — waktu eksekusi, jumlah baris, datasource aktif, dialect
🟢 [FE] [x] Halaman Tersimpan — tambah tombol "Buka di Editor" untuk query tersimpan
🟢 [FE] [x] Polish — responsif, dark/light mode, transisi, empty state
```

---



### Ringkasan Sprint


| Sprint    | Durasi       | BE Tasks    | FE Tasks    | Fokus Utama                    |
| --------- | ------------ | ----------- | ----------- | ------------------------------ |
| **1**     | 1 minggu     | 13 task     | 10 task     | Setup + Datasource CRUD        |
| **2**     | 1 minggu     | 13 task     | 5 task      | Schema Reader + AI Provider    |
| **3**     | 1.5 minggu   | 12 task     | 9 task      | Generator + AI Generate SQL ⭐  |
| **4**     | 1 minggu     | 9 task      | 12 task     | Edit + Jalankan Query ⭐        |
| **5**     | 1 minggu     | 8 task      | 11 task     | Simpan + Riwayat + Polish      |
| **6**     | 1.5 minggu   | 13 task     | 26 task     | SQL Editor Manual (tanpa AI) ⭐ |
| **Total** | **7 minggu** | **68 task** | **73 task** | **141 task**                   |


> **Catatan:** Sprint 3, 4, dan 6 adalah **inti produk** (ditandai ⭐). Sprint 6 (SQL Editor Manual) memungkinkan user teknis menulis query tanpa AI — ini melengkapi alur generator AI dari Sprint 3-4. Sprint 1-2 adalah fondasi yang wajib, Sprint 5 adalah pelengkap yang bisa dikurangi scope-nya.

---



## 13. Rencana Verifikasi



### Tes Otomatis

```bash
# Unit test backend (via Makefile)
cd backend && make test

# Tes integrasi backend (dengan database tes)
cd backend && go test ./... -tags=integration -v

# Verifikasi sqlc queries valid
cd backend && make sqlc-verify

# Lint & type check frontend
cd frontend && npm run lint && npm run type-check
```



### Verifikasi Manual


| #   | Skenario                                   | Kriteria Berhasil                                             |
| --- | ------------------------------------------ | ------------------------------------------------------------- |
| 1   | Connect ke PostgreSQL                      | Schema terbaca, tabel tampil di daftar                        |
| 2   | Connect ke MySQL                           | Schema terbaca, tabel tampil di daftar                        |
| 3   | Daftarkan AI provider OpenAI-compatible    | Tes koneksi berhasil                                          |
| 4   | Daftarkan AI provider Anthropic-compatible | Tes koneksi berhasil                                          |
| 5   | Ketik `/{tabel}` di generator              | Autocomplete muncul dengan daftar tabel                       |
| 6   | Kirim pertanyaan bahasa natural            | AI generate SQL yang valid untuk dialek yang benar            |
| 6a  | Lihat detail AI di respons generator       | Provider, model, tabel konteks, dan token tampil per respons  |
| 7   | Edit SQL di editor                         | Perubahan tersimpan dan siap dijalankan                       |
| 8   | Jalankan query                             | Hasil tampil sebagai tabel dengan waktu eksekusi              |
| 9   | Simpan query                               | Tersimpan dengan nama dan tag, muncul di halaman tersimpan    |
| 10  | Salin SQL                                  | SQL tersalin ke clipboard                                     |
| 11  | Lihat riwayat                              | Semua query sebelumnya tampil dengan timestamp dan status     |
| 12  | Coba kirim DELETE/DROP                     | Ditolak dengan pesan error Bahasa Indonesia                   |
| 13  | Query timeout > 30 detik                   | Dibatalkan dengan pesan error yang jelas                      |
| 14  | Buka SQL Editor manual                     | Editor muncul dengan tab kosong siap digunakan                |
| 15  | Ketik SQL di editor manual                 | Autocomplete muncul: nama tabel, kolom, keyword SQL           |
| 16  | Ketik nama tabel diikuti titik             | Autocomplete muncul: daftar kolom dari tabel tersebut         |
| 17  | Jalankan query dari editor manual          | Hasil tampil di tabel, tersimpan di riwayat (`source=editor`) |
| 18  | Buat multi-tab di editor                   | Tab baru terbuka, konten terpisah per tab                     |
| 19  | Auto-save tab editor                       | Konten tersimpan otomatis, muncul kembali saat reload         |
| 20  | Simpan query dari editor                   | Query tersimpan, muncul di halaman Tersimpan                  |
| 21  | Buka query tersimpan di editor             | Query dimuat di tab baru SQL Editor                           |
| 22  | Lihat riwayat query editor                 | Riwayat terfilter menampilkan hanya query dari editor         |
| 23  | Jalankan sebagian SQL (highlight + run)    | Hanya bagian SQL yang di-highlight yang dieksekusi            |
| 24  | Format SQL otomatis                        | SQL di-prettify dengan indentasi yang rapi                    |
| 25  | Ganti nama sesi SQL Editor                 | Nama sesi tersimpan, tampil di header workspace & daftar sesi |


---



## 14. 🔮 Implementasi Selanjutnya (Roadmap Post-MVP)

> **Catatan:** Section ini adalah backlog terstruktur agar tidak ada fitur yang terlupa. Implementasi dilakukan **setelah MVP stabil dan divalidasi user**.



### Fase 2 — Visualisasi & Peningkatan UX


| #   | Fitur                           | Deskripsi                                                                                                                                                                                                                                                                                                    | Kompleksitas |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| N1  | **Visualisasi Query**           | Grafik Bar, Line, Pie, Area dari hasil query. User pilih tipe → AI sesuaikan query (GROUP BY, aggregate). Pustaka: Recharts atau ECharts.                                                                                                                                                                    | 🟡 Sedang    |
| N2  | **Visualisasi Adaptif**         | User bilang "ubah ke pie chart per kategori" → AI tulis ulang query agar output sesuai format grafik                                                                                                                                                                                                         | 🔴 Tinggi    |
| N3  | **Memori Konteks Generator**    | AI ingat percakapan sebelumnya dalam sesi, bisa perbaiki query secara iteratif                                                                                                                                                                                                                               | 🟡 Sedang    |
| N4  | **Preview Tabel di Generator**  | Saat user ketik `/{tabel}`, tampilkan popup preview (kolom + sampel 5 baris)                                                                                                                                                                                                                                 | 🟢 Rendah    |
| N4a | **Peringatan AI Hallucination** | Tampilkan warning visual di setiap respons AI: *"Query ini di-generate AI, pastikan hasilnya sesuai ekspektasi sebelum digunakan"*. AI bisa generate SQL yang syntactically valid tapi logically salah (salah JOIN, salah aggregate). Peringatan ini membangun kebiasaan user untuk selalu verifikasi hasil. | 🟢 Rendah    |




### Fase 3 — Mesin Aturan & Keamanan


| #   | Fitur                        | Deskripsi                                                                                                                                                                                                                                                      | Kompleksitas |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| N5  | **Mesin Aturan**             | User tentukan aturan: "jangan query tanpa WHERE", "maks 10rb baris", "tabel `gaji` dibatasi". Validasi sebelum eksekusi.                                                                                                                                       | 🟡 Sedang    |
| N6  | **Keamanan Level Baris**     | Batasi hasil query berdasarkan peran user (misal: sales hanya lihat region mereka)                                                                                                                                                                             | 🔴 Tinggi    |
| N7  | **Log Audit**                | Catat siapa query apa, kapan, dari datasource mana. ⚠️ *Prioritas dinaikkan — wajib ada sebelum deploy ke tim, karena produk ini memberi akses langsung ke database.*                                                                                          | 🟡 Sedang    |
| N8  | **Autentikasi User**         | Sistem login, akses berbasis peran (admin, viewer, editor). ⚠️ *Prioritas dinaikkan — tanpa auth, produk tidak bisa di-deploy ke tim manapun. Implementasikan paling awal di fase ini (minimal session-based login).*                                          | 🔴 Tinggi    |
| N8a | **Allowlist Tabel**          | User/admin bisa menentukan tabel mana saja yang boleh di-query. Tabel sensitif (misal: `gaji`, `password_reset`, `audit_log`) bisa di-exclude dari schema yang dikirim ke AI dan dari eksekusi query. Lapisan keamanan tambahan di atas read-only enforcement. | 🟡 Sedang    |
| N8b | **Rekomendasi Read-Replica** | Panduan dan validasi agar user menyambungkan datasource ke **read-replica** (bukan primary DB). Tampilkan warning jika terdeteksi koneksi ke primary/writable instance. Mencegah risiko beban query ad-hoc memengaruhi performa database produksi.             | 🟢 Rendah    |




### Fase 4 — Background Job & Performa


| #   | Fitur                      | Deskripsi                                                                                                                 | Kompleksitas |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| N9  | **Antrean Background Job** | Query > 10 detik otomatis di-defer ke background. Notifikasi via WebSocket/SSE saat selesai. Stack: Redis + Go goroutine. | 🟡 Sedang    |
| N10 | **Cache Hasil Query**      | Cache hasil query yang sama dalam TTL tertentu, hindari eksekusi ulang                                                    | 🟡 Sedang    |
| N11 | **Estimasi Biaya Query**   | Sebelum jalankan, tampilkan estimasi waktu berdasarkan `EXPLAIN`                                                          | 🟡 Sedang    |




### Fase 5 — Gabung Query & Multi-Datasource


| #   | Fitur                           | Deskripsi                                                                         | Kompleksitas     |
| --- | ------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| N12 | **Gabung Query (DB Sama)**      | AI generate query yang JOIN tabel tanpa relasi langsung, dengan panduan AI        | 🟡 Sedang        |
| N13 | **Gabung Query (Lintas DB)**    | Query dari 2 datasource berbeda → jalankan masing-masing → gabung di Go app layer | 🔴 Sangat Tinggi |
| N14 | **Pergantian Multi-Datasource** | Dalam satu sesi generator, user bisa ganti datasource tanpa buat sesi baru        | 🟡 Sedang        |




### Fase 6 — Embed & Berbagi


| #   | Fitur                        | Deskripsi                                                                                                  | Kompleksitas |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ |
| N15 | **Embed Visualisasi**        | Generate URL iframe embeddable dari query tersimpan + konfigurasi grafik. Non-realtime, refresh terjadwal. | 🟡 Sedang    |
| N16 | **Bagikan Query via Tautan** | Buat tautan yang bisa dibagikan untuk query tersimpan (hanya lihat)                                        | 🟢 Rendah    |
| N17 | **Pembuat Dashboard**        | Susun beberapa visualisasi menjadi satu halaman dashboard                                                  | 🔴 Tinggi    |
| N18 | **Refresh Terjadwal**        | Auto-refresh embed/dashboard pada interval tertentu (cron)                                                 | 🟡 Sedang    |




### Fase 7 — AI Lanjutan


| #   | Fitur                         | Deskripsi                                                                                      | Kompleksitas |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| N19 | **Pencarian Tabel Semantik**  | Untuk schema besar (100+ tabel), gunakan vector embedding + pgvector untuk cari tabel relevan. | 🔴 Tinggi    |
| N20 | **Saran Query**               | AI proaktif menyarankan pertanyaan berdasarkan schema yang tersedia                            | 🟡 Sedang    |
| N21 | **Penjelasan Bahasa Natural** | Setelah jalankan query, AI jelaskan hasilnya dalam bahasa natural untuk stakeholder            | 🟡 Sedang    |
| N22 | **Perbaikan Otomatis Error**  | Jika query gagal, AI otomatis coba perbaiki dan sarankan fix                                   | 🟡 Sedang    |


---



### Rekomendasi Prioritas Implementasi

> **Catatan:** Berdasarkan analisis risiko dan dampak produk, berikut urutan prioritas yang direkomendasikan untuk implementasi post-MVP. Produk ini memberi akses langsung ke database — sehingga keamanan harus menjadi prioritas utama sebelum fitur-fitur enhancement.

**🔴 Prioritas 1 — Wajib sebelum deploy ke tim/user lain:**


| #   | Item                        | Fase Asal | Alasan                                                                                   |
| --- | --------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| N8  | Autentikasi User            | Fase 3    | Tanpa auth, produk tidak bisa digunakan lebih dari 1 orang. Minimal session-based login. |
| N7  | Log Audit                   | Fase 3    | Produk memberi akses langsung ke database — wajib ada catatan siapa query apa dan kapan. |
| N8a | Allowlist Tabel             | Fase 3    | Mencegah akses ke tabel sensitif. Lapisan keamanan kritis.                               |
| N4a | Peringatan AI Hallucination | Fase 2    | Effort rendah, dampak tinggi. Mencegah user mempercayai hasil AI secara buta.            |


**🟡 Prioritas 2 — Setelah keamanan dasar terpenuhi:**


| #   | Item                      | Fase Asal | Alasan                                                                         |
| --- | ------------------------- | --------- | ------------------------------------------------------------------------------ |
| N1  | Visualisasi Query         | Fase 2    | Game-changer untuk stakeholder non-teknis. Grafik >> tabel angka.              |
| N22 | Perbaikan Otomatis Error  | Fase 7    | Mengurangi frustrasi user saat query gagal. Meningkatkan retensi.              |
| N21 | Penjelasan Bahasa Natural | Fase 7    | Stakeholder non-teknis butuh narasi, bukan hanya tabel data.                   |
| N3  | Memori Konteks Generator  | Fase 2    | Membuat AI terasa "pintar" — bisa iterasi dan perbaiki query dalam percakapan. |


**🟢 Prioritas 3 — Nice-to-have, kerjakan berdasarkan feedback user:**

Sisa fitur di Fase 4–6 dikerjakan berdasarkan feedback user aktual. Hindari feature creep sebelum MVP divalidasi oleh pengguna nyata.

> **Prinsip:** *Ship early, validate with real users, then iterate.* Jangan bangun Fase 4–7 sebelum tahu apakah Fase 2–3 sudah menjawab kebutuhan user.

---

