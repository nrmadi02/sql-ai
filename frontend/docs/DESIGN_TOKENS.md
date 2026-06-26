# Design Tokens - SQL AI (Source of Truth)

> Sumber kebenaran tunggal untuk token visual SQL AI.
> Nilai aktual ada di `frontend/src/app/globals.css`. Dokumen ini adalah
> ringkasan + aturan pakai. **Jangan ubah nilai token tanpa update globals.css.**

## Design Read

**Reading this as:** PRODUCT TOOL internal untuk stakeholder bisnis Indonesia,
bahasa visual tool-produktivitas bersih dan terpercaya, condong ke
**shadcn/ui + Tailwind v4 + Bricolage Grotesque**, BUKAN landing page marketing.

## Tiga Dial

| Dial | Nilai | Alasan |
|------|-------|--------|
| `DESIGN_VARIANCE` | 4 | Tool kerja: grid rapi, sedikit asimetri pada empty state saja |
| `MOTION_INTENSITY` | 3 | Feedback state (hover, active, loading, toast). No scroll-hijack |
| `VISUAL_DENSITY` | 5 | Menengah: ada tabel & daftar, tapi bukan cockpit. Mono wajib untuk angka |

## Scope Skill

Skill `design-taste-frontend` dipakai HANYA untuk:
- Empty state & onboarding
- Copy Bahasa Indonesia
- Konsistensi token

UI produk inti (chat, editor SQL, tabel hasil, form CRUD) = shadcn/ui
+ TanStack Table + Monaco. Bukan ranah skill ini.

---

## 1. Font

| Token | Nilai | Pakai untuk |
|-------|-------|-------------|
| `--font-sans` | Bricolage Grotesque | Semua teks UI, headline, body |
| `--font-mono` | JetBrains Mono | Kode SQL, angka, metrik, timestamp |
| `--font-serif` | Georgia | Fallback saja, jangan dipakai untuk headline |

- **Pelanggaran umum:** Inter. JANGAN. Bricolage Grotesque adalah brand font.
- **Serif dilarang** sebagai display default (Section 4.1 skill).
- `letter-spacing` default: `-0.01em` (tracking-normal).
- Dimuat via `next/font/google` di `layout.tsx`, `font-display: swap`.

## 2. Warna (oklch, sudah dual-mode)

Sumber: `globals.css` `:root` (light) dan `.dark` (dark).

### Token semantik

| Token | Light | Dark | Peran |
|-------|-------|------|-------|
| `--background` | `oklch(0.9924 0.0028 308.43)` | `oklch(0.1063 0.0172 259.54)` | Latar halaman |
| `--foreground` | `oklch(0.1288 0.0219 314.01)` | `oklch(0.9924 0.0028 308.43)` | Teks utama |
| `--card` | `oklch(1 0 0)` | `oklch(0.1450 0.0211 263.18)` | Permukaan card |
| `--card-foreground` | = foreground | = foreground | Teks pada card |
| `--popover` | `oklch(1 0 0)` | `oklch(0.1418 0.0229 268.45)` | Dropdown, tooltip |
| `--primary` | `oklch(0.2236 0.1469 265.82)` | `oklch(0.3820 0.1967 265.29)` | **Accent utama (indigo biru)** |
| `--primary-foreground` | `oklch(1 0 0)` | `oklch(1 0 0)` | Teks pada primary |
| `--secondary` | `oklch(0.9387 0.0262 264.44)` | `oklch(0.2108 0.0426 270.37)` | Permukaan sekunder |
| `--secondary-foreground` | `oklch(0.4691 0.2225 262.48)` | `oklch(0.9924 0.0028 308.43)` | Teks pada secondary |
| `--muted` | `oklch(0.9518 0.0057 308.39)` | `oklch(0.1797 0.0376 272.64)` | Background redup |
| `--muted-foreground` | `oklch(0.4882 0.0203 308.00)` | `oklch(0.6878 0.0218 285.81)` | Teks sekunder/caption |
| `--accent` | `oklch(0.9356 0.0312 279.86)` | `oklch(0.2553 0.0657 274.67)` | Hover/aktif lembut |
| `--accent-foreground` | `oklch(0.4691 0.2225 262.48)` | `oklch(0.9924 0.0028 308.43)` | Teks pada accent |
| `--destructive` | `oklch(0.5858 0.2220 17.58)` | `oklch(0.4038 0.1343 13.30)` | Error, hapus, bahaya |
| `--border` | `oklch(0.9160 0.0120 313.21)` | `oklch(0.2445 0.0736 280.59)` | Garis batas |
| `--input` | `oklch(0.9160 0.0120 313.21)` | `oklch(0.2603 0.0625 272.37)` | Field input |
| `--ring` | `oklch(0.6219 0.2036 262.15)` | `oklch(0.3395 0.1557 273.08)` | Focus ring |

