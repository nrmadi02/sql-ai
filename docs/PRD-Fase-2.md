# PRD Fase 2: Visualisasi & Peningkatan UX

> **Produk**: SQL AI — Natural Language to SQL untuk Stakeholder Non-Teknis
> **Fase**: 2 — Visualisasi & Peningkatan UX
> **Stack**: Go (Backend) + Next.js (Frontend)
> **Prasyarat**: MVP (Sprint 1–6) telah selesai dan stabil
> **Tanggal**: 28 Juni 2026

---

## 1. Ringkasan Fase

### 1.1 Tujuan

Fase 2 bertujuan mengubah SQL AI dari "alat query" menjadi **"alat insight"**. Stakeholder non-teknis tidak hanya melihat tabel angka, tetapi juga visualisasi grafik yang langsung menyampaikan cerita data. Selain itu, pengalaman generator ditingkatkan dengan memori konteks AI, preview tabel, dan peringatan hallucination.

### 1.2 Dampak yang Diharapkan


| Metrik                          | Sebelum (MVP)                 | Target Fase 2              |
| ------------------------------- | ----------------------------- | -------------------------- |
| Waktu dari pertanyaan → insight | ~2 menit (baca tabel angka)   | ~30 detik (lihat grafik)   |
| Retensi user                    | Rendah (tabel kurang menarik) | Tinggi (visual menarik)    |
| Iterasi query per sesi          | 1–2x (tanpa konteks)          | 3–5x (AI ingat percakapan) |
| Kepercayaan user terhadap AI    | Tidak terukur                 | Terukur (ada warning)      |




### 1.3 Fitur dalam Fase 2


| #   | Fitur                            | Prioritas | Kompleksitas |
| --- | -------------------------------- | --------- | ------------ |
| N4a | Peringatan AI Hallucination      | 🔴 P0     | 🟢 Rendah    |
| N4  | Preview Tabel di Generator       | 🟡 P1     | 🟢 Rendah    |
| N3  | Memori Konteks Generator         | 🟡 P1     | 🟡 Sedang    |
| N1  | Visualisasi Query                | 🔴 P0     | 🟡 Sedang    |
| N2  | Visualisasi Adaptif & Interaktif | 🟢 P2     | 🔴 Tinggi    |


> **Urutan implementasi**: N4a → N4 → N3 → N1 → N2 (dependensi: N2 bergantung pada N1 dan N3)

---



## 2. Keputusan Teknis Fase 2


| Keputusan                      | Pilihan                                                            | Alasan                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Pustaka Grafik                 | **Recharts** (via shadcn/ui `chart.tsx`)                           | Sudah ter-install via shadcn/ui, API deklaratif, ringan (~40KB gzipped), tema terintegrasi dengan shadcn design tokens |
| Tipe Grafik MVP                | Bar, Line, Pie, Area                                               | Empat tipe ini mencakup ~90% kebutuhan visualisasi bisnis                                                              |
| Konfigurasi Grafik             | User pilih manual (axis X, Y, kategori, warna kustom) + AI suggest | Transparan, user tetap punya kontrol. AI menyarankan konfigurasi berdasarkan struktur data                             |
| Lingkup Fitur Grafik           | Generator & SQL Editor                                             | Memberikan pengalaman visualisasi data di seluruh mode query                                                           |
| Penyimpanan Konfigurasi Grafik | Tabel baru `chart_configs`                                         | Terpisah dari query, satu query bisa punya beberapa visualisasi                                                        |
| Strategi Memori Konteks        | Sliding window (N pesan terakhir) + ringkasan awal                 | Menjaga token usage tetap terkendali tanpa kehilangan konteks penting                                                  |
| Batas Memori Konteks           | Maks 20 pesan terakhir + 1 ringkasan sistem                        | Estimasi ~4000 token konteks, sisanya untuk schema + respons                                                           |
| Peringatan Hallucination       | Banner statis di frontend                                          | Zero backend changes, implementasi murni frontend                                                                      |


---



## 3. Desain Fitur Detail



### 3.1 N4a — Peringatan AI Hallucination

**Prioritas**: 🔴 P0 — Effort rendah, dampak tinggi. Implementasi pertama.

