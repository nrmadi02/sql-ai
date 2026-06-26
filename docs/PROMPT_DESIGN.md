# Prompt untuk Skill `design-taste-frontend` — SQL AI

> Salin blok di bawah ke session yang memanggil skill `design-taste-frontend`.
> Sesuaikan bagian `[ TUJUAN ]` sesuai apa yang sedang dikerjakan.

---

## ⚠️ Catatan scope (baca dulu sebelum pakai skill)

Skill `design-taste-frontend` adalah skill **anti-slop untuk landing/portfolio/redesign**.
Section 13-nya secara eksplisit **OUT OF SCOPE** untuk:

- Dashboard / dense product UI / admin panel
- Data table (pakai TanStack Table / AG Grid)
- Multi-step form / wizard
- Code editor (pakai Monaco / CodeMirror + official skinning)

Produk **SQL AI** didominasi tepat oleh hal-hal di atas (chat, editor SQL, tabel hasil,
form pengaturan datasource/AI provider, halaman riwayat). Oleh karena itu, **jangan**
meminta skill ini mendesain UI produk inti. Gunakan skill ini **hanya** untuk:

1. Empty state & onboarding (saat user belum connect DB / belum daftar AI provider).
2. Halaman penyambut / landing lokal (jika dibutuhkan).
3. Copy berbahasa Indonesia yang jelas dan tidak AI-slop.
4. Konsistensi design tokens (warna, radius, font, shadow) lintas permukaan.

Untuk UI produk inti, andalkan: **shadcn/ui** (sudah terpasang), **TanStack Table**,
**Monaco/CodeMirror**, dan pola backend dari PRD.

---

## 🐛 Perbaikan wajib SEBELUM desain (konflik font)

`globals.css` menyatakan:
```css
--font-sans: Bricolage Grotesque, ...;
--font-mono: JetBrains Mono, monospace;
```

Tapi `layout.tsx` mengimpor `Geist`, `Geist_Mono`, `Inter`, dan menetapkan
`Inter({ variable: '--font-sans' })` yang **menimpa** Bricolage Grotesque.
Akibatnya font Bricolage Grotesque tidak pernah dipakai.

Pilih salah satu dan konsisten:
- (A) Pakai Bricolage Grotesque + JetBrains Mono sesuai globals.css → hapus import
  Geist/Inter dari layout.tsx, dan muat Bricolage + JetBrains via `next/font/google`.
- (B) Pakai Geist + Geist Mono → perbarui `--font-sans` / `--font-mono` di globals.css.

Putusan ini memengaruhi seluruh tampilan. Selesaikan dulu.

---

## ✅ PROMPT UTAMA (siap pakai)

