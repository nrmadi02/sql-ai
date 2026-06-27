# SQL AI

**Natural Language to SQL** — alat berbasis chat yang memungkinkan siapa pun menanyakan database dalam bahasa Indonesia, mendapatkan query SQL, mengeditnya, menjalankannya, dan menyimpan hasilnya — tanpa perlu memahami SQL.

> MVP v0.1 — fokus pada core loop: connect → baca schema → generate → edit → jalankan → simpan.

---

## Fitur

| Fitur | Deskripsi |
| --- | --- |
| **Generator AI** | Ketik pertanyaan dalam bahasa natural, AI menghasilkan SQL sesuai dialek database aktif |
| **`/{tabel}` context** | Sertakan konteks tabel ke prompt AI dengan mengetik `/{nama_tabel}` di generator |
| **SQL Editor** | Editor SQL manual dengan autocomplete, multi-tab, dan multi-sesi |
| **Multi-database** | Koneksi ke PostgreSQL dan MySQL |
| **Schema browser** | Baca tabel, kolom, tipe data, dan relasi dari datasource terhubung |
| **Jalankan & preview** | Eksekusi query dan tampilkan hasil sebagai tabel interaktif |
| **Simpan & riwayat** | Simpan query favorit dan lihat riwayat eksekusi |
| **Custom AI provider** | Daftarkan provider sendiri (OpenAI-compatible & Anthropic-compatible) |
| **Transparansi AI** | Tampilkan provider, model, tabel konteks, dan penggunaan token per respons |

---

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| **Backend** | Go 1.25, [Fiber](https://gofiber.io/), Clean Architecture |
| **Database (app)** | PostgreSQL + [sqlc](https://sqlc.dev/) + [golang-migrate](https://github.com/golang-migrate/migrate) |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | shadcn/ui, Tailwind CSS 4 |
| **SQL Editor** | CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-sql`) |
| **Data fetching** | TanStack Query, TanStack Table |
| **Forms** | React Hook Form + Zod |

---

## Arsitektur

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│  Generator │ SQL Editor │ Riwayat │ Tersimpan │ Settings │
└────────────────────────────┬─────────────────────────────┘
                             │ REST API + SSE
┌────────────────────────────▼─────────────────────────────┐
│              Go Backend (Clean Architecture)              │
│  Delivery → Usecase → Domain ← Infrastructure             │
└────────────────────────────┬─────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         PostgreSQL     PostgreSQL/      AI Provider
         (app DB)         MySQL           (custom)
                        (user DB)
```

**Backend layers:**

- **Domain** — entity & repository interfaces
- **Usecase** — business logic
- **Delivery** — HTTP handlers, DTO, middleware
- **Infrastructure** — sqlc repos, DB adapters, AI client, encryption

---

## Prasyarat

- **Go** 1.25+
- **Node.js** 20+ & **pnpm**
- **PostgreSQL** (untuk app database)
- CLI tools (diinstal otomatis via Makefile):
  - [sqlc](https://sqlc.dev/)
  - [golang-migrate](https://github.com/golang-migrate/migrate)

---

## Quick Start

### 1. Clone repository

```bash
git clone https://github.com/nrmadi02/sql-ai.git
cd sql-ai
```

### 2. Setup environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `.env` dan `backend/.env` sesuai konfigurasi lokal Anda:

```env
# App Database
DATABASE_URL=postgres://user:password@localhost:5432/sqlai?sslmode=disable

# Encryption key (harus tepat 32 karakter untuk AES-256)
ENCRYPTION_KEY=enkripsi-sqlai-dev-key-32bytes!!

# Server
BACKEND_PORT=8080
FRONTEND_PORT=3000
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Buat database PostgreSQL untuk aplikasi:

```bash
createdb sqlai
```

### 3. Setup backend

```bash
cd backend
make setup    # install tools + migrate + sqlc generate
make run      # jalankan server di :8080
```

### 4. Setup frontend

Di terminal terpisah:

```bash
cd frontend
pnpm install
pnpm dev      # jalankan di :3000
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Konfigurasi awal di UI

1. **Pengaturan → Datasource** — tambahkan koneksi PostgreSQL/MySQL target
2. **Pengaturan → AI Provider** — daftarkan provider AI (API key, base URL, model)
3. Mulai dari **Generator** atau **SQL Editor**

---

## Struktur Proyek

```
sql-ai/
├── backend/
│   ├── cmd/server/          # Entry point
│   ├── internal/
│   │   ├── delivery/http/     # Handlers, router, middleware
│   │   ├── domain/            # Entities & interfaces
│   │   ├── usecase/           # Business logic
│   │   └── infrastructure/    # sqlc, adapters, AI client
│   ├── migrations/            # Database migrations
│   └── Makefile
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # UI components
│       ├── hooks/             # React Query hooks
│       └── lib/               # Utils, types, navigation
└── docs/
    └── PRD.md                 # Product requirements
```

---

## Perintah Development

### Backend (`backend/`)

```bash
make help              # Daftar semua perintah
make run               # Jalankan server
make test              # Unit test
make migrate-up        # Jalankan migrasi
make sqlc-generate     # Generate kode dari SQL
make generate          # migrate-up + sqlc-generate
```

### Frontend (`frontend/`)

```bash
pnpm dev               # Development server
pnpm build             # Production build
pnpm lint              # Biome lint
pnpm type-check        # TypeScript check
```

---

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

| Group | Endpoint | Deskripsi |
| --- | --- | --- |
| Health | `GET /health` | Health check |
| Datasources | `POST/GET/PUT/DELETE /datasources` | CRUD datasource |
| Schema | `GET /datasources/:id/tables` | Daftar tabel |
| AI Providers | `POST/GET/PUT/DELETE /ai-providers` | CRUD AI provider |
| Generator | `POST /generator/sessions/:id/messages` | Kirim pesan (SSE stream) |
| Query | `POST /query/execute` | Jalankan SQL |
| Saved Queries | `POST/GET/PUT/DELETE /saved-queries` | CRUD query tersimpan |
| Query History | `GET /query-history` | Riwayat eksekusi |
| SQL Editor | `POST/GET/PUT/DELETE /sql-editor/sessions` | Sesi & tab editor |

---

## Environment Variables

| Variable | Wajib | Deskripsi |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Connection string PostgreSQL app database |
| `ENCRYPTION_KEY` | ✅ | Kunci AES-256 (32 karakter) untuk enkripsi credential |
| `BACKEND_PORT` | | Port backend (default: `8080`) |
| `CORS_ORIGIN` | | Origin frontend yang diizinkan |
| `NEXT_PUBLIC_API_URL` | ✅ | Base URL backend untuk frontend |

---

## Roadmap

- [ ] Autentikasi multi-user
- [ ] Export hasil query (CSV/Excel)
- [ ] Docker Compose untuk deployment
- [ ] Dukungan database tambahan (SQLite, SQL Server)
- [ ] Query visualization (chart)

---

## Kontribusi

Kontribusi sangat diterima! Silakan buka issue terlebih dahulu untuk mendiskusikan perubahan besar, lalu submit pull request.

1. Fork repository
2. Buat branch fitur (`git checkout -b feat/nama-fitur`)
3. Commit perubahan (`git commit -m 'feat: tambah fitur X'`)
4. Push ke branch (`git push origin feat/nama-fitur`)
5. Buka Pull Request

---

## Lisensi

Belum ditentukan.