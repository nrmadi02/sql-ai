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

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| App Database | PostgreSQL lokal via `DATABASE_URL` | Sudah tersedia di mesin developer, satu env variable cukup |
| Arsitektur Backend | **Clean Architecture** | Separation of concerns yang jelas, mudah di-test, mudah di-extend |
| Database Query | **sqlc** (type-safe SQL → Go code) | Compile-time safety, tidak ada runtime reflection, performa optimal |
| Database Migration | **golang-migrate** + **Makefile** | Migrasi versi-based, semua command via `make` |
| Frontend Framework | **Next.js 15** (latest, App Router) | SSR/SSG, routing bawaan, ecosystem besar |
| UI Components | **shadcn/ui** + **Tailwind CSS** | Komponen berkualitas tinggi, customizable, accessible |
| Form & Validasi | **React Hook Form** + **Zod** | Performa tinggi, validasi type-safe, integrasi shadcn/ui native |
| Data Fetching | **@tanstack/react-query** | Cache otomatis, refetch, optimistic update, SSE support |
| Tabel Data | **@tanstack/react-table** | Headless, sorting, filtering, pagination, column resize |
| SQL Editor | **@codemirror/lang-sql** + **@uiw/react-codemirror** | Syntax highlighting SQL, autocomplete, multi-dialect, ringan |
| Autentikasi | Tidak ada (single user) | MVP fokus ke fungsionalitas, auth ditambahkan di fase berikutnya |
| Deployment | Lokal (`go run` + `npm run dev`) | Belum perlu Docker, development speed lebih penting |
| AI Provider | Custom input (nama, base URL, API key, model) | Fleksibel — support format OpenAI-compatible dan Anthropic-compatible |
| Bahasa UI | Full Bahasa Indonesia | Target user adalah stakeholder Indonesia |

---

## 3. Fitur MVP

| # | Fitur | Prioritas | Deskripsi |
|---|-------|-----------|-----------|
| F1 | **Multi-Database Connector** | 🔴 Critical | Connect ke PostgreSQL dan MySQL. User input connection string/detail via form. |
| F2 | **Pembaca Schema** | 🔴 Critical | Baca semua tabel, kolom, tipe data, dan relasi dari datasource yang terhubung |
| F3 | **Callable Table (`/{tabel}`)** | 🔴 Critical | Di generator, user ketik `/{nama_tabel}` untuk menyertakan konteks tabel ke AI |
| F4 | **AI Generate Query** | 🔴 Critical | Bahasa natural → SQL. AI memahami dialek database yang aktif |
| F5 | **Custom AI Provider** | 🔴 Critical | User mendaftarkan provider AI sendiri: nama, base URL, API key, model. Mendukung format OpenAI-compatible dan Anthropic-compatible |
| F6 | **Edit Query** | 🔴 Critical | User bisa mengedit SQL yang di-generate sebelum dijalankan |
| F7 | **Jalankan Query** | 🔴 Critical | Eksekusi query ke datasource, tampilkan hasil sebagai tabel |
| F8 | **Simpan Query** | 🟡 High | Simpan query dengan nama, deskripsi, dan tag |
| F9 | **Salin Query** | 🟡 High | Salin SQL ke clipboard dengan satu klik |
| F10 | **Riwayat Query** | 🟡 High | Daftar semua query yang pernah dijalankan, lengkap dengan timestamp dan status |

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

| Layer | Tanggung Jawab | Contoh |
|-------|----------------|--------|
| **Domain** | Entity (struct), Repository interface, error domain | `Datasource`, `GeneratorSession`, `DatasourceRepository` (interface) |
| **Usecase** | Business logic, orkestrasi antar repository | `DatasourceUsecase.Create()`, `GeneratorUsecase.SendMessage()` |
| **Delivery** | HTTP handler, request/response DTO, routing, middleware | `DatasourceHandler.Create()`, CORS, logger |
| **Infrastructure** | Implementasi konkret repository (sqlc), AI client, DB adapter | `datasourceRepoImpl`, `OpenAIClient`, `PostgresAdapter` |

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
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  │
│  │Generator │  │ Editor   │  │ Hasil  │  │ Pengaturan│  │
│  │ + /{tabel}│  │ Query    │  │ Tabel  │  │ Datasource│  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  │ & AI      │  │
│       │              │            │       └─────┬─────┘  │
└───────┼──────────────┼────────────┼─────────────┼────────┘
        │              │            │             │
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