#### Deskripsi

Tampilkan banner peringatan visual di setiap respons AI yang berisi SQL. Banner ini mengingatkan user bahwa query di-generate oleh AI dan harus diverifikasi sebelum dipercaya.

#### Spesifikasi UI

```
┌─────────────────────────────────────────────────────────┐
│ 💬 Assistant                                              │
│                                                           │
│  Berikut query untuk menampilkan total penjualan:        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │ ⚠️ Query ini di-generate AI. Pastikan hasilnya    │     │
│  │ sesuai ekspektasi sebelum digunakan.              │     │
│  │ [Pelajari lebih lanjut]                           │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
│  ┌─ SQL ──────────────────────────────────────────┐     │
│  │ SELECT DATE_TRUNC('month', created_at) AS bulan,│     │
│  │        SUM(total) AS total_penjualan            │     │
│  │ FROM pesanan                                    │     │
│  │ WHERE EXTRACT(YEAR FROM created_at) = 2024      │     │
│  │ GROUP BY bulan ORDER BY bulan;                   │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
│  [▶ Jalankan]  [💾 Simpan]  [📋 Salin]                   │
└─────────────────────────────────────────────────────────┘
```



#### Perilaku

- Banner muncul di **setiap** respons assistant yang mengandung `sql_dihasilkan`
- Banner menggunakan komponen shadcn/ui `alert` dengan variant `warning`
- User bisa dismiss banner **per sesi** (preference disimpan di localStorage)
- Link "Pelajari lebih lanjut" mengarah ke tooltip/dialog yang menjelaskan potensi kesalahan AI

---



### 3.2 N4 — Preview Tabel di Generator

**Prioritas**: 🟡 P1

#### Deskripsi

Saat user mengetik `/{tabel}` di generator input, selain autocomplete nama tabel, tampilkan juga popup preview yang menampilkan informasi kolom dan 5 baris data sampel.

#### Perilaku

1. User mengetik `/` → autocomplete popup muncul (existing)
2. User hover atau focus pada item tabel di autocomplete → panel preview muncul di samping
3. Preview mengambil data dari 2 endpoint yang **sudah ada**:
  - `GET /api/v1/datasources/:id/tables/:nama` → kolom + relasi
  - `GET /api/v1/datasources/:id/tables/:nama/preview` → 5 baris pertama
4. Data di-cache per sesi (menggunakan react-query dengan `staleTime: 5 menit`)

---



### 3.3 N3 — Memori Konteks Generator

**Prioritas**: 🟡 P1

#### Deskripsi

AI mengingat percakapan sebelumnya dalam sesi generator, sehingga user bisa melakukan iterasi.

#### Strategi Memori

```
┌──────────────────────────────────────────────────────────┐
│                  STRATEGI KONTEKS AI                       │
│                                                            │
│  Pesan 1-2 (lama):  Tidak disertakan langsung,            │
│                      diringkas jadi 1 pesan sistem         │
│                                                            │
│  Pesan 3-22 (baru): Disertakan lengkap sebagai history     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ System Prompt (schema + aturan)                   │     │
│  │ ↓                                                 │     │
│  │ [RINGKASAN] "Sebelumnya kita membahas query       │     │
│  │  penjualan per bulan dari tabel pesanan,           │     │
│  │  lalu diubah menjadi per minggu."                  │     │
│  │ ↓                                                 │     │
│  │ User: "tambahkan filter status = 'selesai'"       │     │
│  │ ↓                                                 │     │
│  │ Assistant: (SQL baru)                             │     │
│  └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```



#### Alur Teknis

1. Ambil pesan sesi.
2. Jika melebihi `max_history_messages` (20), ambil 5 pesan terlama, minta AI meringkasnya, lalu gabungkan dengan pesan terbaru.
3. Simpan `context_summary` ke database agar tidak perlu generate ringkasan dari awal tiap saat.
4. Build prompt: system + ringkasan + history + user_message.

---



### 3.4 N1 — Visualisasi Query ⭐

**Prioritas**: 🔴 P0 — Fitur inti Fase 2.

#### Deskripsi