### Chart palette (hue 262 -> 322, kohesif dengan primary)

| Token | Light | Dark |
|-------|-------|------|
| `--chart-1` | indigo `oklch(0.4691 0.2225 262.48)` | `oklch(0.6199 0.1907 271.40)` |
| `--chart-2` | ungu `oklch(0.6056 0.2189 292.72)` | `oklch(0.7599 0.1368 61.06)` |
| `--chart-3` | magenta `oklch(0.6668 0.2591 322.15)` | `oklch(0.6450 0.2154 16.44)` |
| `--chart-4` | merah `oklch(0.6450 0.2154 16.44)` | `oklch(0.7049 0.1867 47.60)` |
| `--chart-5` | amber `oklch(0.7049 0.1867 47.60)` | `oklch(0.3395 0.1557 273.08)` |

### Aturan warna (Color Consistency Lock)

- **Satu accent = indigo biru (`--primary`)**, dikunci di seluruh app.
- Palette indigo ini adalah brand sah -> override **LILA RULE** (skill 4.2).
  Alasannya: sudah didefinisikan di globals.css, bukan default AI-purple slop.
- **DILARANG** menambah: AI-purple glow, gradient neon, accent warna lain
  di tengah halaman (mis. tombol teal muncul di section 7).
- Netral satu keluarga (zinc/stone hue ~308-314). Jangan campur warm + cool gray.
- Tidak ada `#000000` atau `#ffffff` murni. Semua via token oklch di atas.

## 3. Radius (Shape Consistency Lock)

| Token | Nilai | Pakai untuk |
|-------|-------|-------------|
| `--radius` | `1.25rem` (20px) | Base |
| `--radius-sm` | 12px | Input kecil, badge |
| `--radius-md` | 16px | Button default, input |
| `--radius-lg` | 20px | Card, panel |
| `--radius-xl` | 28px | Hero/section besar |
| `--radius-2xl` | 36px | - |
| `--radius-3xl` | 44px | - |
| `--radius-4xl` | 52px | - |

- **Satu sistem radius: soft (20px base).** Diterapkan konsisten.
- Button/input/card semuanya soft-rounded via token, bukan campuran.

## 4. Shadow

Soft, tinted, offset-y ~4px. Bukan pure-black drop shadow.

| Token | Light (offset-y 4px) | Dark (offset-y 10px) |
|-------|----------------------|----------------------|
| `--shadow-2xs` / `--shadow-xs` | `0 4px 10px 0 hsl(0 0 0 / 0.05)` | `0 10px 20px 0 hsl(0 0 0 / 0.25)` |
| `--shadow-sm` | `0 4px 10px 0 hsl(0 0 0 / 0.10), 0 1px 2px -1px ...` | `0 10px 20px 0 hsl(0 0 0 / 0.50), ...` |
| `--shadow-md` | `0 4px 10px 0 ... 0.10, 0 2px 4px -1px ...` | `0 10px 20px 0 ... 0.50, ...` |
| `--shadow-lg` | `0 4px 10px 0 ... 0.10, 0 4px 6px -1px ...` | `0 10px 20px 0 ... 0.50, ...` |
| `--shadow-xl` | `0 4px 10px 0 ... 0.10, 0 8px 10px -1px ...` | `0 10px 20px 0 ... 0.50, ...` |
| `--shadow-2xl` | `0 4px 10px 0 hsl(0 0 0 / 0.25)` | `0 10px 20px 0 hsl(0 0 0 / 1.25)` |