| Format | Contoh Provider | Endpoint Pattern |
|--------|----------------|------------------|
| OpenAI-compatible | OpenAI, Groq, Together AI, LM Studio, Ollama (openai mode), vLLM, DeepSeek | `{base_url}/v1/chat/completions` |
| Anthropic-compatible | Anthropic, AWS Bedrock (Anthropic mode) | `{base_url}/v1/messages` |

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

```sql
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datasource_id UUID REFERENCES datasources(id) ON DELETE SET NULL,
    konten_sql TEXT NOT NULL,
    prompt_bahasa_natural TEXT,           -- prompt asli user
    waktu_eksekusi_ms INTEGER,
    jumlah_baris INTEGER,
    status VARCHAR(20) NOT NULL,          -- 'berhasil', 'gagal'
    pesan_error TEXT,
    dibuat_pada TIMESTAMP DEFAULT NOW()
);
```

### 5.7 Index

```sql
CREATE INDEX idx_generator_messages_session ON generator_messages(session_id, dibuat_pada);
CREATE INDEX idx_query_history_datasource ON query_history(datasource_id, dibuat_pada DESC);
CREATE INDEX idx_saved_queries_datasource ON saved_queries(datasource_id);
CREATE INDEX idx_saved_queries_tag ON saved_queries USING GIN(tag);
```

---

## 6. Kontrak API

### 6.1 Manajemen Datasource

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/datasources` | Tambah datasource baru |
| `GET` | `/api/v1/datasources` | Daftar semua datasource |
| `GET` | `/api/v1/datasources/:id` | Detail datasource |
| `PUT` | `/api/v1/datasources/:id` | Perbarui datasource |
| `DELETE` | `/api/v1/datasources/:id` | Hapus datasource |
| `POST` | `/api/v1/datasources/:id/test` | Tes koneksi |
| `POST` | `/api/v1/datasources/:id/sync` | Refresh cache schema |

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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/datasources/:id/tables` | Daftar semua tabel |
| `GET` | `/api/v1/datasources/:id/tables/:nama` | Detail tabel (kolom, relasi) |
| `GET` | `/api/v1/datasources/:id/tables/:nama/preview` | Preview data (LIMIT 50) |

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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/ai-providers` | Tambah provider AI |
| `GET` | `/api/v1/ai-providers` | Daftar provider |
| `PUT` | `/api/v1/ai-providers/:id` | Perbarui provider |
| `DELETE` | `/api/v1/ai-providers/:id` | Hapus provider |
| `POST` | `/api/v1/ai-providers/:id/test` | Tes koneksi AI |

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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/generator/sessions` | Buat sesi generator baru |
| `GET` | `/api/v1/generator/sessions` | Daftar sesi |
| `GET` | `/api/v1/generator/sessions/:id` | Detail sesi dengan pesan |
| `DELETE` | `/api/v1/generator/sessions/:id` | Hapus sesi |
| `POST` | `/api/v1/generator/sessions/:id/messages` | Kirim pesan (trigger AI) |

**Contoh Request — Kirim Pesan:**

```json
POST /api/v1/generator/sessions/:id/messages
{
  "konten": "tampilkan total penjualan per bulan tahun 2024",
  "tabel": ["pesanan", "pelanggan"],
  "datasource_id": "550e8400-..."
}
```

**Contoh Response (streaming via SSE):**

```json
{
  "id": "msg-uuid",
  "role": "assistant",
  "konten": "Berikut query untuk menampilkan total penjualan per bulan di tahun 2024:",
  "sql_dihasilkan": "SELECT DATE_TRUNC('month', dibuat_pada) AS bulan, SUM(total) AS total_penjualan FROM pesanan WHERE EXTRACT(YEAR FROM dibuat_pada) = 2024 GROUP BY bulan ORDER BY bulan;",
  "tabel_direferensi": ["pesanan"]
}
```