Setelah menjalankan query dan mendapatkan hasil tabel, user bisa memilih untuk memvisualisasikan data dalam bentuk grafik. Tersedia 4 tipe grafik: **Bar**, **Line**, **Pie**, dan **Area**. Fitur ini tersedia di antarmuka Generator maupun SQL Editor manual.

#### Spesifikasi UI — Hasil Query dengan Tab Tabel/Grafik

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐                                       │
│ │ 📋 Tabel  │ │ 📊 Grafik │                                       │
│ └──────────┘ └──────────┘                                       │
│                                                                   │
│  ┌─ Konfigurasi ──────────────────────────────────────────────┐ │
│  │ Tipe: [Bar] [Line] [Pie] [Area]                             │ │
│  │ X: [bulan ▼]  Y: [total_penjualan ▼]  Kategori: [— ▼]     │ │
│  │ Warna: [Kustom ▼]      [🤖 Sarankan] [📥 PNG] [📥 CSV]     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Grafik ───────────────────────────────────────────────────┐ │
│  │ (Recharts render di sini)                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```



#### Fitur Grafik Detail


| Fitur                 | Deskripsi                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| **Format Angka**      | Menggunakan Locale ID (contoh: 1.500.000 menjadi `1,5jt` pada axis)          |
| **Kustomisasi Warna** | User dapat mengganti warna grafik dari palet shadcn default                  |
| **Export**            | Tersedia download grafik sebagai PNG dan data yang divisualisasi sebagai CSV |
| **Integrasi**         | Tab grafik tersedia baik di halaman `/generator` maupun `/sql-editor`        |




#### Skema Database — Tabel Baru

```sql
-- 000010_init_chart_configs.up.sql
CREATE TABLE chart_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_query_id UUID REFERENCES saved_queries(id) ON DELETE CASCADE,
    generator_message_id UUID REFERENCES generator_messages(id) ON DELETE CASCADE,
    sql_editor_tab_id UUID REFERENCES sql_editor_tabs(id) ON DELETE CASCADE, -- Tambahan integrasi editor
    chart_type VARCHAR(20) NOT NULL,           -- 'bar', 'line', 'pie', 'area'
    x_axis_column VARCHAR(255) NOT NULL,       -- nama kolom untuk sumbu X
    y_axis_columns TEXT[] NOT NULL,            -- nama kolom untuk sumbu Y (bisa multi)
    category_column VARCHAR(255),              -- nama kolom kategori (opsional)
    config JSONB DEFAULT '{}',                 -- konfigurasi tambahan (warna kustom, dll)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_chart_reference CHECK (
        saved_query_id IS NOT NULL OR generator_message_id IS NOT NULL OR sql_editor_tab_id IS NOT NULL
    )
);

CREATE INDEX idx_chart_configs_sq ON chart_configs(saved_query_id);
CREATE INDEX idx_chart_configs_gm ON chart_configs(generator_message_id);
CREATE INDEX idx_chart_configs_se ON chart_configs(sql_editor_tab_id);

-- 000010_init_chart_configs.down.sql
DROP TABLE IF EXISTS chart_configs;
```

---



### 3.5 N2 — Visualisasi Adaptif & Interaktif

**Prioritas**: 🟢 P2

#### Deskripsi

AI bisa **memodifikasi query** agar output-nya sesuai dengan format grafik. Lebih lanjut, jika hasil query menghasilkan baris data terlalu besar (misal > 100 baris) yang kurang optimal untuk divisualisasi, sistem akan memberikan **saran filter interaktif**.

#### Alur Filter Interaktif (Large Dataset)

1. Query dieksekusi dan menghasilkan 1000 baris data.
2. Saat user beralih ke tab "Grafik", sistem menampilkan render awal grafik yang sangat padat ATAU peringatan.
3. Muncul rekomendasi filter (di-generate AI atau rule-based):
  - 💡 *Rekomendasi:* "Tampilkan Top 10 berdasarkan `total_penjualan`"
  - 💡 *Rekomendasi:* "Kelompokkan data per Bulan"
4. User mengklik rekomendasi tersebut.
5. AI otomatis mengubah query (menambahkan `ORDER BY ... LIMIT 10` atau `GROUP BY DATE_TRUNC('month', ...)`).
6. Query dieksekusi ulang dan grafik tampil dengan sempurna.



#### Perubahan pada Prompt AI

Tambah instruksi visualisasi di `prompt.go` (aturan ke-8 dan ke-9):

```
8. Jika user meminta visualisasi (grafik, chart), tulis ulang query agar sesuai:
   - Pie: kategori + aggregate
   - Line/Area: temporal (X) + numerik (Y)
   - Bar: kategori/temporal (X) + numerik (Y)