## 5. Aturan Pakai Komponen

| Kebutuhan | Pakai |
|-----------|-------|
| Permukaan terangkat | `Card` (ring, bukan shadow tebal) |
| Tombol aksi utama | `Button variant="default"` (bg-primary). Maks 1 per area. |
| Tombol sekunder | `Button variant="outline"` atau `secondary` |
| Tombol semata-mata ikon | `Button size="icon"` |
| Hapus/bahaya | `Button variant="destructive"` (bg-destructive/10, bukan solid merah) |
| Angka, kode, metrik | `font-mono` selalu |
| Status (berhasil/gagal) | Badge dengan warna token, bukan dot dekoratif acak |

### Contrast (wajib WCAG AA)
- Body teks: min 4.5:1.
- Large text (>=18px): min 3:1.
- Audit setiap CTA: teks terbaca di atas background.
- `text-muted-foreground` di atas `--background`: OK untuk caption, BUKAN untuk
  instruksi penting.

## 6. Icon

- **Satu keluarga:** `@hugeicons/react` + `@hugeicons/core-free-icons`.
- Import: `import { HugeiconsIcon } from "@hugeicons/react"`
  lalu `import { NamaIcon } from "@hugeicons/core-free-icons"`.
- `strokeWidth` distandarkan: `2`.
- **Dilarang** hand-roll SVG icon path.
- **Dilarang** campur keluarga icon (mis. tambah lucide).

### Icon yang sering dipakai (sudah diverifikasi ada)

| Konsep | Icon |
|--------|------|
| Database | `Database02Icon` |
| Sambungkan | `ConnectIcon` |
| AI / otak | `AiBrain02Icon` |
| Generator | `BubbleChatSpark01Icon` |
| Kode/sumber | `SourceCodeIcon` |
| Tambah | `Add01Icon` |
| Salin | `Copy01Icon` |
| Simpan | `FloppyDiskIcon` |
| Jalankan | `PlayCircleIcon` |
| Pengaturan | `Settings02Icon` |
| Kunci/api-key | `LockKeyIcon` |
| Timeout/waktu | `TimeQuarterPassIcon` |
| Batal/error | `Cancel01Icon` |
| Panah kanan | `ArrowRight01Icon` |

## 7. Motion (MOTION_INTENSITY 3)

- Hanya `transform` dan `opacity` yang dianimasi.
- Easing default: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Feedback wajib:
  - `:active` -> `-translate-y-px` atau `scale-[0.98]` (sudah di Button).
  - Loading -> skeleton sesuai bentuk akhir, bukan spinner generik.
- `prefers-reduced-motion`: semua animasi collapse ke statis.
- **Dilarang:** `window.addEventListener('scroll')`, parallax, scroll-hijack
  di UI produk (ranah landing, bukan tool).

## 8. Layout Dasar

- Container: `max-w-[1400px] mx-auto` atau `max-w-7xl`.
- Viewport: `min-h-dvh`, BUKAN `h-screen`.
- Grid > flex-math. `grid grid-cols-1 md:grid-cols-N gap-6`.
- Breakpoints standar: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`.
- Mobile collapse eksplisit per section (`w-full px-4` di bawah `md`).
- Sidebar (shadcn): `16rem` ekspanded, `3rem` collapsed, `18rem` mobile.

## 9. Page Theme Lock

- **Satu tema per halaman.** Tidak ada section yang membalik tema di tengah.
- Default: `system` (ikuti `prefers-color-scheme`), toggle manual opsional.
- Dark mode parity: hierarki di light harus tetap muncul di dark.