### 6.5 Eksekusi Query

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/query/execute` | Jalankan query |
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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/v1/saved-queries` | Simpan query |
| `GET` | `/api/v1/saved-queries` | Daftar query tersimpan |
| `GET` | `/api/v1/saved-queries/:id` | Detail query tersimpan |
| `PUT` | `/api/v1/saved-queries/:id` | Perbarui query tersimpan |
| `DELETE` | `/api/v1/saved-queries/:id` | Hapus query tersimpan |
| `GET` | `/api/v1/query-history` | Daftar riwayat (berpagina) |
| `GET` | `/api/v1/query-history/:id` | Detail riwayat |

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
│   │   │   │   └── schema.go              # Table, Column, Relation entity
│   │   │   │
│   │   │   └── repository/                # Interface repository (kontrak)
│   │   │       ├── datasource_repo.go     # DatasourceRepository interface
│   │   │       ├── ai_provider_repo.go    # AIProviderRepository interface
│   │   │       ├── generator_repo.go      # GeneratorRepository interface
│   │   │       ├── query_repo.go          # SavedQueryRepository interface
│   │   │       └── history_repo.go        # QueryHistoryRepository interface
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
│   │   │   └── history_usecase.go         # Riwayat query
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
│   │   │       │   └── history_handler.go
│   │   │       └── dto/                   # Request/Response struct (DTO)
│   │   │           ├── datasource_dto.go
│   │   │           ├── ai_provider_dto.go
│   │   │           ├── generator_dto.go
│   │   │           └── query_dto.go
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
│   │       │   │   └── query_history.sql
│   │       │   └── generated/             # Auto-generated oleh sqlc (JANGAN EDIT)
│   │       │       ├── db.go
│   │       │       ├── models.go
│   │       │       ├── datasource.sql.go
│   │       │       ├── ai_provider.sql.go
│   │       │       ├── generator.sql.go
│   │       │       ├── saved_query.sql.go
│   │       │       └── query_history.sql.go
│   │       │
│   │       ├── repository/                # Implementasi domain repository
│   │       │   ├── datasource_repo_impl.go    # implements DatasourceRepository
│   │       │   ├── ai_provider_repo_impl.go   # implements AIProviderRepository
│   │       │   ├── generator_repo_impl.go     # implements GeneratorRepository
│   │       │   ├── query_repo_impl.go         # implements SavedQueryRepository
│   │       │   └── history_repo_impl.go       # implements QueryHistoryRepository
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
│   │   └── 000005_init_query_history.down.sql
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
│   │       └── useQuery.ts                # Hook query
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

| Package | Fungsi |
|---------|--------|
| `github.com/gofiber/fiber/v2` | HTTP framework |
| `github.com/jackc/pgx/v5` | Driver PostgreSQL (app DB + target DB) |
| `github.com/go-sql-driver/mysql` | Driver MySQL (target DB) |
| `github.com/golang-migrate/migrate/v4` | Migrasi database (CLI tool) |
| `github.com/sqlc-dev/sqlc` | Generate type-safe Go code dari SQL (CLI tool) |
| `github.com/google/uuid` | Pembuatan UUID |
| `github.com/joho/godotenv` | Baca environment variable |
| `golang.org/x/crypto` | Utilitas enkripsi |
| `net/http` (stdlib) | HTTP client untuk AI provider |

> **Catatan tentang sqlc:** `sqlc` dan `migrate` adalah **CLI tools** yang di-install via `make install-tools`. Mereka bukan dependency di `go.mod` — hanya hasil generate sqlc (`internal/infrastructure/sqlc/generated/`) yang masuk ke source code.

> **Catatan tentang AI:** Tidak perlu SDK spesifik per AI provider. Karena kita menggunakan format OpenAI-compatible dan Anthropic-compatible, cukup gunakan `net/http` standar untuk memanggil API. Ini menjaga dependensi tetap minimal.

### 11.2 Next.js Frontend

#### 🔹 Core Framework

| Package | Versi | Fungsi |
|---------|-------|--------|
| `next` | **15.x** (latest) | Framework React — App Router, Server Components, API Routes |
| `react` + `react-dom` | **19.x** | Library UI |
| `typescript` | **5.x** | Type safety |

#### 🔹 UI & Styling