9. Berikan saran konfigurasi grafik dalam JSON di blok kode `chart`:
   ```chart
   {"chart_type": "pie", "x_axis_column": "kategori", "y_axis_columns": ["total"], "category_column": null}
```

```

```

#### Perubahan Teknis


| Layer    | Perubahan                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Backend  | ✅ Logika analisis data size di `/api/v1/charts/suggest`                                                      |
| Backend  | ✅ Parse blok `chart` di `generator_stream.go`                                                                |
| Backend  | ✅ Extend `AIMetadata` struct — tambah field `SuggestedChart json.RawMessage` dan `SuggestedFilters []string` |
| Frontend | ✅ Modifikasi UI agar memunculkan chip rekomendasi saat data `> 100 baris`                                    |


---

## 4. Arsitektur Teknis Backend (Disesuaikan dengan Codebase)

```
backend/internal/
├── domain/
│   ├── entity/
│   │   └── chart.go                    # Struct Go murni tanpa JSON tags
│   └── repository/
│       └── chart_repo.go               # ChartConfigRepository interface
│
├── usecase/
│   ├── chart_usecase.go                # ChartUsecase
│   └── generator_stream.go             # Implementasi sliding window & parse chart block
│
├── delivery/http/
│   ├── handler/
│   │   └── chart_handler.go            # ChartHandler
│   ├── dto/
│   │   └── chart_dto.go                # struct dengan json tags untuk API
│   └── router.go                       # Tambah /api/v1/charts
│
└── infrastructure/
    ├── ai/
    │   └── prompt.go                   # Tambah instruksi visualisasi + windowing
    ├── repository/
    │   └── chart_repo_impl.go          # implements ChartConfigRepository via sqlc
    └── sqlc/
        └── queries/
            └── chart_config.sql        # sqlc queries
```

---

## 5. Rencana Sprint Fase 2

### Legenda

```
🔴 P0 — Critical path
🟡 P1 — Penting
🟢 P2 — Pelengkap

[BE] — Backend (Go)
[FE] — Frontend (Next.js)
```

---

### Sprint 7 — Peringatan AI + Preview Tabel + Memori Konteks (1 minggu)

> **Tujuan:** N4a, N4, dan N3 selesai. Generator menjadi lebih transparan, informatif, dan cerdas.

#### Backend

- 🔴 [BE] [x] Migrasi 000009: tambah kolom `context_summary` ke `generator_sessions`
- 🔴 [BE] [x] Jalankan migrasi (`make migrate-up`)
- 🔴 [BE] [x] Tulis sqlc query: `UpdateGeneratorSessionSummary`, `GetGeneratorSessionWithSummary`
- 🔴 [BE] [x] Generate code (`make sqlc-generate`)
- 🔴 [BE] [x] Modifikasi `prompt.go` — sliding window: ambil N pesan terakhir, ringkas pesan lama
- 🔴 [BE] [x] Modifikasi `generator_stream.go` — implementasi logika sliding window
- 🟡 [BE] [x] Update event SSE `meta` — kirim `history_messages_count` dan `context_windowed` flag

#### Frontend

- 🔴 [FE] [x] N4a: Modifikasi `generator-message.tsx` — tambah Alert warning di respons yang punya SQL
- 🔴 [FE] [x] N4a: Dismiss per sesi (localStorage) + tooltip "Pelajari lebih lanjut"
- 🔴 [FE] [x] N4: Komponen baru `table-preview-popup.tsx` — kolom + relasi + 5 baris sampel
- 🔴 [FE] [x] N4: Modifikasi `generator-input.tsx` — hover/focus pada autocomplete → tampilkan preview
- 🟡 [FE] [x] N4: Extend `useSchemaTables` di query hooks frontend — fetch + cache (staleTime: 5 menit)
- 🟡 [FE] [x] N3: Update panel transparansi AI — tampilkan `context_windowed` dan `history_messages_count`

