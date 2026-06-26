// Curated Indonesian microcopy for SQL AI.
// Single source of truth for button labels, error messages, and empty states.
//
// Rules (per design-taste-frontend skill):
//  - Natural language, no technical jargon. Target user: non-technical stakeholder.
//  - NO em-dash. Break sentences with a period or comma.
//  - NO filler verbs ("Maksimalkan", "Solusikan", "Revolutionize").
//  - Concrete verbs. Max ~25 words per supporting paragraph.

export const buttons = {
  run: "Jalankan",
  save: "Simpan",
  copy: "Salin",
  testConnection: "Tes koneksi",
  syncSchema: "Sinkronkan schema",
  addDatasource: "Tambah datasource",
  registerProvider: "Daftarkan provider",
  startGenerator: "Mulai",
  cancel: "Batal",
  delete: "Hapus",
  saveChanges: "Simpan perubahan",
} as const;

// Empty states are embedded directly in each page (see app/(app)/*).
// Error messages below are used by toasts (sonner) and inline form errors.

export const errors = {
  // Query contains a forbidden keyword (PRD 8.2).
  forbiddenKeyword:
    "Query mengandung perintah yang tidak diizinkan (misal DELETE, DROP, atau UPDATE). SQL AI hanya menjalankan query baca.",
  // Query exceeded the 30s timeout (PRD 8.4).
  timeout:
    "Query berjalan terlalu lama dan dibatalkan setelah 30 detik. Coba persempit rentang tanggal atau batasi jumlah baris.",
  // Database connection failed.
  dbConnectionFailed:
    "Tidak bisa menyambung ke database. Periksa host, port, dan kredensial di pengaturan datasource.",
  // AI connection failed.
  aiConnectionFailed:
    "AI provider tidak merespons. Periksa base URL dan API key, lalu coba tes koneksi lagi.",
  // Query returned no rows (not an error, but needs explaining).
  emptyResult:
    "Query berhasil tapi tidak ada data yang cocok. Coba ubah filter atau rentang waktu.",
} as const;

export const toasts = {
  querySucceeded: "Query berhasil dijalankan",
  querySaved: "Query tersimpan",
  sqlCopied: "SQL tersalin ke clipboard",
  connectionSucceeded: "Koneksi berhasil",
  schemaSynced: "Schema berhasil disinkronkan",
  datasourceDeleted: "Datasource dihapus",
} as const;

export const formLabels = {
  datasourceName: "Nama datasource",
  dbType: "Tipe database",
  host: "Host",
  port: "Port",
  databaseName: "Nama database",
  username: "Username",
  password: "Password",
  sslMode: "Mode SSL",
  providerName: "Nama provider",
  apiFormat: "Format API",
  baseUrl: "Base URL",
  apiKey: "API key",
  model: "Model",
} as const;

export const formPlaceholders = {
  datasourceName: "contoh: Database Produksi",
  host: "localhost",
  databaseName: "toko_online",
  username: "readonly_user",
  providerName: "contoh: OpenAI GPT-4o",
  baseUrl: "https://api.openai.com",
  apiKey: "sk-xxxx",
  model: "gpt-4o",
} as const;
