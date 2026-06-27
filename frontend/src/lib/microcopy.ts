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
  newSession: "Pertanyaan baru",
  send: "Kirim",
  cancel: "Batal",
  delete: "Hapus",
  saveChanges: "Simpan perubahan",
  setDefault: "Jadikan default",
} as const;

export const query = {
  runLabel: "Jalankan query",
  resultTitle: "Hasil query",
  executionTime: "Waktu eksekusi",
  rowCount: "Jumlah baris",
  truncated: "Hasil dipotong ke batas maksimum",
  emptyResult: "Query berhasil tapi tidak ada baris yang ditampilkan.",
  columnVisibility: "Kolom",
  filterPlaceholder: "Filter…",
  pageSize: "Baris per halaman",
  showingRows: "Menampilkan",
  ofTotal: "dari",
  workspaceTitle: "Workspace query",
  workspaceDescription:
    "Edit SQL, jalankan ke datasource aktif, lalu telusuri hasil di tabel.",
  openWorkspace: "Edit & jalankan",
  viewResults: "Lihat hasil",
  running: "Menjalankan query…",
  waitingResult:
    "Belum ada hasil. Jalankan query untuk melihat data dari database.",
  previewMore: "baris lainnya",
  queryFailed: "Query gagal",
} as const;

export const generator = {
  inputPlaceholder:
    "Tulis pertanyaan tentang datamu. Ketik garis miring lalu nama tabel, misalnya /pesanan.",
  inputHint:
    "Sebut tabel dengan garis miring supaya AI tahu konteksnya. Tekan Enter untuk kirim, Shift+Enter untuk baris baru.",
  generating: "AI sedang menulis respons",
  emptySession:
    "Mulai dengan pertanyaan singkat. AI akan merangkai SQL berdasarkan schema datasource aktif.",
  noSessions: "Belum ada percakapan. Buat pertanyaan baru untuk mulai.",
  openSessions: "Percakapan",
  untitledSession: "Percakapan baru",
  tableMentionLabel: "Tabel dirujuk",
  sqlLabel: "SQL yang dihasilkan",
  aiMetaTitle: "Detail AI",
  aiMetaProvider: "Provider",
  aiMetaModel: "Model",
  aiMetaDialect: "Dialek",
  aiMetaContextTables: "Tabel konteks",
  aiMetaAvailableTables: "Tabel tersedia",
  aiMetaHistory: "Riwayat percakapan",
  aiMetaEstimatedContext: "Estimasi konteks",
  aiMetaPromptTokens: "Token prompt",
  aiMetaCompletionTokens: "Token respons",
  aiMetaTotalTokens: "Total token",
  aiMetaPendingTokens: "Menghitung token",
  aiMetaNoContextTables: "Tidak ada tabel detail dikirim",
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

export const saved = {
  pageTitle: "Query tersimpan",
  pageDescription:
    "Koleksi SQL yang kamu simpan. Buka, jalankan ulang, atau hapus tanpa menulis dari nol.",
  searchPlaceholder: "Cari nama atau deskripsi…",
  tagFilterPlaceholder: "Filter tag",
  allTags: "Semua tag",
  saveDialogTitle: "Simpan query",
  saveDialogDescription:
    "Beri nama agar mudah ditemukan lagi. Tag opsional, pisahkan dengan koma.",
  nameLabel: "Nama",
  descriptionLabel: "Deskripsi",
  tagsLabel: "Tag",
  tagsHint: "Pisahkan dengan koma, misalnya laporan, penjualan",
  namePlaceholder: "contoh: Penjualan bulanan",
  descriptionPlaceholder: "Opsional. Catatan singkat tentang query ini.",
  tagsPlaceholder: "laporan, penjualan",
  openQuery: "Buka di editor",
  deleteConfirm: "Hapus query ini?",
  noResults: "Tidak ada query yang cocok dengan filter.",
} as const;

export const history = {
  pageTitle: "Riwayat query",
  pageDescription:
    "Semua query yang pernah dijalankan, lengkap dengan status dan waktu eksekusi.",
  statusSuccess: "Berhasil",
  statusFailed: "Gagal",
  allStatuses: "Semua status",
  allDatasources: "Semua datasource",
  openQuery: "Muat ke editor",
  noResults: "Tidak ada riwayat yang cocok dengan filter.",
  columnTime: "Waktu",
  columnSql: "SQL",
  columnStatus: "Status",
  columnDuration: "Durasi",
  columnRows: "Baris",
} as const;

export const sqlEditor = {
  pageTitle: "SQL Editor",
  pageDescription:
    "Tulis dan jalankan SQL langsung. Autocomplete schema, multi-tab, dan riwayat eksekusi.",
  newSession: "Sesi baru",
  noSessions: "Belum ada sesi editor. Buat sesi baru untuk mulai menulis SQL.",
  untitledSession: "Sesi editor baru",
  defaultTabName: "Query",
  schemaPanel: "Schema",
  historyPanel: "Riwayat",
  openSessions: "Sesi",
  openSchema: "Schema",
  openHistory: "Riwayat",
  schemaSheetDescription:
    "Jelajahi tabel dan kolom. Klik untuk sisipkan ke editor.",
  historySheetDescription: "Query yang pernah dijalankan dari editor ini.",
  searchSchema: "Cari tabel atau kolom…",
  emptyEditor:
    "Mulai menulis SQL. Autocomplete tabel dan kolom aktif setelah datasource dipilih.",
  selectDatasource: "Pilih datasource di toolbar untuk menjalankan query.",
  runSelection: "Jalankan seleksi",
  formatSql: "Format SQL",
  statusBarDatasource: "Datasource",
  statusBarDialect: "Dialek",
  statusBarRows: "Baris",
  statusBarDuration: "Durasi",
  historyEmpty: "Belum ada query dari editor.",
  historySearch: "Cari SQL…",
  renameTab: "Ganti nama tab",
  closeTab: "Tutup tab",
  newTab: "Tab baru",
  sessionLabel: "Sesi",
  renameSession: "Ganti nama sesi",
  renameSessionPlaceholder: "Nama sesi, mis. Analisis users",
  renameSessionHint: "Double-click untuk ganti nama",
  sessionRenamed: "Nama sesi diperbarui",
  sessionDeleted: "Sesi editor dihapus",
  tabSaved: "Tab tersimpan",
  openFromSaved: "Buka di Editor",
  shortcuts: {
    run: "Ctrl+Enter",
    format: "Ctrl+Shift+F",
    newTab: "Ctrl+T",
    closeTab: "Ctrl+W",
    nextTab: "Ctrl+Tab",
  },
} as const;

export const toasts = {
  querySucceeded: "Query berhasil dijalankan",
  querySaved: "Query tersimpan",
  sqlCopied: "SQL tersalin ke clipboard",
  connectionSucceeded: "Koneksi berhasil",
  schemaSynced: "Schema berhasil disinkronkan",
  datasourceDeleted: "Datasource dihapus",
  providerDeleted: "AI provider dihapus",
  providerDefaultSet: "Provider default diperbarui",
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