| Package | Fungsi |
|---------|--------|
| `shadcn/ui` | Komponen UI berkualitas tinggi (Button, Dialog, Sheet, Select, Tabs, dll) |
| `tailwindcss` | Utility-first CSS framework |
| `@radix-ui/*` | Primitive komponen headless (otomatis via shadcn/ui) |
| `lucide-react` | Icon library (otomatis via shadcn/ui) |
| `class-variance-authority` | Variant styling untuk komponen |
| `clsx` + `tailwind-merge` | Utility class merging |
| `sonner` | Notifikasi toast yang elegan |
| `next-themes` | Dark/light mode toggle |

#### 🔹 Form & Validasi

| Package | Fungsi |
|---------|--------|
| `react-hook-form` | Manajemen form — performa tinggi, uncontrolled by default |
| `zod` | Schema validasi — type-safe, composable |
| `@hookform/resolvers` | Bridge antara react-hook-form dan zod |

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

| Package | Fungsi |
|---------|--------|
| `@tanstack/react-query` | Server state management — cache, refetch, polling, optimistic update |
| `zustand` | Client state management — ringan, tanpa boilerplate |

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

| Package | Fungsi |
|---------|--------|
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

| Package | Fungsi |
|---------|--------|
| `@uiw/react-codemirror` | React wrapper untuk CodeMirror 6 |
| `@codemirror/lang-sql` | Syntax highlighting SQL — mendukung **PostgreSQL** dan **MySQL** dialect |
| `@codemirror/autocomplete` | Autocomplete SQL keywords + nama tabel/kolom |
| `@codemirror/theme-one-dark` | Tema dark mode untuk editor |

> **Kenapa CodeMirror, bukan Monaco?**
> Monaco Editor (dari VS Code) berukuran ~2-4 MB dan berat untuk dimuat. CodeMirror 6 jauh lebih ringan (~200KB), modular, dan memiliki dukungan SQL dialect yang lebih baik (`PostgreSQL`, `MySQL`, `SQLite`, dll). Untuk use case SQL editor saja, CodeMirror lebih tepat.

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