```
Saya sedang membangun frontend untuk produk "SQL AI" dan ingin kamu membantu
dengan bagian yang termasuk scope skill design-taste-frontend.

=== KONTEKS PRODUK (dari PRD) ===
- Produk: SQL AI — Natural Language to SQL untuk stakeholder bisnis non-teknis.
- Stack: Go (backend REST) + Next.js App Router (frontend).
- Bahasa UI: 100% Bahasa Indonesia (target user: stakeholder Indonesia).
- Core loop: Connect DB → baca schema → chat dengan /{tabel} mention → AI
  generate SQL → edit → jalankan → lihat hasil → simpan/salin.
- Halaman: generator (/generator), pengaturan datasource, pengaturan AI provider, riwayat, tersimpan.
- Belum ada auth (single user), deployment lokal (go run + npm run dev).

=== DESIGN TOKENS YANG SUDAH ADA (globals.css, jangan diubah sembarangan) ===
- Styling: Tailwind v4 (@import "tailwindcss") + shadcn/tailwind.css.
- Komponen UI: shadcn/ui (sudah terpasang lengkap, jangan rebuild).
- Font yang DITUJUK globals.css:
    --font-sans  : Bricolage Grotesque (display grotesque, BUKAN Inter)
    --font-mono  : JetBrains Mono (untuk kode SQL)
    --font-serif : Georgia
  Catatan: layout.tsx saat ini menimpa --font-sans dengan Inter — ini bug.
  Anggap font resmi = Bricolage Grotesque + JetBrains Mono.
- Palette (oklch, light + dark mode sudah ada):
    primary         : oklch(0.2236 0.1469 265.8205)  -> deep indigo/blue
    secondary       : oklch(0.9387 0.0262 264.4409)
    accent          : oklch(0.9356 0.0312 279.8620)
    ring            : oklch(0.6219 0.2036 262.1505)
    destructive     : oklch(0.5858 0.2220 17.5846)
    chart-1..5      : hue 262-322 (blue -> violet -> magenta -> red -> amber)
- Radius: base 1.25rem (20px), skala sm..4xl turunan. Soft-rounded konsisten.
- Shadow: soft, tinted, offset-y ~4px. Bukan pure-black drop shadow.
- Dark mode: dual-mode wajib, sudah ada token .dark.

=== DESIGN READ (aku minta kamu infer & konfirmasi satu kalimat) ===
Reading ini sebagai: PRODUCT TOOL internal untuk stakeholder bisnis Indonesia,
dengan bahasa visual tool-produktivitas yang bersih dan terpercaya, condong ke
shadcn/ui + Tailwind v4 + Bricolage Grotesque, BUKAN landing page marketing.

=== TIGA DIAL (sesuaikan scope produk, bukan baseline landing) ===
- DESIGN_VARIANCE : 4  (tool kerja -> predictable/offset, BUKAN artsy. Boleh
  sedikit asimetri pada empty state, tapi grid produk tetap rapi.)
- MOTION_INTENSITY: 3  (fokus fungsi. Hanya feedback state: hover, active,
  loading skeleton, toast. Hindari scroll-hijack/parallax di UI produk.)
- VISUAL_DENSITY  : 5  (ada tabel & daftar -> density menengah, tapi bukan
  cockpit. mono wajib untuk semua angka/kode SQL.)

=== RULES YANG WAJIB DITEGAKKAN ===
1. Scope: kerjakan HANYA empty state / onboarding / copy Bahasa Indonesia /
   konsistensi token. Jangan desain editor SQL, tabel hasil, atau form CRUD
   multi-step — itu ranah shadcn/ui + TanStack Table + Monaco.
2. Bahasa: SEMUA copy Bahasa Indonesia, alami, tidak robotik. Hindari kata
   filler ("Solusikan", "Maksimalkan", "Revolutionize"). Verba konkret.
3. Font: pakai Bricolage Grotesque (sans) + JetBrains Mono (kode/angka).
   JANGAN default ke Inter. Tidak boleh serif display (Georgia hanya untuk
   fallback, bukan headline).
4. Warna: palette indigo/blue yang sudah ada = brand sah (override LILA RULE,
   karena sudah didefinisikan di globals.css). TAPI jangan tambah AI-purple
   glow, gradient neon, atau accent warna lain di tengah halaman
   (Color Consistency Lock: satu accent = indigo, kunci di seluruh app).
5. Shape Consistency Lock: radius 20px (soft) untuk seluruh permukaan.
6. Interactive states wajib lengkap: loading skeleton (sesuai bentuk akhir),
   empty state (terkomposisi, ada ajakan aksi), error (inline untuk form,
   toast untuk transient), tactile feedback (:active -translate-y-[1px]).
7. Contrast WCAG AA minimum (body 4.5:1, large 3:1). Audit tiap CTA & form.
8. Viewport stability: min-h-[100dvh], BUKAN h-screen. Grid over flex-math.
9. Mobile collapse eksplisit per section (< 768px -> single column).
10. Icon: dari satu keluarga saja (@phosphor-icons/react atau hugeicons-react),
    strokeWidth distandarkan. Jangan hand-roll SVG icon.
11. ZERO em-dash (—) di mana pun. Pakai hyphen biasa atau pecah kalimat.
12. Pre-Flight Check (Section 14) wajib dijalankan sebelum output dianggap selesai.

=== [ TUJUAN SPESIFIK — ganti baris ini ] ===
Tugas spesifik saya saat ini: <deskripsikan, contoh di bawah>

Jalankan Brief Inference, nyatakan Design Read, lalu kerjakan tugas spesifiknya.
```

---

## Contoh pengisian `[ TUJUAN ]` (pilih salah satu, tempel ke blok di atas)

### A. Empty state & onboarding pertama
```
Tugas: buat empty state untuk halaman utama saat user BELUM punya datasource
dan BELUM daftar AI provider. Dua kondisi:
 (1) belum connect DB apa pun -> ajakan tambah datasource + ilustrasi konsep.
 (2) sudah connect DB tapi belum daftar AI provider -> ajakan daftar provider.
Copy Bahasa Indonesia, tonjolkan value (bisa tanya data pakai bahasa biasa),
bukan jargon teknis. Jangan fake screenshot div-based. Kalau butuh visual,
tandai slot placeholder + sebut dimensi yang dibutuhkan.
```

### B. Konsistensi design tokens
```
Tugas: audit konsistensi token lintas komponen yang akan saya bangun (sidebar,
header, card, button, table, badge). Berikan:
 - ringkasan token (warna, radius, font, shadow) sebagai single source of truth
 - aturan pemakaian (kapan primary vs secondary vs muted)
 - contoh komposisi tombol primary/secondary/ghost yang lolos contrast check
 - catatan dark mode parity
Kerjakan tanpa mengubah nilai token di globals.css.
```

### C. Copy & microcopy Bahasa Indonesia
```
Tugas: tulis microcopy (button, empty state, pesan error, tooltip, toast)
untuk core loop dalam Bahasa Indonesia yang alami. Cakupan:
 - tombol: jalankan, simpan, salin, tes koneksi, sinkronkan schema
 - error: query mengandung keyword berbahaya (DELETE/DROP/dll), query timeout
   >30detik, koneksi DB gagal, koneksi AI gagal
 - empty state: belum ada riwayat, belum ada query tersimpan, belum ada tabel
Hindari em-dash, hindari filler verb. Maksimal 25 kata per paragraf pendukung.
```

---

## Cara pakai

1. Bereskan dulu konflik font (bagian 🐛 di atas).
2. Salin **PROMPT UTAMA** ke session baru yang sudah aktif skill
   `design-taste-frontend`.
3. Ganti `[ TUJUAN ]` dengan salah satu contoh (A/B/C) atau tugas Anda sendiri.
4. Untuk UI produk inti (chat, editor, tabel, form), JANGAN pakai skill ini —
   gunakan shadcn/ui + TanStack Table + Monaco langsung.