---

### Sprint 8 — Visualisasi Query & Integrasi Editor (1.5 minggu)

> **Tujuan:** N1 selesai end-to-end. User bisa membuat grafik Bar, Line, Pie, Area dari hasil query.

#### Backend (kerjakan dulu)

- 🔴 [BE] [x] Migrasi 000010: tabel `chart_configs` dengan relasi ke `generator_messages`, `saved_queries`, `sql_editor_tabs`
- 🔴 [BE] [x] Jalankan migrasi (`make migrate-up`)
- 🔴 [BE] [x] Tulis sqlc queries: `chart_config.sql` (CRUD) + `make sqlc-generate`
- 🔴 [BE] [x] Domain: entity `ChartConfig` + repository interface `ChartConfigRepository`
- 🔴 [BE] [x] Infrastructure: `chart_repo_impl.go`
- 🔴 [BE] [x] Usecase: `ChartUsecase` — CRUD konfigurasi grafik
- 🟡 [BE] [x] Delivery: `ChartHandler` — endpoint CRUD
- 🟡 [BE] [x] Router: tambah route group `/api/v1/charts`
- 🟡 [BE] [x] DTO: buat `chart_dto.go` dengan `json` tags
- 🟡 [BE] [x] Wire DI di `main.go`: repo → usecase → handler → router

#### Frontend (setelah API BE siap)

- 🔴 [FE] [x] Komponen `chart-panel.tsx` — container tab Tabel/Grafik
- 🔴 [FE] [x] Komponen `chart-renderer.tsx` — render 4 tipe grafik (Bar, Line, Pie, Area) dengan Recharts
- 🔴 [FE] [x] Komponen `chart-config.tsx` — form pilih tipe, sumbu X, Y, kategori, dan kustomisasi warna
- 🔴 [FE] [x] Fungsi transformasi data — konversi `baris[][]` ke format object untuk Recharts
- 🔴 [FE] [x] Hook `useChart.ts` — CRUD grafik (react-query)
- 🔴 [FE] [x] Modifikasi `query-result.tsx` — tambah tab Tabel/Grafik via ChartPanel
- 🟡 [FE] [x] Format angka Indonesia: Locale ID `1,5jt` untuk label axis grafik
- 🟡 [FE] [x] Integrasi export PNG (`html2canvas`) dan ekspor CSV di Toolbar grafik
- 🟡 [FE] [x] Pasang ChartPanel di halaman `/generator` (di dalam `generator-message.tsx`)
- 🟡 [FE] [x] Pasang ChartPanel di halaman `/sql-editor` manual

---

### Sprint 9 — Visualisasi Adaptif & Filter Interaktif (1 minggu)

> **Tujuan:** N2 selesai. AI bisa menulis ulang query untuk format grafik, dan auto-suggest filter jika data terlalu besar (>100 baris).

#### Backend

- 🔴 [BE] [ ] Modifikasi `prompt.go` — tambah instruksi visualisasi (aturan 8-9 di system prompt)
- 🔴 [BE] [ ] Modifikasi `generator_stream.go` — parse blok `chart` dari respons AI
- 🟡 [BE] [ ] Extend `AIMetadata` struct — tambah field `SuggestedChart` dan `SuggestedFilters`
- 🟡 [BE] [ ] Usecase: `ChartUsecase.Suggest()` — logika deteksi otomatis tipe grafik & filter dataset besar

#### Frontend

- 🔴 [FE] [ ] Modifikasi `generator-message.tsx` — deteksi `suggested_chart` di `AIMetadata`
- 🔴 [FE] [ ] Komponen notifikasi: "AI menyarankan [tipe] chart" + tombol "Terapkan"
- 🟡 [FE] [ ] UI Chip interaktif: Munculkan rekomendasi filter saat baris data > 100 ("Tampilkan Top 10", "Kelompokkan per bulan")
- 🟡 [FE] [ ] Implementasi klik chip rekomendasi → trigger AI untuk rewrite SQL query
- 🟢 [FE] [ ] Polish seluruh Fase 2: transisi, responsif, empty state, error handling

---