| Package | Fungsi |
|---------|--------|
| `cmdk` | Command palette — untuk `/{tabel}` autocomplete di generator input |
| `date-fns` | Format tanggal/waktu (riwayat, timestamp) |
| `nuqs` | Type-safe URL search params (filter, pagination state di URL) |

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
🔴 [BE] [ ] Setup proyek Go (go mod init, clean architecture folder structure)
🔴 [BE] [ ] Setup sqlc.yaml + Makefile
🔴 [BE] [ ] Install tools (make install-tools)
🔴 [BE] [ ] Tulis migration SQL (000001 - 000005)
🔴 [BE] [ ] Jalankan migrasi (make migrate-up)
🔴 [BE] [ ] Tulis sqlc queries untuk datasource
🔴 [BE] [ ] Generate code (make sqlc-generate)
🔴 [BE] [ ] Implementasi domain layer — entity Datasource + repository interface
🔴 [BE] [ ] Implementasi infrastructure — repo impl Datasource (menggunakan sqlc)
🔴 [BE] [ ] Implementasi infrastructure — config, database connection, encryption (AES)
🟡 [BE] [ ] Implementasi usecase — DatasourceUsecase (CRUD + test koneksi + enkripsi password)
🟡 [BE] [ ] Implementasi delivery — DatasourceHandler + router + middleware (CORS, logger)
🟡 [BE] [ ] Endpoint POST /datasources/:id/test — tes koneksi ke target DB
```

#### Frontend (setelah API BE siap)

```
🔴 [FE] [ ] Setup proyek Next.js 16 (create-next-app --typescript)
🔴 [FE] [ ] Install & setup shadcn/ui + Tailwind CSS + next-themes
🔴 [FE] [ ] Install react-hook-form + zod + @hookform/resolvers
🔴 [FE] [ ] Install @tanstack/react-query + setup QueryClientProvider
🔴 [FE] [ ] Setup API client (lib/api.ts) — base URL, fetch wrapper
🟡 [FE] [ ] Layout utama — Sidebar + Header + MainLayout
🟡 [FE] [ ] Halaman pengaturan datasource — DatasourceForm (zod schema + react-hook-form)
🟡 [FE] [ ] Halaman pengaturan datasource — DatasourceList (react-query fetch)
🟡 [FE] [ ] Tombol "Tes Koneksi" di form datasource
🟢 [FE] [ ] Toast notifikasi (sonner) untuk feedback aksi
```

---

### Sprint 2 — Schema Reader & AI Provider (1 minggu)

> **Tujuan:** Sistem bisa baca schema dari PG/MySQL, AI provider terdaftar dan tertes.

#### Backend (kerjakan dulu)

```
🔴 [BE] [ ] Implementasi adapter PostgreSQL (infrastructure/adapter/postgres.go)
🔴 [BE] [ ] Implementasi adapter MySQL (infrastructure/adapter/mysql.go)
🔴 [BE] [ ] AdapterRegistry — register + resolve adapter berdasarkan tipe
🔴 [BE] [ ] Schema Reader — baca tabel, kolom, relasi via information_schema
🔴 [BE] [ ] Cache schema ke JSONB (via sqlc query UpdateSchemaCache)
🟡 [BE] [ ] Endpoint GET /datasources/:id/tables — daftar tabel
🟡 [BE] [ ] Endpoint GET /datasources/:id/tables/:nama — detail tabel (kolom, relasi)
🟡 [BE] [ ] Endpoint GET /datasources/:id/tables/:nama/preview — preview 50 baris
🟡 [BE] [ ] Endpoint POST /datasources/:id/sync — refresh cache schema
🟡 [BE] [ ] Tulis sqlc queries untuk ai_providers
🟡 [BE] [ ] Generate code (make sqlc-generate)
🟡 [BE] [ ] Implementasi domain + repo + usecase + delivery AI Provider CRUD
🟢 [BE] [ ] Endpoint POST /ai-providers/:id/test — tes koneksi ke AI provider
```

#### Frontend (setelah API BE siap)

```
🟡 [FE] [ ] Halaman pengaturan AI provider — form (nama, format, base URL, API key, model)
🟡 [FE] [ ] Halaman pengaturan AI provider — daftar provider + set default
🟡 [FE] [ ] Tombol "Tes Koneksi" di form AI provider
🟡 [FE] [ ] Tampilan daftar tabel di sidebar (setelah pilih datasource)
🟢 [FE] [ ] Preview tabel — klik tabel → lihat kolom + 50 baris pertama (dialog/sheet)
```

---

### Sprint 3 — Generator & AI Generate (1.5 minggu)

> **Tujuan:** Core loop berjalan — user bisa bertanya di generator, AI generate SQL, tampil di editor.

#### Backend (kerjakan dulu)

```
🔴 [BE] [ ] Tulis sqlc queries untuk generator_sessions + generator_messages
🔴 [BE] [ ] Generate code (make sqlc-generate)
🔴 [BE] [ ] Implementasi domain — entity GeneratorSession, GeneratorMessage + repository interface
🔴 [BE] [ ] Implementasi infrastructure repo — generator_repo_impl.go
🔴 [BE] [ ] Implementasi usecase — GeneratorUsecase (buat sesi, kirim pesan, simpan respons)
🔴 [BE] [ ] AI Gateway — openai_compat.go (request/response format OpenAI)
🔴 [BE] [ ] AI Gateway — anthropic_compat.go (request/response format Anthropic)
🔴 [BE] [ ] AI Gateway — gateway.go (pilih client berdasarkan format_api provider)
🔴 [BE] [ ] Template prompt — injeksi schema + dialek + bahasa Indonesia (prompt.go)
🟡 [BE] [ ] SSE streaming — handler kirim respons AI secara stream ke frontend
🟡 [BE] [ ] Delivery — GeneratorHandler (POST /generator/sessions, GET /generator/sessions, POST /messages)
🟢 [BE] [ ] Parse tabel_direferensi dari pesan user (deteksi /{tabel})
```

#### Frontend (setelah API BE siap)

```
🔴 [FE] [ ] Install @uiw/react-codemirror + @codemirror/lang-sql + tema
🔴 [FE] [ ] GeneratorWindow — container utama (daftar pesan + input)
🔴 [FE] [ ] GeneratorInput — input pesan dengan /{tabel} autocomplete (cmdk)
🔴 [FE] [ ] GeneratorMessage — komponen pesan (user + assistant)
🔴 [FE] [ ] SSE client — terima streaming respons AI secara real-time
🟡 [FE] [ ] TableMention — chip/tag visual saat user ketik /{tabel}
🟡 [FE] [ ] QueryEditor — CodeMirror SQL editor (read-only mode untuk tampilkan SQL AI)
🟡 [FE] [ ] Daftar sesi generator di sidebar (buat baru, pilih, hapus)
🟢 [FE] [ ] Loading state saat AI sedang generate (skeleton/spinner)
```

---

### Sprint 4 — Eksekusi Query & Edit (1 minggu)

> **Tujuan:** User bisa edit SQL, jalankan query, dan lihat hasil di tabel interaktif.

#### Backend (kerjakan dulu)

```
🔴 [BE] [ ] Endpoint POST /query/execute — eksekusi query ke target DB
🔴 [BE] [ ] Read-only transaction enforcement (sql.TxOptions{ReadOnly: true})
🔴 [BE] [ ] Query guard middleware — tolak DELETE, DROP, UPDATE, INSERT, ALTER, dll
🔴 [BE] [ ] Limit otomatis — inject LIMIT 1000 jika tidak ada
🔴 [BE] [ ] Timeout query — context with timeout 30 detik
🟡 [BE] [ ] Format hasil query — kolom (nama + tipe) + baris (array)
🟡 [BE] [ ] Simpan hasil eksekusi ke generator_messages (sql_diedit, hasil_query, waktu_eksekusi_ms)
🟢 [BE] [ ] Endpoint POST /query/explain — EXPLAIN ANALYZE untuk estimasi
🟢 [BE] [ ] Penanganan error database — translate ke pesan Bahasa Indonesia
```

#### Frontend (setelah API BE siap)

```
🔴 [FE] [ ] QueryEditor — edit mode (CodeMirror, editable, syntax per dialect)
🔴 [FE] [ ] QueryEditor — autocomplete tabel/kolom dari schema cache
🔴 [FE] [ ] Install @tanstack/react-table
🔴 [FE] [ ] QueryResult — tabel hasil (render kolom + baris dari API response)
🟡 [FE] [ ] QueryResult — sorting per kolom (klik header)
🟡 [FE] [ ] QueryResult — pagination
🟡 [FE] [ ] QueryResult — column resize (drag)
🟡 [FE] [ ] QueryActions — tombol "Jalankan" (POST /query/execute)
🟡 [FE] [ ] QueryActions — tampilkan waktu eksekusi + jumlah baris di footer
🟢 [FE] [ ] QueryResult — column visibility toggle
🟢 [FE] [ ] QueryResult — filter per kolom
🟢 [FE] [ ] Penanganan error — tampilkan pesan error di bawah editor
```

---

### Sprint 5 — Simpan, Salin, Riwayat, Polish (1 minggu)

> **Tujuan:** Fitur pendukung lengkap, UI dipoles, testing end-to-end.

#### Backend (kerjakan dulu)

```
🔴 [BE] [ ] Tulis sqlc queries untuk saved_queries + query_history
🔴 [BE] [ ] Generate code (make sqlc-generate)
🔴 [BE] [ ] Implementasi domain + repo + usecase untuk SavedQuery + QueryHistory
🟡 [BE] [ ] Delivery — SavedQueryHandler (CRUD /saved-queries)
🟡 [BE] [ ] Delivery — HistoryHandler (GET /query-history, paginasi)
🟡 [BE] [ ] Auto-simpan ke query_history setiap kali query dieksekusi
🟢 [BE] [ ] Filter riwayat berdasarkan datasource, status, tanggal
🟢 [BE] [ ] Unit test semua usecase (make test)
```

#### Frontend (setelah API BE siap)

```
🟡 [FE] [ ] QueryActions — tombol "Simpan" → dialog (nama, deskripsi, tag) + zod validasi
🟡 [FE] [ ] QueryActions — tombol "Salin" → copy SQL ke clipboard
🟡 [FE] [ ] Halaman query tersimpan — daftar + pencarian + filter tag
🟡 [FE] [ ] Halaman query tersimpan — klik → muat ke editor + jalankan ulang
🟡 [FE] [ ] Halaman riwayat — daftar (tanggal, SQL, status, durasi) + paginasi (nuqs)
🟡 [FE] [ ] Halaman riwayat — klik → muat ke editor
🟢 [FE] [ ] Install date-fns — format timestamp di riwayat
🟢 [FE] [ ] Polish UI — loading skeleton, transisi halaman, responsif
🟢 [FE] [ ] Polish UI — dark/light mode toggle (next-themes)
🟢 [FE] [ ] Polish UI — empty state di setiap halaman
🟢 [FE] [ ] Testing end-to-end semua alur (npm run lint && npm run type-check)
```

---

### Ringkasan Sprint

| Sprint | Durasi | BE Tasks | FE Tasks | Fokus Utama |
|--------|--------|----------|----------|-------------|
| **1** | 1 minggu | 13 task | 10 task | Setup + Datasource CRUD |
| **2** | 1 minggu | 13 task | 5 task | Schema Reader + AI Provider |
| **3** | 1.5 minggu | 12 task | 9 task | Generator + AI Generate SQL ⭐ |
| **4** | 1 minggu | 9 task | 12 task | Edit + Jalankan Query ⭐ |
| **5** | 1 minggu | 8 task | 11 task | Simpan + Riwayat + Polish |
| **Total** | **5.5 minggu** | **55 task** | **47 task** | **102 task** |

> **Catatan:** Sprint 3 dan 4 adalah **inti produk** (ditandai ⭐). Jika waktu terbatas, prioritaskan kedua sprint ini. Sprint 1-2 adalah fondasi yang wajib, Sprint 5 adalah pelengkap yang bisa dikurangi scope-nya.

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

| # | Skenario | Kriteria Berhasil |
|---|----------|-------------------|
| 1 | Connect ke PostgreSQL | Schema terbaca, tabel tampil di daftar |
| 2 | Connect ke MySQL | Schema terbaca, tabel tampil di daftar |
| 3 | Daftarkan AI provider OpenAI-compatible | Tes koneksi berhasil |
| 4 | Daftarkan AI provider Anthropic-compatible | Tes koneksi berhasil |
| 5 | Ketik `/{tabel}` di generator | Autocomplete muncul dengan daftar tabel |
| 6 | Kirim pertanyaan bahasa natural | AI generate SQL yang valid untuk dialek yang benar |
| 7 | Edit SQL di editor | Perubahan tersimpan dan siap dijalankan |
| 8 | Jalankan query | Hasil tampil sebagai tabel dengan waktu eksekusi |
| 9 | Simpan query | Tersimpan dengan nama dan tag, muncul di halaman tersimpan |
| 10 | Salin SQL | SQL tersalin ke clipboard |
| 11 | Lihat riwayat | Semua query sebelumnya tampil dengan timestamp dan status |
| 12 | Coba kirim DELETE/DROP | Ditolak dengan pesan error Bahasa Indonesia |
| 13 | Query timeout > 30 detik | Dibatalkan dengan pesan error yang jelas |

---

## 14. 🔮 Implementasi Selanjutnya (Roadmap Post-MVP)

> **Catatan:** Section ini adalah backlog terstruktur agar tidak ada fitur yang terlupa. Implementasi dilakukan **setelah MVP stabil dan divalidasi user**.

### Fase 2 — Visualisasi & Peningkatan UX

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N1 | **Visualisasi Query** | Grafik Bar, Line, Pie, Area dari hasil query. User pilih tipe → AI sesuaikan query (GROUP BY, aggregate). Pustaka: Recharts atau ECharts. | 🟡 Sedang |
| N2 | **Visualisasi Adaptif** | User bilang "ubah ke pie chart per kategori" → AI tulis ulang query agar output sesuai format grafik | 🔴 Tinggi |
| N3 | **Memori Konteks Generator** | AI ingat percakapan sebelumnya dalam sesi, bisa perbaiki query secara iteratif | 🟡 Sedang |
| N4 | **Preview Tabel di Generator** | Saat user ketik `/{tabel}`, tampilkan popup preview (kolom + sampel 5 baris) | 🟢 Rendah |

### Fase 3 — Mesin Aturan & Keamanan

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N5 | **Mesin Aturan** | User tentukan aturan: "jangan query tanpa WHERE", "maks 10rb baris", "tabel `gaji` dibatasi". Validasi sebelum eksekusi. | 🟡 Sedang |
| N6 | **Keamanan Level Baris** | Batasi hasil query berdasarkan peran user (misal: sales hanya lihat region mereka) | 🔴 Tinggi |
| N7 | **Log Audit** | Catat siapa query apa, kapan, dari datasource mana | 🟢 Rendah |
| N8 | **Autentikasi User** | Sistem login, akses berbasis peran (admin, viewer, editor) | 🟡 Sedang |

### Fase 4 — Background Job & Performa

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N9 | **Antrean Background Job** | Query > 10 detik otomatis di-defer ke background. Notifikasi via WebSocket/SSE saat selesai. Stack: Redis + Go goroutine. | 🟡 Sedang |
| N10 | **Cache Hasil Query** | Cache hasil query yang sama dalam TTL tertentu, hindari eksekusi ulang | 🟡 Sedang |
| N11 | **Estimasi Biaya Query** | Sebelum jalankan, tampilkan estimasi waktu berdasarkan `EXPLAIN` | 🟡 Sedang |

### Fase 5 — Gabung Query & Multi-Datasource

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N12 | **Gabung Query (DB Sama)** | AI generate query yang JOIN tabel tanpa relasi langsung, dengan panduan AI | 🟡 Sedang |
| N13 | **Gabung Query (Lintas DB)** | Query dari 2 datasource berbeda → jalankan masing-masing → gabung di Go app layer | 🔴 Sangat Tinggi |
| N14 | **Pergantian Multi-Datasource** | Dalam satu sesi generator, user bisa ganti datasource tanpa buat sesi baru | 🟡 Sedang |

### Fase 6 — Embed & Berbagi

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N15 | **Embed Visualisasi** | Generate URL iframe embeddable dari query tersimpan + konfigurasi grafik. Non-realtime, refresh terjadwal. | 🟡 Sedang |
| N16 | **Bagikan Query via Tautan** | Buat tautan yang bisa dibagikan untuk query tersimpan (hanya lihat) | 🟢 Rendah |
| N17 | **Pembuat Dashboard** | Susun beberapa visualisasi menjadi satu halaman dashboard | 🔴 Tinggi |
| N18 | **Refresh Terjadwal** | Auto-refresh embed/dashboard pada interval tertentu (cron) | 🟡 Sedang |

### Fase 7 — AI Lanjutan

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| N19 | **Pencarian Tabel Semantik** | Untuk schema besar (100+ tabel), gunakan vector embedding + pgvector untuk cari tabel relevan. | 🔴 Tinggi |
| N20 | **Saran Query** | AI proaktif menyarankan pertanyaan berdasarkan schema yang tersedia | 🟡 Sedang |
| N21 | **Penjelasan Bahasa Natural** | Setelah jalankan query, AI jelaskan hasilnya dalam bahasa natural untuk stakeholder | 🟡 Sedang |
| N22 | **Perbaikan Otomatis Error** | Jika query gagal, AI otomatis coba perbaiki dan sarankan fix | 🟡 Sedang |

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|---------|
| AI generate SQL yang salah/berbahaya | Data salah, potensi kerusakan | Read-only transaction + validasi keyword + limit baris |
| Schema database terlalu besar untuk context AI | AI tidak bisa generate query akurat | Untuk MVP: cache schema + hanya kirim tabel yang dimention via `/{tabel}`. Post-MVP: vector search (N19) |
| Query berjalan sangat lama | Server hang, user menunggu | Timeout 30 detik. Post-MVP: background job (N9) |
| API key AI bocor | Biaya tak terduga | Enkripsi AES-256-GCM, key di env variable |
| Dialek SQL berbeda antar database | Query tidak valid | Kirim info `dialect` ke AI, template prompt per database type |

---

*Dokumen ini adalah acuan utama untuk development MVP SQL AI Tools. Perubahan signifikan harus di-review dan di-update di dokumen ini sebelum diimplementasikan.*
